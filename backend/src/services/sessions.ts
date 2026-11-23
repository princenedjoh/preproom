import { and, eq, gt, sql } from 'drizzle-orm'
import type { Response, CookieOptions } from 'express'
import { config } from '../config'
import { db } from '../db/client'
import { sessions, users, type Role } from '../db/schema'
import { hashToken, newToken } from '../lib/crypto'

export const SESSION_COOKIE = 'preproom_session'

export interface AuthUser {
    id : string
    email : string
    role : Role
    firstName : string
    lastName : string
    timezone : string
}

const cookieOptions = () : CookieOptions => ({
    httpOnly : true,
    secure : config.cookieSecure,
    sameSite : 'lax',
    path : '/',
    domain : config.COOKIE_DOMAIN,
    maxAge : config.SESSION_TTL_DAYS * 86400 * 1000,
})

export const createSession = async (userId : string, userAgent? : string) => {
    const token = newToken()
    const expiresAt = new Date(Date.now() + config.SESSION_TTL_DAYS * 86400 * 1000)
    await db.insert(sessions).values({ userId, tokenHash : hashToken(token), userAgent : userAgent?.slice(0, 300), expiresAt })
    return { token, expiresAt }
}

export const setSessionCookie = (res : Response, token : string) => res.cookie(SESSION_COOKIE, token, cookieOptions())

export const clearSessionCookie = (res : Response) => {
    const { maxAge, ...options } = cookieOptions()
    res.clearCookie(SESSION_COOKIE, options)
}

export const findSession = async (token : string) => {
    const [row] = await db
        .select({
            sessionId : sessions.id,
            lastUsedAt : sessions.lastUsedAt,
            id : users.id,
            email : users.email,
            role : users.role,
            status : users.status,
            firstName : users.firstName,
            lastName : users.lastName,
            timezone : users.timezone,
        })
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, sql`now()`)))
        .limit(1)
    if (!row || row.status !== 'active') return null

    // Sliding expiry and "last active", written at most every 10 minutes
    if (Date.now() - row.lastUsedAt.getTime() > 10 * 60 * 1000) {
        const expiresAt = new Date(Date.now() + config.SESSION_TTL_DAYS * 86400 * 1000)
        await Promise.all([
            db.update(sessions).set({ lastUsedAt : new Date(), expiresAt }).where(eq(sessions.id, row.sessionId)),
            db.update(users).set({ lastActiveAt : new Date() }).where(eq(users.id, row.id)),
        ])
    }

    const { sessionId, lastUsedAt, status, ...user } = row
    return { sessionId, user : user as AuthUser }
}

export const deleteSession = (sessionId : string) => db.delete(sessions).where(eq(sessions.id, sessionId))
export const deleteUserSessions = (userId : string) => db.delete(sessions).where(eq(sessions.userId, userId))
