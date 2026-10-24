// Chapter > Level > Task. Every task carries the template fields of the spec (section 8) so no task can be built without its purpose, success,
// failure and recovery rules written down.
import type { Expression } from '../world/toon'

export type TaskKind = 'find' | 'collect' | 'choose' | 'reach' | 'goto' | 'kick' | 'hold' | 'sequence' | 'serve' | 'ride'
export type Speaker = 'folake' | 'tunde' | 'player' | 'neighbour' | 'helper'

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
  /** lines that replace `intro` depending on the choice made earlier in the level (keyed by the chosen item id) */
  introByChoice?: Record<string, Line[]>
  /** which saved flag this task's variant and choice-dependent lines read (default: this level's own choice); lets a level react to an earlier level's choice */
  flag?: string
  /** this task uses the variant (time, hazards, goal) picked by the choice before it */
  variant?: boolean
  /** extra hint shown automatically after this many wrong tries or seconds, so nobody is stuck */
  autoHintAfter?: number
}

export interface Spot { id: string; task: number; x: number; z: number; label: string; wrong?: Line; right?: boolean; icon?: string }
export interface Item { id: string; price?: number; y?: number; task: number; x: number; z: number; label: string; color: string; shape: 'box' | 'bag' | 'phone' | 'keys' | 'wallet' | 'umbrella' | 'snack' | 'bank' | 'boots' | 'shinpad' | 'bib' | 'bottle' | 'ladder' | 'cones' | 'plate' | 'cup' | 'folder' | 'paper' | 'stamp' | 'crate' | 'produce' | 'sign' | 'blanket' | 'cake' }
export interface Rect { x0: number; x1: number; z0: number; z1: number }
export interface Furn { name: string; rect: Rect; h: number; color: string }

export interface Hazard { x: number; z0: number; z1: number; speed: number; phase: number; name: 'slippers' | 'mop' | 'dummy' | 'walker' | 'cart' | 'chair'; color: string }
export interface Deco { kind: 'awning' | 'tree' | 'lamp' | 'sign' | 'stall' | 'wall' | 'window' | 'road' | 'rug' | 'crate' | 'chair' | 'rail'; x: number; z: number; w?: number; d?: number; h?: number; color?: string; label?: string }
/** a guest in a serve task: waits at (x, z), is seated at `seat`, eats from a plate on `table`, and wants the dish whose item id is `dish` */
export interface ServeGuest { id: string; name: string; order: string; dish: string; x: number; z: number; seat: { x: number; z: number }; table: { x: number; z: number } }
/** a bus ride: walk to `stop`, wait for the bus on the road at `busZ`, board, and be dropped in the task's goto area */
export interface Ride { /** default bus */ vehicle?: 'bus' | 'train'; stop: { x: number; z: number }; busZ: number; from: string; to: string }
export interface Theme { ground: string; ground2?: string; floors: (Rect & { color: string })[]; deco: Deco[]; fence?: boolean }
export interface LevelDef {
  id: string
  /** which scene the renderer builds */
  sceneKind: 'home' | 'pitch' | 'scene'
  /** for sceneKind 'scene': colours, floors and decoration */
  theme?: Theme
  /** collect tasks with a budget: how much money, how many things to buy */
  budgets?: Record<number, { budget: number; need: number }>
  /** sequence tasks: the item ids in the order they must be taken */
  sequences?: Record<number, string[]>
  /** serve tasks: seat each guest, bring them the dish they ordered, let them eat. `eatSecs` is how long a meal takes */
  serves?: Record<number, { eatSecs?: number; /** 'greet' for a market stall: customers step up to the counter instead of sitting down */ verb?: 'seat' | 'greet'; /** guests are already standing about from this task index on (before it they are not there) */ from?: number; guests: ServeGuest[] }>
  /** ride tasks: the bus journey (the destination is the task's goto area) */
  rides?: Record<number, Ride>
  /** hold tasks: stand in the area for this long */
  holds?: Record<number, { x: number; z: number; r: number; secs: number }>
  /** a badge awarded on the result screen (optional) */
  badge?: string
  /** result-screen closing beats by stars (1, 2, 3), when the ending depends on how it went */
  endBeats?: [string, string, string]
  /** the player wears a football kit */
  kit?: boolean
  hazards: Hazard[]
  /** where the two guides stand: Mama Folake and Baba Tunde */
  npcs: { folake: { x: number; z: number; rot: number }; tunde: { x: number; z: number; rot: number } }
  /** for 'goto' tasks: the area to walk into, per task index */
  gotoAreas?: ({ x: number; z: number; r: number } | null)[]
  /** a penalty-kick task: stand on the spot, tap Kick with the needle in the green, score `goals` times */
  kick?: { x: number; z: number; goals: number; goal: { x: number; z: number }; /** a pass to a teammate instead of a shot at goal: no keeper */ pass?: boolean }
  /** the timed task changes with the choice made before it: its own time limit and hazards */
  variants?: Record<string, { timeLimit: number; hazards: Hazard[]; label: string; goal?: { x: number; z: number; r: number }; /** a different ring per task index */ goals?: Record<number, { x: number; z: number; r: number }> }>
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
