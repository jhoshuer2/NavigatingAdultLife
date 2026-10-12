import type { Ctx } from './ctx'
import type { Ending } from '../core/types'
import { DREAM_BY_ID } from '@content/dreams'
import { fmtNaira, netWorth } from '../core/helpers'
import { dreamProgress } from './progress'

interface EndingDef { id: string; title: string; test: (c: Ctx, nw: number) => boolean }

const alive = (c: Ctx) => Object.values(c.s.npcs).filter((n) => n.alive && n.closeness >= 70).length

// Order matters: first match wins.
const ENDINGS: EndingDef[] = [
  { id: 'cutShort', title: 'Gone Too Soon', test: (c) => c.s.character.age < 40 },
  { id: 'bigOga', title: 'Big Oga', test: (c, nw) => (c.s.character.job?.level ?? 0) >= 4 || nw > 400000000 || (c.s.dreamDone && ['bigOga', 'unicorn', 'star'].includes(c.s.character.dreamId)) },
  { id: 'familyPillar', title: 'Family Pillar', test: (c) => c.s.character.childrenIds.length >= 2 && alive(c) >= 3 },
  { id: 'lonely', title: 'Lonely at the Top', test: (c, nw) => nw > 60000000 && alive(c) <= 1 && !c.s.character.spouseId && c.s.character.childrenIds.length === 0 },
  { id: 'scholar', title: 'The Scholar', test: (c) => c.s.character.stats.knowledge >= 92 && c.s.character.edu.credential === 'degree' },
  { id: 'brokeBeloved', title: 'Broke but Beloved', test: (c, nw) => nw < 15000000 && alive(c) >= 2 },
  { id: 'hustler', title: 'Hustler Till the End', test: (c) => Number(c.s.flags.hustleCount ?? 0) >= 8 },
  { id: 'respected', title: 'Respected Elder', test: (c) => c.s.character.stats.reputation >= 65 },
  { id: 'comfortable', title: 'Comfortable & Content', test: (c) => c.s.character.stats.happiness >= 45 },
]

export function legacyScore(ctx: Ctx): number {
  const { s } = ctx
  const c = s.character
  const nw = netWorth(s)
  const wealthTier = nw > 1000000000 ? 5 : nw > 300000000 ? 4 : nw > 100000000 ? 3 : nw > 20000000 ? 2 : nw > 0 ? 1 : 0
  const avgH = s.avgHappiness.n ? s.avgHappiness.sum / s.avgHappiness.n : c.stats.happiness
  const rels = Object.values(s.npcs).filter((n) => n.alive).reduce((a, n) => a + n.closeness, 0) / 20
  const underdog = c.familyTier === 'struggling' ? 15 : c.familyTier === 'lowerMiddle' ? 8 : 0
  return Math.round(wealthTier * 20 + avgH * 0.3 + c.stats.knowledge * 0.2 + c.stats.reputation * 0.3 + Math.min(rels, 25) + s.achievements.length * 5 + (s.dreamDone ? 25 : 0) + (underdog && wealthTier >= 2 ? underdog : 0))
}

export function buildEnding(ctx: Ctx, cause: string, achieved = false): Ending {
  const { s } = ctx
  const c = s.character
  const nw = netWorth(s)
  const def = achieved ? { id: 'dreamAchieved', title: `${DREAM_BY_ID[c.dreamId].name}: Dream Achieved`, test: () => true } : ENDINGS.find((e) => e.test(ctx, nw)) ?? ENDINGS[ENDINGS.length - 1]
  const legacy = legacyScore(ctx)
  const moments = [...s.moments].sort((a, b) => b.weight - a.weight || a.age - b.age).slice(0, 5).sort((a, b) => a.age - b.age)
  const dream = DREAM_BY_ID[c.dreamId]
  const dp = dreamProgress(ctx)
  const job = c.job?.title ?? (s.flags.lastJob ? String(s.flags.lastJob) : 'whatever honest work came along')
  const kids = c.childrenIds.length
  const intro = achieved ? `${c.nickname || c.name} reached the big dream at ${c.age}. ${cause}` : `${c.nickname || c.name} died at ${c.age}. ${cause}`
  const body = [
    def.id === 'cutShort' ? 'Life ended before the story was done, but the people who loved them remember the laughter.' : '',
    `Known as "${def.title}". Worked as ${job}, left behind ${kids ? `${kids} ${kids === 1 ? 'child' : 'children'}` : 'good memories'} and a net worth of ${fmtNaira(nw)}.`,
    s.dreamDone ? `They chased the dream of ${dream.name} and caught it.` : `Their dream, ${dream.name}, stayed unfinished (${dp.text}).`,
  ].filter(Boolean).join(' ')
  const cowries = Math.max(2, Math.floor(legacy / 25)) + s.cowriesEarnedLife
  return {
    id: def.id, title: def.title, cause, obituary: `${intro} ${body}`, legacy, cowries,
    topMoments: moments.map((m) => `Age ${m.age}: ${m.text}`), netWorth: nw, dreamDone: s.dreamDone, achievements: [...s.achievements],
  }
}

export function mortalityProbability(ctx: Ctx): number {
  const { s } = ctx
  const c = s.character
  const age = c.age
  let base = age < 40 ? 0.0009 : 0.003 * Math.exp((age - 40) * 0.095)
  const healthMult = Math.min(1.6, Math.max(0.4, 1.5 - c.stats.health / 100))
  base *= healthMult
  if (c.items.includes('medCover')) base *= 0.85
  if (c.stats.stress > 85) base *= 1.3
  return Math.min(0.6, base)
}
