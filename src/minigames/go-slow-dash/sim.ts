// Go-Slow Dash simulation. Pure TypeScript: no DOM, no Three.js. Deterministic given (seed, inputs).
import { makeRng, type Rng } from '@engine/core/rng'

export type DashMode = 'foot' | 'danfo'
export type ObstacleKind = 'pothole' | 'cone' | 'goat' | 'wheelbarrow' | 'signboard' | 'stalledDanfo' | 'okada' | 'barrier'
export type Response = 'jump' | 'slide' | 'dodge'
export const OBSTACLE_RESPONSE: Record<ObstacleKind, Response> = {
  pothole: 'jump', cone: 'jump', goat: 'jump', wheelbarrow: 'jump', signboard: 'slide', stalledDanfo: 'dodge', okada: 'dodge', barrier: 'dodge',
}
export type PowerKind = 'magnet' | 'hop' | 'suya'

export interface DashObj {
  id: number
  type: 'obstacle' | 'coin' | 'power' | 'stop'
  kind: string
  lane: number // -1, 0, 1
  dist: number
  y?: number // coin height
  taken?: boolean
  passed?: boolean
  length?: number // stop length
  stopKind?: 'load' | 'drop'
  done?: boolean
}

export interface DashConfig { seed: number; mode: DashMode; hearts: number; assist: boolean; routeId?: string }
export interface MissionDef { id: string; text: string; kind: 'distance' | 'closeCalls' | 'coins' | 'fast' | 'noHit' | 'passengers'; target: number }
export interface Mission extends MissionDef { progress: number; done: boolean }

export type DashEvent =
  | { t: 'coin'; gold: boolean } | { t: 'hit' } | { t: 'jump' } | { t: 'lane' } | { t: 'power'; kind: PowerKind } | { t: 'close' }
  | { t: 'load'; n: number } | { t: 'drop'; n: number; fare: number } | { t: 'mission'; text: string } | { t: 'over' } | { t: 'segment'; name: string } | { t: 'horn' }

export interface RouteSegment { name: string; length: number; theme: 'market' | 'flyover' | 'brt' | 'estate' | 'bridge' }
export const ROUTES: Record<string, RouteSegment[]> = {
  oshodi: [
    { name: 'Oshodi', length: 320, theme: 'market' }, { name: 'Mushin', length: 300, theme: 'market' }, { name: 'Ojuelegba', length: 320, theme: 'flyover' },
    { name: 'Surulere', length: 300, theme: 'estate' }, { name: 'Yaba', length: 320, theme: 'brt' }, { name: 'Third Mainland Bridge', length: 360, theme: 'bridge' },
  ],
}

export const MISSION_POOL: MissionDef[] = [
  { id: 'm_dist600', text: 'Run 600 m in one go', kind: 'distance', target: 600 },
  { id: 'm_dist1000', text: 'Run 1,000 m in one go', kind: 'distance', target: 1000 },
  { id: 'm_close5', text: '5 close calls in one run', kind: 'closeCalls', target: 5 },
  { id: 'm_close10', text: '10 close calls in one run', kind: 'closeCalls', target: 10 },
  { id: 'm_coins30', text: 'Collect 30 coins', kind: 'coins', target: 30 },
  { id: 'm_fast12', text: 'Stay fast for 12 seconds', kind: 'fast', target: 12 },
  { id: 'm_nohit400', text: 'Go 400 m without a hit', kind: 'noHit', target: 400 },
]
export const MISSION_POOL_DANFO: MissionDef[] = [...MISSION_POOL, { id: 'm_pax3', text: 'Deliver 3 passengers', kind: 'passengers', target: 3 }]

export interface DashState {
  cfg: DashConfig
  rng: Rng
  t: number
  dist: number
  speed: number
  maxSpeed: number
  lane: number // target lane index -1..1
  x: number // smoothed lateral position in lane units
  y: number
  vy: number
  slide: number // seconds remaining
  hearts: number
  invuln: number
  objs: DashObj[]
  spawnedTo: number
  nextId: number
  score: number
  coins: number
  closeCalls: number
  aboard: number
  delivered: number
  fares: number
  combo: number
  comboT: number
  powers: Record<PowerKind, number>
  missions: Mission[]
  fastT: number
  sinceHit: number
  loadT: number
  braking: boolean
  over: boolean
  segIndex: number
  queue: ('left' | 'right' | 'jump' | 'slide')[]
  stopsSpawned: number
}

export const LANE_W = 2.6
export const GRAVITY = 38
export const JUMP_V = 14.5
export const MIN_GAP_S = 1.05 // minimum time between obstacle rows (fairness rule)

