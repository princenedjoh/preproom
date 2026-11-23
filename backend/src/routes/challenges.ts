import { Router } from 'express'
import { z } from 'zod'
import { addDays, dayIn, weekStart } from '../lib/time'
import { parse } from '../lib/validate'
import { currentUser, requireAuth } from '../middleware/auth'
import { streakSummary } from '../services/progress'
import { CHALLENGE_TIMEZONE, challengeToday, leaderboard, recentChallenges, startChallenge } from '../services/tests'

export const challengesRouter = Router()

challengesRouter.get('/today', async (req, res) => {
    const today = await challengeToday(req.user)
    if (!today) {
        res.status(404).json({ error : { code : 'no_challenge', message : 'No challenge today yet' } })
        return
    }
    res.json(today)
})

challengesRouter.post('/today/start', requireAuth, async (req, res) => {
    res.status(201).json(await startChallenge(currentUser(req)))
})

challengesRouter.get('/recent', requireAuth, async (req, res) => {
    const { limit } = parse(z.object({ limit : z.coerce.number().int().min(1).max(30).default(4) }), req.query)
    res.json({ items : await recentChallenges(currentUser(req), limit) })
})

challengesRouter.get('/leaderboard', async (req, res) => {
    const { period, limit } = parse(z.object({
        period : z.enum(['today', 'week', 'all']).default('week'),
        limit : z.coerce.number().int().min(1).max(100).default(10),
    }), req.query)
    const today = dayIn(CHALLENGE_TIMEZONE)
    const from = period === 'today' ? today : period === 'week' ? weekStart(today) : '2000-01-01'
    res.json({ period, ...(await leaderboard(from, addDays(today, 0), req.user, limit)) })
})

// Streak card on the challenges page
challengesRouter.get('/streak', requireAuth, async (req, res) => {
    const { days, ...summary } = await streakSummary(currentUser(req))
    res.json(summary)
})
