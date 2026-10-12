// Dashboard queries. They read the compact per-device-day tables, never raw_events, and always exclude test traffic.
import type { Db } from './db'
import { NG_STATES } from './geo'

export interface Filters { from: string; to: string; country?: string; device_type?: string; app_version?: string; cohort?: 'new' | 'returning' }
const DAY = 86400e3
export const ACTIVE_MIN_SECONDS = 10

export const DEFINITIONS = {
  dau: 'Daily active players: distinct devices with at least 10 active seconds on the day (test traffic excluded). A device ID stands in for a player until accounts exist.',
  wau: 'Weekly active players: distinct active devices in the 7 days up to the end of the range.',
  mau: 'Monthly active players: distinct active devices in the 30 days up to the end of the range.',
  new_players: 'Devices seen for the first time in the period.',
  returning_players: 'Devices active in the period that were first seen before it.',
  avg_active_per_player_day: 'Average active seconds per active player per day. Active time counts only while the tab is visible and the player did something in the last 60 seconds.',
  avg_session: 'Average active time per session (not wall-clock time). A session ends after 30 minutes of inactivity.',
  lives_started: 'Lives (runs of the game) started in the period.',
  lives_completed: 'Lives that reached an ending.',
  paywall_conversion: 'Players who completed a real top-up divided by players who saw the paywall. Not available until payments exist.',
  stickiness: 'Average DAU divided by MAU for the range.',
  retention: 'Share of a first-seen cohort active exactly n days later.',
  feature_user: 'Distinct devices with at least one use of the feature in the period.',
  task_score: 'Average performance score (0 to 1) reported when a task completes.',
} as const

const iso = (d: Date) => d.toISOString().slice(0, 10)
export const addDays = (day: string, n: number) => iso(new Date(Date.parse(day) + n * DAY))
export const spanDays = (f: Pick<Filters, 'from' | 'to'>) => Math.round((Date.parse(f.to) - Date.parse(f.from)) / DAY) + 1
export const previous = (f: Filters): Filters => { const n = spanDays(f); return { ...f, from: addDays(f.from, -n), to: addDays(f.from, -1) } }

/** Build WHERE conditions for a device_days alias. Params start at $1. */
function dd(f: Filters, a = 'dd', extra: unknown[] = []) {
  const p: unknown[] = [...extra]; const c: string[] = [`${a}.is_test = false`]
  const add = (v: unknown) => { p.push(v); return `$${p.length}` }
  c.push(`${a}.day >= ${add(f.from)}::date`, `${a}.day <= ${add(f.to)}::date`)
  if (f.country) c.push(`${a}.country = ${add(f.country)}`)
  if (f.device_type) c.push(`${a}.device_type = ${add(f.device_type)}`)
  if (f.app_version) c.push(`${a}.app_version = ${add(f.app_version)}`)
  if (f.cohort === 'new') c.push(`${a}.is_new`)
  if (f.cohort === 'returning') c.push(`NOT ${a}.is_new`)
  return { where: c.join(' AND '), p }
}
const n = (v: unknown) => Number(v ?? 0)

async function activeIn(db: Db, f: Filters, from: string, to: string): Promise<number> {
  const q = dd({ ...f, from, to })
  return n((await db.query<{ c: number }>(`SELECT count(*)::int c FROM (SELECT dd.device_id FROM device_days dd WHERE ${q.where} GROUP BY dd.device_id HAVING sum(dd.active_seconds) >= ${ACTIVE_MIN_SECONDS}) x`, q.p)).rows[0].c)
}

