// In-world clock, opening hours and lighting keyframes. Pure helpers (no Three.js).
import type { PlaceId } from './layout'

export const OPENING: Partial<Record<PlaceId, [number, number]>> = {
  school: [7, 16], office: [8, 17], jobcentre: [8, 17], worship: [5, 21], mamaput: [7, 22], market: [7, 20], busstop: [5, 23], gym: [5, 22],
}

export const ACTIVITY_HOURS: Record<string, number> = {
  study: 1.5, play: 1, chores: 1, hustle: 2, socialise: 2, familyTime: 1.5, exercise: 1, community: 1.5, dash: 0.5, applyJob: 2, overtime: 2, treat: 0.75, shop: 0.5, tv: 1.5, meal: 0.75, groom: 0.5, chat: 0.25, quitJob: 0.5,
}

export const isOpen = (id: PlaceId, hour: number) => { const o = OPENING[id]; return !o || (hour >= o[0] && hour < o[1]) }
export const opensAt = (id: PlaceId) => OPENING[id]?.[0] ?? 0

export function fmtClock(hour: number): string {
  const h = Math.floor(hour) % 24, m = Math.floor((hour % 1) * 60 / 5) * 5
  const ap = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`
}
export const periodOf = (hour: number): 'night' | 'dawn' | 'morning' | 'afternoon' | 'evening' => hour < 5 || hour >= 21 ? 'night' : hour < 7 ? 'dawn' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
export const isNight = (hour: number) => hour < 6 || hour >= 19.5

export interface Lighting {
  sky: number; fog: number; hemiSky: number; hemiGround: number; hemiI: number; sun: number; sunI: number; sunPos: [number, number, number]
  dark: number // 0 (day) .. 1 (night)
}

interface Key { h: number; sky: number; hemiSky: number; hemiGround: number; hemiI: number; sun: number; sunI: number; dark: number }
const KEYS: Key[] = [
  { h: 0, sky: 0x0e1230, hemiSky: 0x5a6aa8, hemiGround: 0x14142e, hemiI: 0.42, sun: 0x9fb4ff, sunI: 0.3, dark: 1 },
  { h: 5, sky: 0x151a42, hemiSky: 0x5a6aa8, hemiGround: 0x14142e, hemiI: 0.42, sun: 0x9fb4ff, sunI: 0.3, dark: 1 },
  { h: 6.3, sky: 0xf0a37a, hemiSky: 0xffd6b0, hemiGround: 0x6a4a5a, hemiI: 0.8, sun: 0xffb98a, sunI: 0.7, dark: 0.35 },
  { h: 8, sky: 0x9ed3ff, hemiSky: 0xfff0dc, hemiGround: 0x6a5a7a, hemiI: 1.05, sun: 0xfff0d0, sunI: 0.95, dark: 0 },
  { h: 15.5, sky: 0x9ed3ff, hemiSky: 0xfff0dc, hemiGround: 0x6a5a7a, hemiI: 1.05, sun: 0xfff0d0, sunI: 0.95, dark: 0 },
  { h: 18, sky: 0xffa86a, hemiSky: 0xffd0a0, hemiGround: 0x6a4a5a, hemiI: 0.85, sun: 0xffa060, sunI: 0.8, dark: 0.2 },
  { h: 19.5, sky: 0x5a4a8a, hemiSky: 0x9a8ac0, hemiGround: 0x2a2444, hemiI: 0.6, sun: 0xb090c0, sunI: 0.4, dark: 0.7 },
  { h: 21, sky: 0x151a42, hemiSky: 0x5a6aa8, hemiGround: 0x14142e, hemiI: 0.42, sun: 0x9fb4ff, sunI: 0.3, dark: 1 },
  { h: 24, sky: 0x0e1230, hemiSky: 0x5a6aa8, hemiGround: 0x14142e, hemiI: 0.42, sun: 0x9fb4ff, sunI: 0.3, dark: 1 },
]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255, br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255
  return (Math.round(lerp(ar, br, t)) << 16) | (Math.round(lerp(ag, bg, t)) << 8) | Math.round(lerp(ab, bb, t))
}

export function lightingAt(hourIn: number): Lighting {
  const hour = ((hourIn % 24) + 24) % 24
  let i = 0
  while (i < KEYS.length - 2 && hour >= KEYS[i + 1].h) i++
  const a = KEYS[i], b = KEYS[i + 1]
  const t = Math.min(1, Math.max(0, (hour - a.h) / (b.h - a.h)))
  const ang = ((hour - 6) / 12) * Math.PI
  const day = hour > 6 && hour < 18
  return {
    sky: lerpColor(a.sky, b.sky, t), fog: lerpColor(a.sky, b.sky, t), hemiSky: lerpColor(a.hemiSky, b.hemiSky, t), hemiGround: lerpColor(a.hemiGround, b.hemiGround, t),
    hemiI: lerp(a.hemiI, b.hemiI, t), sun: lerpColor(a.sun, b.sun, t), sunI: lerp(a.sunI, b.sunI, t), dark: lerp(a.dark, b.dark, t),
    sunPos: day ? [-Math.cos(ang) * 38, Math.sin(ang) * 40 + 4, 18] : [22, 32, -12],
  }
}
