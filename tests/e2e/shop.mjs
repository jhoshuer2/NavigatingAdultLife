import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(25000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(20, 'money', 3); g.getState().setHourTo(11); const l = structuredClone(g.getState().life); l.character.stats.cash = 3000000; g.getState().setLife(l) })
await page.waitForTimeout(1500)
const st = () => page.evaluate(() => { const l = window.__nal.useGame.getState().life; return { cash: l.character.stats.cash, en: l.character.stats.energy, items: l.character.items.join(',') } })
console.log('before', await st())
await page.evaluate(() => window.__nal.useGame.getState().startShop())
await page.waitForTimeout(2000)
await page.screenshot({ path: `${OUT}/150-shop.png` })
const spots = [[14.8, 11.4], [19.5, 11.4], [24.5, 11.4]]
let n = 0
for (const [x, z] of spots) {
  await page.evaluate((q) => window.__world.walkTo(q[0], q[1] + 0.6), [x, z])
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(250); const p = await page.evaluate(() => window.__world.position); if (Math.hypot(p.x - x, p.z - z - 0.6) < 0.5) break }
  await page.waitForTimeout(700)
  if (n === 0) await page.screenshot({ path: `${OUT}/151-near.png` })
  if (await page.getByText('🤝 Haggle').count()) {
    if (n === 0) { await page.getByText('🤝 Haggle').click(); await page.waitForTimeout(500); await page.screenshot({ path: `${OUT}/152-haggle.png` }); await page.locator('.card-btn:not([disabled])').last().click(); await page.waitForTimeout(800); await page.locator('.card-btn:not([disabled])').last().click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(800) }
    else { await page.getByRole('button', { name: /^Buy/ }).click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(600) }
  }
  n++
}
await page.screenshot({ path: `${OUT}/153-after.png` })
await page.getByText('✔ Done').click(); await page.waitForTimeout(600)
console.log('after', await st(), 'errors', errors)
await browser.close()
