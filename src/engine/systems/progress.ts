import type { Ctx } from './ctx'
import { ACHIEVEMENTS } from '@content/achievements'
import { QUESTS } from '@content/quests'
import { evalGroup } from '../core/conditions'
import { applyEffects, moment } from './effects'
import { log } from './log'

export function dreamProgress(ctx: Ctx): { done: boolean; pct: number; text: string } {
  const { s } = ctx
  const c = s.character
  const alive = Object.values(s.npcs).filter((n) => n.alive)
  switch (c.dreamId) {
    case 'bigOga': { const l = c.job?.level ?? 0; return { done: l >= 4, pct: l / 4, text: `Career level ${l}/4` } }
    case 'star': { const l = c.job?.trackId === 'creative' ? c.job.level : 0; return { done: l >= 4, pct: l / 4, text: `Creative level ${l}/4` } }
    case 'unicorn': { const l = c.job?.trackId === 'tech' ? c.job.level : 0; const done = l >= 4 && !!s.flags.startupFunded; return { done, pct: (l + (s.flags.startupFunded ? 1 : 0)) / 5, text: `Tech level ${l}/4${s.flags.startupFunded ? ', funded' : ''}` } }
    case 'propertyOwner': { const own = c.housing.type === 'own'; const done = own && c.stats.cash >= 15000000; return { done, pct: (own ? 0.5 : 0) + Math.min(0.5, c.stats.cash / 30000000), text: `${own ? 'Home owned' : 'No home yet'}, cash ₦${Math.round(c.stats.cash / 1000000)}M/15M` } }
    case 'padi': { const close = alive.filter((n) => n.closeness >= 80).length; const done = c.stats.reputation >= 70 && close >= 4; return { done, pct: (Math.min(close, 4) / 4 + Math.min(1, c.stats.reputation / 70)) / 2, text: `${close}/4 close, Reputation ${c.stats.reputation}/70` } }
  }
}

export function evaluateProgress(ctx: Ctx): string[] {
  const { s } = ctx
  const unlocked: string[] = []
  // dream
  if (!s.dreamDone && dreamProgress(ctx).done) {
    s.dreamDone = true
    moment(s, 'Achieved the Dream.', 10)
  }
  // quests
  for (const q of QUESTS) {
    const st = s.quests[q.id] ?? (s.quests[q.id] = { stage: 0, done: false })
    if (st.done) continue
    while (st.stage < q.stages.length && evalGroup(s, q.stages[st.stage].when)) st.stage++
    if (st.stage >= q.stages.length) {
      st.done = true
      applyEffects(ctx, q.reward, 'Quest')
      s.cowriesEarnedLife += q.cowries
      log(s, 'system', `Quest complete: ${q.title}. ${q.rewardText}`)
      unlocked.push(`quest:${q.id}`)
    }
  }
  // achievements
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.includes(a.id)) continue
    if (evalGroup(s, a.when)) {
      s.achievements.push(a.id)
      s.cowriesEarnedLife += a.cowries
      s.newUnlocks.push(a.id)
      unlocked.push(`ach:${a.id}`)
      log(s, 'system', `Achievement: ${a.title}`)
    }
  }
  return unlocked
}
