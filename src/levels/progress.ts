// Chapter progress: pure functions over the saved profile. The one rule that matters: a task gives its point the first time it is completed, never again.
import type { MetaProfile } from '@platform/meta'

export type CharacterId = 'zuri' | 'navi'

export interface ChapterProgress {
  character: CharacterId | null
  /** level the player is on, and the task index inside it, saved at every task so a closed tab resumes in the right place */
  level: string
  task: number
  /** ids of tasks completed at least once (this is what stops points being awarded twice) */
  completed: string[]
  points: number
  coins: number
  stars: Record<string, number>
  /** choices that later levels read, e.g. { 'ch1.l1.item': 'umbrella' } */
  flags: Record<string, string>
  /** The Rush, played alone or against Alfred */
  rush: { best: number; plays: number; wins: number; points: number; secs?: number }
}

export const emptyProgress = (): ChapterProgress => ({
  character: null, level: 'ch1.l1', task: 0, completed: [], points: 0, coins: 0, stars: {}, flags: {},
  rush: { best: 0, plays: 0, wins: 0, points: 0 },
})

export const progressOf = (m: MetaProfile): ChapterProgress => ({ ...emptyProgress(), ...(m.chapter ?? {}), rush: { ...emptyProgress().rush, ...(m.chapter?.rush ?? {}) } })

export function withProgress(m: MetaProfile, p: ChapterProgress): MetaProfile { return { ...m, chapter: p } }

/** Marks a task complete. Awards 1 point only if this task was never completed before. */
export function completeTask(p: ChapterProgress, taskId: string, nextTask: number): { progress: ChapterProgress; awarded: boolean } {
  const first = !p.completed.includes(taskId)
  return { awarded: first, progress: { ...p, task: nextTask, completed: first ? [...p.completed, taskId] : p.completed, points: p.points + (first ? 1 : 0) } }
}

/** Records the stars of a finished level (the best is kept) and pays coins for improvement only. */
export function finishLevel(p: ChapterProgress, levelId: string, stars: number, nextLevel: string | null): ChapterProgress {
  const before = p.stars[levelId] ?? 0
  const better = Math.max(before, stars)
  return { ...p, stars: { ...p.stars, [levelId]: better }, coins: p.coins + 10 * (better - before), level: nextLevel ?? p.level, task: 0 }
}

export const setFlag = (p: ChapterProgress, k: string, v: string): ChapterProgress => ({ ...p, flags: { ...p.flags, [k]: v } })

/** The Rush gives 1 point the first time a personal best is passed in a run of at least 100 m, and 1 for the first win against Alfred. */
export function recordRush(p: ChapterProgress, r: { distance: number; won?: boolean }): { progress: ChapterProgress; points: number } {
  const best = Math.max(p.rush.best, r.distance)
  const pts = (r.distance > p.rush.best && r.distance >= 100 ? 1 : 0) + (r.won && p.rush.wins === 0 ? 1 : 0)
  return { points: pts, progress: { ...p, points: p.points + pts, rush: { best, plays: p.rush.plays + 1, wins: p.rush.wins + (r.won ? 1 : 0), points: p.rush.points + pts } } }
}

export type ChapterStatus = 'active' | 'locked' | 'done'
/** A chapter is done when every one of its levels has stars. Chapter 1 is always open; any other opens when the chapter before it is done. */
export function chapterState(p: ChapterProgress, chapters: { id: string; levels: string[]; totalLevels: number }[], index: number, unlockAll = false): ChapterStatus {
  const done = (i: number) => { const c = chapters[i]; return c.levels.length >= c.totalLevels && c.levels.every((l) => (p.stars[l] ?? 0) > 0) }
  if (done(index)) return 'done'
  if (unlockAll || index === 0 || done(index - 1)) return 'active'
  return 'locked'
}
