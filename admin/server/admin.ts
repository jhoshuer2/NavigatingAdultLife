// Admin API router (all routes except login require a session; every route checks the role).
import { audit, authenticate, can, COOKIE, createAdmin, idFor, IDLE_MS, login, logout, ROLES, type Admin, type Role } from './auth'
import { getDb, type Db } from './db'
import * as Q from './queries'
import * as Q2 from './queries2'
import { eraseDevice } from './ingest'
import { allowedOrigins, json } from './http'
import { EVENT_PROPS } from '../../shared/events'
import { RETENTION, purge } from './retention'

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const dayRe = /^\d{4}-\d{2}-\d{2}$/

function filters(u: URL, now = new Date()): Q.Filters {
  const today = now.toISOString().slice(0, 10)
  const to = dayRe.test(u.searchParams.get('to') ?? '') ? u.searchParams.get('to')! : today
  let from = dayRe.test(u.searchParams.get('from') ?? '') ? u.searchParams.get('from')! : Q.addDays(to, -29)
  if (from > to) from = to
  if (Q.spanDays({ from, to }) > 800) from = Q.addDays(to, -799)
  const s = (k: string) => { const v = u.searchParams.get(k); return v && v !== 'all' ? v.slice(0, 40) : undefined }
  const cohort = u.searchParams.get('cohort')
  return { from, to, country: s('country')?.toUpperCase(), device_type: s('device_type'), app_version: s('app_version'), cohort: cohort === 'new' || cohort === 'returning' ? cohort : undefined }
}
const forbidden = () => json({ error: 'Your role cannot do this.' }, 403)

function csv(rows: Record<string, unknown>[], cols: string[]): string {
  const esc = (v: unknown) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) || /^[=+\-@]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s } // quote, and defuse spreadsheet formulas
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
}

