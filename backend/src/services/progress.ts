import { and, desc, eq, isNotNull, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { courses, questionAttempts, questions, savedQuestions, tests, topics } from '../db/schema'
import { addDays, bestStreak, currentStreak, dayIn, weekStart } from '../lib/time'
import type { AuthUser } from './sessions'

// Distinct days (in the user's timezone) with at least one answered question
export const activeDays = async (userId : string, timezone : string, sinceDays = 400) => {
    const rows = await db.selectDistinct({
        day : sql<string>`to_char(${questionAttempts.createdAt} at time zone ${timezone}, 'YYYY-MM-DD')`,
    }).from(questionAttempts)
        .where(and(eq(questionAttempts.userId, userId), sql`${questionAttempts.createdAt} > now() - make_interval(days => ${sinceDays})`))
    return rows.map((row) => row.day).sort()
}

export const streakSummary = async (user : Pick<AuthUser, 'id' | 'timezone'>) => {
    const days = await activeDays(user.id, user.timezone)
    const set = new Set(days)
    const today = dayIn(user.timezone)
    const monday = weekStart(today)
    return {
        current : currentStreak(set, today),
        best : bestStreak(days),
        activeToday : set.has(today),
        today,
        week : Array.from({ length : 7 }, (_, index) => {
            const day = addDays(monday, index)
            return { day, active : set.has(day), isToday : day === today, future : day > today }
        }),
        days,
    }
}

export const courseProgress = async (userId : string) => {
    const rows = await db.execute<{ course_id : string, total : number, answered : number, correct : number }>(sql`
        select c.id as course_id,
            (select count(*)::int from ${questions} q where q.course_id = c.id and q.deleted_at is null) as total,
            count(distinct a.question_id)::int as answered,
            count(distinct a.question_id) filter (where a.correct)::int as correct
        from ${courses} c
        left join ${questionAttempts} a on a.user_id = ${userId}
            and a.question_id in (select id from ${questions} where course_id = c.id and deleted_at is null)
        group by c.id
    `)
    return new Map(rows.rows.map((row) => [row.course_id, {
        total : row.total,
        answered : row.answered,
        progress : row.total ? Math.round(row.answered / row.total * 100) : 0,
    }]))
}

export const stats = async (user : AuthUser) => {
    const [[totals], [testCount], streak] = await Promise.all([
        db.select({
            solved : sql<number>`count(distinct ${questionAttempts.questionId})::int`,
            answers : sql<number>`count(*)::int`,
            correct : sql<number>`count(*) filter (where ${questionAttempts.correct})::int`,
        }).from(questionAttempts).where(eq(questionAttempts.userId, user.id)),
        db.select({ count : sql<number>`count(*)::int` }).from(tests)
            .where(and(eq(tests.userId, user.id), isNotNull(tests.submittedAt))),
        streakSummary(user),
    ])
    return {
        solved : totals.solved,
        answers : totals.answers,
        accuracy : totals.answers ? Math.round(totals.correct / totals.answers * 100) : 0,
        tests : testCount.count,
        streak : streak.current,
        bestStreak : streak.best,
        activeToday : streak.activeToday,
    }
}

// Topics the learner gets wrong most, with at least 3 answers
export const weakTopics = async (userId : string, limit = 5) => {
    const rows = await db.select({
        courseID : questions.courseId,
        topic : sql<string>`coalesce(${topics.name}, 'General')`,
        answers : sql<number>`count(*)::int`,
        correct : sql<number>`count(*) filter (where ${questionAttempts.correct})::int`,
    }).from(questionAttempts)
        .innerJoin(questions, eq(questions.id, questionAttempts.questionId))
        .leftJoin(topics, eq(topics.id, questions.topicId))
        .where(eq(questionAttempts.userId, userId))
        .groupBy(questions.courseId, sql`coalesce(${topics.name}, 'General')`)
        .having(sql`count(*) >= 3`)
        .orderBy(sql`count(*) filter (where ${questionAttempts.correct})::float / count(*)`, desc(sql`count(*)`))
        .limit(limit)
    return rows.map((row) => ({ ...row, accuracy : Math.round(row.correct / row.answers * 100) }))
}

// Everything the frontend's local progress store holds, so it can hydrate on login
export const fullProgress = async (user : AuthUser) => {
    const [latest, saved, history, streak] = await Promise.all([
        db.execute<{ question_id : string, choice : number, correct : boolean, course_id : string, topic : string, at : Date }>(sql`
            select distinct on (a.question_id) a.question_id, a.choice, a.correct, q.course_id,
                coalesce(t.name, 'General') as topic, a.created_at as at
            from ${questionAttempts} a
            join ${questions} q on q.id = a.question_id
            left join ${topics} t on t.id = q.topic_id
            where a.user_id = ${user.id}
            order by a.question_id, a.created_at desc
        `),
        db.select({ questionId : savedQuestions.questionId, at : savedQuestions.createdAt }).from(savedQuestions)
            .where(eq(savedQuestions.userId, user.id)),
        testHistory(user.id, 100),
        streakSummary(user),
    ])
    return {
        attempts : Object.fromEntries(latest.rows.map((row) => [row.question_id, {
            choice : row.choice, correct : row.correct, courseID : row.course_id, topic : row.topic, at : new Date(row.at).getTime(),
        }])),
        saved : Object.fromEntries(saved.map((row) => [row.questionId, row.at.getTime()])),
        tests : history,
        activeDays : streak.days,
    }
}

export const testHistory = async (userId : string, limit = 20, courseId? : string) => {
    const rows = await db.select({
        id : tests.id,
        courseID : tests.courseId,
        courseCode : courses.code,
        courseName : courses.name,
        courseColor : courses.color,
        mode : tests.mode,
        title : tests.title,
        score : tests.score,
        total : tests.total,
        seconds : tests.durationSeconds,
        submittedAt : tests.submittedAt,
        answers : tests.answers,
        questionIds : tests.questionIds,
    }).from(tests)
        .innerJoin(courses, eq(courses.id, tests.courseId))
        .where(and(eq(tests.userId, userId), isNotNull(tests.submittedAt), courseId ? eq(tests.courseId, courseId) : undefined))
        .orderBy(desc(tests.submittedAt))
        .limit(limit)

    // Which questions were missed, for "review mistakes"
    const missedIds = await missedByTest(rows.map((row) => row.id))
    return rows.map(({ answers, questionIds, submittedAt, ...row }) => ({
        ...row,
        score : row.score ?? 0,
        seconds : row.seconds ?? 0,
        minutes : Math.max(1, Math.round((row.seconds ?? 0) / 60)),
        at : submittedAt!.getTime(),
        submittedAt,
        missed : missedIds.get(row.id) ?? questionIds.filter((id) => !(answers && id in answers)),
    }))
}

const missedByTest = async (testIds : string[]) => {
    const result = new Map<string, string[]>()
    if (testIds.length === 0) return result
    const rows = await db.execute<{ id : string, missed : string[] }>(sql`
        select t.id, coalesce(array_agg(q::text) filter (where q is not null and (
            not (t.answers ? q::text)
            or not exists (select 1 from ${questionAttempts} a where a.test_id = t.id and a.question_id = q and a.correct)
        )), '{}') as missed
        from ${tests} t, unnest(t.question_ids) as q
        where t.id in (${sql.join(testIds.map((id) => sql`${id}::uuid`), sql`, `)})
        group by t.id
    `)
    rows.rows.forEach((row) => result.set(row.id, row.missed))
    return result
}

