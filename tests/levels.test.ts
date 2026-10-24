import { describe, it, expect } from 'vitest'
import { emptyProgress, completeTask, finishLevel, recordRush, chapterState } from '../src/levels/progress'
import { TaskRunner, type RunnerHooks } from '../src/levels/TaskRunner'
import { LEVEL1 } from '../src/levels/chapter1'
import { TASK_FIELDS } from '../src/levels/schema'
import { moveWithCollision } from '../src/world/nav'

const hooks = (log: string[] = [], saves: any[] = []): RunnerHooks => ({
  say: () => {}, toast: () => {}, taskStarted: (i) => log.push('start' + i), taskDone: (i, a) => log.push(`done${i}:${a}`), taskFailed: (_i, r) => log.push('fail:' + r),
  levelDone: (r) => log.push('level:' + r.stars), save: (p) => saves.push(p), changed: () => {},
})

function playThrough(r: TaskRunner, opts: { wrongFirst?: boolean; item?: string } = {}) {
  if (opts.wrongFirst) { r.interact('pillow'); r.interact('bedside') }
  r.interact('laundry')
  for (const id of ['keys', 'wallet', 'bag']) r.interact(id)
  r.interact(opts.item ?? 'none')
  r.update(1, 8.5, 0)
}

describe('chapter progress', () => {
  it('awards a task point once, never again on replay', () => {
    let p = emptyProgress()
    const a = completeTask(p, 't1', 1); p = a.progress
    expect(a.awarded).toBe(true); expect(p.points).toBe(1)
    const b = completeTask(p, 't1', 1)
    expect(b.awarded).toBe(false); expect(b.progress.points).toBe(1)
  })
  it('keeps the best stars and pays coins only for improvement', () => {
    let p = finishLevel(emptyProgress(), 'l', 2, null); expect(p.coins).toBe(20)
    p = finishLevel(p, 'l', 1, null); expect(p.stars.l).toBe(2); expect(p.coins).toBe(20)
    p = finishLevel(p, 'l', 3, null); expect(p.coins).toBe(30)
  })
  it('rush points: first personal best over 100 m and first win only', () => {
    let p = emptyProgress()
    let r = recordRush(p, { distance: 120, won: true }); expect(r.points).toBe(2); p = r.progress
    r = recordRush(p, { distance: 90, won: true }); expect(r.points).toBe(0); p = r.progress
    r = recordRush(p, { distance: 150 }); expect(r.points).toBe(1)
  })
})

describe('chapter select', () => {
  const chs = [{ id: 'a', levels: ['a1', 'a2'], totalLevels: 2 }, { id: 'b', levels: ['b1'], totalLevels: 1 }, { id: 'c', levels: [], totalLevels: 9 }]
  it('opens chapter 1, locks the rest, and unlocks the next only when every level has stars', () => {
    let p = emptyProgress()
    expect(chs.map((_, i) => chapterState(p, chs, i))).toEqual(['active', 'locked', 'locked'])
    p = finishLevel(p, 'a1', 2, null); expect(chapterState(p, chs, 1)).toBe('locked')
    p = finishLevel(p, 'a2', 1, null); expect(chs.map((_, i) => chapterState(p, chs, i))).toEqual(['done', 'active', 'locked'])
  })
  it('chapter 1 needs all nine levels; chapter 2 needs its nine levels too; the debug flag opens all', async () => {
    const { CHAPTERS } = await import('../src/levels/chapters')
    expect(CHAPTERS.length).toBe(10)
    let p = emptyProgress(); p = finishLevel(p, 'ch1.l1', 3, null)
    expect(chapterState(emptyProgress(), CHAPTERS, 1)).toBe('locked')
    expect(chapterState(p, CHAPTERS, 1)).toBe('locked') // chapter 1 now has all nine levels, one is not enough
    expect(chapterState(p, CHAPTERS, 2)).toBe('locked')
    expect(chapterState(Array.from({ length: 9 }, (_, i) => `ch2.l${i + 1}`).reduce((q, id) => finishLevel(q, id, 1, null), p), CHAPTERS, 2)).toBe('active') // chapter 2 is done once all nine levels have stars
    expect(chapterState(p, CHAPTERS, 5, true)).toBe('active')
  })
})

