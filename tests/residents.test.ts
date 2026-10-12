import { describe, it, expect } from 'vitest'
import { presenceAt } from '../src/world/residents'

describe('resident routines', () => {
  it('everyone is asleep (not on screen) late at night', () => {
    for (const role of ['mother', 'father', 'sibling', 'child', 'friend', 'partner', 'boss']) expect(presenceAt(role, 2).where).toBe('away')
  })
  it('the father is at work and the sibling at school on weekday mornings', () => {
    expect(presenceAt('father', 10).where).toBe('away')
    expect(presenceAt('sibling', 10).where).toBe('away')
  })
  it('the mother cooks in the morning and evening', () => {
    expect(presenceAt('mother', 7).activity).toBe('cook'); expect(presenceAt('mother', 17).activity).toBe('cook')
  })
  it('family are mostly home in the evening, and not always outside', () => {
    let out = 0, n = 0
    for (let h = 0; h < 24; h += 0.5) for (const role of ['mother', 'father', 'sibling', 'child']) { n++; if (presenceAt(role, h).where === 'out') out++ }
    expect(out / n).toBeLessThan(0.25)
    expect(presenceAt('father', 20.5).where).toBe('home')
  })
  it('routines are stable within an hour block', () => {
    expect(presenceAt('mother', 10.1, 'x')).toEqual(presenceAt('mother', 10.9, 'x'))
  })
  it('the boss is only at the office in working hours', () => {
    expect(presenceAt('boss', 11).where).toBe('place:office'); expect(presenceAt('boss', 20).where).toBe('away')
  })
})
