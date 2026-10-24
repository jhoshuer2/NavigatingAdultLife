// Chapter > Level > Task. Every task carries the template fields of the spec (section 8) so no task can be built without its purpose, success,
// failure and recovery rules written down.
import type { Expression } from '../world/toon'

export type TaskKind = 'find' | 'collect' | 'choose' | 'reach'
export type Speaker = 'folake' | 'tunde' | 'player'

export interface Line { who: Speaker; text: string; expr?: Expression }

export interface TaskDef {
  id: string
  kind: TaskKind
  title: string
  /** why the task exists (what the player learns or feels) */
  purpose: string
  /** the single instruction line shown on screen */
  objective: string
  controls: string
  success: string
  failure: string
  recovery: string
  feedback: string
  reward: string
  persistence: string
  intro: Line[]
  done: Line[]
  /** a gentle nudge, shown by the Hint button (no penalty) */
  hint: string
  /** extra hint shown automatically after this many wrong tries or seconds, so nobody is stuck */
  autoHintAfter?: number
}

export interface Spot { id: string; task: number; x: number; z: number; label: string; wrong?: Line; right?: boolean; icon?: string }
export interface Item { id: string; task: number; x: number; z: number; label: string; color: string; shape: 'box' | 'bag' | 'phone' | 'keys' | 'wallet' | 'umbrella' | 'snack' | 'bank' }
export interface Rect { x0: number; x1: number; z0: number; z1: number }
export interface Furn { name: string; rect: Rect; h: number; color: string }

export interface LevelDef {
  id: string
  chapter: string
  title: string
  subtitle: string
  intro: string
  tasks: TaskDef[]
  /** the level's own scene data */
  bounds: Rect
  blockers: Rect[]
  furniture: Furn[]
  spawn: { x: number; z: number }
  spawnAfterFirst: { x: number; z: number }
  spots: Spot[]
  items: Item[]
  exitX: number
  timeLimit: number
  next: string | null
  /** how stars are earned, shown on the result screen */
  starRules: [string, string, string]
}

export const TASK_FIELDS = ['id', 'kind', 'title', 'purpose', 'objective', 'controls', 'success', 'failure', 'recovery', 'feedback', 'reward', 'persistence', 'intro', 'done', 'hint'] as const
