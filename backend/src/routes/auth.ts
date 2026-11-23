import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { and, eq, gt, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { config } from '../config'
import { db } from '../db/client'
import { userTokens, users } from '../db/schema'
import { colorFor } from '../lib/colors'
import { hashPassword, hashToken, newToken, verifyPassword } from '../lib/crypto'
import { HttpError, conflict, unauthorized } from '../lib/errors'
import { mailer } from '../lib/mailer'
import { parse } from '../lib/validate'
import { requireAuth } from '../middleware/auth'
import { admins, notify } from '../services/notifications'
import {
    clearSessionCookie, createSession, deleteSession, deleteUserSessions, setSessionCookie,
} from '../services/sessions'
import { findUserByEmail, getUser, presentSessionUser } from '../services/users'

export const authRouter = Router()

const limiter = rateLimit({
    windowMs : 15 * 60 * 1000,
    limit : config.isTest ? 10_000 : 20,
    standardHeaders : 'draft-8',
    legacyHeaders : false,
    message : { error : { code : 'rate_limited', message : 'Too many attempts. Try again in a few minutes.' } },
})

const email = z.email().max(254).transform((value) => value.trim().toLowerCase())
const password = z.string().min(8, 'must be at least 8 characters').max(200)
const name = z.string().trim().min(1).max(80)

const signupSchema = z.object({
    firstName : name,
    lastName : z.string().trim().max(80).default(''),
    email,
    password,
    gender : z.string().trim().max(30).optional(),
    program : z.string().trim().max(120).optional(),
    school : z.string().trim().max(120).optional(),
    level : z.string().trim().max(40).optional(),
})

authRouter.post('/signup', limiter, async (req, res) => {
    const input = parse(signupSchema, req.body)
    if (await findUserByEmail(input.email)) throw conflict('An account with this email already exists')
    const [user] = await db.insert(users).values({
        ...input,
        passwordHash : await hashPassword(input.password),
        color : colorFor(input.email),
    }).onConflictDoNothing().returning()
    if (!user) throw conflict('An account with this email already exists')
    const session = await createSession(user.id, req.get('user-agent'))
    setSessionCookie(res, session.token)
    res.status(201).json({ user : await presentSessionUser(user) })
})

const loginSchema = z.object({ email, password : z.string().min(1).max(200) })

authRouter.post('/login', limiter, async (req, res) => {
    const input = parse(loginSchema, req.body)
    const user = await findUserByEmail(input.email)
    // Same error for unknown email and wrong password
    const valid = user?.passwordHash ? await verifyPassword(input.password, user.passwordHash) : false
    if (!user || !valid) throw new HttpError(401, 'invalid_credentials', 'Email or password is incorrect')
    if (user.status !== 'active') throw new HttpError(403, 'account_inactive', 'This account is not active')
    const session = await createSession(user.id, req.get('user-agent'))
    setSessionCookie(res, session.token)
    await db.update(users).set({ lastActiveAt : new Date() }).where(eq(users.id, user.id))
    res.json({ user : await presentSessionUser(user) })
})

authRouter.post('/logout', async (req, res) => {
    if (req.sessionId) await deleteSession(req.sessionId)
    clearSessionCookie(res)
    res.status(204).end()
})

authRouter.get('/me', requireAuth, async (req, res) => {
    res.json({ user : await presentSessionUser(await getUser(req.user!.id)) })
})

/* Password reset and invites share one token flow */

export const issueToken = async (userId : string, purpose : 'reset' | 'invite') => {
    const token = newToken()
    const hours = purpose === 'invite' ? 24 * 7 : 1
    await db.insert(userTokens).values({
        userId, purpose, tokenHash : hashToken(token), expiresAt : new Date(Date.now() + hours * 3600 * 1000),
    })
    return token
}

authRouter.post('/forgot', limiter, async (req, res) => {
    const input = parse(z.object({ email }), req.body)
    const user = await findUserByEmail(input.email)
    if (user && user.status === 'active') {
        const token = await issueToken(user.id, 'reset')
        await mailer.send({
            to : user.email,
            subject : 'Reset your PrepRoom password',
            text : `Hi ${user.firstName},\n\nUse this link to choose a new password. It expires in one hour.\n\n${config.APP_URL}/auth/reset?token=${token}\n\nIf you did not ask for this, you can ignore this email.`,
        })
    }
    // Same answer whether or not the account exists
    res.status(202).json({ ok : true })
})

const findToken = async (token : string) => {
    const [row] = await db.select({
        id : userTokens.id, purpose : userTokens.purpose, userId : userTokens.userId,
        email : users.email, firstName : users.firstName,
    }).from(userTokens)
        .innerJoin(users, eq(users.id, userTokens.userId))
        .where(and(eq(userTokens.tokenHash, hashToken(token)), isNull(userTokens.usedAt), gt(userTokens.expiresAt, sql`now()`)))
        .limit(1)
    return row ?? null
}

// Lets the reset / accept-invite page greet the person and show the right copy
authRouter.get('/token', async (req, res) => {
    const { token } = parse(z.object({ token : z.string().min(10).max(200) }), req.query)
    const row = await findToken(token)
    if (!row) throw new HttpError(410, 'token_invalid', 'This link has expired or was already used')
    res.json({ purpose : row.purpose, email : row.email, firstName : row.firstName })
})

const resetSchema = z.object({
    token : z.string().min(10).max(200),
    password,
    firstName : name.optional(),
    lastName : z.string().trim().max(80).optional(),
})

authRouter.post('/reset', limiter, async (req, res) => {
    const input = parse(resetSchema, req.body)
    const row = await findToken(input.token)
    if (!row) throw new HttpError(410, 'token_invalid', 'This link has expired or was already used')

    await db.transaction(async (tx) => {
        await tx.update(userTokens).set({ usedAt : new Date() }).where(eq(userTokens.id, row.id))
        await tx.update(users).set({
            passwordHash : await hashPassword(input.password),
            ...(row.purpose === 'invite' ? { status : 'active' as const } : {}),
            ...(input.firstName ? { firstName : input.firstName } : {}),
            ...(input.lastName !== undefined ? { lastName : input.lastName } : {}),
        }).where(eq(users.id, row.userId))
    })
    // A reset signs out every other device
    await deleteUserSessions(row.userId)

    const user = await getUser(row.userId)
    if (row.purpose === 'invite') {
        await notify(await admins(), {
            kind : 'people',
            title : 'Invitation accepted',
            body : `${user.firstName} ${user.lastName} joined as a ${user.role}.`,
            link : '/users',
        })
    }
    const session = await createSession(user.id, req.get('user-agent'))
    setSessionCookie(res, session.token)
    res.json({ user : await presentSessionUser(user) })
})

export const requireCurrentPassword = async (userId : string, current : string) => {
    const user = await getUser(userId)
    if (!user.passwordHash || !(await verifyPassword(current, user.passwordHash))) {
        throw unauthorized('Your current password is incorrect')
    }
    return user
}

