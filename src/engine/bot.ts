// Headless players used by tests and the balance simulator.
import type { GameState, NewLifeConfig, TrackId } from './core/types'
import { makeRng, type Rng } from './core/rng'
import { createNewLife, getActivities, doActivity, finishActions, chooseOption, continueAfterEvent, advanceYear, submitQuizAnswer, currentEvent, getShopItems, getJobOptions } from './api'
import { TRAITS } from '@content/traits'
import { dreamsFor } from '@content/dreams'
import { cityOfHome } from '@content/cities'
import { ARCHETYPES, HOMES, tierRank } from '@content/archetypes'
import { NAME_POOLS } from '@content/names'

export type BotKind = 'random' | 'scholar' | 'money'

export function randomConfig(rng: Rng): NewLifeConfig {
  const gender = rng.pick(['male', 'female'] as const)
  const heritage = rng.pick(['yoruba', 'igbo', 'hausa', 'mix'] as const)
  const t = rng.shuffle(TRAITS.map((x) => x.id))
  const arch = rng.pick(ARCHETYPES)
  const homes = HOMES.filter((h) => tierRank(arch.tier) >= tierRank(h.minTier))
  const dreamRoll = rng.int(0, 999)
  const home = rng.pick(homes)
  const pool = dreamsFor(cityOfHome(home.id))
  return {
    name: rng.pick(NAME_POOLS[heritage][gender]), gender, heritage,
    appearance: { skinTone: rng.int(0, 9), faceShape: rng.int(0, 3), hairStyle: 'afro', hairColor: '#111', outfitType: 'casual', fabric: 'plain', topColor: '#2b3a8c', bottomColor: '#222' },
    traits: [t[0], t[1]], dreamId: pool[dreamRoll % pool.length].id, archetypeId: arch.id, homeId: home.id,
  }
}

export interface BotRun { state: GameState; steps: number; error?: string }

export function playLife(seed: number, kind: BotKind, config?: NewLifeConfig, maxSteps = 4000, stopAtAge?: number): BotRun {
  const rng = makeRng(seed ^ 0x9e3779b9)
  let state = createNewLife(config ?? randomConfig(rng), seed)
  let steps = 0
  const choose = (s: GameState): string => {
    const cur = currentEvent(s)
    if (!cur) return ''
    const opts = cur.choices.filter((c) => c.ok)
    if (!opts.length) return cur.event.choices[0].id
    if (kind === 'random') return rng.pick(opts).choice.id
    // heuristic: prefer affordable, prefer 'safe' for scholar, 'risky' ok for money, avoid shady for both
    const scored = opts.map((o) => {
      const c = o.choice
      let score = rng.next()
      if (!o.affordable) score -= 2
      if (kind === 'scholar' && c.effects?.some((e) => 'stat' in e && e.stat === 'knowledge' && e.delta > 0)) score += 1
      if (kind === 'money' && c.effects?.some((e) => 'hustleIncome' in e || ('stat' in e && e.stat === 'cash' && e.delta > 0))) score += 1
      if (c.id === 'resit' || c.id === 'federal' || c.id === 'poly' || c.id === 'apprentice' || c.id === 'mini' || c.id === 'grand' || c.id === 'small') score += kind === 'scholar' && c.id === 'federal' ? 2 : 0.5
      return { id: c.id, score }
    })
    scored.sort((a, b) => b.score - a.score)
    return scored[0].id
  }

  while (state.phase !== 'ended' && steps < maxSteps) {
    steps++
    if (stopAtAge !== undefined && state.character.age >= stopAtAge && state.phase === 'action' && !state.quiz) break
    try {
      if (state.phase === 'events') {
        if (state.activeEvent?.result) state = continueAfterEvent(state)
        else { const id = choose(state); if (!id) { state = continueAfterEvent(state); continue } state = chooseOption(state, id) }
      } else if (state.phase === 'action') {
        if (state.quiz) {
          const q = state.quiz.questions[state.quiz.index]
          const known = q
          const ok = kind === 'scholar' ? 0.85 : kind === 'money' ? 0.5 : 0.4
          state = submitQuizAnswer(state, rng.chance(ok) ? known.answer : rng.int(0, known.options.length - 1)).state
          continue
        }
        const acts = getActivities(state).filter((a) => a.enabled && !a.def.hidden && a.def.id !== 'dash' && a.def.id !== 'quitJob')
        if (!acts.length) { state = finishActions(state); continue }
        const pref = (id: string) => (kind === 'scholar' ? { study: 5, rest: 1 }[id as 'study' | 'rest'] ?? 2 : kind === 'money' ? { hustle: 5, overtime: 4, applyJob: 6, study: 2 }[id as 'hustle'] ?? 2 : 2)
        const pick = rng.weighted(acts, (a) => pref(a.def.id) + 0.3)!
        const args: Record<string, unknown> = {}
        if (pick.def.id === 'applyJob') {
          const opts = getJobOptions(state).filter((o) => o.ok)
          if (!opts.length) { state = finishActions(state); continue }
          args.track = rng.pick(opts).track.id as TrackId
        }
        if (pick.def.id === 'shop') {
          const items = getShopItems(state).filter((i) => i.affordable)
          if (!items.length) { state = finishActions(state); continue }
          args.itemId = items[0].item.id
        }
        if (pick.def.id === 'socialise') args.target = rng.pick(['friend', 'friend2'] as const)
        if (pick.def.id === 'familyTime') args.target = rng.pick(['mother', 'father'] as const)
        const r = doActivity(state, pick.def.id, args)
        if (!r.ok) { state = finishActions(state); continue }
        state = r.state
        if (rng.chance(0.18) && !state.quiz) state = finishActions(state)
      } else if (state.phase === 'summary') {
        state = advanceYear(state)
      }
    } catch (e) {
      return { state, steps, error: (e as Error).stack ?? String(e) }
    }
  }
  return { state, steps, error: state.phase !== 'ended' ? 'did not finish' : undefined }
}
