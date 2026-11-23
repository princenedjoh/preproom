import { Router } from 'express'
import { and, asc, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db, outer } from '../db/client'
import { courses, faculties, institutions, programs, questions, topics } from '../db/schema'
import { listParam, parse } from '../lib/validate'
import { courseProgress } from '../services/progress'
import { findCourse, listLearnerQuestions } from '../services/questions'
import { answerStats, answeredBy } from '../services/stats'

export const catalogRouter = Router()

const questionCount = sql<number>`(select count(*)::int from ${questions} q where q.course_id = ${outer(courses.id)} and q.deleted_at is null)`

const courseColumns = {
    id : courses.id,
    slug : courses.slug,
    code : courses.code,
    name : courses.name,
    color : courses.color,
    programID : courses.programId,
    questions : questionCount,
}

catalogRouter.get('/institutions', async (_req, res) => {
    res.json({ items : await db.select({ id : institutions.id, shortName : institutions.shortName, name : institutions.name })
        .from(institutions).orderBy(asc(institutions.shortName)) })
})

catalogRouter.get('/faculties', async (_req, res) => {
    res.json({ items : await db.select({ id : faculties.id, name : faculties.name }).from(faculties).orderBy(asc(faculties.name)) })
})

catalogRouter.get('/programs', async (_req, res) => {
    res.json({ items : await db.select({ id : programs.id, name : programs.name, facultyID : programs.facultyId })
        .from(programs).orderBy(asc(programs.name)) })
})

catalogRouter.get('/courses', async (req, res) => {
    const query = parse(z.object({ programID : z.uuid().optional() }), req.query)
    const rows = await db.select(courseColumns).from(courses)
        .where(query.programID ? eq(courses.programId, query.programID) : undefined)
        .orderBy(asc(courses.createdAt), asc(courses.code))
    const progress = req.user ? await courseProgress(req.user.id) : null
    res.json({
        items : rows.map((row) => ({
            ...row,
            progress : progress?.get(row.id)?.progress ?? 0,
            answered : progress?.get(row.id)?.answered ?? 0,
        })),
    })
})

catalogRouter.get('/courses/:course', async (req, res) => {
    const course = await findCourse(req.params.course)
    const [[counts], courseTopics, papers] = await Promise.all([
        db.select({ questions : questionCount }).from(courses).where(eq(courses.id, course.id)),
        topicsFor(course.id),
        papersFor(course.id),
    ])
    const progress = req.user ? (await courseProgress(req.user.id)).get(course.id) : undefined
    res.json({
        id : course.id, slug : course.slug, code : course.code, name : course.name, color : course.color,
        programID : course.programId,
        questions : counts.questions,
        progress : progress?.progress ?? 0,
        answered : progress?.answered ?? 0,
        topics : courseTopics,
        papers,
    })
})

const topicsFor = (courseId : string) => db.select({
    id : topics.id,
    name : topics.name,
    questions : sql<number>`(select count(*)::int from ${questions} q where q.topic_id = ${outer(topics.id)} and q.deleted_at is null)`,
}).from(topics).where(eq(topics.courseId, courseId)).orderBy(asc(topics.name))

const papersFor = (courseId : string) => db.select({
    year : questions.year,
    institution : institutions.shortName,
    questions : sql<number>`count(*)::int`,
}).from(questions)
    .leftJoin(institutions, eq(institutions.id, questions.institutionId))
    .where(and(eq(questions.courseId, courseId), isNull(questions.deletedAt)))
    .groupBy(questions.year, institutions.shortName)
    .orderBy(sql`${questions.year} desc`, asc(institutions.shortName))

catalogRouter.get('/courses/:course/topics', async (req, res) => {
    const course = await findCourse(req.params.course)
    res.json({ items : await topicsFor(course.id) })
})

catalogRouter.get('/courses/:course/papers', async (req, res) => {
    const course = await findCourse(req.params.course)
    res.json({ items : await papersFor(course.id) })
})

const listSchema = z.object({
    difficulty : listParam(z.enum(['Easy', 'Medium', 'Hard'])),
    topic : listParam(z.string().max(120)),
    institution : listParam(z.string().max(20)),
    search : z.string().max(200).optional(),
    saved : z.enum(['true', 'false']).optional(),
    sort : z.enum(['newest', 'oldest', 'hardest']).default('newest'),
    limit : z.coerce.number().int().min(1).max(200).default(50),
    offset : z.coerce.number().int().min(0).default(0),
})

catalogRouter.get('/courses/:course/questions', async (req, res) => {
    const course = await findCourse(req.params.course)
    const query = parse(listSchema, req.query)
    const page = await listLearnerQuestions({
        courseId : course.id,
        difficulty : query.difficulty,
        topic : query.topic,
        institution : query.institution?.map((value) => value.toUpperCase()),
        search : query.search,
        savedOnly : query.saved === 'true',
        sort : query.sort,
        limit : query.limit,
        offset : query.offset,
    }, req.user?.id)
    // Every item gets the answer-safe acceptance summary. Per-option shares (`stats`)
    // only appear on questions the logged-in caller has already answered.
    const ids = page.items.map((item) => item.id)
    const [all, answered] = await Promise.all([answerStats(ids), req.user ? answeredBy(req.user.id, ids) : new Set<string>()])
    res.json({
        ...page,
        items : page.items.map((item) => {
            const stats = all.get(item.id)
            const acceptance = { attempts : stats?.attempts ?? 0, correctRate : stats?.attempts ? stats.correctRate : null }
            return answered.has(item.id) ? { ...item, acceptance, stats } : { ...item, acceptance }
        }),
    })
})
