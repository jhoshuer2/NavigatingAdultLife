// Chapter 1, levels 2 to 9 (spec section 5). Same engine as level 1: tasks of a few kinds in a small 3D scene. A few helpers keep the data short;
// every task still carries the full template fields (see TASK_FIELDS).
import type { LevelDef, TaskDef, TaskKind, Line, Rect, Furn, Item, Spot, Hazard, Deco, Theme } from './schema'

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
  ride: { failure: 'None. Miss the bus and the next one comes.', recovery: 'Walking to the destination works too, only slower.', feedback: 'The bus pulls up, you board and the city rolls by.', controls: 'Walk to the bus stop, wait for the bus and tap Board the bus.' },
  sequence: { failure: 'Taking things in the wrong order sends you back to the start of the list.', recovery: 'Try again; the Hint button repeats the order.', feedback: 'A counter shows how far you are; a funny line for a wrong order.', controls: 'Walk to each item and tap the action button, in the right order.' },
}

interface TOpts { purpose: string; objective: string; success: string; intro: Line[]; done: Line[]; hint: string; introByChoice?: Record<string, Line[]>; variant?: boolean; flag?: string }
export const T = (level: number | string, n: number, kind: TaskKind, title: string, o: TOpts): TaskDef => ({
  id: typeof level === 'string' ? `${level}.t${n}` : `ch1.l${level}.t${n}`, kind, title, ...DEFAULTS[kind], reward: '1 point the first time.', persistence: 'Saved when the task is done.', ...o,
})
export const say = (who: Line['who'], text: string, expr?: Line['expr']): Line => ({ who, text, expr })

export const D = (name: Hazard['name'], x: number, z0: number, z1: number, speed: number, phase: number, color = ORANGE): Hazard => ({ name, x, z0, z1, speed, phase, color })
export const NO_HAZ: { timeLimit: number; hazards: Hazard[] } = { timeLimit: 0, hazards: [] }

interface LOpts {
  /** chapter id (default 'ch1'), scene kind and kit for the other chapters */
  ch?: string; kind?: 'scene' | 'pitch'; kit?: boolean; kick?: LevelDef['kick']
  n: number; title: string; intro: string; tasks: TaskDef[]; theme: Theme; furniture: Furn[]; spawn: { x: number; z: number }; resume?: { x: number; z: number }
  spots?: Spot[]; items?: Item[]; guide: { x: number; z: number; r: number }[]; goto?: ({ x: number; z: number; r: number } | null)[]
  hazards?: Hazard[]; variants?: LevelDef['variants']; budgets?: LevelDef['budgets']; sequences?: LevelDef['sequences']; holds?: LevelDef['holds']; serves?: LevelDef['serves']; rides?: LevelDef['rides']; bounds?: Rect
  crowd?: LevelDef['crowd']; npcs: LevelDef['npcs']; endBeat: LevelDef['endBeat']; endBeats?: LevelDef['endBeats']; choiceLabel?: string; timeLimit?: number; badge?: string
  starRules?: LevelDef['starRules']; next: string | null
}
export const L = (o: LOpts): LevelDef => ({
  id: `${o.ch ?? 'ch1'}.l${o.n}`, sceneKind: o.kind ?? 'scene', kit: o.kit, kick: o.kick, chapter: o.ch ?? 'ch1', title: o.title, subtitle: `Level ${o.n}`, intro: o.intro, tasks: o.tasks, theme: o.theme,
  bounds: o.bounds ?? B, serves: o.serves, rides: o.rides, blockers: o.furniture.map((f) => f.rect), furniture: o.furniture, spawn: o.spawn, spawnAfterFirst: o.resume ?? o.spawn,
  spots: o.spots ?? [], items: o.items ?? [], guideAreas: o.guide, gotoAreas: o.goto, hazards: o.hazards ?? [], variants: o.variants, budgets: o.budgets, sequences: o.sequences, holds: o.holds,
  crowd: o.crowd, npcs: o.npcs, endBeat: o.endBeat, endBeats: o.endBeats, choiceLabel: o.choiceLabel ?? 'choice', exitX: 0, timeLimit: o.timeLimit ?? 20, next: o.next, badge: o.badge,
  starRules: o.starRules ?? ['Finish the level', 'Finish with the clock on your side', 'Finish on time with 2 mistakes or fewer'],
})

/** the stretch of town west of a level's main scene, for levels that start with a bus ride: pavement, road, shops, the stop. The bus stop is at x = -30. */
export const STREET: { floor: Rect & { color: string }; deco: Deco[] } = {
  floor: { x0: -34, x1: -12.4, z0: -6, z1: 3.2, color: '#d9cdb0' },
  deco: [{ kind: 'road', x: -23.2, z: 4.4, w: 22.4, d: 2.6 }, { kind: 'wall', x: -23.2, z: -7.6, w: 23, d: 2, h: 3.2, color: '#f3e7cf' }, { kind: 'sign', x: -30, z: 1.6, label: 'BUS STOP', w: 1.8 },
    { kind: 'tree', x: -24, z: -4.6 }, { kind: 'tree', x: -18, z: -4.8 }, { kind: 'lamp', x: -20, z: 2.2 }, { kind: 'lamp', x: -26, z: 2.2 }],
}
export const STREET_BOUNDS = R(-34, 12.4, -6, 6)
export const withStreet = (t: Theme): Theme => ({ ...t, floors: [...t.floors, STREET.floor], deco: [...t.deco, ...STREET.deco] })
const awnings = (xs: number[], z: number, colors: string[]): Deco[] => xs.map((x, i) => ({ kind: 'awning' as const, x, z, w: 3, d: 1.6, color: colors[i % colors.length] }))