async function kpis(db: Db, f: Filters) {
  const q = dd(f)
  const base = (await db.query<any>(`
    SELECT count(*) FILTER (WHERE dd.is_new)::int AS new_players,
           coalesce(sum(dd.active_seconds) FILTER (WHERE dd.active_seconds >= ${ACTIVE_MIN_SECONDS}), 0)::float AS act_sec,
           count(*) FILTER (WHERE dd.active_seconds >= ${ACTIVE_MIN_SECONDS})::int AS act_days
    FROM device_days dd WHERE ${q.where}`, q.p)).rows[0]
  const ret = dd({ ...f, cohort: undefined })
  const returning = n((await db.query<any>(`SELECT count(*)::int c FROM (SELECT dd.device_id FROM device_days dd JOIN devices d USING (device_id) WHERE ${ret.where} AND d.first_seen < $${ret.p.length + 1}::date GROUP BY dd.device_id HAVING sum(dd.active_seconds) >= ${ACTIVE_MIN_SECONDS}) x`, [...ret.p, f.from])).rows[0].c)
  const dauDay = n((await db.query<any>(`SELECT count(*)::int c FROM device_days dd WHERE ${dd({ ...f, from: f.to }).where} AND dd.active_seconds >= ${ACTIVE_MIN_SECONDS}`, dd({ ...f, from: f.to }).p)).rows[0].c)
  const sess = (await db.query<any>(`SELECT coalesce(avg(s.active_seconds) FILTER (WHERE s.active_seconds > 0),0)::float AS avg_s, count(*)::int AS cnt FROM sessions s JOIN devices d USING (device_id) WHERE NOT s.is_test AND s.started_at >= $1::date AND s.started_at < $2::date + 1 ${f.country ? 'AND d.country = $3' : ''}`, f.country ? [f.from, f.to, f.country] : [f.from, f.to])).rows[0]
  const lives = (await db.query<any>(`SELECT count(*)::int started, count(*) FILTER (WHERE ended_at IS NOT NULL)::int completed FROM lives WHERE NOT is_test AND started_at >= $1::date AND started_at < $2::date + 1`, [f.from, f.to])).rows[0]
  return {
    dau: dauDay, wau: await activeIn(db, f, addDays(f.to, -6), f.to), mau: await activeIn(db, f, addDays(f.to, -29), f.to),
    new_players: n(base.new_players), returning_players: returning,
    avg_active_per_player_day: base.act_days ? Math.round(base.act_sec / base.act_days) : 0,
    avg_session: Math.round(n(sess.avg_s)), sessions: n(sess.cnt),
    lives_started: n(lives.started), lives_completed: n(lives.completed),
    paywall_conversion: null as number | null,
  }
}

export async function overview(db: Db, f: Filters) {
  const cur = await kpis(db, f), prev = await kpis(db, previous(f))
  const q = dd(f)
  const series = (await db.query<any>(`
    SELECT dd.day::text AS day,
      count(*) FILTER (WHERE dd.active_seconds >= ${ACTIVE_MIN_SECONDS})::int AS active,
      count(*) FILTER (WHERE dd.is_new)::int AS new_players,
      count(*) FILTER (WHERE NOT dd.is_new AND dd.active_seconds >= ${ACTIVE_MIN_SECONDS})::int AS returning_players,
      coalesce(sum(dd.sessions),0)::int AS sessions, coalesce(sum(dd.active_seconds),0)::int AS active_seconds
    FROM device_days dd WHERE ${q.where} GROUP BY dd.day ORDER BY dd.day`, q.p)).rows
  const filled: typeof series = []
  for (let d = f.from; d <= f.to; d = addDays(d, 1)) filled.push(series.find((s: any) => s.day === d) ?? { day: d, active: 0, new_players: 0, returning_players: 0, sessions: 0, active_seconds: 0 })
  return { range: { from: f.from, to: f.to }, kpis: cur, previous: prev, series: filled, definitions: DEFINITIONS }
}

// ---------- players ----------
export interface PlayerQuery extends Filters { includeTest?: boolean; search?: string; sort?: string; dir?: 'asc' | 'desc'; page?: number; size?: number }
const SORTS: Record<string, string> = { first_seen: 'd.first_seen', last_seen: 'd.last_seen', sessions: 'd.sessions_count', active: 'd.active_seconds', lives: 'd.lives_count', country: 'd.country' }

function playerWhere(f: PlayerQuery) {
  const p: unknown[] = []; const c = [f.includeTest ? 'true' : 'NOT d.is_test']
  const add = (v: unknown) => { p.push(v); return `$${p.length}` }
  if (f.country) c.push(`d.country = ${add(f.country)}`)
  if (f.device_type) c.push(`d.device_type = ${add(f.device_type)}`)
  if (f.app_version) c.push(`d.app_version = ${add(f.app_version)}`)
  if (f.from) c.push(`d.last_seen >= ${add(f.from)}::date`)
  if (f.to) c.push(`d.first_seen < ${add(f.to)}::date + 1`)
  if (f.search) c.push(`d.device_id::text LIKE ${add(f.search.toLowerCase().replace(/[^0-9a-f-]/g, '') + '%')}`)
  return { where: c.join(' AND '), p }
}

