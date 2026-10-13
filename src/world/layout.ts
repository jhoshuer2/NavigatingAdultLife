// Walkable district layout. Pure data + helpers: no Three.js, no DOM. Units are metres; x east, z south.
import { makeRng } from '@engine/core/rng'
import { CITIES, type CityId } from '@content/cities'
import { flavourOf, worshipName, type Faith, type Flavour } from './flavour'

export interface Rect { x0: number; x1: number; z0: number; z1: number }
export type PlaceId = 'home' | 'school' | 'market' | 'mamaput' | 'pitch' | 'worship' | 'busstop' | 'office' | 'jobcentre' | 'outing' | 'gym'

export interface Place {
  id: PlaceId
  name: string
  icon: string
  blurb: string
  rect: Rect // building footprint (blocking). Open places (pitch, market) use a zone only
  door: { x: number; z: number } // where the player stands to interact
  zoneR: number
  activities: string[] // activity ids offered here
  color: number // roof/accent colour
  open?: boolean // open-air place without a solid building
}

export const WORLD = { half: 50, roadHalf: 3 }

export interface DistrictTheme {
  id: string; city: CityId; name: string; tagline: string
  wall: number[]; roof: number; ground: number; roadColor: number; sidewalk: number
  trees: number; density: number; tall: number
  names: Record<Exclude<PlaceId, 'gym'>, string> & { gym?: string }
}

export const DISTRICTS: Record<string, DistrictTheme> = {
  surulere: {
    id: 'surulere', city: 'lagos', name: 'Surulere', tagline: 'Football on every street, neighbours who know your business.',
    wall: [0xe8c9a0, 0xd9a05b, 0xf0d9a8, 0xcf8a5a, 0xdcae92], roof: 0xa8452a, ground: 0x8aa84a, roadColor: 0x3d3d46, sidewalk: 0xd8cfc0, trees: 26, density: 1, tall: 0.2,
    names: { home: 'Your home', school: 'Surulere School', market: 'Aguda Market', mamaput: "Mama Chidi's Buka", pitch: 'Street Football Pitch', worship: 'Place of Worship', busstop: 'Danfo Bus Stop', office: 'Your Workplace', jobcentre: 'Cyber Café & Job Centre', outing: 'Landmark Beach (Group Trip)' },
  },
  ikorodu: {
    id: 'ikorodu', city: 'lagos', name: 'Ikorodu', tagline: 'Long commutes, big yards, fresh pepper soup and strong community.',
    wall: [0xd6b58a, 0xc9a06a, 0xe2c8a0, 0xb88a56, 0xa8d0a0], roof: 0x7a4a2a, ground: 0x7fae4e, roadColor: 0x4a4540, sidewalk: 0xcdbf9f, trees: 40, density: 0.8, tall: 0.1,
    names: { home: 'Your home', school: 'Ikorodu Community School', market: 'Garage Market', mamaput: "Iya Ibeji's Buka", pitch: 'Compound Pitch', worship: 'Place of Worship', busstop: 'Ikorodu Garage Stop', office: 'Your Workplace', jobcentre: 'Business Centre & Job Desk', outing: 'Lagoon Beach (Group Trip)' },
  },
  yaba: {
    id: 'yaba', city: 'lagos', name: 'Yaba', tagline: 'Campuses, tech hubs and rent that talks loudly.',
    wall: [0xc9d3dd, 0xe6c58a, 0x9fb7c9, 0xd8a7a0, 0xf0d9a8], roof: 0x44505a, ground: 0x88a063, roadColor: 0x3a3c45, sidewalk: 0xd0d4d8, trees: 22, density: 1.2, tall: 0.45,
    names: { home: 'Your home', school: 'Yaba College Area School', market: 'Yaba Market', mamaput: 'Tech Bro Buka', pitch: 'Campus Field', worship: 'Place of Worship', busstop: 'Yaba Bus Stop', office: 'Your Workplace', jobcentre: 'Co-working & Job Hub', outing: 'Tarkwa Bay Beach (Group Trip)' },
  },
  lekki: {
    id: 'lekki', city: 'lagos', name: 'Lekki', tagline: 'Gated estates, generators that never sleep, traffic to the Island.',
    wall: [0xf2efe6, 0xe9e2d0, 0xcfd9e6, 0xe6d9c4, 0xdde6dc], roof: 0x5a6a7a, ground: 0x78b05a, roadColor: 0x33353d, sidewalk: 0xe3e0d8, trees: 34, density: 0.9, tall: 0.3,
    names: { home: 'Your home', school: 'Lekki Premier School', market: 'Lekki Mall & Market', mamaput: 'Skyline Kitchen', pitch: 'Estate Court', worship: 'Place of Worship', busstop: 'Lekki Bus Stop', office: 'Your Workplace', jobcentre: 'Recruitment Lounge', outing: 'Elegushi Beach (Group Trip)' },
  },
}

