// What the inside of your home looks like in each district. Lagos homes and Abuja homes differ (Eyo masquerade and ankara versus Zuma Rock
// and Hausa leather poufs), and so do districts inside a city (Surulere's washing line, Ikorodu's water drum, Yaba's bookshelf and fairy lights,
// Lekki's curtains and glass table, Kubwa's mats, Garki's certificates, Wuse's modern lamps, Maitama's gold mirror). Purely visual: nothing here blocks walking.
export interface DBox { b: [number, number, number, number, number, number]; c: number }
export interface DCyl { cx: number; cy: number; cz: number; r: number; h: number; c: number }
export interface HomeDecor { rug: number; rugTrim: number; sofa: number; bed: number; boxes: DBox[]; cyls: DCyl[] }

const NORTH = -6.93, WEST = -9.93
const bx = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: number): DBox => ({ b: [x0, x1, y0, y1, z0, z1], c })
/** a picture frame on the north wall */
const frameN = (x: number, y: number, w: number, h: number, art: number, frame = 0x5a3a1e): DBox[] => [bx(x - w / 2 - 0.08, x + w / 2 + 0.08, y - h / 2 - 0.08, y + h / 2 + 0.08, NORTH - 0.02, NORTH + 0.05, frame), bx(x - w / 2, x + w / 2, y - h / 2, y + h / 2, NORTH + 0.04, NORTH + 0.08, art)]
/** a picture frame on the west wall */
const frameW = (z: number, y: number, w: number, h: number, art: number, frame = 0x5a3a1e): DBox[] => [bx(WEST - 0.02, WEST + 0.05, y - h / 2 - 0.08, y + h / 2 + 0.08, z - w / 2 - 0.08, z + w / 2 + 0.08, frame), bx(WEST + 0.04, WEST + 0.08, y - h / 2, y + h / 2, z - w / 2, z + w / 2, art)]

/** Eyo masquerade: a tall white robed figure with a wide hat, on a purple board. */
const eyoN = (x: number, y: number): DBox[] => [...frameN(x, y, 0.9, 1.4, 0x6a3b9a), bx(x - 0.18, x + 0.18, y - 0.6, y + 0.35, NORTH + 0.08, NORTH + 0.12, 0xf6f4ee), bx(x - 0.34, x + 0.34, y + 0.35, y + 0.42, NORTH + 0.08, NORTH + 0.13, 0x1c1b22), bx(x - 0.1, x + 0.1, y + 0.42, y + 0.6, NORTH + 0.08, NORTH + 0.12, 0xf2c38a)]
/** Zuma Rock: a grey dome on green ground under a blue sky. */
const zumaN = (x: number, y: number, frame = 0x5a3a1e): DBox[] => [...frameN(x, y, 1.5, 1.0, 0x8ec5ee, frame), bx(x - 0.75, x + 0.75, y - 0.5, y - 0.3, NORTH + 0.08, NORTH + 0.1, 0x4a9a4a), bx(x - 0.4, x + 0.4, y - 0.3, y + 0.05, NORTH + 0.08, NORTH + 0.11, 0x7a7a82), bx(x - 0.25, x + 0.25, y + 0.05, y + 0.2, NORTH + 0.08, NORTH + 0.11, 0x8a8a92)]
/** Ankara cloth hung on the wall: bright stripes. */
const ankaraN = (x: number, y: number): DBox[] => [0xe6a817, 0xc4562a, 0x2b3a8c, 0x0f7a4a, 0xe0457b].map((c, i) => bx(x - 0.7 + i * 0.28, x - 0.7 + (i + 1) * 0.28, y - 0.7, y + 0.7, NORTH + 0.0, NORTH + 0.06, c))
/** a free-standing bookshelf against the south wall */
const bookshelfS = (x0: number, x1: number, h = 1.9): DBox[] => {
  const out: DBox[] = [bx(x0, x1, 0, h, 6.25, 6.75, 0x6a4a2a)]
  for (let lv = 0; lv < 4; lv++) for (let x = x0 + 0.1; x < x1 - 0.2; x += 0.18) out.push(bx(x, x + 0.14, 0.2 + lv * 0.45, 0.5 + lv * 0.45, 6.2, 6.3, [0xc4562a, 0x2b3a8c, 0x0f7a4a, 0xf5b91c, 0x8a1c6a][Math.abs(Math.floor(x * 10 + lv)) % 5]))
  return out
}
const curtains = (xs: number[], color: number): DBox[] => xs.flatMap((x) => [bx(x - 1.35, x - 0.95, 0.3, 3.1, NORTH - 0.02, NORTH + 0.18, color), bx(x + 0.95, x + 1.35, 0.3, 3.1, NORTH - 0.02, NORTH + 0.18, color)])
const plant = (cx: number, cz: number, h = 1.6): { b: DBox[]; c: DCyl[] } => ({ b: [bx(cx - 0.3, cx + 0.3, 0, 0.5, cz - 0.3, cz + 0.3, 0x8a5a3a), bx(cx - 0.5, cx + 0.5, 0.5, h, cz - 0.5, cz + 0.5, 0x2f7a3a)], c: [] })
const lamp = (cx: number, cz: number): DCyl[] => [{ cx, cy: 0.9, cz, r: 0.04, h: 1.8, c: 0x888888 }, { cx, cy: 1.85, cz, r: 0.3, h: 0.3, c: 0xfff2b0 }]
const drum = (cx: number, cz: number, c = 0x1c1b22): DCyl[] => [{ cx, cy: 0.55, cz, r: 0.45, h: 1.1, c }, { cx, cy: 1.12, cz, r: 0.47, h: 0.06, c: 0x2b6ad0 }]
const pouf = (cx: number, cz: number, c: number): DCyl[] => [{ cx, cy: 0.25, cz, r: 0.4, h: 0.5, c }, { cx, cy: 0.52, cz, r: 0.36, h: 0.06, c: 0xe6c27a }]

