import type { FamilyTier, SchoolType, StatKey } from '@engine/core/types'

export interface ArchetypeDef {
  id: string
  title: string
  tagline: string
  icon: string
  tier: FamilyTier
  schoolType: SchoolType
  startCash: number
  debt: number
  perks: string[]
  constraints: string[]
  gain?: Partial<Record<StatKey, number>>
  startFlags?: Record<string, boolean | number | string>
  startStats?: Partial<Record<StatKey, number>>
  heirloom: string // item id handed down by the luck scroll
}

export const ARCHETYPES: ArchetypeDef[] = [
  { id: 'silverSpoon', heirloom: 'goldChain', title: 'Born With the Spoon', tagline: 'Private school, driver, and very high expectations.', icon: '🥄', tier: 'comfortable', schoolType: 'private', startCash: 300000, debt: 0, perks: ['Private school', 'Strong family safety net'], constraints: ['Everyone expects great things (+stress)', 'Black tax is heavier later'], startFlags: { highExpectations: true }, startStats: { stress: 15, knowledge: 8 } },
  { id: 'civilServant', heirloom: 'idBadge', title: "Civil Servant's Child", tagline: 'Steady salary, strict bedtime, federal school dreams.', icon: '🗂️', tier: 'middle', schoolType: 'federal', startCash: 120000, debt: 0, perks: ['Federal unity school', 'Stable home'], constraints: ['Little room for mistakes'], startStats: { knowledge: 6, reputation: 4 } },
  { id: 'marketKid', heirloom: 'coinPouch', title: "Market Mama's Kid", tagline: 'You learned to count change before you learned to read.', icon: '🧺', tier: 'lowerMiddle', schoolType: 'public', startCash: 60000, debt: 0, perks: ['Hustle instincts (side hustles pay more)', 'Street smarts'], constraints: ['Fewer books at home'], gain: { cash: 1.1 }, startFlags: { marketKid: true }, startStats: { reputation: 6 } },
  { id: 'bigFamily', heirloom: 'familyScarf', title: 'Big Family, Small Space', tagline: 'Seven in one room, love in every corner.', icon: '👨‍👩‍👧‍👦', tier: 'struggling', schoolType: 'public', startCash: 20000, debt: 0, perks: ['Everyone has your back', 'Happiness comes easier'], constraints: ['Cash is always tight'], gain: { happiness: 1.15 }, startFlags: { bigFamily: true }, startStats: { happiness: 6 } },
  { id: 'scholar', heirloom: 'scholarKit', title: 'Scholarship Child', tagline: 'Little money, big brain, and a teacher who believes in you.', icon: '🎓', tier: 'struggling', schoolType: 'public', startCash: 15000, debt: 0, perks: ['Learn 20% faster', 'School fees partly covered'], constraints: ['Money is tight and pressure is real'], gain: { knowledge: 1.2 }, startFlags: { scholarship: true }, startStats: { knowledge: 10, stress: 8 } },
  { id: 'diaspora', heirloom: 'cousinCap', title: 'Cousin Abroad', tagline: 'Dollars arrive sometimes. So do opinions.', icon: '✈️', tier: 'middle', schoolType: 'private', startCash: 150000, debt: 0, perks: ['Remittance gifts', 'Exposure to the world'], constraints: ['Family expects you to "japa" too'], startFlags: { diasporaCousin: true }, startStats: { reputation: 5 } },
]
/** How each luck-scroll result reads in Abuja (Lagos uses the default tagline above). */
const ABUJA_TAGLINE: Record<string, string> = {
  silverSpoon: 'Gated Maitama estate, a driver at the gate and very high expectations.',
  civilServant: 'Federal Secretariat parent: steady salary, strict bedtime, a federal school waiting for you.',
  marketKid: 'You learned to count change at Wuse Market before you learned to read.',
  bigFamily: 'Seven in one flat in Kubwa, love in every corner.',
  scholar: 'Little money, big brain, and a teacher who believes in you.',
  diaspora: 'Dollars arrive sometimes, and so do opinions about your life.',
}
export const taglineFor = (a: ArchetypeDef, city: 'lagos' | 'abuja') => (city === 'abuja' ? ABUJA_TAGLINE[a.id] ?? a.tagline : a.tagline)

export const ARCHETYPE_BY_ID = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a]))

export interface HomeDef { id: string; city: 'lagos' | 'abuja'; name: string; district: string; blurb: string; tag: 'Hard start' | 'Balanced' | 'Big spender'; minTier: FamilyTier; costMult: number }
export const HOMES: HomeDef[] = [
  { id: 'ikorodu', city: 'lagos', name: 'Ikorodu Compound', district: 'Ikorodu', blurb: 'Big yard, long commute, strong community and fresh pepper soup.', tag: 'Hard start', minTier: 'struggling', costMult: 0.85 },
  { id: 'surulere', city: 'lagos', name: 'Surulere Flat', district: 'Surulere', blurb: 'Football on the street, school close by, neighbours who know your business.', tag: 'Balanced', minTier: 'lowerMiddle', costMult: 1 },
  { id: 'yaba', city: 'lagos', name: 'Yaba Duplex Rooms', district: 'Yaba', blurb: 'Near the campuses and tech hubs. Rent talks loudly.', tag: 'Balanced', minTier: 'middle', costMult: 1.15 },
  { id: 'lekki', city: 'lagos', name: 'Lekki Estate', district: 'Lekki', blurb: 'Gated estate, generator that never sleeps, traffic to the Island.', tag: 'Big spender', minTier: 'comfortable', costMult: 1.5 },
  { id: 'kubwa', city: 'abuja', name: 'Kubwa Compound', district: 'Kubwa', blurb: 'Busy satellite town, long road to the city, neighbours who share everything.', tag: 'Hard start', minTier: 'struggling', costMult: 0.85 },
  { id: 'garki', city: 'abuja', name: 'Garki Flat', district: 'Garki', blurb: 'Near the secretariat and the big markets. Steady, sensible, a little crowded.', tag: 'Balanced', minTier: 'lowerMiddle', costMult: 1 },
  { id: 'wuse', city: 'abuja', name: 'Wuse II Apartment', district: 'Wuse', blurb: 'Cafés, offices and nightlife in the middle of the city. Rent talks loudly.', tag: 'Balanced', minTier: 'middle', costMult: 1.2 },
  { id: 'maitama', city: 'abuja', name: 'Maitama Estate', district: 'Maitama', blurb: 'Quiet streets, embassies and security gates. Everything costs more.', tag: 'Big spender', minTier: 'comfortable', costMult: 1.6 },
]
const TIER_RANK: Record<FamilyTier, number> = { struggling: 0, lowerMiddle: 1, middle: 2, comfortable: 3 }
export const tierRank = (t: FamilyTier) => TIER_RANK[t]