export async function players(db: Db, f: PlayerQuery, now = new Date()) {
  const w = playerWhere(f)
  const size = Math.min(Math.max(f.size ?? 25, 1), 100), page = Math.max(f.page ?? 1, 1)
  const sort = SORTS[f.sort ?? 'last_seen'] ?? SORTS.last_seen, dir = f.dir === 'asc' ? 'ASC' : 'DESC'
  const total = n((await db.query<any>(`SELECT count(*)::int c FROM devices d WHERE ${w.where}`, w.p)).rows[0].c)
  const rows = (await db.query<any>(`SELECT d.device_id, d.first_seen, d.last_seen, d.country, d.region, d.city, d.os, d.browser, d.device_type, d.sessions_count, d.active_seconds, d.lives_count, d.last_feature, d.is_test
    FROM devices d WHERE ${w.where} ORDER BY ${sort} ${dir}, d.device_id LIMIT ${size} OFFSET ${(page - 1) * size}`, w.p)).rows
  const status = (last: string) => { const age = now.getTime() - new Date(last).getTime(); return age < 2 * DAY ? 'active' : age < 14 * DAY ? 'recent' : 'lapsed' }
  return { total, page, size, rows: rows.map((r: any) => ({ ...r, status: status(r.last_seen), tokens_left: null as number | null })) }
}

export async function playerDetail(db: Db, id: string) {
  const d = (await db.query<any>('SELECT * FROM devices WHERE device_id = $1', [id])).rows[0]
  if (!d) return null
  const sessions = (await db.query<any>('SELECT session_id, started_at, ended_at, last_event_at, active_seconds, screens, entry_referrer FROM sessions WHERE device_id = $1 ORDER BY started_at DESC LIMIT 50', [id])).rows
  const lives = (await db.query<any>('SELECT life_id, started_at, ended_at, age_reached, ending_id, archetype, gender, district FROM lives WHERE device_id = $1 ORDER BY started_at DESC LIMIT 50', [id])).rows
  const features = (await db.query<any>('SELECT feature, sum(uses)::int uses FROM feature_days WHERE device_id = $1 GROUP BY feature ORDER BY uses DESC', [id])).rows
  const days = (await db.query<any>('SELECT day::text, active_seconds, sessions FROM device_days WHERE device_id = $1 ORDER BY day DESC LIMIT 60', [id])).rows
  const flags = (await db.query<any>("SELECT ts, props FROM raw_events WHERE device_id = $1 AND name = 'content_flagged' ORDER BY ts DESC LIMIT 50", [id])).rows
  return { device: d, sessions, lives, features, days, flags, tokens: null }
}

export async function playersForExport(db: Db, f: PlayerQuery) {
  return players(db, { ...f, page: 1, size: 100 }).then(async (first) => {
    const all = [...first.rows]
    for (let p = 2; (p - 1) * 100 < first.total && p < 1000; p++) all.push(...(await players(db, { ...f, page: p, size: 100 })).rows)
    return all
  })
}

