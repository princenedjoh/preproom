import { eq, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { staffCourses, users } from '../db/schema'
import { initialsOf } from '../lib/colors'
import { notFound } from '../lib/errors'

type UserRow = typeof users.$inferSelect

export const presentUser = (user : UserRow) => ({
    id : user.id,
    email : user.email,
    firstName : user.firstName,
    lastName : user.lastName,
    name : `${user.firstName} ${user.lastName}`.trim(),
    initials : initialsOf(user.firstName, user.lastName),
    gender : user.gender,
    role : user.role,
    status : user.status,
    program : user.program,
    school : user.school,
    level : user.level,
    timezone : user.timezone,
    prefs : user.prefs,
    color : user.color,
    createdAt : user.createdAt,
})

export const findUserByEmail = async (email : string) => {
    const [user] = await db.select().from(users).where(sql`lower(${users.email}) = ${email.trim().toLowerCase()}`).limit(1)
    return user ?? null
}

export const getUser = async (id : string) => {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (!user) throw notFound('User')
    return user
}

// presentUser plus what the admin app needs to scope its pickers:
// `courses` is the moderator's assigned course ids; null means every course
// (supervisors, admins) or not applicable (learners).
export const presentSessionUser = async (user : UserRow) => {
    const courses = user.role === 'moderator'
        ? (await db.select({ courseId : staffCourses.courseId }).from(staffCourses).where(eq(staffCourses.userId, user.id))).map((row) => row.courseId)
        : null
    return { ...presentUser(user), courses }
}
