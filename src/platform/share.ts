import type { Ending } from '@engine/core/types'

export interface ShareInfo { name: string; age: number; ending: Ending; dream: string }

/** Renders a 1080x1350 share card on a canvas and returns a PNG blob. */
export async function renderShareCard(info: ShareInfo): Promise<Blob | null> {
  const W = 1080, H = 1350
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const g = c.getContext('2d'); if (!g) return null
  const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#2b1f4d'); grad.addColorStop(1, '#14121f')
  g.fillStyle = grad; g.fillRect(0, 0, W, H)
  // danfo stripe
  g.fillStyle = '#ffd23f'; g.fillRect(0, 0, W, 28); g.fillStyle = '#1c1b22'
  for (let x = 0; x < W; x += 60) g.fillRect(x, 0, 30, 28)
  g.textAlign = 'center'
  g.fillStyle = '#ffd23f'; g.font = '900 72px Impact, "Arial Black", sans-serif'; g.fillText('NAVIGATING ADULT LIFE', W / 2, 130)
  g.fillStyle = '#fff8ea'; g.font = '800 40px system-ui, sans-serif'; g.fillText(`${info.name}, ${info.age} years`, W / 2, 230)
  g.fillStyle = '#ffd23f'; g.font = '900 110px Impact, "Arial Black", sans-serif'
  wrap(g, info.ending.title.toUpperCase(), W / 2, 380, W - 120, 118)
  g.fillStyle = '#fff8ea'; g.font = '700 38px system-ui, sans-serif'
  g.fillText(`Legacy score  ${info.ending.legacy}`, W / 2, 560)
  g.fillText(`Net worth  ₦${Math.round(info.ending.netWorth).toLocaleString('en-NG')}`, W / 2, 620)
  g.fillStyle = info.ending.dreamDone ? '#2fd27b' : '#b9b4d6'
  g.fillText(info.ending.dreamDone ? `Dream achieved: ${info.dream}` : `Dream: ${info.dream} (unfinished)`, W / 2, 680)
  g.fillStyle = '#ffffff'; g.font = '800 40px system-ui, sans-serif'; g.fillText('Life highlights', W / 2, 790)
  g.font = '600 34px system-ui, sans-serif'; g.fillStyle = '#e6e1ff'
  let y = 850
  for (const m of info.ending.topMoments.slice(0, 5)) { y = wrap(g, m, W / 2, y, W - 160, 44) + 18 }
  g.fillStyle = '#ffd23f'; g.font = '800 36px system-ui, sans-serif'; g.fillText('What would YOU do? Play free.', W / 2, H - 70)
  return new Promise((res) => c.toBlob((b) => res(b), 'image/png'))
}

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number): number {
  const words = text.split(' '); let line = ''; let yy = y
  for (const w of words) {
    const t = line ? `${line} ${w}` : w
    if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh } else line = t
  }
  g.fillText(line, x, yy)
  return yy
}

export async function shareCard(info: ShareInfo): Promise<'shared' | 'downloaded' | 'failed'> {
  const blob = await renderShareCard(info)
  if (!blob) return 'failed'
  const file = new File([blob], 'my-life.png', { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
  try {
    if (nav.canShare?.({ files: [file] })) { await nav.share({ files: [file], text: `I lived as ${info.name}: "${info.ending.title}". Navigating Adult Life` }); return 'shared' }
  } catch { /* fall through to download */ }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-life.png'; a.click(); URL.revokeObjectURL(a.href)
  return 'downloaded'
}