// ---------- geography ----------
export async function geography(db: Db, f: Filters) {
  const q = dd(f)
  const ngq = dd({ ...f, country: 'NG' })
  const byCountryP = (db.query<any>(`
    SELECT coalesce(dd.country,'??') AS country, count(DISTINCT dd.device_id) FILTER (WHERE dd.active_seconds >= ${ACTIVE_MIN_SECONDS})::int AS players,
           coalesce(sum(dd.sessions),0)::int AS sessions, coalesce(sum(dd.active_seconds),0)::int AS active_seconds,
           count(DISTINCT dd.device_id) FILTER (WHERE dd.is_new)::int AS new_players
    FROM device_days dd WHERE ${q.where} GROUP BY 1 ORDER BY players DESC, sessions DESC`, q.p))
  // D1 / D7: share of devices first seen in the range (and old enough to be measured) that were active exactly n days later
  const rq = dd({ ...f, cohort: 'new' }); const toIdx = rq.p.length + 1
  const retP = (db.query<any>(`
    SELECT coalesce(dd.country,'??') AS country,
      count(*) FILTER (WHERE dd.day + 1 <= $${toIdx}::date)::int AS e1, count(x1.device_id) FILTER (WHERE x1.active_seconds >= ${ACTIVE_MIN_SECONDS})::int AS b1,
      count(*) FILTER (WHERE dd.day + 7 <= $${toIdx}::date)::int AS e7, count(x7.device_id) FILTER (WHERE x7.active_seconds >= ${ACTIVE_MIN_SECONDS})::int AS b7
    FROM device_days dd
    LEFT JOIN device_days x1 ON x1.device_id = dd.device_id AND x1.day = dd.day + 1
    LEFT JOIN device_days x7 ON x7.device_id = dd.device_id AND x7.day = dd.day + 7
    WHERE ${rq.where} GROUP BY 1`, [...rq.p, f.to]))
  const statesP = (db.query<any>(`
    SELECT coalesce(dd.region,'unknown') AS code, count(DISTINCT dd.device_id) FILTER (WHERE dd.active_seconds >= ${ACTIVE_MIN_SECONDS})::int AS players,
           coalesce(sum(dd.sessions),0)::int AS sessions, coalesce(sum(dd.active_seconds),0)::int AS active_seconds
    FROM device_days dd WHERE ${ngq.where} GROUP BY 1 ORDER BY players DESC`, ngq.p))
  const citiesP = (db.query<any>(`
    SELECT coalesce(dd.city,'unknown') AS city, coalesce(dd.region,'') AS region, count(DISTINCT dd.device_id) FILTER (WHERE dd.active_seconds >= ${ACTIVE_MIN_SECONDS})::int AS players
    FROM device_days dd WHERE ${ngq.where} GROUP BY 1, 2 ORDER BY players DESC LIMIT 25`, ngq.p))
  const [byCountry, ret, states, cities] = (await Promise.all([byCountryP, retP, statesP, citiesP])).map((r) => r.rows) as any[][]
  const rate = (c: string, e: 'e1' | 'e7', b: 'b1' | 'b7') => { const r = ret.find((x: any) => x.country === c); return r && r[e] > 0 ? Math.round((r[b] / r[e]) * 100) : null }
  const countries = byCountry.map((r: any) => ({ ...r, avg_playtime_per_player: r.players ? Math.round(r.active_seconds / r.players) : 0, d1: rate(r.country, 'e1', 'b1'), d7: rate(r.country, 'e7', 'b7') }))
  return {
    countries,
    states: states.map((s: any) => ({ ...s, name: NG_STATES[s.code] ?? s.code, avg_playtime_per_player: s.players ? Math.round(s.active_seconds / s.players) : 0 })),
    cities,
    note: 'Location comes from the connection, not GPS. Country and state are fairly reliable; city is approximate, especially on mobile networks.',
  }
}

