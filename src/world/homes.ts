// Floor plans for the family home. Every district has its own: Surulere is a row of rooms opening onto a shared passage ("face-me-I-face-you"),
// Ikorodu and Kubwa are bungalows with a bedroom wing and a kitchen wing, Yaba keeps the classic layout, Lekki and Maitama are open-plan with an island
// and a separate bedroom, Wuse is a compact apartment behind a balcony passage and Garki is the row of rooms the other way round.
// Pure data, built from small specs. setHomeVariant swaps the one in INTERIORS.home (what the rest of the game reads).
import { HOME_CHORES, INTERIORS, type Anchor, type IObj, type Interior, type Hotspot } from './interiors'
import type { Rect } from './layout'

const r = (x0: number, x1: number, z0: number, z1: number): Rect => ({ x0, x1, z0, z1 })
type P = [number, number]
interface Spec {
  floors: Interior['floors']; walls: Rect[]; objs: IObj[]
  spots: { bed: P; desk: P; sofa: P; tv: P; fan: P; light: P; kitchen: P; bath: P }
  chair: [number, number, number, number]
  sofaSeats: [P, P]; sofaAt: number // seat positions and the z to stand at to reach them
  table: [P, P]; tableAt: number
  cook: P; rug: [P, P]; stands: P[]; people: { mother: P; father: P; sibling: P; child: P }; chores: P[]; windows: P[]
}

const FLOOR = { wood: 0xb98b5a, hall: 0xd8cdb8, tile: 0xdfe6ea, bath: 0xb9cfdb }
const COMMON = { bed: { kind: 'bed', h: 0.9, color: 0xd9534f, id: 'bed' }, tv: { kind: 'tvunit', h: 1.1, color: 0x4a3320, id: 'tv', appl: 'tv' }, sofa: { kind: 'sofa', h: 0.9, color: 0x2f7a5a, appl: 'sofa' } } as const
const obj = (kind: IObj['kind'], rect: Rect, h: number, color: number, extra: Partial<IObj> = {}): IObj => ({ kind, rect, h, color, ...extra })

