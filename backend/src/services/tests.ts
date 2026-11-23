import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { db, outer } from '../db/client'
import {
    courses, dailyChallenges, questionAttempts, questions, tests, topics, users, type Difficulty, type TestMode,
} from '../db/schema'
import { HttpError, badRequest, conflict, forbidden, notFound } from '../lib/errors'
import { dayIn } from '../lib/time'
import { notify } from './notifications'
import { getLearnerQuestionsByIds, withoutAnswer, type LearnerQuestion } from './questions'
import { streakSummary } from './progress'
import type { AuthUser } from './sessions'

export const CHALLENGE_TIMEZONE = 'Africa/Accra'
export const CHALLENGE_SIZE = 5
export const CHALLENGE_MINUTES = 10
// Submissions are accepted this long after the clock runs out (network, slow devices)
const GRACE_SECONDS = 30

export interface TestConfig {
    courseId : string
    mode : Exclude<TestMode, 'challenge'>
    count : number
    minutes : number
    difficulty : 'Mixed' | Difficulty
    instantFeedback : boolean
    year? : number
    topics? : string[]
}

type TestRow = typeof tests.$inferSelect

const titleFor = (config : TestConfig, topicNames : string[]) => {
    if (config.mode === 'paper') return `${config.year} past paper`
    if (topicNames.length === 1) return topicNames[0]
    if (topicNames.length === 2) return `${topicNames[0]} & ${topicNames[1]}`
    return config.difficulty === 'Mixed' ? 'Mixed practice' : `${config.difficulty} practice`
}

const pickPracticeQuestions = async (userId : string, config : TestConfig) => {
    const conditions = [eq(questions.courseId, config.courseId), isNull(questions.deletedAt)]
    if (config.difficulty !== 'Mixed') conditions.push(eq(questions.difficulty, config.difficulty))
    if (config.topics?.length) conditions.push(inArray(questions.topicId, config.topics))
    // Unseen questions first, then the ones answered wrong, then the rest; random inside each group
    const rows = await db.select({ id : questions.id }).from(questions)
        .where(and(...conditions))
        .orderBy(
            sql`(select case when bool_or(a.correct) then 2 when count(*) > 0 then 1 else 0 end
                 from ${questionAttempts} a where a.question_id = ${outer(questions.id)} and a.user_id = ${userId})`,
            sql`random()`,
        )
        .limit(config.count)
    return rows.map((row) => row.id)
}

const pickPaperQuestions = async (config : TestConfig) => {
    const rows = await db.select({ id : questions.id }).from(questions)
        .where(and(eq(questions.courseId, config.courseId), eq(questions.year, config.year!), isNull(questions.deletedAt)))
        .orderBy(asc(questions.createdAt), asc(questions.id))
        .limit(100)
    return rows.map((row) => row.id)
}

export const createTest = async (user : AuthUser, config : TestConfig) => {
    if (config.mode === 'paper' && !config.year) {
        const [latest] = await db.select({ year : sql<number>`max(${questions.year})` }).from(questions)
            .where(and(eq(questions.courseId, config.courseId), isNull(questions.deletedAt)))
        if (!latest?.year) throw new HttpError(422, 'no_questions', 'This course has no past papers yet')
        config = { ...config, year : latest.year }
    }

    const questionIds = config.mode === 'paper' ? await pickPaperQuestions(config) : await pickPracticeQuestions(user.id, config)
    if (questionIds.length === 0) {
        throw new HttpError(422, 'no_questions', config.difficulty === 'Mixed'
            ? 'There are no questions for this course yet'
            : `There are no ${config.difficulty} questions for this course yet`)
    }

    const topicNames = config.topics?.length
        ? (await db.select({ name : topics.name }).from(topics).where(inArray(topics.id, config.topics))).map((row) => row.name)
        : []

    const [test] = await db.insert(tests).values({
        userId : user.id,
        courseId : config.courseId,
        mode : config.mode,
        title : titleFor(config, topicNames),
        difficulty : config.difficulty,
        paperYear : config.mode === 'paper' ? config.year : null,
        timeLimitSeconds : config.minutes * 60,
        instantFeedback : config.instantFeedback,
        questionIds,
        total : questionIds.length,
    }).returning()
    return presentTest(test, user)
}

