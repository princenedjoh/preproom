import { Router } from 'express'
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db/client'
import { notifications, tests, users } from '../db/schema'
import { dayIn } from '../lib/time'
import { parse } from '../lib/validate'
import { currentUser, requireAuth, STAFF } from '../middleware/auth'
import { notify } from '../services/notifications'
import { CHALLENGE_TIMEZONE, getOrCreateChallenge } from '../services/tests'
import type { AuthUser } from '../services/sessions'

export const notificationsRouter = Router()
notificationsRouter.use(requireAuth)

// "Today's challenge is live", created the first time a learner checks in each day
const ensureChallengeReminder = async (user : AuthUser) => {
    if (STAFF.includes(user.role)) return
    const [row] = await db.select({ prefs : users.prefs }).from(users).where(eq(users.id, user.id))
    if (!row?.prefs.dailyReminder) return
    const challenge = await getOrCreateChallenge()
    if (!challenge) return
    const [played] = await db.select({ id : tests.id }).from(tests)
        .where(and(eq(tests.userId, user.id), eq(tests.challengeId, challenge.id))).limit(1)
    if (played) return
    await notify([user.id], {
        kind : 'challenge',
        title : 'Today\'s challenge is live',
        body : `${challenge.questionIds.length} questions. ${challenge.title}`,
        link : '/challenges',
        dedupeKey : `challenge:${dayIn(CHALLENGE_TIMEZONE)}`,
    })
}

notificationsRouter.get('/', async (req, res) => {
    const user = currentUser(req)
    const query = parse(z.object({
        filter : z.enum(['all', 'unread', 'mentions']).default('all'),
        limit : z.coerce.number().int().min(1).max(100).default(50),
    }), req.query)
    await ensureChallengeReminder(user)

    const where = and(
        eq(notifications.userId, user.id),
        query.filter === 'unread' ? isNull(notifications.readAt) : undefined,
        query.filter === 'mentions' ? eq(notifications.kind, 'reply') : undefined,
    )
    const [items, [{ unread }]] = await Promise.all([
        db.select({
            id : notifications.id,
            kind : notifications.kind,
            title : notifications.title,
            body : notifications.body,
            link : notifications.link,
            createdAt : notifications.createdAt,
            readAt : notifications.readAt,
        }).from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(query.limit),
        db.select({ unread : sql<number>`count(*)::int` }).from(notifications)
            .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))),
    ])
    res.json({ items : items.map((item) => ({ ...item, unread : !item.readAt })), unread })
})

notificationsRouter.get('/unread-count', async (req, res) => {
    const user = currentUser(req)
    await ensureChallengeReminder(user)
    const [{ unread }] = await db.select({ unread : sql<number>`count(*)::int` }).from(notifications)
        .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)))
    res.json({ unread })
})

// Body { ids: [...] } marks those; no ids marks everything
notificationsRouter.post('/read', async (req, res) => {
    const { ids } = parse(z.object({ ids : z.array(z.uuid()).max(500).optional() }), req.body ?? {})
    await db.update(notifications).set({ readAt : new Date() }).where(and(
        eq(notifications.userId, currentUser(req).id),
        isNull(notifications.readAt),
        ids?.length ? inArray(notifications.id, ids) : undefined,
    ))
    res.status(204).end()
})
