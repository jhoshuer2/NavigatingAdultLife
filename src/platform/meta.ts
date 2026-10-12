import type { GameState } from '@engine/core/types'

export interface Settings { sound: boolean; music: boolean; volume: number; reducedMotion: boolean; bigText: boolean; assist: boolean; lite: boolean; lang?: 'en' | 'pcm' | 'both'; guide?: boolean }
export interface LifeSummary { name: string; age: number; ending: string; legacy: number; netWorth: number; at: number; dream: string; dreamDone: boolean }
export interface TokenState { freeSec: number; paidSec: number; lastRefillDay: string; welcomeGranted: boolean; unlimited: boolean }

export interface MetaProfile {
  version: 1
  cowries: number
  unlocks: string[]
  achievements: Record<string, number>
  stats: { lives: number; bestLegacy: number; dashBest: number; longestLife: number }
  settings: Settings
  history: LifeSummary[]
  tokens: TokenState
  seenTutorial: boolean
  langAsked?: boolean
  consentAnalytics: boolean
  /** True once the player has seen the first-run privacy screen (either answer). */
  consentAsked: boolean
}

export const WELCOME_SEC = 120 * 60
export const DAILY_SEC = 30 * 60
export const FREE_CAP_SEC = 120 * 60

export const defaultMeta = (): MetaProfile => ({
  version: 1, cowries: 0, unlocks: [], achievements: {},
  stats: { lives: 0, bestLegacy: 0, dashBest: 0, longestLife: 0 },
  settings: { sound: true, music: true, volume: 0.6, reducedMotion: false, bigText: false, assist: false, lite: false },
  history: [], tokens: { freeSec: 0, paidSec: 0, lastRefillDay: '', welcomeGranted: false, unlimited: false },
  langAsked: false, seenTutorial: false, consentAnalytics: false, consentAsked: false,
})

export interface Unlockable { id: string; kind: 'hair' | 'outfit' | 'fabric' | 'perk'; name: string; cost: number; desc: string }
export const UNLOCKABLES: Unlockable[] = [
  { id: 'hair:locs', kind: 'hair', name: 'Locs', cost: 8, desc: 'Hairstyle' },
  { id: 'hair:cornrows', kind: 'hair', name: 'Cornrows', cost: 8, desc: 'Hairstyle' },
  { id: 'hair:bun', kind: 'hair', name: 'Bun', cost: 8, desc: 'Hairstyle' },
  { id: 'hair:ponytail', kind: 'hair', name: 'Ponytail', cost: 8, desc: 'Hairstyle' },
  { id: 'hair:gele', kind: 'hair', name: 'Gele / head wrap', cost: 12, desc: 'Head wrap' },
  { id: 'outfit:siteWork', kind: 'outfit', name: 'Site work', cost: 6, desc: 'Outfit' },
  { id: 'outfit:chill', kind: 'outfit', name: 'Chill', cost: 6, desc: 'Outfit' },
  { id: 'outfit:owambe', kind: 'outfit', name: 'Owambe', cost: 10, desc: 'Outfit' },
  { id: 'outfit:traditional', kind: 'outfit', name: 'Traditional (buba/agbada)', cost: 12, desc: 'Outfit' },
  { id: 'fabric:adire', kind: 'fabric', name: 'Adire', cost: 8, desc: 'Fabric' },
  { id: 'fabric:asoOke', kind: 'fabric', name: 'Aso-oke', cost: 12, desc: 'Fabric' },
  { id: 'perk:headStart', kind: 'perk', name: 'Head start', cost: 20, desc: 'Start with +₦100,000' },
  { id: 'perk:sharpMind', kind: 'perk', name: 'Sharp mind', cost: 25, desc: 'Start with +6 Knowledge' },
  { id: 'perk:goodVibes', kind: 'perk', name: 'Good vibes', cost: 20, desc: 'Start with +8 Happiness' },
]
export const FREE_HAIR = ['afro', 'lowcut', 'braids', 'bald']
export const FREE_OUTFITS = ['casual', 'hoodie', 'office']
export const FREE_FABRICS = ['plain', 'ankara']

export function mergeEnding(meta: MetaProfile, s: GameState): MetaProfile {
  const e = s.ending
  if (!e) return meta
  const m = structuredClone(meta)
  m.cowries += e.cowries
  for (const a of s.achievements) if (!m.achievements[a]) m.achievements[a] = Date.now()
  m.stats.lives += 1
  m.stats.bestLegacy = Math.max(m.stats.bestLegacy, e.legacy)
  m.stats.dashBest = Math.max(m.stats.dashBest, s.dashBest)
  m.stats.longestLife = Math.max(m.stats.longestLife, s.character.age)
  m.history = [{ name: s.character.name, age: s.character.age, ending: e.title, legacy: e.legacy, netWorth: e.netWorth, at: Date.now(), dream: s.character.dreamId, dreamDone: e.dreamDone }, ...m.history].slice(0, 20)
  return m
}