export const getOwnTest = async (user : AuthUser, id : string) => {
    const [test] = await db.select().from(tests).where(eq(tests.id, id)).limit(1)
    if (!test) throw notFound('Test')
    if (test.userId !== user.id) throw forbidden()
    return test
}

const deadline = (test : TestRow) => new Date(test.startedAt.getTime() + test.timeLimitSeconds * 1000)

// An unsubmitted test as the session screen needs it. Answers are only sent
// when the learner asked for instant feedback, and never for challenges.
export const presentTest = async (test : TestRow, user : AuthUser) => {
    if (test.submittedAt) return presentResult(test, user)
    const revealAnswers = test.instantFeedback && test.mode !== 'challenge'
    const list = await getLearnerQuestionsByIds(test.questionIds, user.id)
    const [course] = await db.select().from(courses).where(eq(courses.id, test.courseId))
    return {
        id : test.id,
        status : 'in_progress' as const,
        courseID : test.courseId,
        course : { id : course.id, slug : course.slug, code : course.code, name : course.name, color : course.color },
        mode : test.mode,
        title : test.title,
        difficulty : test.difficulty,
        year : test.paperYear,
        instantFeedback : test.instantFeedback,
        timeLimitSeconds : test.timeLimitSeconds,
        startedAt : test.startedAt,
        endsAt : deadline(test),
        remainingSeconds : Math.max(0, Math.round((deadline(test).getTime() - Date.now()) / 1000)),
        total : test.total,
        answers : test.answers ?? {},
        questions : revealAnswers ? list : list.map(withoutAnswer),
    }
}

export const saveProgress = async (user : AuthUser, id : string, answers : Record<string, number>) => {
    const test = await getOwnTest(user, id)
    if (test.submittedAt) throw conflict('This test has already been submitted')
    const clean = sanitizeAnswers(test, answers)
    await db.update(tests).set({ answers : clean }).where(eq(tests.id, id))
    return { answers : clean }
}

const sanitizeAnswers = (test : TestRow, answers : Record<string, number>) => {
    const allowed = new Set(test.questionIds)
    const unknown = Object.keys(answers).filter((questionId) => !allowed.has(questionId))
    if (unknown.length) throw badRequest('Some answers are for questions that are not in this test', { questionIDs : unknown })
    return Object.fromEntries(Object.entries(answers).filter(([, choice]) => Number.isInteger(choice) && choice >= 0))
}

export const submitTest = async (user : AuthUser, id : string, answers : Record<string, number>) => {
    const test = await getOwnTest(user, id)
    if (test.submittedAt) return presentResult(test, user)

    const clean = sanitizeAnswers(test, answers)
    const keys = await db.select({ id : questions.id, answer : questions.answerIndex, options : questions.options })
        .from(questions).where(inArray(questions.id, test.questionIds))
    const byId = new Map(keys.map((key) => [key.id, key]))

    const graded = Object.entries(clean)
        .filter(([questionId, choice]) => byId.has(questionId) && choice < byId.get(questionId)!.options.length)
        .map(([questionId, choice]) => ({ questionId, choice, correct : byId.get(questionId)!.answer === choice }))
    const score = graded.filter((item) => item.correct).length

    const elapsed = Math.round((Date.now() - test.startedAt.getTime()) / 1000)
    const durationSeconds = Math.max(1, Math.min(elapsed, test.timeLimitSeconds))
    const late = elapsed > test.timeLimitSeconds + GRACE_SECONDS

    const streakBefore = await streakSummary(user)

    const submitted = await db.transaction(async (tx) => {
        // Guard against double submits racing each other
        const [row] = await tx.update(tests)
            .set({ answers : clean, score, durationSeconds, submittedAt : new Date() })
            .where(and(eq(tests.id, id), isNull(tests.submittedAt)))
            .returning()
        if (!row) return null
        if (graded.length) {
            await tx.insert(questionAttempts).values(graded.map((item) => ({ userId : user.id, testId : id, ...item })))
        }
        return row
    })
    if (!submitted) return presentResult(await getOwnTest(user, id), user)

    const percent = Math.round(score / test.total * 100)
    await notify([user.id], {
        kind : 'result',
        title : test.mode === 'challenge' ? 'Daily challenge graded' : 'Test graded',
        body : `You scored ${score}/${test.total} (${percent}%) on ${test.title}.`,
        link : `/test/results/${id}`,
        dedupeKey : `result:${id}`,
    })
    await maybeNotifyStreak(user, streakBefore.current)

    return { ...(await presentResult(submitted, user)), late }
}

