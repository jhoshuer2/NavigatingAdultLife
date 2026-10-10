import type { Choice, GameEvent, Outcome, StatDelta, Tier } from '../core/types'
import type { Ctx } from './ctx'
import { EVENTS, EVENT_BY_ID } from '@content/events'
import { evalGroup } from '../core/conditions'
import { stageForAge, traitSum } from '../core/helpers'
import { addStat, applyEffects } from './effects'
import { fillText } from './text'
import { log } from './log'
import { hustleMult } from './effects'

export function eventEligible(ctx: Ctx, e: GameEvent): boolean {
  const { s, rng } = ctx
  const c = s.character
  if (e.stage && !e.stage.includes(stageForAge(c.age))) return false
  const h = s.eventHistory[e.id]
  if (e.once && h) return false
  if (h && e.cooldownYears && c.age - h.lastAge < e.cooldownYears) return false
  if (s.eventQueue.includes(e.id)) return false
  return evalGroup(s, e.conditions, rng)
}

export function drawScripted(ctx: Ctx): string[] {
  const { s } = ctx
  const ids: string[] = []
  for (const e of EVENTS) if (e.scripted && eventEligible(ctx, e)) ids.push(e.id)
  // scheduled
  const keep: typeof s.scheduled = []
  for (const sc of s.scheduled) {
    if (sc.fireAge <= s.character.age && EVENT_BY_ID[sc.eventId]) { if (!ids.includes(sc.eventId)) ids.push(sc.eventId) }
    else keep.push(sc)
  }
  s.scheduled = keep
  return ids
}

export function drawRandom(ctx: Ctx, count: number): string[] {
  const { s, rng } = ctx
  const pool = EVENTS.filter((e) => !e.scripted && eventEligible(ctx, e))
  const picked: string[] = []
  let available = pool
  for (let i = 0; i < count; i++) {
    const e = rng.weighted(available, (x) => x.weight * (s.character.heritage !== 'mix' && x.tags?.includes(`h:${s.character.heritage}`) ? 1.6 : 1))
    if (!e) break
    picked.push(e.id)
    available = available.filter((x) => x.id !== e.id)
  }
  return picked
}

export function choiceAvailable(ctx: Ctx, ch: Choice): { ok: boolean; why?: string } {
  const c = ctx.s.character
  if (ch.requires && !evalGroup(ctx.s, ch.requires, ctx.rng)) return { ok: false, why: 'Not available' }
  if (ch.cost?.cash && c.stats.cash < ch.cost.cash && !ch.risk) return { ok: true } // allow going into debt
  return { ok: true }
}

function checkScore(ctx: Ctx, stat: string): number {
  const c = ctx.s.character
  if (stat === 'hustle') return c.stats.knowledge * 0.35 + c.stats.reputation * 0.35 + 25 * hustleMult(ctx) - 15
  if (stat === 'charm') return c.stats.reputation * 0.7 + c.stats.happiness * 0.3
  return (c.stats as unknown as Record<string, number>)[stat] ?? 0
}

export function rollTier(ctx: Ctx, check: { stat: string; difficulty: number; luck?: boolean }): Tier {
  const { rng } = ctx
  const score = checkScore(ctx, check.stat) + traitSum(ctx.s.character, 'checkBonus') + (check.luck === false ? 0 : rng.int(-15, 15))
  const margin = score - check.difficulty
  return margin >= 20 ? 'critSuccess' : margin >= 0 ? 'success' : margin >= -20 ? 'fail' : 'critFail'
}

export function outcomeFor(outcomes: Partial<Record<Tier, Outcome>> | undefined, tier: Tier): Outcome | undefined {
  if (!outcomes) return undefined
  if (outcomes[tier]) return outcomes[tier]
  if (tier === 'critSuccess') return outcomes.success
  if (tier === 'critFail') return outcomes.fail
  return undefined
}

export function resolveChoice(ctx: Ctx, choiceId: string): void {
  const { s } = ctx
  const evId = s.eventQueue[0]
  const ev = EVENT_BY_ID[evId]
  if (!ev) return
  const ch = ev.choices.find((c) => c.id === choiceId)
  if (!ch) return
  const before = s.yearDeltas.map((d) => ({ ...d }))
  if (ch.cost?.cash) addStat(ctx, 'cash', -ch.cost.cash, 'Cost')
  if (ch.cost?.energy) s.character.stats.energy = Math.max(0, s.character.stats.energy - ch.cost.energy)
  let tier: Tier | undefined
  let text = ch.resultText ?? ''
  if (ch.check && ch.outcomes) {
    tier = rollTier(ctx, ch.check)
    const out = outcomeFor(ch.outcomes, tier)
    if (out) { applyEffects(ctx, out.effects, ev.title); if (out.text) text = out.text }
  } else {
    applyEffects(ctx, ch.effects, ev.title)
  }
  const history = s.eventHistory[ev.id] ?? { lastAge: s.character.age, count: 0 }
  history.lastAge = s.character.age
  history.count += 1
  s.eventHistory[ev.id] = history
  const deltas = diffDeltas(before, s.yearDeltas)
  log(s, 'event', `${ev.title}: ${ch.label}`, { eventId: ev.id, choiceId: ch.id })
  s.activeEvent = { eventId: ev.id, result: { text: fillText(s, text), tier, deltas } }
}

function diffDeltas(before: StatDelta[], after: StatDelta[]): StatDelta[] {
  const out: StatDelta[] = []
  for (const a of after) {
    const b = before.find((x) => x.stat === a.stat && x.label === a.label)
    const d = a.delta - (b?.delta ?? 0)
    if (d) out.push({ ...a, delta: d })
  }
  return out
}
