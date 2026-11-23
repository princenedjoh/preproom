import { describe, expect, it } from 'vitest'
import { mailer } from '../src/lib/mailer'
import { agent, login, signup } from './helpers'

const courseId = async (slug : string) => (await agent().get(`/courses/${slug}`)).body.id

describe('admin access control', () => {
    it('keeps learners and anonymous users out', async () => {
        const { client } = await signup()
        expect((await client.get('/admin/overview')).status).toBe(403)
        expect((await agent().get('/admin/overview')).status).toBe(401)
    })

    it('scopes moderators to their courses', async () => {
        const efua = await login('efua.asante@preproom.app')   // PHY 104, ECON 101
        const me = (await efua.get('/auth/me')).body.user
        expect(new Set(me.courses)).toEqual(new Set([await courseId('phy104'), await courseId('econ101')]))
        expect((await (await login('ama.owusu@preproom.app')).get('/auth/me')).body.user.courses).toBeNull()
        const list = await efua.get('/admin/questions').query({ limit : 200 })
        const allowed = new Set([await courseId('phy104'), await courseId('econ101')])
        expect(list.body.items.length).toBeGreaterThan(0)
        expect(list.body.items.every((question : any) => allowed.has(question.courseID))).toBe(true)

        const cs = await courseId('cs201')
        const denied = await efua.post('/admin/questions').send({ question : 'Q?', options : ['a', 'b'], answer : 0, courseID : cs })
        expect(denied.status).toBe(403)
        expect((await efua.post('/admin/courses').send({ code : 'X 1', name : 'X' })).status).toBe(403)
        expect((await efua.get('/admin/people')).status).toBe(403)
    })
})

describe('question management', () => {
    it('creates, edits and soft-deletes questions with topic and paper metadata', async () => {
        const ama = await login('ama.owusu@preproom.app')
        const cs = await courseId('cs201')
        const created = await ama.post('/admin/questions').send({
            question : '<p>Which structure gives O(1) average lookup?</p>', options : ['Array', 'Hash table', 'BST', 'Linked list'],
            answer : 1, explanation : 'Hashing.', courseID : cs, topic : 'Hashing', difficulty : 'Easy', year : 2025, institution : 'knust',
        })
        expect(created.status).toBe(201)
        expect(created.body).toMatchObject({ topic : 'Hashing', institution : 'KNUST', author : 'Ama Owusu', flags : 0, answer : 1 })

        const badAnswer = await ama.post('/admin/questions').send({ question : 'Q', options : ['a', 'b'], answer : 2, courseID : cs })
        expect(badAnswer.status).toBe(400)

        const edited = await ama.patch(`/admin/questions/${created.body.id}`).send({ topic : 'Hash tables', difficulty : 'Medium' })
        expect(edited.body).toMatchObject({ topic : 'Hash tables', difficulty : 'Medium' })
        expect((await ama.patch(`/admin/questions/${created.body.id}`).send({ answer : 9 })).status).toBe(400)

        expect((await agent().get('/courses/cs201/questions').query({ search : 'O(1) average' })).body.total).toBe(1)
        expect((await ama.delete(`/admin/questions/${created.body.id}`)).status).toBe(204)
        expect((await agent().get('/courses/cs201/questions').query({ search : 'O(1) average' })).body.total).toBe(0)
    })

    it('bulk imports a paper', async () => {
        const admin = await login('admin@preproom.app')
        const ce = await courseId('ce210')
        const res = await admin.post('/admin/questions/bulk').send({ questions : [
            { question : 'NOT 0 = ?', options : ['0', '1'], answer : 1, courseID : ce, topic : 'Logic gates', year : 2020 },
            { question : 'NOT 1 = ?', options : ['0', '1'], answer : 0, courseID : ce, topic : 'Logic gates', year : 2020 },
        ] })
        expect(res.body.created).toBe(2)
        const papers = (await agent().get('/courses/ce210/papers')).body.items
        expect(papers.some((paper : any) => paper.year === 2020 && paper.questions === 2)).toBe(true)
    })

    it('manages the catalog and refuses to delete things in use', async () => {
        const admin = await login('admin@preproom.app')
        const school = await admin.post('/admin/schools').send({ name : 'School of Law' })
        const program = await admin.post('/admin/programs').send({ name : 'Law', schoolID : school.body.id })
        const course = await admin.post('/admin/courses').send({ code : 'LAW 101', name : 'Contract Law', programID : program.body.id, color : '#123456' })
        expect(course.body).toMatchObject({ slug : 'law101', code : 'LAW 101', programID : program.body.id })
        expect((await admin.post('/admin/courses').send({ code : 'LAW 101', name : 'Dup' })).status).toBe(409)
        const topic = await admin.post('/admin/topics').send({ name : 'Offer', courseID : course.body.id })
        expect(topic.status).toBe(201)
        expect((await admin.delete(`/admin/schools/${school.body.id}`)).status).toBe(409)
        expect((await admin.get('/admin/topics').query({ courseID : course.body.id })).body.items).toHaveLength(1)
    })
})