const STREAK_MILESTONES = [3, 5, 7, 14, 30, 50, 100, 200, 365]

export const maybeNotifyStreak = async (user : AuthUser, before : number) => {
    const after = (await streakSummary(user)).current
    const milestone = STREAK_MILESTONES.find((value) => before < value && after >= value)
    if (!milestone) return
    await notify([user.id], {
        kind : 'streak',
        title : `You reached a ${milestone}-day streak`,
        body : 'Keep practising every day to keep it going.',
        link : '/challenges',
        dedupeKey : `streak:${milestone}:${dayIn(user.timezone)}`,
    })
}

export const presentResult = async (test : TestRow, user : AuthUser) => {
    const list = await getLearnerQuestionsByIds(test.questionIds, user.id)
    const answers = test.answers ?? {}
    const reviewed = list.map((question) => {
        const chosen = answers[question.id]
        return {
            ...question,
            chosen : chosen ?? null,
            status : chosen === undefined ? 'skipped' as const : chosen === question.answer ? 'correct' as const : 'incorrect' as const,
        }
    })
    const byTopic = new Map<string, { topic : string, correct : number, total : number }>()
    reviewed.forEach((question) => {
        const entry = byTopic.get(question.topic) ?? { topic : question.topic, correct : 0, total : 0 }
        entry.total += 1
        if (question.status === 'correct') entry.correct += 1
        byTopic.set(question.topic, entry)
    })
    const correct = reviewed.filter((question) => question.status === 'correct').length
    const skipped = reviewed.filter((question) => question.status === 'skipped').length
    const [course] = await db.select().from(courses).where(eq(courses.id, test.courseId))

    return {
        id : test.id,
        status : 'submitted' as const,
        courseID : test.courseId,
        course : { id : course.id, slug : course.slug, code : course.code, name : course.name, color : course.color },
        mode : test.mode,
        title : test.title,
        difficulty : test.difficulty,
        year : test.paperYear,
        instantFeedback : test.instantFeedback,
        timeLimitSeconds : test.timeLimitSeconds,
        config : {
            courseID : test.courseId, mode : test.mode === 'practice' ? 'mcqs' : test.mode, count : test.total,
            minutes : Math.round(test.timeLimitSeconds / 60), difficulty : test.difficulty, instantFeedback : test.instantFeedback,
            year : test.paperYear,
        },
        startedAt : test.startedAt,
        submittedAt : test.submittedAt,
        score : test.score ?? correct,
        total : test.total,
        correct,
        incorrect : reviewed.length - correct - skipped,
        skipped,
        percent : test.total ? Math.round(correct / test.total * 100) : 0,
        seconds : test.durationSeconds ?? 0,
        answers,
        byTopic : Array.from(byTopic.values()).sort((a, b) => a.correct / a.total - b.correct / b.total),
        questions : reviewed as (LearnerQuestion & { chosen : number | null, status : 'correct' | 'incorrect' | 'skipped' })[],
        rank : test.challengeId ? await challengeRank(test.challengeId, user.id) : null,
    }
}

/* Daily challenge */

const titleCase = (text : string) => text.charAt(0).toUpperCase() + text.slice(1)

