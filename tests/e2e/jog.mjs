import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(25000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(22, 'scholar', 3); g.getState().setHourTo(8) })
await page.waitForTimeout(1500)
const st = () => page.evaluate(() => { const c = window.__nal.useGame.getState().life.character.stats; return { hp: c.health, hap: c.happiness, stress: c.stress, en: c.energy } })
console.log('before', await st())
await page.evaluate(() => window.__nal.useGame.getState().startJog())
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/160-jog.png` })
const pts = [[-33, -33], [-33, -23], [-38, -23.5], [-43, -23], [-43, -33]]
// ordering per component: corner1=(x1-2,z1-2)
const real = [[-33, -23], [-33, -33], [-38, -33], [-43, -33], [-43, -23]]
for (const [x, z] of [...real, ...real]) {
  await page.evaluate((q) => window.__world.walkTo(q[0], q[1]), [x, z])
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(250); const p = await page.evaluate(() => window.__world.position); if (Math.hypot(p.x - x, p.z - z) < 1.2) break }
  await page.waitForTimeout(200)
}
await page.screenshot({ path: `${OUT}/161-jog-end.png` })
await page.getByText('Finish ▶').click(); await page.waitForTimeout(600)
console.log('after', await st(), 'errors', errors)
await browser.close()
