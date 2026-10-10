// Phase C dashboards: funnels, retention cohorts, drop-off, content, quality, live view and the weekly summary.
import type { Db } from './db'
import { FUNNEL_STEPS } from './features'
import { ACTIVE_MIN_SECONDS, addDays, spanDays, overview, features, geography, type Filters } from './queries'

const n = (v: unknown) => Number(v ?? 0)
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null)

export const DEFS2 = {
  funnel: 'Players first seen in the range, counted at each step only if they also did every earlier step. "Came back another day" means active (10+ seconds) on a later day than their first.',
  retention: 'Share of a first-seen cohort active (10+ seconds) exactly n days later. Cohorts too young to measure a given day are left blank.',
  dropoff: 'Age of the character on lives that were never finished and whose player has not been seen for 7 days.',
  completion: 'Tasks finished divided by tasks started. The gap is people leaving the task early.',
  slow: 'Devices where the game reported it was running slowly, as a share of active devices.',
  webgl: 'Devices where the 3D world could not start, as a share of active devices.',
  load: 'Time until the page was ready, as measured by the browser when the game opened.',
  live: 'Players with a heartbeat in the last 2 minutes.',
} as const

function devWhere(f: Filters, a = 'd') {
  const p: unknown[] = []; const c = [`NOT ${a}.is_test`]
  const add = (v: unknown) => { p.push(v); return `$${p.length}` }
  c.push(`${a}.first_seen >= ${add(f.from)}::date`, `${a}.first_seen < ${add(f.to)}::date + 1`)
  if (f.country) c.push(`${a}.country = ${add(f.country)}`)
  if (f.device_type) c.push(`${a}.device_type = ${add(f.device_type)}`)
  if (f.app_version) c.push(`${a}.app_version = ${add(f.app_version)}`)
  return { where: c.join(' AND '), p }
}

// ---------- funnels ----------
export async function funnel(db: Db, f: Filters) {
  const w = devWhere(f)
  const steps = FUNNEL_STEPS.map((s) => s.id)
  const flag = (id: string) => `coalesce(bool_or(m.step = '${id}'), false)`
  const r = (await db.query<any>(`
    WITH per AS (
      SELECT d.device_id,
        true AS landing, ${flag('created')} AS created, ${flag('walk')} AS walk, ${flag('task')} AS task, ${flag('year')} AS year,
        EXISTS (SELECT 1 FROM device_days x WHERE x.device_id = d.device_id AND x.day > d.first_seen::date AND x.active_seconds >= ${ACTIVE_MIN_SECONDS}) AS "return",
        ${flag('paywall')} AS paywall, ${flag('topup')} AS topup
      FROM devices d LEFT JOIN device_milestones m ON m.device_id = d.device_id WHERE ${w.where} GROUP BY d.device_id, d.first_seen)
    SELECT count(*)::int AS s0,
      count(*) FILTER (WHERE created)::int AS s1,
      count(*) FILTER (WHERE created AND walk)::int AS s2,
      count(*) FILTER (WHERE created AND walk AND task)::int AS s3,
      count(*) FILTER (WHERE created AND walk AND task AND year)::int AS s4,
      count(*) FILTER (WHERE created AND walk AND task AND year AND "return")::int AS s5,
      count(*) FILTER (WHERE created AND walk AND task AND year AND "return" AND paywall)::int AS s6,
      count(*) FILTER (WHERE created AND walk AND task AND year AND "return" AND paywall AND topup)::int AS s7
    FROM per`, w.p)).rows[0]
  const total = n(r.s0)
  const rows = steps.map((id, i) => {
    const count = n(r[`s${i}`]), prev = i ? n(r[`s${i - 1}`]) : count
    return { id, label: FUNNEL_STEPS[i].label, count, of_start_pct: pct(count, total), of_previous_pct: i ? pct(count, prev) : 100, lost: i ? prev - count : 0 }
  })
  return { rows, total, definition: DEFS2.funnel }
}

