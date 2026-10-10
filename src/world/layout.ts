// Walkable district layout. Pure data + helpers: no Three.js, no DOM. Units are metres; x east, z south.
import { makeRng } from '@engine/core/rng'

export interface Rect { x0: number; x1: number; z0: number; z1: number }
export type PlaceId = 'home' | 'school' | 'market' | 'mamaput' | 'pitch' | 'worship' | 'busstop' | 'office' | 'jobcentre'

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
  id: string; name: string; tagline: string
  wall: number[]; roof: number; ground: number; roadColor: number; sidewalk: number
  trees: number; density: number; tall: number
  names: Record<PlaceId, string>
}

export const DISTRICTS: Record<string, DistrictTheme> = {
  surulere: {
    id: 'surulere', name: 'Surulere', tagline: 'Football on every street, neighbours who know your business.',
    wall: [0xe8c9a0, 0xd9a05b, 0xf0d9a8, 0xcf8a5a, 0xdcae92], roof: 0xa8452a, ground: 0x8aa84a, roadColor: 0x3d3d46, sidewalk: 0xd8cfc0, trees: 26, density: 1, tall: 0.2,
    names: { home: 'Your home', school: 'Surulere School', market: 'Aguda Market', mamaput: "Mama Chidi's Buka", pitch: 'Street Football Pitch', worship: 'Place of Worship', busstop: 'Danfo Bus Stop', office: 'Your Workplace', jobcentre: 'Cyber Café & Job Centre' },
  },
  ikorodu: {
    id: 'ikorodu', name: 'Ikorodu', tagline: 'Long commutes, big yards, fresh pepper soup and strong community.',
    wall: [0xd6b58a, 0xc9a06a, 0xe2c8a0, 0xb88a56, 0xa8d0a0], roof: 0x7a4a2a, ground: 0x7fae4e, roadColor: 0x4a4540, sidewalk: 0xcdbf9f, trees: 40, density: 0.8, tall: 0.1,
    names: { home: 'Your home', school: 'Ikorodu Community School', market: 'Garage Market', mamaput: "Iya Ibeji's Buka", pitch: 'Compound Pitch', worship: 'Place of Worship', busstop: 'Ikorodu Garage Stop', office: 'Your Workplace', jobcentre: 'Business Centre & Job Desk' },
  },
  yaba: {
    id: 'yaba', name: 'Yaba', tagline: 'Campuses, tech hubs and rent that talks loudly.',
    wall: [0xc9d3dd, 0xe6c58a, 0x9fb7c9, 0xd8a7a0, 0xf0d9a8], roof: 0x44505a, ground: 0x88a063, roadColor: 0x3a3c45, sidewalk: 0xd0d4d8, trees: 22, density: 1.2, tall: 0.45,
    names: { home: 'Your home', school: 'Yaba College Area School', market: 'Yaba Market', mamaput: 'Tech Bro Buka', pitch: 'Campus Field', worship: 'Place of Worship', busstop: 'Yaba Bus Stop', office: 'Your Workplace', jobcentre: 'Co-working & Job Hub' },
  },
  lekki: {
    id: 'lekki', name: 'Lekki', tagline: 'Gated estates, generators that never sleep, traffic to the Island.',
    wall: [0xf2efe6, 0xe9e2d0, 0xcfd9e6, 0xe6d9c4, 0xdde6dc], roof: 0x5a6a7a, ground: 0x78b05a, roadColor: 0x33353d, sidewalk: 0xe3e0d8, trees: 34, density: 0.9, tall: 0.3,
    names: { home: 'Your home', school: 'Lekki Premier School', market: 'Lekki Mall & Market', mamaput: 'Skyline Kitchen', pitch: 'Estate Court', worship: 'Place of Worship', busstop: 'Lekki Bus Stop', office: 'Your Workplace', jobcentre: 'Recruitment Lounge' },
  },
}

