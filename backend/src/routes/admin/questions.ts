import { Router } from 'express'
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db, outer, type Tx } from '../../db/client'
import { flags, questions, topics } from '../../db/schema'
import { badRequest, forbidden } from '../../lib/errors'
import { listParam, parse, uuidParam } from '../../lib/validate'
import { assertCourseAccess, currentUser, manageableCourseIds } from '../../middleware/auth'
import { acceptance, adminBase, ensureInstitution, ensureTopic, getAdminQuestion, presentAdminQuestion } from '../../services/questions'
import type { AuthUser } from '../../services/sessions'

export const adminQuestionsRouter = Router()

// acceptance = lowest first (hardest), -acceptance = highest first; unanswered questions go last either way
const ORDER = {
    newest : [],
    oldest : [asc(questions.createdAt)],
    acceptance : [sql`${acceptance} asc nulls last`],
    '-acceptance' : [sql`${acceptance} desc nulls last`],
} satisfies Record<string, SQL[]>

const listSchema = z.object({
    courseID : listParam(z.uuid()),
    topic : z.string().max(120).optional(),
    difficulty : listParam(z.enum(['Easy', 'Medium', 'Hard'])),
    search : z.string().max(200).optional(),
    authorID : z.uuid().optional(),
    flagged : z.enum(['true', 'false']).optional(),
    limit : z.coerce.number().int().min(1).max(200).default(50),
    offset : z.coerce.number().int().min(0).default(0),
    sort : z.enum(['newest', 'oldest', 'acceptance', '-acceptance']).default('newest'),
})

adminQuestionsRouter.get('/', async (req, res) => {
    const query = parse(listSchema, req.query)
    const allowed = await manageableCourseIds(currentUser(req))
    const conditions : (SQL | undefined)[] = [isNull(questions.deletedAt)]
    if (allowed) conditions.push(allowed.length ? inArray(questions.courseId, allowed) : sql`false`)
    if (query.courseID?.length) conditions.push(inArray(questions.courseId, query.courseID))
    if (query.topic) conditions.push(or(eq(topics.name, query.topic), sql`${topics.id}::text = ${query.topic}`))
    if (query.difficulty?.length) conditions.push(inArray(questions.difficulty, query.difficulty))
    if (query.authorID) conditions.push(eq(questions.authorId, query.authorID))
    if (query.flagged === 'true') conditions.push(sql`exists(select 1 from ${flags} f where f.question_id = ${outer(questions.id)} and f.status = 'open')`)
    if (query.search?.trim()) conditions.push(ilike(questions.prompt, `%${query.search.trim().replace(/[%_\\]/g, (c) => `\\${c}`)}%`))
    const where = and(...conditions)

    const [items, [{ total }]] = await Promise.all([
        adminBase().where(where).orderBy(...ORDER[query.sort], desc(questions.createdAt), desc(questions.id)).limit(query.limit).offset(query.offset),
        db.select({ total : sql<number>`count(*)::int` }).from(questions).leftJoin(topics, eq(topics.id, questions.topicId)).where(where),
    ])
    res.json({ items : items.map(presentAdminQuestion), total, limit : query.limit, offset : query.offset })
})

adminQuestionsRouter.get('/:id', async (req, res) => {
    const question = await getAdminQuestion(parse(uuidParam, req.params.id))
    await assertCourseAccess(currentUser(req), question.courseID)
    res.json(question)
})

const questionSchema = z.object({
    question : z.string().trim().min(1).max(20_000),
    options : z.array(z.string().trim().min(1).max(5_000)).min(2).max(8),
    answer : z.number().int().min(0),
    explanation : z.string().max(20_000).default(''),
    courseID : z.uuid(),
    // Either an existing topic id or a topic name (created if new)
    topicID : z.uuid().nullable().optional(),
    topic : z.string().trim().max(120).optional(),
    difficulty : z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
    year : z.number().int().min(1950).max(2100).default(() => new Date().getFullYear()),
    institution : z.string().trim().max(20).nullable().optional(),
}).refine((value) => value.answer < value.options.length, { message : 'answer must point at one of the options', path : ['answer'] })

type QuestionInput = z.infer<typeof questionSchema>

const resolveRefs = async (tx : Tx, input : Partial<QuestionInput> & { courseID : string }) => {
    let topicId : string | null | undefined = undefined
    if (input.topicID !== undefined) {
        if (input.topicID) {
            const [topic] = await tx.select().from(topics).where(eq(topics.id, input.topicID))
            if (!topic || topic.courseId !== input.courseID) throw badRequest('topicID does not belong to this course')
        }
        topicId = input.topicID
    } else if (input.topic !== undefined) {
        topicId = input.topic ? (await ensureTopic(tx, input.courseID, input.topic)).id : null
    }
    let institutionId : string | null | undefined = undefined
    if (input.institution !== undefined) institutionId = input.institution ? (await ensureInstitution(tx, input.institution)).id : null
    return { topicId, institutionId }
}

