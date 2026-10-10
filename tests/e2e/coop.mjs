import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(25000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(15, 'scholar', 3); g.getState().setHourTo(18.5) })
await page.waitForTimeout(1500)
await page.evaluate(() => window.__nal.useGame.getState().startChores())
await page.waitForTimeout(1200)
await page.screenshot({ path: `${OUT}/240-coop-pick.png` })
await page.locator('.tile:has-text("🤝")').first().click()
for (let i = 0; i < 40; i++) { await page.waitForTimeout(300); if (await page.evaluate(() => window.__world.inside)) break }
await page.waitForTimeout(6000)
await page.screenshot({ path: `${OUT}/241-coop-chores.png` })
console.log('errors', errors)
await browser.close()