// ---------------------------------------------------------------------------------------------------------------- Level 2
export const LEVEL_C1L2 = L({
  n: 2, title: 'The Journey', intro: 'The street is louder than usual. Everyone is going somewhere, and you are late for your own plan.', next: 'ch1.l3',
  theme: { ground: '#d8c9a8', floors: [], fence: false, deco: [
    { kind: 'road', x: 0, z: 0, w: 26, d: 5.2, color: '#3d3d46' }, ...awnings([-8, -2, 4, 10], -4.6, [ORANGE, GREEN, RUST, YELLOW]),
    { kind: 'wall', x: 0, z: -7.4, w: 28, d: 2, h: 4, color: '#e8c9a0' },
    { kind: 'lamp', x: -6, z: -3.2 }, { kind: 'lamp', x: 6, z: 3.2 }, { kind: 'tree', x: -10, z: -5 }, { kind: 'tree', x: 9, z: -5 },
    { kind: 'sign', x: -10.2, z: -3.6, label: 'BUS STOP', w: 2 }, { kind: 'sign', x: -4, z: -4.0, label: 'THIS WAY', w: 2 },
  ] },
  furniture: [F('bench', R(-11.4, -9.2, -4.9, -4.2), 0.6, DARK), F('kiosk', R(6, 8, -5.5, -4.5), 1.6, GREEN)],
  spawn: { x: -10.8, z: 3.8 }, resume: { x: 0, z: 0 },
  tasks: [
    T(2, 1, 'goto', 'Find the route', { purpose: 'Look around a busy street and find the right way.', objective: 'Find the route sign', success: 'You reach the route sign.',
      intro: [say('folake', 'You are late! The bus left. Walk, walk, walk. Look for the sign!', 'angry')], done: [say('player', 'This way. I think. Probably.', 'thinking')], hint: 'Follow the glowing ring to the sign on the north pavement.' }),
    T(2, 2, 'reach', 'Get through the crowd', { purpose: 'Dodge people crossing the road. Bumping is readable and recoverable.', objective: 'Get through the crowd to the ring',
      success: 'You reach the ring before the timer ends.', intro: [say('tunde', 'Mind the crowd! They will not mind you!', 'confident')], done: [say('player', 'Sorry! Sorry! Excuse me!', 'worried')], hint: 'People cross in lines. Wait for a gap, then go.' }),
    T(2, 3, 'choose', 'Pick a route', { purpose: 'A quick decision: the market shortcut is faster and harder, the main road is longer and safer. Both work.', objective: 'Pick the shortcut or the main road',
      success: 'You pick a route.', intro: [say('helper', 'Shortcut through the market? Fast. A bit chaotic. Or the long road. Your call.', 'cheeky')], done: [say('player', 'Decision made. No going back.', 'confident')], hint: 'Two signs: one on each side of the pavement.' }),
    T(2, 4, 'reach', 'Recover from the delay', { purpose: 'A short run that depends on the route you chose.', objective: 'Make up the time and reach the far end', variant: true,
      success: 'You reach the far end before the timer ends.', intro: [say('folake', 'Another delay? Run, my child, run!', 'worried')], done: [say('tunde', 'You made it. Mostly.', 'surprised')], hint: 'Cross behind what slides, then sprint.' }),
  ],
  items: [
    { id: 'shortcut', task: 2, x: 3.4, z: 3.8, label: 'Take the market shortcut', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'mainroad', task: 2, x: 3.4, z: -3.6, label: 'Take the long main road', color: GREEN, shape: 'sign', y: 0 },
  ],
  guide: [{ x: -4, z: -3.2, r: 2 }, { x: 1.5, z: 0, r: 2 }, { x: 3.4, z: 0, r: 4 }, { x: 11, z: 0, r: 1.8 }],
  goto: [{ x: -4, z: -3.2, r: 1.8 }, { x: 1.5, z: 0, r: 1.7 }, null, { x: 11, z: 0, r: 1.7 }],
  hazards: [D('walker', -3.2, -4.2, 4.2, 2.2, 0), D('walker', -0.2, -4.2, 4.2, 2.6, 1.1, GREEN), D('walker', 2.6, -4.2, 4.2, 2.0, 0.5)],
  variants: {
    shortcut: { label: 'Market shortcut', timeLimit: 13, hazards: [D('cart', 5.6, -4.2, 4.2, 3.6, 0), D('cart', 8.4, -4.2, 4.2, 4.0, 1.3, GREEN)] },
    mainroad: { label: 'Main road', timeLimit: 22, hazards: [D('walker', 5.2, -4.2, 4.2, 2.2, 0), D('walker', 7.2, -4.2, 4.2, 2.4, 1.2, GREEN), D('walker', 9.2, -4.2, 4.2, 2.0, 0.6)] },
  },
  crowd: [{ x: -8, z: 0.5, rot: 1.2 }, { x: -6.5, z: -1.2, rot: 0.9 }, { x: 10, z: 3.4, rot: -2 }],
  npcs: { folake: { x: -9.4, z: -3.2, rot: 0.6 }, tunde: { x: 9.6, z: 4.6, rot: -2.5 } }, choiceLabel: 'route',
  endBeat: { text: 'You arrive, out of breath. Then you pat your pockets. The thing you were supposed to bring is still on your bed.', line: 'Your route will matter in Level 3.' },
})

