import { describe, it, expect } from 'vitest'
import { createDash, stepDash, generateRow, rowSolvable, resultOf, MIN_GAP_S, segmentAt, levelAt, maxSpeedFor, LEVELS, type DashMode, type DashState } from '../src/minigames/go-slow-dash/sim'

describe('go-slow dash sim', () => {
  it('is deterministic for the same seed and inputs', () => {
    const run = () => { const s = createDash({ seed: 5, mode: 'foot', hearts: 3, assist: false }); for (let i = 0; i < 1200; i++) { if (i % 90 === 10) s.queue.push('left'); if (i % 137 === 5) s.queue.push('jump'); stepDash(s, 1 / 60) } return resultOf(s) }
    expect(run()).toEqual(run())
  })
  it('fairness rule: every generated row is solvable and spaced by the minimum time gap', () => {
    for (const mode of ['foot', 'danfo'] as DashMode[]) {
      for (let seed = 1; seed <= 40; seed++) {
        const s = createDash({ seed, mode, hearts: 3, assist: false })
        for (let i = 0; i < 400; i++) {
          s.spawnedTo = i * 14 // anywhere along the road, so every level is covered
          const row = generateRow(s)
          expect(rowSolvable(row.objs, mode), `${mode} seed ${seed} row ${i}`).toBe(true)
          expect(row.gap).toBeGreaterThanOrEqual(Math.max(MIN_GAP_S * maxSpeedFor(s.cfg, levelAt(s.spawnedTo)), 14) - 0.001)
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
  it('the road is the same for everyone with the same seed, whatever they do', () => {
    const a = createDash({ seed: 77, mode: 'foot', hearts: 99, assist: false }), b = createDash({ seed: 77, mode: 'foot', hearts: 99, assist: false })
    for (let i = 0; i < 60 * 20; i++) { if (i % 40 === 3) a.queue.push('left'); stepDash(a, 1 / 60); stepDash(b, 1 / 60) }
    const sig = (s: DashState) => s.objs.filter((o) => o.type !== 'coin' && o.dist < 900).map((o) => `${o.kind}@${Math.round(o.dist)}:${o.lane}`).join()
    expect(sig(a)).toBe(sig(b))
  })
  it('levels bring new things onto the road and raise the top speed', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(8)
    expect(levelAt(0)).toBe(1); expect(levelAt(2100)).toBe(5); expect(levelAt(99999)).toBe(LEVELS.length)
    expect(maxSpeedFor({ assist: false }, 6)).toBeGreaterThan(maxSpeedFor({ assist: false }, 1))
    const kinds = (from: number, to: number) => { const s = createDash({ seed: 4, mode: 'foot', hearts: 3, assist: false }); const set = new Set<string>(); for (let i = 0; i < 600; i++) { s.spawnedTo = from + (i * (to - from)) / 600; for (const o of generateRow(s).objs) set.add(o.kind) } return set }
    const early = kinds(0, 340), late = kinds(2800, 5000)
    for (const k of ['train', 'bigBus', 'plane', 'crowd', 'car', 'walker', 'shack']) { expect(early.has(k), `${k} should not be on level 1`).toBe(false); expect(late.has(k), `${k} should appear late`).toBe(true) }
  })
  it('a runner who jumps onto a big bus rides on its roof; one who runs into its side crashes', () => {
    const make = () => { const s = createDash({ seed: 2, mode: 'foot', hearts: 3, assist: true }); s.objs = [{ id: 900, type: 'obstacle', kind: 'bigBus', lane: 0, dist: 30, length: 11 }]; s.spawnedTo = 99999; return s }
    const hit = make(); for (let i = 0; i < 60 * 3; i++) stepDash(hit, 1 / 60)
    expect(hit.hearts).toBe(2)
    const up = make(); let roof = false
    for (let i = 0; i < 60 * 3; i++) { const o = up.objs[0]; const rel = o.dist - up.dist; if (rel < 7.5 && rel > 6 && up.y === 0) up.queue.push('jump'); stepDash(up, 1 / 60); if (up.floor > 1) roof = true }
    expect(roof).toBe(true); expect(up.hearts).toBe(3)
  })
})