const rugTrim = (c: number) => c

export function homeDecorFor(id: string): HomeDecor {
  const boxes: DBox[] = [], cyls: DCyl[] = []
  const add = (...bs: DBox[][]) => bs.forEach((a) => boxes.push(...a))
  let rug = 0xc4562a, trim = 0xf5b91c, sofa = 0x2f7a5a, bed = 0xd9534f
  switch (id) {
    case 'surulere': {
      rug = 0xe6a817; trim = 0xc4562a; sofa = 0x2f7a5a; bed = 0xd9534f
      add(eyoN(-1.6, 2.2), ankaraN(4.6, 2.3))
      // a washing line across the living room with clothes on it, plastic chairs stacked in a corner, a wall calendar by the door
      boxes.push(bx(-7.4, -3.3, 2.75, 2.78, 5.9, 5.93, 0x555555))
      for (let i = 0; i < 6; i++) boxes.push(bx(-7.0 + i * 0.7, -6.7 + i * 0.7, 1.95, 2.75, 5.88, 5.96, [0xf2efe6, 0xe0457b, 0x2b3a8c, 0xf5b91c, 0x0f7a4a, 0xf2efe6][i]))
      for (let i = 0; i < 4; i++) boxes.push(bx(-5.6, -5.0, i * 0.1, i * 0.1 + 0.5, 6.1, 6.7, 0xf2f2f2))
      add(frameW(4.2, 2.1, 0.8, 1.0, 0xf5f0d8))
      break
    }
    case 'ikorodu': {
      rug = 0x7a4a2a; trim = 0xe6c27a; sofa = 0x8a5a32; bed = 0x2b8a6a
      cyls.push(...drum(-6.4, 5.9), ...drum(-5.4, 6.2, 0x2b6ad0))
      for (let i = 0; i < 3; i++) boxes.push(bx(-4.6 + i * 0.6, -4.1 + i * 0.6, 0, 0.55, 6.1, 6.7, 0xe8d9b0)) // sacks of rice
      add(ankaraN(-1.6, 2.3), frameW(3.8, 2.1, 0.9, 0.9, 0x7ac07a))
      break
    }
    case 'yaba': {
      rug = 0x4a5a8a; trim = 0xffd23f; sofa = 0x4a4a52; bed = 0x3b5fc0
      add(bookshelfS(-6.6, -4.4), frameN(-1.6, 2.2, 1.1, 0.8, 0x1c1b22, 0xffffff), frameN(4.6, 2.3, 0.7, 1.0, 0xe0457b, 0xffffff))
      for (let x = -9.5; x < 9.5; x += 0.8) boxes.push(bx(x, x + 0.14, 2.9 + Math.sin(x) * 0.12, 3.04 + Math.sin(x) * 0.12, NORTH + 0.05, NORTH + 0.19, 0xfff0a0)) // fairy lights
      break
    }
    case 'lekki': {
      rug = 0xe8e4d8; trim = 0xd4a017; sofa = 0xf2efe6; bed = 0xe8e4f0
      add(curtains([-6.5, 1, 7], 0xd8d0c0))
      const p = plant(-6.4, 6.0, 1.9); boxes.push(...p.b); cyls.push(...lamp(-5.0, 6.2))
      boxes.push(bx(-0.7, 1.7, 0.0, 0.4, -3.1, -1.9, 0xbfe3f2), bx(-0.7, 1.7, 0.4, 0.45, -3.1, -1.9, 0xe8f6fc)) // glass coffee table
      add(frameN(-1.6, 2.2, 1.3, 1.0, 0xf7f2e4, 0xd4a017))
      break
    }
    case 'kubwa': {
      rug = 0x8a3b2a; trim = 0xe6c27a; sofa = 0x6a4a2a; bed = 0xc4562a
      cyls.push(...pouf(-6.4, 5.9, 0x8a5a32), ...pouf(-5.5, 6.2, 0xa87a4a), ...pouf(-4.6, 5.8, 0x8a5a32))
      add(zumaN(-1.6, 2.2), frameW(4.0, 2.1, 0.9, 1.2, 0xe6c27a))
      boxes.push(bx(4.2, 5.0, 2.6, 2.75, -6.9, -6.7, 0x7a4a2a), bx(4.4, 4.8, 2.75, 3.1, -6.88, -6.7, 0xc4562a)) // shelf with a calabash
      break
    }
    case 'garki': {
      rug = 0x1f6a4a; trim = 0xf5f0d8; sofa = 0x3a5a3a; bed = 0x2f6a5a
      add(bookshelfS(-6.6, -4.4, 1.8))
      for (let i = 0; i < 4; i++) add(frameN(-2.2 + i * 0.75, 2.4, 0.5, 0.65, 0xf8f4e4, 0x1c1b22))
      boxes.push(bx(8.4, 8.5, 0.0, 2.2, 5.6, 5.7, 0x888888), bx(8.5, 9.4, 1.5, 2.2, 5.6, 5.66, 0x1f9d55), bx(8.5, 9.4, 1.85, 1.9, 5.6, 5.67, 0xffffff)) // flag on a pole
      cyls.push({ cx: 4.6, cy: 2.5, cz: -6.85, r: 0.35, h: 0.06, c: 0xf8f4e4 }) // wall clock
      break
    }
    case 'wuse': {
      rug = 0x6a7a8a; trim = 0xffffff; sofa = 0x44505a; bed = 0x5a6a7a
      cyls.push(...lamp(-6.4, 6.0), ...lamp(3.2, 6.1))
      const p = plant(-6.4, 4.8, 1.5); boxes.push(...p.b)
      add(zumaN(-1.6, 2.3, 0x1c1b22), frameN(4.6, 2.3, 0.8, 1.2, 0x2a2a30, 0x1c1b22))
      boxes.push(bx(-2.5, -0.5, 1.2, 1.3, -6.9, -6.55, 0xdfe6ec)) // floating shelf
      break
    }
    case 'maitama': {
      rug = 0x7a1f2a; trim = 0xd4a017; sofa = 0xa8884a; bed = 0x8a1f3a
      add(curtains([-6.5, 1, 7], 0x8a1f3a), frameN(-1.6, 2.3, 1.0, 1.3, 0xf2ecd8, 0xd4a017), zumaN(4.6, 2.4, 0xd4a017))
      boxes.push(bx(-7.2, -4.6, 0, 0.9, 6.0, 6.7, 0x4a3320), bx(-6.9, -6.6, 0.9, 1.3, 6.2, 6.5, 0xe6e6f0), bx(-5.2, -4.9, 0.9, 1.3, 6.2, 6.5, 0xe6e6f0)) // console table with vases
      const p1 = plant(-3.9, 6.0, 2.0), p2 = plant(3.3, 6.0, 2.0); boxes.push(...p1.b, ...p2.b)
      break
    }
  }
  return { rug, rugTrim: rugTrim(trim), sofa, bed, boxes, cyls }
}
