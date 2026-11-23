import { Router } from 'express'
import { aliasedTable, and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/client'
import { courses, flags, questions, users } from '../../db/schema'
import { badRequest, notFound } from '../../lib/errors'
import { listParam, parse, uuidParam } from '../../lib/validate'
import { assertCourseAccess, currentUser, manageableCourseIds } from '../../middleware/auth'
import { notify } from '../../services/notifications'

export const adminFlagsRouter = Router()

const reporter = aliasedTable(users, 'reporter')
const resolver = aliasedTable(users, 'resolver')

const columns = {
    id : flags.id,
    questionID : flags.questionId,
    question : questions.prompt,
    options : questions.options,
    answer : questions.answerIndex,
    courseID : questions.courseId,
    courseCode : courses.code,
    reporter : sql<string>`coalesce(trim(${reporter.firstName} || ' ' || ${reporter.lastName}), 'Deleted user')`,
    reporterID : flags.reporterId,
    issue : flags.issue,
    comment : flags.comment,
    suggestedAnswer : flags.suggestedAnswer,
    status : flags.status,
    raisedAt : flags.createdAt,
    resolvedBy : sql<string | null>`trim(${resolver.firstName} || ' ' || ${resolver.lastName})`,
    resolvedAt : flags.resolvedAt,
    resolutionNote : flags.resolutionNote,
}

const base = () => db.select(columns).from(flags)
    .innerJoin(questions, eq(questions.id, flags.questionId))
    .innerJoin(courses, eq(courses.id, questions.courseId))
    .leftJoin(reporter, eq(reporter.id, flags.reporterId))
    .leftJoin(resolver, eq(resolver.id, flags.resolvedById))

adminFlagsRouter.get('/', async (req, res) => {
    const query = parse(z.object({
        status : listParam(z.enum(['open', 'resolved', 'dismissed'])),
        courseID : z.uuid().optional(),
        questionID : z.uuid().optional(),
        limit : z.coerce.number().int().min(1).max(200).default(100),
        offset : z.coerce.number().int().min(0).default(0),
    }), req.query)
    const allowed = await manageableCourseIds(currentUser(req))
    const conditions : (SQL | undefined)[] = [
        allowed ? (allowed.length ? inArray(questions.courseId, allowed) : sql`false`) : undefined,
        query.status?.length ? inArray(flags.status, query.status) : undefined,
        query.courseID ? eq(questions.courseId, query.courseID) : undefined,
        query.questionID ? eq(flags.questionId, query.questionID) : undefined,
    ]
    const where = and(...conditions)
    const [items, counts] = await Promise.all([
        base().where(where).orderBy(sql`${flags.status} = 'open' desc`, desc(flags.createdAt)).limit(query.limit).offset(query.offset),
        db.select({ status : flags.status, count : sql<number>`count(*)::int` }).from(flags)
            .innerJoin(questions, eq(questions.id, flags.questionId))
            .where(and(conditions[0])).groupBy(flags.status),
    ])
    res.json({
        items,
        counts : Object.fromEntries(['open', 'resolved', 'dismissed'].map((status) => [status, counts.find((row) => row.status === status)?.count ?? 0])),
    })
})

const getFlag = async (id : string) => {
    const [row] = await base().where(eq(flags.id, id)).limit(1)
    if (!row) throw notFound('Flag')
    return row
}

adminFlagsRouter.get('/:id', async (req, res) => {
    const flag = await getFlag(parse(uuidParam, req.params.id))
    await assertCourseAccess(currentUser(req), flag.courseID)
    res.json(flag)
})

const updateSchema = z.object({
    status : z.enum(['open', 'resolved', 'dismissed']),
    note : z.string().trim().max(2000).optional(),
    // Resolve a "wrong answer" flag by changing the question's answer in one step
    applyAnswer : z.number().int().min(0).optional(),
})

adminFlagsRouter.patch('/:id', async (req, res) => {
    const user = currentUser(req)
    const flag = await getFlag(parse(uuidParam, req.params.id))
    await assertCourseAccess(user, flag.courseID)
    const input = parse(updateSchema, req.body)
    if (input.applyAnswer !== undefined && input.applyAnswer >= flag.options.length) throw badRequest('applyAnswer is out of range')

    await db.transaction(async (tx) => {
        if (input.applyAnswer !== undefined) {
            await tx.update(questions).set({ answerIndex : input.applyAnswer, updatedAt : new Date() }).where(eq(questions.id, flag.questionID))
        }
        await tx.update(flags).set(input.status === 'open'
            ? { status : 'open', resolvedById : null, resolvedAt : null, resolutionNote : null }
            : { status : input.status, resolvedById : user.id, resolvedAt : new Date(), resolutionNote : input.note ?? null })
            .where(eq(flags.id, flag.id))
    })

    if (flag.status === 'open' && input.status !== 'open' && flag.reporterID) {
        await notify([flag.reporterID], {
            kind : 'system',
            title : input.status === 'resolved' ? 'Thanks, we fixed the question you reported' : 'We reviewed the question you reported',
            body : input.note ?? (input.status === 'resolved' ? `Your “${flag.issue}” report on ${flag.courseCode} was resolved.` : `No change was needed for your “${flag.issue}” report on ${flag.courseCode}.`),
            link : `/questions/${flag.courseID}?question=${flag.questionID}`,
            dedupeKey : `flag-closed:${flag.id}`,
        })
    }
    res.json(await getFlag(flag.id))
})
