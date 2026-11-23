import path from 'node:path'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db, pool } from './client'

export const runMigrations = () => migrate(db, { migrationsFolder : path.join(__dirname, '../../drizzle') })

if (require.main === module) {
    runMigrations()
        .then(() => console.log('Migrations applied'))
        .catch((error) => { console.error(error); process.exitCode = 1 })
        .finally(() => pool.end())
}
