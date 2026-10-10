import { describe, it, expect } from 'vitest'
import { createDash, stepDash, generateRow, rowSolvable, resultOf, MIN_GAP_S, segmentAt, type DashMode } from '../src/minigames/go-slow-dash/sim'

describe('go-slow dash sim', () => {
  it('is deterministic for the same seed and inputs', () => {
    const run = () => { const s = createDash({ seed: 5, mode: 'foot', hearts: 3, assist: false }); for (let i = 0; i < 1200; i++) { if (i % 90 === 10) s.queue.push('left'); if (i % 137 === 5) s.queue.push('jump'); stepDash(s, 1 / 60) } return resultOf(s) }
    expect(run()).toEqual(run())
  })
  it('fairness rule: every generated row is solvable and spaced by the minimum time gap', () => {
    for (const mode of ['foot', 'danfo'] as DashMode[]) {
      for (let seed = 1; seed <= 40; seed++) {
        const s = createDash({ seed, mode, hearts: 3, assist: false })
        for (let i = 0; i < 250; i++) {
          s.dist = i * 12; s.speed = 13 + (i % 16)
          const row = generateRow(s)
          expect(rowSolvable(row.objs, mode), `${mode} seed ${seed} row ${i}`).toBe(true)
          expect(row.gap).toBeGreaterThanOrEqual(Math.max(MIN_GAP_S * s.speed, 14) - 0.001)
        }
      }
    }
  })
  it('an idle player eventually crashes out and the run ends', () => {
    const s = createDash({ seed: 9, mode: 'foot', hearts: 3, assist: false })
    for (let i = 0; i < 60 * 120 && !s.over; i++) stepDash(s, 1 / 60)
    expect(s.over).toBe(true)
    expect(resultOf(s).distance).toBeGreaterThan(50)
  })
  it('a simple dodging bot survives much longer than an idle player', () => {
    const score = (bot: boolean) => {
      const s = createDash({ seed: 21, mode: 'danfo', hearts: 3, assist: false })
      for (let i = 0; i < 60 * 90 && !s.over; i++) {
        if (bot && i % 6 === 0) {
          // look ahead and move toward a free lane
          const ahead = s.objs.filter((o) => o.type === 'obstacle' && o.dist - s.dist > 0 && o.dist - s.dist < 24)
          const blocked = new Set(ahead.map((o) => o.lane))
          if (blocked.has(s.lane)) { const options = [-1, 0, 1].filter((l) => !blocked.has(l)); if (options.length) { const t = options.sort((a, b) => Math.abs(a - s.lane) - Math.abs(b - s.lane))[0]; s.queue.push(t < s.lane ? 'left' : 'right') } }
        }
        stepDash(s, 1 / 60)
      }
      return s.dist
    }
    expect(score(true)).toBeGreaterThan(score(false) * 1.5)
  })
  it('collecting coins raises the coin count and score', () => {
    const s = createDash({ seed: 3, mode: 'foot', hearts: 99, assist: true })
    for (let i = 0; i < 60 * 40 && !s.over; i++) { const c = s.objs.find((o) => o.type === 'coin' && !o.taken && o.dist > s.dist); if (c && i % 3 === 0) { if (c.lane < s.lane) s.queue.push('left'); else if (c.lane > s.lane) s.queue.push('right') } stepDash(s, 1 / 60) }
    expect(s.coins).toBeGreaterThan(5)
  })
  it('route segments are looked up by distance', () => {
    expect(segmentAt(10).seg.name).toBe('Oshodi')
    expect(segmentAt(700).seg.name).toBe('Ojuelegba')
  })
})
