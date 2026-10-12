import { MIGRATIONS } from './schema'

export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }>
  /** Run a multi-statement script (migrations only; no parameters). */
  exec(sql: string): Promise<void>
  /** Run several statements atomically. */
  tx<R>(fn: (db: Db) => Promise<R>): Promise<R>
}

let current: Db | null = null
export const setDb = (db: Db | null) => { current = db }

/** Production: any Postgres via DATABASE_URL (Neon, Supabase, ...). Tests/dev call setDb() with PGlite instead. */
export async function getDb(): Promise<Db> {
  if (current) return current
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const { default: pg } = await import('pg')
  // TLS is always on for remote databases. Supabase signs with its own CA: paste it into DATABASE_SSL_CA (verified, preferred).
  // DATABASE_SSL=no-verify is an encrypted-but-unverified fallback for when the CA is not at hand.
  const ssl = /localhost|127\.0\.0\.1/.test(url) ? undefined
    : process.env.DATABASE_SSL_CA ? { ca: process.env.DATABASE_SSL_CA, rejectUnauthorized: true }
    : { rejectUnauthorized: process.env.DATABASE_SSL !== 'no-verify' }
  const pool = new pg.Pool({ connectionString: url, max: 3, ssl })
  const wrap = (c: { query: (s: string, p?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number | null }> }): Db => ({
    query: async (sql, params) => { const r = await c.query(sql, params); return { rows: r.rows as never[], rowCount: r.rowCount ?? 0 } },
    exec: async (sql) => { await c.query(sql) },
    tx: async () => { throw new Error('nested tx') },
  })
  const db: Db = {
    ...wrap(pool),
    tx: async (fn) => {
      const c = await pool.connect()
      try { await c.query('BEGIN'); const r = await fn(wrap(c)); await c.query('COMMIT'); return r } catch (e) { await c.query('ROLLBACK'); throw e } finally { c.release() }
    },
  }
  // Apply any pending migrations once per server instance, so a deploy that adds a table never needs a manual step.
  await migrate(db)
  current = db
  return current
}

export async function migrate(db: Db) {
  // One transaction under an advisory lock: several server instances may start at once (cold starts, deploys);
  // the later ones wait here, then find everything already applied.
  await db.tx(async (t) => {
    await t.query('SELECT pg_advisory_xact_lock(727001)')
    await t.query('CREATE TABLE IF NOT EXISTS schema_migrations (id int PRIMARY KEY, at timestamptz NOT NULL DEFAULT now())')
    const done = new Set((await t.query<{ id: number }>('SELECT id FROM schema_migrations')).rows.map((r) => r.id))
    for (const m of MIGRATIONS) {
      if (done.has(m.id)) continue
      await t.exec(m.sql); await t.query('INSERT INTO schema_migrations (id) VALUES ($1)', [m.id])
    }
  })
}

/** In-process Postgres (PGlite): no server, no account. Used by tests and the local dev server. */
export async function memoryDb(dataDir?: string): Promise<Db> {
  const { PGlite } = await import('@electric-sql/pglite')
  const pg = new PGlite(dataDir)
  await pg.waitReady
  const wrap = (c: { query: (s: string, p?: unknown[]) => Promise<{ rows: unknown[]; affectedRows?: number }>; exec: (s: string) => Promise<unknown> }): Db => ({
    exec: async (sql) => { await c.exec(sql) },
    query: async (sql, params) => { const r = await c.query(sql, params); return { rows: r.rows as never[], rowCount: r.affectedRows ?? r.rows.length } },
    tx: async () => { throw new Error('nested tx') },
  })
  const db: Db = {
    ...wrap(pg as never),
    tx: async (fn) => (await pg.transaction(async (t) => fn(wrap(t as never)))) as never,
  }
  await migrate(db)
  return db
}
