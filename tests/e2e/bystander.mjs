import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(25000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(10, 'scholar', 3); g.getState().setHourTo(9); g.getState().enterPlace('school') })
for (let i = 0; i < 40; i++) { await page.waitForTimeout(300); if (await page.evaluate(() => window.__world.inside)) break }
await page.evaluate(() => window.__world.walkTo(-1.5, 2.2))
for (let i = 0; i < 40; i++) { await page.waitForTimeout(250); const p = await page.evaluate(() => window.__world.position); if (Math.hypot(p.x + 1.5, p.z - 2.2) < 0.6) break }
await page.waitForTimeout(500)
await page.getByRole('button', { name: /Talk/ }).first().click(); await page.waitForTimeout(2200)
await page.screenshot({ path: `${OUT}/180-bystander.png` })
await page.waitForTimeout(1800)
await page.screenshot({ path: `${OUT}/181-bystander-q.png` })
await page.locator('.card-btn:not([disabled])').first().click(); await page.waitForTimeout(3200)
await page.screenshot({ path: `${OUT}/182-bystander-reply.png` })
console.log('errors', errors)
await browser.close()
