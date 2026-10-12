import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(25000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(20, 'scholar', 3); g.getState().setHourTo(9) })
await page.waitForTimeout(1500)
await page.evaluate(() => window.__nal.useGame.getState().enterPlace('home'))
for (let i = 0; i < 40; i++) { await page.waitForTimeout(300); if (await page.evaluate(() => window.__world.inside)) break }
await page.evaluate(() => window.__nal.useGame.getState().startTalk('chat', 'father'))
await page.waitForTimeout(1200)
await page.screenshot({ path: `${OUT}/169-greet.png` })
await page.waitForTimeout(3000)
await page.screenshot({ path: `${OUT}/170-talk-start.png` })
for (let i = 0; i < 2; i++) { await page.locator('.card-btn:not([disabled])').first().click(); await page.waitForTimeout(2200); if (i === 0) await page.screenshot({ path: `${OUT}/171-talk-reply.png` }); await page.waitForTimeout(2500) }
await page.getByText('Done ▶').click(); await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/172-talk-after.png` })
console.log('errors', errors)
await browser.close()
