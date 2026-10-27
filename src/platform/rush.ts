// Live Rush races: the client for /api/rush (docs/PRD-multiplayer.md). Same address, account and sign-in token as the online profile.
// Nothing here runs unless the account API is configured and the player has online play switched on.
import type { MatchView, RushRequestT, RushResponse, SnapshotT } from '@shared/rush'
import { accountToken, accountUrl, accountAvailable, savedAccount } from './account'

const url = () => accountUrl().replace(/\/api\/account\/?$/, '/api/rush')

/** Why a live race is not possible right now (shown to the player), or null when it is. */
export function rushBlocked(): 'service' | 'signin' | 'online_off' | null {
  if (!accountAvailable()) return 'service'
  const a = savedAccount()
  if (!a || !accountToken()) return 'signin'
  return a.mp_enabled ? null : 'online_off'
}
export const rushOnline = () => rushBlocked() === null
export const rushBlockedText = (b: NonNullable<ReturnType<typeof rushBlocked>>) => b === 'service' ? 'Online races are not switched on in this version of the game.' : b === 'signin' ? 'Create an online profile in Settings to race real players.' : 'Turn on online play in Settings > Online profile to race real players.'

/** server clock minus this device's clock, learned from every reply, so countdowns line up across phones */
let skew = 0
export const serverNow = () => Date.now() + skew

type Body = RushRequestT
async function call(body: Body): Promise<RushResponse> {
  const token = accountToken()
  if (!accountAvailable() || !token) return { error: 'unauthorized' }
  const t0 = Date.now()
  try {
    const res = await fetch(url(), { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
    const json = (await res.json().catch(() => ({}))) as RushResponse
    if (typeof json.now === 'number') skew = json.now - (t0 + Date.now()) / 2 // assume the reply was made halfway through the round trip
    if (!res.ok && !json.error) return { error: 'server' }
    return json
  } catch { return { error: 'server' } }
}

export const rushPing = () => call({ op: 'ping' })
export const rushChallenge = (secs: number) => call({ op: 'challenge', secs })
export const rushRespond = (match: string, accept: boolean) => call({ op: 'respond', match, accept })
export const rushLobby = (match: string) => call({ op: 'lobby', match })
export const rushState = (match: string, snap: SnapshotT) => call({ op: 'state', match, snap })
export const rushFinish = (match: string, score: number, dist: number) => call({ op: 'finish', match, score: Math.round(score), dist: Math.round(dist) })
export const rushLeave = (match: string) => call({ op: 'leave', match })
export const rushBoard = () => call({ op: 'board' })
export type { MatchView }
