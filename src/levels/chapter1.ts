// Chapter 1, "The Unexpected Day". Only Level 1 exists so far (the spec asks to test it with first-time players before building the rest).
import type { LevelDef, TaskDef, Rect, Furn } from './schema'

const R = (x0: number, x1: number, z0: number, z1: number): Rect => ({ x0, x1, z0, z1 })


/** Furniture drawn in the scene and used as collision. h is the height in metres. */
const FURNITURE: Furn[] = [
  { name: 'bed', rect: R(-9, -6.2, -4.6, -1.4), h: 0.7, color: '#c4562a' },
  { name: 'bedside', rect: R(-6.2, -5.2, -4.6, -3.6), h: 0.6, color: '#6b3a1e' },
  { name: 'drawers', rect: R(-9, -7.2, 3.4, 5), h: 1.1, color: '#8a5a36' },
  { name: 'desk', rect: R(-4, -1.8, -5, -3.9), h: 0.9, color: '#a87a50' },
  { name: 'laundry', rect: R(-5, -3.4, 2.8, 4.4), h: 0.55, color: '#8aa58a' },
  { name: 'shelf', rect: R(6.4, 8.2, -5, -4.2), h: 1.4, color: '#6b3a1e' },
  { name: 'sofa', rect: R(3.2, 6.4, -5, -3.6), h: 0.8, color: '#2f5a3a' },
  { name: 'dining', rect: R(3.5, 6, 1.6, 3.2), h: 0.85, color: '#a87a50' },
  { name: 'table', rect: R(0.4, 2.4, 4, 5), h: 0.8, color: '#6b3a1e' },
]

const tasks: TaskDef[] = [
  {
    id: 'ch1.l1.t1', kind: 'find', title: 'Find the phone', purpose: 'Teach walking, looking and tapping Interact, with a laugh and no pressure.',
    objective: 'Find your phone', controls: 'Move with the stick or arrow keys. Tap Look when a spot lights up.',
    success: 'The phone is found.', failure: 'None. Wrong spots only get a funny reaction.', recovery: 'After two wrong tries the phone buzzes so you can follow the sound.',
    feedback: 'Every wrong spot has its own line; the right one rings.', reward: '1 point the first time.', persistence: 'Saved when the phone is found.',
    intro: [{ who: 'folake', text: 'Wake up! Baba Tunde is already outside and your phone is not picking!', expr: 'angry' }],
    done: [{ who: 'folake', text: 'Ehen! Now move, move, move.', expr: 'happy' }],
    hint: 'Check the places things hide: the bed, the drawer, the laundry.', autoHintAfter: 2,
  },
  {
    id: 'ch1.l1.t2', kind: 'collect', title: 'Pack the essentials', purpose: 'Show pickups: three things you cannot leave without.',
    objective: 'Get your keys, wallet and bag', controls: 'Walk close to an item and tap Take.',
    success: 'Keys, wallet and bag are all with you.', failure: 'None.', recovery: 'The counter on screen shows what is still missing.',
    feedback: 'Each pickup pops and the counter goes up.', reward: '1 point the first time.', persistence: 'Saved when the last item is taken.',
    intro: [{ who: 'player', text: 'Keys, wallet, bag. Where did I drop them last night?', expr: 'thinking' }],
    done: [{ who: 'folake', text: 'Good. Do not forget your head too!', expr: 'cheeky' }],
    hint: 'Keys are on the shelf by the door, the wallet is on the dining table, the bag is on the sofa.',
  },
  {
    id: 'ch1.l1.t3', kind: 'choose', title: 'Choose what to take', purpose: 'A small choice that is remembered. Level 2 will react to it.',
    objective: 'Take one extra thing, or go without', controls: 'Walk to the table and tap one item, or tap Go without.',
    success: 'You pick one item or decide to travel light.', failure: 'None.', recovery: 'You can always go without.',
    feedback: 'The item goes in your bag and the others stay.', reward: '1 point the first time.', persistence: 'The choice is saved as a flag for later levels.',
    intro: [{ who: 'folake', text: 'Take something small. The day has its own plans.', expr: 'calm' }],
    done: [{ who: 'player', text: 'Okay. Time check!', expr: 'worried' }],
    hint: 'The umbrella, the snack and the power bank are on the little table.',
  },
  {
    id: 'ch1.l1.t4', kind: 'reach', title: 'Leave on time', purpose: 'A short run through the home with things in the way.',
    objective: 'Get to the front door before time runs out', controls: 'Move with the stick or arrow keys.',
    success: 'You reach the door before the timer ends.', failure: 'Stumbling over the household chaos costs 3 seconds.', recovery: 'A quick get-up animation, then you keep going. The level never restarts.',
    feedback: 'A timer on screen and a bump sound when you trip.', reward: '1 point the first time.', persistence: 'Saved when you reach the door.',
    intro: [{ who: 'tunde', text: 'Oya! The day will not wait for you!', expr: 'confident' }],
    done: [{ who: 'tunde', text: 'Finally. But look at the street...', expr: 'surprised' }],
    hint: 'The slippers and the mop slide across. Cross behind them.',
  },
]