const insertQuestion = async (tx : Tx, user : AuthUser, input : QuestionInput) => {
    const refs = await resolveRefs(tx, input)
    const [row] = await tx.insert(questions).values({
        courseId : input.courseID,
        topicId : refs.topicId ?? null,
        institutionId : refs.institutionId ?? null,
        difficulty : input.difficulty,
        year : input.year,
        prompt : input.question,
        options : input.options,
        answerIndex : input.answer,
        explanation : input.explanation,
        authorId : user.id,
    }).returning({ id : questions.id })
    return row.id
}

adminQuestionsRouter.post('/', async (req, res) => {
    const user = currentUser(req)
    const input = parse(questionSchema, req.body)
    await assertCourseAccess(user, input.courseID)
    const id = await db.transaction((tx) => insertQuestion(tx, user, input))
    res.status(201).json(await getAdminQuestion(id))
})

// Import a whole past paper in one go
adminQuestionsRouter.post('/bulk', async (req, res) => {
    const user = currentUser(req)
    const { questions : list } = parse(z.object({ questions : z.array(questionSchema).min(1).max(300) }), req.body)
    for (const courseId of new Set(list.map((item) => item.courseID))) await assertCourseAccess(user, courseId)
    const ids = await db.transaction(async (tx) => {
        const created : string[] = []
        for (const item of list) created.push(await insertQuestion(tx, user, item))
        return created
    })
    res.status(201).json({ created : ids.length, ids })
})

const updateSchema = z.object({
    question : z.string().trim().min(1).max(20_000).optional(),
    options : z.array(z.string().trim().min(1).max(5_000)).min(2).max(8).optional(),
    answer : z.number().int().min(0).optional(),
    explanation : z.string().max(20_000).optional(),
    courseID : z.uuid().optional(),
    topicID : z.uuid().nullable().optional(),
    topic : z.string().trim().max(120).optional(),
    difficulty : z.enum(['Easy', 'Medium', 'Hard']).optional(),
    year : z.number().int().min(1950).max(2100).optional(),
    institution : z.string().trim().max(20).nullable().optional(),
})

adminQuestionsRouter.patch('/:id', async (req, res) => {
    const user = currentUser(req)
    const existing = await getAdminQuestion(parse(uuidParam, req.params.id))
    await assertCourseAccess(user, existing.courseID)
    const input = parse(updateSchema, req.body)
    const courseID = input.courseID ?? existing.courseID
    if (input.courseID && input.courseID !== existing.courseID) await assertCourseAccess(user, input.courseID)

    const options = input.options ?? existing.options
    const answer = input.answer ?? existing.answer
    if (answer >= options.length) throw badRequest('answer: must point at one of the options')

    await db.transaction(async (tx) => {
        // Moving course without naming a topic drops the old course's topic
        const refs = await resolveRefs(tx, {
            ...input, courseID,
            ...(input.courseID && input.courseID !== existing.courseID && input.topicID === undefined && input.topic === undefined ? { topicID : null } : {}),
        })
        await tx.update(questions).set({
            prompt : input.question,
            options : input.options,
            answerIndex : input.answer,
            explanation : input.explanation,
            courseId : input.courseID,
            difficulty : input.difficulty,
            year : input.year,
            topicId : refs.topicId,
            institutionId : refs.institutionId,
            updatedAt : new Date(),
        }).where(eq(questions.id, existing.id))
    })
    res.json(await getAdminQuestion(existing.id))
})

// Supervisors and admins can delete anything; moderators only their own questions
adminQuestionsRouter.delete('/:id', async (req, res) => {
    const user = currentUser(req)
    const existing = await getAdminQuestion(parse(uuidParam, req.params.id))
    await assertCourseAccess(user, existing.courseID)
    if (user.role === 'moderator' && existing.authorID !== user.id) throw forbidden('Only supervisors can delete questions written by someone else')
    await db.update(questions).set({ deletedAt : new Date() }).where(eq(questions.id, existing.id))
    await db.update(flags).set({ status : 'dismissed', resolvedById : user.id, resolvedAt : new Date(), resolutionNote : 'Question deleted' })
        .where(and(eq(flags.questionId, existing.id), eq(flags.status, 'open')))
    res.status(204).end()
})