const SPECS: Record<'rooms' | 'bungalow' | 'open' | 'studio', Spec> = {
  // a row of four rooms along the back (bedroom, sitting room, kitchen, bathroom) opening onto a long shared passage with the desk and the dining table
  rooms: {
    floors: [{ rect: r(-10, -5, -7, -1.2), color: FLOOR.wood }, { rect: r(-5, 0.5, -7, -1.2), color: FLOOR.wood }, { rect: r(0.5, 5.5, -7, -1.2), color: FLOOR.tile }, { rect: r(5.5, 10, -7, -1.2), color: FLOOR.bath }, { rect: r(-10, 10, -1.2, 7), color: FLOOR.hall }],
    walls: [r(-5.2, -4.8, -7, -1.2), r(0.3, 0.7, -7, -1.2), r(5.3, 5.7, -7, -1.2)],
    objs: [
      obj('bed', r(-9.6, -7.4, -6.8, -3.0), 0.9, 0xd9534f, { id: 'bed' }), obj('wardrobe', r(-7.0, -5.4, -6.9, -5.9), 3, 0x7a4a2a),
      obj('tvunit', r(-3.6, -0.9, -6.8, -6.0), 1.1, 0x4a3320, { id: 'tv', appl: 'tv' }), obj('sofa', r(-3.9, -0.9, -4.0, -2.8), 0.9, 0x2f7a5a, { appl: 'sofa' }), obj('rug', r(-3.8, -1.0, -2.2, -0.4), 0.04, 0xc4562a, { blocks: false }),
      obj('ac', r(-1.0, 0.2, -7.0, -6.55), 0, 0xf2f2f6, { appl: 'ac', blocks: false }),
      obj('cooker', r(1.0, 2.8, -6.9, -5.9), 1.0, 0x888888, { appl: 'cooker' }), obj('counter', r(2.8, 4.4, -6.9, -5.9), 1.0, 0x9a7a5a), obj('fridge', r(4.5, 5.2, -6.9, -5.8), 2.3, 0xe8e8ee, { appl: 'fridge' }),
      obj('shower', r(6.0, 7.4, -6.8, -5.4), 0.2, 0x7ab3d4, { blocks: false }), obj('toilet', r(8.6, 9.4, -6.8, -5.9), 0.9, 0xffffff), obj('sink', r(9.0, 9.8, -4.2, -3.0), 1.0, 0xf2f2f2),
      obj('desk', r(-9.8, -7.4, 0.4, 1.4), 1, 0x8a5a32), obj('chair', r(-9.0, -8.3, 1.6, 2.3), 0.6, 0x2b3a8c),
      obj('table', r(1.8, 4.0, 1.0, 2.4), 0.9, 0x9a6a3a), obj('fan', r(5.0, 5.5, 4.4, 5.0), 1.6, 0x4a6a8a, { id: 'fan', appl: 'fan' }), obj('plant', r(8.8, 9.5, 5.6, 6.3), 1.4, 0x2f7a3a),
    ],
    spots: { bed: [-6.4, -4.8], desk: [-8.6, 3.0], sofa: [-3.0, -1.8], tv: [-0.6, -1.8], fan: [4.4, 3.6], light: [2.4, 5.6], kitchen: [3.0, -4.4], bath: [7.6, -3.2] },
    chair: [-8.65, 1.95, -8.65, 3.0], sofaSeats: [[-3.4, -3.4], [-1.8, -3.4]], sofaAt: -1.8, table: [[2.5, 2.9], [3.5, 2.9]], tableAt: 3.6, cook: [1.9, -5.0], rug: [[-3.2, -1.0], [-1.6, -1.0]],
    stands: [[-3, 0.6], [1.5, 4.2], [6.6, 0.6], [-6, 4.4]], people: { mother: [-0.5, 1.8], father: [1.0, 3.6], sibling: [-2.0, 3.6], child: [5.0, 3.0] },
    chores: [[-2.0, -1.9], [3.4, -4.6], [-6.4, -2.2], [-6.0, 4.4], [7.6, -3.0], [1.8, 5.0]], windows: [[-7.5, -7], [-2.2, -7], [3, -7], [7.5, -7]],
  },
  // a bungalow: bedroom wing on the left, sitting room at the back, kitchen wing on the right and a bathroom in the front corner
  bungalow: {
    floors: [{ rect: r(-10, -3.4, -7, 0.2), color: FLOOR.wood }, { rect: r(-3.4, 3.6, -7, 2.4), color: FLOOR.wood }, { rect: r(3.6, 10, -7, -1.4), color: FLOOR.tile }, { rect: r(5.6, 10, 1.8, 7), color: FLOOR.bath }, { rect: r(-10, -3.4, 0.2, 7), color: FLOOR.hall }, { rect: r(3.6, 10, -1.4, 1.4), color: FLOOR.hall }, { rect: r(-3.4, 5.6, 2.4, 7), color: FLOOR.hall }],
    walls: [r(-3.6, -3.2, -7, -2.0), r(-10, -5.6, 0.0, 0.4), r(3.4, 3.8, -7, -3.4), r(5.6, 10, 1.4, 1.8), r(5.4, 5.8, 1.8, 4.6)],
    objs: [
      obj('bed', r(-9.6, -7.0, -6.8, -3.2), 0.9, 0xd9534f, { id: 'bed' }), obj('wardrobe', r(-6.4, -4.4, -6.9, -5.9), 3, 0x7a4a2a),
      obj('desk', r(-9.8, -7.4, 3.2, 4.2), 1, 0x8a5a32), obj('chair', r(-9.0, -8.3, 4.4, 5.1), 0.6, 0x2b3a8c),
      obj('tvunit', r(-1.4, 1.6, -6.8, -6.0), 1.1, 0x4a3320, { id: 'tv', appl: 'tv' }), obj('sofa', r(-1.6, 1.8, -2.9, -1.7), 0.9, 0x2f7a5a, { appl: 'sofa' }), obj('rug', r(-2.2, 2.4, -1.5, 0.4), 0.04, 0xc4562a, { blocks: false }),
      obj('ac', r(2.0, 3.2, -7.0, -6.55), 0, 0xf2f2f6, { appl: 'ac', blocks: false }), obj('fan', r(2.8, 3.3, 3.4, 4.0), 1.6, 0x4a6a8a, { id: 'fan', appl: 'fan' }),
      obj('cooker', r(4.4, 6.2, -6.9, -5.9), 1.0, 0x888888, { appl: 'cooker' }), obj('counter', r(6.2, 8.4, -6.9, -5.9), 1.0, 0x9a7a5a), obj('fridge', r(8.8, 9.9, -6.0, -4.9), 2.3, 0xe8e8ee, { appl: 'fridge' }),
      obj('table', r(5.6, 7.8, -3.2, -1.8), 0.9, 0x9a6a3a),
      obj('shower', r(6.0, 7.2, 2.2, 3.4), 0.2, 0x7ab3d4, { blocks: false }), obj('toilet', r(9.2, 9.9, 6.2, 6.9), 0.9, 0xffffff), obj('sink', r(9.1, 9.9, 2.2, 3.4), 1.0, 0xf2f2f2),
      obj('plant', r(-3.0, -2.4, 5.6, 6.2), 1.4, 0x2f7a3a),
    ],
    spots: { bed: [-5.6, -4.6], desk: [-8.6, 6.0], sofa: [-0.2, -0.9], tv: [1.6, -0.9], fan: [1.8, 3.6], light: [2.4, 5.6], kitchen: [6.0, -4.6], bath: [8.0, 4.6] },
    chair: [-8.65, 4.75, -8.65, 6.0], sofaSeats: [[-0.6, -2.3], [0.8, -2.3]], sofaAt: -0.9, table: [[6.3, -1.3], [7.3, -1.3]], tableAt: -0.6, cook: [5.3, -5.0], rug: [[-0.8, -0.6], [0.6, -0.6]],
    stands: [[-6.0, 2.0], [1.0, 4.6], [4.6, 0.6], [0.5, 5.2]], people: { mother: [-1.0, 1.2], father: [2.0, 0.6], sibling: [-4.4, 3.6], child: [4.0, 6.0] },
    chores: [[-0.2, -0.9], [6.2, -4.6], [-5.6, -2.0], [-6.0, 3.4], [8.0, 4.6], [1.8, 5.0]], windows: [[-6.5, -7], [0.4, -7], [7, -7]],
  },
  // open plan: a kitchen with an island, a desk and a long sitting area, with a separate bedroom and a bathroom
  open: {
    floors: [{ rect: r(-10, -3.4, 0.2, 7), color: FLOOR.wood }, { rect: r(-3.4, 10, -2.0, 7), color: FLOOR.wood }, { rect: r(-10, 6.4, -7, -2.0), color: FLOOR.hall }, { rect: r(-10, -3.4, -2.0, 0.2), color: FLOOR.hall }, { rect: r(6.4, 10, -7, -2.0), color: FLOOR.bath }],
    walls: [r(-10, -5.6, 0.2, 0.6), r(-3.4, -3.0, 0.6, 3.6), r(6.0, 6.4, -7, -4.6), r(6.4, 10, -2.2, -1.8)],
    objs: [
      obj('bed', r(-9.6, -6.6, 2.0, 6.2), 0.9, 0xd9534f, { id: 'bed' }), obj('wardrobe', r(-9.0, -6.8, 0.7, 1.7), 3, 0x7a4a2a),
      obj('desk', r(-1.8, 0.6, -6.8, -5.9), 1, 0x8a5a32), obj('chair', r(-1.2, -0.5, -5.7, -5.0), 0.6, 0x2b3a8c),
      obj('cooker', r(-9.4, -7.6, -6.9, -5.9), 1.0, 0x888888, { appl: 'cooker' }), obj('counter', r(-7.6, -4.0, -6.9, -5.9), 1.0, 0x9a7a5a), obj('fridge', r(-3.7, -2.6, -6.9, -5.8), 2.3, 0xe8e8ee, { appl: 'fridge' }),
      obj('table', r(-8.8, -5.2, -3.0, -1.8), 0.9, 0x9a6a3a),
      obj('tvunit', r(1.8, 4.8, -6.8, -6.0), 1.1, 0x4a3320, { id: 'tv', appl: 'tv' }), obj('sofa', r(1.6, 4.2, -3.8, -2.6), 0.9, 0x2f7a5a, { appl: 'sofa' }), obj('rug', r(1.4, 4.4, -2.2, -0.4), 0.04, 0xc4562a, { blocks: false }),
      obj('ac', r(-0.2, 1.2, -7.0, -6.55), 0, 0xf2f2f6, { appl: 'ac', blocks: false }), obj('fan', r(1.0, 1.5, 2.4, 3.0), 1.6, 0x4a6a8a, { id: 'fan', appl: 'fan' }),
      obj('shower', r(6.8, 8.0, -6.8, -5.6), 0.2, 0x7ab3d4, { blocks: false }), obj('toilet', r(9.2, 9.9, -6.8, -6.0), 0.9, 0xffffff), obj('sink', r(9.1, 9.9, -4.4, -3.2), 1.0, 0xf2f2f2),
      obj('plant', r(8.6, 9.5, 3.0, 3.8), 1.4, 0x2f7a3a),
    ],
    spots: { bed: [-5.2, 4.2], desk: [-0.9, -4.0], sofa: [2.9, -1.9], tv: [4.8, -0.9], fan: [0.6, 3.6], light: [2.4, 5.6], kitchen: [-6.0, -4.4], bath: [7.6, -3.4] },
    chair: [-0.85, -5.35, -0.85, -4.0], sofaSeats: [[2.3, -3.2], [3.5, -3.2]], sofaAt: -1.9, table: [[-7.6, -1.3], [-6.4, -1.3]], tableAt: -0.7, cook: [-8.5, -5.0], rug: [[2.2, -1.0], [3.6, -1.0]],
    stands: [[2.0, 1.0], [-1.5, 3.0], [6.5, 1.0], [2.5, 5.2]], people: { mother: [1.0, 0.6], father: [3.6, 1.4], sibling: [-1.5, 4.2], child: [6.5, 3.4] },
    chores: [[2.9, -1.5], [-6.0, -4.5], [-5.0, 3.0], [3.0, 3.8], [7.6, -3.4], [-1.0, 5.2]], windows: [[-6.5, -7], [1, -7], [8.5, -7]],
  },
  // a compact apartment: bedroom alcove, kitchenette, a living space and a balcony passage with the bathroom off it
  studio: {
    floors: [{ rect: r(-10, 10, -7, 2.6), color: FLOOR.wood }, { rect: r(-10, 5.6, 3.0, 7), color: FLOOR.hall }, { rect: r(5.6, 10, 3.0, 7), color: FLOOR.bath }, { rect: r(-10, 10, 2.6, 3.0), color: FLOOR.hall }],
    walls: [r(-10, -1.5, 2.6, 3.0), r(1.5, 10, 2.6, 3.0), r(5.6, 6.0, 3.0, 5.2)],
    objs: [
      obj('bed', r(-9.6, -6.6, -6.8, -2.6), 0.9, 0xd9534f, { id: 'bed' }), obj('wardrobe', r(-6.4, -4.4, -6.9, -5.9), 3, 0x7a4a2a),
      obj('tvunit', r(-3.2, -0.2, -6.8, -6.0), 1.1, 0x4a3320, { id: 'tv', appl: 'tv' }), obj('sofa', r(-3.4, -0.2, -3.6, -2.4), 0.9, 0x2f7a5a, { appl: 'sofa' }), obj('rug', r(-3.4, -0.4, -5.4, -4.0), 0.04, 0xc4562a, { blocks: false }),
      obj('ac', r(0.4, 1.8, -7.0, -6.55), 0, 0xf2f2f6, { appl: 'ac', blocks: false }),
      obj('cooker', r(5.0, 6.8, -6.9, -5.9), 1.0, 0x888888, { appl: 'cooker' }), obj('counter', r(6.8, 8.8, -6.9, -5.9), 1.0, 0x9a7a5a), obj('fridge', r(9.0, 9.9, -6.0, -4.9), 2.3, 0xe8e8ee, { appl: 'fridge' }),
      obj('table', r(3.0, 5.4, -3.4, -2.0), 0.9, 0x9a6a3a), obj('desk', r(7.2, 9.6, -2.0, -1.0), 1, 0x8a5a32), obj('chair', r(8.0, 8.7, -0.8, -0.1), 0.6, 0x2b3a8c),
      obj('fan', r(-4.0, -3.5, 3.6, 4.2), 1.6, 0x4a6a8a, { id: 'fan', appl: 'fan' }), obj('plant', r(-9.5, -8.8, 4.0, 4.8), 1.4, 0x2f7a3a),
      obj('shower', r(6.4, 7.8, 3.6, 5.0), 0.2, 0x7ab3d4, { blocks: false }), obj('toilet', r(9.2, 9.9, 6.0, 6.8), 0.9, 0xffffff), obj('sink', r(9.1, 9.9, 3.6, 4.8), 1.0, 0xf2f2f2),
    ],
    spots: { bed: [-5.6, -4.8], desk: [8.4, 1.2], sofa: [-1.8, -1.2], tv: [0.6, -1.2], fan: [-2.4, 4.6], light: [2.4, 5.6], kitchen: [6.4, -4.6], bath: [7.4, 5.4] },
    chair: [8.35, -0.45, 8.35, 1.2], sofaSeats: [[-2.7, -3.0], [-1.0, -3.0]], sofaAt: -1.2, table: [[3.6, -1.5], [4.8, -1.5]], tableAt: -0.8, cook: [5.9, -5.0], rug: [[-2.6, -4.6], [-1.4, -4.6]],
    stands: [[3.0, 1.0], [-6.0, 0.6], [-4.0, 5.4], [2.6, 5.6]], people: { mother: [1.0, 0.8], father: [-1.2, 1.0], sibling: [-5.0, 5.4], child: [3.5, 4.8] },
    chores: [[-1.8, -1.2], [6.4, -4.6], [-5.6, -2.0], [0.0, 5.0], [7.4, 5.0], [-3.0, 5.4]], windows: [[-6.5, -7], [-1.7, -7], [6.5, -7]],
  },
}
void COMMON