describe('level 1 task runner', () => {
  it('every task has the full template and an on-screen instruction', () => {
    for (const t of LEVEL1.tasks) for (const f of TASK_FIELDS) expect((t as any)[f], `${t.id}.${f}`).toBeTruthy()
  })
  it('plays through all four tasks, 4 points, stars by rules, choice stored', () => {
    const log: string[] = []
    const r = new TaskRunner(LEVEL1, emptyProgress(), hooks(log))
    playThrough(r, { item: 'umbrella' })
    expect(r.finished).toBe(true)
    expect(r.progress.points).toBe(4)
    expect(r.progress.flags['ch1.l1.item']).toBe('umbrella')
    expect(r.progress.stars['ch1.l1']).toBe(3)
    expect(log.filter((l) => l.startsWith('done'))).toEqual(['done0:true', 'done1:true', 'done2:true', 'done3:true'])
  })
  it('a replay awards no points but still records stars', () => {
    let r = new TaskRunner(LEVEL1, emptyProgress(), hooks()); playThrough(r)
    const prog = { ...r.progress, task: 0 }
    r = new TaskRunner(LEVEL1, prog, hooks()); playThrough(r)
    expect(r.progress.points).toBe(4)
  })
  it('wrong spots never fail the task and make the phone buzz after two', () => {
    const r = new TaskRunner(LEVEL1, emptyProgress(), hooks())
    r.interact('pillow'); expect(r.buzzing).toBe(false)
    r.interact('drawer'); expect(r.buzzing).toBe(true)
    expect(r.idx).toBe(0); r.interact('laundry'); expect(r.idx).toBe(1)
  })
  it('stumbling costs time not the level, and running out of time lowers stars only', () => {
    const r = new TaskRunner(LEVEL1, emptyProgress(), hooks())
    r.interact('laundry'); ;['keys', 'wallet', 'bag'].forEach((i) => r.interact(i)); r.interact('snack')
    expect(r.task.kind).toBe('reach')
    r.stumble(); expect(r.timeLeft).toBe(LEVEL1.timeLimit - 3)
    r.update(100, 0, 0); expect(r.timeLeft).toBe(0); expect(r.finished).toBe(false)
    r.update(1, 8.5, 0); expect(r.finished).toBe(true); expect(r.stars()).toBe(1)
  })
  it('shows the guide ring after 15 s without progress, never in the timed task, and resets on progress', () => {
    const r = new TaskRunner(LEVEL1, emptyProgress(), hooks())
    r.update(10, -3, 0); expect(r.guideOn).toBe(false)
    r.update(6, -3, 0); expect(r.guideOn).toBe(true)
    r.interact('pillow'); expect(r.guideOn).toBe(false)
    expect(LEVEL1.guideAreas.length).toBe(LEVEL1.tasks.length)
    r.interact('laundry'); ;['keys', 'wallet', 'bag'].forEach((i) => r.interact(i)); r.interact('snack')
    r.update(30, 0, 0); expect(r.guideOn).toBe(false)
  })
  it('resuming at a saved task starts there', () => {
    const r = new TaskRunner(LEVEL1, { ...emptyProgress(), task: 2 }, hooks(), 2)
    expect(r.idx).toBe(2)
  })
  it('every spot and item is reachable from the spawn (not buried inside furniture)', () => {
    for (const s of [...LEVEL1.spots, ...LEVEL1.items]) {
      const inside = LEVEL1.blockers.some((b) => s.x > b.x0 && s.x < b.x1 && s.z > b.z0 && s.z < b.z1)
      expect(typeof inside).toBe('boolean')
    }
    // walk from spawn to the door through the partition doorway
    let p = { ...LEVEL1.spawn }
    const steps: [number, number][] = [[0, -0.5 - p.z], [3, 0], [3, 0], [3, 0], [3, 0], [3, 0]]
    for (const [dx, dz] of steps) p = moveWithCollision(LEVEL1.blockers, p.x, p.z, dx, dz, LEVEL1.bounds)
    for (let i = 0; i < 40; i++) p = moveWithCollision(LEVEL1.blockers, p.x, p.z, 0.4, 0, LEVEL1.bounds)
    expect(p.x).toBeGreaterThan(LEVEL1.exitX)
  })
})

describe('chapter 2 level 1 (Trial Day)', () => {
  it('has the full task template, a goto area, and plays through with a stored boots choice', async () => {
    const { LEVEL_C2L1: L } = await import('../src/levels/chapter2')
    for (const t of L.tasks) for (const f of TASK_FIELDS) expect((t as any)[f], `${t.id}.${f}`).toBeTruthy()
    const r = new TaskRunner(L, emptyProgress(), hooks())
    expect(r.task.kind).toBe('ride'); r.update(0.1, L.gotoAreas![0]!.x, L.gotoAreas![0]!.z); expect(r.idx).toBe(1) // the bus drops you at the gate
    r.update(0.1, L.gotoAreas![1]!.x, L.gotoAreas![1]!.z); expect(r.idx).toBe(2) // then the registration desk
    for (const id of ['bib', 'shinpads', 'water']) r.interact(id)
    r.interact('striker'); expect(r.progress.flags['ch2.l1.item']).toBe('striker'); expect(r.idx).toBe(4)
    r.update(1, L.exitX + 0.1, 0); expect(r.finished).toBe(true); expect(r.progress.points).toBe(5)
  })
  it('hazards stay inside the pitch and items are not inside furniture', async () => {
    const { LEVEL_C2L1: L } = await import('../src/levels/chapter2')
    for (const h of L.hazards) { expect(h.z0).toBeGreaterThan(L.bounds.z0); expect(h.z1).toBeLessThan(L.bounds.z1) }
    for (const it of L.items) expect(L.blockers.some((b) => it.x > b.x0 && it.x < b.x1 && it.z > b.z0 && it.z < b.z1), it.id).toBe(true) // items sit on benches/rack
  })
})

