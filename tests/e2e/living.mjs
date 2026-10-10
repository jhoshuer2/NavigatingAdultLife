import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(25000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }); window.__nal.jump(15, 'scholar', 3); g.getState().setHourTo(19); g.getState().enterPlace('home') })
for (let i = 0; i < 40; i++) { await page.waitForTimeout(300); if (await page.evaluate(() => window.__world.inside)) break }
await page.waitForTimeout(800)
const st = () => page.evaluate(() => { const c = window.__nal.useGame.getState().life.character.stats; return { hap: c.happiness, hp: c.health, en: c.energy, cash: c.cash } })
const goto = async (id) => { const p = await page.evaluate((i) => window.__world.hotspotPos(i), id); await page.evaluate((q) => window.__world.walkTo(q.x, q.z), p); for (let i = 0; i < 60; i++) { await page.waitForTimeout(250); const pos = await page.evaluate(() => window.__world.position); if (Math.hypot(pos.x - p.x, pos.z - p.z) < 1.2) break } await page.waitForTimeout(300) }
console.log('before', await st())
// sofa
await goto('sofa'); await page.keyboard.press('e'); await page.waitForTimeout(300)
await page.getByText('Sit on the sofa').click(); await page.waitForTimeout(1200)
await page.screenshot({ path: `${OUT}/200-sofa.png` })
await page.getByText('Stand up').click(); await page.waitForTimeout(800)
// bed
await goto('bed'); await page.keyboard.press('e'); await page.waitForTimeout(300)
await page.getByText('Lie down on the bed').click(); await page.waitForTimeout(1200)
await page.screenshot({ path: `${OUT}/201-bed.png` })
await page.getByText('Get up').click(); await page.waitForTimeout(800)
// cook
await goto('kitchen'); await page.keyboard.press('e'); await page.waitForTimeout(300)
await page.getByText('Cook a meal').click(); await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/202-cook.png` })
const need = await page.locator('text=/Recipe needs:/').first().textContent()
const map = { '🍚': 'rice', '🍅': 'tomato', '🌶️': 'pepper', '🧅': 'onion', '🫒': 'oil', '🥚': 'egg', '🫘': 'beans', '🍌': 'plantain' }
for (const [e, id] of Object.entries(map)) if (need.includes(e)) { await page.getByRole('button', { name: id, exact: true }).click(); await page.waitForTimeout(250) }
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/203-stir.png` })
for (let i = 0; i < 5; i++) { await page.waitForTimeout(600); await page.getByRole('button', { name: /Stir/ }).click({ timeout: 1500 }).catch(() => {}) }
await page.getByText('Finish ▶').waitFor({ timeout: 20000 })
await page.screenshot({ path: `${OUT}/204-cook-end.png` })
await page.getByText('Finish ▶').click(); await page.waitForTimeout(800)
console.log('after cook', await st())
// ask for food
await page.evaluate(() => window.__nal.useGame.getState().startTalk('food', 'mother'))
await page.waitForTimeout(5000)
await page.screenshot({ path: `${OUT}/205-askfood.png` })
console.log('errors', errors)
await browser.close()
