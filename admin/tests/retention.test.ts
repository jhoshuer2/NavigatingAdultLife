import { expect, it } from 'vitest'
import { purge } from '../server/retention'
import { batch, ev, freshDb, newGen, NG_HEADERS } from './helpers'
import { ingest } from '../server/ingest'

it('purges raw events after 90 days but keeps summaries, and can purge old audit rows', async () => {
  const db = await freshDb(); const g = newGen()
  const old = new Date('2026-01-01T00:00:00Z'), now = new Date('2026-06-01T00:00:00Z')
  await ingest(db, batch([ev(g, 'heartbeat', { active_seconds: 30, screen: 'play' }, old)]), NG_HEADERS(), old)
  await db.query("INSERT INTO audit_log (action, at) VALUES ('old', '2020-01-01'), ('new', $1)", [now.toISOString()])
  await purge(db, now)
  expect((await db.query<any>('SELECT count(*)::int n FROM raw_events')).rows[0].n).toBe(0)
  expect((await db.query<any>('SELECT count(*)::int n FROM device_days')).rows[0].n).toBe(1)
  expect((await db.query<any>('SELECT action FROM audit_log')).rows.map((r: any) => r.action)).toEqual(['new'])
  await expect(db.query('DELETE FROM audit_log')).rejects.toThrow(/append-only/)
})