DISTRICTS.kubwa = {
  id: 'kubwa', city: 'abuja', name: 'Kubwa', tagline: 'A busy satellite town: red earth, long rides to the city and everyone knows everyone.',
  wall: [0xe9d3b0, 0xd8b48a, 0xf0e2c6, 0xc99b72, 0xe3c1a0], roof: 0x8a3b2a, ground: 0x9aa957, roadColor: 0x4a4540, sidewalk: 0xd9cbb0, trees: 34, density: 0.95, tall: 0.12,
  names: { home: 'Your home', school: 'Kubwa Community School', market: 'Kubwa Market', mamaput: "Mama Agnes' Buka", pitch: 'Estate Field', worship: 'Place of Worship', busstop: 'Kubwa Cab Park', office: 'Your Workplace', jobcentre: 'Business Centre & Job Desk', outing: 'Kubwa Hills (Group Hike)' },
}
DISTRICTS.garki = {
  id: 'garki', city: 'abuja', name: 'Garki', tagline: 'Secretariats, big markets and neat avenues. The civil service heartland.',
  wall: [0xf2ead8, 0xe6dcc3, 0xd9e2d0, 0xefe0c2, 0xcfdcd6], roof: 0x6b7d5a, ground: 0x7fb25a, roadColor: 0x3d3f45, sidewalk: 0xdad6c8, trees: 44, density: 0.9, tall: 0.25,
  names: { home: 'Your home', school: 'Garki Model School', market: 'Garki Market', mamaput: "Auntie Ify's Buka", pitch: 'Area 10 Field', worship: 'Place of Worship', busstop: 'Garki Cab Rank', office: 'Your Workplace', jobcentre: 'Secretariat Job Desk', outing: 'Idu Hills (Group Hike)' },
}
DISTRICTS.wuse = {
  id: 'wuse', city: 'abuja', name: 'Wuse II', tagline: 'Cafés, offices and nightlife in the middle of the city.',
  wall: [0xe8edf2, 0xf2e6c8, 0xc9d8e2, 0xe6d3c0, 0xdfe7dc], roof: 0x4f6272, ground: 0x84b862, roadColor: 0x35373f, sidewalk: 0xdfe0dc, trees: 38, density: 1.1, tall: 0.5,
  names: { home: 'Your home', school: 'Wuse II School', market: 'Wuse Market', mamaput: 'Zone 4 Buka', pitch: 'Wuse Sports Field', worship: 'Place of Worship', busstop: 'Wuse Cab Rank', office: 'Your Workplace', jobcentre: 'Co-working & Job Hub', outing: 'Jabi Lake Hills (Group Hike)' },
}
DISTRICTS.maitama = {
  id: 'maitama', city: 'abuja', name: 'Maitama', tagline: 'Quiet streets, embassies and security gates. Everything costs more.',
  wall: [0xf6f3ea, 0xece6d6, 0xdfe8ef, 0xefe2cf, 0xe3ece0], roof: 0x5a6f7f, ground: 0x6fb55a, roadColor: 0x30323a, sidewalk: 0xe8e6de, trees: 52, density: 0.75, tall: 0.3,
  names: { home: 'Your home', school: 'Maitama Premier School', market: 'Maitama Farmers Market', mamaput: 'Garden Kitchen', pitch: 'Estate Court', worship: 'Place of Worship', busstop: 'Maitama Cab Rank', office: 'Your Workplace', jobcentre: 'Recruitment Lounge', outing: 'Aso Rock View (Group Hike)' },
}

const hashStr = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
const PERMS: number[][] = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]