export const getOrCreateChallenge = async (day = dayIn(CHALLENGE_TIMEZONE)) => {
    const [existing] = await db.select().from(dailyChallenges).where(eq(dailyChallenges.day, day)).limit(1)
    if (existing) return existing

    // Rotate through courses that have enough questions, one per day
    const eligible = await db.select({ id : courses.id, name : courses.name }).from(courses)
        .where(sql`(select count(*) from ${questions} q where q.course_id = ${outer(courses.id)} and q.deleted_at is null) >= ${CHALLENGE_SIZE}`)
        .orderBy(asc(courses.createdAt), asc(courses.id))
    if (eligible.length === 0) return null
    const dayNumber = Math.floor(new Date(`${day}T00:00:00Z`).getTime() / 86400000)
    const course = eligible[dayNumber % eligible.length]

    // Deterministic shuffle per day, so concurrent first requests pick the same set
    const picked = await db.select({ id : questions.id, topic : topics.name }).from(questions)
        .leftJoin(topics, eq(topics.id, questions.topicId))
        .where(and(eq(questions.courseId, course.id), isNull(questions.deletedAt)))
        .orderBy(sql`md5(${questions.id}::text || ${day})`)
        .limit(CHALLENGE_SIZE)
    const topicNames = Array.from(new Set(picked.map((row) => row.topic).filter((name) : name is string => !!name))).slice(0, 3)
    const subtitle = topicNames.length
        ? topicNames.map((name) => name.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' and $1')
        : 'mixed questions'

    await db.insert(dailyChallenges).values({
        day,
        courseId : course.id,
        title : `${course.name}: ${subtitle}.`,
        questionIds : picked.map((row) => row.id),
    }).onConflictDoNothing()
    const [created] = await db.select().from(dailyChallenges).where(eq(dailyChallenges.day, day)).limit(1)
    return created
}

// Ranked by score, then time taken, then who finished first
export const challengeRank = async (challengeId : string, userId : string) => {
    const result = await db.execute<{ rank : number }>(sql`
        select rank from (
            select user_id, rank() over (order by score desc, duration_seconds asc, submitted_at asc)::int as rank
            from ${tests} where challenge_id = ${challengeId} and submitted_at is not null
        ) ranked where user_id = ${userId}
    `)
    return result.rows[0]?.rank ?? null
}

export const challengeToday = async (user? : AuthUser) => {
    const challenge = await getOrCreateChallenge()
    if (!challenge) return null
    const [course] = await db.select().from(courses).where(eq(courses.id, challenge.courseId))
    const [{ players }] = await db.select({ players : sql<number>`count(*)::int` }).from(tests)
        .where(and(eq(tests.challengeId, challenge.id), sql`${tests.submittedAt} is not null`))
    const recentPlayers = await db.select({ firstName : users.firstName, lastName : users.lastName, color : users.color })
        .from(tests).innerJoin(users, eq(users.id, tests.userId))
        .where(and(eq(tests.challengeId, challenge.id), sql`${tests.submittedAt} is not null`))
        .orderBy(sql`${tests.submittedAt} desc`).limit(4)

    let me = null
    if (user) {
        const [mine] = await db.select().from(tests).where(and(eq(tests.challengeId, challenge.id), eq(tests.userId, user.id))).limit(1)
        me = !mine ? { status : 'not_started' as const, testID : null, score : null, rank : null }
            : !mine.submittedAt ? { status : 'in_progress' as const, testID : mine.id, score : null, rank : null }
            : { status : 'done' as const, testID : mine.id, score : mine.score, rank : await challengeRank(challenge.id, user.id) }
    }

    return {
        id : challenge.id,
        day : challenge.day,
        title : titleCase(challenge.title),
        course : { id : course.id, slug : course.slug, code : course.code, name : course.name, color : course.color },
        questionCount : challenge.questionIds.length,
        minutes : CHALLENGE_MINUTES,
        players,
        recentPlayers : recentPlayers.map((player) => ({
            initials : `${player.firstName[0] ?? ''}${player.lastName[0] ?? ''}`.toUpperCase(),
            color : player.color,
        })),
        me,
    }
}

