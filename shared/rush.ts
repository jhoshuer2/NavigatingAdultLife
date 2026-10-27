// Live races in The Rush (docs/PRD-multiplayer.md, Rush races). Shared by the game client and the rush API.
// Every runner simulates their own run from the same seed; only small snapshots and final scores travel.
import { z } from 'zod'

/** How long a challenge stays open for players to accept, and how long a player counts as "active in the game" after their last ping. */
export const INVITE_SECS = 20
export const ACTIVE_SECS = 30
/** Seconds between the race being decided and the green light, so every client's 3-2-1 lines up. */
export const COUNTDOWN_SECS = 4
/** A runner whose snapshots stop for this long is counted as dropped. */
export const DROP_SECS = 10
/** Points a race winner adds to the global leaderboard. */
export const WIN_POINTS = 3
export const MAX_INVITEES = 20
export const RUSH_SECS = [60, 90, 120, 180, 300] as const

export const Snapshot = z.object({
  dist: z.number().min(0).max(100000), lane: z.number().min(-2).max(2), y: z.number().min(-2).max(30), slide: z.number().min(0).max(5),
  score: z.number().int().min(0).max(10_000_000), hearts: z.number().int().min(0).max(10), over: z.boolean(), t: z.number().min(0).max(1000),
})
export type SnapshotT = z.infer<typeof Snapshot>

const id = z.string().uuid()
export const RushRequest = z.discriminatedUnion('op', [
  z.object({ op: z.literal('ping') }),
  z.object({ op: z.literal('challenge'), secs: z.number().int().min(30).max(600) }),
  z.object({ op: z.literal('respond'), match: id, accept: z.boolean() }),
  z.object({ op: z.literal('lobby'), match: id }),
  z.object({ op: z.literal('state'), match: id, snap: Snapshot }),
  z.object({ op: z.literal('finish'), match: id, score: z.number().int().min(0).max(10_000_000), dist: z.number().min(0).max(100000) }),
  z.object({ op: z.literal('leave'), match: id }),
  z.object({ op: z.literal('board') }),
])
export type RushRequestT = z.infer<typeof RushRequest>

export type MatchStatus = 'inviting' | 'running' | 'no_takers' | 'done'
export type PlayerStatus = 'host' | 'invited' | 'accepted' | 'declined' | 'dropped' | 'finished'

export interface Invite { match: string; from: string; rush_secs: number; left_ms: number }
export interface MatchPlayer { id: string; label: string; status: PlayerStatus; score: number; dist: number; rank: number | null; snap: SnapshotT | null }
export interface MatchView {
  id: string; status: MatchStatus; seed: number; secs: number; host: string
  invite_until: number // epoch ms, server clock
  start_at: number | null // epoch ms, server clock: when the green light shows
  invited: number // how many players were notified
  winner: string | null // account id of the winner once done (null on a draw or when nobody else raced)
  players: MatchPlayer[]
}
export interface BoardRow { label: string; points: number; wins: number; plays: number; best_dist: number; me?: boolean }

export type RushError = 'bad_request' | 'unauthorized' | 'mp_off' | 'rate_limited' | 'not_found' | 'closed' | 'server'
export interface RushResponse {
  now?: number // server clock in epoch ms, so clients can line up the countdown
  invites?: Invite[]
  match?: MatchView
  board?: BoardRow[]
  me?: BoardRow & { rank: number }
  ok?: boolean
  error?: RushError
}