/** Every district has its own street plan: the home, the place of worship and the gym trade places along the north side of the main road, and the buyka, the office and the job centre along the south side. */
function shufflePlaces(places: Place[], districtId: string): Place[] {
  const north = ['home', 'worship', 'gym'], south = ['mamaput', 'office', 'jobcentre']
  const byId = new Map(places.map((p) => [p.id as string, p]))
  const out = new Map<string, Place>(places.map((p) => [p.id as string, p]))
  const clampX = (x0: number, w: number) => { const lo = x0 + w / 2 > 0 ? 33 : -WORLD.half + 2; return Math.max(lo, Math.min(WORLD.half - 2 - w, x0)) } // keep a lane free beside the market and the school
  const assign = (ids: string[], front: 'z1' | 'z0', perm: number[]) => {
    const slots = ids.map((id) => { const p = byId.get(id)!; return { cx: (p.rect.x1 + p.rect.x0) / 2, edge: front === 'z1' ? p.rect.z1 : p.rect.z0 } })
    ids.forEach((id, i) => {
      const p = byId.get(id)!, sl = slots[perm[i]]
      const w = p.rect.x1 - p.rect.x0, dd = p.rect.z1 - p.rect.z0, oldCx = (p.rect.x1 + p.rect.x0) / 2
      const x0 = clampX(sl.cx - w / 2, w)
      const rect = front === 'z1' ? { x0, x1: x0 + w, z0: sl.edge - dd, z1: sl.edge } : { x0, x1: x0 + w, z0: sl.edge, z1: sl.edge + dd }
      out.set(id, { ...p, rect, door: { x: x0 + w / 2 + (p.door.x - oldCx), z: front === 'z1' ? sl.edge + 2.5 : sl.edge - 2.5 } })
    })
  }
  assign(north, 'z1', PERMS[hashStr(districtId + ':north') % 6]); assign(south, 'z0', PERMS[hashStr(districtId + ':south') % 6])
  return places.map((p) => out.get(p.id as string)!)
}

export function placesFor(theme: DistrictTheme): Place[] {
  const n = theme.names
  return shufflePlaces([
    { id: 'home', name: n.home, icon: '🏠', blurb: 'Sleep, eat, family and the end of the year.', rect: { x0: -25, x1: -12, z0: -21, z1: -11 }, door: { x: -18.5, z: -8.5 }, zoneR: 3, activities: ['rest', 'familyTime', 'chores', 'treat'], color: 0xa8452a },
    { id: 'school', name: n.school, icon: '🏫', blurb: 'Pop quizzes, strict teachers and ten thousand uniforms.', rect: { x0: 10, x1: 29, z0: -27, z1: -15 }, door: { x: 19.5, z: -12.5 }, zoneR: 3.2, activities: ['study'], color: 0x2b3a8c },
    { id: 'market', name: n.market, icon: '🧺', blurb: 'Hustle, haggle, and buy things that actually help.', rect: { x0: 9, x1: 30, z0: 10, z1: 27 }, door: { x: 19.5, z: 8.5 }, zoneR: 4.5, activities: ['hustle', 'shop', 'treat'], color: 0xe6a817, open: true },
    { id: 'mamaput', name: n.mamaput, icon: '🍲', blurb: 'Rice, gist and doing nothing together.', rect: { x0: 33, x1: 43, z0: 11, z1: 19 }, door: { x: 38, z: 8.5 }, zoneR: 3, activities: ['socialise', 'treat'], color: 0xc4562a },
    { id: 'pitch', name: n.pitch, icon: '⚽', blurb: 'Football, ludo and shouting until Mama calls.', rect: { x0: -45, x1: -31, z0: -35, z1: -21 }, door: { x: -38, z: -28 }, zoneR: 7.5, activities: ['play', 'exercise'], color: 0x2fa84f, open: true },
    { id: 'worship', name: n.worship, icon: '🕊️', blurb: 'Service, fellowship, town meetings and food.', rect: { x0: 33, x1: 44, z0: -24, z1: -13 }, door: { x: 38.5, z: -10.5 }, zoneR: 3, activities: ['community'], color: 0x7a3b9a },
    { id: 'busstop', name: n.busstop, icon: theme.city === 'abuja' ? '🚕' : '🚌', blurb: `Catch the ${CITIES[theme.city].vehicle.name} and run ${CITIES[theme.city].name} in Go-Slow Dash.`, rect: { x0: 4, x1: 8, z0: 21, z1: 26 }, door: { x: 2.2, z: 23 }, zoneR: 3.2, activities: ['dash'], color: 0xffd23f },
    { id: 'office', name: n.office, icon: '🏢', blurb: 'Where the salary comes from. And the stress.', rect: { x0: -27, x1: -12, z0: 13, z1: 27 }, door: { x: -19.5, z: 10.5 }, zoneR: 3, activities: ['overtime', 'quitJob'], color: 0x4a5a8a },
    { id: 'outing', name: n.outing, icon: theme.city === 'abuja' ? '⛰️' : '🏖️', blurb: theme.city === 'abuja' ? 'Hike up the hills with your friends. Abuja is built around them.' : 'Take your friends to the beach. This is Lagos weekend.', rect: { x0: 9, x1: 31, z0: -47, z1: -35 }, door: { x: 20, z: -32 }, zoneR: 6.5, activities: [theme.city === 'abuja' ? 'hike' : 'beach'], color: theme.city === 'abuja' ? 0x4a8a3a : 0x35b0d8, open: true },
    { id: 'gym', name: n.gym ?? `${theme.name} Fitness Gym`, icon: '🏋️', blurb: 'Treadmills, weights and mats behind glass walls, so the whole street can watch you sweat. Open from 5am.', rect: { x0: -44, x1: -31, z0: -19, z1: -9.5 }, door: { x: -37.5, z: -7 }, zoneR: 3, activities: ['exercise'], color: 0x1ec8b4 },
    { id: 'jobcentre', name: n.jobcentre, icon: '📝', blurb: 'CVs, aptitude tests and "who do you know?"', rect: { x0: -45, x1: -33, z0: 11, z1: 21 }, door: { x: -39, z: 8.5 }, zoneR: 3, activities: ['applyJob'], color: 0x0f7a4a },
  ], theme.id)
}

