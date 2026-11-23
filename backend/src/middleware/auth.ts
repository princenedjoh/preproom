import type { Request, Response, NextFunction } from 'express'
import { and, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { staffCourses, type Role } from '../db/schema'
import { forbidden, unauthorized } from '../lib/errors'
import { findSession, SESSION_COOKIE, type AuthUser } from '../services/sessions'

const tokenFrom = (req : Request) : string | undefined => {
    const header = req.headers.authorization
    if (header?.startsWith('Bearer ')) return header.slice(7).trim()
    return req.cookies?.[SESSION_COOKIE]
}

// Attaches req.user when a valid session is present. Never rejects.
export const loadSession = async (req : Request, _res : Response, next : NextFunction) => {
    const token = tokenFrom(req)
    if (token) {
        const session = await findSession(token)
        if (session) {
            req.user = session.user
            req.sessionId = session.sessionId
        }
    }
    next()
}

export const requireAuth = (req : Request, _res : Response, next : NextFunction) => {
    if (!req.user) throw unauthorized()
    next()
}

export const requireRole = (...roles : Role[]) => (req : Request, _res : Response, next : NextFunction) => {
    if (!req.user) throw unauthorized()
    if (!roles.includes(req.user.role)) throw forbidden()
    next()
}

export const STAFF : Role[] = ['moderator', 'supervisor', 'admin']
export const requireStaff = requireRole(...STAFF)

export const currentUser = (req : Request) : AuthUser => {
    if (!req.user) throw unauthorized()
    return req.user
}

// Moderators only work on the courses they are assigned to; supervisors and admins on all.
export const hasCourseAccess = async (user : AuthUser, courseId : string) => {
    if (user.role === 'admin' || user.role === 'supervisor') return true
    if (user.role !== 'moderator') return false
    const [row] = await db.select().from(staffCourses)
        .where(and(eq(staffCourses.userId, user.id), eq(staffCourses.courseId, courseId))).limit(1)
    return !!row
}

export const assertCourseAccess = async (user : AuthUser, courseId : string) => {
    if (!(await hasCourseAccess(user, courseId))) throw forbidden('You are not assigned to this course')
}

// Course ids a moderator may manage; null means "all courses"
export const manageableCourseIds = async (user : AuthUser) : Promise<string[] | null> => {
    if (user.role === 'admin' || user.role === 'supervisor') return null
    const rows = await db.select({ courseId : staffCourses.courseId }).from(staffCourses).where(eq(staffCourses.userId, user.id))
    return rows.map((row) => row.courseId)
}
