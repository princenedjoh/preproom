import { describe, expect, it } from 'vitest'
import { agent, login, signup } from './helpers'

describe('catalog and question bank', () => {
    it('lists courses with question counts, publicly', async () => {
        const res = await agent().get('/courses')
        expect(res.status).toBe(200)
        const cs = res.body.items.find((course : any) => course.slug === 'cs201')
        expect(cs).toMatchObject({ code : 'CS 201', name : 'Data Structures', questions : 8, progress : 0 })
    })

    it('returns course details by slug with topics and papers', async () => {
        const res = await agent().get('/courses/cs201')
        expect(res.status).toBe(200)
        expect(res.body.topics.map((topic : any) => topic.name)).toEqual(expect.arrayContaining(['Trees', 'Graphs']))
        expect(res.body.papers[0]).toHaveProperty('year')
        expect((await agent().get('/courses/nope')).status).toBe(404)
    })

    it('filters, searches, sorts and paginates questions', async () => {
        const hard = await agent().get('/courses/cs201/questions').query({ difficulty : 'Hard' })
        expect(hard.body.total).toBe(3)
        expect(hard.body.items.every((question : any) => question.difficulty === 'Hard')).toBe(true)

        const trees = await agent().get('/courses/cs201/questions').query({ topic : 'Trees' })
        expect(trees.body.items.every((question : any) => question.topic === 'Trees')).toBe(true)

        const search = await agent().get('/courses/cs201/questions').query({ search : 'dijkstra' })
        expect(search.body.total).toBe(1)

        const oldest = await agent().get('/courses/cs201/questions').query({ sort : 'oldest', limit : 2, offset : 0 })
        expect(oldest.body.items).toHaveLength(2)
        expect(oldest.body.items[0].year).toBeLessThanOrEqual(oldest.body.items[1].year)
        expect(oldest.body.total).toBe(8)

        const school = await agent().get('/courses/cs201/questions').query({ institution : 'ucc' })
        expect(school.body.items.every((question : any) => question.institution === 'UCC')).toBe(true)
    })

    it('records practice answers and tracks progress and streak', async () => {
        const { client } = await signup()
        const list = await client.get('/courses/cs201/questions')
        const question = list.body.items[0]
        const res = await client.post(`/questions/${question.id}/attempts`).send({ choice : question.answer })
        expect(res.body).toMatchObject({ correct : true, answer : question.answer })
        expect((await client.post(`/questions/${question.id}/attempts`).send({ choice : 99 })).status).toBe(400)

        const me = await client.get('/me')
        expect(me.body.stats).toMatchObject({ solved : 1, accuracy : 100, streak : 1, activeToday : true })
        const courses = await client.get('/courses')
        expect(courses.body.items.find((course : any) => course.slug === 'cs201').progress).toBe(13)

        const progress = await client.get('/me/progress')
        expect(progress.body.attempts[question.id]).toMatchObject({ choice : question.answer, correct : true, topic : question.topic })
        expect(progress.body.activeDays).toHaveLength(1)

        expect((await client.delete('/me/attempts').query({ courseID : 'cs201' })).status).toBe(204)
        expect((await client.get('/me')).body.stats.solved).toBe(0)
    })

    it('saves and unsaves questions', async () => {
        const { client } = await signup()
        const [question] = (await client.get('/courses/cs201/questions')).body.items
        const saved = await client.put(`/questions/${question.id}/save`)
        expect(saved.body).toEqual({ saved : true, saves : question.saves + 1 })
        expect((await client.put(`/questions/${question.id}/save`)).body.saves).toBe(question.saves + 1)
        expect((await client.get('/me/saved')).body.items.map((item : any) => item.id)).toEqual([question.id])
        expect((await client.get('/courses/cs201/questions').query({ saved : 'true' })).body.total).toBe(1)
        expect((await client.delete(`/questions/${question.id}/save`)).body).toEqual({ saved : false, saves : question.saves })
        expect((await agent().put(`/questions/${question.id}/save`)).status).toBe(401)
    })

    it('runs a discussion and notifies the other people in it', async () => {
        const first = await signup()
        const second = await signup({ firstName : 'Esi', lastName : 'Owusu' })
        const [question] = (await first.client.get('/courses/econ101/questions')).body.items
        const posted = await first.client.post(`/questions/${question.id}/comments`).send({ body : 'Is the sign important here?' })
        expect(posted.status).toBe(201)
        expect(posted.body.author.initials).toBe('TL')
        await second.client.post(`/questions/${question.id}/comments`).send({ body : 'Yes, demand slopes down.' })

        const thread = await agent().get(`/questions/${question.id}/comments`)
        expect(thread.body.items.map((item : any) => item.body)).toEqual(['Is the sign important here?', 'Yes, demand slopes down.'])
        expect((await agent().get('/courses/econ101/questions')).body.items.find((item : any) => item.id === question.id).discussions).toBe(2)

        const inbox = await first.client.get('/notifications').query({ filter : 'mentions' })
        expect(inbox.body.items[0]).toMatchObject({ kind : 'reply', title : 'Esi O. replied in a discussion', unread : true })

        // Only the author (or staff) may delete
        const id = posted.body.id
        expect((await second.client.delete(`/questions/${question.id}/comments/${id}`)).status).toBe(403)
        expect((await first.client.delete(`/questions/${question.id}/comments/${id}`)).status).toBe(204)
    })

    it('accepts one open report per learner and notifies staff for that course', async () => {
        const { client } = await signup()
        const [question] = (await client.get('/courses/phy104/questions')).body.items
        const report = await client.post(`/questions/${question.id}/flags`).send({ issue : 'Typo', comment : 'Units missing' })
        expect(report.status).toBe(201)
        expect((await client.post(`/questions/${question.id}/flags`).send({ issue : 'Typo' })).status).toBe(409)

        // Efua moderates PHY 104, Yaw does not
        const efua = await login('efua.asante@preproom.app')
        const yaw = await login('yaw.boateng@preproom.app')
        const efuaInbox = (await efua.get('/notifications')).body.items
        const yawInbox = (await yaw.get('/notifications')).body.items
        expect(efuaInbox.some((item : any) => item.kind === 'flag' && item.link === `/flags/${report.body.id}`)).toBe(true)
        expect(yawInbox.some((item : any) => item.link === `/flags/${report.body.id}`)).toBe(false)
    })
})

