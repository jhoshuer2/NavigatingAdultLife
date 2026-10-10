// Interior layouts (pure data). Each interior is a small walkable room with furniture, hotspots and people.
import type { Rect, PlaceId } from './layout'

export type ObjKind =
  | 'bed' | 'wardrobe' | 'desk' | 'chair' | 'sofa' | 'tvunit' | 'fan' | 'counter' | 'fridge' | 'table' | 'shower' | 'toilet' | 'sink' | 'pew' | 'board' | 'cubicle' | 'plant' | 'rug' | 'shelf' | 'cooler' | 'pulpit' | 'bench' | 'stool' | 'cooker'

export interface IObj { kind: ObjKind; rect: Rect; h: number; color: number; blocks?: boolean; id?: string }
export interface HotAction { label: string; icon: string; cmd: string; note?: string }
export interface Hotspot { id: string; name: string; icon: string; x: number; z: number; r: number; actions: HotAction[] }
export interface IPerson { id: string; name: string; role: string; x: number; z: number; line: string; persistent?: string }
export interface Interior {
  id: PlaceId
  name: string
  bounds: Rect
  floors: { rect: Rect; color: number }[]
  walls: Rect[] // interior partition walls (blocking)
  objs: IObj[]
  hotspots: Hotspot[]
  people: IPerson[]
  door: { x: number; z: number } // exit zone (inside, near the door)
  spawn: { x: number; z: number }
  wallColor: number
  windowsAt: { x: number; z: number }[] // window panes on the north wall
}

const r = (x0: number, x1: number, z0: number, z1: number): Rect => ({ x0, x1, z0, z1 })
const B = r(-10, 10, -7, 7)
const exit = { label: 'Go outside', icon: '🚪', cmd: 'exit' }

