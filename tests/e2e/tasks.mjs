import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(20000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(13, 'scholar', 3); g.getState().setHourTo(10) })
await page.waitForTimeout(1500)
const st = () => page.evaluate(() => { const s = window.__nal.useGame.getState(); return { k: s.life.character.stats.knowledge, en: s.life.character.stats.energy, h: s.life.character.stats.happiness, hour: s.hour } })
const goto = async (id) => { const p = await page.evaluate((i) => window.__world.hotspotPos(i), id); await page.evaluate((q) => window.__world.walkTo(q.x, q.z), p); for (let i = 0; i < 50; i++) { await page.waitForTimeout(300); const pos = await page.evaluate(() => window.__world.position); if (Math.hypot(pos.x - p.x, pos.z - p.z) < 1.2) break } await page.waitForTimeout(300) }
const answerAll = async (tag) => {
  for (let i = 0; i < 12; i++) {
    const fin = page.getByText(/Finish ▶|Next question ▶/)
    if (await fin.count()) { await page.screenshot({ path: `${OUT}/${tag}-fb${i}.png` }); await fin.first().click(); await page.waitForTimeout(500); continue }
    const opt = page.locator('button.card-btn:not([disabled])')
    if (await opt.count()) { if (i === 0) await page.screenshot({ path: `${OUT}/${tag}-q.png` }); await opt.first().click(); await page.waitForTimeout(700); continue }
    break
  }
}
console.log('before', await st())
// classroom
await page.evaluate(() => window.__nal.useGame.getState().enterPlace('school'))
for (let i = 0; i < 30; i++) { await page.waitForTimeout(300); if (await page.evaluate(() => window.__world.inside)) break }
await goto('mydesk'); await page.keyboard.press('e'); await page.waitForTimeout(300)
await page.getByText('Sit in class').click(); await page.waitForTimeout(1800)
await answerAll('100-class')
await page.waitForTimeout(800)
console.log('after class', await st(), 'inside', await page.evaluate(() => window.__world.inside))
await page.screenshot({ path: '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots/101-after-class.png' })
// library
await page.evaluate(() => { const g = window.__nal.useGame.getState(); g.setHourTo(14) })
await goto('library'); await page.keyboard.press('e'); await page.waitForTimeout(300)
await page.getByText('Study alone in the library').click(); await page.waitForTimeout(1500)
await answerAll('102-lib')
console.log('after library', await st())
console.log('errors', errors)
await browser.close()
