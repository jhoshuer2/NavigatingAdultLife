// Small store for live Rush races: pending challenges (shown as a popup from any screen) and the race the Rush screen should join.
import { create } from 'zustand'
import type { Invite, MatchView } from '@shared/rush'

export interface InviteIn extends Invite { at: number } // `at`: when this device received it (ms), so the countdown can run locally
export interface RaceIn { stage: 'lobby' | 'live'; view: MatchView; me: string }

interface RushNet {
  invites: InviteIn[]
  busy: boolean // the player is in a lobby or a race: do not interrupt them with popups
  race: RaceIn | null
  raceN: number // changes every time the race changes, so the Rush screen starts fresh with the shared seed
  setInvites: (l: Invite[]) => void
  setBusy: (b: boolean) => void
  setRace: (r: RaceIn | null) => void
  clearRace: () => void // leave the race behind without restarting the Rush screen
}
export const useRush = create<RushNet>((set) => ({
  invites: [], busy: false, race: null, raceN: 0,
  setInvites: (l) => set({ invites: l.map((i) => ({ ...i, at: Date.now() })) }), // left_ms is fresh as of this reply
  setBusy: (busy) => set({ busy }),
  setRace: (race) => set((s) => ({ race, raceN: s.raceN + 1 })),
  clearRace: () => set({ race: null }),
}))
