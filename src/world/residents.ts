// Daily routines for the people in your life. Pure functions: where is each person at a given hour, and what are they doing?
// This replaces fixed "standing on the doorstep" spots: people have lives of their own (cook, eat, watch TV, go to work,
// sit outside, sleep) independent of what the player does.
import type { PlaceId } from './layout'

export type Activity = 'cook' | 'eat' | 'tv' | 'play' | 'idle' | 'chat'
export type Where = 'home' | 'out' | 'away' | `place:${PlaceId}`
export interface Presence { where: Where; activity: Activity; near?: PlaceId }

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0) / 4294967295 }
/** A stable pseudo-random number for a person in a given hour-block, so routines vary but do not flicker. */
const roll = (id: string, hour: number, salt = '') => hash(`${id}:${Math.floor(hour / 2)}:${salt}`)

const SLEEP = (h: number) => h < 6 || h >= 22

export function presenceAt(role: string, hour: number, id = role): Presence {
  const h = ((hour % 24) + 24) % 24
  const r = roll(id, h)
  const away: Presence = { where: 'away', activity: 'idle' }
  // early risers: Mama and Papa often go to the gym between 5am and 6:30am
  if ((role === 'mother' || role === 'father') && h >= 5 && h < 6.5 && roll(id, h, 'gym') < 0.7) return { where: 'place:gym', activity: 'idle' }
  if (SLEEP(h)) return away
  switch (role) {
    case 'mother':
      if (h < 8) return { where: 'home', activity: 'cook' }
      if (h < 9) return { where: 'home', activity: 'eat' }
      if (h < 12) return r < 0.45 ? { where: 'out', activity: 'idle', near: 'market' } : { where: 'home', activity: r < 0.75 ? 'idle' : 'tv' }
      if (h < 13.5) return { where: 'home', activity: 'cook' }
      if (h < 16) return r < 0.3 ? { where: 'out', activity: 'chat', near: 'home' } : { where: 'home', activity: r < 0.65 ? 'tv' : 'idle' }
      if (h < 19) return { where: 'home', activity: 'cook' }
      if (h < 20) return { where: 'home', activity: 'eat' }
      return { where: 'home', activity: 'tv' }
    case 'father':
      if (h < 7) return { where: 'home', activity: 'eat' }
      if (h < 17) return away // at work
      if (h < 19) return r < 0.5 ? { where: 'out', activity: 'chat', near: 'home' } : { where: 'home', activity: 'tv' }
      if (h < 20) return { where: 'home', activity: 'eat' }
      return { where: 'home', activity: 'tv' }
    case 'sibling':
      if (h < 7.5) return { where: 'home', activity: 'eat' }
      if (h < 15) return away // at school
      if (h < 19) return r < 0.4 ? { where: 'out', activity: 'play', near: 'pitch' } : { where: 'home', activity: r < 0.7 ? 'tv' : 'play' }
      if (h < 20) return { where: 'home', activity: 'eat' }
      return { where: 'home', activity: 'tv' }
    case 'child':
      if (h < 8) return { where: 'home', activity: 'play' }
      if (h < 12) return r < 0.5 ? { where: 'out', activity: 'play', near: 'home' } : { where: 'home', activity: 'play' }
      if (h < 14) return { where: 'home', activity: 'eat' }
      if (h < 19) return r < 0.4 ? { where: 'out', activity: 'play', near: 'home' } : { where: 'home', activity: 'play' }
      return { where: 'home', activity: r < 0.5 ? 'tv' : 'play' }
    case 'friend':
      if (h >= 12 && h < 21) return r < 0.7 ? { where: 'place:mamaput', activity: 'chat' } : { where: 'out', activity: 'chat', near: 'mamaput' }
      return h >= 8 && h < 12 ? { where: 'out', activity: 'idle', near: 'busstop' } : away
    case 'friend2':
      if (h >= 7 && h < 16) return { where: 'place:school', activity: 'idle' }
      return h < 20 ? { where: 'out', activity: 'play', near: 'pitch' } : away
    case 'partner':
      if (h >= 9 && h < 19) return r < 0.5 ? { where: 'out', activity: 'idle', near: 'market' } : { where: 'out', activity: 'chat', near: 'mamaput' }
      return h < 21 ? { where: 'out', activity: 'chat', near: 'home' } : away
    case 'boss':
      return h >= 8 && h < 17 ? { where: 'place:office', activity: 'idle' } : away
    default:
      return away
  }
}

/** Where outside a person who is "out" hangs about. They wander within `r` of this point. */
export function outdoorAnchor(near: PlaceId, door: { x: number; z: number }): { x: number; z: number; r: number } {
  const r = near === 'pitch' ? 5 : near === 'market' ? 5 : 4
  // stand slightly off the doorstep so they never block the entrance
  return { x: door.x + (near === 'home' ? 3.5 : 2.5), z: door.z - 2.5, r }
}