// ---------- retention cohorts ----------
export const RETENTION_DAYS = [1, 3, 7, 14, 30] as const
export async function retention(db: Db, f: Filters, by: 'week' | 'country' | 'device_type', asOf: string) {
  const p: unknown[] = [f.from, f.to, asOf]
  const extra: string[] = []
  if (by !== 'country' && f.country) { p.push(f.country); extra.push(`dd.country = $${p.length}`) }
  if (by !== 'device_type' && f.device_type) { p.push(f.device_type); extra.push(`dd.device_type = $${p.length}`) }
  if (f.app_version) { p.push(f.app_version); extra.push(`dd.app_version = $${p.length}`) }
  const key = by === 'week' ? "to_char(date_trunc('week', dd.day), 'YYYY-MM-DD')" : by === 'country' ? "coalesce(dd.country, '??')" : "coalesce(dd.device_type, 'unknown')"
  const sel = RETENTION_DAYS.map((d) => `count(*) FILTER (WHERE dd.day + ${d} <= $3::date)::int AS e${d}, count(x${d}.device_id) FILTER (WHERE x${d}.active_seconds >= ${ACTIVE_MIN_SECONDS})::int AS b${d}`).join(', ')
  const joins = RETENTION_DAYS.map((d) => `LEFT JOIN device_days x${d} ON x${d}.device_id = dd.device_id AND x${d}.day = dd.day + ${d}`).join(' ')
  const rows = (await db.query<any>(`SELECT ${key} AS cohort, count(*)::int AS size, ${sel} FROM device_days dd ${joins}
    WHERE dd.is_new AND NOT dd.is_test AND dd.day >= $1::date AND dd.day <= $2::date ${extra.length ? 'AND ' + extra.join(' AND ') : ''} GROUP BY 1 ORDER BY ${by === 'week' ? '1' : 'size DESC'}`, p)).rows
  return {
    days: RETENTION_DAYS, by,
    rows: rows.map((r: any) => ({ cohort: r.cohort, size: r.size, values: RETENTION_DAYS.map((d) => pct(r[`b${d}`], r[`e${d}`])) })),
    definition: DEFS2.retention,
  }
}

// ---------- drop-off inside a life ----------
export async function dropoff(db: Db, f: Filters, asOf: string) {
  const p: unknown[] = [f.from, f.to]; let extra = ''
  if (f.country) { p.push(f.country); extra += ` AND d.country = $${p.length}` }
  if (f.device_type) { p.push(f.device_type); extra += ` AND d.device_type = $${p.length}` }
  const base = `FROM lives l JOIN devices d USING (device_id) WHERE NOT l.is_test AND l.started_at >= $1::date AND l.started_at < $2::date + 1${extra}`
  const quit = (await db.query<any>(`SELECT (least(l.last_age, 99) / 10)::int AS band, count(*)::int AS lives ${base} AND l.ended_at IS NULL AND l.last_age IS NOT NULL AND d.last_seen < ($${p.length + 1}::date - 7) GROUP BY 1 ORDER BY 1`, [...p, asOf])).rows
  const endings = (await db.query<any>(`SELECT l.ending_id, count(*)::int AS lives, round(avg(l.age_reached))::int AS avg_age ${base} AND l.ending_id IS NOT NULL GROUP BY 1 ORDER BY lives DESC LIMIT 15`, p)).rows
  const bands = Array.from({ length: 10 }, (_, i) => ({ label: i === 9 ? '90+' : `${i * 10}–${i * 10 + 9}`, lives: n(quit.find((q: any) => q.band === i)?.lives) }))
  return { quit: bands, endings, definition: DEFS2.dropoff }
}