// ---------------------------------------------------------------------------------------------------------------- Level 3
const STALL_Z_N = R(0, 0, -5.2, -3.6), STALL_Z_S = R(0, 0, 3.6, 5.2)
const stallRect = (x: number, north: boolean): Rect => ({ ...(north ? STALL_Z_N : STALL_Z_S), x0: x, x1: x + 2.4 })
export const LEVEL_C1L3 = L({
  n: 3, title: "The Errand That Wasn't", intro: 'Mama has one small errand for you. It is never one small errand.', next: 'ch1.l4',
  theme: { ground: '#c9b48a', floors: [{ x0: -12.4, x1: 12.4, z0: -2.6, z1: 2.6, color: '#e6dcc4' }], deco: [
    { kind: 'stall', x: -7.8, z: -4.4, w: 2.4, d: 1.6, color: RUST, label: 'FRUIT' }, { kind: 'stall', x: -3.8, z: -4.4, w: 2.4, d: 1.6, color: GREEN, label: 'TOMATOES' },
    { kind: 'stall', x: 0.2, z: -4.4, w: 2.4, d: 1.6, color: YELLOW, label: 'CLOTH' }, { kind: 'stall', x: 4.2, z: -4.4, w: 2.4, d: 1.6, color: '#2b6ad0', label: 'FISH' },
    { kind: 'stall', x: -7.8, z: 4.4, w: 2.4, d: 1.6, color: ORANGE, label: 'ONIONS' }, { kind: 'stall', x: -3.8, z: 4.4, w: 2.4, d: 1.6, color: RUST, label: 'PEPPER' },
    { kind: 'stall', x: 0.2, z: 4.4, w: 2.4, d: 1.6, color: GREEN, label: 'RICE' }, { kind: 'stall', x: 9.4, z: -1.6, w: 2.4, d: 1.4, color: '#2f5a3a', label: 'PAY HERE' },
    { kind: 'tree', x: -11, z: -5 }, { kind: 'lamp', x: 6, z: 3 }, { kind: 'wall', x: 0, z: -7.6, w: 28, d: 2, h: 3, color: '#d9b98a' },
  ] },
  furniture: [F('s1', stallRect(-9, true), 0.9, WOOD), F('s2', stallRect(-5, true), 0.9, WOOD), F('s3', stallRect(-1, true), 0.9, WOOD), F('s4', stallRect(3, true), 0.9, WOOD),
    F('s5', stallRect(-9, false), 0.9, WOOD), F('s6', stallRect(-5, false), 0.9, WOOD), F('s7', stallRect(-1, false), 0.9, WOOD), F('pay', R(8.2, 10.6, -0.9, 0.9), 0.95, DARK)],
  spawn: { x: -11, z: 0 }, resume: { x: -2, z: 0 },
  tasks: [
    T(3, 1, 'find', 'Find the requested item', { purpose: 'Search stalls for what Mama asked: fresh tomatoes.', objective: 'Find the tomato stall', success: 'You find the tomato stall.',
      intro: [say('folake', 'Fresh tomatoes, my child. Not fruit, not cloth. TOMATOES.', 'calm')], done: [say('player', 'Tomatoes! Finally.', 'happy')], hint: 'The stalls have signs. Look for the green one that says TOMATOES.' }),
    T(3, 2, 'collect', 'Manage the budget', { purpose: 'Light budgeting: Mama gave ₦1000 and the list needs three things.', objective: 'Buy 3 things within your budget', success: 'Three things are in the basket.',
      intro: [say('folake', 'Tomatoes, onions and pepper. ₦1000 only. Do not buy the whole market.', 'suspicious')], done: [say('folake', 'Good! Your head is on today.', 'proud')], hint: 'Tomatoes ₦300, onions ₦200, pepper ₦250. Fish and rice cost too much.' }),
    T(3, 3, 'goto', 'Complete the transaction', { purpose: 'Pay and finish the purchase.', objective: 'Pay at the cashier', success: 'You reach the cashier.',
      intro: [say('tunde', 'Basket full? Pay at the counter on the right.', 'calm')], done: [say('neighbour', 'Pay here! Thank you, thank you.', 'happy')], hint: 'The green PAY HERE stall at the right end of the market.' }),
    T(3, 4, 'choose', 'Handle the unavailable item', { purpose: 'The item you wanted is out: choose a substitute or go without.', objective: 'Pick a substitute for the pepper', success: 'You pick a substitute or skip it.',
      intro: [say('neighbour', 'The pepper is finished! I have chilli flakes or curry. Or nothing.', 'worried')], done: [say('player', 'It will taste different. Different is fine.', 'calm')], hint: 'Two substitutes on the counter. Or tap Go without.' }),
  ],
  spots: [
    { id: 'fruit', task: 0, x: -7.8, z: -3.0, label: 'Check the fruit stall', wrong: say('player', 'Mangoes. Lovely. Not tomatoes.', 'thinking') },
    { id: 'tomato', task: 0, x: -3.8, z: -3.0, label: 'Check the tomato stall', right: true },
    { id: 'cloth', task: 0, x: 0.2, z: -3.0, label: 'Check the cloth stall', wrong: say('player', 'Very nice fabric. I did not come for fabric.', 'cheeky') },
    { id: 'fish', task: 0, x: 4.2, z: -3.0, label: 'Check the fish stall', wrong: say('player', 'That fish is looking at me.', 'suspicious') },
  ],
  items: [
    { id: 'tomatoes', task: 1, x: -3.2, z: -4.4, label: 'Take the tomatoes (₦300)', color: '#d62828', shape: 'produce', y: 1.05, price: 300 },
    { id: 'onions', task: 1, x: -8.2, z: 4.4, label: 'Take the onions (₦200)', color: '#a85a8a', shape: 'produce', y: 1.05, price: 200 },
    { id: 'pepper', task: 1, x: -4.2, z: 4.4, label: 'Take the pepper (₦250)', color: '#e0451f', shape: 'produce', y: 1.05, price: 250 },
    { id: 'fish', task: 1, x: 4.8, z: -4.4, label: 'Take the fish (₦600)', color: '#6a8ab8', shape: 'crate', y: 1.05, price: 600 },
    { id: 'rice', task: 1, x: 0.6, z: 4.4, label: 'Take the rice (₦800)', color: '#fbf8f0', shape: 'crate', y: 1.05, price: 800 },
    { id: 'chilli', task: 3, x: 8.8, z: 0, label: 'Take the chilli flakes', color: '#e0451f', shape: 'cup', y: 1.1 },
    { id: 'curry', task: 3, x: 10.0, z: 0, label: 'Take the curry powder', color: YELLOW, shape: 'cup', y: 1.1 },
  ],
  budgets: { 1: { budget: 1000, need: 3 } },
  guide: [{ x: -3.8, z: -1.6, r: 2 }, { x: -3.8, z: 0, r: 5 }, { x: 8.6, z: 0, r: 1.8 }, { x: 9.4, z: 0, r: 1.8 }],
  goto: [null, null, { x: 9.4, z: 2.4, r: 1.6 }, null],
  crowd: [{ x: -6, z: 0.6, rot: 1 }, { x: 2, z: -0.6, rot: -1.2 }, { x: 5.4, z: 1.2, rot: 2 }],
  npcs: { folake: { x: 11, z: 4.8, rot: -2.5 }, tunde: { x: -11, z: -4.8, rot: 0.7 } }, choiceLabel: 'substitute',
  endBeat: { text: 'Your phone rings. Mama again: "Since you are at the market, please also buy... a goat."', line: 'Another request is coming in Level 4.' },
  starRules: ['Finish the level', 'Finish with two or fewer wrong picks', 'Finish with no wrong picks or searches'],
})

// ---------------------------------------------------------------------------------------------------------------- Level 4
export const LEVEL_C1L4 = L({
  n: 4, title: 'Everybody Needs Something', intro: 'A busy square, a lot of people and everyone has "one small favour". You can not help everyone at once.', next: 'ch1.l5',
  theme: { ground: '#b8c9a0', floors: [{ x0: -10, x1: 10, z0: -4.8, z1: 4.8, color: '#e6dcc4' }], fence: false, deco: [
    { kind: 'tree', x: -11, z: -5 }, { kind: 'tree', x: -11, z: -5 }, { kind: 'tree', x: 11, z: -5.2 }, { kind: 'tree', x: 11, z: -5.2 }, { kind: 'lamp', x: -4, z: 0 }, { kind: 'lamp', x: 4, z: 0 },
    { kind: 'sign', x: 8.6, z: -4.6, label: 'BUS STOP', w: 2 }, { kind: 'sign', x: 8.6, z: 4.6, label: 'LADDER', w: 2 }, { kind: 'wall', x: 0, z: -7.6, w: 28, d: 2, h: 3, color: '#d9b98a' },
  ] },
  furniture: [F('fountain', R(-1.6, 1.6, -1.6, 1.6), 0.7, '#6a8ab8'), F('benchN', R(-6, -3, -4.6, -4.0), 0.6, DARK), F('benchS', R(3, 6, 4.0, 4.6), 0.6, DARK)],
  spawn: { x: -10.5, z: 0 }, resume: { x: -3, z: 0 },
  tasks: [
    T(4, 1, 'goto', 'Hear the requests', { purpose: 'Walk into the square and hear two short requests.', objective: 'Walk to the fountain', success: 'You reach the fountain and hear both requests.',
      intro: [say('tunde', 'Today everybody needs something. Especially from you.', 'calm')], done: [say('neighbour', 'Please carry my bags to the bus stop!', 'happy'), say('helper', 'Hold my ladder, one minute only!', 'cheeky')], hint: 'Follow the ring to the fountain in the middle.' }),
    T(4, 2, 'choose', 'Who do you help first?', { purpose: 'A real prioritisation choice. Both people can be helped; the order changes what follows.', objective: 'Pick who to help first', success: 'You pick the first request.',
      intro: [say('player', 'Bags or ladder. Bags or ladder.', 'thinking')], done: [say('folake', 'Whoever you choose, do it with a good heart.', 'calm')], hint: 'The bags are on the left, the ladder on the right.' }),
    T(4, 3, 'goto', 'Do the first request', { purpose: 'Complete the first favour by taking it where it needs to go.', objective: 'Take care of the first request', variant: true, success: 'You complete the first request.',
      intro: [say('player', 'Right. Let us do this properly.', 'confident')], done: [say('neighbour', 'Thank you, you are a lifesaver!', 'happy')], hint: 'Follow the ring: bus stop for the bags, ladder spot for the ladder.' }),
    T(4, 4, 'choose', 'Answer the second request', { purpose: 'The second request has changed because of your first choice.', objective: 'Decide how to handle the second request', success: 'You pick how to respond.',
      introByChoice: { bags: [say('helper', 'The ladder! It is wobbling! Are you coming?', 'worried')], ladder: [say('neighbour', 'My bags! My arms! Please!', 'worried')] },
      intro: [say('helper', 'Hello? Anybody?', 'curious')], done: [say('tunde', 'You can not do everything at once. Nobody can.', 'proud')], hint: 'Rush over, ask them to wait, or call a friend. All are fine.' }),
  ],
  items: [
    { id: 'bags', task: 1, x: -3.4, z: -3.2, label: "Help the neighbour with her bags", color: RUST, shape: 'crate', y: 0.5 },
    { id: 'ladder', task: 1, x: -3.4, z: 3.2, label: "Hold the helper's ladder", color: YELLOW, shape: 'ladder', y: 0.1 },
    { id: 'rush', task: 3, x: 6.6, z: -1.2, label: 'Rush over and do it quickly', color: ORANGE, shape: 'crate', y: 0.5 },
    { id: 'wait', task: 3, x: 7.8, z: 0, label: 'Ask them to wait politely', color: GREEN, shape: 'crate', y: 0.5 },
    { id: 'friend', task: 3, x: 6.6, z: 1.2, label: 'Call a friend to help', color: '#2b6ad0', shape: 'crate', y: 0.5 },
  ],
  guide: [{ x: -4, z: 0, r: 2 }, { x: -3.4, z: 0, r: 4 }, { x: 8.6, z: 0, r: 4 }, { x: 7, z: 0, r: 2.4 }],
  goto: [{ x: -4.2, z: 0, r: 1.6 }, null, { x: 8.6, z: -3.0, r: 1.5 }, null],
  variants: {
    bags: { label: 'Bags first', ...NO_HAZ, goal: { x: 8.6, z: -3.0, r: 1.5 } },
    ladder: { label: 'Ladder first', ...NO_HAZ, goal: { x: 8.6, z: 3.0, r: 1.5 } },
  },
  crowd: [{ x: -6.4, z: -2.4, rot: 0.8 }, { x: -6.4, z: 2.4, rot: -0.8 }, { x: 4, z: -2.5, rot: 2.4 }, { x: 5, z: 1.8, rot: -2.4 }, { x: 0, z: 3.4, rot: 3.1 }],
  npcs: { folake: { x: -10.5, z: -4.6, rot: 0.8 }, tunde: { x: 10.4, z: 0, rot: -1.6 } }, choiceLabel: 'response',
  endBeat: { text: 'Helping everyone at once is not always possible. You tried anyway, and somebody noticed.', line: 'Next you need to queue for food.' },
  starRules: ['Finish the level', 'Finish with two or fewer slips', 'Finish without a slip (no wrong order, no wrong places)'],
})

