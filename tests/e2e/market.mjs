import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(20000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(20, 'hustler', 3); g.getState().setHourTo(11) })
await page.waitForTimeout(1500)
const st = () => page.evaluate(() => { const c = window.__nal.useGame.getState().life.character.stats; return { cash: c.cash, en: c.energy } })
console.log('before', await st())
await page.evaluate(() => window.__nal.useGame.getState().startMarket())
await page.waitForTimeout(3500)
await page.screenshot({ path: `${OUT}/120-market.png` })
for (let i = 0; i < 40; i++) {
  if (await page.getByText('Market closed for the day!').count()) break
  const want = await page.locator('text=/They want/').first().textContent().catch(() => null)
  if (want) { const w = want.match(/want (\w+)\./)[1]; await page.getByRole('button', { name: w, exact: true }).click(); await page.waitForTimeout(500); if (i === 2) await page.screenshot({ path: `${OUT}/121-sold.png` }) }
  else if (await page.getByText('Fair', { exact: true }).count()) { await page.getByText('Fair', { exact: true }).click(); await page.waitForTimeout(500) }
  else await page.waitForTimeout(500)
}
await page.screenshot({ path: `${OUT}/122-market-end.png` })
await page.getByText('Finish ▶').click(); await page.waitForTimeout(800)
console.log('after', await st(), 'errors', errors)
await browser.close()