// ---------- content ----------
export async function content(db: Db, f: Filters) {
  const p = [f.from, f.to]
  const cd = (await db.query<any>(`SELECT kind, item_id, choice_id, sum(n)::int AS n, count(DISTINCT device_id)::int AS devices FROM content_days WHERE NOT is_test AND day >= $1::date AND day <= $2::date GROUP BY 1, 2, 3`, p)).rows
  const stories = new Map<string, { event_id: string; shown: number; flags: number; choices: { choice: string; n: number }[] }>()
  const get = (id: string) => stories.get(id) ?? stories.set(id, { event_id: id, shown: 0, flags: 0, choices: [] }).get(id)!
  for (const r of cd) {
    if (r.kind === 'shown') get(r.item_id).shown += r.n
    else if (r.kind === 'flag') get(r.item_id).flags += r.n
    else if (r.kind === 'choice') get(r.item_id).choices.push({ choice: r.choice_id, n: r.n })
  }
  const storyRows = [...stories.values()].map((s) => ({ ...s, choices: s.choices.sort((a, b) => b.n - a.n), flag_rate: pct(s.flags, s.shown) }))
  const tones = new Map<string, number>(); const toneRole = new Map<string, number>()
  for (const r of cd) if (r.kind === 'tone') { tones.set(r.item_id, (tones.get(r.item_id) ?? 0) + r.n); toneRole.set(`${r.choice_id}|${r.item_id}`, r.n) }
  const done = (await db.query<any>(`SELECT replace(feature, 'task:', '') AS task, sum(uses)::int AS completed, CASE WHEN sum(score_n) > 0 THEN sum(score_sum)/sum(score_n) END AS avg_score FROM feature_days WHERE NOT is_test AND feature LIKE 'task:%' AND day >= $1::date AND day <= $2::date GROUP BY 1`, p)).rows
  const tasks = new Set<string>([...done.map((d: any) => d.task), ...cd.filter((r: any) => r.kind === 'task_started' || r.kind === 'task_abandoned').map((r: any) => r.item_id)])
  const taskRows = [...tasks].map((t) => {
    const started = n(cd.find((r: any) => r.kind === 'task_started' && r.item_id === t)?.n), abandoned = n(cd.find((r: any) => r.kind === 'task_abandoned' && r.item_id === t)?.n)
    const d = done.find((x: any) => x.task === t)
    return { task: t, started, completed: n(d?.completed), abandoned, completion_pct: pct(n(d?.completed), started), avg_score: d?.avg_score == null ? null : Math.round(d.avg_score * 100) / 100 }
  }).sort((a, b) => b.started - a.started)
  return {
    stories: storyRows.sort((a, b) => b.shown - a.shown).slice(0, 60),
    flagged: storyRows.filter((s) => s.flags > 0).sort((a, b) => b.flags - a.flags).slice(0, 20),
    tones: [...tones.entries()].map(([tone, count]) => ({ tone, count })).sort((a, b) => b.count - a.count),
    tones_by_role: [...toneRole.entries()].map(([k, count]) => { const [role, tone] = k.split('|'); return { role: role || 'unknown', tone, count } }),
    tasks: taskRows, definitions: { completion: DEFS2.completion },
  }
}

// ---------- quality ----------
export async function quality(db: Db, f: Filters) {
  const p: unknown[] = [f.from, f.to]; let extra = ''
  const add = (v: unknown) => { p.push(v); return `$${p.length}` }
  if (f.device_type) extra += ` AND q.device_type = ${add(f.device_type)}`
  if (f.app_version) extra += ` AND q.app_version = ${add(f.app_version)}`
  if (f.country) extra += ` AND d.country = ${add(f.country)}`
  const from = `FROM quality_days q JOIN devices d USING (device_id) WHERE NOT q.is_test AND q.day >= $1::date AND q.day <= $2::date${extra}`
  const active = n((await db.query<any>(`SELECT count(DISTINCT dd.device_id)::int c FROM device_days dd JOIN devices d USING (device_id) WHERE NOT dd.is_test AND dd.day >= $1::date AND dd.day <= $2::date AND dd.active_seconds >= ${ACTIVE_MIN_SECONDS}${extra.replace(/q\./g, 'dd.')}`, p)).rows[0].c)
  const s = (await db.query<any>(`SELECT count(DISTINCT q.device_id) FILTER (WHERE q.slow > 0)::int AS slow, count(DISTINCT q.device_id) FILTER (WHERE q.webgl_fail > 0)::int AS webgl, count(DISTINCT q.device_id) FILTER (WHERE q.errors > 0)::int AS err_devices, coalesce(sum(q.errors),0)::int AS errors ${from}`, p)).rows[0]
  const errRows = (await db.query<any>(`SELECT e.message, sum(e.n)::int AS n, count(DISTINCT e.device_id)::int AS devices, array_agg(DISTINCT e.app_version) AS versions, array_agg(DISTINCT e.device_type) AS device_types, max(e.day)::text AS last_day
    FROM error_days e JOIN devices d USING (device_id) WHERE NOT e.is_test AND e.day >= $1::date AND e.day <= $2::date${extra.replace(/q\./g, 'e.')} GROUP BY 1 ORDER BY n DESC LIMIT 30`, p)).rows
  const loads = (await db.query<any>(`SELECT q.load_ms AS v ${from} AND q.load_ms IS NOT NULL`, p)).rows.map((r: any) => n(r.v))
  const bands = [[0, 1000, 'under 1 s'], [1000, 2000, '1–2 s'], [2000, 4000, '2–4 s'], [4000, 8000, '4–8 s'], [8000, 1e12, '8 s +']] as const
  const by = async (col: 'app_version' | 'device_type') => (await db.query<any>(`SELECT coalesce(q.${col}, 'unknown') AS key, count(DISTINCT q.device_id)::int AS devices, count(DISTINCT q.device_id) FILTER (WHERE q.slow > 0)::int AS slow, count(DISTINCT q.device_id) FILTER (WHERE q.webgl_fail > 0)::int AS webgl, coalesce(sum(q.errors),0)::int AS errors, round(percentile_cont(0.5) WITHIN GROUP (ORDER BY q.load_ms))::int AS median_load ${from} GROUP BY 1 ORDER BY devices DESC LIMIT 12`, p)).rows
  return {
    active_devices: active, slow_devices: s.slow, webgl_devices: s.webgl, error_devices: s.err_devices, errors: s.errors,
    slow_rate: pct(s.slow, active), webgl_rate: pct(s.webgl, active),
    errors_list: errRows, load_bands: bands.map(([lo, hi, label]) => ({ label, count: loads.filter((v: number) => v >= lo && v < hi).length })),
    by_version: await by('app_version'), by_device: await by('device_type'),
    definitions: { slow: DEFS2.slow, webgl: DEFS2.webgl, load: DEFS2.load },
    note: 'Error text is cut to 80 characters and never includes player input.',
  }
}

