import { chromium } from 'playwright-core'
const OUT = process.env.OUT ?? '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/shots'
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
page.setDefaultTimeout(8000)
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:4173/?unlimited=1&debug=1')
await page.waitForFunction(() => window.__nal)
await page.evaluate(() => {
  const g = window.__nal.useGame
  g.setState({ meta: { ...g.getState().meta, seenTutorial: true } })
  window.__nal.jump(27, 'money', 5)
  const l = structuredClone(g.getState().life)
  l.character.job = { trackId: 'trade', level: 2, years: 1, salary: 1500000, title: 'Journeyman' }
  l.character.stats.energy = 80
  g.setState({ life: l })
})
await page.getByRole('button', { name: /Play Go-Slow Dash/ }).click()
await page.waitForTimeout(1500)
await page.getByText('Tap to start').click()
for (let i = 0; i < 16; i++) { await page.waitForTimeout(500); await page.keyboard.press(['ArrowLeft', 'ArrowRight', 'ArrowRight', 'ArrowLeft'][i % 4]) }
await page.keyboard.down('ArrowDown'); await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/40-danfo-run.png` })
await page.keyboard.up('ArrowDown')
console.log('errors', errors)
await browser.close()
