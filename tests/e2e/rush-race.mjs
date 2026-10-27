// Live Rush race between two players, end to end (headless Chromium). Needs:
//   1. the admin API:   cd admin && GAME_ORIGINS=http://localhost:4175 npx tsx scripts/dev.ts          (port 8787)
//   2. the game built against it and served:   VITE_ACCOUNT_URL=http://localhost:8787/api/account npx vite build --outDir /tmp/dist-e2e
//                                              npx vite preview --outDir /tmp/dist-e2e --port 4175
// Checks: the challenge popup reaches an active player, accepting starts a race on the same road, the winner gets 3 leaderboard points,
// and when nobody accepts the host is offered Alfred ai. Screenshots go to OUT (default /tmp/rush-race).
import { chromium } from 'playwright-core'
import fs from 'node:fs'
const D = (process.env.OUT ?? '/tmp/rush-race') + '/'
fs.mkdirSync(D, { recursive: true })
const API = 'http://localhost:8787/api', BASE = 'http://localhost:4175/'
const exe = process.env.CHROME ?? fs.readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium_headless_shell')).map((d) => '/opt/pw-browsers/' + d + '/chrome-linux/headless_shell')[0]
const post = async (path, body, token) => (await fetch(API + path, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'http://localhost:4175', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body) })).json()
async function account(name) {
  const c = await post('/account', { op: 'create', name, age_band: '18plus' })
  await post('/account', { op: 'update', mp_enabled: true }, c.token)
  const me = await post('/account', { op: 'me' }, c.token)
  return { token: c.token, account: me.account }
}
const log = (...a) => console.log(new Date().toISOString().slice(14, 23), ...a)
;await (async () => {
  const b = await chromium.launch({ executablePath: exe, args: ['--use-gl=swiftshader', '--no-sandbox'] })
  const mk = async (acc, tag) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 } })
    await ctx.addInitScript((a) => { localStorage.setItem('nal.account.v1', JSON.stringify(a)) }, acc)
    const p = await ctx.newPage(); p.on('pageerror', (e) => log(tag, 'PAGEERR', e.message))
    await p.goto(BASE + '?debug=1'); await p.waitForTimeout(1500)
    return p
  }
  const stamp = Math.random().toString(36).replace(/[^a-z]/g, '').slice(0, 4)
  const A = await account('Ada' + stamp), Bb = await account('Bayo' + stamp)
  const pa = await mk(A, 'A'), pb = await mk(Bb, 'B')
  await pa.evaluate(() => window.__store.getState().go('rushLobby'))
  await pa.waitForTimeout(800)
  log('--- scenario 1: B accepts')
  await pa.getByText('Find a player').click()
  await pb.getByText(/challenges you/).waitFor({ timeout: 12000 })
  log('B sees the popup'); await pb.screenshot({ path: D + 'r1-popup.png' })
  await pa.screenshot({ path: D + 'r1-lobby.png' })
  await pb.getByRole('button', { name: 'Accept' }).click()
  await pa.waitForTimeout(500)
  await pa.screenshot({ path: D + 'r1-A-after.png' }); await pb.screenshot({ path: D + 'r1-B-after.png' })
  await pa.waitForTimeout(6500)
  await pa.screenshot({ path: D + 'r1-A-run.png' }); await pb.screenshot({ path: D + 'r1-B-run.png' })
  log('racing...')
  for (let i = 0; i < 6; i++) { await pb.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowRight'); await pa.waitForTimeout(500) }
  for (let i = 0; i < 12; i++) { await pa.waitForTimeout(3000); const t = await pa.evaluate(() => document.body.innerText.slice(0, 60).replace(/\n/g, ' ')); if (/YOU WIN|wins|DRAW|Waiting for the others/.test(await pa.evaluate(() => document.body.innerText))) break }
  await pa.waitForTimeout(4000)
  await pa.screenshot({ path: D + 'r1-A-over.png' }); await pb.screenshot({ path: D + 'r1-B-over.png' })
  for (const [n, p] of [['A', pa], ['B', pb]]) { const t = await p.evaluate(() => document.body.innerText); log(n, 'result:', t.replace(/\n+/g, ' | ').slice(0, 260)) }
  const bd = await post('/rush', { op: 'board' }, A.token); log('board', JSON.stringify(bd.board))
  if (!bd.board.some((r) => r.points === 3 && r.wins === 1)) throw new Error('the winner did not get 3 points')
  log('--- scenario 3: global leaderboard in the UI')
  await pa.evaluate(() => window.__store.getState().go('leaderboard')); await pa.waitForTimeout(500)
  await pa.getByRole('button', { name: 'Global' }).click(); await pa.waitForTimeout(1500)
  await pa.screenshot({ path: D + 'r3-global.png' })
  log('--- scenario 2: nobody accepts -> Alfred offered')
  await pa.evaluate(() => window.__store.getState().go('home')); await pa.waitForTimeout(300)
  await pa.evaluate(() => window.__store.getState().go('rushLobby')); await pa.waitForTimeout(1500)
  await pb.evaluate(() => window.__store.getState().go('home')); await pb.waitForTimeout(500)
  await pa.getByText('Find a player').click()
  await pb.getByText(/challenges you/).waitFor({ timeout: 12000 }); log('B sees it again and ignores it')
  await pa.waitForTimeout(23000)
  await pa.screenshot({ path: D + 'r2-A-nobody.png' })
  const t2 = await pa.evaluate(() => document.body.innerText); log('A:', t2.replace(/\n+/g, ' | ').slice(0, 200)); const alfred = /race alfred ai/i.test(t2); log('Alfred offered:', alfred); if (!alfred) throw new Error('Alfred was not offered')
  await b.close()
})().catch((e) => { console.error('FAIL', e); process.exit(1) })
