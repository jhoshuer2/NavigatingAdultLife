import { chromium } from 'playwright-core'
const OUT = '/tmp/claude-0/-home-user-NavigatingAdultLife/f97bb3da-afd4-5501-b372-1bb1d534ad7b/scratchpad/audit'
const [, , name, w = '390', h = '844', url = ''] = process.argv
const browser = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'] })
const page = await browser.newPage({ viewport: { width: +w, height: +h } })
await page.goto(`http://localhost:4173/?unlimited=1&debug=1${url}`)
await page.waitForTimeout(2200)
await page.screenshot({ path: `${OUT}/${name}.png` })
await browser.close()
