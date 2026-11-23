import { and, eq, inArray, or } from 'drizzle-orm'
import { db, type DbOrTx } from '../db/client'
import { notifications, staffCourses, users, type NotificationKind } from '../db/schema'

export interface NewNotification {
    kind : NotificationKind
    title : string
    body? : string
    link? : string
    dedupeKey? : string
}

export const notify = async (userIds : string[], notification : NewNotification, client : DbOrTx = db) => {
    const unique = Array.from(new Set(userIds))
    if (unique.length === 0) return
    await client.insert(notifications)
        .values(unique.map((userId) => ({ userId, ...notification, body : notification.body ?? '' })))
        .onConflictDoNothing()
}

// Admins and supervisors see everything; moderators only their courses
export const staffForCourse = async (courseId : string, client : DbOrTx = db) => {
    const rows = await client.selectDistinct({ id : users.id }).from(users)
        .leftJoin(staffCourses, and(eq(staffCourses.userId, users.id), eq(staffCourses.courseId, courseId)))
        .where(and(
            eq(users.status, 'active'),
            or(inArray(users.role, ['admin', 'supervisor']), and(eq(users.role, 'moderator'), eq(staffCourses.courseId, courseId))),
        ))
    return rows.map((row) => row.id)
}

export const admins = async (client : DbOrTx = db) => {
    const rows = await client.select({ id : users.id }).from(users).where(and(eq(users.role, 'admin'), eq(users.status, 'active')))
    return rows.map((row) => row.id)
}
