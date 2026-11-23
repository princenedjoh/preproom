import { defineConfig } from 'vitest/config'

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://localhost:5432/preproom_test'

export default defineConfig({
    test : {
        globalSetup : './test/global-setup.ts',
        env : { NODE_ENV : 'test', DATABASE_URL : TEST_DATABASE_URL, LOG_LEVEL : 'silent' },
        // Files share one database
        fileParallelism : false,
        testTimeout : 20_000,
        hookTimeout : 60_000,
    },
})
