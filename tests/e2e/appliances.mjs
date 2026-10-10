import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(25000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(24, 'money', 3); const l = structuredClone(g.getState().life); l.character.housing.type = 'rent'; l.character.stats.cash = 5000000; l.character.items = l.character.items.filter((i) => !['tv', 'fan', 'fridge', 'ac'].includes(i)); g.getState().setLife(l); g.getState().setHourTo(11) })
await page.waitForTimeout(1500)
const items = async () => page.evaluate(() => { const s = window.__nal.useGame.getState(); return { inst: Object.keys(s.life.flags).filter((k) => /^(inst|dlv):/.test(k)), cash: s.life.character.stats.cash, hour: s.hour } })
// bare home first
await page.evaluate(() => window.__nal.useGame.getState().enterPlace('home'))
for (let i = 0; i < 40; i++) { await page.waitForTimeout(300); if (await page.evaluate(() => window.__world.inside)) break }
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/220-bare-home.png` })
await page.getByRole('button', { name: /Outside/ }).click(); await page.waitForTimeout(1200)
// shop
await page.evaluate(() => window.__nal.useGame.getState().startShop())
await page.waitForTimeout(2000)
const SPOTS = [[14.8, 11.4], [19.5, 11.4], [24.5, 11.4], [14.2, 16.4], [19.2, 16.4], [24.2, 16.4], [29.2, 16.4], [14.2, 21.2], [19.2, 21.2], [24.2, 21.2]]
let found = false
for (const spot of SPOTS) {
  await page.evaluate((q) => window.__world.walkTo(q[0], q[1] + 0.6), spot)
  for (let i = 0; i < 80; i++) { await page.waitForTimeout(250); const p = await page.evaluate(() => window.__world.position); if (Math.hypot(p.x - spot[0], p.z - spot[1] - 0.6) < 0.5) break }
  await page.waitForTimeout(700)
  if (await page.getByText(/Flat-screen TV|Standing fan|Fridge-freezer|Air conditioner/).count()) { found = true; break }
}
console.log('found appliance', found)
await page.screenshot({ path: `${OUT}/221-shop-appliance.png` })
await page.getByRole('button', { name: /^Buy/ }).click(); await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/222-loader-choice.png` })
const loaderBtn = page.getByText('Loader ₦3,000')
if (await loaderBtn.count()) await loaderBtn.click(); else await page.getByText('Carry it myself').click()
await page.waitForTimeout(2500)
await page.screenshot({ path: `${OUT}/223-loader-market.png` })
console.log('ordered', await items())
await page.getByText('✔ Done').click(); await page.waitForTimeout(500)
// go home, wait 2 hours -> delivered
await page.evaluate(() => window.__nal.useGame.getState().enterPlace('home'))
for (let i = 0; i < 40; i++) { await page.waitForTimeout(300); if (await page.evaluate(() => window.__world.inside)) break }
await page.waitForTimeout(500)
await page.evaluate(() => window.__nal.useGame.getState().advance(2.2))
await page.waitForTimeout(3200)
await page.screenshot({ path: `${OUT}/224-loader-home.png` })
await page.waitForTimeout(3000)
await page.screenshot({ path: `${OUT}/225-delivered.png` })
console.log('after', await items(), 'errors', errors)
await browser.close()
