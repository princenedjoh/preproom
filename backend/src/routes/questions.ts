import { Router } from 'express'
import { and, asc, eq, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { comments, flags, questionAttempts, savedQuestions, users } from '../db/schema'
import { initialsOf } from '../lib/colors'
import { badRequest, conflict, forbidden, notFound } from '../lib/errors'
import { parse, uuidParam } from '../lib/validate'
import { STAFF, currentUser, requireAuth } from '../middleware/auth'
import { notify, staffForCourse } from '../services/notifications'
import { maybeNotifyStreak } from '../services/tests'
import { streakSummary } from '../services/progress'
import { getLearnerQuestion } from '../services/questions'
import { answerStats, answeredBy } from '../services/stats'

export const questionsRouter = Router()

const questionParam = (raw : unknown) => parse(uuidParam, raw)

questionsRouter.get('/:id', async (req, res) => {
    res.json(await getLearnerQuestion(questionParam(req.params.id), req.user?.id))
})

/* Practice answers on the question bank */

questionsRouter.post('/:id/attempts', requireAuth, async (req, res) => {
    const user = currentUser(req)
    const question = await getLearnerQuestion(questionParam(req.params.id), user.id)
    const { choice } = parse(z.object({ choice : z.number().int().min(0) }), req.body)
    if (choice >= question.options.length) throw badRequest('choice is out of range')
    const correct = choice === question.answer
    const before = (await streakSummary(user)).current
    await db.insert(questionAttempts).values({ userId : user.id, questionId : question.id, choice, correct })
    await maybeNotifyStreak(user, before)
    const stats = (await answerStats([question.id])).get(question.id)
    res.status(201).json({ correct, answer : question.answer, explanation : question.explanation, stats })
})

// Answer statistics. Only for students who have answered (pick shares would give the answer away) and staff.
questionsRouter.get('/:id/stats', requireAuth, async (req, res) => {
    const user = currentUser(req)
    const question = await getLearnerQuestion(questionParam(req.params.id))
    if (!STAFF.includes(user.role) && !(await answeredBy(user.id, [question.id])).has(question.id)) {
        throw forbidden('Answer the question first to see how others did')
    }
    res.json((await answerStats([question.id])).get(question.id))
})

/* Saves */

const saveState = async (questionId : string, userId : string) => {
    const [row] = await db.select({
        saves : sql<number>`count(*)::int`,
        saved : sql<boolean>`bool_or(${savedQuestions.userId} = ${userId})`,
    }).from(savedQuestions).where(eq(savedQuestions.questionId, questionId))
    return { saved : !!row.saved, saves : row.saves }
}

questionsRouter.put('/:id/save', requireAuth, async (req, res) => {
    const user = currentUser(req)
    const question = await getLearnerQuestion(questionParam(req.params.id))
    await db.insert(savedQuestions).values({ userId : user.id, questionId : question.id }).onConflictDoNothing()
    res.json(await saveState(question.id, user.id))
})

questionsRouter.delete('/:id/save', requireAuth, async (req, res) => {
    const user = currentUser(req)
    const id = questionParam(req.params.id)
    await db.delete(savedQuestions).where(and(eq(savedQuestions.userId, user.id), eq(savedQuestions.questionId, id)))
    res.json(await saveState(id, user.id))
})

/* Discussion */

const commentColumns = {
    id : comments.id,
    body : comments.body,
    createdAt : comments.createdAt,
    userID : users.id,
    firstName : users.firstName,
    lastName : users.lastName,
    color : users.color,
    role : users.role,
}

const presentComment = (row : { id : string, body : string, createdAt : Date, userID : string, firstName : string, lastName : string, color : string, role : string }, viewerId? : string) => ({
    id : row.id,
    body : row.body,
    createdAt : row.createdAt,
    author : {
        id : row.userID,
        name : `${row.firstName} ${row.lastName ? `${row.lastName[0]}.` : ''}`.trim(),
        initials : initialsOf(row.firstName, row.lastName),
        color : row.color,
        isStaff : row.role !== 'student',
    },
    mine : row.userID === viewerId,
})

questionsRouter.get('/:id/comments', async (req, res) => {
    const question = await getLearnerQuestion(questionParam(req.params.id))
    const rows = await db.select(commentColumns).from(comments)
        .innerJoin(users, eq(users.id, comments.userId))
        .where(eq(comments.questionId, question.id))
        .orderBy(asc(comments.createdAt)).limit(500)
    res.json({ items : rows.map((row) => presentComment(row, req.user?.id)) })
})

questionsRouter.post('/:id/comments', requireAuth, async (req, res) => {
    const user = currentUser(req)
    const question = await getLearnerQuestion(questionParam(req.params.id))
    const { body } = parse(z.object({ body : z.string().trim().min(1).max(2000) }), req.body)
    const [comment] = await db.insert(comments).values({ questionId : question.id, userId : user.id, body }).returning()

    // Tell everyone else in the thread who wants reply notifications
    const others = await db.selectDistinct({ id : users.id }).from(comments)
        .innerJoin(users, eq(users.id, comments.userId))
        .where(and(eq(comments.questionId, question.id), ne(comments.userId, user.id), sql`(${users.prefs}->>'replies')::boolean`))
    const preview = body.length > 140 ? `${body.slice(0, 137)}...` : body
    await notify(others.map((row) => row.id), {
        kind : 'reply',
        title : `${user.firstName} ${user.lastName ? `${user.lastName[0]}.` : ''} replied in a discussion`.replace(/\s+/g, ' '),
        body : `“${preview}”`,
        link : `/questions/${question.courseID}?question=${question.id}`,
        dedupeKey : `reply:${comment.id}`,
    })

    const [row] = await db.select(commentColumns).from(comments).innerJoin(users, eq(users.id, comments.userId))
        .where(eq(comments.id, comment.id))
    res.status(201).json(presentComment(row, user.id))
})

questionsRouter.delete('/:id/comments/:commentId', requireAuth, async (req, res) => {
    const user = currentUser(req)
    const commentId = parse(uuidParam, req.params.commentId)
    const [comment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1)
    if (!comment || comment.questionId !== req.params.id) throw notFound('Comment')
    if (comment.userId !== user.id && !STAFF.includes(user.role)) throw forbidden()
    await db.delete(comments).where(eq(comments.id, commentId))
    res.status(204).end()
})

/* Reports */

const flagSchema = z.object({
    issue : z.enum(['Wrong answer', 'Typo', 'Unclear question', 'Duplicate', 'Missing explanation']),
    comment : z.string().trim().max(2000).default(''),
    suggestedAnswer : z.number().int().min(0).nullable().optional(),
})

questionsRouter.post('/:id/flags', requireAuth, async (req, res) => {
    const user = currentUser(req)
    const question = await getLearnerQuestion(questionParam(req.params.id))
    const input = parse(flagSchema, req.body)
    if (input.suggestedAnswer != null && input.suggestedAnswer >= question.options.length) throw badRequest('suggestedAnswer is out of range')

    const [open] = await db.select({ id : flags.id }).from(flags)
        .where(and(eq(flags.questionId, question.id), eq(flags.reporterId, user.id), eq(flags.status, 'open'))).limit(1)
    if (open) throw conflict('You already reported this question. A moderator will look at it soon.')

    const [flag] = await db.insert(flags).values({
        questionId : question.id, reporterId : user.id, issue : input.issue, comment : input.comment,
        suggestedAnswer : input.suggestedAnswer ?? null,
    }).returning()

    const [course] = await db.execute<{ code : string }>(sql`select code from courses where id = ${question.courseID}`).then((result) => result.rows)
    await notify(await staffForCourse(question.courseID), {
        kind : 'flag',
        title : `New flag on ${course?.code ?? 'a question'}`,
        body : `${user.firstName} ${user.lastName ? `${user.lastName[0]}.` : ''} reported “${input.issue}”${input.comment ? `: ${input.comment.slice(0, 120)}` : ''}`.replace(/\s+:/, ':'),
        link : `/flags/${flag.id}`,
        dedupeKey : `flag:${flag.id}`,
    })
    res.status(201).json({ id : flag.id, status : flag.status })
})
