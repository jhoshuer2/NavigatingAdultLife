// Runs one level's tasks. Pure logic (no Three.js, no React) so it can be tested: it owns what has been found, collected and chosen, the timer,
// mistakes and hints, awards the first-completion point through progress.ts and tells the scene and HUD what happened through callbacks.
import { completeTask, finishLevel, setFlag, type ChapterProgress } from './progress'
import type { LevelDef, Line } from './schema'

export interface LevelResult { levelId: string; stars: number; seconds: number; mistakes: number; hints: number; item: string | null; points: number }

export interface RunnerHooks {
  say: (l: Line) => void
  toast: (text: string) => void
  taskStarted: (idx: number) => void
  taskDone: (idx: number, awarded: boolean) => void
  taskFailed: (idx: number, reason: string) => void
  levelDone: (r: LevelResult) => void
  save: (p: ChapterProgress) => void
  changed: () => void
  sfx?: (n: string) => void
}

export const STUMBLE_PENALTY = 3
export const HINT_AFTER_WRONG = 2

export class TaskRunner {
  idx: number
  progress: ChapterProgress
  wrong = 0
  mistakes = 0
  hints = 0
  found = false
  collected: string[] = []
  /** the choice made in the current choose task (cleared when a task starts), and the last one made in the level (for the result screen) */
  choice: string | null = null
  picked: string | null = null
  timeLeft: number
  seconds = 0
  finished = false
  private pointsThisRun = 0
  /** set after a wrong-try nudge so the phone starts to buzz */
  buzzing = false
  /** seconds since the player last made progress in this task; after 15 the scene shows a soft guide ring */
  sinceProgress = 0
  get guideOn() { return this.sinceProgress > 15 && !this.finished && this.task.kind !== 'reach' && this.task.kind !== 'goto' && this.task.kind !== 'kick' && this.task.kind !== 'hold' }
  /** penalty task: goals so far, and how wide the green zone is (a few misses widen it a little so nobody is stuck) */
  goals = 0
  misses = 0
  get kickBand() { return 0.16 + 0.03 * Math.min(5, this.misses) }
  /** what the timed task uses: the variant picked in the choice before it, or the level's own */
  get variant() { if (!this.task.variant) return undefined; const c = this.progress.flags[this.flagKey]; return c ? this.level.variants?.[c] : undefined }
  /** the area a walk-to or run-to task ends in (a variant can move it) */
  get goalArea() { return this.variant?.goal ?? this.level.gotoAreas?.[this.idx] ?? null }
  /** shopping: money spent so far, held-for seconds, position in a sequence */
  spent = 0
  holdT = 0
  seqPos = 0
  get budgetLeft() { const b = this.level.budgets?.[this.idx]; return b ? b.budget - this.spent : null }
  get holdNeed() { return this.level.holds?.[this.idx]?.secs ?? 0 }
  get hazards() { return this.variant?.hazards ?? this.level.hazards }
  get timeLimit() { return this.variant?.timeLimit ?? this.level.timeLimit }

  constructor(public level: LevelDef, progress: ChapterProgress, private h: RunnerHooks, startTask = 0) {
    this.progress = progress
    this.idx = Math.min(startTask, level.tasks.length - 1)
    this.timeLeft = level.timeLimit
    this.begin()
  }

  get task() { return this.level.tasks[this.idx] }
  get flagKey() { return `${this.level.id}.item` }

  private begin() {
    this.sinceProgress = 0
    this.wrong = 0; this.found = false; this.collected = []; this.buzzing = false; this.choice = null; this.goals = 0; this.misses = 0; this.spent = 0; this.holdT = 0; this.seqPos = 0
    if (this.task.kind === 'reach') this.timeLeft = this.timeLimit
    this.h.taskStarted(this.idx)
    const flag = this.progress.flags[this.flagKey]
    for (const l of (flag && this.task.introByChoice?.[flag]) || this.task.intro) this.h.say(l)
    this.h.changed()
  }

