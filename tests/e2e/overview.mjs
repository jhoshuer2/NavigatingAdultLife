import { chromium } from 'playwright-core'
const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 700, height: 700 }, deviceScaleFactor: 1 })
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(+(new URLSearchParams(location.search).get('age') ?? 24), 'money', 9) })
await page.waitForTimeout(2500)
await page.evaluate(() => { window.__world.zoom = 3.2 })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/60-overview.png` })
await browser.close()
