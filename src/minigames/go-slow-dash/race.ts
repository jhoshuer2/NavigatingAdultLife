// Racing in Go-Slow Dash. Both runners get the same seed, so they meet the same road; the rival is a computer runner ("Alfred ai")
// that steers by looking at the road ahead, and sometimes misses things. Pure TypeScript, no DOM.
import { makeRng, type Rng } from '@engine/core/rng'
import { createDash, stepDash, OBSTACLE_RESPONSE, type DashConfig, type DashObj, type DashState, type ObstacleKind } from './sim'

export const RACE_SECS = 90
export const RIVAL_NAME = 'Alfred ai'

export interface Rival { st: DashState; rng: Rng; skill: number; seen: Set<number>; ignore: Set<number>; wait: number; crashedAnnounced: boolean }

export function createRival(cfg: DashConfig, skill = 0.8): Rival {
  return { st: createDash({ ...cfg, hearts: 3 }), rng: makeRng(cfg.seed ^ 0x7f4a7c15), skill, seen: new Set(), ignore: new Set(), wait: 0, crashedAnnounced: false }
}

const threatens = (o: DashObj, st: DashState) => o.type === 'obstacle' && !o.taken && !o.passed && !(o.kind === 'bigBus' && st.cfg.mode === 'danfo')

/** One decision for the computer runner. Called a few times a second. */
export function rivalThink(rv: Rival) {
  const st = rv.st
  if (st.over) return
  const foot = st.cfg.mode === 'foot'
  const look = Math.max(16, st.speed * 0.95)
  const reach = (o: DashObj) => { const rel = o.dist - st.dist; return { rel, end: rel + (o.length ?? 0) } }
  // obstacles in each lane that must be steered around (dodge) or jumped / slid
  const lanes: Record<number, { dodge: number; act: DashObj | null }> = { [-1]: { dodge: 99, act: null }, 0: { dodge: 99, act: null }, 1: { dodge: 99, act: null } }
  for (const o of st.objs) {
    if (!threatens(o, st)) continue
    const { rel, end } = reach(o)
    if (end < -0.5 || rel > look + (o.length ?? 0)) continue
    if (!rv.seen.has(o.id)) { rv.seen.add(o.id); if (rv.rng.chance(1 - rv.skill)) rv.ignore.add(o.id) } // sometimes the computer just misses one
    if (rv.ignore.has(o.id)) continue
    const resp = OBSTACLE_RESPONSE[o.kind as ObstacleKind]
    const targets = o.wide ? [-1, 0, 1] : [Math.max(-1, Math.min(1, Math.round(o.x ?? o.lane)))]
    for (const l of targets) {
      if (!foot || resp === 'dodge' || resp === 'climb') lanes[l].dodge = Math.min(lanes[l].dodge, Math.max(0, rel))
      else if (!lanes[l].act || rel < reach(lanes[l].act!).rel) lanes[l].act = o
    }
  }
  const here = lanes[st.lane]
  if (here.dodge < look) {
    // blocked: move to the neighbouring lane that is clear for longest
    const options = [-1, 0, 1].filter((l) => Math.abs(l - st.lane) === 1 || (l === st.lane + 2 || l === st.lane - 2))
    options.sort((a, b) => lanes[b].dodge - lanes[a].dodge || Math.abs(a - st.lane) - Math.abs(b - st.lane))
    const best = options[0]
    if (best !== undefined && lanes[best].dodge > here.dodge + 3) st.queue.push(best < st.lane ? 'left' : 'right')
    return
  }
  const a = here.act
  if (a && foot) {
    const rel = a.dist - st.dist
    if (rel < st.speed * 0.3 && rel > 0) {
      if (OBSTACLE_RESPONSE[a.kind as ObstacleKind] === 'jump' && st.y <= st.floor + 0.01) st.queue.push('jump')
      else if (OBSTACLE_RESPONSE[a.kind as ObstacleKind] === 'slide' && st.slide <= 0) st.queue.push('slide')
    }
    return
  }
  // nothing in the way: drift toward coins in a neighbouring lane
  let best = st.lane, bestN = 0
  for (const l of [-1, 0, 1]) {
    if (Math.abs(l - st.lane) > 1 || lanes[l].dodge < look + 10 || (foot && lanes[l].act)) continue
    let n = 0
    for (const o of st.objs) if (o.type === 'coin' && !o.taken && o.lane === l && o.dist - st.dist > 2 && o.dist - st.dist < 26) n += o.kind === 'gold' ? 3 : 1
    if (n > bestN + (l === st.lane ? 0 : 2)) { bestN = n; best = l }
  }
  if (best !== st.lane) st.queue.push(best < st.lane ? 'left' : 'right')
}

/** Advance the rival by the same slice of time as the player. Returns true the moment it crashes out. */
export function stepRival(rv: Rival, dt: number): boolean {
  const st = rv.st
  if (st.over) return false
  rv.wait -= dt
  if (rv.wait <= 0) { rv.wait = 0.06 + (1 - rv.skill) * 0.25; rivalThink(rv) }
  stepDash(st, dt)
  if (st.over && !rv.crashedAnnounced) { rv.crashedAnnounced = true; return true }
  return false
}

export interface RaceOutcome { youWon: boolean; draw: boolean; you: number; rival: number; margin: number; timeUp: boolean }
export function raceOutcome(you: DashState, rival: DashState, timeUp: boolean): RaceOutcome {
  const margin = you.score - rival.score
  return { youWon: margin > 0, draw: margin === 0, you: you.score, rival: rival.score, margin, timeUp }
}