// ---------- live ----------
export async function live(db: Db, now: Date, idLabel: (id: string) => string) {
  const since = new Date(now.getTime() - 2 * 60e3).toISOString()
  const rows = (await db.query<any>(`SELECT device_id, country, city, last_screen, last_heartbeat_at, device_type FROM devices WHERE NOT is_test AND last_heartbeat_at > $1 ORDER BY last_heartbeat_at DESC LIMIT 200`, [since])).rows
  const tally = (k: string) => Object.entries(rows.reduce((a: Record<string, number>, r: any) => { const v = r[k] || 'unknown'; a[v] = (a[v] ?? 0) + 1; return a }, {})).map(([key, count]) => ({ key, count: count as number })).sort((a, b) => b.count - a.count)
  return { online: rows.length, by_country: tally('country'), by_screen: tally('last_screen'), players: rows.slice(0, 50).map((r: any) => ({ label: idLabel(r.device_id), country: r.country, city: r.city, screen: r.last_screen, device_type: r.device_type, seen: r.last_heartbeat_at })), definition: DEFS2.live }
}

// ---------- weekly summary ----------
export async function weeklySummary(db: Db, now: Date) {
  const to = addDays(now.toISOString().slice(0, 10), -1), from = addDays(to, -6)
  const f: Filters = { from, to }
  const [o, ft, geo, q, fu] = await Promise.all([overview(db, f), features(db, f), geography(db, f), quality(db, f), funnel(db, f)])
  const k = o.kpis, p = o.previous
  const d = (a: number, b: number) => (b > 0 ? `${a >= b ? '+' : ''}${Math.round(((a - b) / b) * 100)}%` : 'new')
  const lines = [
    `Adult Life weekly summary, ${from} to ${to}`, '',
    `Players: ${k.wau} active this week (${d(k.wau, p.wau)} vs last week), ${k.new_players} new, ${k.returning_players} returning.`,
    `Time: ${Math.round(k.avg_active_per_player_day / 60)} min per player per day; ${k.sessions} sessions averaging ${Math.round(k.avg_session / 60)} min.`,
    `Lives: ${k.lives_started} started, ${k.lives_completed} finished.`,
    `Top places: ${geo.countries.slice(0, 3).map((c: any) => `${c.country} (${c.players})`).join(', ') || 'none yet'}; top Nigerian states: ${geo.states.slice(0, 3).map((s: any) => `${s.name} (${s.players})`).join(', ') || 'none yet'}.`,
    `Most used: ${ft.rows.slice(0, 5).map((r: any) => `${r.feature} (${r.users})`).join(', ') || 'none yet'}.`,
    `New players who finished a first task: ${fu.rows[3].count} of ${fu.total} (${fu.rows[3].of_start_pct ?? 0}%); came back another day: ${fu.rows[5].count}.`,
    `Quality: ${q.errors} errors, ${q.slow_rate ?? 0}% of devices slow, ${q.webgl_rate ?? 0}% could not start 3D.`,
    '', 'Counts only include players who agreed to share statistics, so they undercount.',
  ]
  return { from, to, text: lines.join('\n') }
}

export { spanDays }
