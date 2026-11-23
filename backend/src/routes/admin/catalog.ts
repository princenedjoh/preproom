import { Router } from 'express'
import { asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db, outer } from '../../db/client'
import { courses, faculties, programs, questions, topics } from '../../db/schema'
import { conflict, notFound } from '../../lib/errors'
import { parse, uuidParam } from '../../lib/validate'
import { assertCourseAccess, currentUser, requireRole } from '../../middleware/auth'

// Faculties ("schools" in the admin UI), programs, courses and topics.
// Anyone on staff can read; supervisors and admins change the structure;
// moderators can add topics to their own courses.
export const adminCatalogRouter = Router()
const editors = requireRole('supervisor', 'admin')

const id = (raw : unknown) => parse(uuidParam, raw)

// Postgres FK / unique violations become readable 409s
const guard = async <T>(work : () => Promise<T>, what : string) : Promise<T> => {
    try {
        return await work()
    } catch (error : any) {
        const code = error?.cause?.code ?? error?.code
        if (code === '23505') throw conflict(`A ${what} with that name already exists`)
        if (code === '23503') throw conflict(`This ${what} is still in use. Move or delete what is inside it first.`)
        throw error
    }
}

/* Faculties */

adminCatalogRouter.get('/schools', async (_req, res) => {
    res.json({ items : await db.select({
        id : faculties.id, name : faculties.name,
        programs : sql<number>`(select count(*)::int from ${programs} p where p.faculty_id = ${outer(faculties.id)})`,
    }).from(faculties).orderBy(asc(faculties.name)) })
})

const schoolSchema = z.object({ name : z.string().trim().min(1).max(120) })

adminCatalogRouter.post('/schools', editors, async (req, res) => {
    const input = parse(schoolSchema, req.body)
    const [row] = await guard(() => db.insert(faculties).values(input).returning(), 'school')
    res.status(201).json({ id : row.id, name : row.name })
})

adminCatalogRouter.patch('/schools/:id', editors, async (req, res) => {
    const input = parse(schoolSchema, req.body)
    const [row] = await guard(() => db.update(faculties).set(input).where(eq(faculties.id, id(req.params.id))).returning(), 'school')
    if (!row) throw notFound('School')
    res.json({ id : row.id, name : row.name })
})

adminCatalogRouter.delete('/schools/:id', editors, async (req, res) => {
    const [row] = await guard(() => db.delete(faculties).where(eq(faculties.id, id(req.params.id))).returning(), 'school')
    if (!row) throw notFound('School')
    res.status(204).end()
})

/* Programs */

const presentProgram = (row : typeof programs.$inferSelect) => ({ id : row.id, name : row.name, schoolID : row.facultyId })

adminCatalogRouter.get('/programs', async (_req, res) => {
    const rows = await db.select().from(programs).orderBy(asc(programs.name))
    res.json({ items : rows.map(presentProgram) })
})

const programSchema = z.object({ name : z.string().trim().min(1).max(120), schoolID : z.uuid() })

adminCatalogRouter.post('/programs', editors, async (req, res) => {
    const input = parse(programSchema, req.body)
    const [row] = await guard(() => db.insert(programs).values({ name : input.name, facultyId : input.schoolID }).returning(), 'program')
    res.status(201).json(presentProgram(row))
})

adminCatalogRouter.patch('/programs/:id', editors, async (req, res) => {
    const input = parse(programSchema.partial(), req.body)
    const [row] = await guard(() => db.update(programs)
        .set({ name : input.name, facultyId : input.schoolID })
        .where(eq(programs.id, id(req.params.id))).returning(), 'program')
    if (!row) throw notFound('Program')
    res.json(presentProgram(row))
})

adminCatalogRouter.delete('/programs/:id', editors, async (req, res) => {
    const [row] = await guard(() => db.delete(programs).where(eq(programs.id, id(req.params.id))).returning(), 'program')
    if (!row) throw notFound('Program')
    res.status(204).end()
})

/* Courses */

const presentCourse = (row : typeof courses.$inferSelect & { questions? : number }) => ({
    id : row.id, slug : row.slug, code : row.code, name : row.name, programID : row.programId, color : row.color,
    questions : row.questions ?? 0,
})