export const LEVEL1: LevelDef = {
  id: 'ch1.l1', chapter: 'ch1', title: 'The Morning Disaster', subtitle: 'Level 1',
  intro: 'You overslept. Your phone is lost. Baba Tunde is waiting outside. Today is the day, and it is already going wrong.',
  tasks,
  bounds: R(-9, 9, -5, 5),
  blockers: [
    R(-0.15, 0.15, -5, -1), R(-0.15, 0.15, 1, 5), // partition wall with a doorway
    ...FURNITURE.map((f) => f.rect),
  ],
  furniture: FURNITURE,
  spawn: { x: -3, z: 0.5 },
  spawnAfterFirst: { x: -1.5, z: 0 },
  spots: [
    { id: 'pillow', task: 0, x: -7.6, z: -3, label: 'Look under the pillow', wrong: { who: 'player', text: 'A sock. Why is there a sock under my pillow?', expr: 'suspicious' } },
    { id: 'bedside', task: 0, x: -5.7, z: -4.1, label: 'Check the bedside', wrong: { who: 'player', text: 'Only a charger. A charger with no phone. Cruel.', expr: 'disappointed' } },
    { id: 'drawer', task: 0, x: -8.1, z: 4.2, label: 'Open the drawer', wrong: { who: 'player', text: 'Old receipts and one very lonely button.', expr: 'tired' } },
    { id: 'laundry', task: 0, x: -4.2, z: 3.6, label: 'Dig in the laundry', right: true },
  ],
  items: [
    { id: 'keys', task: 1, x: 7.3, z: -4.5, label: 'Take the keys', color: '#f5b91c', shape: 'keys' },
    { id: 'wallet', task: 1, x: 4.7, z: 2.4, label: 'Take the wallet', color: '#6b3a1e', shape: 'wallet' },
    { id: 'bag', task: 1, x: 4.8, z: -4.2, label: 'Take the bag', color: '#2f5a3a', shape: 'bag' },
    { id: 'umbrella', task: 2, x: 0.7, z: 4.4, label: 'Take the umbrella', color: '#3a4a2a', shape: 'umbrella' },
    { id: 'snack', task: 2, x: 1.4, z: 4.4, label: 'Take the snack', color: '#e07a1f', shape: 'snack' },
    { id: 'powerbank', task: 2, x: 2.1, z: 4.4, label: 'Take the power bank', color: '#1c1b22', shape: 'bank' },
  ],
  guideAreas: [{ x: -5.2, z: 0.6, r: 3.6 }, { x: 5.2, z: 0, r: 4 }, { x: 1.4, z: 3.8, r: 1.6 }, { x: 8.2, z: 0, r: 1.4 }],
  exitX: 7.7,
  timeLimit: 22,
  next: null,
  starRules: ['Finish the level', 'Leave before the timer ends', 'Leave on time with 2 mistakes or fewer'],
}

export const LEVELS: Record<string, LevelDef> = { [LEVEL1.id]: LEVEL1 }
export const CHAPTER1 = { id: 'ch1', title: 'The Unexpected Day', blurb: 'One ordinary morning that refuses to stay ordinary.', levels: [LEVEL1.id], totalLevels: 9 }
