import { describe, expect, it } from 'vitest'
import { mailer } from '../src/lib/mailer'
import { agent, login, signup } from './helpers'

describe('auth', () => {
    it('signs up, keeps the session in an httpOnly cookie and logs out', async () => {
        const client = agent()
        const res = await client.post('/auth/signup').send({ firstName : 'Abena', lastName : 'Darko', email : 'Abena@Example.com', password : 'long enough' })
        expect(res.status).toBe(201)
        expect(res.body.user).toMatchObject({ email : 'abena@example.com', name : 'Abena Darko', initials : 'AD', role : 'student' })
        expect(res.body.user.passwordHash).toBeUndefined()
        expect(res.headers['set-cookie'][0]).toMatch(/preproom_session=.+HttpOnly/)

        expect((await client.get('/auth/me')).status).toBe(200)
        expect((await client.post('/auth/logout')).status).toBe(204)
        expect((await client.get('/auth/me')).status).toBe(401)
    })

    it('rejects duplicate emails regardless of case', async () => {
        const res = await agent().post('/auth/signup').send({ firstName : 'X', email : 'STUDENT@preproom.app', password : 'long enough' })
        expect(res.status).toBe(409)
    })

    it('validates input', async () => {
        const res = await agent().post('/auth/signup').send({ firstName : 'X', email : 'not-an-email', password : 'short' })
        expect(res.status).toBe(400)
        expect(res.body.error.code).toBe('validation_error')
    })

    it('gives the same error for a wrong password and an unknown email', async () => {
        const wrong = await agent().post('/auth/login').send({ email : 'student@preproom.app', password : 'nope nope' })
        const unknown = await agent().post('/auth/login').send({ email : 'nobody@preproom.app', password : 'nope nope' })
        expect(wrong.status).toBe(401)
        expect(unknown.status).toBe(401)
        expect(wrong.body.error.message).toBe(unknown.body.error.message)
    })

    it('refuses non-JSON writes (CSRF guard)', async () => {
        const res = await agent().post('/auth/login').type('form').send('email=student@preproom.app&password=preproom123')
        expect(res.status).toBe(415)
    })

    it('resets a password through the emailed link and signs out other devices', async () => {
        const { client, email } = await signup()
        expect((await agent().post('/auth/forgot').send({ email })).status).toBe(202)
        const mail = mailer.outbox().at(-1)!
        expect(mail.to).toBe(email)
        const token = mail.text.match(/token=([\w-]+)/)![1]

        const info = await agent().get('/auth/token').query({ token })
        expect(info.body).toMatchObject({ purpose : 'reset', email })

        const fresh = agent()
        const reset = await fresh.post('/auth/reset').send({ token, password : 'a brand new one' })
        expect(reset.status).toBe(200)
        expect((await fresh.get('/auth/me')).status).toBe(200)
        expect((await client.get('/auth/me')).status).toBe(401)
        // Single use
        expect((await agent().post('/auth/reset').send({ token, password : 'another one!' })).status).toBe(410)
        await login(email, 'a brand new one')
    })

    it('does not reveal whether an email exists on forgot-password', async () => {
        const res = await agent().post('/auth/forgot').send({ email : 'ghost@nowhere.com' })
        expect(res.status).toBe(202)
    })
})

describe('profile', () => {
    it('updates profile fields and notification prefs', async () => {
        const { client } = await signup()
        const res = await client.patch('/me').send({ name : 'Kojo Antwi Mensah', school : 'UG', level : 'Level 300' })
        expect(res.body.user).toMatchObject({ firstName : 'Kojo', lastName : 'Antwi Mensah', school : 'UG', level : 'Level 300' })
        const prefs = await client.patch('/me/prefs').send({ weeklyReport : true })
        expect(prefs.body.prefs).toEqual({ dailyReminder : true, replies : true, weeklyReport : true })
        expect((await client.patch('/me').send({ timezone : 'Not/AZone' })).status).toBe(400)
    })

    it('changes password and deletes the account', async () => {
        const { client, email } = await signup()
        expect((await client.post('/me/password').send({ currentPassword : 'wrong', newPassword : 'whatever123' })).status).toBe(401)
        expect((await client.post('/me/password').send({ currentPassword : 'correct horse', newPassword : 'whatever123' })).status).toBe(204)
        expect((await client.delete('/me').send({ password : 'whatever123' })).status).toBe(204)
        expect((await agent().post('/auth/login').send({ email, password : 'whatever123' })).status).toBe(401)
    })
})
