import { config } from './config'
import { pool } from './db/client'
import { logger } from './lib/logger'
import { createApp } from './app'

const server = createApp().listen(config.PORT, () => {
    logger.info(`PrepRoom API listening on http://localhost:${config.PORT}`)
})

const shutdown = (signal : string) => {
    logger.info(`${signal} received, shutting down`)
    server.close(() => pool.end().finally(() => process.exit(0)))
    setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
