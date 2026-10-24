// Go-Slow Dash simulation. Pure TypeScript: no DOM, no Three.js. Deterministic given (seed, inputs).
import { makeRng, type Rng } from '@engine/core/rng'

export type DashMode = 'foot' | 'danfo'
export type ObstacleKind = 'pothole' | 'cone' | 'goat' | 'wheelbarrow' | 'signboard' | 'stalledDanfo' | 'okada' | 'barrier'
  | 'car' | 'train' | 'plane' | 'bigBus' | 'walker' | 'crowd' | 'shack' | 'bird' | 'drone' | 'kite'
/** jump over it, slide under it, change lane, or (bigBus) jump on top and ride it */
export type Response = 'jump' | 'slide' | 'dodge' | 'climb'
export const OBSTACLE_RESPONSE: Record<ObstacleKind, Response> = {
  pothole: 'jump', cone: 'jump', goat: 'jump', wheelbarrow: 'jump', signboard: 'slide', stalledDanfo: 'dodge', okada: 'dodge', barrier: 'dodge',
  car: 'dodge', train: 'dodge', plane: 'slide', bigBus: 'climb', walker: 'jump', crowd: 'dodge', shack: 'dodge', bird: 'dodge', drone: 'dodge', kite: 'dodge',
}
/** things in the sky only matter while flying; on the ground they pass far overhead */
export const SKY_KINDS: ReadonlySet<string> = new Set(['bird', 'drone', 'kite'])
export const isSky = (kind: string) => SKY_KINDS.has(kind)
/** objects with a length are anchored at their near edge and run away from the player */
export const OBSTACLE_LEN: Partial<Record<ObstacleKind, number>> = { car: 4, train: 20, bigBus: 11 }
export const BUS_ROOF = 1.8
export type PowerKind = 'magnet' | 'hop' | 'suya' | 'boost' | 'wings'
export const POWER_KINDS: PowerKind[] = ['magnet', 'hop', 'suya', 'boost', 'wings']
/** things to ride: a speed bonus for a while, and one hit is absorbed (the ride breaks instead of costing a heart) */
export type RideKind = 'skate' | 'bike' | 'canoe'
export const RIDE_FACTOR: Record<RideKind, number> = { skate: 1.2, bike: 1.35, canoe: 1.28 }
export const RIDE_SECS = 10, BOOST_SECS = 5, WINGS_SECS = 7
export const FLY_Y = 4.6
export const isRide = (k: string): k is RideKind => k === 'skate' || k === 'bike' || k === 'canoe'

export interface DashObj {
  id: number
  type: 'obstacle' | 'coin' | 'power' | 'stop' | 'tunnel' | 'decor'
  kind: string
  lane: number // -1, 0, 1
  dist: number
  y?: number // coin height
  taken?: boolean
  passed?: boolean
  length?: number // stop length
  stopKind?: 'load' | 'drop'
  done?: boolean
  x?: number // lateral position of something that walks across the road
  dir?: number // -1 or 1 while it crosses
  wide?: boolean // blocks every lane (a plane taxiing across the road)
  ridden?: boolean // a bus the player has already climbed
}

export interface DashConfig { seed: number; mode: DashMode; hearts: number; assist: boolean; routeId?: string }
export interface MissionDef { id: string; text: string; kind: 'distance' | 'closeCalls' | 'coins' | 'fast' | 'noHit' | 'passengers'; target: number }
export interface Mission extends MissionDef { progress: number; done: boolean }

export type DashEvent =
  | { t: 'coin'; gold: boolean } | { t: 'hit' } | { t: 'jump' } | { t: 'lane' } | { t: 'power'; kind: PowerKind } | { t: 'close' }
  | { t: 'ride'; kind: RideKind } | { t: 'rideBreak' } | { t: 'fly' } | { t: 'knock' } | { t: 'boost' }
  | { t: 'load'; n: number } | { t: 'drop'; n: number; fare: number } | { t: 'mission'; text: string } | { t: 'over' } | { t: 'segment'; name: string } | { t: 'horn' } | { t: 'level'; n: number; name: string } | { t: 'roof' }

