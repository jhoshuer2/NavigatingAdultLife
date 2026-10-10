import { describe, expect, it } from 'vitest'
import { eraseDevice, ingest } from '../server/ingest'
import { batch, ev, freshDb, newGen, NG_HEADERS } from './helpers'
import { handleCollect } from '../server/collector'
import { setDb } from '../server/db'

const now = new Date('2026-03-10T12:00:00Z')
const at = (s: number) => new Date(now.getTime() - 60_000 + s * 1000)

describe('collector ingest', () => {
  it('stores a session with duration, device class and country (AC-1)', async () => {
    const db = await freshDb(); const g = newGen()
    const events = [ev(g, 'session_start', {}, at(0)), ev(g, 'app_open', { referrer: 'google.com', utm_source: 'wa' }, at(0))]
    for (let i = 1; i <= 10; i++) events.push(ev(g, 'heartbeat', { active_seconds: 30, screen: 'play', mode: 'world' }, at(i * 5)))
    const r = await ingest(db, batch(events), NG_HEADERS(), now)
    expect(r.status).toBe(204); expect(r.accepted).toBe(12)
    const s = (await db.query<any>('SELECT * FROM sessions')).rows[0]
    expect(s.active_seconds).toBe(300)
    const d = (await db.query<any>('SELECT * FROM devices')).rows[0]
    expect(d).toMatchObject({ country: 'NG', region: 'LA', city: 'Ikeja', device_type: 'mobile', os: 'Android', browser: 'Chrome', sessions_count: 1, active_seconds: 300, language: 'en-NG' })
    expect((await db.query<any>('SELECT * FROM device_days')).rows[0]).toMatchObject({ active_seconds: 300, is_new: true })
  })

  it('is idempotent: re-sending the same events changes nothing', async () => {
    const db = await freshDb(); const g = newGen()
    const b = batch([ev(g, 'session_start', {}, at(0)), ev(g, 'heartbeat', { active_seconds: 30, screen: 'play' }, at(1))])
    await ingest(db, b, NG_HEADERS(), now)
    const again = await ingest(db, b, NG_HEADERS(), now)
    expect(again.accepted).toBe(0); expect(again.duplicate).toBe(2)
    expect((await db.query<any>('SELECT active_seconds, sessions_count FROM devices')).rows[0]).toMatchObject({ active_seconds: 30, sessions_count: 1 })
    expect((await db.query<any>('SELECT count(*)::int n FROM raw_events')).rows[0].n).toBe(2)
  })

  it('never stores the raw IP or the raw user agent (AC-5)', async () => {
    const db = await freshDb(); const g = newGen()
    await ingest(db, batch([ev(g, 'session_start', {}, at(0))]), NG_HEADERS(), now)
    const dump = JSON.stringify({
      e: (await db.query('SELECT * FROM raw_events')).rows, d: (await db.query('SELECT * FROM devices')).rows, s: (await db.query('SELECT * FROM sessions')).rows, dd: (await db.query('SELECT * FROM device_days')).rows,
    })
    expect(dump).not.toContain('102.89.1.2'); expect(dump).not.toContain('Mozilla')
  })

  it('rejects batches without a consent version, bad shapes and over-size events', async () => {
    const db = await freshDb(); const g = newGen()
    expect((await ingest(db, { v: 1, events: [ev(g, 'wait_used')] }, NG_HEADERS(), now)).status).toBe(400)
    expect((await ingest(db, 'nope', NG_HEADERS(), now)).status).toBe(400)
    const big = await ingest(db, batch([ev(g, 'error', { message: 'x'.repeat(5000) }, at(0)), ev(g, 'wait_used', {}, at(1))]), NG_HEADERS(), now)
    expect(big).toMatchObject({ accepted: 1, invalid: 1 })
    const many = await ingest(db, batch(Array.from({ length: 51 }, () => ev(g, 'wait_used', {}, at(1)))), NG_HEADERS(), now)
    expect(many.status).toBe(400)
  })

  it('drops props that are not on the allow-list (no player names)', async () => {
    const db = await freshDb(); const g = newGen()
    await ingest(db, batch([ev(g, 'create_completed', { archetype: 'x', name: 'Ada Obi', gender: 'f' }, at(0))]), NG_HEADERS(), now)
    expect((await db.query<any>("SELECT props FROM raw_events")).rows[0].props).toEqual({ archetype: 'x', gender: 'f' })
  })

  it('rate-limits a device to 120 events a minute', async () => {
    const db = await freshDb(); const g = newGen(); let last = 204
    for (let i = 0; i < 4; i++) last = (await ingest(db, batch(Array.from({ length: 40 }, (_, k) => ev(g, 'wait_used', {}, at(i * 40 + k)))), NG_HEADERS(), now)).status
    expect(last).toBe(429)
    expect((await db.query<any>('SELECT count(*)::int n FROM raw_events')).rows[0].n).toBe(120)
  })

  it('tags test traffic and bots so they stay out of KPIs (AC-8)', async () => {
    const db = await freshDb(); const g = newGen(), b = newGen()
    await ingest(db, batch([ev(g, 'session_start', {}, at(0))], { is_test: true }), NG_HEADERS(), now)
    await ingest(db, batch([ev(b, 'session_start', {}, at(0))]), NG_HEADERS({ 'user-agent': 'Googlebot/2.1' }), now)
    expect((await db.query<any>('SELECT is_test FROM devices ORDER BY first_seen')).rows.every((r: any) => r.is_test)).toBe(true)
    expect((await db.query<any>('SELECT count(*)::int n FROM device_days WHERE NOT is_test')).rows[0].n).toBe(0)
  })

  it('tracks features, lives and the first-seen day across batches', async () => {
    const db = await freshDb(); const g = newGen(); g.life = '11111111-1111-4111-8111-111111111111'
    await ingest(db, batch([ev(g, 'create_completed', { archetype: 'hustler', gender: 'f', district: 'lagos' }, at(0)), ev(g, 'life_started', { life_index: 1 }, at(1)), ev(g, 'task_completed', { task: 'penalty', perf: 0.6, place: 'pitch' }, at(2)), ev(g, 'task_completed', { task: 'penalty', perf: 0.8 }, at(3))]), NG_HEADERS(), now)
    await ingest(db, batch([ev(g, 'life_ended', { age: 71, ending_id: 'peaceful' }, at(30))]), NG_HEADERS(), now)
    const l = (await db.query<any>('SELECT * FROM lives')).rows[0]
    expect(l).toMatchObject({ archetype: 'hustler', district: 'lagos', age_reached: 71, ending_id: 'peaceful' })
    const f = (await db.query<any>("SELECT * FROM feature_days WHERE feature='task:penalty'")).rows[0]
    expect(f.uses).toBe(2); expect(f.score_sum / f.score_n).toBeCloseTo(0.7)
    expect((await db.query<any>('SELECT lives_count FROM devices')).rows[0].lives_count).toBe(1)
  })

  it('erases a device everywhere and ignores its late events (AC-7)', async () => {
    const db = await freshDb(); const g = newGen()
    await ingest(db, batch([ev(g, 'session_start', {}, at(0)), ev(g, 'heartbeat', { active_seconds: 30, screen: 'play' }, at(1)), ev(g, 'place_entered', { place: 'home' }, at(2))]), NG_HEADERS(), now)
    await eraseDevice(db, g.device)
    for (const t of ['raw_events', 'sessions', 'lives', 'device_days', 'feature_days', 'playtime_split', 'activity_heat', 'devices']) expect((await db.query<any>(`SELECT count(*)::int n FROM ${t}`)).rows[0].n).toBe(0)
    await ingest(db, batch([ev(g, 'wait_used', {}, at(5))]), NG_HEADERS(), now)
    expect((await db.query<any>('SELECT count(*)::int n FROM raw_events')).rows[0].n).toBe(0)
  })
})

describe('collector HTTP', () => {
  it('answers CORS only for the game origin and returns 204', async () => {
    const db = await freshDb(); setDb(db); process.env.GAME_ORIGINS = 'https://game.test'
    const g = newGen()
    const mk = (origin: string) => new Request('https://admin.test/api/collect', { method: 'POST', headers: { origin, 'content-type': 'text/plain', ...Object.fromEntries(NG_HEADERS()) }, body: JSON.stringify(batch([ev(g, 'wait_used', {}, new Date())])) })
    const ok = await handleCollect(mk('https://game.test'))
    expect(ok.status).toBe(204); expect(ok.headers.get('access-control-allow-origin')).toBe('https://game.test')
    const bad = await handleCollect(mk('https://evil.test'))
    expect(bad.headers.get('access-control-allow-origin')).toBeNull()
    const pre = await handleCollect(new Request('https://admin.test/api/collect', { method: 'OPTIONS', headers: { origin: 'https://game.test' } }))
    expect(pre.status).toBe(204)
    expect((await handleCollect(new Request('https://admin.test/api/collect', { method: 'POST', body: 'x'.repeat(200_000) }))).status).toBe(413)
  })
})
