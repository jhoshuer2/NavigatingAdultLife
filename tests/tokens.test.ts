import { describe, it, expect } from 'vitest'
import { defaultMeta, DAILY_SEC, FREE_CAP_SEC, WELCOME_SEC } from '../src/platform/meta'
import { addPaid, consume, refreshTokens, remainingSec } from '../src/platform/tokens'

const day = (n: number) => new Date(2026, 9, n, 10, 0, 0)

describe('playtime tokens (PRD 3.10)', () => {
  it('grants the 2-hour welcome allowance once', () => {
    const m = refreshTokens(defaultMeta(), day(10))
    expect(m.tokens.freeSec).toBe(WELCOME_SEC)
    expect(refreshTokens(m, day(10)).tokens.freeSec).toBe(WELCOME_SEC)
  })
  it('adds the daily refill on a new day but never exceeds the free cap', () => {
    let m = refreshTokens(defaultMeta(), day(10))
    m = consume(m, 3600)
    expect(m.tokens.freeSec).toBe(WELCOME_SEC - 3600)
    m = refreshTokens(m, day(11))
    expect(m.tokens.freeSec).toBe(WELCOME_SEC - 3600 + DAILY_SEC)
    m = refreshTokens(m, day(12))
    expect(m.tokens.freeSec).toBeLessThanOrEqual(FREE_CAP_SEC)
    m = refreshTokens(m, day(13))
    expect(m.tokens.freeSec).toBe(FREE_CAP_SEC)
  })
  it('spends free time before purchased time and never goes negative', () => {
    let m = refreshTokens(defaultMeta(), day(10))
    m = addPaid(m, 60)
    m = consume(m, WELCOME_SEC + 600)
    expect(m.tokens.freeSec).toBe(0)
    expect(m.tokens.paidSec).toBe(3600 - 600)
    m = consume(m, 99999)
    expect(remainingSec(m)).toBe(0)
  })
  it('unlimited test mode never consumes time', () => {
    const m = { ...refreshTokens(defaultMeta(), day(10)), tokens: { ...defaultMeta().tokens, unlimited: true } }
    expect(consume(m, 10000)).toBe(m)
    expect(remainingSec(m)).toBe(Infinity)
  })
})