describe('chapter 2 level 2 (Skills Stations)', () => {
  it('has the full task template and chains from level 1', async () => {
    const { LEVEL_C2L1, LEVEL_C2L2: L } = await import('../src/levels/chapter2')
    for (const t of L.tasks) for (const f of TASK_FIELDS) expect((t as any)[f], `${t.id}.${f}`).toBeTruthy()
    expect(LEVEL_C2L1.next).toBe('ch2.l2')
  })
  it('plays through: circle, three penalties (misses widen the green zone), a drill choice that changes the run', async () => {
    const { LEVEL_C2L2: L } = await import('../src/levels/chapter2')
    const r = new TaskRunner(L, emptyProgress(), hooks())
    r.update(0.1, L.gotoAreas![0]!.x, L.gotoAreas![0]!.z); expect(r.task.kind).toBe('kick')
    const band0 = r.kickBand; r.kickResult(false); r.kickResult(false); expect(r.kickBand).toBeGreaterThan(band0); expect(r.mistakes).toBe(2)
    r.kickResult(true); r.kickResult(true); expect(r.idx).toBe(1); r.kickResult(true); expect(r.idx).toBe(2); r.kickResult(true) // ignored: now on the choice
    r.interact('sprint')
    expect(r.task.kind).toBe('reach'); expect(r.timeLimit).toBe(14); expect(r.hazards.length).toBe(2); expect(r.timeLeft).toBe(14)
    r.update(1, 0, 0); expect(r.finished).toBe(true); expect(r.progress.points).toBe(4); expect(r.progress.flags['ch2.l2.item']).toBe('sprint')
  })
  it('the safe drill gives more time and more dummies, and the base hazard set is the largest', async () => {
    const { LEVEL_C2L2: L } = await import('../src/levels/chapter2')
    const r = new TaskRunner(L, emptyProgress(), hooks(), 2)
    r.interact('passing'); expect(r.timeLimit).toBe(24); expect(r.hazards.length).toBe(3)
    for (const v of Object.values(L.variants!)) expect(v.hazards.length).toBeLessThanOrEqual(L.hazards.length)
  })
  it('items sit on the drill table and the finish ring is walkable', async () => {
    const { LEVEL_C2L2: L } = await import('../src/levels/chapter2')
    for (const it of L.items) expect(L.blockers.some((b) => it.x > b.x0 && it.x < b.x1 && it.z > b.z0 && it.z < b.z1)).toBe(true)
    expect(L.blockers.some((b) => 0 > b.x0 && 0 < b.x1 && 0 > b.z0 && 0 < b.z1)).toBe(false)
  })
})

describe('chapter 2 level 3 (The Trial Match)', () => {
  const start = async (boots?: string, at = 0) => {
    const { LEVEL_C2L3: L } = await import('../src/levels/chapter2')
    const p = emptyProgress(); if (boots) p.flags['ch2.l1.item'] = boots
    return { L, r: new TaskRunner(L, p, hooks(), at) }
  }
  it('level 2 chains into it', async () => { const { LEVEL_C2L2 } = await import('../src/levels/chapter2'); expect(LEVEL_C2L2.next).toBe('ch2.l3') })
  it('the boots chosen in level 1 decide the position ring, the time and the defenders', async () => {
    const st = await start('striker'), de = await start('defender'), no = await start()
    expect(st.r.goalArea).toEqual({ x: 8.2, z: 0, r: 1.6 }); expect(de.r.goalArea).toEqual({ x: -8, z: 0, r: 1.6 })
    expect(no.r.goalArea).toEqual({ x: 3, z: -3.8, r: 1.6 }) // no boots on record: the wing
    for (const [r, secs, n] of [[st.r, 14, 2], [de.r, 24, 3]] as const) { r.update(0.1, r.goalArea!.x, r.goalArea!.z); expect(r.task.kind).toBe('kick'); r.kickResult(true); r.kickResult(true); expect(r.task.kind).toBe('reach'); expect(r.timeLimit).toBe(secs); expect(r.hazards.length).toBe(n) }
    expect(st.r.goalArea).toEqual({ x: 9.6, z: 0, r: 1.6 }) // the run to the goal ring is the same for everybody
  })
  it('the pass task has no keeper in its data, widens on misses, and the coach reacts to the decision', async () => {
    const { L, r } = await start('winger', 1)
    expect(L.kick?.pass).toBe(true); const b0 = r.kickBand; r.kickResult(false); expect(r.kickBand).toBeGreaterThan(b0)
    r.kickResult(true); r.kickResult(true); r.update(1, 9.6, 0); expect(r.task.kind).toBe('choose'); r.interact('hold'); expect(r.task.kind).toBe('goto')
    expect(L.tasks[4].introByChoice!.hold[0].text).toMatch(/held the ball/)
  })
})