export interface RouteSegment { name: string; length: number; theme: 'market' | 'flyover' | 'brt' | 'estate' | 'bridge' }
export const ROUTES: Record<string, RouteSegment[]> = {
  oshodi: [
    { name: 'Oshodi', length: 320, theme: 'market' }, { name: 'Mushin', length: 300, theme: 'market' }, { name: 'Ojuelegba', length: 320, theme: 'flyover' },
    { name: 'Surulere', length: 300, theme: 'estate' }, { name: 'Yaba', length: 320, theme: 'brt' }, { name: 'Third Mainland Bridge', length: 360, theme: 'bridge' },
  ],
  abuja: [
    { name: 'Nyanya', length: 320, theme: 'market' }, { name: 'Wuse Market', length: 300, theme: 'market' }, { name: 'Area 1 Flyover', length: 320, theme: 'flyover' },
    { name: 'Garki', length: 300, theme: 'estate' }, { name: 'Wuse II', length: 320, theme: 'brt' }, { name: 'Jabi Lake', length: 360, theme: 'bridge' },
  ],
}

export interface LevelDef { name: string; at: number; tip: string }
/** The longer you stay on the road, the harder it gets. Each level starts at a distance and brings new things onto the road. */
export const LEVELS: LevelDef[] = [
  { name: 'Warm-up', at: 0, tip: 'Potholes and cones. Easy does it.' },
  { name: 'Rush hour', at: 350, tip: 'Okadas and goats are out. Faster now.' },
  { name: 'Market day', at: 800, tip: 'Cars, shops and people crossing the road.' },
  { name: 'Junction wahala', at: 1350, tip: 'Crowds at the junction, and tunnels ahead.' },
  { name: 'Rail crossing', at: 2000, tip: 'Trains! Jump ON the big buses to ride them.' },
  { name: 'Airport road', at: 2750, tip: 'A plane is crossing. Slide under its wing.' },
  { name: 'Full Naija', at: 3600, tip: 'Everything at once. Stay sharp.' },
  { name: 'Wahala no dey finish', at: 4600, tip: 'Legend territory. No mercy.' },
]
export const levelAt = (dist: number): number => { let n = 1; for (let i = 0; i < LEVELS.length; i++) if (dist >= LEVELS[i].at) n = i + 1; return n }
export const maxSpeedFor = (cfg: { assist: boolean }, level: number) => cfg.assist ? Math.min(26, 18 + 1.3 * (level - 1)) : Math.min(38, 24 + 1.8 * (level - 1))

export const TUNNEL_FIRST = 1000, TUNNEL_EVERY = 1100, TUNNEL_LEN = 70
export const tunnelStart = (k: number) => TUNNEL_FIRST + k * TUNNEL_EVERY
export const inTunnel = (d: number) => { if (d < TUNNEL_FIRST - 12) return false; const k = Math.floor((d - TUNNEL_FIRST + 12) / TUNNEL_EVERY); const a = tunnelStart(k); return d > a - 12 && d < a + TUNNEL_LEN + 12 }

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
  ride: { kind: RideKind; t: number } | null
  extras: { boost: number; ride: number; wings: number; canoe: number }
  missions: Mission[]
  fastT: number
  sinceHit: number
  loadT: number
  braking: boolean
  over: boolean
  segIndex: number
  queue: ('left' | 'right' | 'jump' | 'slide')[]
  stopsSpawned: number
  level: number
  tunnelsSpawned: number
  evRng: Rng // loading passengers etc. draw from this so the road itself is the same for everyone with the same seed
  floor: number // height of whatever the player is standing on (0 = road, BUS_ROOF = on top of a bus)
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
    cfg, rng, evRng: makeRng(cfg.seed ^ 0x5bd1e995), level: 1, tunnelsSpawned: 0, floor: 0, t: 0, dist: 0, speed: cfg.assist ? 11 : 13, maxSpeed: maxSpeedFor(cfg, 1), lane: 0, x: 0, y: 0, vy: 0, slide: 0,
    hearts: cfg.hearts, invuln: 0, objs: [], spawnedTo: 40, nextId: 1, score: 0, coins: 0, closeCalls: 0, aboard: 0, delivered: 0, fares: 0, combo: 1, comboT: 0,
    powers: { magnet: 0, hop: 0, suya: 0, boost: 0, wings: 0 }, ride: null, extras: { boost: 0, ride: 0, wings: 0, canoe: 0 }, missions: pickMissions(rng, cfg.mode), fastT: 0, sinceHit: 0, loadT: 0, braking: false, over: false,
    segIndex: 0, queue: [], stopsSpawned: 0,
  }
}

