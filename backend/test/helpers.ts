import request from 'supertest'
import { randomUUID } from 'node:crypto'
import { createApp } from '../src/app'

export const app = createApp()
export const PASSWORD = 'preproom123'

export const agent = () => request.agent(app)

export const login = async (email : string, password = PASSWORD) => {
    const client = agent()
    const res = await client.post('/auth/login').send({ email, password })
    if (res.status !== 200) throw new Error(`login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`)
    return client
}

export const signup = async (overrides : Record<string, unknown> = {}) => {
    const client = agent()
    const email = `learner-${randomUUID().slice(0, 8)}@example.com`
    const res = await client.post('/auth/signup').send({ firstName : 'Test', lastName : 'Learner', email, password : 'correct horse', ...overrides })
    if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`)
    return { client, user : res.body.user, email }
}