// ---------------------------------------------------------------------------------------------------------------- Level 5
export const LEVEL_C1L5 = L({
  n: 5, title: 'The Queue', intro: 'Three lines, one hungry crowd and a stall that serves the best jollof in the city. Patience is a skill.', next: 'ch1.l6',
  theme: { ground: '#c9b48a', floors: [{ x0: -12.4, x1: 6, z0: -5.4, z1: 5.4, color: '#e6dcc4' }, { x0: 6, x1: 12.4, z0: -4, z1: 4, color: '#d8c9a8' }], deco: [
    { kind: 'sign', x: -7, z: -4.8, label: 'PHARMACY', w: 2 }, { kind: 'sign', x: -7, z: 0, label: 'FOOD', w: 2 }, { kind: 'sign', x: -7, z: 4.8, label: 'BUS TICKETS', w: 2 },
    { kind: 'awning', x: 8.6, z: 0, w: 4.4, d: 6.4, color: ORANGE }, { kind: 'sign', x: 9, z: -3.4, label: 'JOLLOF', w: 2 }, { kind: 'tree', x: 11, z: -5 }, { kind: 'tree', x: -11, z: -5 },
    { kind: 'wall', x: 0, z: -7.6, w: 28, d: 2, h: 3, color: '#d9b98a' },
    { kind: 'chair', x: 1.4, z: -5.1, color: WOOD }, { kind: 'chair', x: 2.6, z: -5.1, color: WOOD }, { kind: 'chair', x: 2.0, z: 2.8, color: WOOD },
  ] },
  furniture: [F('counter', R(7.8, 9.6, -3, 3), 1.0, DARK), F('table1', R(1, 3, -4.6, -3.4), 0.8, WOOD), F('table2', R(1, 3, 3.4, 4.6), 0.8, WOOD)],
  spawn: { x: -11, z: 1 }, resume: { x: -3, z: 0 },
  tasks: [
    T(5, 1, 'find', 'Join the correct queue', { purpose: 'Three lines look the same. Only one serves food.', objective: 'Join the food queue', success: 'You join the right line.',
      intro: [say('tunde', 'Food, food, food. Which line is the food line? Read the signs.', 'calm')], done: [say('helper', 'Welcome to the longest line in the world.', 'cheeky')], hint: 'The sign in the middle says FOOD.' }),
    T(5, 2, 'hold', 'Wait for your turn', { purpose: 'Patience: stand in the ring until the line reaches you.', objective: 'Wait in the line', success: 'You wait for the whole count.',
      intro: [say('helper', 'I was here first. I was here for a hundred years.', 'tired')], done: [say('tunde', 'Good. Patience is also a skill.', 'proud')], hint: 'Just stand inside the glowing ring.' }),
    T(5, 3, 'serve', 'Serve the customers', { purpose: 'Help at the stall: show three hungry customers to a seat, bring each the plate they ordered and let them eat.', objective: 'Serve all three customers', success: 'All three customers are fed.',
      intro: [say('helper', 'Three hungry people! Show each one to a seat, check what they ordered, fetch it from the counter and bring it over.', 'confident')], done: [say('helper', 'Perfect! You should work here.', 'happy')], hint: 'Walk to a customer to seat them. Take their plate from the counter. Carry it to their seat.' }),
    T(5, 4, 'choose', 'Recover from a mix-up', { purpose: 'The stall mixed up the plantain: pick how to fix it.', objective: 'Fix the mix-up', success: 'You settle the mix-up.',
      intro: [say('neighbour', 'Oh no. I gave the other table your plantain. Fix this how?', 'worried')], done: [say('player', 'Honestly, jollof is still jollof.', 'happy')], hint: 'Swap, pay a little extra or share. All end well.' }),
  ],
  spots: [
    { id: 'q1', task: 0, x: -7, z: -3.4, label: 'Join this line', wrong: say('player', 'This is the pharmacy line. I am not sick, only hungry.', 'curious') },
    { id: 'q2', task: 0, x: -7, z: 1.4, label: 'Join this line', right: true },
    { id: 'q3', task: 0, x: -7, z: 3.4, label: 'Join this line', wrong: say('player', 'Bus tickets? I walked here. On purpose.', 'tired') },
  ],
  items: [
    { id: 'jollof', task: 2, x: 8.2, z: -1.6, label: 'Take the jollof', color: RUST, shape: 'plate', y: 1.1 },
    { id: 'chicken', task: 2, x: 8.2, z: -0.3, label: 'Take the chicken', color: '#a85a1f', shape: 'plate', y: 1.1 },
    { id: 'drink', task: 2, x: 8.2, z: 1.0, label: 'Take the cold drink', color: '#6a8ab8', shape: 'cup', y: 1.1 },
    { id: 'swap', task: 3, x: 6.2, z: -1.6, label: 'Swap the plates back', color: ORANGE, shape: 'plate', y: 0.5 },
    { id: 'extra', task: 3, x: 6.2, z: 0, label: 'Pay a little extra', color: GREEN, shape: 'plate', y: 0.5 },
    { id: 'share', task: 3, x: 6.2, z: 1.6, label: 'Share the plantain', color: YELLOW, shape: 'plate', y: 0.5 },
  ],
  serves: { 2: { eatSecs: 3, guests: [
    { id: 'sade', name: 'Sade', order: 'Jollof', dish: 'jollof', x: -1.2, z: -1.4, seat: { x: 1.4, z: -5.1 }, table: { x: 1.4, z: -4.1 } },
    { id: 'chidi', name: 'Chidi', order: 'Chicken', dish: 'chicken', x: -1.2, z: 0.4, seat: { x: 2.6, z: -5.1 }, table: { x: 2.6, z: -4.1 } },
    { id: 'mamaput', name: 'Mama Put', order: 'Cold drink', dish: 'drink', x: -1.2, z: 2.0, seat: { x: 2.0, z: 2.8 }, table: { x: 2.0, z: 3.9 } },
  ] } },
  holds: { 1: { x: -3.2, z: 0, r: 1.6, secs: 6 } },
  guide: [{ x: -7, z: 0, r: 5 }, { x: -3.2, z: 0, r: 1.8 }, { x: 8, z: 0, r: 3 }, { x: 6.2, z: 0, r: 2.4 }],
  crowd: [{ x: -6.8, z: -2.4, rot: -1.5 }, { x: -6.8, z: 0.4, rot: -1.5 }, { x: -5.4, z: 0.4, rot: -1.5 }, { x: -6.8, z: 2.4, rot: -1.5 }, { x: -5.4, z: -2.4, rot: -1.5 }],
  npcs: { folake: { x: 4.4, z: 4.8, rot: -2.3 }, tunde: { x: 11, z: -4.4, rot: -2 } }, choiceLabel: 'fix',
  endBeat: { text: 'You get your plate. It is still warm. For a second, nothing is going wrong.', line: 'Enjoy it. Level 6 has a deadline.' },
  starRules: ['Finish the level', 'Finish with two or fewer slips', 'Finish without a wrong order or wrong line'],
})

