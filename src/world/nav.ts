// Collision and pathfinding over a district. Pure TypeScript.
import type { District, Rect } from './layout'
import { WORLD } from './layout'

export const PLAYER_R = 0.45
const CELL = 1
const N = WORLD.half * 2 / CELL

export interface Nav { blocked: Uint8Array; n: number }

const ci = (v: number) => Math.floor((v + WORLD.half) / CELL)

export function buildNav(d: District): Nav {
  const blocked = new Uint8Array(N * N)
  for (const b of d.blockers) {
    const x0 = Math.max(0, ci(b.x0 - PLAYER_R)), x1 = Math.min(N - 1, ci(b.x1 + PLAYER_R)), z0 = Math.max(0, ci(b.z0 - PLAYER_R)), z1 = Math.min(N - 1, ci(b.z1 + PLAYER_R))
    for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) blocked[z * N + x] = 1
  }
  // world edge is blocked
  for (let i = 0; i < N; i++) { blocked[i] = 1; blocked[(N - 1) * N + i] = 1; blocked[i * N] = 1; blocked[i * N + N - 1] = 1 }
  return { blocked, n: N }
}

const cell = (nav: Nav, x: number, z: number) => nav.blocked[ci(z) * nav.n + ci(x)] === 1

export function walkable(nav: Nav, x: number, z: number): boolean {
  if (x < -WORLD.half + 1 || x > WORLD.half - 1 || z < -WORLD.half + 1 || z > WORLD.half - 1) return false
  return !cell(nav, x, z)
}

/** Move with simple axis-separated collision against the blocker rects (slides along walls). */
export function moveWithCollision(blockers: Rect[], x: number, z: number, dx: number, dz: number): { x: number; z: number } {
  const hit = (px: number, pz: number) => {
    if (px < -WORLD.half + 1 || px > WORLD.half - 1 || pz < -WORLD.half + 1 || pz > WORLD.half - 1) return true
    for (const b of blockers) if (px > b.x0 - PLAYER_R && px < b.x1 + PLAYER_R && pz > b.z0 - PLAYER_R && pz < b.z1 + PLAYER_R) return true
    return false
  }
  let nx = x, nz = z
  if (!hit(x + dx, z)) nx = x + dx
  if (!hit(nx, z + dz)) nz = z + dz
  return { x: nx, z: nz }
}

/** Is the straight segment free of blocked cells? */
function lineClear(nav: Nav, ax: number, az: number, bx: number, bz: number): boolean {
  const steps = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.4)
  for (let i = 0; i <= steps; i++) { const t = i / Math.max(1, steps); if (cell(nav, ax + (bx - ax) * t, az + (bz - az) * t)) return false }
  return true
}

export function findPath(nav: Nav, from: { x: number; z: number }, to: { x: number; z: number }): { x: number; z: number }[] | null {
  const sx = ci(from.x), sz = ci(from.z)
  let gx = ci(to.x), gz = ci(to.z)
  const n = nav.n
  const inb = (x: number, z: number) => x >= 0 && z >= 0 && x < n && z < n
  if (!inb(sx, sz) || !inb(gx, gz)) return null
  // if the goal is blocked, snap to the nearest free cell
  if (nav.blocked[gz * n + gx]) {
    let best: [number, number] | null = null, bd = 1e9
    for (let dz = -6; dz <= 6; dz++) for (let dx = -6; dx <= 6; dx++) { const x = gx + dx, z = gz + dz; if (inb(x, z) && !nav.blocked[z * n + x]) { const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = [x, z] } } }
    if (!best) return null
    ;[gx, gz] = best
  }
  const key = (x: number, z: number) => z * n + x
  const g = new Map<number, number>(), came = new Map<number, number>()
  const open: { k: number; f: number }[] = []
  const push = (k: number, f: number) => { open.push({ k, f }); open.sort((a, b) => b.f - a.f) }
  const start = key(sx, sz)
  g.set(start, 0); push(start, 0)
  const h = (x: number, z: number) => Math.hypot(x - gx, z - gz)
  const closed = new Set<number>()
  let found = false
  let guard = 0
  while (open.length && guard++ < 20000) {
    const cur = open.pop()!.k
    if (closed.has(cur)) continue
    closed.add(cur)
    const cx = cur % n, cz = Math.floor(cur / n)
    if (cx === gx && cz === gz) { found = true; break }
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue
      const nx = cx + dx, nz = cz + dz
      if (!inb(nx, nz) || nav.blocked[key(nx, nz)]) continue
      if (dx && dz && (nav.blocked[key(cx + dx, cz)] || nav.blocked[key(cx, cz + dz)])) continue // no corner cutting
      const nk = key(nx, nz)
      const ng = (g.get(cur) ?? 0) + (dx && dz ? 1.414 : 1)
      if (ng < (g.get(nk) ?? Infinity)) { g.set(nk, ng); came.set(nk, cur); push(nk, ng + h(nx, nz)) }
    }
  }
  if (!found) return null
  const cells: { x: number; z: number }[] = []
  for (let k: number | undefined = key(gx, gz); k !== undefined; k = came.get(k)) cells.push({ x: (k % n) * CELL - WORLD.half + CELL / 2, z: Math.floor(k / n) * CELL - WORLD.half + CELL / 2 })
  cells.reverse()
  // string-pulling: keep only the corners we need
  const out = [cells[0]]
  let anchor = 0
  for (let i = 2; i < cells.length; i++) {
    if (!lineClear(nav, cells[anchor].x, cells[anchor].z, cells[i].x, cells[i].z)) { out.push(cells[i - 1]); anchor = i - 1 }
  }
  out.push(cells[cells.length - 1])
  return out.slice(1)
}
