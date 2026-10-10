import type { Effect, StatKey, NpcRole, GameEvent, Choice, Tier, Outcome, ConditionGroup } from '@engine/core/types'

// Tiny authoring helpers so event files stay compact and readable.
export const st = (stat: StatKey, delta: number): Effect => ({ stat, delta })
export const cash = (n: number): Effect => ({ stat: 'cash', delta: n })
export const happy = (n: number) => st('happiness', n)
export const know = (n: number) => st('knowledge', n)
export const rep = (n: number) => st('reputation', n)
export const health = (n: number) => st('health', n)
export const stress = (n: number) => st('stress', n)
export const energy = (n: number) => st('energy', n)
export const rel = (role: NpcRole, delta: number): Effect => ({ rel: role, delta })
export const flag = (key: string, v: boolean | number | string = true): Effect => ({ flag: key, set: v })
export const inc = (key: string, by = 1): Effect => ({ flagAdd: key, by })
export const moment = (text: string): Effect => ({ moment: text })
export const later = (eventId: string, inYears: number): Effect => ({ schedule: { eventId, inYears } })
export const hustle = (n: number): Effect => ({ hustleIncome: n })

export const o = (text: string, ...effects: Effect[]): Outcome => ({ text, effects })

export interface ChoiceInit {
  label: string
  hint?: string
  requires?: ConditionGroup
  cost?: Choice['cost']
  risk?: Choice['risk']
  fx?: Effect[]
  text?: string
  check?: Choice['check']
  out?: Partial<Record<Tier, Outcome>>
}
export const ch = (id: string, c: ChoiceInit): Choice => ({
  id, label: c.label, hint: c.hint, requires: c.requires, cost: c.cost, risk: c.risk, effects: c.fx, resultText: c.text, check: c.check, outcomes: c.out,
})

export interface EventInit {
  id: string
  title: string
  text: string
  stage?: GameEvent['stage']
  w?: number
  cd?: number
  once?: boolean
  scripted?: boolean
  when?: ConditionGroup
  tags?: string[]
  who?: NpcRole
  choices: Choice[]
}
export const ev = (e: EventInit): GameEvent => ({
  id: e.id, title: e.title, text: e.text, stage: e.stage, weight: e.w ?? 5, cooldownYears: e.cd, once: e.once, scripted: e.scripted,
  conditions: e.when, tags: e.tags, who: e.who, choices: e.choices,
})
export const school = (t: 'public' | 'private' | 'federal'): Effect => ({ school: t })
export const edu = (l: 'university' | 'polytechnic' | 'apprentice' | 'none'): Effect => ({ edu: l })
