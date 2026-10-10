import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5 })
page.setDefaultTimeout(8000)
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => { const m = window.__nal.useGame.getState().meta; window.__nal.useGame.setState({ meta: { ...m, seenTutorial: true } }); window.__nal.jump(31, 'money', 11) })
await page.waitForTimeout(600)
await page.screenshot({ path: `${OUT}/30-adult-hub.png` })
await page.getByText('Profile').first().click(); await page.waitForTimeout(400); await page.screenshot({ path: `${OUT}/31-profile.png` })
await page.keyboard.press('Escape')
await page.getByText('Quests').first().click(); await page.waitForTimeout(400); await page.screenshot({ path: `${OUT}/32-quests.png` })
await page.keyboard.press('Escape')
await page.getByText(/Shop/).first().click().catch(() => {}); await page.waitForTimeout(400); await page.screenshot({ path: `${OUT}/33-shop.png` })
await page.keyboard.press('Escape')
// run to the end
await page.evaluate(() => window.__nal.jump(72, 'money', 11))
await page.waitForTimeout(300)
for (let i = 0; i < 160; i++) {
  const body = await page.locator('body').innerText()
  if (/the story ends/i.test(body)) break
  if (/Continue ▶/.test(body)) { await page.getByText('Continue ▶').click(); continue }
  if (/Next year ▶/.test(body)) { await page.getByText('Next year ▶').click(); continue }
  const c = page.locator('.sheet .card-btn:not([disabled])')
  if (await c.count()) { await page.waitForTimeout(300); await c.first().click(); continue }
  try { await page.getByText(/End year ▶/).click({ timeout: 2500 }) } catch { await page.screenshot({ path: `${OUT}/stuck2.png` }); console.log('stuck', i, (await page.locator('body').innerText()).slice(0, 500)); break }
}
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/34-ending.png`, fullPage: true })
console.log('errors', errors)
await browser.close()
