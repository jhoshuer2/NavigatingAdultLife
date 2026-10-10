import type { ActivityDef, NpcRole, StatDelta, TrackId } from '../core/types'
import type { Ctx } from './ctx'
import { ACTIVITIES, ACTIVITY_BY_ID } from '@content/activities'
import { ITEMS, ITEM_BY_ID } from '@content/items'
import { evalGroup } from '../core/conditions'
import { stageForAge, traitSum } from '../core/helpers'
import { addRel, addStat, applyEffects } from './effects'
import { rollTier, outcomeFor } from './events'
import { tryHire, entryEligibility } from './career'
import { pickQuestions } from '@content/quiz'
import { log } from './log'
import { TRACKS } from '@content/jobs'

export interface ActivityOption { def: ActivityDef; enabled: boolean; reason?: string; remaining?: number }

export function listActivities(ctx: Ctx): ActivityOption[] {
  const { s } = ctx
  const c = s.character
  const stage = stageForAge(c.age)
  const out: ActivityOption[] = []
  for (const def of ACTIVITIES) {
    if (!def.stages.includes(stage)) continue
    if (def.requires && !evalGroup(s, def.requires, ctx.rng)) continue
    const used = s.activityCounts[def.id] ?? 0
    const remaining = def.maxPerYear ? def.maxPerYear - used : undefined
    let enabled = true
    let reason: string | undefined
    if (s.quiz) { enabled = false; reason = 'Finish the quiz first' }
    else if (remaining !== undefined && remaining <= 0) { enabled = false; reason = 'Done this year' }
    else if (c.stats.energy < def.cost.energy) { enabled = false; reason = 'Not enough Energy' }
    else if (def.cost.cash && c.stats.cash < def.cost.cash) { enabled = false; reason = 'Not enough cash' }
    else if (def.id === 'applyJob' && c.edu.level !== 'none') { enabled = false; reason = 'Finish school first' }
    out.push({ def, enabled, reason, remaining })
  }
  return out
}

function begin(ctx: Ctx): StatDelta[] { return ctx.s.yearDeltas.map((d) => ({ ...d })) }
function finish(ctx: Ctx, before: StatDelta[], text: string) {
  const out: StatDelta[] = []
  for (const a of ctx.s.yearDeltas) {
    const b = before.find((x) => x.stat === a.stat && x.label === a.label)
    const d = a.delta - (b?.delta ?? 0)
    if (d) out.push({ ...a, delta: d })
  }
  ctx.s.lastAction = { text, deltas: out }
  log(ctx.s, 'activity', text)
}

export interface ActivityArgs { target?: NpcRole; track?: TrackId; itemId?: string }

