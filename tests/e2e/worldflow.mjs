import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
page.setDefaultTimeout(15000)
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(13, 'scholar', 3) })
await page.waitForTimeout(1500)
const age = () => page.evaluate(() => window.__nal.useGame.getState().life.character.age)
const phase = () => page.evaluate(() => window.__nal.useGame.getState().life.phase)
const sheet = () => page.evaluate(() => window.__nal.useGame.getState().sheet)
const walk = async (place) => {
  await page.evaluate((p) => window.__nal.useGame.getState().goToPlace(p), place)
  const doors = { school: [19.5, -12.5], mamaput: [38, 8.5], home: [-18.5, -8.5] }
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(500); const pos = await page.evaluate(() => window.__world.position); const d = doors[place]; if (Math.hypot(pos.x - d[0], pos.z - d[1]) < 1.6) break }
  await page.waitForTimeout(300)
}
const a0 = await age()
for (let year = 0; year < 2; year++) {
  await walk('school')
  await page.keyboard.press('e'); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /Study/ }).click()
  await page.waitForTimeout(500)
  for (let i = 0; i < 8; i++) {
    const nxt = page.getByText(/Next question ▶|Finish quiz ▶/)
    if (await nxt.count()) { await nxt.first().click(); await page.waitForTimeout(300); continue }
    const opt = page.locator('.sheet .card-btn:not([disabled])')
    if (await opt.count()) { await opt.first().click(); await page.waitForTimeout(300); continue }
    break
  }
  const k1 = await page.evaluate(() => window.__nal.useGame.getState().life.character.stats.knowledge)
  await page.screenshot({ path: `${OUT}/70-after-study-${year}.png` })
  await walk('mamaput')
  await page.keyboard.press('e'); await page.waitForTimeout(400)
  console.log('sheet at mamaput:', await sheet())
  await page.keyboard.press('Escape'); await page.waitForTimeout(300)
  await walk('home')
  await page.keyboard.press('e'); await page.waitForTimeout(500)
  await page.getByText('Sleep and end the year').click()
  for (let i = 0; i < 30; i++) {
    const ph = await phase()
    if (ph === 'action') break
    await page.waitForTimeout(350)
    if (await page.getByText('Continue ▶').count()) { await page.getByText('Continue ▶').click(); continue }
    if (await page.getByText('Next year ▶').count()) { await page.getByText('Next year ▶').click(); continue }
    const c = page.locator('.sheet .card-btn:not([disabled])')
    if (await c.count()) { await c.first().click(); continue }
  }
  console.log('year', year, 'age now', await age(), 'knowledge after study', k1)
}
console.log('age advanced', (await age()) - a0, 'errors', errors)
await page.screenshot({ path: `${OUT}/71-after-years.png` })
await browser.close()