// ---------------------------------------------------------------------------------------------------------------- Level 6
export const LEVEL_C1L6 = L({
  n: 6, title: 'The Deadline', intro: 'An office, a boss who says "quickly" a lot, and a report that was due before you got here.', next: 'ch1.l7',
  theme: { ground: '#cfc4a8', floors: [{ x0: -11.4, x1: 11.4, z0: -5.4, z1: 5.4, color: '#b8c0b0' }], deco: [
    { kind: 'wall', x: 0, z: -6.6, w: 26, d: 1, h: 3.2, color: '#e6dcc4' }, { kind: 'window', x: -6, z: -6.1, w: 3, h: 1.2 }, { kind: 'window', x: 0, z: -6.1, w: 3, h: 1.2 }, { kind: 'window', x: 6, z: -6.1, w: 3, h: 1.2 },
    { kind: 'rug', x: 0, z: 1, w: 8, d: 4, color: '#6a8ab8' }, { kind: 'sign', x: 10.6, z: 1.2, label: 'MANAGER', w: 2 }, { kind: 'tree', x: -11, z: -5 },
  ] },
  furniture: [F('tray', R(-9.8, -6.4, -5.4, -4.4), 1.0, WOOD), F('printer', R(-2, 0, -4.8, -3.8), 1.0, '#44444e'), F('desk', R(2.5, 4.5, -4.8, -3.8), 1.0, WOOD), F('shelf', R(6.5, 8.5, -4.8, -3.8), 1.0, DARK), F('boss', R(10, 11.4, -1.6, -0.2), 1.0, DARK)],
  spawn: { x: -10.6, z: 1 }, resume: { x: -5, z: 0 },
  tasks: [
    T(6, 1, 'choose', 'Identify the urgent task', { purpose: 'Three folders, one real emergency. The folder you pick sets how tight your time is.', objective: 'Pick the urgent folder', success: 'You pick a folder.',
      intro: [say('tunde', 'Three folders. One of them is on fire. Choose.', 'confident')], done: [say('tunde', 'We shall see if that was the urgent one.', 'suspicious')], hint: 'The red folder says URGENT: client report.' }),
    T(6, 2, 'sequence', 'Gather in the right order', { purpose: 'Items must be gathered in order: print, sign, stamp.', objective: 'Print, sign, then stamp', success: 'All three steps are done in order.',
      intro: [say('tunde', 'Print it, sign it, stamp it. In that order. Not a different order.', 'angry')], done: [say('helper', 'That was neat. Almost professional.', 'happy')], hint: 'Printer first (left), then the desk, then the shelf (right).' }),
    T(6, 3, 'reach', 'Handle an interruption', { purpose: 'Colleagues keep walking through your way: reach the manager area in time.', objective: 'Get to the manager before time runs out', variant: true,
      success: 'You reach the manager area before the timer ends.', intro: [say('helper', 'Have you got a second? It is quick! Everything is quick!', 'cheeky')], done: [say('tunde', 'Good, you are here.', 'calm')], hint: 'Cross behind the chairs and walkers.' }),
    T(6, 4, 'goto', 'Deliver the result', { purpose: 'The last step: hand the work to the manager.', objective: 'Hand it to the manager', success: 'The work lands on the manager desk.',
      intro: [say('player', 'Just put it on the desk and breathe.', 'worried')], done: [say('tunde', 'Delivered. Now we find out how late it is.', 'surprised')], hint: 'The manager desk is at the right end.' }),
  ],
  items: [
    { id: 'red', task: 0, x: -9.0, z: -4.9, label: 'Take the RED folder: client report (URGENT)', color: '#d62828', shape: 'folder', y: 1.05 },
    { id: 'blue', task: 0, x: -8.1, z: -4.9, label: 'Take the BLUE folder: monthly summary', color: '#2b6ad0', shape: 'folder', y: 1.05 },
    { id: 'green', task: 0, x: -7.2, z: -4.9, label: 'Take the GREEN folder: lunch order', color: GREEN, shape: 'folder', y: 1.05 },
    { id: 'print', task: 1, x: -1.0, z: -4.3, label: 'Print it', color: '#2b6ad0', shape: 'paper', y: 1.05 },
    { id: 'sign', task: 1, x: 3.5, z: -4.3, label: 'Sign it', color: '#1c1b22', shape: 'paper', y: 1.05 },
    { id: 'stamp', task: 1, x: 7.5, z: -4.3, label: 'Stamp it', color: '#d62828', shape: 'stamp', y: 1.1 },
  ],
  sequences: { 1: ['print', 'sign', 'stamp'] },
  guide: [{ x: -8, z: -3.4, r: 2 }, { x: 0, z: -3.4, r: 6 }, { x: 8.6, z: 3, r: 2 }, { x: 10.4, z: 0.4, r: 1.5 }],
  goto: [null, null, { x: 8.6, z: 3.0, r: 1.6 }, { x: 10.4, z: 0.6, r: 1.4 }],
  hazards: [D('chair', 1.5, -3.2, 4.4, 2.4, 0, GREEN), D('walker', 4.5, -3.2, 4.4, 2.8, 1.1), D('chair', 7.0, -3.2, 4.4, 2.2, 0.6, RUST)],
  variants: {
    red: { label: 'Urgent folder', timeLimit: 24, hazards: [D('chair', 2.0, -3.2, 4.4, 2.2, 0, GREEN), D('walker', 5.4, -3.2, 4.4, 2.4, 1.1)] },
    blue: { label: 'Wrong folder', timeLimit: 18, hazards: [D('chair', 1.5, -3.2, 4.4, 2.6, 0, GREEN), D('walker', 4.5, -3.2, 4.4, 3.0, 1.1), D('chair', 7.0, -3.2, 4.4, 2.4, 0.6, RUST)] },
    green: { label: 'Lunch order', timeLimit: 15, hazards: [D('chair', 1.5, -3.2, 4.4, 2.8, 0, GREEN), D('walker', 4.5, -3.2, 4.4, 3.2, 1.1), D('chair', 7.0, -3.2, 4.4, 2.6, 0.6, RUST)] },
  },
  crowd: [{ x: -6, z: 3.4, rot: 0.3 }, { x: 0, z: 4.6, rot: 3.1 }, { x: 9, z: -3.2, rot: -2 }],
  npcs: { folake: { x: -10.8, z: -3.6, rot: 0.7 }, tunde: { x: 10.8, z: 1.9, rot: -2 } }, choiceLabel: 'folder',
  endBeat: { text: 'The deadline passes. Somehow nobody screams.', line: 'See what the manager says.' },
  endBeats: ['It was late. Very late. But it arrived, and in this office that counts as a miracle.', 'You narrowly missed it. The manager sighs, then smiles.', 'Right on time. Someone applauds. Slowly. Suspiciously.'],
  starRules: ['Finish the level', 'Reach the manager before the timer ends', 'Be on time with 2 mistakes or fewer'],
})

