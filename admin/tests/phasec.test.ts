import { beforeAll, describe, expect, it } from 'vitest'
import { handleAdmin } from '../server/admin'
import { createAdmin, totpAt } from '../server/auth'
import { seedPlayers } from '../server/seed'
import { batch, ev, freshDb, newGen, NG_HEADERS } from './helpers'
import { ingest } from '../server/ingest'
import * as Q2 from '../server/queries2'
import type { Db } from '../server/db'

const NOW = new Date('2026-03-10T12:00:00Z')
const day = (d: string, h = 10) => new Date(`${d}T${String(h).padStart(2, '0')}:00:00Z`)
const hb = (g: any, at: Date, screen = 'play') => ev(g, 'heartbeat', { active_seconds: 30, screen, mode: 'world' }, at)

describe('funnel and retention (exact numbers)', () => {
  let db: Db
  beforeAll(async () => {
    db = await freshDb()
    const a = newGen(), b = newGen(), c = newGen(); a.life = b.life = '11111111-1111-4111-8111-111111111111'; b.life = '22222222-2222-4222-8222-222222222222'
    // a: goes all the way to paywall and returns next day; b: creates then stops; c: only opens the game
    await ingest(db, batch([ev(a, 'session_start', {}, day('2026-03-01')), ev(a, 'create_completed', { archetype: 'x' }, day('2026-03-01', 11)), ev(a, 'place_entered', { place: 'home' }, day('2026-03-01', 12)), ev(a, 'task_completed', { task: 'study', perf: 0.5 }, day('2026-03-01', 13)), ev(a, 'year_ended', { age: 19 }, day('2026-03-01', 14)), hb(a, day('2026-03-01', 14)), ev(a, 'paywall_seen', {}, day('2026-03-01', 15))]), NG_HEADERS(), day('2026-03-01', 16))
    await ingest(db, batch([ev(a, 'session_start', {}, day('2026-03-02')), hb(a, day('2026-03-02'))]), NG_HEADERS(), day('2026-03-02', 11))
    await ingest(db, batch([ev(b, 'session_start', {}, day('2026-03-01')), ev(b, 'create_completed', { archetype: 'x' }, day('2026-03-01', 11)), hb(b, day('2026-03-01'))]), NG_HEADERS(), day('2026-03-01', 12))
    await ingest(db, batch([ev(c, 'session_start', {}, day('2026-03-08')), hb(c, day('2026-03-08'))]), NG_HEADERS(), day('2026-03-08', 12))
  })
  it('counts each step only for players who did every earlier step', async () => {
    const r = await Q2.funnel(db, { from: '2026-03-01', to: '2026-03-10' })
    expect(r.rows.map((x) => x.count)).toEqual([3, 2, 1, 1, 1, 1, 1, 0])
    expect(r.rows[1].of_start_pct).toBe(66.7)
  })
  it('does not count mock top-ups as a top-up step', async () => {
    const g = newGen(); await ingest(db, batch([ev(g, 'topup_completed', { currency: 'MOCK', amount: 0 }, day('2026-03-09'))]), NG_HEADERS(), day('2026-03-09', 12))
    expect(n(await db.query("SELECT count(*)::int n FROM device_milestones WHERE step='topup'"))).toBe(0)
  })
  it('retention only measures cohorts old enough, by week', async () => {
    const r = await Q2.retention(db, { from: '2026-03-01', to: '2026-03-10' }, 'week', '2026-03-10')
    const wk1 = r.rows.find((x) => x.cohort === '2026-02-23')!
    expect(wk1.size).toBe(2); expect(wk1.values[0]).toBe(50)          // D1: a came back, b did not
    const wk2 = r.rows.find((x) => x.cohort === '2026-03-02')!   // c, first seen Mar 8: D1 measurable (0%), D14 too young
    expect(wk2.values[0]).toBe(0); expect(wk2.values[3]).toBeNull()
  })
  it('drop-off lists unfinished lives by age band', async () => {
    const r = await Q2.dropoff(db, { from: '2026-03-01', to: '2026-03-10' }, '2026-03-30')
    expect(r.quit.find((q) => q.label === '10–19')?.lives).toBe(1)
  })
})
const n = (r: any) => r.rows[0].n

