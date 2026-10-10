// Collector core (PRD 4.2): validate, rate-limit, enrich with geo/UA, store idempotently, update the compact aggregates.
import { createHash } from 'node:crypto'
import { batchSchema, parseEvent, type TelemetryEvent } from '../../shared/events'
import type { Db } from './db'
import { contentOf, featureOf, milestoneOf, playtimeBucket } from './features'
import { geoFromHeaders } from './geo'
import { parseUa } from './ua'

export const RATE_LIMIT_PER_MIN = 120
const MAX_CLOCK_SKEW_MS = 5 * 60e3
const MAX_AGE_MS = 8 * 86400e3

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')
const utcDay = (d: Date) => d.toISOString().slice(0, 10)

export interface IngestResult { status: 204 | 400 | 429; accepted: number; duplicate: number; invalid: number; error?: string }

function localParts(d: Date, tz?: string | null) {
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz || 'UTC', hour: 'numeric', hourCycle: 'h23', weekday: 'short' }).formatToParts(d)
    const hour = Number(f.find((x) => x.type === 'hour')?.value ?? 0)
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(f.find((x) => x.type === 'weekday')?.value ?? 'Sun')
    return { hour, dow }
  } catch { return { hour: d.getUTCHours(), dow: d.getUTCDay() } }
}

