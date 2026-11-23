import { drizzle } from 'drizzle-orm/node-postgres'
import { getTableName, sql, type Column } from 'drizzle-orm'
import pg from 'pg'
import { config } from '../config'
import * as schema from './schema'

export const pool = new pg.Pool({ connectionString : config.DATABASE_URL, max : 10 })

export const db = drizzle(pool, { schema, casing : 'snake_case' })
export type Db = typeof db
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]
export type DbOrTx = Db | Tx

// Fully qualified column reference for correlated subqueries. Drizzle leaves
// columns unqualified in single-table selects, so `${courses.id}` inside a
// subquery over another table with an "id" column would bind to the wrong one.
export const outer = (column : Column) => sql.raw(`"${getTableName(column.table)}"."${column.name}"`)
