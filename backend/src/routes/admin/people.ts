import { Router } from 'express'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { config } from '../../config'
import { db, outer } from '../../db/client'
import { flags, questions, staffCourses, users } from '../../db/schema'
import { colorFor } from '../../lib/colors'
import { badRequest, conflict, notFound } from '../../lib/errors'
import { mailer } from '../../lib/mailer'
import { parse, uuidParam } from '../../lib/validate'
import { STAFF, currentUser, requireRole } from '../../middleware/auth'
import { deleteUserSessions } from '../../services/sessions'
import { findUserByEmail } from '../../services/users'
import { issueToken } from '../auth'

// Staff management is admin-only
export const adminPeopleRouter = Router()
adminPeopleRouter.use(requireRole('admin'))

const staffRole = z.enum(['moderator', 'supervisor', 'admin'])

const presentPeople = async (ids? : string[]) => {
    const rows = await db.select({
        id : users.id,
        name : sql<string>`trim(${users.firstName} || ' ' || ${users.lastName})`,
        email : users.email,
        role : users.role,
        status : users.status,
        color : users.color,
        lastActive : users.lastActiveAt,
        createdAt : users.createdAt,
        courses : sql<string[]>`coalesce((select array_agg(sc.course_id::text) from ${staffCourses} sc where sc.user_id = ${outer(users.id)}), '{}')`,
        questionsAdded : sql<number>`(select count(*)::int from ${questions} q where q.author_id = ${outer(users.id)} and q.deleted_at is null)`,
        flagsResolved : sql<number>`(select count(*)::int from ${flags} f where f.resolved_by_id = ${outer(users.id)})`,
    }).from(users)
        .where(ids ? inArray(users.id, ids) : inArray(users.role, STAFF))
        .orderBy(sql`case ${users.role} when 'admin' then 0 when 'supervisor' then 1 else 2 end`, asc(users.firstName))
    return rows
}

adminPeopleRouter.get('/', async (_req, res) => {
    res.json({ items : await presentPeople() })
})

const setCourses = async (userId : string, courseIds : string[]) => {
    await db.delete(staffCourses).where(eq(staffCourses.userId, userId))
    if (courseIds.length) await db.insert(staffCourses).values(courseIds.map((courseId) => ({ userId, courseId }))).onConflictDoNothing()
}

const sendInvite = async (user : { id : string, email : string, firstName : string, role : string }, inviter : string) => {
    const token = await issueToken(user.id, 'invite')
    await mailer.send({
        to : user.email,
        subject : 'You have been invited to PrepRoom',
        text : `Hi ${user.firstName},\n\n${inviter} invited you to help run PrepRoom as a ${user.role}.\nSet your password to get started (the link works for 7 days):\n\n${config.APP_URL}/auth/reset?token=${token}&invite=1\n`,
    })
}

const inviteSchema = z.object({
    email : z.email().transform((value) => value.trim().toLowerCase()),
    firstName : z.string().trim().min(1).max(80),
    lastName : z.string().trim().max(80).default(''),
    // Convenience for a single "Name" field
    role : staffRole,
    courses : z.array(z.uuid()).max(100).default([]),
})

adminPeopleRouter.post('/invite', async (req, res) => {
    const input = parse(inviteSchema.or(inviteSchema.omit({ firstName : true, lastName : true }).extend({ name : z.string().trim().min(1).max(160) })), req.body)
    const [firstName, ...rest] = 'name' in input ? input.name.split(/\s+/) : [input.firstName, input.lastName]
    const lastName = 'name' in input ? rest.join(' ') : input.lastName ?? ''
    const inviter = currentUser(req)

    const existing = await findUserByEmail(input.email)
    let userId : string
    if (existing) {
        // Promote an existing learner instead of creating a duplicate account
        if (STAFF.includes(existing.role)) throw conflict('This person is already on the team')
        await db.update(users).set({ role : input.role }).where(eq(users.id, existing.id))
        userId = existing.id
    } else {
        const [created] = await db.insert(users).values({
            email : input.email, firstName, lastName, role : input.role, status : 'invited',
            color : colorFor(input.email), invitedById : inviter.id,
        }).returning()
        userId = created.id
        await sendInvite({ id : created.id, email : created.email, firstName, role : input.role }, `${inviter.firstName} ${inviter.lastName}`.trim())
    }
    await setCourses(userId, input.courses)
    res.status(201).json((await presentPeople([userId]))[0])
})

