import { eq, sql } from 'drizzle-orm'
import { config } from '../config'
import { hashPassword } from '../lib/crypto'
import { addDays, dayIn } from '../lib/time'
import { CHALLENGE_TIMEZONE, getOrCreateChallenge } from '../services/tests'
import { db, pool } from './client'
import * as t from './schema'
import * as data from './seed-data'

// Seeds an empty database with starter content and demo accounts.
// Run with --force to seed even when courses already exist.
const seed = async () => {
    const [{ count }] = await db.select({ count : sql<number>`count(*)::int` }).from(t.courses)
    if (count > 0 && !process.argv.includes('--force')) {
        console.log('Database already has content; skipping seed (use --force to seed anyway).')
        return
    }
    if (config.isProduction && !process.env.SEED_PASSWORD) {
        throw new Error('Set SEED_PASSWORD to seed a production database')
    }
    const password = process.env.SEED_PASSWORD ?? 'preproom123'
    const passwordHash = await hashPassword(password)

    const institutionIds = new Map<string, string>()
    for (const item of data.institutions) {
        const [row] = await db.insert(t.institutions).values(item).onConflictDoUpdate({ target : t.institutions.shortName, set : { name : item.name } }).returning()
        institutionIds.set(item.shortName, row.id)
    }

    const facultyIds = new Map<string, string>()
    for (const name of data.faculties) {
        const [row] = await db.insert(t.faculties).values({ name }).onConflictDoUpdate({ target : t.faculties.name, set : { name } }).returning()
        facultyIds.set(name, row.id)
    }

    const programIds = new Map<string, string>()
    for (const program of data.programs) {
        await db.insert(t.programs).values({ name : program.name, facultyId : facultyIds.get(program.faculty)! }).onConflictDoNothing()
        const [row] = await db.select().from(t.programs).where(eq(t.programs.name, program.name)).limit(1)
        programIds.set(program.name, row.id)
    }

    const courseIds = new Map<string, string>()
    for (const course of data.courses) {
        const [row] = await db.insert(t.courses).values({
            slug : course.slug, code : course.code, name : course.name, color : course.color, programId : programIds.get(course.program),
        }).onConflictDoUpdate({ target : t.courses.slug, set : { name : course.name } }).returning()
        courseIds.set(course.slug, row.id)
    }

    const userIds = new Map<string, string>()
    for (const person of data.people) {
        const [row] = await db.insert(t.users).values({
            email : data.emailFor(person.key),
            firstName : person.firstName,
            lastName : person.lastName,
            role : person.role,
            status : person.status,
            color : person.color,
            school : person.school,
            program : person.program,
            level : person.level,
            passwordHash : person.status === 'active' ? passwordHash : null,
            lastActiveAt : person.status === 'active' ? new Date() : null,
        }).onConflictDoNothing().returning()
        const id = row?.id ?? (await db.select().from(t.users).where(sql`lower(${t.users.email}) = ${data.emailFor(person.key)}`))[0].id
        userIds.set(person.key, id)
        for (const course of person.courses ?? []) {
            await db.insert(t.staffCourses).values({ userId : id, courseId : courseIds.get(course)! }).onConflictDoNothing()
        }
    }

    const questionIds : string[] = []
    const now = Date.now()
    for (const [index, question] of data.questions.entries()) {
        const courseId = courseIds.get(question.course)!
        await db.insert(t.topics).values({ courseId, name : question.topic }).onConflictDoNothing()
        const [topic] = await db.select().from(t.topics).where(sql`${t.topics.courseId} = ${courseId} and ${t.topics.name} = ${question.topic}`)
        // Spread creation over the last two weeks so the admin activity chart has shape
        const createdAt = new Date(now - ((index * 7919) % 14) * 86400000 - index * 3600000)
        const [row] = await db.insert(t.questions).values({
            courseId,
            topicId : topic.id,
            institutionId : institutionIds.get(question.institution),
            difficulty : question.difficulty,
            year : question.year,
            prompt : question.question,
            options : question.options,
            answerIndex : question.answer,
            explanation : question.explanation,
            authorId : userIds.get(question.author),
            createdAt,
            updatedAt : createdAt,
        }).returning()
        questionIds.push(row.id)
    }

    // Demo activity: past daily challenges played by the learners, for streaks and the leaderboard
    const today = dayIn(CHALLENGE_TIMEZONE)
    const learners = data.people.filter((person) => person.role === 'student' && person.key !== 'student')
    for (let back = 4; back >= 1; back -= 1) {
        const day = addDays(today, -back)
        const challenge = await getOrCreateChallenge(day)
        if (!challenge) continue
        const keys = await db.select({ id : t.questions.id, answer : t.questions.answerIndex }).from(t.questions)
            .where(sql`${t.questions.id} in (${sql.join(challenge.questionIds.map((id) => sql`${id}::uuid`), sql`, `)})`)
        const players = [...learners, data.people.find((person) => person.key === 'student')!]
        for (const [rank, person] of players.entries()) {
            const userId = userIds.get(person.key)!
            const score = Math.max(1, challenge.questionIds.length - ((rank + back) % 3))
            const startedAt = new Date(`${day}T${String(8 + rank).padStart(2, '0')}:00:00Z`)
            const duration = 180 + rank * 45
            const answers = Object.fromEntries(keys.map((key, index) => [key.id, index < score ? key.answer : (key.answer + 1) % 4]))
            const [test] = await db.insert(t.tests).values({
                userId, courseId : challenge.courseId, challengeId : challenge.id, mode : 'challenge', title : 'Daily challenge',
                timeLimitSeconds : 600, questionIds : challenge.questionIds, total : challenge.questionIds.length,
                answers, score, durationSeconds : duration, startedAt, submittedAt : new Date(startedAt.getTime() + duration * 1000),
            }).onConflictDoNothing().returning()
            if (!test) continue
            await db.insert(t.questionAttempts).values(keys.map((key, index) => ({
                userId, questionId : key.id, testId : test.id, choice : answers[key.id], correct : index < score,
                createdAt : new Date(startedAt.getTime() + 60_000 * (index + 1)),
            })))
        }
    }

    // Open reports for the moderation queue
    const byPrompt = async (start : string) => (await db.select({ id : t.questions.id }).from(t.questions)
        .where(sql`${t.questions.prompt} like ${`${start}%`}`).limit(1))[0]?.id
    const flagSeeds = [
        { prompt : 'After inserting into an AVL', reporter : 'nana.b', issue : 'Wrong answer' as const, comment : 'I think a single right rotation is enough here — the lecture notes say so.', suggestedAnswer : 0 },
        { prompt : 'A ball is thrown vertically', reporter : 'kofi.o', issue : 'Unclear question' as const, comment : 'Should we ignore air resistance? The question does not say.' },
        { prompt : 'Which traversal visits', reporter : 'esi.m', issue : 'Typo' as const, comment : 'Option D should be "Level-order traversal" for consistency.' },
        { prompt : 'Markovnikov', reporter : 'yaw.a', issue : 'Missing explanation' as const, comment : 'Would be great to explain why the secondary carbocation is more stable.' },
    ]
    for (const flag of flagSeeds) {
        const questionId = await byPrompt(flag.prompt)
        if (!questionId) continue
        await db.insert(t.flags).values({
            questionId, reporterId : userIds.get(flag.reporter), issue : flag.issue, comment : flag.comment, suggestedAnswer : flag.suggestedAnswer,
        })
    }

    // A short discussion thread
    const preOrder = await byPrompt('Which traversal visits')
    if (preOrder) {
        await db.insert(t.comments).values([
            { questionId : preOrder, userId : userIds.get('esi.m')!, body : 'Drawing the tree and tracing it by hand helped me a lot here.' },
            { questionId : preOrder, userId : userIds.get('kofi.o')!, body : 'Pre = root first. In-order puts the root between the subtrees.' },
        ])
    }

    console.log(`Seeded ${data.courses.length} courses, ${questionIds.length} questions and ${data.people.length} people.`)
    console.log(`Demo logins (password "${password}"):`)
    console.log(`  admin    ${data.emailFor('admin')}`)
    console.log(`  learner  ${data.emailFor('student')}`)
    console.log(`  staff    ${data.emailFor('ama.owusu')} (supervisor), ${data.emailFor('efua.asante')} (moderator)`)
}

seed()
    .catch((error) => { console.error(error); process.exitCode = 1 })
    .finally(() => pool.end())
