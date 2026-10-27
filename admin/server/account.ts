// Player accounts API (docs/PRD-multiplayer.md FR-M1): anonymous accounts with a display name, an age band, a guardian PIN
// and a recovery code. One POST endpoint (so CORS stays simple); the session token travels in an Authorization header.
import { createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto'
import { AccountRequest, type AccountError, type AccountPublic, type AccountResponse } from '../../shared/account'
import { hashPassword, verifyPassword } from './auth'
import { getDb, type Db } from './db'
import { allowedOrigins, json, readJson } from './http'

const TOKEN_TTL_MS = 60 * 86400e3
const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

function secret(): string {
  const s = process.env.ACCOUNT_SECRET
  if (!s) throw new Error('ACCOUNT_SECRET is not set')
  return s
}
const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url')
const hmac = (data: string) => createHmac('sha256', secret()).update(data).digest('base64url')

export function signToken(accountId: string, ver: number, now = Date.now()): string {
  const body = b64(JSON.stringify({ a: accountId, v: ver, e: now + TOKEN_TTL_MS }))
  return `${body}.${hmac(body)}`
}
export function readToken(token: string | null, now = Date.now()): { a: string; v: number } | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const want = hmac(body); const a = Buffer.from(sig), b = Buffer.from(want)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()) as { a?: string; v?: number; e?: number }; return typeof p.a === 'string' && typeof p.v === 'number' && typeof p.e === 'number' && p.e > now ? { a: p.a, v: p.v } : null } catch { return null }
}

const randomCode = (n: number) => Array.from({ length: n }, () => CROCKFORD[randomInt(32)]).join('')
const newRecovery = () => { const c = randomCode(16); return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}-${c.slice(12)}` }
const recoveryHash = (code: string) => hmac(`recovery:${code.replace(/-/g, '').toUpperCase()}`)

export interface Row { account_id: string; name: string; tag: number; friend_code: string; age_band: string; mp_enabled: boolean; chat_level: string; guardian_pin_hash: string | null; token_ver: number; created_at: Date | string }
const toPublic = (r: Row): AccountPublic => ({
  id: r.account_id, name: r.name, tag: r.tag, label: `${r.name}#${r.tag}`, friend_code: r.friend_code, age_band: r.age_band as AccountPublic['age_band'],
  mp_enabled: r.mp_enabled, has_guardian_pin: !!r.guardian_pin_hash, chat_level: r.chat_level as AccountPublic['chat_level'], created_at: new Date(r.created_at).toISOString(),
})

/** Count recent attempts for a key and record this one. Returns false when over the limit. */
export async function throttle(db: Db, key: string, kind: string, max: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs).toISOString()
  const n = Number((await db.query<{ n: string }>('SELECT count(*)::int AS n FROM account_attempts WHERE key=$1 AND kind=$2 AND at > $3', [key, kind, since])).rows[0]?.n ?? 0)
  if (n >= max) return false
  await db.query('INSERT INTO account_attempts (key, kind) VALUES ($1,$2)', [key, kind])
  return true
}
const ipKey = (headers: Headers) => hmac(`ip:${(headers.get('x-forwarded-for') ?? headers.get('x-real-ip') ?? 'unknown').split(',')[0].trim()}`)

