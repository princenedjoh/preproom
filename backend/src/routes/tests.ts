import { Router } from 'express'
import { z } from 'zod'
import { parse, uuidParam } from '../lib/validate'
import { currentUser, requireAuth } from '../middleware/auth'
import { findCourse } from '../services/questions'
import { testHistory } from '../services/progress'
import { createTest, getOwnTest, presentTest, saveProgress, startChallenge, submitTest } from '../services/tests'

export const testsRouter = Router()
testsRouter.use(requireAuth)

// Accepts the frontend's TestConfigState as-is ('mcqs' means practice)
const createSchema = z.object({
    courseID : z.string().min(1),
    mode : z.enum(['mcqs', 'practice', 'paper', 'challenge']).default('practice'),
    count : z.coerce.number().int().min(1).max(100).default(10),
    minutes : z.coerce.number().int().min(1).max(240).default(20),
    difficulty : z.enum(['Mixed', 'Easy', 'Medium', 'Hard']).default('Mixed'),
    instantFeedback : z.boolean().default(false),
    year : z.coerce.number().int().min(1950).max(2100).optional(),
    topics : z.array(z.uuid()).max(50).optional(),
})

testsRouter.post('/', async (req, res) => {
    const input = parse(createSchema, req.body)
    const user = currentUser(req)
    if (input.mode === 'challenge') {
        res.status(201).json(await startChallenge(user))
        return
    }
    const course = await findCourse(input.courseID)
    res.status(201).json(await createTest(user, {
        courseId : course.id,
        mode : input.mode === 'paper' ? 'paper' : 'practice',
        count : input.count,
        minutes : input.minutes,
        difficulty : input.difficulty,
        instantFeedback : input.instantFeedback,
        year : input.year,
        topics : input.topics,
    }))
})

testsRouter.get('/', async (req, res) => {
    const query = parse(z.object({
        limit : z.coerce.number().int().min(1).max(100).default(20),
        courseID : z.string().optional(),
    }), req.query)
    const courseId = query.courseID ? (await findCourse(query.courseID)).id : undefined
    res.json({ items : await testHistory(currentUser(req).id, query.limit, courseId) })
})

testsRouter.get('/:id', async (req, res) => {
    const user = currentUser(req)
    res.json(await presentTest(await getOwnTest(user, parse(uuidParam, req.params.id)), user))
})

const answersSchema = z.object({ answers : z.record(z.string(), z.number().int().min(0)).default({}) })

// Autosave so a refresh or dropped connection does not lose answers
testsRouter.put('/:id/answers', async (req, res) => {
    const { answers } = parse(answersSchema, req.body)
    res.json(await saveProgress(currentUser(req), parse(uuidParam, req.params.id), answers))
})

testsRouter.post('/:id/submit', async (req, res) => {
    const { answers } = parse(answersSchema, req.body)
    res.json(await submitTest(currentUser(req), parse(uuidParam, req.params.id), answers))
})
