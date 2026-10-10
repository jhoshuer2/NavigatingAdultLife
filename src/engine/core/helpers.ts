import type { Character, Credential, GameState, LifeStage, NPC, NpcRole, StatKey } from './types'
import { TRAIT_BY_ID } from '@content/traits'

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
export const STAT_RANGE: Record<Exclude<StatKey, 'cash' | 'maxEnergy'>, [number, number]> = {
  energy: [0, 100], happiness: [0, 100], knowledge: [0, 100], reputation: [0, 100], health: [0, 100], stress: [0, 100],
}

export function stageForAge(age: number): LifeStage {
  if (age < 12) return 'child'
  if (age < 18) return 'teen'
  if (age < 30) return 'youngAdult'
  if (age < 60) return 'adult'
  return 'elder'
}

const CRED_RANK: Record<Credential, number> = { none: 0, primary: 1, ssce: 2, trade: 2, ond: 3, degree: 4 }
export function credentialAtLeast(have: Credential, need: Credential): boolean {
  if (need === 'trade') return have === 'trade' || have === 'ond' || have === 'degree'
  return CRED_RANK[have] >= CRED_RANK[need]
}

export function traitMult(c: Character, kind: 'gain' | 'loss', stat: StatKey): number {
  let m = 1
  for (const t of c.traits) m *= TRAIT_BY_ID[t as keyof typeof TRAIT_BY_ID]?.mods[kind]?.[stat] ?? 1
  return m
}
export function traitSum(c: Character, key: 'checkBonus' | 'maxEnergy' | 'socialBonus' | 'dashHearts'): number {
  let s = 0
  for (const t of c.traits) s += TRAIT_BY_ID[t as keyof typeof TRAIT_BY_ID]?.mods[key] ?? 0
  return s
}
export function traitProduct(c: Character, key: 'hustleIncome' | 'livingCost'): number {
  let m = 1
  for (const t of c.traits) m *= TRAIT_BY_ID[t as keyof typeof TRAIT_BY_ID]?.mods[key] ?? 1
  return m
}

export function npcByRole(s: GameState, role: NpcRole): NPC | undefined {
  const id = s.roles[role]
  return id ? s.npcs[id] : undefined
}

export function netWorth(s: GameState): number {
  const c = s.character
  const home = c.housing.type === 'rent' ? 0 : 0
  return c.stats.cash + home + (c.items.length * 50000)
}

export function pct(n: number) { return Math.round(n * 100) }
export const fmtNaira = (n: number) => `${n < 0 ? '−' : ''}₦${Math.abs(Math.round(n)).toLocaleString('en-NG')}`
