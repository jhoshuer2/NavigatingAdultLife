// Admin authentication (PRD 4.4): email + password + TOTP 2FA, server-side sessions with an 8 hour idle timeout,
// role-based access and an append-only audit log. No third-party service is needed.
import { createHmac, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { Db } from './db'
import { sha256 } from './ingest'

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>

export type Role = 'owner' | 'analyst' | 'support' | 'engineer'
export const ROLES: Role[] = ['owner', 'analyst', 'support', 'engineer']
export const IDLE_MS = 8 * 3600e3
export const COOKIE = 'nal_admin'
const MAX_FAILS = 5, FAIL_WINDOW_MS = 15 * 60e3

export interface Admin { admin_id: string; email: string; role: Role }

/** What each role may do (PRD section 2 and FR-S2). */
export const CAN = {
  overview: ['owner', 'analyst', 'engineer'],
  aggregates: ['owner', 'analyst'],            // geography, engagement, features
  playersList: ['owner', 'analyst', 'support'],
  playerDetail: ['owner', 'support'],
  playerErase: ['owner', 'support'],
  export: ['owner', 'analyst'],
  admin: ['owner'],                            // users, audit log
} as const satisfies Record<string, Role[]>
export const can = (a: Admin, what: keyof typeof CAN) => (CAN[what] as readonly Role[]).includes(a.role)

// ---------- passwords ----------
export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString('hex')}$${(await scrypt(pw, salt, 64)).toString('hex')}`
}
export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [, salt, hash] = stored.split('$')
  if (!salt || !hash) return false
  const got = await scrypt(pw, Buffer.from(salt, 'hex'), 64); const want = Buffer.from(hash, 'hex')
  return got.length === want.length && timingSafeEqual(got, want)
}

// ---------- TOTP (RFC 6238, SHA-1, 6 digits, 30 s) ----------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
export function newTotpSecret(): string {
  const b = randomBytes(20); let bits = '', out = ''
  for (const x of b) bits += x.toString(2).padStart(8, '0')
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)]
  return out
}
function b32decode(s: string): Buffer {
  let bits = ''; for (const c of s.replace(/=+$/, '').toUpperCase()) bits += B32.indexOf(c).toString(2).padStart(5, '0')
  const out: number[] = []; for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(out)
}
export function totpAt(secret: string, t: number): string {
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(t / 30000)))
  const h = createHmac('sha1', b32decode(secret)).update(counter).digest()
  const o = h[h.length - 1] & 0xf
  return String((((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1_000_000).padStart(6, '0')
}
export const verifyTotp = (secret: string, code: string, now = Date.now()) => /^\d{6}$/.test(code) && [-1, 0, 1].some((w) => totpAt(secret, now + w * 30000) === code)
export const otpauthUri = (email: string, secret: string) => `otpauth://totp/Navigating%20Adult%20Life%20Admin:${encodeURIComponent(email)}?secret=${secret}&issuer=Navigating%20Adult%20Life%20Admin`

// ---------- users ----------
export async function createAdmin(db: Db, email: string, role: Role, password?: string): Promise<{ admin_id: string; password: string; totp_secret: string; otpauth: string }> {
  if (!ROLES.includes(role)) throw new Error('bad role')
  const pw = password ?? randomBytes(9).toString('base64url')
  const secret = newTotpSecret(), id = randomUUID()
  await db.query('INSERT INTO admin_users (admin_id, email, role, password_hash, totp_secret) VALUES ($1,$2,$3,$4,$5)', [id, email.trim().toLowerCase(), role, await hashPassword(pw), secret])
  return { admin_id: id, password: pw, totp_secret: secret, otpauth: otpauthUri(email, secret) }
}

