import { describe, expect, it } from 'vitest'
import { BADGES, badgeState, earnedIds } from '../src/content/badges'
import { CHAPTERS } from '../src/levels/chapters'
import { LEVELS } from '../src/levels/levels'
import { emptyProgress, progressOf, recordRush, withRank, type ChapterProgress } from '../src/levels/progress'
import { defaultMeta } from '../src/platform/meta'

const earned = (p: ChapterProgress) => new Set(earnedIds(p))
const finish = (p: ChapterProgress, chapter: number, stars = 1): ChapterProgress => ({ ...p, stars: { ...p.stars, ...Object.fromEntries(CHAPTERS[chapter - 1].levels.map((l) => [l, stars])) } })

describe('badges', () => {
  it('has unique ids and a chapter badge for every chapter, named after the chapter\'s last level', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length)
    for (const c of CHAPTERS) {
      const b = BADGES.find((x) => x.id === `chapter${c.number}`)!
      expect(b, c.title).toBeTruthy()
      expect(b.title).toBe(LEVELS[c.levels[c.levels.length - 1]].badge)
      expect(b.need).toBe(c.totalLevels)
    }
    expect(BADGES.filter((b) => b.id.startsWith('chapter'))).toHaveLength(10)
  })

  it('a fresh profile earns nothing', () => { expect(earnedIds(emptyProgress())).toEqual([]) })

  it('finishing every level of a chapter earns that chapter\'s badge, and partial progress does not', () => {
    const c3 = CHAPTERS[2].levels
    const part = { ...emptyProgress(), stars: Object.fromEntries(c3.slice(0, 8).map((l) => [l, 3])) }
    expect(earned(part).has('chapter3')).toBe(false)
    expect(badgeState(part).find((b) => b.id === 'chapter3')).toMatchObject({ value: 8, need: 9, earned: false })
    const full = finish(emptyProgress(), 3, 1)
    const e = earned(full)
    expect(e.has('chapter3')).toBe(true); expect(e.has('chapter2')).toBe(false)
    expect(e.has('first_steps')).toBe(true); expect(e.has('three_stars')).toBe(false); expect(e.has('perfect_chapter')).toBe(false)
  })

  it('three stars, a perfect chapter, star collector and made it', () => {
    const perfect = finish(emptyProgress(), 1, 3)
    expect(earned(perfect)).toContain('three_stars'); expect(earned(perfect)).toContain('perfect_chapter')
    expect(badgeState(perfect).find((b) => b.id === 'star_collector')).toMatchObject({ value: 27, earned: false })
    let all = emptyProgress(); for (let i = 1; i <= 10; i++) all = finish(all, i, 3)
    const e = earned(all)
    expect(e.has('made_it')).toBe(true); expect(e.has('star_collector')).toBe(true); for (let i = 1; i <= 10; i++) expect(e.has(`chapter${i}`)).toBe(true)
  })

  it('rush distance and Alfred badges follow the counters', () => {
    const p = { ...emptyProgress(), rush: { ...emptyProgress().rush, best: 1200, alfredWins: 1 } }
    const e = earned(p)
    expect([...e].filter((id) => id.startsWith('rush_')).sort()).toEqual(['rush_1000', 'rush_500'])
    expect(e.has('alfred_1')).toBe(true); expect(e.has('alfred_10')).toBe(false)
    expect(badgeState(p).find((b) => b.id === 'alfred_10')).toMatchObject({ value: 1, need: 10 })
  })

  it('old saves count their wins as wins against Alfred; there are no live badges yet', () => {
    const meta = { ...defaultMeta(), chapter: { ...emptyProgress(), rush: { best: 80, plays: 5, wins: 3, points: 2 } } }
    const p = progressOf(meta)
    expect(p.rush.alfredWins).toBe(3); expect(p.rush.liveWins).toBe(0)
    expect(earned(p).has('alfred_1')).toBe(true); expect([...earned(p)].some((id) => id.startsWith('live') || id === 'top3')).toBe(false)
  })

  it('recordRush counts each kind of race separately and keeps the point rules', () => {
    let p = emptyProgress()
    let r = recordRush(p, { distance: 150, won: true, mode: 'alfred' }); p = r.progress
    expect(r.points).toBe(2); expect(p.rush).toMatchObject({ wins: 1, alfredWins: 1, liveWins: 0, livePlays: 0 })
    r = recordRush(p, { distance: 100, won: true, mode: 'live' }); p = r.progress
    expect(r.points).toBe(0); expect(p.rush).toMatchObject({ wins: 2, alfredWins: 1, liveWins: 1, livePlays: 1 })
    r = recordRush(p, { distance: 90, won: false, mode: 'live' }); p = r.progress
    expect(p.rush).toMatchObject({ wins: 2, liveWins: 1, livePlays: 2 })
    r = recordRush(p, { distance: 90 }); p = r.progress
    expect(p.rush).toMatchObject({ plays: 4, livePlays: 2, alfredWins: 1 })
    expect(earned(p)).toContain('live_1'); expect(earned(p)).toContain('live_win_1'); expect(earned(p)).not.toContain('live_win_5')
  })

  it('the top 3 badge needs a best global rank of 3 or better, and the rank only improves', () => {
    let p = withRank(emptyProgress(), 7)
    expect(p.rush.bestRank).toBe(7); expect(earned(p).has('top3')).toBe(false)
    p = withRank(p, 12); expect(p.rush.bestRank).toBe(7)
    p = withRank(p, 3); expect(p.rush.bestRank).toBe(3); expect(earned(p).has('top3')).toBe(true)
    p = withRank(p, 9); expect(p.rush.bestRank).toBe(3)
    expect(withRank(p, 0)).toBe(p)
  })
})
