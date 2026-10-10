// Generates PNG app icons by rendering an SVG in headless Chromium. Run: CHROME=<path> node tools/make-icons.mjs
import { chromium } from 'playwright-core'
const svg = (s, pad) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 512 512"><rect width="512" height="512" fill="#14121f"/><g transform="translate(${pad} ${pad}) scale(${(512 - pad * 2) / 512})"><rect x="40" y="150" width="432" height="190" rx="44" fill="#ffd23f" stroke="#1c1b22" stroke-width="14"/><rect x="40" y="250" width="432" height="38" fill="#1c1b22"/><rect x="80" y="175" width="90" height="62" rx="8" fill="#a7d7ff"/><rect x="190" y="175" width="90" height="62" rx="8" fill="#a7d7ff"/><rect x="300" y="175" width="90" height="62" rx="8" fill="#a7d7ff"/><circle cx="140" cy="350" r="42" fill="#1c1b22"/><circle cx="372" cy="350" r="42" fill="#1c1b22"/><circle cx="140" cy="350" r="16" fill="#999"/><circle cx="372" cy="350" r="16" fill="#999"/><text x="256" y="92" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-size="64" fill="#ffd23f">NAL</text><rect x="120" y="406" width="272" height="14" rx="7" fill="#2fd27b"/></g></svg>`
const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] })
const p = await b.newPage()
for (const [name, size, pad] of [['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['icon-maskable-512.png', 512, 64]]) {
  await p.setViewportSize({ width: size, height: size })
  await p.setContent(`<body style="margin:0">${svg(size, pad)}</body>`)
  await p.screenshot({ path: `public/${name}` })
}
await b.close()