describe('Phase C API', () => {
  let db: Db; const creds: Record<string, string> = {}
  const call = (path: string, as?: string) => handleAdmin(new Request(`https://admin.test/api/admin/${path}`, { headers: as ? { cookie: creds[as] } : {} }), db, NOW)
  beforeAll(async () => {
    db = await freshDb(); await seedPlayers(db, { players: 14, days: 14, now: NOW, seed: 5 })
    for (const role of ['owner', 'analyst', 'support', 'engineer']) {
      const u = await createAdmin(db, `${role}@t.dev`, role as never)
      const r = await handleAdmin(new Request('https://admin.test/api/admin/login', { method: 'POST', headers: { 'x-nal-admin': '1' }, body: JSON.stringify({ email: `${role}@t.dev`, password: u.password, code: totpAt(u.totp_secret, NOW.getTime()) }) }), db, NOW)
      creds[role] = r.headers.get('set-cookie')!.split(';')[0]
    }
  }, 120_000)
  it('funnels page returns funnel, retention (by week/country/device) and drop-off', async () => {
    for (const by of ['week', 'country', 'device_type']) {
      const j = await (await call(`funnels?from=2026-02-25&to=2026-03-10&by=${by}`, 'owner')).json() as any
      expect(j.funnel.rows.length).toBe(8); expect(j.retention.by).toBe(by); expect(j.retention.rows.length).toBeGreaterThan(0)
    }
  })
  it('content: story events with choice split and flags, task completion vs abandon, tones', async () => {
    const j = await (await call('content?from=2026-02-25&to=2026-03-10', 'analyst')).json() as any
    expect(j.stories.length).toBeGreaterThan(0); expect(j.stories[0].choices.length).toBeGreaterThan(0)
    expect(j.tasks[0]).toHaveProperty('completion_pct'); expect(j.tones.length).toBeGreaterThan(0)
  })
  it('quality: errors grouped, slow and WebGL rates, load bands; engineer allowed, support not', async () => {
    const j = await (await call('quality?from=2026-02-25&to=2026-03-10', 'engineer')).json() as any
    expect(j.errors_list.length).toBeGreaterThan(0); expect(j.load_bands.length).toBe(5); expect(j.by_version.length).toBeGreaterThan(0)
    expect((await call('quality?from=2026-02-25&to=2026-03-10', 'support')).status).toBe(403)
    expect((await call('funnels', 'engineer')).status).toBe(403)
  })
  it('live view counts only players with a heartbeat in the last 2 minutes, with ids hashed for analysts', async () => {
    const db = await freshDb(); const g = newGen()
    await ingest(db, batch([ev(g, 'session_start', {}, new Date(NOW.getTime() - 30e3)), ev(g, 'heartbeat', { active_seconds: 30, screen: 'dash', mode: 'world' }, new Date(NOW.getTime() - 20e3))]), NG_HEADERS(), NOW)
    const old = newGen(); await ingest(db, batch([ev(old, 'heartbeat', { active_seconds: 30, screen: 'play' }, new Date(NOW.getTime() - 600e3))]), NG_HEADERS(), NOW)
    const j = await Q2.live(db, NOW, (id) => id.replace(/-/g, '').slice(0, 12)) as any
    expect(j.online).toBe(1); expect(j.by_screen[0]).toMatchObject({ key: 'dash', count: 1 }); expect(j.players[0].label).toMatch(/^[0-9a-f]{12}$/)
    expect((await call('live', 'analyst')).status).toBe(200)
  })
  it('weekly summary is plain text with the headline numbers and the consent caveat', async () => {
    const j = await (await call('settings/summary', 'owner')).json() as any
    expect(j.text).toContain('weekly summary'); expect(j.text).toContain('undercount')
  })
  it('error text has ids scrubbed and erased players leave no Phase C rows', async () => {
    const g = newGen(); await ingest(db, batch([ev(g, 'error', { message: 'bad 123e4567-e89b-42d3-a456-426614174000 thing' }, NOW), ev(g, 'story_event_shown', { event_id: 'ev_x' }, NOW)]), NG_HEADERS(), NOW)
    expect((await db.query<any>("SELECT message FROM error_days WHERE device_id=$1", [g.device])).rows[0].message).toBe('bad <id> thing')
    const { eraseDevice } = await import('../server/ingest'); await eraseDevice(db, g.device)
    for (const t of ['error_days', 'content_days', 'quality_days', 'device_milestones']) expect(n(await db.query(`SELECT count(*)::int n FROM ${t} WHERE device_id=$1`, [g.device]))).toBe(0)
  })
})
