// What makes each district look and feel like itself. Lagos and Abuja differ (yellow-black danfos and touts versus green taxis,
// politicians and hills), and so does each district inside them (Kubwa is not Wuse, Surulere is not Lekki).
// Pure data: layout.ts reads it for building looks and props, WorldRenderer for traffic, crowds and scenery.
export type VehicleKind = 'danfo' | 'okada' | 'keke' | 'brt' | 'cab' | 'suv'
export type CrowdKind = 'tout' | 'politician' | 'hawker'
export type Skyline = 'hills' | 'highrise' | 'lagoon' | 'ocean' | 'flat'
export type Extra = 'palms' | 'billboards' | 'flags' | 'walls' | 'generators' | 'posters' | 'towers' | 'hillsNear'

export interface BuildingLook { h: number; color: number; roof: number }
export interface Flavour {
  home: BuildingLook & { floors: number }
  school: BuildingLook
  office: BuildingLook
  worship: BuildingLook
  /** colour of the ground cover and, for hilly places, how many green hills crowd the edges */
  extras: Extra[]
  traffic: { kinds: VehicleKind[]; count: number; convoy?: boolean }
  crowd: { kind: CrowdKind; n: number }[]
  skyline: Skyline
  /** the group trip on offer here */
  outing: 'hike' | 'beach'
  /** a line the street says out loud (billboards and posters) */
  slogans: string[]
  /** tint for the inside of the home */
  homeInterior: { wall: number; floor: number }
}

const LAGOS_ADS = ['FRESH BREAD', 'PHONE REPAIR', 'ESTATE FOR SALE', 'GEN SERVICING', 'PURE WATER', 'LOADED SUYA']
const ABUJA_ADS = ['VOTE FOR PROGRESS', 'A BETTER ABUJA', 'JOBS FOR YOUTH', 'ESTATE FOR SALE', 'CHANGE IS COMING', 'FEDERAL CAPITAL']