export const SPAWN = { x: -18.5, z: -6 } // where the first district starts you; every district now has its own, see spawnOf
/** Where you start (and the home end of the street): just in front of your own front door. */
export const spawnOf = (d: { places: Place[] }) => { const h = d.places.find((p) => p.id === 'home')!; return { x: h.door.x, z: h.door.z + 2.5 } }

export interface Prop { kind: 'house' | 'tree' | 'lamp' | 'kiosk' | 'stall' | 'bus' | 'generator' | 'fence' | 'tall' | 'palm' | 'billboard' | 'flag' | 'wall' | 'gate'; rect: Rect; color: number; h: number; blocks: boolean; text?: string }

export interface District {
  theme: DistrictTheme
  flavour: Flavour
  places: Place[]
  roads: Rect[]
  sidewalks: Rect[]
  props: Prop[]
  blockers: Rect[]
  buildings: { place?: PlaceId; rect: Rect; h: number; color: number; roof: number; /** a landmark of the other faith, standing nearby for show */ landmark?: boolean }[]
}

const r = (x0: number, x1: number, z0: number, z1: number): Rect => ({ x0, x1, z0, z1 })
export const inRect = (x: number, z: number, q: Rect, pad = 0) => x > q.x0 - pad && x < q.x1 + pad && z > q.z0 - pad && z < q.z1 + pad
const overlaps = (a: Rect, b: Rect, pad = 0) => a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.z0 < b.z1 + pad && a.z1 > b.z0 - pad

/** Aisle spots in the market where goods are displayed for the shopping task. */
export const SHOP_SPOTS: { x: number; z: number }[] = [
  { x: 14.8, z: 11.4 }, { x: 19.5, z: 11.4 }, { x: 24.5, z: 11.4 },
  { x: 14.2, z: 16.4 }, { x: 19.2, z: 16.4 }, { x: 24.2, z: 16.4 }, { x: 29.2, z: 16.4 },
  { x: 14.2, z: 21.2 }, { x: 19.2, z: 21.2 }, { x: 24.2, z: 21.2 },
]

/** The district as it looks for you: your faith decides the name of your place of worship. */
export function districtFor(districtId: string, faith: Faith = 'church'): District {
  const d = buildDistrict(districtId)
  const w = worshipName(d.theme.city, faith)
  return { ...d, places: d.places.map((p) => (p.id === 'worship' ? { ...p, name: w.name, blurb: w.blurb, icon: faith === 'mosque' ? '🕌' : '⛪' } : p)) }
}