export function pickMissions(rng: Rng, mode: DashMode): Mission[] {
  const pool = rng.shuffle(mode === 'danfo' ? MISSION_POOL_DANFO : MISSION_POOL)
  const out: Mission[] = []
  const kinds = new Set<string>()
  for (const m of pool) { if (kinds.has(m.kind)) continue; kinds.add(m.kind); out.push({ ...m, progress: 0, done: false }); if (out.length === 3) break }
  return out
}

export function createDash(cfg: DashConfig): DashState {
  const rng = makeRng(cfg.seed)
  return {
    cfg, rng, t: 0, dist: 0, speed: cfg.assist ? 11 : 13, maxSpeed: cfg.assist ? 20 : 28, lane: 0, x: 0, y: 0, vy: 0, slide: 0,
    hearts: cfg.hearts, invuln: 0, objs: [], spawnedTo: 40, nextId: 1, score: 0, coins: 0, closeCalls: 0, aboard: 0, delivered: 0, fares: 0, combo: 1, comboT: 0,
    powers: { magnet: 0, hop: 0, suya: 0 }, missions: pickMissions(rng, cfg.mode), fastT: 0, sinceHit: 0, loadT: 0, braking: false, over: false,
    segIndex: 0, queue: [], stopsSpawned: 0,
  }
}

export interface Row { objs: Omit<DashObj, 'id'>[]; gap: number }

const LOW: ObstacleKind[] = ['pothole', 'cone', 'goat', 'wheelbarrow']
const TALL: ObstacleKind[] = ['stalledDanfo', 'okada', 'barrier']

/** Is the row passable? Used by the spawner and by tests (fairness rule). */
export function rowSolvable(objs: { type: string; kind: string; lane: number }[], mode: DashMode): boolean {
  for (const lane of [-1, 0, 1]) {
    const here = objs.filter((o) => o.type === 'obstacle' && o.lane === lane)
    if (!here.length) return true
    if (mode === 'foot') { if (here.every((o) => OBSTACLE_RESPONSE[o.kind as ObstacleKind] !== 'dodge')) return true }
    // danfo mode: any obstacle blocks the lane (low ones need Super Hop)
  }
  return false
}

export function generateRow(st: DashState): Row {
  const { rng, cfg } = st
  const foot = cfg.mode === 'foot'
  const diff = Math.min(1, st.dist / 1800)
  const r = rng.next()
  const objs: Omit<DashObj, 'id'>[] = []
  const lane = rng.int(-1, 1)
  const free = [-1, 0, 1].filter((l) => l !== lane)
  const kind = (arr: ObstacleKind[]) => rng.pick(arr)
  const speedGap = Math.max(MIN_GAP_S * st.speed, 14)
  let gap = speedGap + rng.int(2, 16 - Math.round(diff * 6))
  if (r < 0.34) {
    // single obstacle + coin trail in a free lane
    const k = foot ? kind([...LOW, ...LOW, 'signboard', ...TALL]) : kind([...LOW, ...TALL])
    objs.push({ type: 'obstacle', kind: k, lane, dist: 0 })
    const cl = rng.pick(free)
    for (let i = 0; i < 5; i++) objs.push({ type: 'coin', kind: 'coin', lane: cl, dist: i * 3, y: 0.9 })
  } else if (r < 0.58) {
    // two lanes blocked, one free
    const freeLane = rng.int(-1, 1)
    for (const l of [-1, 0, 1]) if (l !== freeLane) objs.push({ type: 'obstacle', kind: foot && rng.chance(0.6) ? kind(LOW) : kind(TALL), lane: l, dist: 0 })
    for (let i = 0; i < 4; i++) objs.push({ type: 'coin', kind: 'coin', lane: freeLane, dist: i * 3, y: 0.9 })
  } else if (r < 0.7 && foot) {
    // low wall: jump required, coins arc above
    for (const l of [-1, 0, 1]) objs.push({ type: 'obstacle', kind: kind(LOW), lane: l, dist: 0 })
    for (let i = -2; i <= 2; i++) objs.push({ type: 'coin', kind: 'coin', lane: 0, dist: -4 + (i + 2) * 2, y: 1.2 + 1.8 * (1 - Math.abs(i) / 2) })
  } else if (r < 0.84) {
    // pure coin trail (maybe zig-zag)
    const l0 = rng.int(-1, 1)
    const zig = rng.chance(0.5)
    for (let i = 0; i < 8; i++) objs.push({ type: 'coin', kind: 'coin', lane: zig ? Math.max(-1, Math.min(1, l0 + (i < 4 ? 0 : (l0 === 1 ? -1 : 1)))) : l0, dist: i * 3, y: 0.9 })
    gap = Math.min(gap, speedGap + 4)
  } else if (r < 0.92) {
    const pl = rng.pick([-1, 0, 1])
    objs.push({ type: 'power', kind: foot ? rng.pick(['magnet', 'hop', 'suya']) : rng.pick(['magnet', 'hop', 'suya']), lane: pl, dist: 0 })
    for (let i = 1; i < 4; i++) objs.push({ type: 'coin', kind: 'coin', lane: pl, dist: i * 3, y: 0.9 })
    gap = Math.min(gap, speedGap)
  } else {
    // gold coin cluster
    const l0 = rng.int(-1, 1)
    for (let i = 0; i < 3; i++) objs.push({ type: 'coin', kind: 'gold', lane: l0, dist: i * 2.5, y: 0.9 })
  }
  if (!rowSolvable(objs, cfg.mode)) {
    // enforce fairness: remove one obstacle so a free lane exists
    const idx = objs.findIndex((o) => o.type === 'obstacle')
    if (idx >= 0) objs.splice(idx, 1)
  }
  return { objs, gap }
}

