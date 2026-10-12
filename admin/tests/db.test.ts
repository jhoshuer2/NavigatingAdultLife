import { expect, it } from 'vitest'
import { memoryDb } from '../server/db'
it('migrates and keeps audit_log append-only', async () => {
  const db = await memoryDb()
  await db.query("INSERT INTO audit_log (action) VALUES ('x')")
  await expect(db.query("DELETE FROM audit_log")).rejects.toThrow(/append-only/)
  await expect(db.query("UPDATE audit_log SET action='y'")).rejects.toThrow(/append-only/)
})

it('migrate is idempotent and safe to run twice concurrently', async () => {
  const { migrate } = await import('../server/db')
  const db = await memoryDb()
  await Promise.all([migrate(db), migrate(db)])
  expect((await db.query<any>('SELECT count(*)::int n FROM schema_migrations')).rows[0].n).toBe(3)
})