  /** the player pressed the action button on a spot or item */
  interact(id: string): void {
    if (this.finished) return
    this.sinceProgress = 0
    const t = this.task
    if (t.kind === 'find') {
      const s = this.level.spots.find((x) => x.id === id && x.task === this.idx)
      if (!s || this.found) return
      if (s.right) { this.found = true; this.h.sfx?.('ring'); this.complete() }
      else { this.wrong++; this.mistakes++; if (s.wrong) this.h.say(s.wrong); this.h.sfx?.('nope'); if (this.wrong >= HINT_AFTER_WRONG) this.buzzing = true; this.h.changed() }
    } else if (t.kind === 'collect') {
      if (id === 'reset' && this.level.budgets?.[this.idx]) { this.collected = []; this.spent = 0; this.h.sfx?.('nope'); this.h.toast('Basket emptied. Start again'); this.h.changed(); return } // never unwinnable: put everything back
      const it = this.level.items.find((x) => x.id === id && x.task === this.idx)
      if (!it || this.collected.includes(id)) return
      const bud = this.level.budgets?.[this.idx]
      if (bud && it.price !== undefined && this.spent + it.price > bud.budget) { this.mistakes++; this.h.sfx?.('nope'); this.h.toast(`Too expensive! ₦${bud.budget - this.spent} left. You can start over`); this.h.changed(); return }
      if (bud && it.price !== undefined) this.spent += it.price
      this.collected.push(id); this.h.sfx?.('pick'); this.h.toast(`${it.label.replace(/^Take /, 'Got ').replace(/ \(₦\d+\)$/, '')}`)
      if (this.collected.length === (bud?.need ?? this.level.items.filter((x) => x.task === this.idx).length)) this.complete(); else this.h.changed()
    } else if (t.kind === 'sequence') {
      const order = this.level.sequences?.[this.idx] ?? []
      if (!order.includes(id) || this.collected.includes(id)) return
      if (order[this.seqPos] === id) {
        this.seqPos++; this.collected.push(id); this.h.sfx?.('pick'); this.h.toast(`${this.seqPos}/${order.length}`)
        if (this.seqPos >= order.length) this.complete(); else this.h.changed()
      } else { this.mistakes++; this.seqPos = 0; this.collected = []; this.h.sfx?.('nope'); this.h.toast('Wrong order! Start again'); this.h.changed() }
    } else if (t.kind === 'choose') {
      const it = id === 'none' ? null : this.level.items.find((x) => x.id === id && x.task === this.idx)
      if (id !== 'none' && !it) return
      this.choice = id === 'none' ? null : id; this.picked = this.choice
      this.progress = setFlag(this.progress, this.flagKey, this.choice ?? 'none')
      this.h.sfx?.('pick'); this.complete()
    }
  }

  /** called every frame with the player position */
  update(dt: number, px: number, _pz: number): void {
    if (this.finished) return
    this.seconds += dt; this.sinceProgress += dt
    if (this.task.kind === 'reach') {
      const before = this.timeLeft
      this.timeLeft = Math.max(0, this.timeLeft - dt)
      if (before > 0 && this.timeLeft === 0) { this.h.taskFailed(this.idx, 'timer'); this.h.toast('Late! Keep going, the door is still there'); this.h.changed() }
      const area = this.goalArea
      if (area ? Math.hypot(px - area.x, _pz - area.z) < area.r : px >= this.level.exitX) this.complete()
    } else if (this.task.kind === 'goto') {
      const g = this.goalArea
      if (g && Math.hypot(px - g.x, _pz - g.z) < g.r) this.complete()
    } else if (this.task.kind === 'hold') {
      const h = this.level.holds?.[this.idx]
      if (h) {
        const inside = Math.hypot(px - h.x, _pz - h.z) < h.r
        this.holdT = inside ? this.holdT + dt : Math.max(0, this.holdT - dt * 2)
        if (this.holdT >= h.secs) this.complete()
      }
    }
  }

  /** the result of one penalty: the scene has played the shot, now the rule is applied */
  kickResult(success: boolean): void {
    if (this.finished || this.task.kind !== 'kick') return
    this.sinceProgress = 0
    const need = this.level.kick?.goals ?? 3
    if (success) {
      this.goals++; this.h.sfx?.('pick'); this.h.toast(`GOAL! ${this.goals}/${need}`)
      if (this.goals >= need) { this.complete(); return }
    } else {
      this.misses++; this.mistakes++; this.h.sfx?.('nope'); this.h.toast('Wide! Try again')
    }
    this.h.changed()
  }

  /** tripping over something: costs seconds, never the level */
  stumble(): void {
    if (this.task.kind !== 'reach' || this.finished) return
    this.mistakes++; this.timeLeft = Math.max(0, this.timeLeft - STUMBLE_PENALTY)
    this.h.taskFailed(this.idx, 'stumble'); this.h.sfx?.('bump'); this.h.changed()
  }

  /** the Hint button: always free, always says the next action */
  hint(): string { this.hints++; return this.task.hint }

  private complete(): void {
    const t = this.task
    const { progress, awarded } = completeTask(this.progress, t.id, Math.min(this.idx + 1, this.level.tasks.length))
    this.progress = progress
    if (awarded) this.pointsThisRun++
    this.h.save(this.progress)
    this.h.taskDone(this.idx, awarded)
    for (const l of t.done) this.h.say(l)
    if (this.idx >= this.level.tasks.length - 1) { this.end(); return }
    this.idx++
    this.begin()
  }

  stars(): number {
    const onTime = this.timeLeft > 0
    return 1 + (onTime ? 1 : 0) + (onTime && this.mistakes <= 2 ? 1 : 0)
  }

  private end(): void {
    this.finished = true
    const stars = this.stars()
    this.progress = finishLevel(this.progress, this.level.id, stars, this.level.next)
    this.h.save(this.progress)
    this.h.levelDone({ levelId: this.level.id, stars, seconds: Math.round(this.seconds), mistakes: this.mistakes, hints: this.hints, item: this.picked, points: this.pointsThisRun })
    this.h.changed()
  }
}
