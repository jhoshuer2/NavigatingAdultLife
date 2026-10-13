import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
const BASE = process.env.BASE ?? 'http://localhost:4173/?unlimited=1'
const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
page.setDefaultTimeout(8000)
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto(BASE)
await page.getByText('Skip creation: random life').click()
await page.getByText("Got it. Let's live!").click().catch(() => {})
// clear first event(s)
for (let i = 0; i < 6; i++) {
  const c = page.locator('.sheet .card-btn:not([disabled])')
  if (await c.count()) { await page.waitForTimeout(350); await c.first().click(); await page.getByText('Continue ▶').click().catch(() => {}) } else break
}
await page.getByRole('button', { name: /Play Go-Slow Dash/ }).click()
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/20-dash-ready.png` })
await page.getByText('▶ Play').click()
await page.screenshot({ path: `${OUT}/20b-dash-choose.png` })
await page.getByText('Run alone').click()
for (let i = 0; i < 12; i++) { await page.waitForTimeout(500); await page.keyboard.press(['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'][i % 4]) }
await page.screenshot({ path: `${OUT}/21-dash-run.png` })
for (let i = 0; i < 80; i++) { await page.waitForTimeout(500); if (await page.getByText('WAHALA!').count()) break; await page.keyboard.press(['ArrowLeft', 'ArrowRight', 'ArrowUp'][i % 3]) }
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/22-dash-over.png` })
console.log('over:', await page.getByText('WAHALA!').count(), 'errors:', errors)
await browser.close()