/** District to floor plan, and whether the plan is flipped left to right. Yaba keeps the classic plan. */
const PLAN: Record<string, { plan: keyof typeof SPECS | 'classic'; flip?: boolean }> = {
  surulere: { plan: 'rooms' }, ikorodu: { plan: 'bungalow' }, yaba: { plan: 'classic' }, lekki: { plan: 'open' },
  kubwa: { plan: 'bungalow', flip: true }, garki: { plan: 'rooms', flip: true }, wuse: { plan: 'studio' }, maitama: { plan: 'open', flip: true },
}

const ACT: Record<string, Hotspot['actions']> = {
  bed: [{ label: 'Lie down on the bed', icon: '🛏️', cmd: 'pose:bed' }, { label: 'Go to sleep', icon: '😴', cmd: 'sleep' }],
  desk: [{ label: 'Study at your desk', icon: '📚', cmd: 'task:desk' }, { label: 'Sit on the chair', icon: '🪑', cmd: 'pose:chair' }],
  sofa: [{ label: 'Sit on the sofa', icon: '🛋️', cmd: 'pose:sofa' }],
  tv: [{ label: 'Turn the TV on/off', icon: '📺', cmd: 'toggle:tv' }, { label: 'Watch TV for a while', icon: '🍿', cmd: 'act:tv' }],
  fan: [{ label: 'Turn the fan on/off', icon: '🌀', cmd: 'toggle:fan' }],
  light: [{ label: 'Turn the lights on/off', icon: '💡', cmd: 'toggle:light' }],
  kitchen: [{ label: 'Cook a meal', icon: '🍳', cmd: 'task:cook', needs: 'cooker' }, { label: 'Do the household chores', icon: '🧹', cmd: 'task:chores' }],
  bath: [{ label: 'Brush teeth and freshen up', icon: '🪥', cmd: 'wash:brush' }, { label: 'Take a bath', icon: '🚿', cmd: 'wash:bath' }],
}
const NAMES: Record<string, [string, string, number, number?]> = { bed: ['Bed', '🛏️', 1.9], desk: ['Desk', '📚', 1.7], sofa: ['Sofa', '🛋️', 1.7], tv: ['TV', '📺', 1.6], fan: ['Standing fan', '🌀', 1.8], light: ['Light switch', '💡', 1.6], kitchen: ['Kitchen', '🍛', 2.3], bath: ['Bathroom', '🪥', 2.2] }
const NEEDS: Record<string, string> = { sofa: 'sofa', tv: 'tv', fan: 'fan' }

