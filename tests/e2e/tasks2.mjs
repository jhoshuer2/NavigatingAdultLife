import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(20000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(13, 'scholar', 3); g.getState().setHourTo(11) })
await page.waitForTimeout(1500)
const st = () => page.evaluate(() => { const s = window.__nal.useGame.getState(); const c = s.life.character; return { h: c.stats.happiness, hp: c.stats.health, en: c.stats.energy, hour: s.hour, rel: Object.values(s.life.npcs).map((n) => n.role + ':' + n.closeness).join(' ') } })
console.log('before', await st())
// penalty
await page.evaluate(() => window.__nal.useGame.getState().startPenalty('play'))
await page.waitForTimeout(1800)
await page.screenshot({ path: `${OUT}/110-penalty.png` })
for (let k = 0; k < 5; k++) {
  await page.mouse.move(195, 600); await page.mouse.down(); await page.mouse.move(195 + (k - 2) * 25, 480, { steps: 4 }); await page.mouse.up()
  await page.waitForTimeout(500)
  if (k === 0) await page.screenshot({ path: `${OUT}/111-kick.png` })
  await page.waitForTimeout(2300)
}
await page.screenshot({ path: `${OUT}/112-penalty-end.png` })
await page.getByText('Finish ▶').click(); await page.waitForTimeout(800)
console.log('after penalty', await st())
// hangout with friend: walk to the pitch together
await page.evaluate(() => window.__nal.useGame.getState().startTalk('hang', 'friend'))
await page.waitForTimeout(500)
await page.getByText(/Where to/).waitFor()
await page.screenshot({ path: `${OUT}/113-dest.png` })
await page.getByText('Street Football Pitch', { exact: false }).or(page.getByText('Pitch')).first().click()
await page.waitForTimeout(2500)
await page.screenshot({ path: `${OUT}/114-walking.png` })
for (let i = 0; i < 60; i++) { await page.waitForTimeout(500); if (await page.getByText(/Hanging out with/).count()) break }
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/115-talk.png` })
for (let i = 0; i < 6; i++) {
  const opt = page.locator('.card-btn:not([disabled])')
  if (await opt.count()) { await opt.first().click(); await page.waitForTimeout(1900); if (i === 0) await page.screenshot({ path: `${OUT}/116-reply.png` }); await page.waitForTimeout(2300) } else await page.waitForTimeout(600)
}
await page.screenshot({ path: `${OUT}/117-talk-end.png` })
await page.getByText('Done ▶').click(); await page.waitForTimeout(800)
console.log('after hang', await st())
console.log('errors', errors)
await browser.close()
