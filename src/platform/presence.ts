// "Active in the game": while the game is open and visible, an online player pings the server every few seconds. That keeps them on the list of
// people who get a challenge, and brings pending challenges back to show as a popup.
import type { Invite } from '@shared/rush'
import { rushOnline, rushPing } from './rush'

export const PING_MS = 5000

/** Start pinging; `onInvites` gets the latest list each time. Returns a function that stops it. */
export function startPresence(onInvites: (list: Invite[]) => void): () => void {
  let stopped = false, timer = 0, busy = false
  const tick = async () => {
    if (stopped || busy) return
    if (document.visibilityState !== 'visible' || !rushOnline()) { onInvites([]); return }
    busy = true
    try { const r = await rushPing(); if (!stopped && r.invites) onInvites(r.invites) } finally { busy = false }
  }
  const onVis = () => { if (document.visibilityState === 'visible') void tick() }
  document.addEventListener('visibilitychange', onVis)
  void tick(); timer = window.setInterval(() => void tick(), PING_MS)
  return () => { stopped = true; clearInterval(timer); document.removeEventListener('visibilitychange', onVis) }
}