// ---------------------------------------------------------------------------------------------------------------- Level 7
export const LEVEL_C1L7 = L({
  n: 7, title: 'The Unexpected Guest', intro: 'A knock on the door. A suitcase. A very confident "Surprise!". Your quiet evening has other plans.', next: 'ch1.l8',
  theme: { ground: '#c9a074', floors: [{ x0: -11.4, x1: 11.4, z0: -5.4, z1: 5.4, color: '#d8b98a' }, { x0: 4.4, x1: 11.4, z0: -5.4, z1: -1, color: '#e6dcc4' }], deco: [
    { kind: 'wall', x: 0, z: -6.6, w: 26, d: 1, h: 3, color: '#f3e7cf' }, { kind: 'window', x: -4, z: -6.1, w: 3, h: 1.2 }, { kind: 'window', x: 3, z: -6.1, w: 3, h: 1.2 },
    { kind: 'rug', x: -1, z: 1.6, w: 5, d: 3, color: GREEN }, { kind: 'sign', x: -11, z: 0, label: 'DOOR', w: 1.6 }, { kind: 'tree', x: 11, z: -4.8 },
  ] },
  furniture: [F('sofa', R(-2.6, 1, -5.4, -4.2), 0.8, GREEN), F('table', R(-2, 0.6, 0.6, 2.4), 0.7, WOOD), F('counter', R(5, 9, -5.4, -4.4), 1.0, DARK), F('shelf', R(9.6, 11.4, 1.5, 3.5), 1.4, DARK)],
  spawn: { x: -9.5, z: 2.5 }, resume: { x: -3, z: 0 },
  tasks: [
    T(7, 1, 'find', "Identify the visitor's request", { purpose: 'Read the clues the visitor left around: what do they need?', objective: 'Find out what your guest needs', success: 'You work out the request.',
      intro: [say('neighbour', 'Surprise! I will explain later. Just... look around.', 'cheeky')], done: [say('player', 'A suitcase. They need somewhere to stay.', 'surprised')], hint: 'Check the suitcase by the door and the other clues.' }),
    T(7, 2, 'choose', 'Choose your response', { purpose: 'No style is correct: helpful, direct or humorous.', objective: 'Pick how you answer', success: 'You pick a response.',
      intro: [say('tunde', 'Choose your words carefully. Or not carefully. It is your flat.', 'cheeky')], done: [say('neighbour', 'Oh! Interesting answer.', 'curious')], hint: 'Three styles on the table: helpful, direct or funny.' }),
    T(7, 3, 'collect', 'Prepare what is needed', { purpose: 'Get the things a guest needs: tea, a blanket and a snack.', objective: 'Get tea, a blanket and a snack', success: 'Everything is ready.',
      introByChoice: { helpful: [say('player', 'Tea, blanket, snack. Let us make you comfortable.', 'happy')], direct: [say('player', 'Tea, blanket, snack. Tonight only, okay?', 'calm')], funny: [say('player', 'One luxury hotel, coming up! Tea, blanket, snack.', 'laughing')] },
      intro: [say('player', 'Tea, blanket, snack.', 'thinking')], done: [say('neighbour', 'You are too kind. Or too polite.', 'happy')], hint: 'Tea on the counter, blanket on the sofa, snack on the shelf.' }),
    T(7, 4, 'choose', 'Resolve the misunderstanding', { purpose: 'It turns out the guest had the wrong flat: settle it kindly.', objective: 'Settle the misunderstanding', success: 'You settle it.',
      intro: [say('neighbour', 'Wait. Is this number 12? I was looking for number 21.', 'worried')], done: [say('tunde', 'Every flat has a surprise.', 'proud')], hint: 'Explain, laugh it off or offer to walk them there.' }),
  ],
  spots: [
    { id: 'suitcase', task: 0, x: -9.2, z: -2.4, label: 'Look at the suitcase', right: true },
    { id: 'charger', task: 0, x: -5.4, z: 4.2, label: 'Look at the phone charger', wrong: say('player', 'A charger. Everybody needs a charger. That is not it.', 'thinking') },
    { id: 'map', task: 0, x: 3, z: 3.8, label: 'Look at the map', wrong: say('player', 'A map with a circle. The circle does not help.', 'suspicious') },
  ],
  items: [
    { id: 'helpful', task: 1, x: -0.9, z: -0.2, label: 'Say: "Come in, stay as long as you like"', color: GREEN, shape: 'sign', y: 0 },
    { id: 'direct', task: 1, x: 1.2, z: 3.4, label: 'Say: "Tonight only, I am busy"', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'funny', task: 1, x: -3.2, z: 3.4, label: 'Say: "Suitcase or your whole house?"', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'tea', task: 2, x: 6.4, z: -4.9, label: 'Take the tea', color: RUST, shape: 'cup', y: 1.1 },
    { id: 'blanket', task: 2, x: -1.2, z: -4.8, label: 'Take the blanket', color: '#6a8ab8', shape: 'blanket', y: 0.95 },
    { id: 'snack', task: 2, x: 10.5, z: 2.5, label: 'Take the snack', color: YELLOW, shape: 'plate', y: 1.5 },
    { id: 'explain', task: 3, x: 6.6, z: 0.2, label: 'Explain calmly', color: GREEN, shape: 'sign', y: 0 },
    { id: 'laugh', task: 3, x: 8.2, z: 0.2, label: 'Laugh it off', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'walk', task: 3, x: 9.8, z: 0.2, label: 'Offer to walk them there', color: ORANGE, shape: 'sign', y: 0 },
  ],
  guide: [{ x: -8, z: -1, r: 3 }, { x: 0, z: 2, r: 4 }, { x: 5, z: -1, r: 6 }, { x: 8, z: 0.2, r: 2.4 }],
  crowd: [{ x: -8.6, z: -0.6, rot: 1.5 }],
  npcs: { folake: { x: 3, z: 4.8, rot: -2.4 }, tunde: { x: 11, z: -4.6, rot: -2.2 } }, choiceLabel: 'answer',
  endBeat: { text: 'The guest leaves, waving. The tea was very good. Nobody ever finds out whose idea this was.', line: 'One last complication is on its way.' },
  starRules: ['Finish the level', 'Take your time: this level has no timer', 'Finish with two or fewer wrong guesses'],
})

