import type { Ctx } from './ctx'
import type { TrackId } from '../core/types'
import { jobFor, JOBS, TRACKS } from '@content/jobs'
import { ITEM_BY_ID } from '@content/items'
import { credentialAtLeast, traitSum } from '../core/helpers'
import { addStat, moment, setJob } from './effects'
import { pensionFor, retireAge } from './economy'
import { log } from './log'

export function hireBonus(ctx: Ctx): number {
  const c = ctx.s.character
  let b = traitSum(c, 'checkBonus')
  for (const id of c.items) b += ITEM_BY_ID[id]?.passive?.hireBonus ?? 0
  return b
}

export function entryEligibility(ctx: Ctx, trackId: TrackId): { ok: boolean; why?: string } {
  const c = ctx.s.character
  const def = jobFor(trackId, 1)!
  if (!credentialAtLeast(c.edu.credential, def.minCredential)) return { ok: false, why: `Needs ${def.minCredential === 'degree' ? 'a degree' : def.minCredential === 'ssce' ? 'your WAEC/SSCE' : def.minCredential}` }
  if (c.stats.knowledge < def.minKnowledge) return { ok: false, why: `Needs Knowledge ${def.minKnowledge}+` }
  if (c.stats.reputation < def.minReputation) return { ok: false, why: `Needs Reputation ${def.minReputation}+` }
  return { ok: true }
}

export function tryHire(ctx: Ctx, trackId: TrackId): { hired: boolean; text: string } {
  const { s, rng } = ctx
  const c = s.character
  const def = jobFor(trackId, 1)!
  const eligible = entryEligibility(ctx, trackId)
  if (!eligible.ok) return { hired: false, text: eligible.why ?? 'Not eligible.' }
  const score = c.stats.knowledge * 0.5 + c.stats.reputation * 0.5 + hireBonus(ctx) + rng.int(-15, 15) + (c.edu.credential === 'degree' ? 8 : 0) + (s.flags.nepotism ? 12 : 0)
  if (score >= def.hireDifficulty) {
    setJob(ctx, trackId, 1)
    moment(s, `Started work as ${c.job?.title}.`, 6)
    addStat(ctx, 'happiness', 6, 'New job')
    return { hired: true, text: `You got the job: ${c.job?.title}!` }
  }
  addStat(ctx, 'stress', 3, 'Job hunt')
  return { hired: false, text: 'No luck this round. "We will call you." They did not call.' }
}

export function yearlyCareer(ctx: Ctx): string[] {
  const { s, rng } = ctx
  const c = s.character
  const lines: string[] = []
  const job = c.job
  if (!job) return lines
  job.years += 1
  const def = jobFor(job.trackId, job.level)!
  if (def.stress) addStat(ctx, 'stress', Math.round(def.stress * 0.8), 'Work')
  const overtime = Number(s.activityCounts.overtime ?? 0)
  // retirement
  if (c.age >= retireAge(job.trackId)) {
    const pension = pensionFor(job.trackId, job.salary)
    log(s, 'system', `You retired from ${job.title}.`)
    lines.push(`You retired as ${job.title}.${pension ? ` Pension: ₦${pension.toLocaleString('en-NG')}/year.` : ''}`)
    moment(s, `Retired as ${job.title}.`, 7)
    if (pension) s.flags.pension = pension
    c.job = undefined
    return lines
  }
  // layoff
  const risk = def.layoffRisk * (c.stats.reputation < 20 ? 1.5 : 1) * (overtime ? 0.7 : 1)
  if (rng.chance(risk)) {
    lines.push(`You lost your job as ${job.title}. Restructuring, they said.`)
    moment(s, `Lost the job of ${job.title}.`, 5)
    addStat(ctx, 'happiness', -10, 'Job loss')
    addStat(ctx, 'stress', 8, 'Job loss')
    c.job = undefined
    return lines
  }
  // promotion
  const next = JOBS.find((j) => j.trackId === job.trackId && j.level === job.level + 1)
  if (next && job.years >= def.minYears) {
    const perf = c.stats.knowledge * 0.4 + c.stats.reputation * 0.3 + job.years * 1.5 + overtime * 3 + rng.int(-8, 8)
    if (!credentialAtLeast(c.edu.credential, next.minCredential)) {
      if (perf >= def.promoteAt) lines.push(`You deserve a promotion, but the next level needs ${next.minCredential === 'degree' ? 'a degree' : next.minCredential === 'ond' ? 'a diploma' : 'more training'}.`)
    } else if (c.stats.reputation >= next.minReputation && c.stats.knowledge >= next.minKnowledge && perf >= def.promoteAt) {
      setJob(ctx, job.trackId, next.level)
      s.flags.promoted = true
      lines.push(`PROMOTED! You are now ${next.title}.`)
      moment(s, `Promoted to ${next.title}.`, 7)
      addStat(ctx, 'happiness', 8, 'Promotion')
      addStat(ctx, 'reputation', 4, 'Promotion')
    }
  }
  return lines
}

export const TRACK_LIST = TRACKS