function build(base: Interior, s: Spec): Interior {
  const hotspots: Hotspot[] = (Object.keys(NAMES) as (keyof Spec['spots'])[]).map((k) => ({ id: k, name: NAMES[k][0], icon: NAMES[k][1], x: s.spots[k][0], z: s.spots[k][1], r: NAMES[k][2], ...(NEEDS[k] ? { needs: NEEDS[k] } : {}), actions: ACT[k] }))
  const A = (id: string, kind: Anchor['kind'], x: number, z: number, ax: number, az: number, pose: Anchor['pose'], face: number, floor?: boolean): Anchor => ({ id, kind, x, z, ax, az, pose, face, ...(floor ? { floor } : {}) })
  const anchors: Anchor[] = [
    A('deskchair', 'chair', s.chair[0], s.chair[1], s.chair[2], s.chair[3], 'sit', Math.PI),
    A('sofa1', 'sofa', s.sofaSeats[0][0], s.sofaSeats[0][1], s.sofaSeats[0][0], s.sofaAt, 'sit', Math.PI), A('sofa2', 'sofa', s.sofaSeats[1][0], s.sofaSeats[1][1], s.sofaSeats[1][0], s.sofaAt, 'sit', Math.PI),
    A('table1', 'table', s.table[0][0], s.table[0][1], s.table[0][0], s.tableAt, 'sit', Math.PI), A('table2', 'table', s.table[1][0], s.table[1][1], s.table[1][0], s.tableAt, 'sit', Math.PI),
    A('cook1', 'cook', s.cook[0], s.cook[1], s.cook[0], s.cook[1], 'stand', Math.PI),
    A('rug1', 'rug', s.rug[0][0], s.rug[0][1], s.rug[0][0], s.rug[0][1], 'sit', 0, true), A('rug2', 'rug', s.rug[1][0], s.rug[1][1], s.rug[1][0], s.rug[1][1], 'sit', 0.8, true),
    ...s.stands.map((p, i) => A(`st${i + 1}`, 'stand', p[0], p[1], p[0], p[1], 'stand', [0.5, -0.6, 0, 2.4][i] ?? 0)),
  ]
  const people = base.people.map((p) => ({ ...p, x: s.people[p.role as keyof Spec['people']][0], z: s.people[p.role as keyof Spec['people']][1] }))
  return { ...base, floors: s.floors, walls: s.walls, objs: s.objs, hotspots, anchors, people, windowsAt: s.windows.map(([x, z]) => ({ x, z })) }
}

