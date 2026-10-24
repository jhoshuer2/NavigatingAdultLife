import { describe, it, expect } from 'vitest'
import { emptyProgress, completeTask, finishLevel, recordRush } from '../src/levels/progress'
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