export function placesFor(theme: DistrictTheme): Place[] {
  const n = theme.names
  return [
    { id: 'home', name: n.home, icon: '🏠', blurb: 'Sleep, eat, family and the end of the year.', rect: { x0: -25, x1: -12, z0: -21, z1: -11 }, door: { x: -18.5, z: -8.5 }, zoneR: 3, activities: ['rest', 'familyTime', 'chores', 'treat'], color: 0xa8452a },
    { id: 'school', name: n.school, icon: '🏫', blurb: 'Pop quizzes, strict teachers and ten thousand uniforms.', rect: { x0: 10, x1: 29, z0: -27, z1: -15 }, door: { x: 19.5, z: -12.5 }, zoneR: 3.2, activities: ['study'], color: 0x2b3a8c },
    { id: 'market', name: n.market, icon: '🧺', blurb: 'Hustle, haggle, and buy things that actually help.', rect: { x0: 9, x1: 30, z0: 10, z1: 27 }, door: { x: 19.5, z: 8.5 }, zoneR: 4.5, activities: ['hustle', 'shop', 'treat'], color: 0xe6a817, open: true },
    { id: 'mamaput', name: n.mamaput, icon: '🍲', blurb: 'Rice, gist and doing nothing together.', rect: { x0: 33, x1: 43, z0: 11, z1: 19 }, door: { x: 38, z: 8.5 }, zoneR: 3, activities: ['socialise', 'treat'], color: 0xc4562a },
    { id: 'pitch', name: n.pitch, icon: '⚽', blurb: 'Football, ludo and shouting until Mama calls.', rect: { x0: -45, x1: -31, z0: -35, z1: -21 }, door: { x: -38, z: -28 }, zoneR: 7.5, activities: ['play', 'exercise'], color: 0x2fa84f, open: true },
    { id: 'worship', name: n.worship, icon: '🕊️', blurb: 'Service, fellowship, town meetings and food.', rect: { x0: 33, x1: 44, z0: -24, z1: -13 }, door: { x: 38.5, z: -10.5 }, zoneR: 3, activities: ['community'], color: 0x7a3b9a },
    { id: 'busstop', name: n.busstop, icon: '🚌', blurb: 'Catch the danfo and run Lagos in Go-Slow Dash.', rect: { x0: 4, x1: 8, z0: 21, z1: 26 }, door: { x: 2.2, z: 23 }, zoneR: 3.2, activities: ['dash'], color: 0xffd23f },
    { id: 'office', name: n.office, icon: '🏢', blurb: 'Where the salary comes from. And the stress.', rect: { x0: -27, x1: -12, z0: 13, z1: 27 }, door: { x: -19.5, z: 10.5 }, zoneR: 3, activities: ['overtime', 'quitJob'], color: 0x4a5a8a },
    { id: 'jobcentre', name: n.jobcentre, icon: '📝', blurb: 'CVs, aptitude tests and "who do you know?"', rect: { x0: -45, x1: -33, z0: 11, z1: 21 }, door: { x: -39, z: 8.5 }, zoneR: 3, activities: ['applyJob'], color: 0x0f7a4a },
  ]
}

export const SPAWN = { x: -18.5, z: -6 }

export interface Prop { kind: 'house' | 'tree' | 'lamp' | 'kiosk' | 'stall' | 'bus' | 'generator' | 'fence' | 'tall'; rect: Rect; color: number; h: number; blocks: boolean }

export interface District {
  theme: DistrictTheme
  places: Place[]
  roads: Rect[]
  sidewalks: Rect[]
  props: Prop[]
  blockers: Rect[]
  buildings: { place?: PlaceId; rect: Rect; h: number; color: number; roof: number }[]
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

export function buildDistrict(districtId: string): District {
  const theme = DISTRICTS[districtId] ?? DISTRICTS.surulere
  const places = placesFor(theme)
  const H = WORLD.half
  const roads = [r(-H, H, -3, 3), r(-3, 3, -H, H)]
  const sidewalks = [r(-H, H, -5, -3), r(-H, H, 3, 5), r(-5, -3, -H, H), r(3, 5, -H, H)]
  const rng = makeRng(districtId.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7))
  const buildings: District['buildings'] = []
  const blockers: Rect[] = []
  const props: Prop[] = []

  for (const p of places) {
    if (p.open) continue
    const h = p.id === 'office' ? 13 : p.id === 'school' ? 5.5 : p.id === 'worship' ? 7 : p.id === 'busstop' ? 3.4 : 5
    buildings.push({ place: p.id, rect: p.rect, h, color: p.id === 'home' ? theme.wall[0] : p.id === 'office' ? 0xcfd8f2 : p.id === 'school' ? 0xf7efe0 : p.id === 'worship' ? 0xf4ecff : p.id === 'jobcentre' ? 0xd9f0e2 : p.id === 'busstop' ? 0xdddddd : theme.wall[1], roof: p.color })
    blockers.push(p.rect)
  }
  const placeRects = places.map((p) => p.rect)
  const avoid = (q: Rect, pad = 2) => placeRects.some((pr) => overlaps(q, pr, pad)) || buildings.some((b) => overlaps(q, b.rect, pad)) || places.some((p) => inRect(p.door.x, p.door.z, q, 4))
  const openZones = places.filter((p) => p.open).map((p) => r(p.door.x - p.zoneR - 2, p.door.x + p.zoneR + 2, p.door.z - p.zoneR - 2, p.door.z + p.zoneR + 2))

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
    const tall = rng.chance(theme.tall)
    buildings.push({ rect: q, h: tall ? rng.int(9, 15) : rng.int(3, 6), color: rng.pick(theme.wall), roof: theme.roof })
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
  // parked danfo and kiosks near the bus stop and along the road
  const bus = r(6, 8.6, 12, 17.5)
  props.push({ kind: 'bus', rect: bus, color: 0xffd23f, h: 2.6, blocks: true }); blockers.push(bus)
  for (const [kx, kz] of [[-8, 6.5], [9.5, -6.5], [-30, -6.5], [30, 6.5]]) { const k = r(kx, kx + 2, kz, kz + 1.6); if (!avoid(k, 0)) { props.push({ kind: 'kiosk', rect: k, color: 0xe0457b, h: 2.4, blocks: true }); blockers.push(k) } }
  return { theme, places, roads, sidewalks, props, blockers, buildings }
}