// ---------------------------------------------------------------------------------------------------------------- Level 8
export const LEVEL_C1L8 = L({
  n: 8, title: 'The Final Complication', intro: 'Bus stop, market, home street. Something you needed is missing, and every place in between wants a piece of your time.', next: 'ch1.l9',
  theme: { ground: '#d8c9a8', floors: [{ x0: -12.4, x1: -4, z0: -5.4, z1: 5.4, color: '#c8c0b0' }, { x0: -4, x1: 4, z0: -5.4, z1: 5.4, color: '#e6dcc4' }, { x0: 4, x1: 12.4, z0: -5.4, z1: 5.4, color: '#d8b98a' }], deco: [
    { kind: 'sign', x: -10.6, z: -4, label: 'BUS STOP', w: 2 }, { kind: 'sign', x: -0.2, z: -5.4, label: 'MARKET', w: 2 }, { kind: 'sign', x: 8.6, z: -4.4, label: 'HOME', w: 2 },
    { kind: 'awning', x: -2, z: 4.4, w: 3, d: 1.6, color: GREEN }, { kind: 'awning', x: 2, z: -4.4, w: 3, d: 1.6, color: RUST }, { kind: 'wall', x: 8.4, z: -7.2, w: 8, d: 2, h: 3.4, color: '#f0d9a8' },
    { kind: 'tree', x: 11, z: -4.6 }, { kind: 'lamp', x: 5, z: 3 },
  ] },
  furniture: [F('benchA', R(-11.4, -9.2, -4.9, -4.2), 0.6, DARK), F('bin', R(-7.4, -6.6, 3.8, 4.6), 1.0, '#44444e'), F('stallA', R(-3.4, -0.6, 3.6, 4.8), 0.9, WOOD), F('stallB', R(0.6, 3.4, -4.8, -3.6), 0.9, WOOD), F('table', R(8.2, 10.6, -1.4, 0.2), 0.9, WOOD)],
  spawn: { x: -11, z: 1.6 }, resume: { x: -3, z: 0 },
  tasks: [
    T(8, 1, 'find', 'Retrieve the missing item', { purpose: 'Something important was left behind: search the likely places.', objective: 'Find the missing parcel', success: 'You find the parcel.',
      intro: [say('folake', 'The parcel! Where is the parcel?! I gave it to you!', 'angry')], done: [say('player', 'Under the bus seat. Naturally.', 'tired')], hint: 'Try the bench, the bin, the stall and the bus seat.' }),
    T(8, 2, 'reach', 'Navigate the obstacle', { purpose: 'Get through traffic carrying the parcel.', objective: 'Reach the market ring in time', success: 'You reach the ring before the timer ends.',
      intro: [say('tunde', 'Carts! People! Parcel! Keep it level!', 'worried')], done: [say('player', 'Still in one piece. Parcel too.', 'happy')], hint: 'Cross behind the carts.' }),
    T(8, 3, 'choose', 'Make the final trade-off', { purpose: 'Deliver now or go home first. Both are fair and both cost something.', objective: 'Deliver first or go home first', success: 'You pick the order.',
      intro: [say('helper', 'Deliver the parcel first? Or go home first? One of them is the wrong one. Maybe.', 'cheeky')], done: [say('player', 'Decision made. Probably.', 'worried')], hint: 'Two signs: delivery on one side, home on the other.' }),
    T(8, 4, 'sequence', 'Complete the recovery task', { purpose: 'Repack the bag in the right order and finish the recovery.', objective: 'Repack keys, wallet, then parcel', success: 'The bag is packed correctly.',
      introByChoice: { deliver: [say('folake', 'Delivered. Now repack the bag: keys, wallet, parcel.', 'calm')], home: [say('folake', 'You are home. Repack the bag: keys, wallet, parcel.', 'calm')] },
      intro: [say('folake', 'Repack the bag: keys, wallet, parcel.', 'calm')], done: [say('folake', 'There. Everything where it should be.', 'proud')], hint: 'Order: keys, wallet, parcel.' }),
  ],
  spots: [
    { id: 'benchA', task: 0, x: -10.2, z: -3.4, label: 'Check the bench', wrong: say('player', 'Someone left half a sandwich. Not the parcel.', 'disappointed') },
    { id: 'bin', task: 0, x: -7, z: 2.6, label: 'Check the bin', wrong: say('player', 'I will never speak of this again.', 'tired') },
    { id: 'stallA', task: 0, x: -2, z: 2.6, label: 'Check the stall', wrong: say('player', 'The seller says no parcels here. Only bananas.', 'curious') },
    { id: 'seat', task: 0, x: -10.6, z: 3.8, label: 'Check the bus seat', right: true },
  ],
  items: [
    { id: 'deliver', task: 2, x: 2, z: -2.6, label: 'Deliver the parcel first', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'home', task: 2, x: 2, z: 2.6, label: 'Go home first', color: GREEN, shape: 'sign', y: 0 },
    { id: 'keys', task: 3, x: 8.8, z: -0.6, label: 'Pack the keys', color: YELLOW, shape: 'keys', y: 1.4 },
    { id: 'wallet', task: 3, x: 9.4, z: -0.6, label: 'Pack the wallet', color: DARK, shape: 'wallet', y: 1.0 },
    { id: 'parcel', task: 3, x: 10.0, z: -0.6, label: 'Pack the parcel', color: ORANGE, shape: 'crate', y: 1.1 },
  ],
  sequences: { 3: ['keys', 'wallet', 'parcel'] },
  guide: [{ x: -9, z: 2, r: 4 }, { x: 0.5, z: 0, r: 2 }, { x: 2, z: 0, r: 4 }, { x: 9.4, z: 1, r: 3 }],
  goto: [null, { x: 0.5, z: 0, r: 1.7 }, null, null],
  hazards: [D('cart', -7.2, -4.4, 3.2, 2.6, 0), D('walker', -4.2, -4.4, 3.2, 2.4, 1.2), D('cart', -1.6, -4.4, 3.2, 2.8, 0.7, GREEN)],
  crowd: [{ x: -5.4, z: 3.8, rot: 0.5 }, { x: 5.4, z: 2.2, rot: -1 }],
  npcs: { folake: { x: 11, z: 3.6, rot: -2.4 }, tunde: { x: -3.6, z: -4.8, rot: 0.5 } }, choiceLabel: 'trade-off',
  endBeat: { text: 'The bag is packed. The parcel is safe. For the first time all day, you hear silence.', line: 'Level 9 waits.' },
  starRules: ['Finish the level', 'Reach the market ring before the timer ends', 'Be on time with 2 mistakes or fewer'],
})

