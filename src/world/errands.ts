// Little side trips for the free time of a day: find somewhere new, or drop in on a friend at home.
// The spot is chosen from the district layout and changes every year, so it is never the same walk twice.
import type { District } from './layout'
import { buildNav, walkable, type Nav } from './nav'

export type ErrandKind = 'explore' | 'visit'
export interface Spot { x: number; z: number }

const navs = new Map<string, Nav>()
const nav = (d: District) => { let n = navs.get(d.theme.id); if (!n) { n = buildNav(d); navs.set(d.theme.id, n) } return n }
const hash = (n: number) => { let h = (n ^ 0x9e3779b9) >>> 0; h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); return (h ^ (h >>> 16)) >>> 0 }

function freeAround(d: District, x: number, z: number): Spot {
  const n = nav(d)
  if (walkable(n, x, z)) return { x, z }
  for (let rad = 0.5; rad <= 8; rad += 0.5) for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2, px = x + Math.cos(a) * rad, pz = z + Math.sin(a) * rad
    if (walkable(n, px, pz)) return { x: px, z: pz }
  }
  return { x, z }
}

/** Where this errand is this year. `seed` should change from year to year (for example the life seed plus the age). */
export function errandSpot(d: District, kind: ErrandKind, seed: number): Spot {
  const s = hash(seed + (kind === 'visit' ? 17 : 91))
  if (kind === 'visit') {
    const houses = d.buildings.filter((b) => !b.place)
    if (!houses.length) return freeAround(d, 20, 0)
    const b = houses[s % houses.length]
    return freeAround(d, (b.rect.x0 + b.rect.x1) / 2, b.rect.z1 + 1.8)
  }
  const n = nav(d)
  const home = d.places.find((p) => p.id === 'home')!.door
  const spots: Spot[] = []
  for (let x = -42; x <= 42; x += 5) for (let z = -42; z <= 42; z += 5) {
    if (!walkable(n, x, z)) continue
    if (d.places.some((p) => Math.hypot(p.door.x - x, p.door.z - z) < 9)) continue
    if (Math.hypot(home.x - x, home.z - z) < 14) continue
    spots.push({ x, z })
  }
  return spots.length ? spots[s % spots.length] : freeAround(d, -30, 30)
}
