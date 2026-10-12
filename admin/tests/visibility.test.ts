import { beforeAll, describe, expect, it } from 'vitest'
import { handleAdmin } from '../server/admin'
import { createAdmin, totpAt } from '../server/auth'
import { ingest } from '../server/ingest'
import { batch, ev, freshDb, newGen, NG_HEADERS } from './helpers'
import type { Db } from '../server/db'

const NOW = new Date()
let db: Db; const cookie: Record<string, string> = {}
const call = (path: string, as: string) => handleAdmin(new Request(`https://admin.test/api/admin/${path}`, { headers: { cookie: cookie[as] } }), db, NOW)
const range = `from=${new Date(NOW.getTime() - 5 * 864e5).toISOString().slice(0, 10)}&to=${NOW.toISOString().slice(0, 10)}`

beforeAll(async () => {
  db = await freshDb()
  const real = [newGen(), newGen()], test = newGen()
  for (const g of real) await ingest(db, batch([ev(g, 'session_start', {}, NOW), ev(g, 'heartbeat', { active_seconds: 30, screen: 'play' }, NOW)]), NG_HEADERS(), NOW)
  await ingest(db, batch([ev(test, 'session_start', {}, NOW)], { is_test: true }), NG_HEADERS(), NOW)
  for (const role of ['owner', 'analyst']) {
    const u = await createAdmin(db, `${role}@t.dev`, role as never)
    const r = await handleAdmin(new Request('https://admin.test/api/admin/login', { method: 'POST', headers: { 'x-nal-admin': '1' }, body: JSON.stringify({ email: `${role}@t.dev`, password: u.password, code: totpAt(u.totp_secret, NOW.getTime()) }) }), db, NOW)
    cookie[role] = r.headers.get('set-cookie')!.split(';')[0]
  }
}, 60_000)

describe('seeing everyone', () => {
  it('Players lists real players only by default; the owner can include test devices, an analyst cannot', async () => {
    expect(((await (await call(`players?${range}`, 'owner')).json()) as any).total).toBe(2)
    const all = (await (await call(`players?${range}&include_test=1`, 'owner')).json()) as any
    expect(all.total).toBe(3); expect(all.rows.filter((r: any) => r.is_test).length).toBe(1)
    expect(((await (await call(`players?${range}&include_test=1`, 'analyst')).json()) as any).total).toBe(2)
  })
  it('collector health shows how many devices sent events each day, and how many were test devices', async () => {
    const j = (await (await call('settings/schema', 'owner')).json()) as any
    expect(j.ingest[0]).toMatchObject({ devices: 3, test_devices: 1 })
    expect(j.ingest[0].accepted).toBeGreaterThanOrEqual(5)
  })
})
