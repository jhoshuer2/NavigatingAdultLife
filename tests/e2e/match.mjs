import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(30000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:4173/?unlimited=1&debug=1&fastmatch=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(16, 'scholar', 3); g.getState().setHourTo(16) })
await page.waitForTimeout(1500)
await page.evaluate(() => window.__nal.useGame.getState().startMatch())
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/230-lobby.png` })
await page.getByText('Estate FC').click(); await page.waitForTimeout(2500)
await page.screenshot({ path: `${OUT}/231-kickoff.png` })
// run at the ball and shoot repeatedly
for (let i = 0; i < 70; i++) {
  await page.evaluate(() => window.__world.walkTo(-38 + (Math.random() - 0.3) * 8, -28 + (Math.random() - 0.5) * 8))
  await page.keyboard.press('Space'); await page.waitForTimeout(500); await page.keyboard.press('Space')
  if (i === 20) await page.screenshot({ path: `${OUT}/232-mid.png` })
  if (await page.getByText('Finish ▶').count()) break
}
await page.getByText('Finish ▶').waitFor({ timeout: 40000 })
await page.screenshot({ path: `${OUT}/233-end.png` })
await page.getByText('Finish ▶').click(); await page.waitForTimeout(600)
console.log('errors', errors)
await browser.close()
