import 'dotenv/config'
import { z } from 'zod'

const bool = z.enum(['true', 'false']).transform((value) => value === 'true')

const schema = z.object({
    NODE_ENV : z.enum(['development', 'test', 'production']).default('development'),
    PORT : z.coerce.number().int().positive().default(3001),
    DATABASE_URL : z.string().min(1).default('postgres://localhost:5432/preproom'),
    // Comma-separated list of browser origins allowed to call the API with cookies
    CORS_ORIGINS : z.string().default('http://localhost:3000,http://localhost:3002'),
    // Where links in emails point (password reset, invites)
    APP_URL : z.string().url().default('http://localhost:3000'),
    SESSION_TTL_DAYS : z.coerce.number().int().positive().default(30),
    COOKIE_SECURE : bool.optional(),
    COOKIE_DOMAIN : z.string().optional(),
    LOG_LEVEL : z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
    console.error('Invalid environment configuration:', z.prettifyError(parsed.error))
    process.exit(1)
}

const env = parsed.data

export const config = {
    ...env,
    isProduction : env.NODE_ENV === 'production',
    isTest : env.NODE_ENV === 'test',
    corsOrigins : env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean),
    cookieSecure : env.COOKIE_SECURE ?? env.NODE_ENV === 'production',
}