function spawn(st: DashState) {
  while (st.spawnedTo < st.dist + 150) {
    // stops (danfo mode only): every ~330 m
    if (st.cfg.mode === 'danfo' && st.spawnedTo > 120 && st.spawnedTo - 120 > st.stopsSpawned * 330) {
      st.stopsSpawned += 1
      st.objs.push({ id: st.nextId++, type: 'stop', kind: 'stop', lane: 1, dist: st.spawnedTo + 10, length: 40 })
      st.spawnedTo += 70
      continue
    }
    const row = generateRow(st)
    const base = st.spawnedTo
    for (const o of row.objs) st.objs.push({ ...o, id: st.nextId++, dist: base + o.dist })
    st.spawnedTo = base + row.gap
  }
}

export function segmentAt(dist: number, routeId = 'oshodi'): { index: number; seg: RouteSegment; into: number; toNext: number } {
  const route = ROUTES[routeId] ?? ROUTES.oshodi
  const total = route.reduce((a, s) => a + s.length, 0)
  const d = dist % total
  let acc = 0
  for (let i = 0; i < route.length; i++) {
    if (d < acc + route[i].length) return { index: i, seg: route[i], into: d - acc, toNext: acc + route[i].length - d }
    acc += route[i].length
  }
  return { index: 0, seg: route[0], into: 0, toNext: route[0].length }
}

