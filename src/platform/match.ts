// Finding people to race in The Rush. A challenge goes to every online player active right now; those who accept race the same road.
// When nobody accepts the lobby says so and the game offers Alfred ai instead (see Dash.tsx). Transport is plain polling (see platform/rush.ts).
import type { MatchView, SnapshotT } from '@shared/rush'
import { rushChallenge, rushFinish, rushLeave, rushLobby, rushState, serverNow } from './rush'

export const LOBBY_POLL_MS = 700
export const STATE_POLL_MS = 400

/** Send a challenge. Resolves with the match (it may already be over if nobody is around) or null when the service could not be reached. */
export async function sendChallenge(secs: number): Promise<MatchView | null> {
  const r = await rushChallenge(secs)
  return r.match ?? null
}

/** Watch a lobby until the race starts or ends. `onView` fires on every poll; the returned function stops watching. */
export function watchLobby(matchId: string, onView: (m: MatchView) => void): () => void {
  let stopped = false, timer: ReturnType<typeof setTimeout> | undefined
  const poll = async () => {
    if (stopped) return
    const r = await rushLobby(matchId)
    if (stopped) return
    if (r.match) { onView(r.match); if (r.match.status !== 'inviting') return } // the race started or ended: nothing more to wait for
    timer = setTimeout(() => void poll(), LOBBY_POLL_MS)
  }
  void poll()
  return () => { stopped = true; clearTimeout(timer) }
}

/** Milliseconds (this device's clock) until the server says the green light shows. */
export const msUntilStart = (m: MatchView) => (m.start_at ?? serverNow()) - serverNow()

/** The link a running race uses: send my snapshot a few times a second and keep the latest view of everyone. */
export class RaceLink {
  latest: MatchView
  private last = 0
  private busy = false
  finished = false
  constructor(view: MatchView, readonly me: string) { this.latest = view }
  /** Call every frame with the current snapshot; it only goes out every STATE_POLL_MS. Returns true when a fresh view arrived. */
  async tick(snap: SnapshotT, nowMs: number): Promise<boolean> {
    if (this.busy || this.finished || nowMs - this.last < STATE_POLL_MS) return false
    this.last = nowMs; this.busy = true
    try { const r = await rushState(this.latest.id, snap); if (r.match) { this.latest = r.match; return true } return false } finally { this.busy = false }
  }
  /** My run is over: send the final score, then follow the race until everyone is done (or `maxMs` passes). */
  async finish(score: number, dist: number, onView: (m: MatchView) => void, maxMs = 25000): Promise<MatchView> {
    this.finished = true
    const first = await rushFinish(this.latest.id, score, dist)
    if (first.match) { this.latest = first.match; onView(first.match) }
    const t0 = Date.now()
    while (this.latest.status === 'running' && Date.now() - t0 < maxMs) {
      await new Promise((res) => setTimeout(res, 1000))
      const r = await rushLobby(this.latest.id)
      if (r.match) { this.latest = r.match; onView(r.match) }
    }
    return this.latest
  }
  leave() { this.finished = true; void rushLeave(this.latest.id) }
}
