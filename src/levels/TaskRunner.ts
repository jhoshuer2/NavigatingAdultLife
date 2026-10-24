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
  choice: string | null = null
  timeLeft: number
  seconds = 0
  finished = false
  private pointsThisRun = 0
  /** set after a wrong-try nudge so the phone starts to buzz */
  buzzing = false

  constructor(public level: LevelDef, progress: ChapterProgress, private h: RunnerHooks, startTask = 0) {
    this.progress = progress
    this.idx = Math.min(startTask, level.tasks.length - 1)
    this.timeLeft = level.timeLimit
    this.begin()
  }

  get task() { return this.level.tasks[this.idx] }
  get flagKey() { return `${this.level.id}.item` }

  private begin() {
    this.wrong = 0; this.found = false; this.collected = []; this.buzzing = false
    if (this.task.kind === 'reach') this.timeLeft = this.level.timeLimit
    this.h.taskStarted(this.idx)
    for (const l of this.task.intro) this.h.say(l)
    this.h.changed()
  }

  /** the player pressed the action button on a spot or item */
  interact(id: string): void {
    if (this.finished) return
    const t = this.task
    if (t.kind === 'find') {
      const s = this.level.spots.find((x) => x.id === id && x.task === this.idx)
      if (!s || this.found) return
      if (s.right) { this.found = true; this.h.sfx?.('ring'); this.complete() }
      else { this.wrong++; this.mistakes++; if (s.wrong) this.h.say(s.wrong); this.h.sfx?.('nope'); if (this.wrong >= HINT_AFTER_WRONG) this.buzzing = true; this.h.changed() }
    } else if (t.kind === 'collect') {
      const it = this.level.items.find((x) => x.id === id && x.task === this.idx)
      if (!it || this.collected.includes(id)) return
      this.collected.push(id); this.h.sfx?.('pick'); this.h.toast(`${it.label.replace('Take ', 'Got ')}`)
      if (this.collected.length === this.level.items.filter((x) => x.task === this.idx).length) this.complete(); else this.h.changed()
    } else if (t.kind === 'choose') {
      const it = id === 'none' ? null : this.level.items.find((x) => x.id === id && x.task === this.idx)
      if (id !== 'none' && !it) return
      this.choice = id === 'none' ? null : id
      this.progress = setFlag(this.progress, this.flagKey, this.choice ?? 'none')
      this.h.sfx?.('pick'); this.complete()
    }
  }

  /** called every frame with the player position */
  update(dt: number, px: number, _pz: number): void {
    if (this.finished) return
    this.seconds += dt
    if (this.task.kind === 'reach') {
      const before = this.timeLeft
      this.timeLeft = Math.max(0, this.timeLeft - dt)
      if (before > 0 && this.timeLeft === 0) { this.h.taskFailed(this.idx, 'timer'); this.h.toast('Late! Keep going, the door is still there'); this.h.changed() }
      if (px >= this.level.exitX) this.complete()
    }
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
    this.h.levelDone({ levelId: this.level.id, stars, seconds: Math.round(this.seconds), mistakes: this.mistakes, hints: this.hints, item: this.choice, points: this.pointsThisRun })
    this.h.changed()
  }
}
