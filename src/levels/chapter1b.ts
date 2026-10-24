// Chapter 1, levels 2 to 9 (spec section 5). Same engine as level 1: tasks of a few kinds in a small 3D scene. A few helpers keep the data short;
// every task still carries the full template fields (see TASK_FIELDS).
import type { LevelDef, TaskDef, TaskKind, Line, Rect, Furn, Item, Spot, Hazard, Theme } from './schema'

export const R = (x0: number, x1: number, z0: number, z1: number): Rect => ({ x0, x1, z0, z1 })
export const F = (name: string, rect: Rect, h: number, color: string): Furn => ({ name, rect, h, color })
const B = R(-12.4, 12.4, -6, 6)
export const WOOD = '#a87a50', DARK = '#6b3a1e', GREEN = '#2f5a3a', ORANGE = '#e07a1f', YELLOW = '#f5b91c', RUST = '#c4562a'

const DEFAULTS: Record<TaskKind, { failure: string; recovery: string; feedback: string; controls: string }> = {
  goto: { failure: 'None.', recovery: 'A ring on the ground marks the place.', feedback: 'The ring pulses and the guide reacts when you arrive.', controls: 'Move with the stick, arrow keys or by tapping the ground.' },
  find: { failure: 'None. Wrong places only get a funny reaction.', recovery: 'After two wrong tries a hint appears on its own.', feedback: 'Each wrong place has its own line; the right one is obvious.', controls: 'Walk close and tap the action button.' },
  collect: { failure: 'None.', recovery: 'The counter on screen shows what is still missing.', feedback: 'Each pickup pops and the counter goes up.', controls: 'Walk close to an item and tap the action button.' },
  choose: { failure: 'None. Every option is fair.', recovery: 'You can always go without.', feedback: 'The pick goes in your bag and the others stay.', controls: 'Walk to an option and tap it, or tap Go without.' },
  reach: { failure: 'Clipping something costs 3 seconds.', recovery: 'A quick get-up, then you keep going. The level never restarts.', feedback: 'A timer on screen and a bump sound when you clip something.', controls: 'Move with the stick, arrow keys or by tapping the ground.' },
  kick: { failure: 'None.', recovery: 'Misses widen the target a little.', feedback: 'The ball flies.', controls: 'Tap Kick when the needle is in the green.' },
  hold: { failure: 'None. Stepping out only slows the progress.', recovery: 'Step back into the ring and the count carries on.', feedback: 'A seconds counter fills while you wait.', controls: 'Stand inside the ring.' },
  serve: { failure: 'A wrong plate is politely sent back; nothing is lost.', recovery: 'Each guest shows what they ordered above their head, and the Hint button says the next step.', feedback: 'Guests sit, the plate lands on the table and they eat; a counter shows how many are fed.', controls: 'Walk to a guest to seat them, take their dish from the counter, then bring it to them.' },
  talk: { failure: 'None. Every answer is a fair answer.', recovery: 'The Hint button says who is left to talk to.', feedback: 'People wave when they have something to say; a counter shows how many you have spoken to.', controls: 'Walk up to a person and tap Talk, then pick an answer if you are offered one.' },
  ride: { failure: 'None. Miss the bus and the next one comes.', recovery: 'Walking to the destination works too, only slower.', feedback: 'The bus pulls up, you board and the city rolls by.', controls: 'Walk to the bus stop, wait for the bus and tap Board the bus.' },
  sequence: { failure: 'Taking things in the wrong order sends you back to the start of the list.', recovery: 'Try again; the Hint button repeats the order.', feedback: 'A counter shows how far you are; a funny line for a wrong order.', controls: 'Walk to each item and tap the action button, in the right order.' },
}

interface TOpts { purpose: string; objective: string; success: string; intro: Line[]; done: Line[]; hint: string; introByChoice?: Record<string, Line[]>; variant?: boolean; flag?: string }
export const T = (level: number | string, n: number, kind: TaskKind, title: string, o: TOpts): TaskDef => ({
  id: typeof level === 'string' ? `${level}.t${n}` : `ch1.l${level}.t${n}`, kind, title, ...DEFAULTS[kind], reward: '1 point the first time.', persistence: 'Saved when the task is done.', ...o,
})
export const say = (who: Line['who'], text: string, expr?: Line['expr']): Line => ({ who, text, expr })
/** a named person: the dialogue box shows their name */
export const sayAs = (name: string, who: Line['who'], text: string, expr?: Line['expr']): Line => ({ who, text, expr, name })

export const D = (name: Hazard['name'], x: number, z0: number, z1: number, speed: number, phase: number, color = ORANGE): Hazard => ({ name, x, z0, z1, speed, phase, color })
export const NO_HAZ: { timeLimit: number; hazards: Hazard[] } = { timeLimit: 0, hazards: [] }

interface LOpts {
  /** chapter id (default 'ch1'), scene kind and kit for the other chapters */
  ch?: string; kind?: 'scene' | 'pitch'; kit?: boolean; kick?: LevelDef['kick']
  n: number; title: string; intro: string; tasks: TaskDef[]; theme: Theme; furniture: Furn[]; spawn: { x: number; z: number }; resume?: { x: number; z: number }
  spots?: Spot[]; items?: Item[]; guide: { x: number; z: number; r: number }[]; goto?: ({ x: number; z: number; r: number } | null)[]
  hazards?: Hazard[]; variants?: LevelDef['variants']; budgets?: LevelDef['budgets']; sequences?: LevelDef['sequences']; holds?: LevelDef['holds']; serves?: LevelDef['serves']; talks?: LevelDef['talks']; rides?: LevelDef['rides']; bounds?: Rect
  crowd?: LevelDef['crowd']; npcs: LevelDef['npcs']; endBeat: LevelDef['endBeat']; endBeats?: LevelDef['endBeats']; choiceLabel?: string; timeLimit?: number; badge?: string
  starRules?: LevelDef['starRules']; next: string | null
}
export const L = (o: LOpts): LevelDef => ({
  id: `${o.ch ?? 'ch1'}.l${o.n}`, sceneKind: o.kind ?? 'scene', kit: o.kit, kick: o.kick, chapter: o.ch ?? 'ch1', title: o.title, subtitle: `Level ${o.n}`, intro: o.intro, tasks: o.tasks, theme: o.theme,
  bounds: o.bounds ?? B, serves: o.serves, talks: o.talks, rides: o.rides, blockers: o.furniture.map((f) => f.rect), furniture: o.furniture, spawn: o.spawn, spawnAfterFirst: o.resume ?? o.spawn,
  spots: o.spots ?? [], items: o.items ?? [], guideAreas: o.guide, gotoAreas: o.goto, hazards: o.hazards ?? [], variants: o.variants, budgets: o.budgets, sequences: o.sequences, holds: o.holds,
  crowd: o.crowd, npcs: o.npcs, endBeat: o.endBeat, endBeats: o.endBeats, choiceLabel: o.choiceLabel ?? 'choice', exitX: 0, timeLimit: o.timeLimit ?? 20, next: o.next, badge: o.badge,
  starRules: o.starRules ?? ['Finish the level', 'Finish with the clock on your side', 'Finish on time with 2 mistakes or fewer'],
})

export { STREET, STREET_BOUNDS, withStreet } from './street'
