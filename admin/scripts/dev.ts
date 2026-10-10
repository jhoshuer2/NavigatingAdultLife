// Local development server: in-process Postgres (PGlite, kept in .pglite), the real handlers, synthetic data and a demo owner.
// No accounts or services needed.   npm run dev   (then npm run dev:ui in a second terminal)
import { createServer } from 'node:http'
import { createAdmin } from '../server/auth'
import { memoryDb, setDb } from '../server/db'
import { handleAdmin } from '../server/admin'
import { handleCollect, handleForget } from '../server/collector'
import { seedPlayers } from '../server/seed'

process.env.GAME_ORIGINS ??= 'http://localhost:5173,http://localhost:4173'
const db = await memoryDb('.pglite'); setDb(db)
if (!(await db.query('SELECT 1 FROM admin_users LIMIT 1')).rows.length) {
  const u = await createAdmin(db, 'owner@example.com', 'owner', 'dev-password')
  console.log(`\nDemo owner:  owner@example.com / dev-password\n2FA secret:   ${u.totp_secret}  (add to an authenticator app)\nDev shortcut: DEV_TOTP=1 shows the current code at http://localhost:8787/dev/code\n`)
  console.log('Seeding demo players...'); await seedPlayers(db, { players: 60, days: 30, now: new Date() }); console.log('done')
}
const { totpAt } = await import('../server/auth')
const handler = async (req: Request): Promise<Response> => {
  const p = new URL(req.url).pathname
  if (p === '/api/collect') return handleCollect(req)
  if (p === '/api/forget') return handleForget(req)
  if (p.startsWith('/api/admin')) return handleAdmin(req, db)
  if (p === '/dev/code' && process.env.DEV_TOTP === '1') {
    const s = (await db.query<{ totp_secret: string }>("SELECT totp_secret FROM admin_users WHERE email='owner@example.com'")).rows[0]
    return new Response(totpAt(s.totp_secret, Date.now()))
  }
  return new Response('not found', { status: 404 })
}
createServer(async (nreq, nres) => {
  const chunks: Buffer[] = []; for await (const c of nreq) chunks.push(c as Buffer)
  const body = chunks.length ? Buffer.concat(chunks) : undefined
  const req = new Request(`http://${nreq.headers.host}${nreq.url}`, { method: nreq.method, headers: nreq.headers as Record<string, string>, body: nreq.method === 'GET' || nreq.method === 'HEAD' ? undefined : body })
  const res = await handler(req)
  const headers: Record<string, string | string[]> = {}; res.headers.forEach((v, k) => { headers[k] = v })
  const cookie = res.headers.get('set-cookie'); if (cookie) headers['set-cookie'] = [cookie]
  nres.writeHead(res.status, headers); nres.end(Buffer.from(await res.arrayBuffer()))
}).listen(8787, () => console.log('API on http://localhost:8787'))
