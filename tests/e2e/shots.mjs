import { chromium } from 'playwright-core'
const BASE = process.env.BASE ?? 'http://localhost:4173/?unlimited=1'
const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
import { mkdirSync } from 'node:fs'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? undefined, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
page.setDefaultTimeout(4000)
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto(BASE)
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/01-title.png` })
await page.getByText('New life').first().click()
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/02-create-look.png` })
await page.getByText('Next →').click()
await page.getByText('Hustler').first().click()
await page.getByText('Bookworm').first().click()
await page.screenshot({ path: `${OUT}/03-traits.png` })
await page.getByText('Next →').click()
await page.getByText('Big Oga').first().click()
await page.getByText('Next →').click()
await page.getByText('Spin the lottery').click()
await page.waitForTimeout(1600)
await page.screenshot({ path: `${OUT}/04-lottery.png` })
await page.getByText('Next →').click()
await page.locator('button:has-text("Ikorodu")').first().click()
await page.getByText('Next →').click()
await page.getByPlaceholder('Your name').fill('Ada')
await page.screenshot({ path: `${OUT}/05-name.png` })
await page.getByText('Start my life').click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/06-tutorial.png` })
await page.getByText("Got it. Let's live!").click()
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/07-hub.png` })
// event first?
for (let i = 0; i < 40; i++) {
  const body = await page.locator('body').innerText()
  if (/Continue ▶/.test(body)) { await page.getByText('Continue ▶').click(); continue }
  if (/Next year ▶/.test(body)) { if (i > 6) await page.screenshot({ path: `${OUT}/09-summary.png` }); await page.getByText('Next year ▶').click(); continue }
  if (/Next question ▶|Finish quiz ▶/.test(body)) { await page.getByText(/Next question ▶|Finish quiz ▶/).first().click(); continue }
  const enabledChoices = page.locator('.sheet .card-btn:not([disabled])')
  if (await enabledChoices.count()) {
    const isQuiz = /Pop quiz!/.test(body)
    if (isQuiz && i % 3 === 0) await page.screenshot({ path: `${OUT}/08-quiz.png` })
    if (!isQuiz && i === 3) await page.screenshot({ path: `${OUT}/10-event.png` })
    await page.waitForTimeout(350)
    await enabledChoices.first().click(); continue
  }
  // action phase
  const study = page.getByRole('button', { name: /^Study/ })
  if (await study.count() && await study.first().isEnabled()) { await study.first().click(); continue }
  try { await page.getByText(/End year ▶/).click({ timeout: 3000 }) } catch (e) { await page.screenshot({ path: `${OUT}/stuck.png` }); console.log('stuck at loop', i, (await page.locator('body').innerText()).slice(0, 600)); break }
}
await page.screenshot({ path: `${OUT}/11-later.png` })
console.log('errors:', errors)
await browser.close()
