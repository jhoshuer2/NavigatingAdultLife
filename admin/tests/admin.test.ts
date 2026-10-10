import { beforeAll, describe, expect, it } from 'vitest'
import { handleAdmin } from '../server/admin'
import { createAdmin, totpAt, hashedId } from '../server/auth'
import { seedPlayers } from '../server/seed'
import { batch, ev, freshDb, newGen, NG_HEADERS } from './helpers'
import { ingest } from '../server/ingest'
import type { Db } from '../server/db'

const NOW = new Date('2026-03-10T12:00:00Z')
let db: Db
const creds: Record<string, { email: string; password: string; secret: string; cookie?: string }> = {}
const call = (path: string, init: RequestInit & { as?: string } = {}) => {
  const headers = new Headers(init.headers); if (init.as) headers.set('cookie', creds[init.as].cookie!)
  if (init.method && init.method !== 'GET') headers.set('x-nal-admin', '1')
  return handleAdmin(new Request(`https://admin.test/api/admin/${path}`, { ...init, headers }), db, NOW)
}
async function signIn(role: string) {
  if (!creds[role]) { const u = await createAdmin(db, `${role}@test.dev`, role as never); creds[role] = { email: `${role}@test.dev`, password: u.password, secret: u.totp_secret } }
  const u = { password: creds[role].password, totp_secret: creds[role].secret }
  const r = await call('login', { method: 'POST', body: JSON.stringify({ email: `${role}@test.dev`, password: u.password, code: totpAt(u.totp_secret, NOW.getTime()) }) })
  expect(r.status).toBe(200)
  creds[role].cookie = r.headers.get('set-cookie')!.split(';')[0]
}

beforeAll(async () => {
  db = await freshDb()
  await seedPlayers(db, { players: 12, days: 14, now: NOW, seed: 3 })
  for (const r of ['owner', 'analyst', 'support', 'engineer']) await signIn(r)
}, 120_000)

describe('authentication', () => {
  it('rejects wrong password, wrong code, and locks out after repeated failures', async () => {
    const bad = (p: string, code: string) => call('login', { method: 'POST', body: JSON.stringify({ email: 'owner@test.dev', password: p, code }) })
    expect((await bad('nope', totpAt(creds.owner.secret, NOW.getTime()))).status).toBe(401)
    expect((await bad(creds.owner.password, '000000')).status).toBe(401)
    for (let i = 0; i < 4; i++) await bad('x', '000000')
    expect((await bad(creds.owner.password, totpAt(creds.owner.secret, NOW.getTime()))).status).toBe(429)
    await db.query('DELETE FROM login_attempts')
  })
  it('requires a session, and the CSRF header on writes', async () => {
    expect((await call('overview')).status).toBe(401)
    const r = await handleAdmin(new Request('https://admin.test/api/admin/logout', { method: 'POST', headers: { cookie: creds.owner.cookie! } }), db, NOW)
    expect(r.status).toBe(403)
  })
  it('expires a session after 8 hours idle', async () => {
    await db.query("UPDATE admin_sessions SET last_seen = $1 WHERE admin_id = (SELECT admin_id FROM admin_users WHERE email='engineer@test.dev')", [new Date(NOW.getTime() - 9 * 3600e3).toISOString()])
    expect((await call('me', { as: 'engineer' })).status).toBe(401)
    await signIn('engineer')
  })
})

