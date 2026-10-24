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
    if (t.kind === 'goto' || t.kind === 'reach' || t.kind === 'ride') { const a = r.goalArea; if (a) r.update(0.1, a.x, a.z); else r.update(0.1, L.exitX + 0.1, 0) }
    else if (t.kind === 'find') r.interact(L.spots.find((s) => s.task === idx && s.right)!.id)
    else if (t.kind === 'collect') {
      const bud = L.budgets?.[idx]
      const pool = bud ? [...items].sort((a, b) => (a.price ?? 0) - (b.price ?? 0)).slice(0, bud.need) : items
      for (const it of pool) r.interact(it.id)
    }
    else if (t.kind === 'choose') r.interact(items[0].id)
    else if (t.kind === 'sequence') for (const id of L.sequences![idx]) r.interact(id)
    else if (t.kind === 'serve') { for (const g of L.serves![idx].guests) { r.interact(`g:${g.id}`); r.interact(g.dish); r.interact(`g:${g.id}`) } r.update(L.serves![idx].eatSecs ?? 3, 0, 0) }
    else if (t.kind === 'talk') { for (const p of L.talks![idx]) { r.interact(`t:${p.id}`); for (let i = 0; i < (p.rounds?.length ?? 0); i++) r.interact(`c:${r.convoOptions![0].id}`) } }
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
          if (t.kind === 'ride') { expect(L.rides?.[i], t.id).toBeTruthy(); expect(L.gotoAreas?.[i], t.id).toBeTruthy() }
          if (t.kind === 'serve') for (const g of L.serves![i].guests) { expect(L.items.some((x) => x.id === g.dish && x.task === i), g.id).toBe(true); for (const q of [g, g.seat]) expect(inside(L, q.x, q.z), `${g.id} at ${q.x},${q.z}`).toBe(false) }
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
    const L = LEVELS['ch1.l5']; const r = new TaskRunner(L, emptyProgress(), hooks(), 1)
    r.interact('goat'); r.interact('rice_imp'); r.interact('chicken'); expect(r.collected).toEqual(['goat', 'rice_imp']) // 2200 + 1800 + 1500 is too much
    expect(r.budgetLeft).toBe(200)
    r.interact('reset'); expect(r.collected).toEqual([]); expect(r.budgetLeft).toBe(4200) // never stuck: put everything back
    for (const id of ['tomato', 'rice', 'chicken', 'oil']) r.interact(id)
    expect(r.idx).toBe(2)
  })
  it('sequence task: a wrong order sends you back, the right order finishes', () => {
    const L = LEVELS['ch1.l6']; const r = new TaskRunner(L, emptyProgress(), hooks(), 1)
    const ord = L.sequences![1]
    r.interact(ord[1]); expect(r.seqPos).toBe(0); expect(r.mistakes).toBe(1)
    for (const id of ord) r.interact(id)
    expect(r.idx).toBe(2)
  })
  it('serve task: seat, fetch the right dish, deliver, they eat; a wrong plate is sent back', () => {
    const L = LEVELS['ch1.l6']; const r = new TaskRunner(L, emptyProgress(), hooks(), 2)
    expect(r.task.kind).toBe('serve')
    r.interact('plateChidi'); expect(r.carry).toBeNull() // nobody is seated yet: there is nobody to take it to
    r.interact('g:chidi'); expect(r.guests.chidi).toBe(1)
    r.interact('plateChidi'); expect(r.carry).toBe('plateChidi')
    r.interact('g:chidi'); expect(r.guests.chidi).toBe(2); expect(r.carry).toBeNull()
    r.interact('g:femi'); r.interact('g:tobi'); r.interact('g:femi'); r.interact('plateTobi'); r.interact('g:femi') // the wrong plate
    expect(r.guests.femi).toBe(1); expect(r.mistakes).toBe(1); expect(r.carry).toBeNull()
    r.update(3.1, 0, 0); expect(r.guests.chidi).toBe(3); expect(r.fed).toBe(1)
    r.interact('plateFemi'); r.interact('g:femi'); r.interact('plateTobi'); r.interact('g:tobi')
    r.update(3.1, 0, 0); expect(r.idx).toBe(3)
  })
  it('ride task: finishes when you arrive at the destination (the bus drops you there)', () => {
    const L = LEVELS['ch4.l4']; const r = new TaskRunner(L, emptyProgress(), hooks())
    expect(r.task.kind).toBe('ride'); r.update(0.1, -20, 4); expect(r.idx).toBe(0)
    const a = r.goalArea!; r.update(0.1, a.x, a.z); expect(r.idx).toBe(1)
  })
  it('hold task counts seconds in the ring and loses them outside', () => {
    const L = LEVELS['ch1.l3']; const r = new TaskRunner(L, emptyProgress(), hooks(), 3)
    r.update(3, 16, 0.4); expect(r.holdT).toBeCloseTo(3); r.update(1, 0, 0); expect(r.holdT).toBeCloseTo(1); r.update(6, 16, 0.4); expect(r.finished).toBe(true)
  })
  it('talk task: walk up, answer, any order, done when everyone has been spoken to; one conversation at a time', () => {
    const L = LEVELS['ch1.l4']; const lines: string[] = []; const r = new TaskRunner(L, emptyProgress(), { ...hooks(), say: (l: { text: string }) => { lines.push(l.text) } } as never)
    expect(r.task.kind).toBe('talk'); r.interact('t:tobi'); expect(r.spoken).toBe(1); expect(lines.length).toBeGreaterThan(0)
    r.interact('t:chidi'); expect(r.convoOptions!.length).toBe(2); r.interact('t:femi'); expect(r.spoken).toBe(1) // busy in a conversation
    r.interact('c:help'); expect(r.convo).toBeNull(); expect(r.spoken).toBe(2)
    r.interact('t:chidi'); expect(r.spoken).toBe(2) // already done
    r.interact('t:femi'); expect(r.idx).toBe(1)
  })
  it('the interview asks three questions one after the other', () => {
    const L = LEVELS['ch1.l8']; const r = new TaskRunner(L, emptyProgress(), hooks(), 2)
    r.interact('t:adeyemi'); for (const id of ['story', 'honest']) { expect(r.convo).toBeTruthy(); r.interact(`c:${id}`) }
    expect(r.convoOptions!.map((o) => o.id)).toEqual(['grow', 'need', 'city']); r.interact('c:city'); expect(r.idx).toBe(3)
  })
  it('chapters 2 to 4: no two levels in a chapter share the same ordered task kinds, each level is a bigger place and starts with the chapter vehicle', () => {
    const vehicle: Record<number, string> = { 2: 'train', 3: 'helicopter', 4: 'ferry', 5: 'keke', 6: 'truck' }
    for (const c of [2, 3, 4, 5, 6]) {
      const lv = Array.from({ length: 9 }, (_, i) => LEVELS[`ch${c}.l${i + 1}`])
      expect(new Set(lv.map((l) => l.tasks.map((t) => t.kind).join('>'))).size, `chapter ${c}`).toBe(9)
      for (const l of lv.slice(c === 2 ? 1 : 0)) { expect(l.bounds.x1 - l.bounds.x0, l.id).toBeGreaterThanOrEqual(46); expect(l.tasks[0].kind, l.id).toBe('ride'); expect(l.rides![0].vehicle, l.id).toBe(vehicle[c]) }
    }
  })
  it('every Chapter 1 level mixes tasks differently: no two levels share the same ordered list of task kinds', () => {
    const lists = Array.from({ length: 9 }, (_, i) => LEVELS[`ch1.l${i + 1}`].tasks.map((t) => t.kind).join('>'))
    expect(new Set(lists).size).toBe(9)
    for (let i = 2; i <= 9; i++) { const b = LEVELS[`ch1.l${i}`].bounds; expect(b.x1 - b.x0, `ch1.l${i} is a bigger space`).toBeGreaterThanOrEqual(28) }
  })
  it('chapter 1 finished opens chapter 2', async () => {
    const { chapterState, finishLevel } = await import('../src/levels/progress')
    let p = emptyProgress(); for (let i = 1; i <= 9; i++) p = finishLevel(p, `ch1.l${i}`, 1, null)
    expect(chapterState(p, CHAPTERS, 0)).toBe('done'); expect(chapterState(p, CHAPTERS, 1)).toBe('active')
    expect(chapterState(finishLevel(emptyProgress(), 'ch1.l1', 3, null), CHAPTERS, 1)).toBe('locked')
  })
})
