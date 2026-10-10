import { beforeAll, describe, expect, it } from 'vitest'
import { handleAccount, purgeInactiveAccounts, readToken, signToken } from '../server/account'
import { freshDb } from './helpers'
import type { Db } from '../server/db'

beforeAll(() => { process.env.ACCOUNT_SECRET = 'test-secret'; process.env.GAME_ORIGINS = 'https://game.example' })

let ipn = 0
async function call(db: Db, body: unknown, token?: string, ip?: string) {
  const headers = new Headers({ 'content-type': 'application/json', origin: 'https://game.example', 'x-forwarded-for': ip ?? `10.0.0.${++ipn}` })
  if (token) headers.set('authorization', `Bearer ${token}`)
  const res = await handleAccount(new Request('https://api.example/api/account', { method: 'POST', headers, body: JSON.stringify(body) }), db)
  return { status: res.status, body: (res.status === 204 ? {} : await res.json()) as Record<string, any>, headers: res.headers }
}
const create = (db: Db, name = 'Tobi', age_band = '18plus', ip?: string) => call(db, { op: 'create', name, age_band }, undefined, ip)

describe('accounts', () => {
  it('creates an anonymous account with a tag, friend code, token and recovery code', async () => {
    const db = await freshDb()
    const r = await create(db)
    expect(r.status).toBe(201)
    expect(r.body.account.label).toMatch(/^Tobi#\d{4}$/)
    expect(r.body.account.friend_code).toMatch(/^[0-9A-Z]{8}$/)
    expect(r.body.account.mp_enabled).toBe(false)
    expect(r.body.account.chat_level).toBe('none')
    expect(r.body.recovery_code).toMatch(/^[0-9A-Z]{4}(-[0-9A-Z]{4}){3}$/)
    const me = await call(db, { op: 'me' }, r.body.token)
    expect(me.status).toBe(200); expect(me.body.account.id).toBe(r.body.account.id)
  })

  it('sets CORS for the game origin only and allows the Authorization header', async () => {
    const db = await freshDb()
    const ok = await create(db)
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://game.example')
    const pre = await handleAccount(new Request('https://api.example/api/account', { method: 'OPTIONS', headers: { origin: 'https://game.example' } }), db)
    expect(pre.status).toBe(204); expect(pre.headers.get('access-control-allow-headers')).toContain('authorization')
    const other = await handleAccount(new Request('https://api.example/api/account', { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: JSON.stringify({ op: 'create', name: 'Tobi', age_band: '18plus' }) }), db)
    expect(other.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('rejects rude, personal-detail and malformed names', async () => {
    const db = await freshDb()
    for (const name of ['', 'ab', 'x'.repeat(20), 'FuckYou', 'sh1t head', 'Call 08031234567', 'a@b.com', '<script>', 'Admin']) {
      const r = await create(db, name); expect(r.status, name).toBe(400); expect(['bad_name', 'bad_request']).toContain(r.body.error)
    }
    expect((await create(db, "Ada O'Neil")).status).toBe(201)
  })

  it('gives different tags to the same name', async () => {
    const db = await freshDb()
    const a = await create(db, 'Tolu'), b = await create(db, 'tolu')
    expect(a.body.account.tag).not.toBe(b.body.account.tag)
  })

  it('rejects missing, tampered and expired tokens', async () => {
    const db = await freshDb(); const r = await create(db)
    expect((await call(db, { op: 'me' })).status).toBe(401)
    expect((await call(db, { op: 'me' }, r.body.token + 'x')).status).toBe(401)
    const [body, sig] = r.body.token.split('.')
    const forged = Buffer.from(JSON.stringify({ a: r.body.account.id, v: 1, e: Date.now() + 1e9 })).toString('base64url')
    expect((await call(db, { op: 'me' }, `${forged}.${sig}`)).status).toBe(401)
    expect(readToken(signToken(r.body.account.id, 1, Date.now() - 61 * 86400e3))).toBeNull()
    void body
  })

  it('recovers on another device with the code and signs the old device out', async () => {
    const db = await freshDb(); const r = await create(db)
    const rec = await call(db, { op: 'recover', code: r.body.recovery_code.toLowerCase() })
    expect(rec.status).toBe(200); expect(rec.body.account.id).toBe(r.body.account.id)
    expect((await call(db, { op: 'me' }, r.body.token)).status).toBe(401) // old token revoked
    expect((await call(db, { op: 'me' }, rec.body.token)).status).toBe(200)
    expect((await call(db, { op: 'recover', code: 'AAAA-AAAA-AAAA-AAAA' })).status).toBe(404)
  })

  it('rate limits creation and recovery guesses per address', async () => {
    const db = await freshDb()
    for (let i = 0; i < 8; i++) expect((await create(db, `Kid${i}x`, '18plus', '9.9.9.9')).status).toBe(201)
    expect((await create(db, 'Nine', '18plus', '9.9.9.9')).status).toBe(429)
    for (let i = 0; i < 10; i++) await call(db, { op: 'recover', code: 'BBBB-BBBB-BBBB-BBBB' }, undefined, '8.8.8.8')
    expect((await call(db, { op: 'recover', code: 'BBBB-BBBB-BBBB-BBBB' }, undefined, '8.8.8.8')).status).toBe(429)
  })

  it('under-13 players cannot switch online play on without a guardian PIN', async () => {
    const db = await freshDb(); const r = await create(db, 'Kemi', 'under13')
    const on = await call(db, { op: 'update', mp_enabled: true }, r.body.token)
    expect(on.status).toBe(403); expect(on.body.error).toBe('guardian_required')
    expect((await call(db, { op: 'set_pin', pin: '1234' }, r.body.token)).body.account.has_guardian_pin).toBe(true)
    expect((await call(db, { op: 'update', mp_enabled: true }, r.body.token)).body.error).toBe('pin_required')
    expect((await call(db, { op: 'update', mp_enabled: true, pin: '0000' }, r.body.token)).body.error).toBe('bad_pin')
    const ok = await call(db, { op: 'update', mp_enabled: true, pin: '1234' }, r.body.token)
    expect(ok.status).toBe(200); expect(ok.body.account.mp_enabled).toBe(true)
    // turning it off never needs the PIN
    expect((await call(db, { op: 'update', mp_enabled: false }, r.body.token)).body.account.mp_enabled).toBe(false)
  })

  it('adults can switch online play on without a PIN, and changing the PIN needs the old one', async () => {
    const db = await freshDb(); const r = await create(db)
    expect((await call(db, { op: 'update', mp_enabled: true }, r.body.token)).body.account.mp_enabled).toBe(true)
    await call(db, { op: 'set_pin', pin: '1111' }, r.body.token)
    expect((await call(db, { op: 'set_pin', pin: '2222' }, r.body.token)).body.error).toBe('pin_required')
    expect((await call(db, { op: 'set_pin', pin: '2222', current_pin: '9999' }, r.body.token)).body.error).toBe('bad_pin')
    expect((await call(db, { op: 'set_pin', pin: '2222', current_pin: '1111' }, r.body.token)).status).toBe(200)
  })

  it('locks out PIN guessing', async () => {
    const db = await freshDb(); const r = await create(db, 'Kemi', 'under13')
    await call(db, { op: 'set_pin', pin: '1234' }, r.body.token)
    for (let i = 0; i < 8; i++) await call(db, { op: 'update', mp_enabled: true, pin: '0000' }, r.body.token)
    expect((await call(db, { op: 'update', mp_enabled: true, pin: '1234' }, r.body.token)).status).toBe(429)
  })

  it('renames with a fresh tag, rotates the recovery code and logs out everywhere', async () => {
    const db = await freshDb(); const r = await create(db, 'Bola')
    const rn = await call(db, { op: 'update', name: 'Bolu' }, r.body.token)
    expect(rn.body.account.label).toMatch(/^Bolu#/)
    const rot = await call(db, { op: 'rotate_recovery' }, r.body.token)
    expect((await call(db, { op: 'recover', code: r.body.recovery_code })).status).toBe(404)
    expect((await call(db, { op: 'recover', code: rot.body.recovery_code })).status).toBe(200)
    const again = await create(db, 'Bola'); const out = await call(db, { op: 'logout_all' }, again.body.token)
    expect((await call(db, { op: 'me' }, again.body.token)).status).toBe(401)
    expect((await call(db, { op: 'me' }, out.body.token)).status).toBe(200)
  })

  it('deletes the account completely and purges inactive ones', async () => {
    const db = await freshDb(); const r = await create(db)
    expect((await call(db, { op: 'delete' }, r.body.token)).status).toBe(200)
    expect((await call(db, { op: 'me' }, r.body.token)).status).toBe(401)
    const old = await create(db, 'Oldie'); await db.query("UPDATE accounts SET last_seen = now() - interval '600 days'")
    await create(db, 'Fresh')
    expect(await purgeInactiveAccounts(db)).toBe(1)
    expect((await db.query('SELECT 1 FROM accounts')).rows.length).toBe(1)
    void old
  })

  it('never stores the recovery code in clear text', async () => {
    const db = await freshDb(); const r = await create(db)
    const row = (await db.query<{ recovery_hash: string }>('SELECT recovery_hash FROM accounts')).rows[0]
    expect(row.recovery_hash).not.toContain(r.body.recovery_code.replace(/-/g, ''))
  })
})
