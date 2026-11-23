import express, { type ErrorRequestHandler, type RequestHandler } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { config } from './config'
import { pool } from './db/client'
import { HttpError } from './lib/errors'
import { logger } from './lib/logger'
import { loadSession } from './middleware/auth'
import { adminRouter } from './routes/admin'
import { authRouter } from './routes/auth'
import { catalogRouter } from './routes/catalog'
import { challengesRouter } from './routes/challenges'
import { meRouter } from './routes/me'
import { notificationsRouter } from './routes/notifications'
import { questionsRouter } from './routes/questions'
import { testsRouter } from './routes/tests'

// Cookie-authenticated writes must be JSON. Browsers cannot send JSON cross-site
// without a CORS preflight, so this (plus SameSite=Lax) blocks CSRF.
const requireJsonBody : RequestHandler = (req, _res, next) => {
    const hasBody = Number(req.headers['content-length'] ?? 0) > 0 || req.headers['transfer-encoding'] !== undefined
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && hasBody && !req.is('application/json')) {
        throw new HttpError(415, 'unsupported_media_type', 'Send the request body as application/json')
    }
    next()
}

export const createApp = () => {
    const app = express()
    app.set('trust proxy', 1)
    app.disable('x-powered-by')

    app.use(helmet())
    app.use(cors({
        origin : (origin, callback) => callback(null, !origin || config.corsOrigins.includes(origin)),
        credentials : true,
    }))
    if (!config.isTest) {
        app.use(pinoHttp({
            logger,
            autoLogging : { ignore : (req) => req.url === '/health' },
            serializers : {
                req : (req) => ({ method : req.method, url : req.url }),
                res : (res) => ({ status : res.statusCode }),
            },
        }))
    }
    app.use(requireJsonBody)
    app.use(express.json({ limit : '1mb' }))
    app.use(cookieParser())
    app.use(loadSession)

    app.get('/health', async (_req, res) => {
        await pool.query('select 1')
        res.json({ ok : true })
    })

    app.use('/auth', authRouter)
    app.use('/me', meRouter)
    app.use('/', catalogRouter)
    app.use('/questions', questionsRouter)
    app.use('/tests', testsRouter)
    app.use('/challenges', challengesRouter)
    app.use('/notifications', notificationsRouter)
    app.use('/admin', adminRouter)

    app.use((req, _res) => {
        throw new HttpError(404, 'not_found', `No route for ${req.method} ${req.path}`)
    })

    const errorHandler : ErrorRequestHandler = (error, req, res, _next) => {
        if (error instanceof HttpError) {
            res.status(error.status).json({ error : { code : error.code, message : error.message, details : error.details } })
            return
        }
        if (error?.type === 'entity.parse.failed') {
            res.status(400).json({ error : { code : 'invalid_json', message : 'The request body is not valid JSON' } })
            return
        }
        if (error?.type === 'entity.too.large') {
            res.status(413).json({ error : { code : 'too_large', message : 'The request body is too large' } })
            return
        }
        logger.error({ err : error, method : req.method, url : req.originalUrl }, 'Unhandled error')
        res.status(500).json({ error : { code : 'internal', message : 'Something went wrong on our side' } })
    }
    app.use(errorHandler)
    return app
}
