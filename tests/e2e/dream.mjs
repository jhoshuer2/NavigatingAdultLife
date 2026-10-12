// The dream path in the Quests sheet, the guide pointing at the next step, and the "Dream achieved" moment.
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
const OUT = process.env.OUT ?? '/tmp/dream'; mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(8000)
const errors = []; page.on('pageerror', (e) => errors.push(String(e)))
const shot = async (n, wait = 600) => { await page.waitForTimeout(wait); await page.screenshot({ path: `${OUT}/${n}.png` }) }
await page.goto(`${process.env.BASE ?? 'http://localhost:4173'}/?unlimited=1&debug=1`)
await page.waitForFunction(() => window.__nal)
await page.locator('button.btn:has-text("Play")').first().click()
await page.evaluate(() => { const g = window.__nal.useGame; g.setState({ meta: { ...g.getState().meta, seenTutorial: true } }) })
await page.evaluate(() => window.__nal.jump(17, 'scholar', 3)); await page.waitForTimeout(1500)
const info = await page.evaluate(() => { const l = window.__nal.useGame.getState().life; return { dream: l.character.dreamId, stage: l.dreamStage } })
console.log(JSON.stringify(info))
await page.evaluate(() => window.__nal.useGame.getState().openSheet('quests')); await shot('01-quests')
await page.getByText('Show me').first().click(); await shot('02-tracked')
console.log('guide:', JSON.stringify(await page.getByRole('button', { name: 'Guide' }).innerText().catch(() => 'n/a')))
await page.evaluate(() => { const g = window.__nal.useGame; const l = g.getState().life; g.setState({ life: { ...l, dreamDone: true, dreamStage: 6 }, sheet: 'dreamDone' }) }); await shot('03-dream-done')
await page.getByRole('button', { name: /Finish this life/ }).click(); await page.waitForTimeout(1500); await shot('04-ending')
console.log('screen:', await page.evaluate(() => window.__nal.useGame.getState().screen), 'ending:', await page.evaluate(() => window.__nal.useGame.getState().life?.ending?.id))
console.log('errors', errors)
await browser.close()
