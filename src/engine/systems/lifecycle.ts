import type { Ctx } from './ctx'
import type { Character, GameState, NewLifeConfig, StatDelta, Stats, YearSummary } from '../core/types'
import { ARCHETYPE_BY_ID, HOMES } from '@content/archetypes'
import { EVENT_BY_ID } from '@content/events'
import { clamp, stageForAge, traitSum } from '../core/helpers'
import { addNpc, npcAge } from './npcs'
import { addStat, moment, applyEffects } from './effects'
import { applyPassiveItems, settleMoney } from './economy'
import { advanceEducation, schoolEnergy } from './education'
import { yearlyCareer } from './career'
import { drawRandom, drawScripted } from './events'
import { evaluateProgress } from './progress'
import { buildEnding, mortalityProbability } from './ending'
import { log } from './log'

export const SCHEMA_VERSION = 1
export const START_YEAR = 2026
export const START_AGE = 6
export const MAX_AGE = 90

export function newState(config: NewLifeConfig, seed: number): GameState {
  const arch = ARCHETYPE_BY_ID[config.archetypeId]
  const home = HOMES.find((h) => h.id === config.homeId) ?? HOMES[1]
  const stats: Stats = { cash: arch.startCash, energy: 100, maxEnergy: 100, happiness: 60, knowledge: 15, reputation: 10, health: 85, stress: 10 }
  for (const [k, v] of Object.entries(arch.startStats ?? {})) stats[k as keyof Stats] = clamp(stats[k as keyof Stats] + (v ?? 0), 0, 100)
  const character: Character = {
    id: `life_${seed}`, name: config.name, nickname: config.nickname, gender: config.gender, heritage: config.heritage, familyTier: arch.tier,
    archetypeId: arch.id, dreamId: config.dreamId, traits: [...config.traits], appearance: config.appearance, age: START_AGE, stats,
    edu: { level: 'primary', yearsInLevel: 0, schoolType: arch.schoolType, credential: 'none', studyPoints: 0, gpa: 0 },
    lifestyle: 'normal', housing: { type: 'family', tier: 0, districtId: home.id }, items: [], childrenIds: [], hustleIncome: 0, dashCashouts: 0,
    perkIds: config.perkId ? [config.perkId] : [],
  }
  return {
    schemaVersion: SCHEMA_VERSION, seed, rng: seed >>> 0, startYear: START_YEAR, year: START_YEAR, character, npcs: {}, roles: {},
    flags: { ...(arch.startFlags ?? {}), __archGain: JSON.stringify(arch.gain ?? {}) },
    eventQueue: [], after: 'action', scheduled: [], eventHistory: {}, quests: {}, achievements: [], log: [], moments: [], yearDeltas: [],
    yearStartCash: stats.cash, yearIncome: 0, yearExpenses: 0, yearLines: [], phase: 'action', newUnlocks: [], activityCounts: {},
    avgHappiness: { sum: 0, n: 0 }, maxCash: stats.cash, dreamDone: false, dashBest: 0, cowriesEarnedLife: 0,
  }
}

export function setupLife(ctx: Ctx, config: NewLifeConfig) {
  const { s, rng } = ctx
  addNpc(ctx, 'mother')
  addNpc(ctx, 'father')
  if (rng.chance(0.75)) addNpc(ctx, 'sibling')
  addNpc(ctx, 'friend', { ageDiff: rng.int(-1, 1), closeness: 45 })
  addNpc(ctx, 'friend2', { ageDiff: rng.int(-1, 2), closeness: 35 })
  // perks
  if (config.perkId === 'headStart') addStat(ctx, 'cash', 100000, 'Perk')
  if (config.perkId === 'sharpMind') addStat(ctx, 'knowledge', 6, 'Perk')
  if (config.perkId === 'goodVibes') addStat(ctx, 'happiness', 8, 'Perk')
  s.yearDeltas = []
  s.yearStartCash = s.character.stats.cash
  log(s, 'system', `${s.character.name} is born into a ${s.character.familyTier} family and starts primary school at age ${START_AGE}.`)
  moment(s, `Started primary school.`, 2)
  yearStart(ctx)
}

function computeMaxEnergy(s: GameState): number {
  const c = s.character
  const ageP = Math.max(0, c.age - 30) * 0.5
  const healthP = c.stats.health < 40 ? (40 - c.stats.health) * 0.5 : 0
  const stressP = c.stats.stress > 70 ? (c.stats.stress - 70) * 0.5 : 0
  return Math.round(clamp(100 - ageP - healthP - stressP + traitSum(c, 'maxEnergy'), 40, 110))
}

/** Start-of-year setup: refill energy, reserve energy for school/work, queue scripted milestones. */
export function yearStart(ctx: Ctx) {
  const { s } = ctx
  const c = s.character
  c.stats.maxEnergy = computeMaxEnergy(s)
  let reserved = 0
  if (c.edu.level !== 'none') reserved += schoolEnergy(c.edu.level)
  if (c.job) reserved += Math.round(c.job.salary > 0 ? Math.min(45, 30 + c.job.level * 3) : 0)
  if (c.childrenIds.length) reserved += Math.min(12, c.childrenIds.length * 4)
  s.flags.__reserved = reserved
  c.stats.energy = Math.max(10, c.stats.maxEnergy - reserved)
  c.hustleIncome = 0
  c.dashCashouts = 0
  s.activityCounts = {}
  c.edu.studyPoints = 0
  for (const n of Object.values(s.npcs)) n.contactedThisYear = false
  s.yearDeltas = []
  s.yearStartCash = c.stats.cash
  s.lastAction = undefined
  s.summary = undefined
  s.activeEvent = undefined
  const scripted = drawScripted(ctx)
  s.eventQueue = scripted
  s.after = 'action'
  s.phase = scripted.length ? 'events' : 'action'
}

