// Collision and pathfinding over a rectangular area (a district or an interior). Pure TypeScript.
import type { District, Rect } from './layout'
import { WORLD } from './layout'

export const PLAYER_R = 0.45

export interface Nav { blocked: Uint8Array; w: number; h: number; x0: number; z0: number; cell: number; bounds: Rect }

export function buildNavFor(blockers: Rect[], bounds: Rect, cell = 1, pad = PLAYER_R): Nav {
  const w = Math.ceil((bounds.x1 - bounds.x0) / cell), h = Math.ceil((bounds.z1 - bounds.z0) / cell)
  const nav: Nav = { blocked: new Uint8Array(w * h), w, h, x0: bounds.x0, z0: bounds.z0, cell, bounds }
  for (const b of blockers) {
    const cx0 = Math.max(0, Math.floor((b.x0 - pad - bounds.x0) / cell)), cx1 = Math.min(w - 1, Math.floor((b.x1 + pad - bounds.x0) / cell))
    const cz0 = Math.max(0, Math.floor((b.z0 - pad - bounds.z0) / cell)), cz1 = Math.min(h - 1, Math.floor((b.z1 + pad - bounds.z0) / cell))
    for (let z = cz0; z <= cz1; z++) for (let x = cx0; x <= cx1; x++) nav.blocked[z * w + x] = 1
  }
  for (let i = 0; i < w; i++) { nav.blocked[i] = 1; nav.blocked[(h - 1) * w + i] = 1 }
  for (let i = 0; i < h; i++) { nav.blocked[i * w] = 1; nav.blocked[i * w + w - 1] = 1 }
  return nav
}

export function buildNav(d: District): Nav {
  return buildNavFor(d.blockers, { x0: -WORLD.half, x1: WORLD.half, z0: -WORLD.half, z1: WORLD.half }, 1)
}

const cx = (nav: Nav, x: number) => Math.floor((x - nav.x0) / nav.cell)
const cz = (nav: Nav, z: number) => Math.floor((z - nav.z0) / nav.cell)
const inb = (nav: Nav, x: number, z: number) => x >= 0 && z >= 0 && x < nav.w && z < nav.h
const isBlocked = (nav: Nav, x: number, z: number) => !inb(nav, cx(nav, x), cz(nav, z)) || nav.blocked[cz(nav, z) * nav.w + cx(nav, x)] === 1

export function walkable(nav: Nav, x: number, z: number): boolean { return !isBlocked(nav, x, z) }

/** Move with simple axis-separated collision against the blocker rects (slides along walls). */
export function moveWithCollision(blockers: Rect[], x: number, z: number, dx: number, dz: number, bounds: Rect = { x0: -WORLD.half, x1: WORLD.half, z0: -WORLD.half, z1: WORLD.half }): { x: number; z: number } {
  const hit = (px: number, pz: number) => {
    if (px < bounds.x0 + 0.8 || px > bounds.x1 - 0.8 || pz < bounds.z0 + 0.8 || pz > bounds.z1 - 0.2) return true
    for (const b of blockers) if (px > b.x0 - PLAYER_R && px < b.x1 + PLAYER_R && pz > b.z0 - PLAYER_R && pz < b.z1 + PLAYER_R) return true
    return false
  }
  let nx = x, nz = z
  if (!hit(x + dx, z)) nx = x + dx
  if (!hit(nx, z + dz)) nz = z + dz
  return { x: nx, z: nz }
}

function lineClear(nav: Nav, ax: number, az: number, bx: number, bz: number): boolean {
  const steps = Math.ceil(Math.hypot(bx - ax, bz - az) / (nav.cell * 0.4))
  for (let i = 0; i <= steps; i++) { const t = i / Math.max(1, steps); if (isBlocked(nav, ax + (bx - ax) * t, az + (bz - az) * t)) return false }
  return true
}

export function findPath(nav: Nav, from: { x: number; z: number }, to: { x: number; z: number }): { x: number; z: number }[] | null {
  const sx = cx(nav, from.x), sz = cz(nav, from.z)
  let gx = cx(nav, to.x), gz = cz(nav, to.z)
  const n = nav.w
  if (!inb(nav, sx, sz) || !inb(nav, gx, gz)) return null
  if (nav.blocked[gz * n + gx]) {
    let best: [number, number] | null = null, bd = 1e9
    for (let dz = -8; dz <= 8; dz++) for (let dx = -8; dx <= 8; dx++) { const x = gx + dx, z = gz + dz; if (inb(nav, x, z) && !nav.blocked[z * n + x]) { const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = [x, z] } } }
    if (!best) return null
    ;[gx, gz] = best
  }
  const key = (x: number, z: number) => z * n + x
  const g = new Map<number, number>(), came = new Map<number, number>()
  const open: { k: number; f: number }[] = []
  const push = (k: number, f: number) => { open.push({ k, f }); open.sort((a, b) => b.f - a.f) }
  const start = key(sx, sz)
  g.set(start, 0); push(start, 0)
  const hh = (x: number, z: number) => Math.hypot(x - gx, z - gz)
  const closed = new Set<number>()
  let found = false, guard = 0
  while (open.length && guard++ < 30000) {
    const cur = open.pop()!.k
    if (closed.has(cur)) continue
    closed.add(cur)
    const x = cur % n, z = Math.floor(cur / n)
    if (x === gx && z === gz) { found = true; break }
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue
      const nx = x + dx, nz = z + dz
      if (!inb(nav, nx, nz) || nav.blocked[key(nx, nz)]) continue
      if (dx && dz && (nav.blocked[key(x + dx, z)] || nav.blocked[key(x, z + dz)])) continue
      const nk = key(nx, nz)
      const ng = (g.get(cur) ?? 0) + (dx && dz ? 1.414 : 1)
      if (ng < (g.get(nk) ?? Infinity)) { g.set(nk, ng); came.set(nk, cur); push(nk, ng + hh(nx, nz)) }
    }
  }
  if (!found) return null
  const cells: { x: number; z: number }[] = []
  for (let k: number | undefined = key(gx, gz); k !== undefined; k = came.get(k)) cells.push({ x: (k % n) * nav.cell + nav.x0 + nav.cell / 2, z: Math.floor(k / n) * nav.cell + nav.z0 + nav.cell / 2 })
  cells.reverse()
  const out = [cells[0]]
  let anchor = 0
  for (let i = 2; i < cells.length; i++) {
    if (!lineClear(nav, cells[anchor].x, cells[anchor].z, cells[i].x, cells[i].z)) { out.push(cells[i - 1]); anchor = i - 1 }
  }
  out.push(cells[cells.length - 1])
  return out.slice(1)
}