export function accountCors(req: Request): Record<string, string> {
  const origin = req.headers.get('origin'); const list = allowedOrigins()
  if (!origin || !list.includes(origin)) return {}
  return { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type, authorization', 'access-control-max-age': '86400', vary: 'origin' }
}

const STATUS: Record<AccountError, number> = { bad_request: 400, bad_name: 400, unauthorized: 401, guardian_required: 403, pin_required: 403, bad_pin: 403, rate_limited: 429, not_found: 404, server: 500 }
const fail = (e: AccountError, cors: Record<string, string>) => json({ error: e } satisfies AccountResponse, STATUS[e], cors)

export async function load(db: Db, token: string | null): Promise<Row | null> {
  const t = readToken(token); if (!t) return null
  const r = (await db.query<Row>('SELECT * FROM accounts WHERE account_id=$1', [t.a])).rows[0]
  return r && r.token_ver === t.v ? r : null
}

async function uniqueTag(db: Db, name: string): Promise<number> {
  for (let i = 0; i < 30; i++) {
    const tag = randomInt(1000, 10000)
    if (!(await db.query('SELECT 1 FROM accounts WHERE lower(name)=lower($1) AND tag=$2', [name, tag])).rows.length) return tag
  }
  throw new Error('no free tag')
}

export async function handleAccount(req: Request, injected?: Db): Promise<Response> {
  const cors = accountCors(req)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: cors })
  const raw = await readJson(req)
  if (!raw.ok) return new Response(null, { status: raw.status, headers: cors })
  const parsed = AccountRequest.safeParse(raw.body)
  if (!parsed.success) return fail(parsed.error.issues.some((i) => i.message === 'bad_name') ? 'bad_name' : 'bad_request', cors)
  const q = parsed.data
  try {
    const db = injected ?? await getDb()
    const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '') || null

    if (q.op === 'create') {
      if (!(await throttle(db, ipKey(req.headers), 'create', 8, 3600e3))) return fail('rate_limited', cors)
      const code = newRecovery(); const id = randomUUID(); const tag = await uniqueTag(db, q.name)
      let friend = ''
      for (let i = 0; i < 10; i++) { friend = randomCode(8); if (!(await db.query('SELECT 1 FROM accounts WHERE friend_code=$1', [friend])).rows.length) break }
      const row = (await db.query<Row>(
        'INSERT INTO accounts (account_id, name, tag, friend_code, age_band, recovery_hash, country) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [id, q.name, tag, friend, q.age_band, recoveryHash(code), req.headers.get('x-vercel-ip-country')],
      )).rows[0]
      return json({ account: toPublic(row), token: signToken(id, row.token_ver), recovery_code: code } satisfies AccountResponse, 201, cors)
    }

    if (q.op === 'recover') {
      if (!(await throttle(db, ipKey(req.headers), 'recover', 10, 3600e3))) return fail('rate_limited', cors)
      const row = (await db.query<Row>('SELECT * FROM accounts WHERE recovery_hash=$1', [recoveryHash(q.code)])).rows[0]
      if (!row) return fail('not_found', cors)
      const bumped = (await db.query<Row>('UPDATE accounts SET token_ver = token_ver + 1, last_seen = now() WHERE account_id=$1 RETURNING *', [row.account_id])).rows[0]
      return json({ account: toPublic(bumped), token: signToken(bumped.account_id, bumped.token_ver) } satisfies AccountResponse, 200, cors)
    }

    const me = await load(db, bearer)
    if (!me) return fail('unauthorized', cors)
    await db.query('UPDATE accounts SET last_seen = now() WHERE account_id=$1', [me.account_id])

    switch (q.op) {
      case 'me': return json({ account: toPublic(me) } satisfies AccountResponse, 200, cors)

      case 'update': {
        let r = me
        if (q.name && q.name !== me.name) {
          const tag = await uniqueTag(db, q.name)
          r = (await db.query<Row>('UPDATE accounts SET name=$2, tag=$3 WHERE account_id=$1 RETURNING *', [me.account_id, q.name, tag])).rows[0]
        }
        if (q.mp_enabled !== undefined && q.mp_enabled !== me.mp_enabled) {
          if (q.mp_enabled) {
            if (!me.guardian_pin_hash) { if (me.age_band === 'under13') return fail('guardian_required', cors) }
            else {
              if (!q.pin) return fail('pin_required', cors)
              if (!(await throttle(db, me.account_id, 'pin', 8, 3600e3))) return fail('rate_limited', cors)
              if (!(await verifyPassword(q.pin, me.guardian_pin_hash))) return fail('bad_pin', cors)
            }
          }
          r = (await db.query<Row>('UPDATE accounts SET mp_enabled=$2 WHERE account_id=$1 RETURNING *', [me.account_id, q.mp_enabled])).rows[0]
        }
        return json({ account: toPublic(r) } satisfies AccountResponse, 200, cors)
      }

      case 'set_pin': {
        if (me.guardian_pin_hash) {
          if (!q.current_pin) return fail('pin_required', cors)
          if (!(await throttle(db, me.account_id, 'pin', 8, 3600e3))) return fail('rate_limited', cors)
          if (!(await verifyPassword(q.current_pin, me.guardian_pin_hash))) return fail('bad_pin', cors)
        }
        const r = (await db.query<Row>('UPDATE accounts SET guardian_pin_hash=$2 WHERE account_id=$1 RETURNING *', [me.account_id, await hashPassword(q.pin)])).rows[0]
        return json({ account: toPublic(r) } satisfies AccountResponse, 200, cors)
      }

      case 'rotate_recovery': {
        const code = newRecovery()
        await db.query('UPDATE accounts SET recovery_hash=$2 WHERE account_id=$1', [me.account_id, recoveryHash(code)])
        return json({ account: toPublic(me), recovery_code: code } satisfies AccountResponse, 200, cors)
      }

      case 'logout_all': {
        const r = (await db.query<Row>('UPDATE accounts SET token_ver = token_ver + 1 WHERE account_id=$1 RETURNING *', [me.account_id])).rows[0]
        return json({ ok: true, token: signToken(r.account_id, r.token_ver) } satisfies AccountResponse, 200, cors)
      }

      case 'delete':
        await db.query('DELETE FROM accounts WHERE account_id=$1', [me.account_id])
        await db.query('DELETE FROM account_attempts WHERE key=$1', [me.account_id])
        return json({ ok: true } satisfies AccountResponse, 200, cors)
    }
  } catch (e) {
    console.error('account failed', (e as Error).message)
    return fail('server', cors)
  }
  return fail('bad_request', cors)
}

/** Inactive anonymous accounts are removed after 18 months (called by the daily retention job). */
export async function purgeInactiveAccounts(db: Db, now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - 548 * 86400e3).toISOString()
  const r = await db.query('DELETE FROM accounts WHERE last_seen < $1', [cutoff])
  await db.query("DELETE FROM account_attempts WHERE at < now() - interval '2 days'")
  await db.query('DELETE FROM rush_matches WHERE created_at < $1', [new Date(now.getTime() - 7 * 86400e3).toISOString()]) // finished and abandoned races
  return r.rowCount
}
void randomBytes
