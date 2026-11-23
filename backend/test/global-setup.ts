import { execSync } from 'node:child_process'

// Fresh schema + seed once per run
export default function setup() {
    const env = {
        ...process.env,
        NODE_ENV : 'test',
        DATABASE_URL : process.env.TEST_DATABASE_URL ?? 'postgres://localhost:5432/preproom_test',
    }
    for (const script of ['src/db/reset.ts', 'src/db/migrate.ts', 'src/db/seed.ts']) {
        execSync(`npx tsx ${script}`, { env, stdio : 'pipe' })
    }
}