/** Player is done acting: draw this year's random events and move on. */
export function endActions(ctx: Ctx) {
  const { s, rng } = ctx
  if (s.phase !== 'action') return
  const c = s.character
  const stage = stageForAge(c.age)
  const count = stage === 'child' ? rng.int(1, 2) : stage === 'elder' ? rng.int(1, 2) : rng.int(2, 3)
  s.eventQueue = drawRandom(ctx, count)
  s.after = 'summary'
  if (s.eventQueue.length) s.phase = 'events'
  else finalizeYear(ctx)
}

/** Called after the player acknowledges the result of an event. */
export function acknowledgeEvent(ctx: Ctx) {
  const { s } = ctx
  s.activeEvent = undefined
  s.eventQueue.shift()
  if (s.flags.__death) { finalizeYear(ctx); return }
  if (s.eventQueue.length) return
  if (s.after === 'action') s.phase = 'action'
  else finalizeYear(ctx)
}

function npcYear(ctx: Ctx) {
  const { s, rng } = ctx
  for (const n of Object.values(s.npcs)) {
    if (!n.alive) continue
    if (!n.contactedThisYear && n.role !== 'child') n.closeness = Math.max(5, n.closeness - (n.role === 'mother' || n.role === 'father' ? 1 : 3))
    const age = npcAge(s, n)
    if (age >= 55 && n.role !== 'child') {
      const p = 0.002 * Math.exp((age - 45) * 0.105) * 0.8
      if (rng.chance(Math.min(0.5, p))) {
        n.alive = false
        s.flags.lostName = n.name
        s.flags.lostRole = n.role === 'mother' ? 'mother' : n.role === 'father' ? 'father' : n.role === 'partner' ? 'partner' : n.role
        if (n.id === s.character.spouseId) s.flags.widowed = true
        moment(s, `Lost ${n.name}, ${n.role === 'mother' ? 'their mother' : n.role === 'father' ? 'their father' : `their ${n.role}`}.`, 8)
        s.scheduled.push({ eventId: 'evt_loss', fireAge: s.character.age + 1 })
      }
    }
  }
}

function headline(s: GameState, lines: string[], income: number, expenses: number): string {
  const c = s.character
  const last = s.moments[s.moments.length - 1]
  if (last && last.age === c.age) return last.text
  if (c.stats.cash < 0) return 'Sapa season. Your account is crying.'
  if (income - expenses > 3000000) return 'A very good year financially.'
  if (c.stats.happiness >= 80) return 'A genuinely happy year.'
  if (c.stats.stress >= 75) return 'Stress took the wheel this year.'
  if (lines.length) return lines[0]
  return ['Another year survived.', 'Life went on. Mostly.', 'A quiet year. The best kind.'][c.age % 3]
}

export function finalizeYear(ctx: Ctx) {
  const { s, rng } = ctx
  const c = s.character
  s.eventQueue = []
  const lines: string[] = []
  const settle = settleMoney(ctx)
  lines.push(...settle.lines)
  lines.push(...advanceEducation(ctx))
  lines.push(...yearlyCareer(ctx))
  applyPassiveItems(ctx)
  // drift & recovery
  addStat(ctx, 'stress', -5, 'Time')
  addStat(ctx, 'happiness', Math.round((55 - c.stats.happiness) * 0.12), 'Time')
  if (c.age > 40) addStat(ctx, 'health', -Math.round((c.age - 40) * 0.09 + 0.5), 'Ageing')
  else if (c.stats.stress < 50) addStat(ctx, 'health', 1, 'Time')
  if (c.stats.stress > 80) addStat(ctx, 'health', -3, 'Burnout')
  if (c.stats.cash < 0) { s.flags.wasInDebt = true }
  npcYear(ctx)
  s.avgHappiness.sum += c.stats.happiness
  s.avgHappiness.n += 1
  const unlocked = evaluateProgress(ctx)

  // death / ending
  let cause: string | undefined = s.flags.__death ? String(s.flags.__death) : undefined
  if (!cause && rng.chance(mortalityProbability(ctx))) {
    cause = c.age < 45 ? 'A sudden illness took them far too early.' : c.age < 70 ? 'After a short illness, they passed peacefully.' : 'They passed peacefully, surrounded by family.'
  }
  if (!cause && c.age >= MAX_AGE) cause = 'They lived a full and long life.'
  const sum: YearSummary = {
    age: c.age,
    headline: headline(s, lines, settle.income, settle.expenses),
    income: settle.income, expenses: settle.expenses, lines,
    deltas: collapseDeltas(s.yearDeltas), unlocked,
  }
  s.summary = sum
  s.yearIncome = settle.income
  s.yearExpenses = settle.expenses
  if (cause) {
    s.ending = buildEnding(ctx, cause)
    s.phase = 'ended'
    log(s, 'system', `Life ended at ${c.age}.`)
  } else {
    s.phase = 'summary'
  }
}

function collapseDeltas(ds: StatDelta[]): StatDelta[] {
  const byStat = new Map<string, StatDelta>()
  for (const d of ds) {
    const k = `${d.stat}`
    const ex = byStat.get(k)
    if (ex) ex.delta += d.delta
    else byStat.set(k, { ...d, label: d.stat === 'rel' ? 'Relationships' : d.label })
  }
  return [...byStat.values()].filter((d) => d.delta !== 0)
}

export function nextYear(ctx: Ctx) {
  const { s } = ctx
  if (s.phase !== 'summary') return
  s.character.age += 1
  s.year += 1
  s.summary = undefined
  yearStart(ctx)
}

export { applyEffects, EVENT_BY_ID }