export interface Row { objs: Omit<DashObj, 'id'>[]; gap: number }

/** Is the row passable? Used by the spawner and by tests (fairness rule). */
export function rowSolvable(objs: { type: string; kind: string; lane: number; wide?: boolean }[], mode: DashMode): boolean {
  for (const lane of [-1, 0, 1]) {
    const here = objs.filter((o) => o.type === 'obstacle' && (o.lane === lane || o.wide))
    if (!here.length) return true
    if (mode === 'foot') { if (here.every((o) => OBSTACLE_RESPONSE[o.kind as ObstacleKind] !== 'dodge')) return true }
    // danfo mode: any obstacle blocks the lane (low ones need Super Hop)
  }
  return false
}

/** What can appear on the road at each level. The course depends only on the position along the road and the seed, so two runners with the same seed meet the same road. */
function pools(level: number, foot: boolean) {
  const low: ObstacleKind[] = ['pothole', 'cone']
  if (level >= 2) low.push('goat', 'wheelbarrow')
  if (level >= 3) low.push('walker')
  const tall: ObstacleKind[] = ['barrier']
  if (level >= 2) tall.push('okada')
  if (level >= 3) tall.push('car', 'shack')
  if (level >= 4) tall.push('stalledDanfo', 'crowd')
  const slide: ObstacleKind[] = level >= 3 && foot ? ['signboard'] : []
  return foot ? { low, tall, slide, block: tall } : { low: [] as ObstacleKind[], tall: [...low, ...tall], slide, block: [...low, ...tall] }
}