export const startChallenge = async (user : AuthUser) => {
    const challenge = await getOrCreateChallenge()
    if (!challenge) throw new HttpError(422, 'no_questions', 'There is no challenge today because no course has enough questions yet')
    const [existing] = await db.select().from(tests).where(and(eq(tests.challengeId, challenge.id), eq(tests.userId, user.id))).limit(1)
    if (existing?.submittedAt) throw new HttpError(409, 'already_played', 'You have already played today\'s challenge', { testID : existing.id })
    if (existing) return presentTest(existing, user)

    const [test] = await db.insert(tests).values({
        userId : user.id,
        courseId : challenge.courseId,
        challengeId : challenge.id,
        mode : 'challenge',
        title : 'Daily challenge',
        difficulty : 'Mixed',
        timeLimitSeconds : CHALLENGE_MINUTES * 60,
        instantFeedback : false,
        questionIds : challenge.questionIds,
        total : challenge.questionIds.length,
    }).onConflictDoNothing().returning()
    if (!test) return presentTest((await db.select().from(tests)
        .where(and(eq(tests.challengeId, challenge.id), eq(tests.userId, user.id))).limit(1))[0], user)
    return presentTest(test, user)
}

export const recentChallenges = async (user : AuthUser, limit = 4) => {
    const rows = await db.select({
        testID : tests.id,
        challengeID : tests.challengeId,
        day : dailyChallenges.day,
        score : tests.score,
        total : tests.total,
        courseID : courses.id,
        courseName : courses.name,
        courseCode : courses.code,
        courseColor : courses.color,
    }).from(tests)
        .innerJoin(dailyChallenges, eq(dailyChallenges.id, tests.challengeId))
        .innerJoin(courses, eq(courses.id, tests.courseId))
        .where(and(eq(tests.userId, user.id), sql`${tests.submittedAt} is not null`))
        .orderBy(sql`${dailyChallenges.day} desc`)
        .limit(limit)
    return Promise.all(rows.map(async (row) => ({ ...row, rank : await challengeRank(row.challengeID!, user.id) })))
}

// Points per challenge: 100 per correct answer plus up to 50 for speed
const pointsSql = sql<number>`sum(${tests.score} * 100 + case when ${tests.score} > 0
    then round(50 * greatest(0, 1 - ${tests.durationSeconds}::float / ${tests.timeLimitSeconds})) else 0 end)::int`

export const leaderboard = async (from : string, to : string, user? : AuthUser, limit = 10) => {
    const ranked = sql`
        select ${tests.userId} as user_id, ${pointsSql} as points,
            rank() over (order by ${pointsSql} desc)::int as rank
        from ${tests}
        join ${dailyChallenges} on ${dailyChallenges.id} = ${tests.challengeId}
        where ${tests.submittedAt} is not null and ${dailyChallenges.day} between ${from} and ${to}
        group by ${tests.userId}`
    const top = await db.execute<{ user_id : string, points : number, rank : number, first_name : string, last_name : string, school : string | null, color : string }>(sql`
        select r.*, u.first_name, u.last_name, u.school, u.color
        from (${ranked}) r join ${users} u on u.id = r.user_id
        order by r.rank, u.first_name limit ${limit}
    `)
    const entry = (row : { user_id : string, points : number, rank : number, first_name : string, last_name : string, school : string | null, color : string }) => ({
        userID : row.user_id,
        rank : row.rank,
        name : `${row.first_name} ${row.last_name ? `${row.last_name[0]}.` : ''}`.trim(),
        initials : `${row.first_name[0] ?? ''}${row.last_name[0] ?? ''}`.toUpperCase(),
        school : row.school,
        color : row.color,
        score : row.points,
        isMe : row.user_id === user?.id,
    })
    let me = null
    if (user) {
        const mine = await db.execute<{ user_id : string, points : number, rank : number }>(sql`
            select * from (${ranked}) r where r.user_id = ${user.id}
        `)
        me = mine.rows[0] ? { rank : mine.rows[0].rank, score : mine.rows[0].points } : { rank : null, score : 0 }
    }
    return { from, to, entries : top.rows.map(entry), me }
}
