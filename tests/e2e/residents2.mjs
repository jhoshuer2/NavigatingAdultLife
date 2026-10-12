import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(15, 'scholar', 3); g.getState().setHourTo(19.5); g.getState().enterPlace('home') })
for (let i = 0; i < 40; i++) { await page.waitForTimeout(300); if (await page.evaluate(() => window.__world.inside)) break }
const snap = async (t) => console.log(t, JSON.stringify((await page.evaluate(() => window.__world.debugPeople())).filter((p) => p.vis)))
await snap('t0'); await page.waitForTimeout(20000); await snap('t20'); await page.waitForTimeout(25000); await snap('t45')
await browser.close()