adminCatalogRouter.get('/courses', async (_req, res) => {
    const rows = await db.select({
        ...{ id : courses.id, slug : courses.slug, code : courses.code, name : courses.name, programId : courses.programId, color : courses.color, createdAt : courses.createdAt },
        questions : sql<number>`(select count(*)::int from ${questions} q where q.course_id = ${outer(courses.id)} and q.deleted_at is null)`,
    }).from(courses).orderBy(asc(courses.code))
    res.json({ items : rows.map(presentCourse) })
})

const slugify = (code : string) => code.toLowerCase().replace(/[^a-z0-9]+/g, '')

const courseSchema = z.object({
    code : z.string().trim().min(1).max(20),
    name : z.string().trim().min(1).max(120),
    programID : z.uuid().nullable().optional(),
    color : z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a hex colour like #6647f0').optional(),
})

adminCatalogRouter.post('/courses', editors, async (req, res) => {
    const input = parse(courseSchema, req.body)
    const [row] = await guard(() => db.insert(courses).values({
        code : input.code, name : input.name, programId : input.programID ?? null, color : input.color, slug : slugify(input.code),
    }).returning(), 'course')
    res.status(201).json(presentCourse(row))
})

adminCatalogRouter.patch('/courses/:id', editors, async (req, res) => {
    const input = parse(courseSchema.partial(), req.body)
    const [row] = await guard(() => db.update(courses).set({
        code : input.code, name : input.name, programId : input.programID, color : input.color,
        ...(input.code ? { slug : slugify(input.code) } : {}),
    }).where(eq(courses.id, id(req.params.id))).returning(), 'course')
    if (!row) throw notFound('Course')
    res.json(presentCourse(row))
})

adminCatalogRouter.delete('/courses/:id', editors, async (req, res) => {
    const [row] = await guard(() => db.delete(courses).where(eq(courses.id, id(req.params.id))).returning(), 'course')
    if (!row) throw notFound('Course')
    res.status(204).end()
})

/* Topics */

adminCatalogRouter.get('/topics', async (req, res) => {
    const query = parse(z.object({ courseID : z.uuid().optional() }), req.query)
    const rows = await db.select({
        id : topics.id, name : topics.name, courseID : topics.courseId,
        questions : sql<number>`(select count(*)::int from ${questions} q where q.topic_id = ${outer(topics.id)} and q.deleted_at is null)`,
    }).from(topics).where(query.courseID ? eq(topics.courseId, query.courseID) : undefined).orderBy(asc(topics.name))
    res.json({ items : rows })
})

const topicSchema = z.object({ name : z.string().trim().min(1).max(120), courseID : z.uuid() })

adminCatalogRouter.post('/topics', async (req, res) => {
    const input = parse(topicSchema, req.body)
    await assertCourseAccess(currentUser(req), input.courseID)
    const [row] = await guard(() => db.insert(topics).values({ name : input.name, courseId : input.courseID }).returning(), 'topic')
    res.status(201).json({ id : row.id, name : row.name, courseID : row.courseId, questions : 0 })
})

adminCatalogRouter.patch('/topics/:id', async (req, res) => {
    const input = parse(z.object({ name : z.string().trim().min(1).max(120) }), req.body)
    const [topic] = await db.select().from(topics).where(eq(topics.id, id(req.params.id)))
    if (!topic) throw notFound('Topic')
    await assertCourseAccess(currentUser(req), topic.courseId)
    const [row] = await guard(() => db.update(topics).set(input).where(eq(topics.id, topic.id)).returning(), 'topic')
    res.json({ id : row.id, name : row.name, courseID : row.courseId })
})

// Questions in a deleted topic become "General"
adminCatalogRouter.delete('/topics/:id', async (req, res) => {
    const [topic] = await db.select().from(topics).where(eq(topics.id, id(req.params.id)))
    if (!topic) throw notFound('Topic')
    await assertCourseAccess(currentUser(req), topic.courseId)
    await db.delete(topics).where(eq(topics.id, topic.id))
    res.status(204).end()
})