export function stepDash(st: DashState, dt: number): DashEvent[] {
  const ev: DashEvent[] = []
  if (st.over) return ev
  const foot = st.cfg.mode === 'foot'
  st.t += dt
  // inputs
  while (st.queue.length) {
    const a = st.queue.shift()!
    if (a === 'left' && st.lane > -1) { st.lane -= 1; ev.push({ t: 'lane' }) }
    else if (a === 'right' && st.lane < 1) { st.lane += 1; ev.push({ t: 'lane' }) }
    else if (a === 'jump' && st.y <= 0.01 && (foot || st.powers.hop > 0)) { st.vy = JUMP_V * (foot ? 1 : 0.85); st.slide = 0; ev.push({ t: 'jump' }) }
    else if (a === 'slide' && foot) { if (st.y > 0.01) st.vy = -JUMP_V; st.slide = 0.7 }
  }
  // speed
  const target = st.braking && !foot ? 7 : st.maxSpeed
  const ramp = st.cfg.assist ? 0.1 : 0.17
  st.speed += (target - st.speed) * Math.min(1, (st.braking ? 3 : ramp) * dt)
  if (!st.braking) st.speed = Math.min(st.maxSpeed, st.speed + (st.cfg.assist ? 0.12 : 0.2) * dt * 3)
  st.dist += st.speed * dt
  // lateral smoothing (~120 ms)
  st.x += (st.lane - st.x) * Math.min(1, dt * 18)
  // vertical
  if (st.y > 0 || st.vy > 0) { st.vy -= GRAVITY * dt; st.y += st.vy * dt; if (st.y <= 0) { st.y = 0; st.vy = 0 } }
  st.slide = Math.max(0, st.slide - dt)
  st.invuln = Math.max(0, st.invuln - dt)
  for (const k of ['magnet', 'hop', 'suya'] as const) st.powers[k] = Math.max(0, st.powers[k] - dt)
  st.comboT -= dt; if (st.comboT <= 0) st.combo = 1
  st.sinceHit += st.speed * dt
  if (st.speed >= st.maxSpeed * 0.9) st.fastT += dt; else st.fastT = 0

  spawn(st)

  const hitDist = st.cfg.assist ? 0.55 : 0.8
  const laneDx = st.cfg.assist ? 0.42 : 0.5
  for (const o of st.objs) {
    if (o.taken) continue
    const rel = o.dist - st.dist // positive ahead of player
    const dx = Math.abs(o.lane - st.x)
    if (o.type === 'coin') {
      const magnet = st.powers.magnet > 0 && rel > -1 && rel < 9 && dx < 2.2
      if ((rel > -0.8 && rel < 0.8 && dx < 0.7 && (o.y ?? 0.9) - st.y < 1.7 && st.y - (o.y ?? 0.9) < 1.2) || magnet && rel < 1.5) {
        o.taken = true
        st.coins += o.kind === 'gold' ? 4 : 1
        st.combo = Math.min(3, st.combo + (o.kind === 'gold' ? 0.5 : 0.2)); st.comboT = 3
        st.score += Math.round((o.kind === 'gold' ? 40 : 10) * st.combo * (st.powers.suya > 0 ? 2 : 1))
        ev.push({ t: 'coin', gold: o.kind === 'gold' })
      }
    } else if (o.type === 'power') {
      if (rel > -1 && rel < 1 && dx < 0.8) {
        o.taken = true
        st.powers[o.kind as PowerKind] = 6
        if (o.kind === 'suya') st.invuln = Math.max(st.invuln, 3)
        ev.push({ t: 'power', kind: o.kind as PowerKind })
      }
    } else if (o.type === 'obstacle') {
      const resp = OBSTACLE_RESPONSE[o.kind as ObstacleKind]
      if (!o.passed && rel < -hitDist) {
        o.passed = true
        if (!o.taken) {
          if (dx < 1.5 && dx > 0.7 || (dx <= 0.7 && dx >= laneDx && st.invuln <= 0)) {
            st.closeCalls += 1; st.score += 25; ev.push({ t: 'close' })
          }
        }
      }
      if (!o.passed && Math.abs(rel) < hitDist && dx < laneDx + 0.2 && st.invuln <= 0) {
        let clears = false
        if (resp === 'jump') clears = foot ? st.y > 0.7 : st.y > 0.7 && st.powers.hop > 0
        else if (resp === 'slide') clears = foot && st.slide > 0
        if (!clears) {
          st.hearts -= 1; st.invuln = 1.3; st.sinceHit = 0; st.combo = 1
          st.speed = Math.max(8, st.speed * 0.72)
          o.passed = true
          ev.push({ t: 'hit' })
          if (st.hearts <= 0) { st.over = true; ev.push({ t: 'over' }) }
        }
      }
    } else if (o.type === 'stop' && !o.done) {
      const len = o.length ?? 40
      const inZone = rel < 2 && rel > -len && Math.abs(st.x - 1) < 0.6
      if (rel < -len) { o.done = true; continue }
      if (inZone && st.speed < 11 && !foot) {
        st.loadT += dt
        if (st.loadT >= 0.9) {
          st.loadT = 0; o.done = true
          if (st.aboard === 0) { const n = st.rng.int(1, 3); st.aboard = n; ev.push({ t: 'load', n }) }
          else {
            const fare = st.aboard * 1500
            st.fares += fare; st.delivered += st.aboard; st.score += st.aboard * 50
            ev.push({ t: 'drop', n: st.aboard, fare }); st.aboard = 0
          }
        }
      } else st.loadT = Math.max(0, st.loadT - dt)
    }
  }
  // cleanup
  if (st.objs.length > 220) st.objs = st.objs.filter((o) => o.dist > st.dist - 12)
  // distance score
  st.score += Math.round(st.speed * dt * (st.powers.suya > 0 ? 2 : 1) * 0.5)
  // segment
  const seg = segmentAt(st.dist, st.cfg.routeId)
  if (seg.index !== st.segIndex) { st.segIndex = seg.index; ev.push({ t: 'segment', name: seg.seg.name }) }
  // missions
  for (const m of st.missions) {
    if (m.done) continue
    m.progress = m.kind === 'distance' ? st.dist : m.kind === 'closeCalls' ? st.closeCalls : m.kind === 'coins' ? st.coins : m.kind === 'fast' ? st.fastT : m.kind === 'noHit' ? st.sinceHit : st.delivered
    if (m.progress >= m.target) { m.done = true; ev.push({ t: 'mission', text: m.text }); st.score += 150 }
  }
  return ev
}

export interface DashResult { coins: number; distance: number; closeCalls: number; passengers: number; mode: DashMode; score: number; fares: number; missionsDone: number }
export function resultOf(st: DashState): DashResult {
  return { coins: st.coins, distance: Math.round(st.dist), closeCalls: st.closeCalls, passengers: st.delivered, mode: st.cfg.mode, score: st.score, fares: st.fares, missionsDone: st.missions.filter((m) => m.done).length }
}
