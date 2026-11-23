import { Router } from 'express'
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { questionAttempts, questions, savedQuestions, users } from '../db/schema'
import { hashPassword } from '../lib/crypto'
import { badRequest } from '../lib/errors'
import { isValidTimezone } from '../lib/time'
import { parse } from '../lib/validate'
import { currentUser, requireAuth } from '../middleware/auth'
import { fullProgress, stats, streakSummary, testHistory, weakTopics } from '../services/progress'
import { getLearnerQuestionsByIds } from '../services/questions'
import { findCourse } from '../services/questions'
import { clearSessionCookie, deleteUserSessions } from '../services/sessions'
import { getUser, presentSessionUser, presentUser } from '../services/users'
import { requireCurrentPassword } from './auth'

export const meRouter = Router()
meRouter.use(requireAuth)

meRouter.get('/', async (req, res) => {
    const user = currentUser(req)
    const [row, summary] = await Promise.all([getUser(user.id), stats(user)])
    res.json({ user : await presentSessionUser(row), stats : summary })
})

const optionalText = (max : number) => z.string().trim().max(max).nullable().optional()

const profileSchema = z.object({
    firstName : z.string().trim().min(1).max(80).optional(),
    lastName : z.string().trim().max(80).optional(),
    // Convenience for a single "Full name" field
    name : z.string().trim().min(1).max(160).optional(),
    gender : optionalText(30),
    program : optionalText(120),
    school : optionalText(120),
    level : optionalText(40),
    timezone : z.string().refine(isValidTimezone, 'is not a valid IANA timezone').optional(),
})

meRouter.patch('/', async (req, res) => {
    const { name, ...input } = parse(profileSchema, req.body)
    if (name) {
        const [first, ...rest] = name.split(/\s+/)
        input.firstName ??= first
        input.lastName ??= rest.join(' ')
    }
    if (Object.keys(input).length === 0) throw badRequest('Nothing to update')
    const [row] = await db.update(users).set(input).where(eq(users.id, currentUser(req).id)).returning()
    res.json({ user : presentUser(row) })
})

const prefsSchema = z.object({
    dailyReminder : z.boolean().optional(),
    replies : z.boolean().optional(),
    weeklyReport : z.boolean().optional(),
}).strict()

meRouter.patch('/prefs', async (req, res) => {
    const input = parse(prefsSchema, req.body)
    const [row] = await db.update(users)
        .set({ prefs : sql`${users.prefs} || ${JSON.stringify(input)}::jsonb` })
        .where(eq(users.id, currentUser(req).id)).returning()
    res.json({ prefs : row.prefs })
})

meRouter.post('/password', async (req, res) => {
    const input = parse(z.object({ currentPassword : z.string().min(1), newPassword : z.string().min(8).max(200) }), req.body)
    const user = currentUser(req)
    await requireCurrentPassword(user.id, input.currentPassword)
    await db.update(users).set({ passwordHash : await hashPassword(input.newPassword) }).where(eq(users.id, user.id))
    // Sign out other devices, keep this one
    await db.execute(sql`delete from sessions where user_id = ${user.id} and id <> ${req.sessionId!}`)
    res.status(204).end()
})

meRouter.delete('/', async (req, res) => {
    const input = parse(z.object({ password : z.string().min(1) }), req.body)
    const user = currentUser(req)
    await requireCurrentPassword(user.id, input.password)
    if (user.role === 'admin') {
        const [{ count }] = await db.select({ count : sql<number>`count(*)::int` }).from(users)
            .where(and(eq(users.role, 'admin'), eq(users.status, 'active')))
        if (count <= 1) throw badRequest('You are the only admin. Make someone else an admin first.')
    }
    await deleteUserSessions(user.id)
    await db.delete(users).where(eq(users.id, user.id))
    clearSessionCookie(res)
    res.status(204).end()
})

meRouter.get('/stats', async (req, res) => {
    res.json(await stats(currentUser(req)))
})

meRouter.get('/streak', async (req, res) => {
    const { days, ...summary } = await streakSummary(currentUser(req))
    res.json(summary)
})

meRouter.get('/progress', async (req, res) => {
    res.json(await fullProgress(currentUser(req)))
})

meRouter.get('/weak-topics', async (req, res) => {
    res.json({ items : await weakTopics(currentUser(req).id) })
})

meRouter.get('/tests', async (req, res) => {
    const query = parse(z.object({
        limit : z.coerce.number().int().min(1).max(100).default(20),
        courseID : z.string().optional(),
    }), req.query)
    const courseId = query.courseID ? (await findCourse(query.courseID)).id : undefined
    res.json({ items : await testHistory(currentUser(req).id, query.limit, courseId) })
})

meRouter.get('/saved', async (req, res) => {
    const user = currentUser(req)
    const rows = await db.select({ id : savedQuestions.questionId }).from(savedQuestions)
        .innerJoin(questions, eq(questions.id, savedQuestions.questionId))
        .where(and(eq(savedQuestions.userId, user.id), isNull(questions.deletedAt)))
        .orderBy(desc(savedQuestions.createdAt)).limit(500)
    res.json({ items : await getLearnerQuestionsByIds(rows.map((row) => row.id), user.id) })
})

// "Reset course": forget practice answers (not test answers) for one course
meRouter.delete('/attempts', async (req, res) => {
    const { courseID } = parse(z.object({ courseID : z.string().min(1) }), req.query)
    const course = await findCourse(courseID)
    const user = currentUser(req)
    await db.delete(questionAttempts).where(and(
        eq(questionAttempts.userId, user.id),
        isNull(questionAttempts.testId),
        inArray(questionAttempts.questionId, db.select({ id : questions.id }).from(questions).where(eq(questions.courseId, course.id))),
    ))
    res.status(204).end()
})