export const FLAVOUR: Record<string, Flavour> = {
  // ---------------- Lagos ----------------
  surulere: {
    home: { h: 6.5, color: 0xe9b873, roof: 0x8a3b24, floors: 2 }, // face-me-I-face-you, two storeys, yellow paint
    school: { h: 5.5, color: 0xf2e3c2, roof: 0x2b3a8c }, office: { h: 11, color: 0xc9d3dd, roof: 0x44505a }, worship: { h: 8, color: 0xf4ecff, roof: 0x7a3b9a },
    extras: ['billboards', 'generators'], traffic: { kinds: ['danfo', 'danfo', 'okada', 'keke'], count: 7 }, crowd: [{ kind: 'tout', n: 3 }, { kind: 'hawker', n: 2 }],
    skyline: 'flat', outing: 'beach', slogans: LAGOS_ADS, homeInterior: { wall: 0xf0d9a0, floor: 0xb98b5a },
  },
  ikorodu: {
    home: { h: 3.6, color: 0xd6b58a, roof: 0x6a4a2a, floors: 1 }, // bungalow in a compound
    school: { h: 4.6, color: 0xefe7cf, roof: 0x3a7a3a }, office: { h: 9, color: 0xd9d4c8, roof: 0x5a4a3a }, worship: { h: 7, color: 0xf0e6d0, roof: 0x8a5a2a },
    extras: ['palms', 'walls', 'generators'], traffic: { kinds: ['danfo', 'danfo', 'keke', 'keke'], count: 6 }, crowd: [{ kind: 'tout', n: 3 }, { kind: 'hawker', n: 2 }],
    skyline: 'lagoon', outing: 'beach', slogans: LAGOS_ADS, homeInterior: { wall: 0xe9d9b8, floor: 0xa9805a },
  },
  yaba: {
    home: { h: 8.5, color: 0xc9d3dd, roof: 0x44505a, floors: 3 }, // duplex near the campuses
    school: { h: 7, color: 0xe6dcc3, roof: 0x44505a }, office: { h: 17, color: 0xb9d0e6, roof: 0x2e3a48 }, worship: { h: 8, color: 0xe6e0f4, roof: 0x5a4a8a },
    extras: ['billboards', 'towers', 'generators'], traffic: { kinds: ['danfo', 'brt', 'brt', 'danfo', 'okada'], count: 7 }, crowd: [{ kind: 'tout', n: 2 }, { kind: 'hawker', n: 2 }],
    skyline: 'highrise', outing: 'beach', slogans: ['CO-WORKING SPACE', 'LEARN TO CODE', 'FRESH BREAD', 'PHONE REPAIR', 'STUDENT LODGE', 'PRINTING CENTRE'], homeInterior: { wall: 0xdde6ee, floor: 0xc9b99a },
  },
  lekki: {
    home: { h: 9, color: 0xf6f4ec, roof: 0x5a6a7a, floors: 3 }, // white gated estate house
    school: { h: 6.5, color: 0xf8f6ee, roof: 0x2b6a9a }, office: { h: 15, color: 0xdde8f2, roof: 0x3a5a7a }, worship: { h: 9, color: 0xfbf8ff, roof: 0x6a5aa8 },
    extras: ['palms', 'walls', 'generators', 'towers'], traffic: { kinds: ['suv', 'suv', 'brt', 'danfo'], count: 6 }, crowd: [{ kind: 'tout', n: 1 }, { kind: 'hawker', n: 1 }],
    skyline: 'ocean', outing: 'beach', slogans: ['ESTATE FOR SALE', 'LUXURY APARTMENTS', 'BEACH RESORT', 'GEN SERVICING', 'OPEN HOUSE', 'SHORTLET'], homeInterior: { wall: 0xf4f1e8, floor: 0xe0d6c0 },
  },
  // ---------------- Abuja ----------------
  kubwa: {
    home: { h: 3.4, color: 0xe3b48a, roof: 0x8a3b2a, floors: 1 }, // red-earth bungalow with a zinc roof
    school: { h: 4.4, color: 0xf0e2c6, roof: 0x2f7a4a }, office: { h: 8, color: 0xe3d6c0, roof: 0x7a5a3a }, worship: { h: 7, color: 0xf2eadb, roof: 0x4a7a5a },
    extras: ['hillsNear', 'posters', 'generators'], traffic: { kinds: ['cab', 'keke', 'keke', 'cab'], count: 6 }, crowd: [{ kind: 'hawker', n: 3 }, { kind: 'politician', n: 1 }],
    skyline: 'hills', outing: 'hike', slogans: ABUJA_ADS, homeInterior: { wall: 0xecd5b4, floor: 0xb08a62 },
  },
  garki: {
    home: { h: 6, color: 0xefe6d0, roof: 0x6b7d5a, floors: 2 }, // neat terraced block near the secretariat
    school: { h: 6.5, color: 0xf3ecd8, roof: 0x6b7d5a }, office: { h: 12, color: 0xe9e3d0, roof: 0x55654a }, worship: { h: 9, color: 0xf6f0e0, roof: 0x4a6a4a },
    extras: ['flags', 'posters', 'hillsNear'], traffic: { kinds: ['cab', 'cab', 'suv'], count: 6, convoy: true }, crowd: [{ kind: 'politician', n: 4 }, { kind: 'hawker', n: 1 }],
    skyline: 'hills', outing: 'hike', slogans: ABUJA_ADS, homeInterior: { wall: 0xf2ead4, floor: 0xc2b08a },
  },
  wuse: {
    home: { h: 11, color: 0xe3ebf2, roof: 0x4f6272, floors: 4 }, // apartment block in the middle of the city
    school: { h: 7, color: 0xe9eef2, roof: 0x4f6272 }, office: { h: 18, color: 0xbad4e8, roof: 0x34485a }, worship: { h: 9, color: 0xf0f4f8, roof: 0x4f6a82 },
    extras: ['billboards', 'towers', 'flags', 'hillsNear'], traffic: { kinds: ['cab', 'cab', 'cab', 'suv'], count: 7 }, crowd: [{ kind: 'politician', n: 3 }, { kind: 'hawker', n: 2 }],
    skyline: 'highrise', outing: 'hike', slogans: ABUJA_ADS, homeInterior: { wall: 0xe8eef2, floor: 0xcdbf9f },
  },
  maitama: {
    home: { h: 7.5, color: 0xf6f3ea, roof: 0x5a6f7f, floors: 2 }, // villa behind a gate and a wall
    school: { h: 6.5, color: 0xf8f4ea, roof: 0x5a6f7f }, office: { h: 12, color: 0xece6d6, roof: 0x5a6f7f }, worship: { h: 9, color: 0xfbf7ec, roof: 0x6a7f8f },
    extras: ['walls', 'flags', 'hillsNear', 'palms'], traffic: { kinds: ['suv', 'suv', 'cab'], count: 5, convoy: true }, crowd: [{ kind: 'politician', n: 4 }],
    skyline: 'hills', outing: 'hike', slogans: ['A BETTER ABUJA', 'VOTE FOR PROGRESS', 'EMBASSY ROW', 'JOBS FOR YOUTH', 'CHANGE IS COMING', 'FEDERAL CAPITAL'], homeInterior: { wall: 0xf6f1e4, floor: 0xd8c9a8 },
  },
}
export const flavourOf = (districtId: string): Flavour => FLAVOUR[districtId] ?? FLAVOUR.surulere

export type Faith = 'church' | 'mosque'
/** Which house of worship is yours: a mosque for Hausa players or when your story made you Muslim, otherwise a church. */
export const faithOf = (life: { character: { heritage: string }; flags: Record<string, unknown> }): Faith => (life.flags.faithMuslim || life.character.heritage === 'hausa' ? 'mosque' : 'church')
/** The name and blurb of your place of worship in each city. */
export function worshipName(city: 'lagos' | 'abuja', faith: Faith): { name: string; blurb: string } {
  if (city === 'abuja') return faith === 'mosque'
    ? { name: 'National Mosque', blurb: 'The golden dome and four tall minarets. Prayers, fellowship and food.' }
    : { name: 'National Ecumenical Centre', blurb: 'The big white church by the hills. Service, fellowship and food.' }
  return faith === 'mosque'
    ? { name: 'Central Mosque', blurb: 'Green domes and two tall minarets. Prayers, fellowship and food.' }
    : { name: 'Praise Cathedral', blurb: 'A big auditorium with a cross on the tower. Service, vigils and food.' }
}