// ---------------------------------------------------------------------------------------------------------------- Level 9
export const LEVEL_C1L9 = L({
  n: 9, title: 'Somehow, You Made It', intro: 'Everyone who was in your day is at the same party. Somehow, it all comes together.', next: null, badge: 'Somehow, You Made It',
  theme: { ground: '#7aa05a', floors: [{ x0: -10.4, x1: 10.4, z0: -5, z1: 5, color: '#e6dcc4' }], deco: [
    { kind: 'awning', x: -5, z: -5.6, w: 4, d: 1.8, color: ORANGE }, { kind: 'awning', x: 6, z: -5.6, w: 4, d: 1.8, color: GREEN }, { kind: 'sign', x: 9.8, z: -3.6, label: 'CONGRATS', w: 2.4 },
    { kind: 'tree', x: -11.4, z: -5.4 }, { kind: 'tree', x: -11.4, z: -5.4 }, { kind: 'tree', x: 11.4, z: -5.4 }, { kind: 'lamp', x: -3, z: 5 }, { kind: 'lamp', x: 3, z: 5 }, { kind: 'rug', x: 2, z: 1, w: 7, d: 4, color: YELLOW }, { kind: 'crate', x: 10, z: 0, w: 3.4, d: 5.2, h: 0.3, color: '#a87a50' },
    { kind: 'wall', x: 0, z: -7.8, w: 28, d: 2, h: 3, color: '#d9b98a' },
  ] },
  furniture: [F('buffet', R(3.8, 6.4, -4.8, -3.6), 0.95, WOOD)],
  spawn: { x: -10.8, z: 0 }, resume: { x: -5, z: 0 },
  tasks: [
    T(9, 1, 'goto', 'Review the final objective', { purpose: 'Remember what the day was for and where you are going.', objective: 'Meet everyone by the garden entrance', success: 'You reach the group.',
      intro: [say('folake', 'Come, come! We have been waiting for you.', 'happy')], done: [say('neighbour', 'You did everything. Even the goat?', 'curious'), say('player', 'No goat. We do not talk about the goat.', 'cheeky')], hint: 'Follow the ring to the group at the entrance.' }),
    T(9, 2, 'reach', 'Cross the dance floor', { purpose: 'The first of two familiar challenges: get across a busy dance floor.', objective: 'Cross the dance floor to the ring', success: 'You reach the ring before the timer ends.',
      intro: [say('tunde', 'Dancers! Do not step on anyone. Do not step on yourself.', 'cheeky')], done: [say('helper', 'Smooth moves!', 'proud')], hint: 'Cross behind the dancers.' }),
    T(9, 3, 'sequence', 'Set the table', { purpose: 'The second familiar challenge: set the table in the right order.', objective: 'Set the plate, then the cake, then the drinks', success: 'The table is set.',
      intro: [say('folake', 'Plate first, then the cake, then the drinks. In that order, my child.', 'calm')], done: [say('folake', 'Beautiful. Just beautiful.', 'proud')], hint: 'Order: plate, cake, drinks.' }),
    T(9, 4, 'choose', 'Make the final decision', { purpose: 'The day ends with your choice: how do you close it?', objective: 'Choose how to end the day', success: 'You make your choice.',
      intro: [say('tunde', 'Final choice. A speech, a dance or a quiet thank you. They all work.', 'calm')], done: [say('player', 'Okay. Here we go.', 'confident')], hint: 'Three options on the stage steps.' }),
    T(9, 5, 'goto', 'Finish the day', { purpose: 'Walk onto the stage and close the day.', objective: 'Walk onto the stage', success: 'You stand on the stage.',
      intro: [say('folake', 'Go up. Everyone is waiting.', 'happy')], done: [say('tunde', 'Somehow, you made it.', 'proud')], hint: 'The stage is on the right.' }),
  ],
  items: [
    { id: 'plate', task: 2, x: 4.3, z: -4.2, label: 'Set the plate', color: '#fbf8f0', shape: 'plate', y: 1.0 },
    { id: 'cake', task: 2, x: 5.1, z: -4.2, label: 'Set the cake', color: RUST, shape: 'cake', y: 1.0 },
    { id: 'drinks', task: 2, x: 5.9, z: -4.2, label: 'Set the drinks', color: '#6a8ab8', shape: 'cup', y: 1.0 },
    { id: 'speech', task: 3, x: 7.2, z: -1.4, label: 'Give a speech', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'dance', task: 3, x: 7.2, z: 0.2, label: 'Dance with everyone', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'thanks', task: 3, x: 7.2, z: 1.8, label: 'Say a quiet thank you', color: GREEN, shape: 'sign', y: 0 },
  ],
  sequences: { 2: ['plate', 'cake', 'drinks'] },
  guide: [{ x: -5, z: 0, r: 2.4 }, { x: 0, z: 0, r: 2 }, { x: 5, z: -3, r: 3 }, { x: 7, z: 0, r: 2.4 }, { x: 10, z: 0, r: 1.8 }],
  goto: [{ x: -5, z: 0, r: 1.8 }, { x: 1.5, z: 0, r: 1.7 }, null, null, { x: 10, z: 0, r: 1.5 }],
  hazards: [D('walker', -2.4, -4.4, 4.4, 2.4, 0), D('walker', -0.2, -4.4, 4.4, 2.8, 1.2, GREEN), D('walker', 1.6, -4.4, 4.4, 2.2, 0.6)],
  crowd: [{ x: -6.4, z: -1.6, rot: 1.5 }, { x: -6.4, z: 1.6, rot: 1.5 }, { x: -7.4, z: 0, rot: 1.5 }, { x: 7, z: 3.8, rot: -2.4 }, { x: 8, z: -3.8, rot: -0.8 }, { x: 3, z: 3.8, rot: 3 }, { x: 0.5, z: 3.2, rot: 3.1 }],
  npcs: { folake: { x: -7.4, z: -3.2, rot: 1.2 }, tunde: { x: 10, z: -3.4, rot: -2 } }, choiceLabel: 'closing',
  endBeat: { text: 'Mama Folake shouts "That is my child!" and starts a speech. Nobody can stop her. Somehow, it is perfect.', line: 'Chapter 1 is done.' },
  starRules: ['Finish the level', 'Cross the dance floor before the timer ends', 'Be on time with 2 mistakes or fewer'],
})
