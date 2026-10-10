import { describe, it, expect } from 'vitest'
import { shotFromSwipe, keeperDive, resolveShot } from '../src/ui/tasks/rules'
import { ACTIVITY_HOURS } from '../src/world/time'
import { ACTIVITY_BY_ID } from '../src/content/activities'
import { scoreOf } from '../src/content/dialogue'

const rate = (gen: () => { aim: number; ty: number }, n = 20000) => {
  let goals = 0
  for (let i = 0; i < n; i++) { const s = gen(); if (resolveShot(s.aim, s.ty, keeperDive(s.aim)) === 'goal') goals++ }
  return goals / n
}
const U = (a: number, b: number) => a + Math.random() * (b - a)

describe('penalty balance', () => {
  it('random swipes score about half the time', () => {
    const r = rate(() => { const s = shotFromSwipe(U(-100, 100), -U(60, 170)); return { aim: s.aim, ty: s.ty } })
    expect(r).toBeGreaterThan(0.3); expect(r).toBeLessThan(0.7)
  })
  it('well-placed high corner shots beat the keeper almost always', () => {
    expect(rate(() => ({ aim: 1.3, ty: 2.1 }))).toBeGreaterThan(0.9)
  })
  it('weak shots down the middle are usually saved', () => {
    expect(rate(() => ({ aim: 0, ty: 0.6 }))).toBeLessThan(0.55)
  })
  it('a full-length swipe to the side goes wide and a huge one goes over', () => {
    const s = shotFromSwipe(150, -100); expect(resolveShot(s.aim, s.ty, 0)).toBe('wide')
    const o = shotFromSwipe(0, -260); expect(resolveShot(o.aim, o.ty, 0)).toBe('over')
  })
})

describe('time budget', () => {
  it('a year of activities fits in roughly one in-world day', () => {
    // ~100 energy per year: hours per energy point must stay small so places do not all close by early evening
    const ratios = Object.entries(ACTIVITY_HOURS).map(([id, h]) => ({ id, ratio: ACTIVITY_BY_ID[id] && ACTIVITY_BY_ID[id].cost.energy > 3 ? h / ACTIVITY_BY_ID[id].cost.energy : 0 })).filter((x) => x.ratio > 0)
    for (const x of ratios) expect(x.ratio, x.id).toBeLessThanOrEqual(0.16)
    const avg = ratios.reduce((a, b) => a + b.ratio, 0) / ratios.length
    expect(avg * 100).toBeLessThan(13)
  })
})

describe('conversation scoring', () => {
  it('tone matters: funny wins with friends and siblings, warm with family and partners, flat is always worst', () => {
    expect(scoreOf('funny', 'friend')).toBeGreaterThan(scoreOf('warm', 'friend'))
    expect(scoreOf('funny', 'sibling')).toBeGreaterThan(scoreOf('warm', 'sibling'))
    expect(scoreOf('warm', 'mother')).toBeGreaterThan(scoreOf('funny', 'mother'))
    expect(scoreOf('warm', 'boss')).toBeGreaterThan(scoreOf('funny', 'boss'))
    for (const g of ['friend', 'partner', 'mother', 'father', 'sibling', 'child', 'boss'] as const) expect(scoreOf('meh', g)).toBeLessThan(0.3)
  })
})