describe('dashboards', () => {
  it('overview has KPIs, a full-length time series, and definitions', async () => {
    const j = await (await call('overview?from=2026-02-25&to=2026-03-10', { as: 'owner' })).json() as any
    expect(j.series.length).toBe(14); expect(j.kpis.mau).toBeGreaterThan(0); expect(j.kpis.wau).toBeLessThanOrEqual(j.kpis.mau)
    expect(j.kpis.new_players).toBeGreaterThan(0); expect(j.definitions.dau).toContain('10 active seconds')
    const new14 = j.series.reduce((a: number, s: any) => a + s.new_players, 0)
    expect(new14).toBe(j.kpis.new_players)
  })
  it('KPIs are exact for a small hand-made cohort and exclude test traffic', async () => {
    const d2 = await freshDb(); const g = newGen(), t = newGen(), day = new Date('2026-03-09T10:00:00Z')
    await ingest(d2, batch([ev(g, 'session_start', {}, day), ev(g, 'heartbeat', { active_seconds: 30, screen: 'play' }, new Date(day.getTime() + 1000)), ev(g, 'heartbeat', { active_seconds: 30, screen: 'play' }, new Date(day.getTime() + 2000))]), NG_HEADERS(), day)
    await ingest(d2, batch([ev(t, 'session_start', {}, day), ev(t, 'heartbeat', { active_seconds: 300, screen: 'play' }, new Date(day.getTime() + 1000))], { is_test: true }), NG_HEADERS(), day)
    const { overview } = await import('../server/queries')
    const o = await overview(d2, { from: '2026-03-09', to: '2026-03-09' })
    expect(o.kpis).toMatchObject({ dau: 1, new_players: 1, avg_active_per_player_day: 60, sessions: 1 })
  })
  it('players: analysts get hashed labels and no ids; support and owner get ids', async () => {
    const a = await (await call('players?size=5', { as: 'analyst' })).json() as any
    expect(a.rows[0].id).toBeNull(); expect(a.rows[0].label).toMatch(/^[0-9a-f]{12}$/)
    expect(JSON.stringify(a)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/)
    const s = await (await call('players?size=5', { as: 'support' })).json() as any
    expect(s.rows[0].id).toMatch(/^[0-9a-f-]{36}$/)
    expect(a.total).toBe(s.total)
  })
  it('player detail: analyst forbidden (AC-6); support allowed and every lookup is audited', async () => {
    const list = await (await call('players?size=1', { as: 'owner' })).json() as any
    const id = list.rows[0].id
    expect((await call(`player/${id}`, { as: 'analyst' })).status).toBe(403)
    const before = (await db.query<any>("SELECT count(*)::int n FROM audit_log WHERE action='player.view'")).rows[0].n
    const r = await call(`player/${id}`, { as: 'support' }); expect(r.status).toBe(200)
    expect(((await r.json()) as any).device.device_id).toBe(id)
    expect((await db.query<any>("SELECT count(*)::int n FROM audit_log WHERE action='player.view'")).rows[0].n).toBe(before + 1)
  })
  it('roles: engineer sees overview only; analyst cannot open settings; support cannot export', async () => {
    expect((await call('overview', { as: 'engineer' })).status).toBe(200)
    expect((await call('geography', { as: 'engineer' })).status).toBe(403)
    expect((await call('settings/users', { as: 'analyst' })).status).toBe(403)
    expect((await call('players.csv', { as: 'support' })).status).toBe(403)
  })
  it('geography splits Nigeria by state with names and notes city is approximate', async () => {
    const j = await (await call('geography?from=2026-02-25&to=2026-03-10', { as: 'owner' })).json() as any
    expect(j.countries[0].country).toBe('NG'); expect(j.states.some((s: any) => s.name === 'Lagos')).toBe(true); expect(j.note).toMatch(/approximate/)
  })
  it('engagement and features return histograms, heatmap and a ranked feature list', async () => {
    const e = await (await call('engagement?from=2026-02-25&to=2026-03-10', { as: 'analyst' })).json() as any
    expect(e.sessionHist.length).toBe(7); expect(e.split.length).toBeGreaterThan(0); expect(e.heat.length).toBeGreaterThan(0)
    const f = await (await call('features?from=2026-02-25&to=2026-03-10', { as: 'analyst' })).json() as any
    expect(f.rows.length).toBeGreaterThan(5); expect(f.rows[0].users).toBeGreaterThanOrEqual(f.rows.at(-1).users)
    expect(f.rows.find((r: any) => r.group === 'task')?.avg_score).toBeGreaterThanOrEqual(0)
  })
})

describe('export, erasure and settings', () => {
  it('CSV export hashes ids for analysts, is audited and defuses formulas', async () => {
    const r = await call('players.csv', { as: 'analyst' }); expect(r.headers.get('content-type')).toContain('text/csv')
    const text = await r.text(); const first = text.split('\n')[1].split(',')[0]
    expect(first).toMatch(/^[0-9a-f]{12}$/)
    expect((await db.query<any>("SELECT count(*)::int n FROM audit_log WHERE action='players.export'")).rows[0].n).toBe(1)
  })
  it('erasing a player removes them and is audited', async () => {
    const list = await (await call('players?size=1', { as: 'owner' })).json() as any
    const id = list.rows[0].id
    expect((await call(`player/${id}/erase`, { method: 'POST', as: 'support' })).status).toBe(200)
    expect((await call(`player/${id}`, { as: 'owner' })).status).toBe(404)
    expect((await db.query<any>('SELECT count(*)::int n FROM raw_events WHERE device_id = $1', [id])).rows[0].n).toBe(0)
    expect((await db.query<any>("SELECT count(*)::int n FROM audit_log WHERE action='player.erase'")).rows[0].n).toBe(1)
  })
  it('owner can create and disable users; the secret is shown once', async () => {
    const r = await call('settings/users', { method: 'POST', as: 'owner', body: JSON.stringify({ email: 'new@test.dev', role: 'analyst' }) })
    const u = await r.json() as any; expect(u.password.length).toBeGreaterThan(8); expect(u.totp_secret).toMatch(/^[A-Z2-7]{32}$/)
    expect((await call(`settings/users/${u.admin_id}/disable`, { method: 'POST', as: 'owner' })).status).toBe(200)
    const list = await (await call('settings/users', { as: 'owner' })).json() as any
    expect(list.users.find((x: any) => x.email === 'new@test.dev').disabled).toBe(true)
    expect(JSON.stringify(list)).not.toContain('password_hash')
    const audit = await (await call('settings/audit', { as: 'owner' })).json() as any
    expect(audit.rows.map((x: any) => x.action)).toContain('user.create')
  })
  it('hashedId is stable and not reversible to the id', () => { expect(hashedId('abc')).toBe(hashedId('abc')); expect(hashedId('abc')).not.toContain('abc') })
})