export function generateRow(st: DashState): Row {
  const { rng, cfg } = st
  const foot = cfg.mode === 'foot'
  const pos = st.spawnedTo
  const lvl = levelAt(pos)
  const hard = Math.min(1, (lvl - 1) / 6)
  const tunnel = inTunnel(pos)
  const pool = pools(lvl, foot)
  const objs: Omit<DashObj, 'id'>[] = []
  const lane = rng.int(-1, 1)
  const free = [-1, 0, 1].filter((l) => l !== lane)
  const speedGap = Math.max(MIN_GAP_S * maxSpeedFor(cfg, lvl), 14)
  let gap = speedGap + rng.int(2, Math.max(4, Math.round(16 - lvl * 1.5)))
  const ob = (kind: ObstacleKind, l: number, d = 0, extra: Partial<DashObj> = {}) => {
    const len = OBSTACLE_LEN[kind]
    objs.push({ type: 'obstacle', kind, lane: l, dist: d, ...(len ? { length: len } : {}), ...(kind === 'plane' ? { wide: true } : {}), ...extra })
  }
  const walker = (l: number) => ob('walker', l, 0, { x: l, dir: foot ? (l === 0 ? (rng.chance(0.5) ? -1 : 1) : -l) : 0 })
  const coins = (l: number, n: number, y = 0.9, step = 3, d0 = 0, kind = 'coin') => { for (let i = 0; i < n; i++) objs.push({ type: 'coin', kind, lane: l, dist: d0 + i * step, y }) }
  const lowOrTall = () => foot ? rng.pick([...pool.low, ...pool.low, ...pool.slide, ...pool.tall] as ObstacleKind[]) : rng.pick(pool.tall)
  const place = (k: ObstacleKind, l: number, d = 0) => (k === 'walker' ? walker(l) : ob(k, l, d))

  // weighted pattern choice; patterns that do not exist yet at this level have weight 0
  const W: [string, number][] = [
    ['single', 0.3 - 0.1 * hard], ['two', 0.22 + 0.1 * hard], ['wall', foot ? 0.1 : 0], ['trail', 0.12], ['power', 0.06], ['gold', 0.04],
    ['cross', lvl >= 3 ? 0.08 : 0], ['junction', lvl >= 4 && !tunnel ? 0.07 : 0], ['train', lvl >= 5 ? 0.07 : 0],
    ['bus', lvl >= 5 && foot ? 0.08 : 0], ['plane', lvl >= 6 && foot && !tunnel ? 0.05 : 0],
  ]
  let r = rng.next() * W.reduce((a, [, w]) => a + w, 0), pat = 'single'
  for (const [k, w] of W) { if (r < w) { pat = k; break } r -= w }

  if (pat === 'single') {
    ob(lowOrTall(), lane)
    coins(rng.pick(free), 5)
  } else if (pat === 'two') {
    const freeLane = rng.int(-1, 1)
    for (const l of [-1, 0, 1]) if (l !== freeLane) place(foot && rng.chance(0.6) ? rng.pick(pool.low.length ? pool.low : pool.tall) : rng.pick(pool.tall), l)
    coins(freeLane, 4)
  } else if (pat === 'wall') {
    // low wall: jump required, coins arc above
    for (const l of [-1, 0, 1]) place(rng.pick(pool.low), l)
    for (let i = -2; i <= 2; i++) objs.push({ type: 'coin', kind: 'coin', lane: 0, dist: -4 + (i + 2) * 2, y: 1.2 + 1.8 * (1 - Math.abs(i) / 2) })
  } else if (pat === 'trail') {
    const l0 = rng.int(-1, 1)
    const zig = rng.chance(0.5)
    for (let i = 0; i < 8; i++) objs.push({ type: 'coin', kind: 'coin', lane: zig ? Math.max(-1, Math.min(1, l0 + (i < 4 ? 0 : (l0 === 1 ? -1 : 1)))) : l0, dist: i * 3, y: 0.9 })
    gap = Math.min(gap, speedGap + 4)
  } else if (pat === 'power') {
    const pl = rng.pick([-1, 0, 1])
    objs.push({ type: 'power', kind: rng.pick(['magnet', 'hop', 'suya']), lane: pl, dist: 0 })
    coins(pl, 3, 0.9, 3, 3)
    gap = Math.min(gap, speedGap)
  } else if (pat === 'gold') {
    coins(rng.int(-1, 1), 3, 0.9, 2.5, 0, 'gold')
  } else if (pat === 'cross') {
    // people crossing the road: in foot mode they walk across lanes, so keep an eye on them
    walker(lane); if (rng.chance(0.6)) walker(rng.pick(free))
    coins(rng.pick([-1, 0, 1]), 4, 0.9, 3, 4)
  } else if (pat === 'junction') {
    // a junction: zebra crossing, traffic light and a crowd standing at the edge waiting
    objs.push({ type: 'decor', kind: 'junction', lane: 0, dist: 0, length: 12 })
    ob('crowd', lane, 4)
    if (foot && rng.chance(0.6)) walker(rng.pick(free))
    coins(rng.pick(free), 5, 0.9, 3, 4)
    gap = Math.max(gap, speedGap + 10)
  } else if (pat === 'train') {
    ob('train', lane); if (rng.chance(0.4 + 0.3 * hard)) ob('train', rng.pick(free))
    coins(rng.pick([-1, 0, 1]), 5, 0.9, 3, 4)
    gap = Math.max(gap, speedGap + 24)
  } else if (pat === 'bus') {
    // a big bus: jump on top, ride it and collect the coins on its roof
    ob('bigBus', lane)
    for (let i = 0; i < 4; i++) objs.push({ type: 'coin', kind: i === 3 ? 'gold' : 'coin', lane, dist: 2 + i * 2.2, y: BUS_ROOF + 0.9 })
    coins(rng.pick(free), 5, 0.9, 3, 0)
    gap = Math.max(gap, speedGap + 16)
  } else if (pat === 'plane') {
    ob('plane', 0)
    coins(0, 3, 0.9, 2.5, 3)
    gap = Math.max(gap, speedGap + 6)
  }
  if (!rowSolvable(objs, cfg.mode)) {
    // enforce fairness: remove one obstacle so a free lane exists
    const idx = objs.findIndex((o) => o.type === 'obstacle')
    if (idx >= 0) objs.splice(idx, 1)
  }
  return { objs, gap }
}

