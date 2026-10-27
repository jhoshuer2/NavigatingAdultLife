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
  rush: { best: number; plays: number; wins: number; points: number; secs?: number
    /** wins against Alfred ai, races against real players, wins in them, and the best place seen on the Global board (0 = never ranked) */
    alfredWins?: number; livePlays?: number; liveWins?: number; bestRank?: number }
}

export const emptyProgress = (): ChapterProgress => ({
  character: null, level: 'ch1.l1', task: 0, completed: [], points: 0, coins: 0, stars: {}, flags: {},
  rush: { best: 0, plays: 0, wins: 0, points: 0 },
})

export const progressOf = (m: MetaProfile): ChapterProgress => {
  const rush = { ...emptyProgress().rush, ...(m.chapter?.rush ?? {}) }
  // live races are newer than the win counter: every win saved before them was against Alfred ai
  return { ...emptyProgress(), ...(m.chapter ?? {}), rush: { ...rush, alfredWins: rush.alfredWins ?? rush.wins, livePlays: rush.livePlays ?? 0, liveWins: rush.liveWins ?? 0, bestRank: rush.bestRank ?? 0 } }
}

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
export function recordRush(p: ChapterProgress, r: { distance: number; won?: boolean; mode?: 'solo' | 'alfred' | 'live' }): { progress: ChapterProgress; points: number } {
  const best = Math.max(p.rush.best, r.distance)
  const pts = (r.distance > p.rush.best && r.distance >= 100 ? 1 : 0) + (r.won && p.rush.wins === 0 ? 1 : 0)
  const mode = r.mode ?? (r.won ? 'alfred' : 'solo')
  const win = r.won ? 1 : 0
  return { points: pts, progress: { ...p, points: p.points + pts, rush: {
    ...p.rush, best, plays: p.rush.plays + 1, wins: p.rush.wins + win, points: p.rush.points + pts,
    alfredWins: (p.rush.alfredWins ?? p.rush.wins) + (mode === 'alfred' ? win : 0),
    livePlays: (p.rush.livePlays ?? 0) + (mode === 'live' ? 1 : 0), liveWins: (p.rush.liveWins ?? 0) + (mode === 'live' ? win : 0),
  } } }
}

/** Remember the best place seen on the Global board (lower is better; it only ever improves). */
export const withRank = (p: ChapterProgress, rank: number): ChapterProgress => (rank > 0 && (!p.rush.bestRank || rank < p.rush.bestRank) ? { ...p, rush: { ...p.rush, bestRank: rank } } : p)

export type ChapterStatus = 'active' | 'locked' | 'done'
/** A chapter is done when every one of its levels has stars. Chapter 1 is always open; any other opens when the chapter before it is done. */
export function chapterState(p: ChapterProgress, chapters: { id: string; levels: string[]; totalLevels: number; prototype?: boolean }[], index: number, unlockAll = false): ChapterStatus {
  const done = (i: number) => { const c = chapters[i]; return (c.levels.length >= c.totalLevels || (c.prototype === true && c.levels.length > 0)) && c.levels.every((l) => (p.stars[l] ?? 0) > 0) }
  if (done(index)) return 'done'
  if (unlockAll || index === 0 || done(index - 1)) return 'active'
  return 'locked'
}