adminPeopleRouter.post('/:id/resend-invite', async (req, res) => {
    const [user] = await db.select().from(users).where(eq(users.id, parse(uuidParam, req.params.id)))
    if (!user) throw notFound('Person')
    if (user.status !== 'invited') throw badRequest('This person has already accepted their invite')
    const inviter = currentUser(req)
    await sendInvite(user, `${inviter.firstName} ${inviter.lastName}`.trim())
    res.status(202).json({ ok : true })
})

const updateSchema = z.object({
    role : staffRole.optional(),
    courses : z.array(z.uuid()).max(100).optional(),
    status : z.enum(['active', 'disabled']).optional(),
})

const assertNotLastAdmin = async (userId : string) => {
    const admins = await db.select({ id : users.id }).from(users).where(and(eq(users.role, 'admin'), eq(users.status, 'active')))
    if (admins.length === 1 && admins[0].id === userId) throw badRequest('There must be at least one active admin')
}

adminPeopleRouter.patch('/:id', async (req, res) => {
    const id = parse(uuidParam, req.params.id)
    const input = parse(updateSchema, req.body)
    const [user] = await db.select().from(users).where(eq(users.id, id))
    if (!user || !STAFF.includes(user.role)) throw notFound('Person')
    if ((input.role && input.role !== 'admin') || input.status === 'disabled') await assertNotLastAdmin(id)
    if (input.status === 'active' && user.status === 'invited') throw badRequest('Invited people become active when they accept')

    await db.update(users).set({ role : input.role, status : input.status }).where(eq(users.id, id))
    if (input.courses) await setCourses(id, input.courses)
    if (input.status === 'disabled') await deleteUserSessions(id)
    res.json((await presentPeople([id]))[0])
})

// Removes someone from the team. Unaccepted invites are deleted; others become learners.
adminPeopleRouter.delete('/:id', async (req, res) => {
    const id = parse(uuidParam, req.params.id)
    const [user] = await db.select().from(users).where(eq(users.id, id))
    if (!user || !STAFF.includes(user.role)) throw notFound('Person')
    await assertNotLastAdmin(id)
    if (user.status === 'invited' && !user.passwordHash) {
        await db.delete(users).where(eq(users.id, id))
    } else {
        await db.update(users).set({ role : 'student' }).where(eq(users.id, id))
        await setCourses(id, [])
    }
    res.status(204).end()
})

/* Learners (read-only list for support) */

export const adminStudentsRouter = Router()
adminStudentsRouter.use(requireRole('admin', 'supervisor'))

adminStudentsRouter.get('/', async (req, res) => {
    const query = parse(z.object({
        search : z.string().max(200).optional(),
        limit : z.coerce.number().int().min(1).max(200).default(50),
        offset : z.coerce.number().int().min(0).default(0),
    }), req.query)
    const where = and(
        eq(users.role, 'student'),
        query.search ? sql`(${users.email} ilike ${`%${query.search}%`} or (${users.firstName} || ' ' || ${users.lastName}) ilike ${`%${query.search}%`})` : undefined,
    )
    const [items, [{ total }]] = await Promise.all([
        db.select({
            id : users.id,
            name : sql<string>`trim(${users.firstName} || ' ' || ${users.lastName})`,
            email : users.email,
            school : users.school,
            program : users.program,
            status : users.status,
            createdAt : users.createdAt,
            lastActive : users.lastActiveAt,
            answers : sql<number>`(select count(*)::int from question_attempts a where a.user_id = ${outer(users.id)})`,
        }).from(users).where(where).orderBy(desc(users.createdAt)).limit(query.limit).offset(query.offset),
        db.select({ total : sql<number>`count(*)::int` }).from(users).where(where),
    ])
    res.json({ items, total })
})