describe('flags', () => {
    it('resolves a wrong-answer flag by fixing the answer and tells the reporter', async () => {
        const learner = await signup()
        const [question] = (await learner.client.get('/courses/math152/questions')).body.items
        const newAnswer = (question.answer + 1) % question.options.length
        const flag = await learner.client.post(`/questions/${question.id}/flags`).send({ issue : 'Wrong answer', suggestedAnswer : newAnswer })

        const kofi = await login('kofi.mensah@preproom.app')
        const queue = await kofi.get('/admin/flags').query({ status : 'open' })
        expect(queue.body.items.some((item : any) => item.id === flag.body.id)).toBe(true)
        expect(queue.body.counts.open).toBeGreaterThan(0)

        const resolved = await kofi.patch(`/admin/flags/${flag.body.id}`).send({ status : 'resolved', applyAnswer : newAnswer, note : 'Good catch, fixed.' })
        expect(resolved.body).toMatchObject({ status : 'resolved', resolvedBy : 'Kofi Mensah', answer : newAnswer })
        expect((await agent().get(`/questions/${question.id}`)).body.answer).toBe(newAnswer)

        const inbox = (await learner.client.get('/notifications')).body.items
        expect(inbox.some((item : any) => item.kind === 'system' && item.body === 'Good catch, fixed.')).toBe(true)
    })
})

describe('people', () => {
    it('invites staff, who accept by setting a password', async () => {
        const admin = await login('admin@preproom.app')
        const econ = await courseId('econ101')
        const invited = await admin.post('/admin/people/invite').send({ name : 'Selorm Kpodo', email : 'selorm@preproom.app', role : 'moderator', courses : [econ] })
        expect(invited.status).toBe(201)
        expect(invited.body).toMatchObject({ name : 'Selorm Kpodo', role : 'moderator', status : 'invited', courses : [econ], questionsAdded : 0 })
        expect((await admin.post('/admin/people/invite').send({ name : 'Again', email : 'selorm@preproom.app', role : 'moderator' })).status).toBe(409)

        const token = mailer.outbox().at(-1)!.text.match(/token=([\w-]+)/)![1]
        expect((await agent().get('/auth/token').query({ token })).body.purpose).toBe('invite')
        const selorm = agent()
        const accepted = await selorm.post('/auth/reset').send({ token, password : 'moderate me' })
        expect(accepted.body.user).toMatchObject({ role : 'moderator', status : 'active' })
        expect((await selorm.get('/admin/questions')).status).toBe(200)

        const adminInbox = (await admin.get('/notifications')).body.items
        expect(adminInbox.some((item : any) => item.kind === 'people' && item.body.includes('Selorm'))).toBe(true)

        const promoted = await admin.patch(`/admin/people/${invited.body.id}`).send({ role : 'supervisor', courses : [] })
        expect(promoted.body).toMatchObject({ role : 'supervisor', courses : [] })
        expect((await admin.delete(`/admin/people/${invited.body.id}`)).status).toBe(204)
        expect((await selorm.get('/admin/questions')).status).toBe(403)
    })

    it('never removes the last admin', async () => {
        const admin = await login('admin@preproom.app')
        const me = (await admin.get('/auth/me')).body.user
        expect((await admin.patch(`/admin/people/${me.id}`).send({ role : 'supervisor' })).status).toBe(400)
    })
})

describe('overview', () => {
    it('summarises activity for the dashboard', async () => {
        const admin = await login('admin@preproom.app')
        const res = await admin.get('/admin/overview')
        expect(res.status).toBe(200)
        expect(res.body.weeklyActivity).toHaveLength(14)
        expect(res.body.questions.total).toBeGreaterThan(30)
        expect(res.body.recentQuestions.length).toBeGreaterThan(0)
        expect(res.body.courses.find((course : any) => course.code === 'CS 201').questions).toBeGreaterThanOrEqual(8)
    })
})

describe('question acceptance stats', () => {
    it('reports first-answer acceptance and sorts by it', async () => {
        const ama = await login('ama.owusu@preproom.app')
        const chem = await courseId('chem110')
        const created = await ama.post('/admin/questions').send({ question : 'Stats probe?', options : ['a', 'b', 'c'], answer : 1, courseID : chem })
        expect(created.body.stats).toEqual({ attempts : 0, correctRate : null })

        const { client : first } = await signup()
        await first.post(`/questions/${created.body.id}/attempts`).send({ choice : 0 })
        await first.post(`/questions/${created.body.id}/attempts`).send({ choice : 1 })   // retry ignored
        const { client : second } = await signup()
        await second.post(`/questions/${created.body.id}/attempts`).send({ choice : 1 })

        const one = await ama.get(`/admin/questions/${created.body.id}`)
        expect(one.body.stats).toEqual({ attempts : 2, correctRate : 0.5 })
        expect(one.body).not.toHaveProperty('statsAttempts')

        for (const sort of ['acceptance', '-acceptance']) {
            const list = await ama.get('/admin/questions').query({ courseID : chem, sort, limit : 200 })
            const rates = list.body.items.map((item : any) => item.stats.correctRate)
            const known = rates.filter((rate : number | null) => rate !== null)
            expect(rates.slice(0, known.length)).toEqual(known)   // unanswered last
            const sorted = [...known].sort((a, b) => sort === 'acceptance' ? a - b : b - a)
            expect(known).toEqual(sorted)
        }
        expect((await ama.get('/admin/questions').query({ sort : 'bogus' })).status).toBe(400)
    })
})