// ---------- engagement ----------
export async function engagement(db: Db, f: Filters) {
  const q = dd(f)
  const bucketsS = [[0, 60, 'under 1 min'], [60, 300, '1–5 min'], [300, 600, '5–10 min'], [600, 1200, '10–20 min'], [1200, 2400, '20–40 min'], [2400, 3600, '40–60 min'], [3600, 1e9, '1 hour +']] as const
  const sp = [f.from, f.to]
  const hist = async (sql: string, params: unknown[], bounds: readonly (readonly [number, number, string])[]) => {
    const cases = bounds.map(([lo, hi], i) => `count(*) FILTER (WHERE v >= ${lo} AND v < ${hi})::int AS b${i}`).join(', ')
    const r = (await db.query<any>(`SELECT ${cases} FROM (${sql}) t`, params)).rows[0]
    return bounds.map(([, , label], i) => ({ label, count: n(r[`b${i}`]) }))
  }
  const sessionHist = await hist('SELECT s.active_seconds AS v FROM sessions s WHERE NOT s.is_test AND s.active_seconds > 0 AND s.started_at >= $1::date AND s.started_at < $2::date + 1', sp, bucketsS)
  const bucketsD = [[0, 300, 'under 5 min'], [300, 900, '5–15 min'], [900, 1800, '15–30 min'], [1800, 3600, '30–60 min'], [3600, 7200, '1–2 h'], [7200, 1e9, '2 h +']] as const
  const dailyHist = await hist(`SELECT dd.active_seconds AS v FROM device_days dd WHERE ${q.where} AND dd.active_seconds >= ${ACTIVE_MIN_SECONDS}`, q.p, bucketsD)
  const heat = (await db.query<any>('SELECT dow, hour, sum(seconds)::int AS seconds FROM activity_heat WHERE day >= $1::date AND day <= $2::date GROUP BY 1, 2', sp)).rows
  const split = (await db.query<any>('SELECT bucket, sum(seconds)::int AS seconds FROM playtime_split WHERE day >= $1::date AND day <= $2::date GROUP BY 1', sp)).rows
  const dauSeries = (await db.query<any>(`SELECT dd.day, count(*) FILTER (WHERE dd.active_seconds >= ${ACTIVE_MIN_SECONDS})::int c FROM device_days dd WHERE ${q.where} GROUP BY 1`, q.p)).rows
  const mau = await activeIn(db, f, addDays(f.to, -29), f.to)
  const avgDau = dauSeries.length ? dauSeries.reduce((a: number, r: any) => a + r.c, 0) / spanDays(f) : 0
  const perDevice = (await db.query<any>(`SELECT count(*) FILTER (WHERE dd.active_seconds >= ${ACTIVE_MIN_SECONDS})::float AS days, count(DISTINCT dd.device_id)::float AS devs, coalesce(sum(dd.sessions),0)::float AS sess FROM device_days dd WHERE ${q.where}`, q.p)).rows[0]
  const weeks = Math.max(1, spanDays(f) / 7)
  return {
    sessionHist, dailyHist, heat, split,
    stickiness: mau ? Math.round((avgDau / mau) * 100) : 0,
    sessionsPerActiveDay: perDevice.days ? Math.round((perDevice.sess / perDevice.days) * 10) / 10 : 0,
    daysPlayedPerWeek: perDevice.devs ? Math.round((perDevice.days / perDevice.devs / weeks) * 10) / 10 : 0,
    definitions: { stickiness: DEFINITIONS.stickiness },
  }
}

// ---------- features ----------
export async function features(db: Db, f: Filters) {
  const run = async (ff: Filters) => {
    const p: unknown[] = [ff.from, ff.to]; let extra = ''
    if (ff.country) { p.push(ff.country); extra = ` AND fd.device_id IN (SELECT device_id FROM devices WHERE country = $${p.length})` }
    return (await db.query<any>(`SELECT fd.feature, count(DISTINCT fd.device_id)::int AS users, sum(fd.uses)::int AS uses, CASE WHEN sum(fd.score_n) > 0 THEN sum(fd.score_sum)/sum(fd.score_n) END AS avg_score
      FROM feature_days fd WHERE NOT fd.is_test AND fd.day >= $1::date AND fd.day <= $2::date${extra} GROUP BY 1`, p)).rows
  }
  const cur = await run(f), prev = new Map((await run(previous(f))).map((r: any) => [r.feature, r]))
  const totalActive = Math.max(1, await activeIn(db, f, f.from, f.to))
  const rows = cur.map((r: any) => ({
    feature: r.feature, group: r.feature.includes(':') ? r.feature.split(':')[0] : 'other', users: r.users, uses: r.uses,
    uses_per_user: Math.round((r.uses / Math.max(1, r.users)) * 10) / 10, adoption_pct: Math.round((r.users / totalActive) * 100),
    avg_score: r.avg_score === null ? null : Math.round(r.avg_score * 100) / 100,
    trend_pct: prev.has(r.feature) && prev.get(r.feature).uses ? Math.round(((r.uses - prev.get(r.feature).uses) / prev.get(r.feature).uses) * 100) : null,
  })).sort((a: any, b: any) => b.users - a.users || b.uses - a.uses)
  return { rows, active_players: totalActive, definitions: { feature_user: DEFINITIONS.feature_user, task_score: DEFINITIONS.task_score } }
}

export async function filterOptions(db: Db) {
  const c = (await db.query<any>('SELECT DISTINCT country FROM devices WHERE country IS NOT NULL AND NOT is_test ORDER BY 1')).rows.map((r: any) => r.country)
  const v = (await db.query<any>('SELECT DISTINCT app_version FROM devices WHERE app_version IS NOT NULL AND NOT is_test ORDER BY 1 DESC LIMIT 20')).rows.map((r: any) => r.app_version)
  return { countries: c, app_versions: v, device_types: ['mobile', 'tablet', 'desktop'] }
}
