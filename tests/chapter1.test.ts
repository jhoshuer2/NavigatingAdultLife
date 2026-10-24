import { describe, it, expect } from 'vitest'
import { LEVELS } from '../src/levels/levels'
import { CHAPTERS } from '../src/levels/chapters'
import { TaskRunner, type RunnerHooks } from '../src/levels/TaskRunner'
import { emptyProgress } from '../src/levels/progress'
import { TASK_FIELDS, type LevelDef } from '../src/levels/schema'
import { hazardZ } from '../src/levels/LevelRenderer'

const hooks = (): RunnerHooks => ({ say: () => {}, toast: () => {}, taskStarted: () => {}, taskDone: () => {}, taskFailed: () => {}, levelDone: () => {}, save: () => {}, changed: () => {} })
const inside = (L: LevelDef, x: number, z: number) => L.blockers.some((b) => x > b.x0 && x < b.x1 && z > b.z0 && z < b.z1)

/** A bot that plays any level correctly, using only the public runner API. */
function solve(L: LevelDef): TaskRunner {
  const r = new TaskRunner(L, emptyProgress(), hooks())
  let guard = 0
  while (!r.finished && guard++ < 40) {
    const t = r.task, idx = r.idx
    const items = L.items.filter((i) => i.task === idx)
    if (t.kind === 'goto' || t.kind === 'reach') { const a = r.goalArea; if (a) r.update(0.1, a.x, a.z); else r.update(0.1, L.exitX + 0.1, 0) }
    else if (t.kind === 'find') r.interact(L.spots.find((s) => s.task === idx && s.right)!.id)
    else if (t.kind === 'collect') {
      const bud = L.budgets?.[idx]
      const pool = bud ? [...items].sort((a, b) => (a.price ?? 0) - (b.price ?? 0)).slice(0, bud.need) : items
      for (const it of pool) r.interact(it.id)
    }
    else if (t.kind === 'choose') r.interact(items[0].id)
    else if (t.kind === 'sequence') for (const id of L.sequences![idx]) r.interact(id)
    else if (t.kind === 'hold') { const h = L.holds![idx]; r.update(h.secs + 1, h.x, h.z) }
    else if (t.kind === 'kick') for (let i = 0; i < L.kick!.goals; i++) r.kickResult(true)
  }
  return r
}