/** Stable hash of (seed, index, salt): the extras below depend only on the seed and the position, so both runners in a race meet the same ones. */
const hash = (seed: number, k: number, salt: number) => { let h = Math.imul(seed ^ Math.imul(k + 1, 0x9e3779b1) ^ salt, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); return (h ^ (h >>> 16)) >>> 0 }
export const BOOST_FIRST = 220, BOOST_EVERY = 300, RIDE_FIRST = 480, RIDE_EVERY = 620, WINGS_FIRST = 380, WINGS_EVERY = 700
export const SKY_STEP = 24, SKY_STEPS = 8
export const boostAt = (seed: number, k: number) => BOOST_FIRST + k * BOOST_EVERY + (hash(seed, k, 1) % 60)
export const rideAt = (seed: number, k: number) => RIDE_FIRST + k * RIDE_EVERY + (hash(seed, k, 2) % 60)
export const wingsAt = (seed: number, k: number) => WINGS_FIRST + k * WINGS_EVERY + (hash(seed, k, 3) % 60)
/** a canoe waits at the start of every bridge stretch */
export function canoeAt(routeId: string | undefined, k: number): number {
  const route = ROUTES[routeId ?? 'oshodi'] ?? ROUTES.oshodi
  const total = route.reduce((a, r) => a + r.length, 0)
  let acc = 0; for (const r of route) { if (r.theme === 'bridge') break; acc += r.length }
  return k * total + acc + 24
}

/** the lane with the fewest obstacles near this spot, starting from a preferred lane */
function clearLane(st: DashState, at: number, pref: number): number {
  const busy = (l: number) => st.objs.some((o) => o.type === 'obstacle' && !isSky(o.kind) && (o.lane === l || o.wide) && Math.abs(o.dist - at) < 10 + (o.length ?? 0))
  for (const l of [pref, ...[-1, 0, 1].filter((x) => x !== pref)]) if (!busy(l)) return l
  return pref
}

function placeExtras(st: DashState) {
  const { seed } = st.cfg
  const add = (o: Omit<DashObj, 'id'>) => st.objs.push({ ...o, id: st.nextId++ })
  const ex = st.extras
  while (boostAt(seed, ex.boost) < st.spawnedTo) { const d = boostAt(seed, ex.boost); add({ type: 'power', kind: 'boost', lane: clearLane(st, d, (hash(seed, ex.boost, 11) % 3) - 1), dist: d }); ex.boost++ }
  while (rideAt(seed, ex.ride) < st.spawnedTo) { const d = rideAt(seed, ex.ride); add({ type: 'power', kind: ex.ride % 2 ? 'bike' : 'skate', lane: clearLane(st, d, (hash(seed, ex.ride, 12) % 3) - 1), dist: d }); ex.ride++ }
  while (canoeAt(st.cfg.routeId, ex.canoe) < st.spawnedTo) { const d = canoeAt(st.cfg.routeId, ex.canoe); if (d > 100) add({ type: 'power', kind: 'canoe', lane: clearLane(st, d, 0), dist: d }); ex.canoe++ }
  while (wingsAt(seed, ex.wings) < st.spawnedTo) {
    const k = ex.wings, d = wingsAt(seed, k)
    add({ type: 'power', kind: 'wings', lane: clearLane(st, d, (hash(seed, k, 13) % 3) - 1), dist: d })
    // the sky stretch after it: coins in the air and birds, drones and kites to dodge, one per row, never closer than a safe gap
    const kinds: ObstacleKind[] = ['bird', 'drone', 'kite']
    for (let i = 0; i < SKY_STEPS; i++) {
      const at = d + 34 + i * SKY_STEP
      const obLane = (hash(seed, k * 31 + i, 14) % 3) - 1
      if (i % 2 === 1) add({ type: 'obstacle', kind: kinds[hash(seed, k * 31 + i, 15) % 3], lane: obLane, dist: at })
      const cl = (obLane + 1 + (hash(seed, k * 31 + i, 16) % 2) + 1) % 3 - 1 // a lane that is not the obstacle's
      for (let c = 0; c < 3; c++) add({ type: 'coin', kind: c === 2 && i % 4 === 3 ? 'gold' : 'coin', lane: i % 2 === 1 ? cl : obLane, dist: at + c * 3 - 6, y: FLY_Y })
    }
    ex.wings++
  }
}

