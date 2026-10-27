// Other human runners in a live race. Each client simulates its own run; the others arrive as small snapshots a couple of times a second.
// A Ghost smooths them into a DashState-shaped value the renderer can draw exactly like the computer runner. Pure TypeScript, no DOM.
import type { SnapshotT } from '@shared/rush'
import { createDash, type DashState } from './sim'

/** the snapshot a runner sends: just enough to draw them and rank them */
export function snapshotOf(st: DashState): SnapshotT {
  return { dist: Math.max(0, st.dist), lane: st.lane, y: Math.max(-2, Math.min(30, st.y)), slide: Math.max(0, st.slide), score: Math.max(0, Math.round(st.score)), hearts: Math.max(0, st.hearts), over: st.over, t: Math.max(0, st.t) }
}

const MAX_LEAD_S = 0.9 // never guess further ahead than this when snapshots stop

export class Ghost {
  readonly st: DashState
  score = 0
  private prev: { snap: SnapshotT; at: number } | null = null
  private cur: { snap: SnapshotT; at: number } | null = null
  constructor(readonly id: string, readonly label: string) {
    this.st = createDash({ seed: 1, mode: 'foot', hearts: 3, assist: false })
    this.st.objs = []
  }
  /** A new snapshot arrived (`at` is a local clock in ms). Repeats of the same snapshot are ignored. */
  push(snap: SnapshotT, at: number) {
    if (this.cur && this.cur.snap.t === snap.t && this.cur.snap.dist === snap.dist) return
    this.prev = this.cur; this.cur = { snap, at }
    this.score = snap.score
  }
  /** Move the ghost: distance is carried on at the speed it was last going, the lane and height ease toward the latest snapshot. */
  step(dt: number, nowMs: number) {
    const c = this.cur; if (!c) return
    const st = this.st
    let speed = st.speed
    if (this.prev && c.snap.t > this.prev.snap.t) speed = Math.max(0, (c.snap.dist - this.prev.snap.dist) / (c.snap.t - this.prev.snap.t))
    const lead = Math.min(MAX_LEAD_S, Math.max(0, (nowMs - c.at) / 1000))
    const target = c.snap.over ? c.snap.dist : c.snap.dist + speed * lead
    st.dist += (target - st.dist) * Math.min(1, dt * 12) // glide, so a late or early snapshot never makes them jump
    st.speed = speed
    st.lane = c.snap.lane
    st.x += (c.snap.lane - st.x) * Math.min(1, dt * 12)
    st.y += (c.snap.y - st.y) * Math.min(1, dt * 14)
    st.slide = c.snap.slide
    st.over = c.snap.over
    st.score = c.snap.score; st.hearts = c.snap.hearts
  }
}

/** Keep one Ghost per other runner; drop the ones that left. */
export class Ghosts {
  private map = new Map<string, Ghost>()
  update(players: { id: string; label: string; snap: SnapshotT | null }[], me: string, nowMs: number) {
    const seen = new Set<string>()
    for (const p of players) {
      if (p.id === me) continue
      seen.add(p.id)
      let g = this.map.get(p.id)
      if (!g) { g = new Ghost(p.id, p.label); this.map.set(p.id, g) }
      if (p.snap) g.push(p.snap, nowMs)
    }
    for (const id of [...this.map.keys()]) if (!seen.has(id)) this.map.delete(id)
  }
  step(dt: number, nowMs: number) { for (const g of this.map.values()) g.step(dt, nowMs) }
  list(): Ghost[] { return [...this.map.values()] }
  states(): DashState[] { return this.list().map((g) => g.st) }
}

/** Where you stand in the race right now (1 = in the lead) and the best score among the others. */
export function standing(myScore: number, others: { score: number }[]): { rank: number; of: number; leader: number } {
  return { rank: 1 + others.filter((o) => o.score > myScore).length, of: others.length + 1, leader: Math.max(myScore, ...others.map((o) => o.score)) }
}
export const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