export function buildDistrict(districtId: string): District {
  const theme = DISTRICTS[districtId] ?? DISTRICTS.surulere
  const places = placesFor(theme)
  const H = WORLD.half
  const roads = [r(-H, H, -3, 3), r(-3, 3, -H, H)]
  const sidewalks = [r(-H, H, -5, -3), r(-H, H, 3, 5), r(-5, -3, -H, H), r(3, 5, -H, H)]
  const flv = flavourOf(districtId)
  const rng = makeRng(districtId.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7))
  const buildings: District['buildings'] = []
  const blockers: Rect[] = []
  const props: Prop[] = []

  for (const p of places) {
    if (p.open) continue
    const fl = flv
    const look = p.id === 'home' ? fl.home : p.id === 'office' ? fl.office : p.id === 'school' ? fl.school : p.id === 'worship' ? fl.worship : null
    const h = look?.h ?? (p.id === 'busstop' ? 3.4 : 5)
    buildings.push({ place: p.id, rect: p.rect, h, color: look?.color ?? (p.id === 'jobcentre' ? 0xd9f0e2 : p.id === 'busstop' ? 0xdddddd : theme.wall[1]), roof: look?.roof ?? p.color })
    blockers.push(p.rect)
  }
  // the other faith's house of worship stands a little further up the road, so both are part of the skyline
  const landmark = r(33, 44, -39, -28)
  buildings.push({ rect: landmark, h: 9, color: 0xf4f0e6, roof: 0xd4a017, landmark: true }); blockers.push(landmark)
  const placeRects = [...places.map((p) => p.rect), landmark]
  const avoid = (q: Rect, pad = 2) => placeRects.some((pr) => overlaps(q, pr, pad)) || buildings.some((b) => overlaps(q, b.rect, pad)) || places.some((p) => inRect(p.door.x, p.door.z, q, 4))
  const openZones = places.filter((p) => p.open).map((p) => r(p.door.x - p.zoneR - 2, p.door.x + p.zoneR + 2, p.door.z - p.zoneR - 2, p.door.z + p.zoneR + 2))
  openZones.push(places.find((p) => p.id === 'outing')!.rect) // keep houses out of the hills and the beach

  // filler houses along the frontage of each block, keeping 8+ m from the main roads
  const count = Math.round(34 * theme.density)
  let tries = 0
  while (buildings.length < places.filter((p) => !p.open).length + count && tries++ < 900) {
    const w = rng.int(6, 11), d = rng.int(6, 10)
    const x0 = rng.int(-H + 2, H - 2 - w), z0 = rng.int(-H + 2, H - 2 - d)
    const q = r(x0, x0 + w, z0, z0 + d)
    if (overlaps(q, r(-H, H, -9, 9), 0) && !(Math.abs(z0) > 9)) { if (q.z1 > -9 && q.z0 < 9) continue }
    if (overlaps(q, r(-9, 9, -H, H), 0)) continue
    if (avoid(q, 3) || openZones.some((z) => overlaps(q, z, 1)) || buildings.some((b) => overlaps(q, b.rect, 2.5))) continue
    const tall = rng.chance(theme.tall + (flv.extras.includes('towers') ? 0.2 : 0))
    buildings.push({ rect: q, h: tall ? rng.int(9, 15) : rng.int(Math.max(3, Math.round(flv.home.h) - 2), Math.round(flv.home.h) + 1), color: rng.pick(theme.wall), roof: theme.roof })
    blockers.push(q)
  }

  // market stalls (collidable tables in rows with aisles)
  const market = places.find((p) => p.id === 'market')!
  for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
    const sx = 11 + col * 5, sz = 13 + row * 5
    const q = r(sx, sx + 2.6, sz, sz + 1.6)
    props.push({ kind: 'stall', rect: q, color: [0xf5b91c, 0xc4562a, 0x0f7a4a, 0x2b3a8c, 0xe0457b, 0x2bb3a6][(row * 4 + col) % 6], h: 2.4, blocks: true })
    blockers.push(q)
  }
  void market
  // trees (small trunk blockers) and lamps
  let t = 0
  while (props.filter((p) => p.kind === 'tree').length < theme.trees && t++ < 600) {
    const x = rng.int(-H + 2, H - 2), z = rng.int(-H + 2, H - 2)
    const q = r(x - 0.4, x + 0.4, z - 0.4, z + 0.4)
    if (Math.abs(x) < 6 || Math.abs(z) < 6) continue
    if (avoid(q, 2) || buildings.some((b) => overlaps(q, b.rect, 1.5)) || blockers.some((b) => overlaps(q, b, 1.5)) || openZones.some((z2) => overlaps(q, z2, 0))) continue
    props.push({ kind: 'tree', rect: q, color: 0x2f7a3a, h: rng.int(3, 5), blocks: true }); blockers.push(q)
  }
  for (let x = -44; x <= 44; x += 11) for (const z of [-5.6, 5.6]) props.push({ kind: 'lamp', rect: r(x - 0.1, x + 0.1, z - 0.1, z + 0.1), color: 0x44444e, h: 5.4, blocks: false })
  // parked danfo (Lagos) or taxi (Abuja) and kiosks near the bus stop and along the road
  const bus = r(6, 8.6, 12, 17.5)
  props.push({ kind: 'bus', rect: bus, color: 0xffd23f, h: 2.6, blocks: true }); blockers.push(bus)
  for (const [kx, kz] of [[-8, 6.5], [9.5, -6.5], [-30, -6.5], [30, 6.5]]) { const k = r(kx, kx + 2, kz, kz + 1.6); if (!avoid(k, 0)) { props.push({ kind: 'kiosk', rect: k, color: 0xe0457b, h: 2.4, blocks: true }); blockers.push(k) } }
  // ---- what makes this district itself ----
  const free = (q: Rect, pad = 1.5) => !avoid(q, 2) && !buildings.some((b) => overlaps(q, b.rect, pad)) && !blockers.some((b) => overlaps(q, b, pad)) && !openZones.some((z2) => overlaps(q, z2, 0))
  const scatter = (n: number, make: (x: number, z: number) => Prop | null, minAbs = 6) => {
    let placed = 0, k = 0
    while (placed < n && k++ < 500) {
      const x = rng.int(-H + 3, H - 3), z = rng.int(-H + 3, H - 3)
      if (Math.abs(x) < minAbs || Math.abs(z) < minAbs) continue
      const pr = make(x, z); if (!pr || !free(pr.rect)) continue
      props.push(pr); if (pr.blocks) blockers.push(pr.rect); placed++
    }
  }
  const ex = (e: Flavour['extras'][number]) => flv.extras.includes(e)
  if (ex('palms')) scatter(16, (x, z) => ({ kind: 'palm', rect: r(x - 0.4, x + 0.4, z - 0.4, z + 0.4), color: 0x2f8a3a, h: rng.int(5, 8), blocks: true }))
  if (ex('generators')) scatter(7, (x, z) => ({ kind: 'generator', rect: r(x, x + 1.4, z, z + 1), color: 0x888890, h: 0.9, blocks: true }), 9)
  if (ex('billboards') || ex('posters')) {
    const slots: [number, number][] = [[-30, -9], [-14, 8.5], [16, -8.5], [34, 8.5], [-38, 8.5], [8, -45]]
    slots.forEach(([bx, bz], i) => { const q = r(bx - 1.6, bx + 1.6, bz - 0.3, bz + 0.3); if (!avoid(q, 0) && !buildings.some((b) => overlaps(q, b.rect, 0.5))) props.push({ kind: 'billboard', rect: q, color: ex('posters') ? 0x1f9d55 : 0xffd23f, h: 5, blocks: false, text: flv.slogans[i % flv.slogans.length] }) })
  }
  if (ex('flags')) for (const p of places) if (['school', 'office', 'worship', 'home'].includes(p.id)) props.push({ kind: 'flag', rect: r(p.door.x + 2.4, p.door.x + 2.6, p.door.z + 0.6, p.door.z + 0.8), color: 0x1f9d55, h: 7, blocks: false })
  if (ex('walls')) {
    let n = 0
    for (const b of buildings) {
      if (n >= 18 && b.place !== 'home') break
      const q = r(b.rect.x0 - 0.8, b.rect.x1 + 0.8, b.rect.z1 + 0.5, b.rect.z1 + 0.8)
      props.push({ kind: 'wall', rect: q, color: b.color, h: b.place === 'home' ? 2.0 : 1.6, blocks: false })
      if (b.place === 'home') { const gx = places.find((p) => p.id === 'home')!.door.x; props.push({ kind: 'gate', rect: r(gx - 1.4, gx + 1.4, b.rect.z1 + 0.45, b.rect.z1 + 0.85), color: 0x2a2a34, h: 2.2, blocks: false }) }
      n++
    }
  }
  return { theme, flavour: flv, places, roads, sidewalks, props, blockers, buildings }
}