export const INTERIORS: Partial<Record<PlaceId, Interior>> = {
  home: {
    id: 'home', name: 'Your home', bounds: B, wallColor: 0xf0e0c0, door: { x: 0, z: 6.2 }, spawn: { x: 0, z: 5 },
    floors: [{ rect: r(-10, -2.8, -7, 0.6), color: 0xb98b5a }, { rect: r(-10, -2.8, 0.6, 7), color: 0xd8cdb8 }, { rect: r(-2.8, 4, -7, 7), color: 0xe4dccb }, { rect: r(4, 10, -7, 1.4), color: 0xdfe6ea }, { rect: r(4, 10, 1.4, 7), color: 0xb9cfdb }],
    walls: [r(-3.2, -2.8, -7, 0.6), r(3.9, 4.3, -7, -2), r(3.9, 4.3, 2.2, 4.6), r(4.3, 10, 1.2, 1.6)],
    objs: [
      { kind: 'bed', rect: r(-9.6, -6.4, -6.8, -2.6), h: 0.9, color: 0xd9534f, id: 'bed' },
      { kind: 'wardrobe', rect: r(-6, -3.6, -6.9, -5.9), h: 3, color: 0x7a4a2a },
      { kind: 'desk', rect: r(-9.8, -7.4, -1.6, -0.6), h: 1, color: 0x8a5a32 }, { kind: 'chair', rect: r(-9.0, -8.3, -0.4, 0.3), h: 0.6, color: 0x2b3a8c },
      { kind: 'tvunit', rect: r(-1, 2, -6.8, -6), h: 1.1, color: 0x4a3320, id: 'tv' }, { kind: 'sofa', rect: r(-1.5, 1.6, -1.2, 0.4), h: 0.9, color: 0x2f7a5a },
      { kind: 'rug', rect: r(-1.8, 2.8, -4.5, -2.0), h: 0.04, color: 0xc4562a, blocks: false },
      { kind: 'fan', rect: r(3.2, 3.7, 2.2, 2.8), h: 1.6, color: 0x4a6a8a, id: 'fan' },
      { kind: 'cooker', rect: r(4.6, 6.4, -6.9, -5.9), h: 1.0, color: 0x888888 }, { kind: 'counter', rect: r(6.4, 8.6, -6.9, -5.9), h: 1.0, color: 0x9a7a5a },
      { kind: 'fridge', rect: r(8.8, 9.9, -6.0, -4.9), h: 2.3, color: 0xe8e8ee },
      { kind: 'table', rect: r(5.5, 8, -3.4, -1.8), h: 0.9, color: 0x9a6a3a }, { kind: 'stool', rect: r(5.0, 5.5, -2.9, -2.4), h: 0.5, color: 0xc4562a }, { kind: 'stool', rect: r(8.0, 8.5, -2.9, -2.4), h: 0.5, color: 0xc4562a },
      { kind: 'shower', rect: r(5, 6.4, 1.8, 3.2), h: 0.2, color: 0x7ab3d4, blocks: false }, { kind: 'toilet', rect: r(7.6, 8.4, 2.0, 2.9), h: 0.9, color: 0xffffff }, { kind: 'sink', rect: r(9.1, 9.9, 2.0, 3.2), h: 1.0, color: 0xf2f2f2 },
      { kind: 'plant', rect: r(-2.4, -1.8, 5.6, 6.2), h: 1.4, color: 0x2f7a3a },
    ],
    hotspots: [
      { id: 'bed', name: 'Bed', icon: '🛏️', x: -5.4, z: -4.6, r: 1.9, actions: [{ label: 'Go to sleep', icon: '😴', cmd: 'sleep' }] },
      { id: 'desk', name: 'Desk', icon: '📚', x: -8.6, z: 1.0, r: 1.7, actions: [{ label: 'Study at your desk', icon: '📚', cmd: 'act:study' }] },
      { id: 'tv', name: 'TV and sofa', icon: '📺', x: 0.5, z: 1.5, r: 2.0, actions: [{ label: 'Turn the TV on/off', icon: '📺', cmd: 'toggle:tv' }, { label: 'Watch TV for a while', icon: '🍿', cmd: 'act:tv' }] },
      { id: 'fan', name: 'Standing fan', icon: '🌀', x: 2.1, z: 1.7, r: 1.8, actions: [{ label: 'Turn the fan on/off', icon: '🌀', cmd: 'toggle:fan' }] },
      { id: 'light', name: 'Light switch', icon: '💡', x: 2.4, z: 5.6, r: 1.6, actions: [{ label: 'Turn the lights on/off', icon: '💡', cmd: 'toggle:light' }] },
      { id: 'kitchen', name: 'Kitchen', icon: '🍛', x: 7.0, z: -0.6, r: 2.3, actions: [{ label: 'Eat a meal', icon: '🍛', cmd: 'act:meal' }] },
      { id: 'bath', name: 'Bathroom', icon: '🪥', x: 7.0, z: 4.8, r: 2.2, actions: [{ label: 'Brush teeth and freshen up', icon: '🪥', cmd: 'act:groom' }, { label: 'Take a bath', icon: '🚿', cmd: 'act:groom' }] },
    ],
    people: [
      { id: 'mother', name: 'Mama', role: 'mother', x: -0.2, z: 3.2, line: 'Have you eaten? Sit down first.', persistent: 'mother' },
      { id: 'father', name: 'Papa', role: 'father', x: 1.8, z: 3.4, line: 'Is that how you greet your father?', persistent: 'father' },
      { id: 'sibling', name: 'Sibling', role: 'sibling', x: -1.4, z: 4.1, line: 'Abeg, no touch my remote.', persistent: 'sibling' },
      { id: 'child', name: 'Little one', role: 'child', x: 2.6, z: 4.6, line: 'Play with me!', persistent: 'child' },
    ],
    windowsAt: [{ x: -6.5, z: -7 }, { x: 1, z: -7 }, { x: 7, z: -7 }],
  },
  school: {
    id: 'school', name: 'Classroom', bounds: r(-9, 9, -6, 6), wallColor: 0xf7efe0, door: { x: 0, z: 5.2 }, spawn: { x: 0, z: 4.2 },
    floors: [{ rect: r(-9, 9, -6, 6), color: 0xcdbfa2 }], walls: [],
    objs: [
      { kind: 'board', rect: r(-4, 4, -5.95, -5.8), h: 2.4, color: 0x24402f, blocks: false },
      { kind: 'desk', rect: r(-6.5, -4.5, -1.8, -0.8), h: 0.9, color: 0x9a6a3a }, { kind: 'desk', rect: r(-2.5, -0.5, -1.8, -0.8), h: 0.9, color: 0x9a6a3a, id: 'mydesk' }, { kind: 'desk', rect: r(1.5, 3.5, -1.8, -0.8), h: 0.9, color: 0x9a6a3a }, { kind: 'desk', rect: r(5.0, 7.0, -1.8, -0.8), h: 0.9, color: 0x9a6a3a },
      { kind: 'desk', rect: r(-6.5, -4.5, 1.2, 2.2), h: 0.9, color: 0x9a6a3a }, { kind: 'desk', rect: r(-2.5, -0.5, 1.2, 2.2), h: 0.9, color: 0x9a6a3a }, { kind: 'desk', rect: r(1.5, 3.5, 1.2, 2.2), h: 0.9, color: 0x9a6a3a },
      { kind: 'desk', rect: r(-1.2, 1.2, -4.6, -3.8), h: 1.0, color: 0x6a4a2a },
      { kind: 'shelf', rect: r(7.4, 8.8, -5.6, -2.4), h: 2.2, color: 0x8a5a32 },
    ],
    hotspots: [
      { id: 'mydesk', name: 'Your desk', icon: '📚', x: -1.5, z: 0.3, r: 1.9, actions: [{ label: 'Sit and study (pop quiz)', icon: '📚', cmd: 'act:study' }] },
      { id: 'mates', name: 'Classmates', icon: '🧑‍🤝‍🧑', x: -5.5, z: 3.6, r: 2.2, actions: [{ label: 'Hang out with a friend', icon: '🧑‍🤝‍🧑', cmd: 'act:socialise' }] },
    ],
    people: [{ id: 'teacher', name: 'Teacher', role: 'teacher', x: -3.2, z: -3.4, line: 'Sit down! Open your books to page ten.' }, { id: 'f2', name: 'Classmate', role: 'friend2', x: -5.5, z: 3.1, line: 'Did you copy the assignment?', persistent: 'friend2' }],
    windowsAt: [{ x: -7, z: -6 }, { x: 7, z: -6 }],
  },
  mamaput: {
    id: 'mamaput', name: 'Mama Chidi’s Buka', bounds: r(-8, 8, -6, 6), wallColor: 0xf7e2b0, door: { x: 0, z: 5.2 }, spawn: { x: 0, z: 4.2 },
    floors: [{ rect: r(-8, 8, -6, 6), color: 0xc9a06a }], walls: [],
    objs: [
      { kind: 'counter', rect: r(-4.6, 5, -4.6, -3.6), h: 1.1, color: 0x7a4a2a }, { kind: 'cooker', rect: r(-7.4, -6.2, -5.4, -4.4), h: 1.0, color: 0x444444 },
      { kind: 'table', rect: r(-6.5, -4.5, 0.2, 1.8), h: 0.85, color: 0xb5763a, id: 'tbl1' }, { kind: 'table', rect: r(-1, 1, 0.2, 1.8), h: 0.85, color: 0xb5763a }, { kind: 'table', rect: r(4.5, 6.5, 0.2, 1.8), h: 0.85, color: 0xb5763a },
      { kind: 'stool', rect: r(-7.0, -6.5, 0.6, 1.1), h: 0.5, color: 0xc4562a }, { kind: 'stool', rect: r(-4.5, -4.0, 0.6, 1.1), h: 0.5, color: 0xc4562a },
      { kind: 'tvunit', rect: r(5.5, 7.5, -5.6, -4.8), h: 1.6, color: 0x333333 },
    ],
    hotspots: [
      { id: 'order', name: 'Order at the counter', icon: '🍲', x: 0, z: -2.4, r: 2.0, actions: [{ label: 'Order a plate (eat)', icon: '🍛', cmd: 'act:meal' }, { label: 'Treat yourself', icon: '🍨', cmd: 'act:treat' }] },
      { id: 'table', name: 'Table by the window', icon: '🧑‍🤝‍🧑', x: -5.5, z: 3.0, r: 2.2, actions: [{ label: 'Hang out with a friend', icon: '🧑‍🤝‍🧑', cmd: 'act:socialise' }] },
    ],
    people: [{ id: 'mama', name: 'Mama Chidi', role: 'cook', x: -6.0, z: -2.8, line: 'Rice or beans? Do not stand there like a statue.' }, { id: 'friend', name: 'Friend', role: 'friend', x: -5.5, z: 2.5, line: 'Sit down, the gist is hot.', persistent: 'friend' }],
    windowsAt: [{ x: -7, z: -6 }, { x: 0, z: -6 }],
  },
  worship: {
    id: 'worship', name: 'Place of Worship', bounds: r(-9, 9, -7, 7), wallColor: 0xf4ecff, door: { x: 0, z: 6.2 }, spawn: { x: 0, z: 5 },
    floors: [{ rect: r(-9, 9, -7, 7), color: 0xd9d0e8 }], walls: [],
    objs: [
      { kind: 'pulpit', rect: r(-1.6, 1.6, -6.4, -4.8), h: 1.2, color: 0x7a3b9a },
      { kind: 'pew', rect: r(-7, -2.6, -2.6, -1.8), h: 0.9, color: 0x8a5a32 }, { kind: 'pew', rect: r(2.6, 7, -2.6, -1.8), h: 0.9, color: 0x8a5a32 },
      { kind: 'pew', rect: r(-7, -2.6, 0.2, 1.0), h: 0.9, color: 0x8a5a32 }, { kind: 'pew', rect: r(2.6, 7, 0.2, 1.0), h: 0.9, color: 0x8a5a32 },
      { kind: 'pew', rect: r(-7, -2.6, 2.8, 3.6), h: 0.9, color: 0x8a5a32 }, { kind: 'pew', rect: r(2.6, 7, 2.8, 3.6), h: 0.9, color: 0x8a5a32 },
    ],
    hotspots: [{ id: 'pew', name: 'Take a seat', icon: '🕊️', x: 0, z: -0.5, r: 2.6, actions: [{ label: 'Join the service', icon: '🕊️', cmd: 'act:community' }] }],
    people: [{ id: 'elder', name: 'Elder', role: 'elder', x: 0, z: -3.6, line: 'Peace be with you, my child.' }],
    windowsAt: [{ x: -6, z: -7 }, { x: 6, z: -7 }],
  },
  office: {
    id: 'office', name: 'Your workplace', bounds: B, wallColor: 0xdfe6f5, door: { x: 0, z: 6.2 }, spawn: { x: 0, z: 5 },
    floors: [{ rect: B, color: 0x9aa5b8 }], walls: [r(5.8, 6.2, -7, -1.4)],
    objs: [
      { kind: 'cubicle', rect: r(-8, -4.6, -4.8, -2.8), h: 1.4, color: 0xb9c4d8 }, { kind: 'desk', rect: r(-7.6, -5.0, -4.2, -3.4), h: 0.9, color: 0x6a5a48, id: 'mydesk' },
      { kind: 'cubicle', rect: r(-3.2, 0.2, -4.8, -2.8), h: 1.4, color: 0xb9c4d8 }, { kind: 'desk', rect: r(-2.8, -0.2, -4.2, -3.4), h: 0.9, color: 0x6a5a48 },
      { kind: 'cubicle', rect: r(-8, -4.6, 0.2, 2.2), h: 1.4, color: 0xb9c4d8 }, { kind: 'desk', rect: r(-7.6, -5.0, 0.6, 1.4), h: 0.9, color: 0x6a5a48 },
      { kind: 'desk', rect: r(7.2, 9.4, -5.6, -4.4), h: 1.0, color: 0x4a3a2a, id: 'boss' }, { kind: 'cooler', rect: r(2.0, 2.8, -6.6, -5.8), h: 1.5, color: 0x8fd0f0 },
      { kind: 'desk', rect: r(7.4, 9.4, 3.4, 4.4), h: 1.0, color: 0x7a6a58, id: 'hr' },
    ],
    hotspots: [
      { id: 'mydesk', name: 'Your desk', icon: '💼', x: -3.6, z: -1.0, r: 2.4, actions: [{ label: 'Work harder (overtime)', icon: '⏰', cmd: 'act:overtime' }] },
      { id: 'boss', name: 'Boss’s office', icon: '🧑‍💼', x: 7.7, z: -2.2, r: 2.3, actions: [{ label: 'Have a word with the boss', icon: '💬', cmd: 'chat:boss' }] },
      { id: 'hr', name: 'HR desk', icon: '📄', x: 6.1, z: 4.6, r: 2.3, actions: [{ label: 'Resign from your job', icon: '🚪', cmd: 'act:quitJob' }] },
    ],
    people: [{ id: 'boss', name: 'Boss', role: 'boss', x: 8.2, z: -3.2, line: 'Targets do not meet themselves.', persistent: 'boss' }, { id: 'col', name: 'Colleague', role: 'colleague', x: 3.4, z: -5.0, line: 'Did you see the email? Do not open it.' }],
    windowsAt: [{ x: -2, z: -7 }, { x: 6, z: -7 }],
  },
  jobcentre: {
    id: 'jobcentre', name: 'Cyber Café & Job Centre', bounds: r(-8, 8, -6, 6), wallColor: 0xd9f0e2, door: { x: 0, z: 5.2 }, spawn: { x: 0, z: 4.2 },
    floors: [{ rect: r(-8, 8, -6, 6), color: 0xb8c7bd }], walls: [],
    objs: [
      { kind: 'counter', rect: r(-3, 3, -3.8, -2.8), h: 1.1, color: 0x2e5a45 }, { kind: 'desk', rect: r(-7, -5, -1, 0), h: 0.9, color: 0x4a4a52 }, { kind: 'desk', rect: r(-7, -5, 1.6, 2.6), h: 0.9, color: 0x4a4a52 }, { kind: 'desk', rect: r(5, 7, -1, 0), h: 0.9, color: 0x4a4a52 }, { kind: 'board', rect: r(-7.5, -3, -5.95, -5.8), h: 2.2, color: 0xc9a06a, blocks: false },
    ],
    hotspots: [
      { id: 'counter', name: 'Job desk', icon: '📝', x: 0, z: -1.6, r: 2.3, actions: [{ label: 'Look for work (apply)', icon: '📝', cmd: 'act:applyJob' }] },
      { id: 'cafe', name: 'Computers', icon: '💻', x: -3.8, z: 0.8, r: 2.0, actions: [{ label: 'Browse listings (apply)', icon: '💻', cmd: 'act:applyJob' }] },
    ],
    people: [{ id: 'clerk', name: 'Clerk', role: 'clerk', x: 0, z: -4.8, line: 'Your CV? Why is it ten pages?' }],
    windowsAt: [{ x: 5, z: -6 }],
  },
}

export function interiorFor(id: PlaceId): Interior | undefined { return INTERIORS[id] }

/** All blocking rectangles inside an interior (furniture and partition walls). */
export function interiorBlockers(it: Interior): Rect[] {
  return [...it.walls, ...it.objs.filter((o) => o.blocks !== false).map((o) => o.rect)]
}
export { exit as EXIT_ACTION }