const flipRect = (q: Rect): Rect => ({ x0: -q.x1, x1: -q.x0, z0: q.z0, z1: q.z1 })
function flip(d: Interior, chores: P[]): { def: Interior; chores: P[] } {
  return {
    def: {
      ...d,
      floors: d.floors.map((f) => ({ ...f, rect: flipRect(f.rect) })), walls: d.walls.map(flipRect), objs: d.objs.map((o) => ({ ...o, rect: flipRect(o.rect) })),
      hotspots: d.hotspots.map((h) => ({ ...h, x: -h.x })), people: d.people.map((p) => ({ ...p, x: -p.x })), windowsAt: d.windowsAt.map((w) => ({ ...w, x: -w.x })),
      anchors: d.anchors!.map((a) => ({ ...a, x: -a.x, ax: -a.ax, face: -a.face })),
    },
    chores: chores.map(([x, z]) => [-x, z] as P),
  }
}

const CLASSIC = INTERIORS.home!
const CLASSIC_CHORES = HOME_CHORES.map((c) => ({ ...c }))
const NOTES = HOME_CHORES.map((c) => ({ id: c.id, emoji: c.emoji, note: c.note }))

/** The home for a district, plus the spots for the chores task. */
export function homeFor(districtId: string): { def: Interior; chores: typeof HOME_CHORES } {
  const pl = PLAN[districtId] ?? PLAN.yaba
  if (pl.plan === 'classic') return { def: CLASSIC, chores: CLASSIC_CHORES.map((c) => ({ ...c })) }
  const spec = SPECS[pl.plan]
  let def = build(CLASSIC, spec), chores: P[] = spec.chores
  if (pl.flip) ({ def, chores } = flip(def, chores))
  return { def, chores: NOTES.map((n, i) => ({ ...n, x: chores[i][0], z: chores[i][1] })) }
}

let current = ''
/** Make the rest of the game (hotspots, people, chores) read this district's floor plan. */
export function setHomeVariant(districtId: string) {
  if (current === districtId) return
  const { def, chores } = homeFor(districtId)
  INTERIORS.home = def
  HOME_CHORES.splice(0, HOME_CHORES.length, ...chores)
  current = districtId
}
