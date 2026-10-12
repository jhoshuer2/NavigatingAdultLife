import { cityOfHome } from '@content/cities'
import type { Condition, ConditionGroup, GameState } from './types'
import type { Rng } from './rng'
import { credentialAtLeast, npcByRole, stageForAge } from './helpers'

const TIER_ORDER = ['struggling', 'lowerMiddle', 'middle', 'comfortable']

export function evalCondition(s: GameState, c: Condition, rng?: Rng): boolean {
  const ch = s.character
  if ('ageBetween' in c) return ch.age >= c.ageBetween[0] && ch.age <= c.ageBetween[1]
  if ('stage' in c) { const st = stageForAge(ch.age); return Array.isArray(c.stage) ? c.stage.includes(st) : c.stage === st }
  if ('flag' in c) return !!s.flags[c.flag]
  if ('flagAbsent' in c) return !s.flags[c.flagAbsent]
  if ('flagEq' in c) return s.flags[c.flagEq[0]] === c.flagEq[1]
  if ('flagAtLeast' in c) return Number(s.flags[c.flagAtLeast[0]] ?? 0) >= c.flagAtLeast[1]
  if ('stat' in c) { const v = ch.stats[c.stat[0]]; return c.stat[1] === '>=' ? v >= c.stat[2] : v <= c.stat[2] }
  if ('cashAtLeast' in c) return ch.stats.cash >= c.cashAtLeast
  if ('cashBelow' in c) return ch.stats.cash < c.cashBelow
  if ('inSchool' in c) return (['primary', 'jss', 'sss', 'university', 'polytechnic', 'apprentice'].includes(ch.edu.level)) === c.inSchool
  if ('eduLevel' in c) return Array.isArray(c.eduLevel) ? c.eduLevel.includes(ch.edu.level) : ch.edu.level === c.eduLevel
  if ('credentialAtLeast' in c) return credentialAtLeast(ch.edu.credential, c.credentialAtLeast)
  if ('employed' in c) return !!ch.job === c.employed
  if ('track' in c) return ch.job?.trackId === c.track
  if ('jobLevelAtLeast' in c) return (ch.job?.level ?? 0) >= c.jobLevelAtLeast
  if ('trait' in c) return ch.traits.includes(c.trait)
  if ('heritage' in c) return ch.heritage === c.heritage
  if ('city' in c) return cityOfHome(ch.housing.districtId) === c.city
  if ('tier' in c) return Array.isArray(c.tier) ? c.tier.includes(ch.familyTier) : ch.familyTier === c.tier
  if ('gender' in c) return ch.gender === c.gender
  if ('married' in c) return !!ch.spouseId === c.married
  if ('hasChildren' in c) return (ch.childrenIds.length > 0) === c.hasChildren
  if ('hasPartner' in c) return !!s.roles.partner === c.hasPartner
  if ('hasItem' in c) return ch.items.includes(c.hasItem)
  if ('relAtLeast' in c) { const n = npcByRole(s, c.relAtLeast[0]); return !!n && n.alive && n.closeness >= c.relAtLeast[1] }
  if ('roleAlive' in c) { const n = npcByRole(s, c.roleAlive[0]); return !!n && n.alive === c.roleAlive[1] }
  if ('seen' in c) return !!s.eventHistory[c.seen]
  if ('notSeen' in c) return !s.eventHistory[c.notSeen]
  if ('housing' in c) return ch.housing.type === c.housing
  if ('dream' in c) return ch.dreamId === c.dream
  if ('dreamDone' in c) return s.dreamDone === c.dreamDone
  if ('any' in c) return c.any.some((x) => evalCondition(s, x, rng))
  if ('chance' in c) return rng ? rng.chance(c.chance) : true
  return false
}

export function evalGroup(s: GameState, g: ConditionGroup | undefined, rng?: Rng): boolean {
  if (!g) return true
  if (g.all && !g.all.every((c) => evalCondition(s, c, rng))) return false
  if (g.any && g.any.length && !g.any.some((c) => evalCondition(s, c, rng))) return false
  if (g.not && g.not.some((c) => evalCondition(s, c, rng))) return false
  return true
}

export const tierIndex = (t: string) => TIER_ORDER.indexOf(t)