export async function handleAdmin(req: Request, dbArg?: Db, now = new Date()): Promise<Response> {
  const url = new URL(req.url)
  const route = (url.searchParams.get('route') ?? url.pathname.replace(/^\/api\/admin\/?/, '')).replace(/^\/+|\/+$/g, '')
  const parts = route.split('/')
  const method = req.method

  if (method !== 'GET' && req.headers.get('x-nal-admin') !== '1') return json({ error: 'missing header' }, 403) // CSRF guard on top of SameSite=Strict

  try {
    const db = dbArg ?? (await getDb())
    if (route === 'login' && method === 'POST') {
      const b = (await req.json().catch(() => ({}))) as { email?: string; password?: string; code?: string }
      const r = await login(db, String(b.email ?? ''), String(b.password ?? ''), String(b.code ?? ''), now)
      if ('error' in r) { await audit(db, null, 'login.failed', String(b.email ?? '').slice(0, 80), null, req); return json({ error: r.error }, r.status) }
      await audit(db, r.admin, 'login', null, null, req)
      const secure = url.protocol === 'https:' ? '; Secure' : ''
      return json({ admin: r.admin }, 200, { 'set-cookie': `${COOKIE}=${r.token}; HttpOnly; SameSite=Strict; Path=/api${secure}; Max-Age=${IDLE_MS / 1000}` })
    }
    const me = await authenticate(db, req, now)
    if (!me) return json({ error: 'Please sign in.' }, 401)
    if (route === 'logout' && method === 'POST') { await logout(db, req); return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/api; Max-Age=0` }) }
    if (route === 'me') return json({ admin: me, retention: RETENTION })
    if (method === 'GET') return await get(db, me, parts, url, req, now)
    return await write(db, me, parts, method, req)
  } catch (e) {
    console.error('admin error', (e as Error).message)
    return json({ error: 'Something went wrong.' }, 500)
  }
}

async function get(db: Db, me: Admin, parts: string[], url: URL, req: Request, now: Date): Promise<Response> {
  const f = filters(url, now)
  switch (parts[0]) {
    case 'options': return can(me, 'overview') || can(me, 'playersList') ? json(await Q.filterOptions(db)) : forbidden()
    case 'overview': return can(me, 'overview') ? json(await Q.overview(db, f)) : forbidden()
    case 'geography': return can(me, 'aggregates') ? json(await Q.geography(db, f)) : forbidden()
    case 'engagement': return can(me, 'aggregates') ? json(await Q.engagement(db, f)) : forbidden()
    case 'features': return can(me, 'aggregates') ? json(await Q.features(db, f)) : forbidden()
    case 'funnels': {
      if (!can(me, 'aggregates')) return forbidden()
      const by = url.searchParams.get('by'); const asOf = now.toISOString().slice(0, 10)
      const [fu, ret, drop] = await Promise.all([Q2.funnel(db, f), Q2.retention(db, f, by === 'country' || by === 'device_type' ? by : 'week', asOf), Q2.dropoff(db, f, asOf)])
      return json({ funnel: fu, retention: ret, dropoff: drop })
    }
    case 'content': return can(me, 'aggregates') ? json(await Q2.content(db, f)) : forbidden()
    case 'quality': return can(me, 'quality') ? json(await Q2.quality(db, f)) : forbidden()
    case 'live': return can(me, 'quality') ? json(await Q2.live(db, now, (id) => idFor(me, id))) : forbidden()
    case 'players': case 'players.csv': {
      const csvOut = parts[0] === 'players.csv'
      if (!can(me, csvOut ? 'export' : 'playersList')) return forbidden()
      const pq: Q.PlayerQuery = { ...f, from: url.searchParams.get('from') ? f.from : undefined as never, to: url.searchParams.get('to') ? f.to : undefined as never, search: url.searchParams.get('q') ?? undefined, includeTest: me.role === 'owner' && url.searchParams.get('include_test') === '1', sort: url.searchParams.get('sort') ?? undefined, dir: url.searchParams.get('dir') === 'asc' ? 'asc' : 'desc', page: Number(url.searchParams.get('page') ?? 1), size: Number(url.searchParams.get('size') ?? 25) }
      const label = (r: any) => idFor(me, r.device_id)
      if (csvOut) {
        const rows = (await Q.playersForExport(db, pq)).map((r: any) => ({ player: label(r), first_seen: r.first_seen, last_seen: r.last_seen, country: r.country, region: r.region, city: r.city, device: r.device_type, os: r.os, browser: r.browser, sessions: r.sessions_count, active_seconds: r.active_seconds, lives: r.lives_count, last_feature: r.last_feature, status: r.status }))
        await audit(db, me, 'players.export', null, { rows: rows.length }, req)
        return new Response(csv(rows, ['player', 'first_seen', 'last_seen', 'country', 'region', 'city', 'device', 'os', 'browser', 'sessions', 'active_seconds', 'lives', 'last_feature', 'status']), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="players.csv"', 'cache-control': 'no-store' } })
      }
      const r = await Q.players(db, pq, now)
      // analysts never receive a real device id; others get it only when they may open the detail page
      return json({ ...r, rows: r.rows.map((x: any) => { const { device_id, ...rest } = x; return { ...rest, label: label(x), id: can(me, 'playerDetail') ? device_id : null } }) })
    }
    case 'player': {
      if (!can(me, 'playerDetail')) return forbidden()
      const id = parts[1] ?? ''; if (!uuidRe.test(id)) return json({ error: 'bad id' }, 400)
      const d = await Q.playerDetail(db, id.toLowerCase())
      await audit(db, me, 'player.view', idFor(me, id), { found: !!d }, req)  // every single-player read is logged (FR-S3)
      return d ? json(d) : json({ error: 'Not found' }, 404)
    }
    case 'settings': {
      if (!can(me, 'admin')) return forbidden()
      if (parts[1] === 'users') return json({ users: (await db.query('SELECT admin_id, email, role, disabled, created_at FROM admin_users ORDER BY created_at')).rows })
      if (parts[1] === 'audit') return json({ rows: (await db.query('SELECT id, admin_email, action, target, detail, at, ip_hash FROM audit_log ORDER BY id DESC LIMIT 200')).rows })
      if (parts[1] === 'summary') return json(await Q2.weeklySummary(db, now))
      if (parts[1] === 'schema') return json({ events: EVENT_PROPS, retention: RETENTION, definitions: Q.DEFINITIONS, ingest: await collectorHealth(db), blocked_origins: (await db.query('SELECT day::text, origin, n FROM blocked_origins WHERE day >= current_date - 13 ORDER BY day DESC, n DESC LIMIT 60')).rows, allowed_origins: allowedOrigins() })
      return json({ error: 'Not found' }, 404)
    }
    default: return json({ error: 'Not found' }, 404)
  }
}

async function write(db: Db, me: Admin, parts: string[], method: string, req: Request): Promise<Response> {
  if (parts[0] === 'player' && parts[2] === 'erase' && method === 'POST') {
    if (!can(me, 'playerErase')) return forbidden()
    const id = parts[1] ?? ''; if (!uuidRe.test(id)) return json({ error: 'bad id' }, 400)
    await eraseDevice(db, id.toLowerCase()); await audit(db, me, 'player.erase', idFor(me, id), null, req)
    return json({ ok: true })
  }
  if (parts[0] === 'settings' && parts[1] === 'users' && method === 'POST') {
    if (!can(me, 'admin')) return forbidden()
    if (parts[3] === 'disable') {
      if (parts[2] === me.admin_id) return json({ error: 'You cannot disable yourself.' }, 400)
      await db.query('UPDATE admin_users SET disabled = true WHERE admin_id = $1', [parts[2]]); await db.query('DELETE FROM admin_sessions WHERE admin_id = $1', [parts[2]])
      await audit(db, me, 'user.disable', parts[2], null, req); return json({ ok: true })
    }
    const b = (await req.json().catch(() => ({}))) as { email?: string; role?: string }
    if (!b.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email) || !ROLES.includes(b.role as Role)) return json({ error: 'Need a valid email and role.' }, 400)
    try { const u = await createAdmin(db, b.email, b.role as Role); await audit(db, me, 'user.create', b.email.toLowerCase(), { role: b.role }, req); return json({ ...u, note: 'Shown once. Give the password and 2FA secret to the person privately.' }) }
    catch { return json({ error: 'That email already exists.' }, 409) }
  }
  return json({ error: 'Not found' }, 404)
}

/** Per day: events accepted/rejected plus how many different devices sent them (test traffic counted separately). */
async function collectorHealth(db: Db) {
  const stats = (await db.query<any>('SELECT day::text, accepted, duplicate, invalid, rate_limited FROM ingest_stats ORDER BY day DESC LIMIT 14')).rows
  const dev = (await db.query<any>(`SELECT received_at::date::text AS day, count(DISTINCT device_id)::int AS devices, count(DISTINCT device_id) FILTER (WHERE is_test)::int AS test_devices
    FROM raw_events WHERE received_at >= current_date - 13 GROUP BY 1`)).rows
  return stats.map((s: any) => ({ ...s, devices: dev.find((d: any) => d.day === s.day)?.devices ?? 0, test_devices: dev.find((d: any) => d.day === s.day)?.test_devices ?? 0 }))
}

/** Daily maintenance (Vercel Cron): retention purge. Authorised by CRON_SECRET. */
export async function handleCron(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('unauthorized', { status: 401 })
  await purge(await getDb()); return json({ ok: true })
}
