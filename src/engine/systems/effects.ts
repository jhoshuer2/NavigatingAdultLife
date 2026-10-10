import type { Effect, GameState, StatKey, StatDelta, TrackId } from '../core/types'
import type { Ctx } from './ctx'
import { clamp, traitMult, STAT_RANGE, fmtNaira } from '../core/helpers'
import { jobFor } from '@content/jobs'
import { addNpc } from './npcs'
import { fillText } from './text'
import { log } from './log'

const LABEL: Record<StatKey, string> = { cash: 'Cash', energy: 'Energy', happiness: 'Happiness', knowledge: 'Knowledge', reputation: 'Reputation', health: 'Health', stress: 'Stress' }

function recordDelta(s: GameState, stat: StatDelta['stat'], delta: number, label: string) {
  if (!delta) return
  const ex = s.yearDeltas.find((d) => d.stat === stat && d.label === label)
  if (ex) ex.delta += delta
  else s.yearDeltas.push({ stat, delta, label })
}

export function addStat(ctx: Ctx, stat: StatKey, rawDelta: number, label?: string): number {
  const { s } = ctx
  const c = s.character
  let delta = rawDelta
  if (stat !== 'cash') {
    delta = rawDelta > 0 ? rawDelta * traitMult(c, 'gain', stat) : rawDelta * traitMult(c, 'loss', stat)
    const arch = s.flags.__archGain as string | undefined
    if (arch && rawDelta > 0) {
      const g = JSON.parse(arch) as Partial<Record<StatKey, number>>
      delta *= g[stat] ?? 1
    }
    delta = Math.round(delta)
    const [lo, hi] = STAT_RANGE[stat as Exclude<StatKey, 'cash'>]
    const before = c.stats[stat]
    c.stats[stat] = clamp(before + delta, lo, hi)
    delta = c.stats[stat] - before
  } else {
    delta = Math.round(delta)
    c.stats.cash += delta
    if (c.stats.cash > s.maxCash) s.maxCash = c.stats.cash
    if (c.stats.cash < 0) s.flags.wasInDebt = true
  }
  recordDelta(s, stat, delta, label ?? LABEL[stat])
  return delta
}

export function setFlag(s: GameState, key: string, v: boolean | number | string) { s.flags[key] = v }

export function addRel(ctx: Ctx, role: Parameters<typeof addNpc>[1], delta: number) {
  const { s } = ctx
  const id = s.roles[role]
  const n = id ? s.npcs[id] : undefined
  if (!n || !n.alive) return
  const bonus = delta > 0 ? 1 : 0
  n.closeness = clamp(n.closeness + delta + (bonus && s.character.traits.includes('charmer') ? 1 : 0), 0, 100)
  n.contactedThisYear = true
  recordDelta(s, 'rel', delta, `${n.name}`)
}

export function setJob(ctx: Ctx, trackId: TrackId, level: number) {
  const { s, rng } = ctx
  const def = jobFor(trackId, level)
  if (!def) return
  const c = s.character
  const t = (c.job?.trackId === trackId ? 0.3 : 0.2) + rng.next() * 0.5
  c.job = { trackId, level, years: 0, salary: Math.round((def.salary[0] + (def.salary[1] - def.salary[0]) * t) / 1000) * 1000, title: def.title }
  s.flags.hasWorked = true
  if (!s.roles.boss && level >= 1 && trackId !== 'creative') addNpc(ctx, 'boss', { closeness: 35 })
}

export function applyEffect(ctx: Ctx, e: Effect, label?: string) {
  const { s, rng } = ctx
  const c = s.character
  if ('stat' in e) { addStat(ctx, e.stat, e.delta, label); return }
  if ('flag' in e) { setFlag(s, e.flag, e.set); return }
  if ('flagAdd' in e) { s.flags[e.flagAdd] = Number(s.flags[e.flagAdd] ?? 0) + e.by; return }
  if ('rel' in e) { addRel(ctx, e.rel, e.delta); return }
  if ('item' in e) { if (!c.items.includes(e.item)) c.items.push(e.item); return }
  if ('removeItem' in e) { c.items = c.items.filter((i) => i !== e.removeItem); return }
  if ('job' in e) {
    if (e.job === 'quit' || e.job === 'fire') {
      if (c.job) log(s, 'system', e.job === 'quit' ? 'You left your job.' : `You lost your job as ${c.job.title}.`)
      c.job = undefined
    } else if (e.job === 'promote') {
      if (c.job) { const next = jobFor(c.job.trackId, c.job.level + 1); if (next) { setJob(ctx, c.job.trackId, next.level); s.flags.promoted = true; moment(s, `Promoted to ${next.title}.`, 6) } }
    } else setJob(ctx, e.job.trackId, e.job.level)
    return
  }
  if ('edu' in e) { c.edu.level = e.edu; c.edu.yearsInLevel = 0; return }
  if ('credential' in e) { c.edu.credential = e.credential; return }
  if ('spawn' in e) { addNpc(ctx, e.spawn); return }
  if ('moment' in e) { moment(s, fillText(s, e.moment), 5); return }
  if ('schedule' in e) { s.scheduled.push({ eventId: e.schedule.eventId, fireAge: c.age + e.schedule.inYears }); return }
  if ('lifestyle' in e) { c.lifestyle = e.lifestyle; return }
  if ('housing' in e) { c.housing = { ...c.housing, type: 'rent', tier: e.housing.tier }; return }
  if ('school' in e) { c.edu.schoolType = e.school; return }
  if ('endPartner' in e) { if (s.roles.partner) { delete s.roles.partner } return }
  if ('resit' in e) { c.edu.level = 'sss'; c.edu.yearsInLevel = 2; s.flags.examPassed = false; return }
  if ('buyHome' in e) { c.housing = { ...c.housing, type: 'own', tier: 3 }; moment(s, 'Bought a home of your own.', 8); return }
  if ('marry' in e) {
    const p = s.roles.partner ? s.npcs[s.roles.partner] : undefined
    if (p) { c.spouseId = p.id; moment(s, `Married ${p.name}.`, 8); s.flags.married = true }
    return
  }
  if ('child' in e) {
    const kid = addNpc(ctx, 'child', { closeness: 70 })
    c.childrenIds.push(kid.id)
    moment(s, `Welcomed a child, ${kid.name}.`, 8)
    return
  }
  if ('die' in e) { s.flags.__death = e.die; return }
  if ('cowries' in e) { s.cowriesEarnedLife += e.cowries; return }
  if ('hustleIncome' in e) {
    const mult = e.hustleIncome > 0 ? (rng ? hustleMult(ctx) : 1) : 1
    const amt = Math.round(e.hustleIncome * mult)
    c.hustleIncome += amt
    recordDelta(s, 'cash', amt, 'Side hustle')
    return
  }
}

export function hustleMult(ctx: Ctx): number {
  const c = ctx.s.character
  let m = 1
  for (const t of c.traits) {
    if (t === 'hustler') m *= 1.25
  }
  if (c.items.includes('laptop')) m *= 1.15
  if (c.items.includes('sewing')) m *= 1.25
  if (ctx.s.flags.marketKid) m *= 1.1
  return m
}

export function moment(s: GameState, text: string, weight: number) {
  s.moments.push({ age: s.character.age, text, weight })
  log(s, 'moment', text)
}

export function applyEffects(ctx: Ctx, effects: Effect[] | undefined, label?: string) {
  if (!effects) return
  for (const e of effects) applyEffect(ctx, e, label)
}

export { fmtNaira }
