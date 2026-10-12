import { chromium } from 'playwright-core'
const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/guide'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 900, height: 900 } })
page.setDefaultTimeout(8000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e)))
await page.goto(`${process.env.BASE ?? 'http://localhost:4173'}/?unlimited=1&debug=1`)
await page.waitForFunction(() => window.__nal)
await page.locator('button.btn:has-text("Play")').first().click()
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }) })
await page.evaluate(() => window.__nal.jump(17, 'scholar', 3)); await page.waitForTimeout(1500)
await page.getByLabel('Open the full map').click(); await page.waitForTimeout(600)
const box = await page.locator('canvas[aria-label^="Map"]').boundingBox()
let found = null
for (let gy = 0.1; gy < 0.95 && !found; gy += 0.04) for (let gx = 0.1; gx < 0.95 && !found; gx += 0.04) {
  await page.mouse.move(box.x + box.width * gx, box.y + box.height * gy)
  if (await page.getByRole('tooltip').count()) found = await page.getByRole('tooltip').innerText()
}
console.log('tooltip:', JSON.stringify(found))
if (!found) { await page.screenshot({ path: `${OUT}/20-map-hover.png` }); console.log(box, await page.locator('[role=tooltip]').count()); throw new Error('no tooltip on hover') }
await page.screenshot({ path: `${OUT}/20-map-hover.png` })
console.log('errors', errors)
await browser.close()