describe('chapter 1 and 2: every level', () => {
  const all = Object.values(LEVELS)
  it('all nine chapter 1 levels exist, chain in order and the chapter lists them', () => {
    const ids = Array.from({ length: 9 }, (_, i) => `ch1.l${i + 1}`)
    for (const id of ids) expect(LEVELS[id], id).toBeTruthy()
    ids.forEach((id, i) => expect(LEVELS[id].next).toBe(i < 8 ? ids[i + 1] : null))
    expect(CHAPTERS[0].levels).toEqual(ids)
  })
  for (const L of all) {
    describe(L.id, () => {
      it('has the full task template, guide areas for every task and a title', () => {
        expect(L.title && L.intro && L.starRules.length === 3).toBeTruthy()
        for (const t of L.tasks) for (const f of TASK_FIELDS) expect((t as any)[f], `${t.id}.${f}`).toBeTruthy()
        expect(L.guideAreas.length).toBe(L.tasks.length)
      })
      it('has a walkable start, goals and finish rings; items and clues exist for the tasks that need them', () => {
        expect(inside(L, L.spawn.x, L.spawn.z)).toBe(false)
        expect(inside(L, L.spawnAfterFirst.x, L.spawnAfterFirst.z)).toBe(false)
        const areas = [...(L.gotoAreas ?? []), ...Object.values(L.variants ?? {}).map((v) => v.goal), ...Object.values(L.holds ?? {})]
        for (const a of areas) if (a) expect(inside(L, a.x, a.z), `ring ${a.x},${a.z}`).toBe(false)
        L.tasks.forEach((t, i) => {
          if (t.kind === 'choose') expect(L.items.filter((x) => x.task === i).length, t.id).toBeGreaterThanOrEqual(2)
          if (t.kind === 'find') { expect(L.spots.filter((s) => s.task === i && s.right).length, t.id).toBe(1); expect(L.spots.filter((s) => s.task === i).length).toBeGreaterThanOrEqual(2) }
          if (t.kind === 'collect' && !L.budgets?.[i]) expect(L.items.filter((x) => x.task === i).length).toBeGreaterThanOrEqual(2)
          if (t.kind === 'sequence') { const ord = L.sequences![i]; expect(ord.length).toBeGreaterThanOrEqual(3); for (const id of ord) expect(L.items.some((x) => x.id === id && x.task === i), id).toBe(true) }
          if (t.kind === 'goto' || t.kind === 'reach') expect(L.gotoAreas?.[i] || L.variants || t.kind === 'reach', t.id).toBeTruthy()
        })
        for (const it of L.items) expect(it.x > L.bounds.x0 && it.x < L.bounds.x1 && it.z > L.bounds.z0 && it.z < L.bounds.z1).toBe(true)
      })
      it('can be finished by a correct bot: 1 point per task, never blocked', () => {
        const r = solve(L)
        expect(r.finished, 'finished').toBe(true)
        expect(r.progress.points).toBe(L.tasks.length)
        expect(r.stars()).toBeGreaterThanOrEqual(1)
      })
      it('timed tasks are fair: always a free gap between sliding hazards, and enough time', () => {
        const sets = [L.hazards, ...Object.values(L.variants ?? {}).map((v) => v.hazards)]
        for (const hs of sets) for (let t = 0; t < 20; t += 0.25) for (const h of hs) { const z = hazardZ(h, t); expect(z).toBeGreaterThanOrEqual(h.z0 - 0.001); expect(z).toBeLessThanOrEqual(h.z1 + 0.001) }
        for (const v of Object.values(L.variants ?? {})) if (v.hazards.length) expect(v.timeLimit).toBeGreaterThanOrEqual(12)
      })
    })
  }
  it('budget task is solvable and over-spending is refused', () => {
    const L = LEVELS['ch1.l3']; const r = new TaskRunner(L, emptyProgress(), hooks(), 1)
    r.interact('rice'); r.interact('fish'); expect(r.collected).toEqual(['rice']) // 800 + 600 is too much
    r.interact('onions'); r.interact('pepper'); expect(r.collected).toEqual(['rice', 'onions']); expect(r.budgetLeft).toBe(0)
    r.interact('reset'); expect(r.collected).toEqual([]); expect(r.budgetLeft).toBe(1000) // never stuck: put everything back
    for (const id of ['tomatoes', 'onions', 'pepper']) r.interact(id)
    expect(r.idx).toBe(2)
  })
  it('sequence task: a wrong order sends you back, the right order finishes', () => {
    const L = LEVELS['ch1.l5']; const r = new TaskRunner(L, emptyProgress(), hooks(), 2)
    r.interact('jollof'); r.interact('drink'); expect(r.seqPos).toBe(0); expect(r.mistakes).toBe(1)
    for (const id of ['jollof', 'chicken', 'drink']) r.interact(id)
    expect(r.idx).toBe(3)
  })
  it('hold task counts seconds in the ring and loses them outside', () => {
    const L = LEVELS['ch1.l5']; const r = new TaskRunner(L, emptyProgress(), hooks(), 1)
    r.update(3, -3.2, 0); expect(r.holdT).toBeCloseTo(3); r.update(1, 0, 0); expect(r.holdT).toBeCloseTo(1); r.update(6, -3.2, 0); expect(r.idx).toBe(2)
  })
  it('the choice before it changes the timed task, the goal of a walk-to task and the lines of the next task', () => {
    const L6 = LEVELS['ch1.l6']; const r6 = new TaskRunner(L6, emptyProgress(), hooks()); r6.interact('green')
    for (const id of ['print', 'sign', 'stamp']) r6.interact(id)
    expect(r6.timeLimit).toBe(15)
    const L4 = LEVELS['ch1.l4']; const r4 = new TaskRunner(L4, emptyProgress(), hooks(), 1); r4.interact('ladder')
    expect(r4.goalArea).toEqual({ x: 8.6, z: 3.0, r: 1.5 })
  })
  it('chapter 1 finished opens chapter 2', async () => {
    const { chapterState, finishLevel } = await import('../src/levels/progress')
    let p = emptyProgress(); for (let i = 1; i <= 9; i++) p = finishLevel(p, `ch1.l${i}`, 1, null)
    expect(chapterState(p, CHAPTERS, 0)).toBe('done'); expect(chapterState(p, CHAPTERS, 1)).toBe('active')
    expect(chapterState(finishLevel(emptyProgress(), 'ch1.l1', 3, null), CHAPTERS, 1)).toBe('locked')
  })
})