// ---------- sessions ----------
export async function login(db: Db, email: string, password: string, code: string, now = new Date()): Promise<{ token: string; admin: Admin } | { error: string; status: number }> {
  const key = `login:${email.trim().toLowerCase()}`
  const since = new Date(now.getTime() - FAIL_WINDOW_MS).toISOString()
  const fails = (await db.query<{ n: number }>('SELECT count(*)::int n FROM login_attempts WHERE key = $1 AND at > $2', [key, since])).rows[0].n
  if (fails >= MAX_FAILS) return { error: 'Too many attempts. Try again in 15 minutes.', status: 429 }
  const u = (await db.query<{ admin_id: string; email: string; role: Role; password_hash: string; totp_secret: string | null; disabled: boolean }>('SELECT * FROM admin_users WHERE email = $1', [email.trim().toLowerCase()])).rows[0]
  // always run a hash comparison so timing does not reveal whether the account exists
  const pwOk = await verifyPassword(password, u?.password_hash ?? 'scrypt$00$00')
  const codeOk = !!u?.totp_secret && verifyTotp(u.totp_secret, code.trim(), now.getTime())
  if (!u || u.disabled || !pwOk || !codeOk) {
    await db.query('INSERT INTO login_attempts (key, at) VALUES ($1, $2)', [key, now.toISOString()])
    return { error: 'Email, password or code is wrong.', status: 401 }
  }
  const token = randomBytes(32).toString('base64url')
  await db.query('INSERT INTO admin_sessions (token_hash, admin_id, created_at, last_seen) VALUES ($1,$2,$3,$3)', [sha256(token), u.admin_id, now.toISOString()])
  return { token, admin: { admin_id: u.admin_id, email: u.email, role: u.role } }
}

export function cookieOf(req: Request): string | null {
  const m = (req.headers.get('cookie') ?? '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))
  return m ? m[1] : null
}

export async function authenticate(db: Db, req: Request, now = new Date()): Promise<Admin | null> {
  const token = cookieOf(req); if (!token) return null
  const h = sha256(token)
  const r = await db.query<Admin & { last_seen: string; disabled: boolean }>(
    'SELECT u.admin_id, u.email, u.role, u.disabled, s.last_seen FROM admin_sessions s JOIN admin_users u USING (admin_id) WHERE s.token_hash = $1', [h])
  const row = r.rows[0]
  if (!row || row.disabled) return null
  if (now.getTime() - new Date(row.last_seen).getTime() > IDLE_MS) { await db.query('DELETE FROM admin_sessions WHERE token_hash = $1', [h]); return null }
  await db.query('UPDATE admin_sessions SET last_seen = $2 WHERE token_hash = $1', [h, now.toISOString()])
  return { admin_id: row.admin_id, email: row.email, role: row.role }
}

export const logout = (db: Db, req: Request) => { const t = cookieOf(req); return t ? db.query('DELETE FROM admin_sessions WHERE token_hash = $1', [sha256(t)]) : Promise.resolve() }

// ---------- audit ----------
export async function audit(db: Db, admin: Admin | null, action: string, target: string | null, detail: unknown, req?: Request) {
  const ip = req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  // the admin's own IP is kept only as a salted hash, as required for abuse investigation (PRD FR-C2 / FR-S3)
  const ipHash = ip ? sha256(`${process.env.IP_SALT ?? 'dev-salt'}:${ip}`).slice(0, 16) : null
  await db.query('INSERT INTO audit_log (admin_id, admin_email, action, target, detail, ip_hash) VALUES ($1,$2,$3,$4,$5::jsonb,$6)', [admin?.admin_id ?? null, admin?.email ?? null, action, target, JSON.stringify(detail ?? null), ipHash])
}

/** Analysts and exports see keyed hashes, never raw device ids. */
export const hashedId = (id: string) => createHmac('sha256', process.env.ID_HASH_SECRET ?? 'dev-id-secret').update(id).digest('hex').slice(0, 12)
export const shortId = (id: string) => id.slice(0, 8)
export const idFor = (a: Admin, id: string) => (a.role === 'analyst' ? hashedId(id) : shortId(id))
