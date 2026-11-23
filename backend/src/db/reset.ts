import { config } from '../config'
import { pool } from './client'

// Drops every table so migrations and the seed can run from scratch. Never in production.
const reset = async () => {
    if (config.isProduction) throw new Error('Refusing to reset a production database')
    await pool.query('drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;')
    console.log(`Reset ${new URL(config.DATABASE_URL).pathname.slice(1)}`)
}

reset()
    .catch((error) => { console.error(error); process.exitCode = 1 })
    .finally(() => pool.end())
