// Chapter > Level > Task. Every task carries the template fields of the spec (section 8) so no task can be built without its purpose, success,
// failure and recovery rules written down.
import type { Expression } from '../world/toon'

export type TaskKind = 'find' | 'collect' | 'choose' | 'reach' | 'goto' | 'kick'
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
export interface Item { id: string; task: number; x: number; z: number; label: string; color: string; shape: 'box' | 'bag' | 'phone' | 'keys' | 'wallet' | 'umbrella' | 'snack' | 'bank' | 'boots' | 'shinpad' | 'bib' | 'bottle' | 'ladder' | 'cones' }
export interface Rect { x0: number; x1: number; z0: number; z1: number }
export interface Furn { name: string; rect: Rect; h: number; color: string }

export interface Hazard { x: number; z0: number; z1: number; speed: number; phase: number; name: 'slippers' | 'mop' | 'dummy'; color: string }
export interface LevelDef {
  id: string
  /** which scene the renderer builds */
  sceneKind: 'home' | 'pitch'
  /** the player wears a football kit */
  kit?: boolean
  hazards: Hazard[]
  /** where the two guides stand: Mama Folake and Baba Tunde */
  npcs: { folake: { x: number; z: number; rot: number }; tunde: { x: number; z: number; rot: number } }
  /** for 'goto' tasks: the area to walk into, per task index */
  gotoAreas?: ({ x: number; z: number; r: number } | null)[]
  /** a penalty-kick task: stand on the spot, tap Kick with the needle in the green, score `goals` times */
  kick?: { x: number; z: number; goals: number; goal: { x: number; z: number } }
  /** the timed task changes with the choice made before it: its own time limit and hazards */
  variants?: Record<string, { timeLimit: number; hazards: Hazard[]; label: string }>
  /** other hopefuls standing about, drawn as characters */
  crowd?: { x: number; z: number; rot: number }[]
  /** the closing beat shown on the result screen */
  endBeat: { text: string; line: string }
  /** what the optional choice is called, for the result screen */
  choiceLabel: string
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
  /** where the soft guide ring points, per task index (an area, not the exact object) */
  guideAreas: { x: number; z: number; r: number }[]
  exitX: number
  timeLimit: number
  next: string | null
  /** how stars are earned, shown on the result screen */
  starRules: [string, string, string]
}

export const TASK_FIELDS = ['id', 'kind', 'title', 'purpose', 'objective', 'controls', 'success', 'failure', 'recovery', 'feedback', 'reward', 'persistence', 'intro', 'done', 'hint'] as const
