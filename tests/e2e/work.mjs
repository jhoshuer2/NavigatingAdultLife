import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(25000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(14, 'scholar', 3); g.getState().setHourTo(10) })
await page.waitForTimeout(1500)
const st = () => page.evaluate(() => { const s = window.__nal.useGame.getState(); const c = s.life.character.stats; return { rep: c.reputation, en: c.energy, hour: s.hour, mama: Object.values(s.life.npcs).find((n) => n.role === 'mother').closeness } })
console.log('before', await st())
await page.evaluate(() => window.__nal.useGame.getState().startChores())
for (let i = 0; i < 40; i++) { await page.waitForTimeout(300); if (await page.evaluate(() => window.__world.inside)) break }
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/130-chores.png` })
const spots = [[0.5, -3.3], [6.5, 0.4], [-4.2, -3.0], [-6.0, 4.6], [7.0, 5.2], [1.8, 5.0]]
for (const [x, z] of spots) {
  await page.evaluate((q) => window.__world.walkTo(q[0], q[1]), [x, z])
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(250); const p = await page.evaluate(() => window.__world.position); if (Math.hypot(p.x - x, p.z - z) < 1.3) break }
  await page.waitForTimeout(300)
}
await page.screenshot({ path: `${OUT}/131-chores-end.png` })
await page.getByText('Finish ▶').click(); await page.waitForTimeout(800)
console.log('after chores', await st())
// overtime: jump to adult with a job
await page.evaluate(() => { window.__nal.jump(26, 'scholar', 5) })
await page.waitForTimeout(1500)
await page.evaluate(() => { const g = window.__nal.useGame.getState(); g.setHourTo(15); g.enterPlace('office') })
for (let i = 0; i < 40; i++) { await page.waitForTimeout(300); if (await page.evaluate(() => window.__world.inside)) break }
console.log('inside', await page.evaluate(() => window.__world.inside))
await page.waitForTimeout(500)
const p = await page.evaluate(() => window.__world.hotspotPos('mydesk'))
await page.evaluate((q) => window.__world.walkTo(q.x, q.z), p)
for (let i = 0; i < 50; i++) { await page.waitForTimeout(300); const pos = await page.evaluate(() => window.__world.position); if (Math.hypot(pos.x - p.x, pos.z - p.z) < 1.2) break }
await page.keyboard.press('e'); await page.waitForTimeout(400)
await page.getByText('Work late').click(); await page.waitForTimeout(1800)
await page.screenshot({ path: `${OUT}/132-overtime.png` })
for (let i = 0; i < 8; i++) {
  const doc = await page.locator('text=/^📄/').first().textContent()
  const accounts = /Invoice|Receipt|Salary|payment|Petty/i.test(doc), memo = /All staff|Reminder|party|Notice|meeting/i.test(doc)
  await page.getByText(accounts ? 'Accounts' : memo ? 'Memos' : 'Reports', { exact: true }).click(); await page.waitForTimeout(800)
}
await page.screenshot({ path: `${OUT}/133-overtime-end.png` })
await page.getByText('Finish ▶').click(); await page.waitForTimeout(600)
console.log('after overtime', await st(), 'errors', errors)
await browser.close()