function spawn(st: DashState) {
  while (st.spawnedTo < st.dist + 150) {
    // tunnels sit at fixed places along the road
    while (tunnelStart(st.tunnelsSpawned) < st.dist + 150) {
      st.objs.push({ id: st.nextId++, type: 'tunnel', kind: 'tunnel', lane: 0, dist: tunnelStart(st.tunnelsSpawned), length: TUNNEL_LEN })
      st.tunnelsSpawned += 1
    }
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
    placeExtras(st)
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

function hurt(st: DashState, o: DashObj, ev: DashEvent[]) {
  if (st.ride) { st.ride = null; st.invuln = 1.1; o.passed = true; ev.push({ t: 'rideBreak' }); return } // the ride takes the hit
  st.hearts -= 1; st.invuln = 1.3; st.sinceHit = 0; st.combo = 1
  st.speed = Math.max(8, st.speed * 0.72)
  o.passed = true
  ev.push({ t: 'hit' })
  if (st.hearts <= 0) { st.over = true; ev.push({ t: 'over' }) }
}

/** Height of the roof of a big bus the player is on top of (or high enough to land on), otherwise the road. */
export function floorAt(st: DashState): number {
  if (st.y < BUS_ROOF - 0.4) return 0
  for (const o of st.objs) {
    if (o.type !== 'obstacle' || o.kind !== 'bigBus' || o.taken) continue
    const rel = o.dist - st.dist
    if (rel <= 0.4 && rel + (o.length ?? 11) >= -0.4 && Math.abs(o.lane - st.x) < 0.6) return BUS_ROOF
  }
  return 0
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
    else if (a === 'jump' && st.powers.wings <= 0 && st.y <= st.floor + 0.01 && (foot || st.powers.hop > 0)) { st.vy = JUMP_V * (foot ? 1 : 0.85); st.slide = 0; ev.push({ t: 'jump' }) }
    else if (a === 'slide' && foot) { if (st.y > 0.01) st.vy = -JUMP_V; st.slide = 0.7 }
  }
  // speed
  const effMax = st.maxSpeed * (st.powers.boost > 0 ? 1.35 : 1) * (st.ride ? RIDE_FACTOR[st.ride.kind] : 1)
  const target = st.braking && !foot ? 7 : effMax
  const ramp = (st.cfg.assist ? 0.1 : 0.17) * (st.powers.boost > 0 ? 3 : st.ride ? 2.5 : 1)
  st.speed += (target - st.speed) * Math.min(1, (st.braking ? 3 : ramp) * dt)
  if (!st.braking) st.speed = Math.min(effMax, st.speed + (st.cfg.assist ? 0.12 : 0.2) * dt * 3)
  st.dist += st.speed * dt
  const lv = levelAt(st.dist)
  if (lv > st.level) { st.level = lv; st.maxSpeed = maxSpeedFor(st.cfg, lv); st.score += 100 * lv; ev.push({ t: 'level', n: lv, name: LEVELS[lv - 1].name }) }
  // lateral smoothing (~120 ms)
  st.x += (st.lane - st.x) * Math.min(1, dt * 18)
  // vertical
  const flying = st.powers.wings > 0
  st.floor = flying ? 0 : floorAt(st)
  if (flying) { st.vy = 0; st.y += (FLY_Y - st.y) * Math.min(1, dt * 3); st.slide = 0 }
  else if (st.y > st.floor + 0.001 || st.vy > 0) { st.vy -= GRAVITY * dt; st.y += st.vy * dt; if (st.y <= st.floor && st.vy <= 0) { st.y = st.floor; st.vy = 0 } }
  else if (st.y < st.floor) { st.y = st.floor; st.vy = 0 } // floorAt only reports a roof once the player is high enough to be on it
  st.slide = Math.max(0, st.slide - dt)
  st.invuln = Math.max(0, st.invuln - dt)
  for (const k of POWER_KINDS) st.powers[k] = Math.max(0, st.powers[k] - dt)
  if (st.ride) { st.ride.t -= dt; if (st.ride.t <= 0) st.ride = null }
  st.comboT -= dt; if (st.comboT <= 0) st.combo = 1
  st.sinceHit += st.speed * dt
  if (st.speed >= st.maxSpeed * 0.9) st.fastT += dt; else st.fastT = 0

  spawn(st)

  const hitDist = st.cfg.assist ? 0.55 : 0.8
  const laneDx = st.cfg.assist ? 0.42 : 0.5
  for (const o of st.objs) {
    if (o.taken) continue
    const rel = o.dist - st.dist // positive ahead of player
    const len = o.length ?? 0
    if (o.type === 'tunnel' || o.type === 'decor') continue
    if (o.dir && rel < 34 && rel > -2) { o.x = Math.max(-1.4, Math.min(1.4, (o.x ?? o.lane) + o.dir * 0.9 * dt)) } // people walking across the road
    const dx = o.wide ? 0 : Math.abs((o.x ?? o.lane) - st.x)
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
        if (isRide(o.kind)) { st.ride = { kind: o.kind, t: RIDE_SECS }; ev.push({ t: 'ride', kind: o.kind }) }
        else if (o.kind === 'boost') { st.powers.boost = BOOST_SECS; st.speed = Math.max(st.speed, st.maxSpeed * 1.2); ev.push({ t: 'boost' }) }
        else if (o.kind === 'wings') { st.powers.wings = WINGS_SECS; st.slide = 0; ev.push({ t: 'fly' }) }
        else {
          st.powers[o.kind as PowerKind] = 6
          if (o.kind === 'suya') st.invuln = Math.max(st.invuln, 3)
          ev.push({ t: 'power', kind: o.kind as PowerKind })
        }
      }
    } else if (o.type === 'obstacle') {
      if (isSky(o.kind) !== flying) {
        // sky things only count while flying, and the ground only counts while on it
        if (isSky(o.kind) && rel < -6) o.passed = true
        else if (!isSky(o.kind) && !o.passed && rel + len < -hitDist) o.passed = true
        continue
      }
      if (isSky(o.kind)) {
        if (!o.passed && Math.abs(rel) < hitDist + 0.4 && dx < laneDx + 0.3 && st.invuln <= 0) {
          // knocked out of the sky: the wings stop, you drop to the road and lose some speed (no heart)
          o.passed = true; st.powers.wings = 0; st.vy = -6; st.invuln = 1.5; st.speed = Math.max(8, st.speed * 0.75); st.combo = 1
          ev.push({ t: 'knock' })
        } else if (!o.passed && rel < -hitDist) o.passed = true
        continue
      }
      const resp = OBSTACLE_RESPONSE[o.kind as ObstacleKind]
      const behind = len ? rel + len < -hitDist : rel < -hitDist
      const overlap = len ? rel < hitDist && rel + len > -hitDist : Math.abs(rel) < hitDist
      if (!o.passed && behind) {
        o.passed = true
        if (!o.taken && resp !== 'climb') {
          if (dx < 1.5 && dx > 0.7 || (dx <= 0.7 && dx >= laneDx && st.invuln <= 0)) {
            st.closeCalls += 1; st.score += 25; ev.push({ t: 'close' })
          }
        }
      }
      if (resp === 'climb') {
        // a big bus: land on the roof and ride it, or crash into the side if you are not high enough
        if (!o.passed && overlap && dx < laneDx + 0.2) {
          if (st.y >= BUS_ROOF - 0.4) { if (!o.ridden) { o.ridden = true; st.score += 60; ev.push({ t: 'roof' }) } }
          else if (st.invuln <= 0) { hurt(st, o, ev) }
        }
      } else if (!o.passed && overlap && dx < laneDx + 0.2 && st.invuln <= 0) {
        let clears = false
        if (resp === 'jump') clears = foot ? st.y > 0.7 : st.y > 0.7 && st.powers.hop > 0
        else if (resp === 'slide') clears = foot && st.slide > 0
        if (!clears) hurt(st, o, ev)
      }
    } else if (o.type === 'stop' && !o.done) {
      const len = o.length ?? 40
      const inZone = rel < 2 && rel > -len && Math.abs(st.x - 1) < 0.6
      if (rel < -len) { o.done = true; continue }
      if (inZone && st.speed < 11 && !foot) {
        st.loadT += dt
        if (st.loadT >= 0.9) {
          st.loadT = 0; o.done = true
          if (st.aboard === 0) { const n = st.evRng.int(1, 3); st.aboard = n; ev.push({ t: 'load', n }) }
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
  if (st.objs.length > 260) st.objs = st.objs.filter((o) => o.dist + (o.length ?? 0) > st.dist - 12)
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
