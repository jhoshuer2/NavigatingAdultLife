import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(25000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(22, 'money', 3); g.getState().setHourTo(13); g.getState().enterPlace('mamaput'); const l = structuredClone(g.getState().life); l.character.stats.cash = 500000; g.getState().setLife(l) })
for (let i = 0; i < 40; i++) { await page.waitForTimeout(300); if (await page.evaluate(() => window.__world.inside)) break }
const p = await page.evaluate(() => window.__world.hotspotPos('order'))
await page.evaluate((q) => window.__world.walkTo(q.x, q.z), p)
for (let i = 0; i < 60; i++) { await page.waitForTimeout(250); const pos = await page.evaluate(() => window.__world.position); if (Math.hypot(pos.x - p.x, pos.z - p.z) < 1.2) break }
await page.keyboard.press('e'); await page.waitForTimeout(300)
await page.getByText('Sit down and order a meal').click(); await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/210-menu.png` })
await page.getByText('Suya plate').click(); await page.waitForTimeout(5500)
await page.screenshot({ path: `${OUT}/211-eating.png` })
await page.getByText('Finish ▶').waitFor({ timeout: 15000 })
const before = await page.evaluate(() => window.__nal.useGame.getState().life.character.stats.cash)
await page.getByText('Finish ▶').click(); await page.waitForTimeout(600)
console.log('cash', before, '->', await page.evaluate(() => window.__nal.useGame.getState().life.character.stats.cash), 'errors', errors)
await browser.close()