export function performActivity(ctx: Ctx, id: string, args: ActivityArgs = {}): boolean {
  const { s, rng } = ctx
  const c = s.character
  const def = ACTIVITY_BY_ID[id]
  if (!def || s.phase !== 'action') return false
  const opt = listActivities(ctx).find((o) => o.def.id === id)
  if (!opt || !opt.enabled) return false
  const before = begin(ctx)
  c.stats.energy -= def.cost.energy
  if (def.cost.cash) addStat(ctx, 'cash', -def.cost.cash, 'Spending')
  s.activityCounts[id] = (s.activityCounts[id] ?? 0) + 1
  let text = def.label

  switch (def.special) {
    case 'study': {
      const n = c.age < 10 ? 2 : 3
      const seen = new Set(Object.keys(s.flags).filter((k) => k.startsWith('q:')).map((k) => k.slice(2)))
      s.quiz = { questions: pickQuestions(rng, c.age, n, seen), index: 0, correct: 0, gained: 0 }
      finish(ctx, before, 'You open your books. Pop quiz!')
      return true
    }
    case 'dash': {
      s.flags.dashPlayed = true
      finish(ctx, before, 'You head out for a run through Lagos.')
      return true
    }
    case 'socialise': {
      const role: NpcRole = args.target ?? 'friend'
      const n = s.roles[role] ? s.npcs[s.roles[role]!] : undefined
      const spend = c.age >= 18 ? 6000 : 0
      if (spend) addStat(ctx, 'cash', -spend, 'Spending')
      addRel(ctx, role, 7 + traitSum(c, 'socialBonus'))
      addStat(ctx, 'happiness', 5, 'Friends')
      addStat(ctx, 'reputation', 1, 'Friends')
      addStat(ctx, 'stress', -3, 'Friends')
      text = `You spent time with ${n?.name ?? 'a friend'}. Plenty of gist.`
      break
    }
    case 'familyTime': {
      const role: NpcRole = args.target ?? 'mother'
      const n = s.roles[role] ? s.npcs[s.roles[role]!] : undefined
      addRel(ctx, role, 7)
      addStat(ctx, 'happiness', 3, 'Family')
      if (role === 'mother' || role === 'father') addStat(ctx, 'reputation', 1, 'Family')
      text = `Family time with ${n?.name ?? 'family'}. Questions about marriage were asked.`
      break
    }
    case 'rest': {
      addStat(ctx, 'health', 5, 'Rest')
      addStat(ctx, 'stress', -9, 'Rest')
      addStat(ctx, 'happiness', c.traits.includes('hustler') ? 1 : 3, 'Rest')
      if (c.traits.includes('foodie')) { addStat(ctx, 'energy', 6, 'Good food'); addStat(ctx, 'happiness', 2, 'Good food') }
      text = 'You slept well and ate better. NEPA, surprisingly, cooperated.'
      break
    }
    case 'applyJob': {
      const track = args.track ?? 'trade'
      const r = tryHire(ctx, track)
      text = r.text
      break
    }
    case 'overtime': {
      addStat(ctx, 'reputation', 2, 'Overtime')
      addStat(ctx, 'stress', 5, 'Overtime')
      addStat(ctx, 'knowledge', 1, 'Overtime')
      text = 'You stayed late. The boss noticed the lights, at least.'
      break
    }
    case 'quitJob': {
      applyEffects(ctx, [{ job: 'quit' }])
      text = 'You resigned. Mama has not stopped praying since.'
      break
    }
    case 'shop': {
      const item = args.itemId ? ITEM_BY_ID[args.itemId] : undefined
      if (!item || c.items.includes(item.id) || c.age < item.minAge || c.stats.cash < item.price) { c.stats.energy += def.cost.energy; s.activityCounts[id] -= 1; return false }
      addStat(ctx, 'cash', -item.price, 'Shopping')
      c.items.push(item.id)
      applyEffects(ctx, item.effects, item.name)
      text = `You bought: ${item.name}.`
      break
    }
    default: {
      if (def.check && def.outcomes) {
        const tier = rollTier(ctx, def.check)
        const out = outcomeFor(def.outcomes, tier)
        applyEffects(ctx, out?.effects, def.label)
        text = out?.text ?? def.label
        if (id === 'hustle') s.flags.hustleCount = Number(s.flags.hustleCount ?? 0) + 1
      } else {
        applyEffects(ctx, def.effects, def.label)
        text = def.blurb
      }
    }
  }
  finish(ctx, before, text)
  return true
}

export function answerQuiz(ctx: Ctx, optionIndex: number): { correct: boolean; funny?: string; done: boolean } | undefined {
  const { s } = ctx
  const quiz = s.quiz
  if (!quiz) return undefined
  const q = quiz.questions[quiz.index]
  const correct = optionIndex === q.answer
  const before = begin(ctx)
  const c = s.character
  let studyBonus = 0
  for (const id of c.items) studyBonus += ITEM_BY_ID[id]?.passive?.studyBonus ?? 0
  s.flags[`q:${q.id}`] = true
  if (correct) {
    quiz.correct += 1
    c.edu.studyPoints += 1
    const gain = 3 + studyBonus
    quiz.gained += gain
    addStat(ctx, 'knowledge', gain, 'Study')
    addStat(ctx, 'happiness', 1, 'Study')
  } else {
    addStat(ctx, 'stress', 2, 'Study')
  }
  quiz.index += 1
  const done = quiz.index >= quiz.questions.length
  if (done) {
    const text = `Quiz done: ${quiz.correct}/${quiz.questions.length} correct.`
    s.quiz = undefined
    if (quiz.correct === quiz.questions.length) { addStat(ctx, 'reputation', 1, 'Study'); s.flags.perfectQuiz = true }
    finish(ctx, before, text)
  } else {
    // keep quiz progress visible via deltas
    s.lastAction = { text: correct ? 'Correct!' : 'Not quite.', deltas: [] }
  }
  return { correct, funny: correct ? q.funnyRight : q.funnyWrong, done }
}

export function shopItems(ctx: Ctx) {
  const c = ctx.s.character
  return ITEMS.filter((i) => c.age >= i.minAge && !c.items.includes(i.id)).map((i) => ({ item: i, affordable: c.stats.cash >= i.price }))
}

export function jobOptions(ctx: Ctx) {
  return TRACKS.map((t) => ({ track: t, ...entryEligibility(ctx, t.id) }))
}