export async function ingest(db: Db, body: unknown, headers: Headers, now = new Date()): Promise<IngestResult> {
  const today = utcDay(now)
  const stat = (col: 'accepted' | 'duplicate' | 'invalid' | 'rate_limited', n: number) => n > 0
    ? db.query(`INSERT INTO ingest_stats (day, ${col}) VALUES ($1, $2) ON CONFLICT (day) DO UPDATE SET ${col} = ingest_stats.${col} + $2`, [today, n]) : Promise.resolve()

  const b = batchSchema.safeParse(body)
  if (!b.success) { await stat('invalid', 1); return { status: 400, accepted: 0, duplicate: 0, invalid: 1, error: 'bad batch' } }
  const ctx = b.data.ctx
  if (!ctx?.consent_version) { await stat('invalid', b.data.events.length || 1); return { status: 400, accepted: 0, duplicate: 0, invalid: b.data.events.length, error: 'consent_version required' } }

  const parsed: TelemetryEvent[] = []
  let invalid = 0
  for (const raw of b.data.events) {
    const e = parseEvent(raw)
    const t = e ? Date.parse(e.ts) : NaN
    if (!e || isNaN(t) || now.getTime() - t > MAX_AGE_MS) { invalid++; continue }
    parsed.push(e)
  }
  if (!parsed.length) { await stat('invalid', invalid); return { status: 204, accepted: 0, duplicate: 0, invalid } }
  const deviceId = parsed[0].device_id.toLowerCase()
  const events = parsed.filter((e) => e.device_id.toLowerCase() === deviceId)
  invalid += parsed.length - events.length

  if ((await db.query('SELECT 1 FROM erased_devices WHERE hash = $1', [sha256(deviceId)])).rows.length) return { status: 204, accepted: 0, duplicate: 0, invalid }

  // fixed-window rate limit per device (PRD FR-C1)
  const win = Math.floor(now.getTime() / 60e3)
  const rl = await db.query<{ n: number }>('INSERT INTO rate_limits (key, window_start, n) VALUES ($1, $2, $3) ON CONFLICT (key, window_start) DO UPDATE SET n = rate_limits.n + $3 RETURNING n', [`dev:${deviceId}`, win, events.length])
  if (rl.rows[0].n > RATE_LIMIT_PER_MIN) { await stat('rate_limited', events.length); return { status: 429, accepted: 0, duplicate: 0, invalid } }

  const ua = parseUa(headers.get('user-agent'))
  const geo = geoFromHeaders(headers)
  const isTest = !!ctx.is_test || ua.bot
  // trust the client clock, but never let it run ahead of the server by more than a few minutes
  const ts = (e: TelemetryEvent) => { const t = Date.parse(e.ts); return new Date(t > now.getTime() + MAX_CLOCK_SKEW_MS ? now.getTime() : t) }

  const result = await db.tx(async (t) => {
    const ins = await t.query<{ event_id: string }>(
      `INSERT INTO raw_events (event_id, received_at, ts, device_id, session_id, life_id, name, props, country, region, city, is_test)
       SELECT x.event_id, $2::timestamptz, x.ts, x.device_id, x.session_id, x.life_id, x.name, x.props, $3, $4, $5, $6
       FROM jsonb_to_recordset($1::jsonb) AS x(event_id uuid, ts timestamptz, device_id uuid, session_id uuid, life_id uuid, name text, props jsonb)
       ON CONFLICT (event_id) DO NOTHING RETURNING event_id`,
      [JSON.stringify(events.map((e) => ({ ...e, ts: ts(e).toISOString() }))), now.toISOString(), geo.country, geo.region, geo.city, isTest])
    const fresh = new Set(ins.rows.map((r) => r.event_id.toLowerCase()))
    const news = events.filter((e) => fresh.has(e.event_id.toLowerCase())).sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts))
    const duplicate = events.length - news.length
    if (!news.length) return { accepted: 0, duplicate }

    const first = ts(news[0]), last = ts(news[news.length - 1])
    const hb = news.filter((e) => e.name === 'heartbeat')
    const activeSum = hb.reduce((a, e) => a + (Number(e.props.active_seconds) || 0), 0)
    const starts = news.filter((e) => e.name === 'session_start').length
    const lives = news.filter((e) => e.name === 'life_started').length
    const lastFeature = [...news].reverse().map(featureOf).find(Boolean)?.feature ?? null
    const consented = news.find((e) => e.name === 'consent_changed' && e.props.granted === true)

    const dev = await t.query<{ first_seen: string }>(
      `INSERT INTO devices (device_id, first_seen, last_seen, country, region, city, os, browser, browser_version, device_type, language, tz, screen_band, app_version, consent_version, consent_at, sessions_count, active_seconds, lives_count, countries, last_feature, is_test)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       ON CONFLICT (device_id) DO UPDATE SET
         first_seen = LEAST(devices.first_seen, EXCLUDED.first_seen), last_seen = GREATEST(devices.last_seen, EXCLUDED.last_seen),
         country = COALESCE(EXCLUDED.country, devices.country), region = COALESCE(EXCLUDED.region, devices.region), city = COALESCE(EXCLUDED.city, devices.city),
         os = EXCLUDED.os, browser = EXCLUDED.browser, browser_version = EXCLUDED.browser_version, device_type = EXCLUDED.device_type,
         language = COALESCE(EXCLUDED.language, devices.language), tz = COALESCE(EXCLUDED.tz, devices.tz), screen_band = COALESCE(EXCLUDED.screen_band, devices.screen_band),
         app_version = EXCLUDED.app_version, consent_version = EXCLUDED.consent_version, consent_at = COALESCE(devices.consent_at, EXCLUDED.consent_at),
         sessions_count = devices.sessions_count + EXCLUDED.sessions_count, active_seconds = devices.active_seconds + EXCLUDED.active_seconds, lives_count = devices.lives_count + EXCLUDED.lives_count,
         countries = (SELECT COALESCE(array_agg(DISTINCT c), '{}') FROM unnest(devices.countries || EXCLUDED.countries) c),
         last_feature = COALESCE(EXCLUDED.last_feature, devices.last_feature), is_test = devices.is_test OR EXCLUDED.is_test
       RETURNING first_seen`,
      [deviceId, first, last, geo.country, geo.region, geo.city, ua.os, ua.browser, ua.browser_version, ua.device_type, ctx.language ?? null, ctx.tz ?? null, ctx.screen_band ?? null,
        news[news.length - 1].app_version, ctx.consent_version, (consented ? ts(consented) : first), starts, activeSum, lives, geo.country ? [geo.country] : [], lastFeature, isTest])
    const firstDay = utcDay(new Date(dev.rows[0].first_seen))

    // sessions
    const bySession = new Map<string, TelemetryEvent[]>()
    for (const e of news) { const k = e.session_id.toLowerCase(); (bySession.get(k) ?? bySession.set(k, []).get(k)!).push(e) }
    for (const [sid, list] of bySession) {
      const secs = list.filter((e) => e.name === 'heartbeat').reduce((a, e) => a + (Number(e.props.active_seconds) || 0), 0)
      const screens: Record<string, number> = {}
      for (const e of list) if (e.name === 'heartbeat') { const k = String(e.props.screen ?? 'unknown'); screens[k] = (screens[k] ?? 0) + (Number(e.props.active_seconds) || 0) }
      const open = list.find((e) => e.name === 'app_open')
      const end = [...list].reverse().find((e) => e.name === 'session_end')
      await t.query(
        `INSERT INTO sessions (session_id, device_id, started_at, ended_at, last_event_at, active_seconds, screens, entry_referrer, utm, is_test)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9::jsonb,$10)
         ON CONFLICT (session_id) DO UPDATE SET
           started_at = LEAST(sessions.started_at, EXCLUDED.started_at), last_event_at = GREATEST(sessions.last_event_at, EXCLUDED.last_event_at),
           ended_at = COALESCE(EXCLUDED.ended_at, sessions.ended_at), active_seconds = sessions.active_seconds + EXCLUDED.active_seconds,
           entry_referrer = COALESCE(sessions.entry_referrer, EXCLUDED.entry_referrer), utm = COALESCE(sessions.utm, EXCLUDED.utm),
           screens = (SELECT COALESCE(jsonb_object_agg(k, COALESCE((sessions.screens->>k)::int,0) + COALESCE((EXCLUDED.screens->>k)::int,0)), '{}'::jsonb) FROM (SELECT jsonb_object_keys(sessions.screens || EXCLUDED.screens) AS k) x)`,
        [sid, deviceId, ts(list[0]), end ? ts(end) : null, ts(list[list.length - 1]), secs, JSON.stringify(screens),
          open ? (open.props.referrer as string | null) ?? null : null,
          open ? JSON.stringify({ source: open.props.utm_source ?? null, medium: open.props.utm_medium ?? null, campaign: open.props.utm_campaign ?? null }) : null, isTest])
    }

    // lives
    const byLife = new Map<string, TelemetryEvent[]>()
    for (const e of news) if (e.life_id) { const k = e.life_id.toLowerCase(); (byLife.get(k) ?? byLife.set(k, []).get(k)!).push(e) }
    for (const [lid, list] of byLife) {
      const create = list.find((e) => e.name === 'create_completed'), end = list.find((e) => e.name === 'life_ended')
      await t.query(
        `INSERT INTO lives (life_id, device_id, started_at, ended_at, age_reached, ending_id, archetype, gender, district, is_test, last_age) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (life_id) DO UPDATE SET started_at = LEAST(lives.started_at, EXCLUDED.started_at), ended_at = COALESCE(EXCLUDED.ended_at, lives.ended_at),
           age_reached = COALESCE(EXCLUDED.age_reached, lives.age_reached), ending_id = COALESCE(EXCLUDED.ending_id, lives.ending_id),
           last_age = GREATEST(lives.last_age, EXCLUDED.last_age), archetype = COALESCE(EXCLUDED.archetype, lives.archetype), gender = COALESCE(EXCLUDED.gender, lives.gender), district = COALESCE(EXCLUDED.district, lives.district)`,
        [lid, deviceId, ts(list[0]), end ? ts(end) : null, end ? Number(end.props.age) || null : null, end ? (end.props.ending_id as string | null) ?? null : null,
          (create?.props.archetype as string | undefined) ?? null, (create?.props.gender as string | undefined) ?? null, (create?.props.district as string | undefined) ?? null, isTest,
          list.reduce<number | null>((m, e) => { const a = (e.name === 'year_ended' || e.name === 'life_ended') ? Number(e.props.age) : NaN; return isNaN(a) ? m : Math.max(m ?? 0, a) }, null)])
    }

    // per-day aggregates
    const days = new Map<string, { active: number; sessions: number }>()
    for (const e of news) {
      const d = utcDay(ts(e)); const v = days.get(d) ?? days.set(d, { active: 0, sessions: 0 }).get(d)!
      if (e.name === 'heartbeat') v.active += Number(e.props.active_seconds) || 0
      if (e.name === 'session_start') v.sessions++
    }
    for (const [day, v] of days) {
      await t.query(
        `INSERT INTO device_days (day, device_id, active_seconds, sessions, country, region, city, device_type, app_version, is_test) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (day, device_id) DO UPDATE SET active_seconds = device_days.active_seconds + EXCLUDED.active_seconds, sessions = device_days.sessions + EXCLUDED.sessions,
           country = COALESCE(EXCLUDED.country, device_days.country), region = COALESCE(EXCLUDED.region, device_days.region), city = COALESCE(EXCLUDED.city, device_days.city),
           device_type = EXCLUDED.device_type, app_version = EXCLUDED.app_version, is_test = device_days.is_test OR EXCLUDED.is_test`,
        [day, deviceId, v.active, v.sessions, geo.country, geo.region, geo.city, ua.device_type, news[news.length - 1].app_version, isTest])
    }
    await t.query('UPDATE device_days SET is_new = (day = $2::date) WHERE device_id = $1', [deviceId, firstDay])

    // features
    const feat = new Map<string, { day: string; feature: string; uses: number; sum: number; n: number }>()
    for (const e of news) {
      const f = featureOf(e); if (!f) continue
      const day = utcDay(ts(e)), k = `${day}|${f.feature}`
      const v = feat.get(k) ?? feat.set(k, { day, feature: f.feature, uses: 0, sum: 0, n: 0 }).get(k)!
      v.uses++; if (f.score !== undefined) { v.sum += f.score; v.n++ }
    }
    for (const v of feat.values()) {
      await t.query(
        `INSERT INTO feature_days (day, feature, device_id, uses, score_sum, score_n, is_test) VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (day, feature, device_id) DO UPDATE SET uses = feature_days.uses + EXCLUDED.uses, score_sum = feature_days.score_sum + EXCLUDED.score_sum, score_n = feature_days.score_n + EXCLUDED.score_n`,
        [v.day, v.feature, deviceId, v.uses, v.sum, v.n, isTest])
    }


    // funnel milestones, content counters, quality and live state
    for (const e of news) {
      const m = milestoneOf(e)
      if (m) await t.query('INSERT INTO device_milestones (device_id, step, first_at, is_test) VALUES ($1,$2,$3,$4) ON CONFLICT (device_id, step) DO UPDATE SET first_at = LEAST(device_milestones.first_at, EXCLUDED.first_at)', [deviceId, m, ts(e), isTest])
    }
    const content = new Map<string, { day: string; kind: string; item: string; choice: string; n: number }>()
    for (const e of news) {
      const c = contentOf(e); if (!c) continue
      const day = utcDay(ts(e)), k = `${day}|${c.kind}|${c.item}|${c.choice}`
      const v = content.get(k) ?? content.set(k, { day, ...c, n: 0 }).get(k)!; v.n++
    }
    for (const v of content.values()) await t.query('INSERT INTO content_days (day, device_id, kind, item_id, choice_id, n, is_test) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (day, device_id, kind, item_id, choice_id) DO UPDATE SET n = content_days.n + EXCLUDED.n', [v.day, deviceId, v.kind, v.item, v.choice, v.n, isTest])

    const qual = new Map<string, { slow: number; webgl: number; errors: number; load: number | null }>()
    const errs = new Map<string, { day: string; message: string; version: string; n: number }>()
    for (const e of news) {
      const day = utcDay(ts(e)); const q = qual.get(day) ?? qual.set(day, { slow: 0, webgl: 0, errors: 0, load: null }).get(day)!
      if (e.name === 'slow_device_detected') q.slow++
      else if (e.name === 'webgl_unavailable') q.webgl++
      else if (e.name === 'app_open' && typeof e.props.load_ms === 'number') q.load = Math.round(e.props.load_ms)
      else if (e.name === 'error') {
        q.errors++
        const message = String(e.props.message ?? 'unknown').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<id>').slice(0, 80) || 'unknown'
        const k = `${day}|${message}|${e.app_version}`; const v = errs.get(k) ?? errs.set(k, { day, message, version: e.app_version, n: 0 }).get(k)!; v.n++
      }
    }
    for (const [day, q] of qual) {
      if (!q.slow && !q.webgl && !q.errors && q.load === null) continue
      await t.query(`INSERT INTO quality_days (day, device_id, device_type, os, app_version, slow, webgl_fail, errors, load_ms, is_test) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (day, device_id) DO UPDATE SET slow = quality_days.slow + EXCLUDED.slow, webgl_fail = quality_days.webgl_fail + EXCLUDED.webgl_fail, errors = quality_days.errors + EXCLUDED.errors, load_ms = COALESCE(EXCLUDED.load_ms, quality_days.load_ms)`,
        [day, deviceId, ua.device_type, ua.os, news[news.length - 1].app_version, q.slow, q.webgl, q.errors, q.load, isTest])
    }
    for (const v of errs.values()) await t.query('INSERT INTO error_days (day, device_id, message, app_version, device_type, n, is_test) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (day, device_id, message, app_version) DO UPDATE SET n = error_days.n + EXCLUDED.n', [v.day, deviceId, v.message, v.version, ua.device_type, v.n, isTest])

    const lastHb = hb[hb.length - 1]
    if (lastHb) await t.query('UPDATE devices SET last_screen = $2, last_heartbeat_at = $3 WHERE device_id = $1 AND (last_heartbeat_at IS NULL OR last_heartbeat_at < $3)', [deviceId, String(lastHb.props.screen ?? ''), ts(lastHb)])

    // playtime split + local-time heatmap (real players only)
    if (!isTest) {
      const dev2 = await t.query<{ tz: string | null }>('SELECT tz FROM devices WHERE device_id = $1', [deviceId])
      const tz = dev2.rows[0]?.tz
      for (const e of hb) {
        const sec = Number(e.props.active_seconds) || 0; if (sec <= 0) continue
        const d = ts(e), day = utcDay(d), lp = localParts(d, tz)
        await t.query('INSERT INTO playtime_split (day, device_id, bucket, seconds) VALUES ($1,$4,$2,$3) ON CONFLICT (day, device_id, bucket) DO UPDATE SET seconds = playtime_split.seconds + $3', [day, playtimeBucket(e.props.screen, e.props.mode), sec, deviceId])
        await t.query('INSERT INTO activity_heat (day, device_id, dow, hour, seconds) VALUES ($1,$5,$2,$3,$4) ON CONFLICT (day, device_id, dow, hour) DO UPDATE SET seconds = activity_heat.seconds + $4', [day, lp.dow, lp.hour, sec, deviceId])
      }
    }
    return { accepted: news.length, duplicate }
  })
  await stat('accepted', result.accepted); await stat('duplicate', result.duplicate); await stat('invalid', invalid)
  return { status: 204, accepted: result.accepted, duplicate: result.duplicate, invalid }
}

/** Erase everything held for one device (NDPA erasure; PRD AC-7). Aggregates that came from it go with it. */
export async function eraseDevice(db: Db, deviceId: string): Promise<void> {
  const id = deviceId.toLowerCase()
  await db.tx(async (t) => {
    for (const tbl of ['raw_events', 'sessions', 'lives', 'device_days', 'feature_days', 'playtime_split', 'activity_heat', 'device_milestones', 'content_days', 'quality_days', 'error_days', 'devices']) await t.query(`DELETE FROM ${tbl} WHERE device_id = $1`, [id])
    await t.query('DELETE FROM rate_limits WHERE key = $1', [`dev:${id}`])
    await t.query('INSERT INTO erased_devices (hash) VALUES ($1) ON CONFLICT DO NOTHING', [sha256(id)])
  })
}