describe('notifications', () => {
    it('adds the daily challenge reminder once and marks things read', async () => {
        const { client } = await signup()
        const first = await client.get('/notifications')
        const reminders = first.body.items.filter((item : any) => item.kind === 'challenge')
        expect(reminders).toHaveLength(1)
        await client.get('/notifications')
        expect((await client.get('/notifications')).body.items.filter((item : any) => item.kind === 'challenge')).toHaveLength(1)
        expect(first.body.unread).toBe(1)

        expect((await client.post('/notifications/read').send({})).status).toBe(204)
        expect((await client.get('/notifications/unread-count')).body.unread).toBe(0)
    })

    it('respects the daily reminder preference', async () => {
        const { client } = await signup()
        await client.patch('/me/prefs').send({ dailyReminder : false })
        expect((await client.get('/notifications')).body.items).toHaveLength(0)
    })
})

describe('answer statistics', () => {
    it('counts each student once and only shows stats after answering', async () => {
        const list = await agent().get('/courses/econ101/questions').query({ limit : 1 })
        const question = list.body.items[0]
        const wrong = (question.answer + 1) % question.options.length

        const { client : first } = await signup()
        expect((await first.get(`/questions/${question.id}/stats`)).status).toBe(403)
        expect((await agent().get(`/questions/${question.id}/stats`)).status).toBe(401)

        const answered = await first.post(`/questions/${question.id}/attempts`).send({ choice : wrong })
        const base = answered.body.stats.attempts
        expect(base).toBeGreaterThanOrEqual(1)
        // retrying does not change the count
        await first.post(`/questions/${question.id}/attempts`).send({ choice : question.answer })
        const { client : second } = await signup()
        await second.post(`/questions/${question.id}/attempts`).send({ choice : question.answer })

        const stats = (await second.get(`/questions/${question.id}/stats`)).body
        expect(stats.attempts).toBe(base + 1)
        expect(stats.options).toHaveLength(question.options.length)
        expect(stats.options.reduce((sum : number, share : number) => sum + share, 0)).toBeCloseTo(1, 2)
        expect(stats.correctRate).toBeGreaterThan(0)

        const mine = await second.get('/courses/econ101/questions').query({ limit : 1 })
        expect(mine.body.items[0].stats).toEqual(stats)
        const other = await second.get('/courses/econ101/questions').query({ limit : 2, offset : 1 })
        expect(other.body.items.some((item : any) => 'stats' in item)).toBe(false)
        expect(other.body.items.every((item : any) => 'acceptance' in item)).toBe(true)

        const anonymous = await agent().get('/courses/econ101/questions').query({ limit : 1 })
        expect(anonymous.body.items[0].acceptance).toEqual({ attempts : stats.attempts, correctRate : stats.correctRate })
        expect(anonymous.body.items[0]).not.toHaveProperty('stats')
    })
})
