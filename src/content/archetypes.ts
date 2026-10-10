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
}

export const ARCHETYPES: ArchetypeDef[] = [
  { id: 'silverSpoon', title: 'Born With the Spoon', tagline: 'Private school, driver, and very high expectations.', icon: '🥄', tier: 'comfortable', schoolType: 'private', startCash: 300000, debt: 0, perks: ['Private school', 'Strong family safety net'], constraints: ['Everyone expects great things (+stress)', 'Black tax is heavier later'], startFlags: { highExpectations: true }, startStats: { stress: 15, knowledge: 8 } },
  { id: 'civilServant', title: "Civil Servant's Child", tagline: 'Steady salary, strict bedtime, federal school dreams.', icon: '🗂️', tier: 'middle', schoolType: 'federal', startCash: 120000, debt: 0, perks: ['Federal unity school', 'Stable home'], constraints: ['Little room for mistakes'], startStats: { knowledge: 6, reputation: 4 } },
  { id: 'marketKid', title: "Market Mama's Kid", tagline: 'You learned to count change before you learned to read.', icon: '🧺', tier: 'lowerMiddle', schoolType: 'public', startCash: 60000, debt: 0, perks: ['Hustle instincts (side hustles pay more)', 'Street smarts'], constraints: ['Fewer books at home'], gain: { cash: 1.1 }, startFlags: { marketKid: true }, startStats: { reputation: 6 } },
  { id: 'bigFamily', title: 'Big Family, Small Space', tagline: 'Seven in one room, love in every corner.', icon: '👨‍👩‍👧‍👦', tier: 'struggling', schoolType: 'public', startCash: 20000, debt: 0, perks: ['Everyone has your back', 'Happiness comes easier'], constraints: ['Cash is always tight'], gain: { happiness: 1.15 }, startFlags: { bigFamily: true }, startStats: { happiness: 6 } },
  { id: 'scholar', title: 'Scholarship Child', tagline: 'Little money, big brain, and a teacher who believes in you.', icon: '🎓', tier: 'struggling', schoolType: 'public', startCash: 15000, debt: 0, perks: ['Learn 20% faster', 'School fees partly covered'], constraints: ['Money is tight and pressure is real'], gain: { knowledge: 1.2 }, startFlags: { scholarship: true }, startStats: { knowledge: 10, stress: 8 } },
  { id: 'diaspora', title: 'Cousin Abroad', tagline: 'Dollars arrive sometimes. So do opinions.', icon: '✈️', tier: 'middle', schoolType: 'private', startCash: 150000, debt: 0, perks: ['Remittance gifts', 'Exposure to the world'], constraints: ['Family expects you to "japa" too'], startFlags: { diasporaCousin: true }, startStats: { reputation: 5 } },
]
export const ARCHETYPE_BY_ID = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a]))

export interface HomeDef { id: string; name: string; district: string; blurb: string; tag: 'Hard start' | 'Balanced' | 'Big spender'; minTier: FamilyTier; costMult: number }
export const HOMES: HomeDef[] = [
  { id: 'ikorodu', name: 'Ikorodu Compound', district: 'Ikorodu', blurb: 'Big yard, long commute, strong community and fresh pepper soup.', tag: 'Hard start', minTier: 'struggling', costMult: 0.85 },
  { id: 'surulere', name: 'Surulere Flat', district: 'Surulere', blurb: 'Football on the street, school close by, neighbours who know your business.', tag: 'Balanced', minTier: 'lowerMiddle', costMult: 1 },
  { id: 'yaba', name: 'Yaba Duplex Rooms', district: 'Yaba', blurb: 'Near the campuses and tech hubs. Rent talks loudly.', tag: 'Balanced', minTier: 'middle', costMult: 1.15 },
  { id: 'lekki', name: 'Lekki Estate', district: 'Lekki', blurb: 'Gated estate, generator that never sleeps, traffic to the Island.', tag: 'Big spender', minTier: 'comfortable', costMult: 1.5 },
]
const TIER_RANK: Record<FamilyTier, number> = { struggling: 0, lowerMiddle: 1, middle: 2, comfortable: 3 }
export const tierRank = (t: FamilyTier) => TIER_RANK[t]
