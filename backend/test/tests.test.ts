import { describe, expect, it } from 'vitest'
import { agent, signup } from './helpers'

describe('timed tests', () => {
    it('hides answers, grades on the server and records history', async () => {
        const { client } = await signup()
        const created = await client.post('/tests').send({ courseID : 'cs201', mode : 'mcqs', count : 5, minutes : 10, difficulty : 'Mixed', instantFeedback : false })
        expect(created.status).toBe(201)
        expect(created.body).toMatchObject({ status : 'in_progress', total : 5, mode : 'practice', timeLimitSeconds : 600 })
        expect(created.body.questions).toHaveLength(5)
        expect(created.body.questions[0].answer).toBeUndefined()
        expect(created.body.questions[0].explanation).toBeUndefined()

        // Look up the real answers through the public bank
        const bank = (await agent().get('/courses/cs201/questions').query({ limit : 50 })).body.items
        const answerOf = (id : string) => bank.find((item : any) => item.id === id).answer
        const [a, b, c] = created.body.questions
        const answers = { [a.id] : answerOf(a.id), [b.id] : answerOf(b.id), [c.id] : (answerOf(c.id) + 1) % c.options.length }

        // Autosave, then resume
        await client.put(`/tests/${created.body.id}/answers`).send({ answers : { [a.id] : answerOf(a.id) } })
        expect((await client.get(`/tests/${created.body.id}`)).body.answers).toEqual({ [a.id] : answerOf(a.id) })

        const result = await client.post(`/tests/${created.body.id}/submit`).send({ answers })
        expect(result.status).toBe(200)
        expect(result.body).toMatchObject({ status : 'submitted', score : 2, correct : 2, incorrect : 1, skipped : 2, total : 5, percent : 40 })
        expect(result.body.questions[0]).toHaveProperty('answer')
        expect(result.body.questions[0]).toHaveProperty('explanation')
        expect(result.body.questions.map((question : any) => question.status)).toEqual(['correct', 'correct', 'incorrect', 'skipped', 'skipped'])
        expect(result.body.byTopic.length).toBeGreaterThan(0)
        expect(result.body.config).toMatchObject({ courseID : created.body.courseID, mode : 'mcqs', count : 5, minutes : 10 })

        // Submitting twice returns the same result instead of double counting
        const again = await client.post(`/tests/${created.body.id}/submit`).send({ answers : {} })
        expect(again.body.score).toBe(2)

        const history = await client.get('/me/tests')
        expect(history.body.items[0]).toMatchObject({ id : created.body.id, score : 2, total : 5, title : 'Mixed practice' })
        expect(history.body.items[0].missed).toHaveLength(3)

        const me = await client.get('/me')
        expect(me.body.stats).toMatchObject({ tests : 1, solved : 3 })

        const inbox = await client.get('/notifications')
        expect(inbox.body.items.some((item : any) => item.kind === 'result' && item.body.includes('2/5'))).toBe(true)
    })

    it('reveals answers up front when instant feedback is on', async () => {
        const { client } = await signup()
        const created = await client.post('/tests').send({ courseID : 'cs201', count : 3, instantFeedback : true })
        expect(created.body.questions[0].answer).toEqual(expect.any(Number))
    })

    it('filters by difficulty and explains when there is nothing to test', async () => {
        const { client } = await signup()
        const hard = await client.post('/tests').send({ courseID : 'cs201', count : 10, difficulty : 'Hard' })
        expect(hard.body.total).toBe(3)
        const empty = await client.post('/tests').send({ courseID : 'chem110', count : 10, difficulty : 'Hard', topics : [] })
        expect(empty.status).toBe(201)
        expect(empty.body.total).toBe(1)
    })

    it('sits a whole past paper', async () => {
        const { client } = await signup()
        const paper = await client.post('/tests').send({ courseID : 'cs201', mode : 'paper', year : 2023, minutes : 30 })
        expect(paper.body).toMatchObject({ mode : 'paper', year : 2023, title : '2023 past paper', total : 2 })
    })

    it('rejects answers for questions outside the test and other people\'s tests', async () => {
        const { client } = await signup()
        const other = await signup()
        const created = await client.post('/tests').send({ courseID : 'cs201', count : 2 })
        const bad = await client.post(`/tests/${created.body.id}/submit`).send({ answers : { '00000000-0000-0000-0000-000000000000' : 1 } })
        expect(bad.status).toBe(400)
        expect((await other.client.get(`/tests/${created.body.id}`)).status).toBe(403)
        expect((await agent().post('/tests').send({ courseID : 'cs201' })).status).toBe(401)
    })
})

describe('daily challenge', () => {
    it('can be played once a day and ranks players', async () => {
        const first = await signup({ firstName : 'Akua', lastName : 'Sarpong', school : 'KNUST' })
        const today = await first.client.get('/challenges/today')
        expect(today.body).toMatchObject({ questionCount : 5, minutes : 10, me : { status : 'not_started' } })

        const started = await first.client.post('/challenges/today/start')
        expect(started.status).toBe(201)
        expect(started.body.mode).toBe('challenge')
        expect(started.body.questions[0].answer).toBeUndefined()

        // Starting again resumes the same test
        expect((await first.client.post('/challenges/today/start')).body.id).toBe(started.body.id)

        const bank = (await agent().get(`/courses/${started.body.course.slug}/questions`).query({ limit : 50 })).body.items
        const answers = Object.fromEntries(started.body.questions.map((question : any) => [question.id, bank.find((item : any) => item.id === question.id).answer]))
        const result = await first.client.post(`/tests/${started.body.id}/submit`).send({ answers })
        expect(result.body).toMatchObject({ score : 5, rank : 1 })

        const replay = await first.client.post('/challenges/today/start')
        expect(replay.status).toBe(409)
        expect(replay.body.error.details.testID).toBe(started.body.id)

        const after = await first.client.get('/challenges/today')
        expect(after.body.me).toMatchObject({ status : 'done', score : 5, rank : 1 })
        expect(after.body.players).toBeGreaterThanOrEqual(1)

        const board = await first.client.get('/challenges/leaderboard').query({ period : 'today' })
        expect(board.body.entries[0]).toMatchObject({ name : 'Akua S.', initials : 'AS', school : 'KNUST', isMe : true })
        expect(board.body.entries[0].score).toBeGreaterThanOrEqual(500)
        expect(board.body.me.rank).toBe(1)

        const recent = await first.client.get('/challenges/recent')
        expect(recent.body.items[0]).toMatchObject({ score : 5, total : 5, rank : 1 })

        const streak = await first.client.get('/challenges/streak')
        expect(streak.body).toMatchObject({ current : 1, activeToday : true })
        expect(streak.body.week).toHaveLength(7)
    })

    it('shows seeded learners with multi-day streaks', async () => {
        const { login } = await import('./helpers.js')
        const client = await login('student@preproom.app')
        const stats = (await client.get('/me/stats')).body
        expect(stats.streak).toBeGreaterThanOrEqual(4)
        expect(stats.tests).toBeGreaterThanOrEqual(4)
    })
})
