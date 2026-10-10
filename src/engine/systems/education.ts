import type { Ctx } from './ctx'
import { addStat, moment, setJob } from './effects'
import { log } from './log'
import { ITEM_BY_ID } from '@content/items'

const SCHOOL_ENERGY: Record<string, number> = { primary: 12, jss: 15, sss: 16, university: 22, polytechnic: 20, apprentice: 24 }
export const schoolEnergy = (level: string) => SCHOOL_ENERGY[level] ?? 0

export function examBonus(ctx: Ctx): number {
  let b = 0
  for (const id of ctx.s.character.items) b += ITEM_BY_ID[id]?.passive?.examBonus ?? 0
  return b
}

/** Called once per year at settlement; handles levels and exams. Returns summary lines. */
export function advanceEducation(ctx: Ctx): string[] {
  const { s, rng } = ctx
  const c = s.character
  const e = c.edu
  const lines: string[] = []
  if (e.level === 'none') return lines

  // learning from school itself
  const schoolGain = e.level === 'primary' ? 4 : e.level === 'jss' || e.level === 'sss' ? 4 : 3
  const typeBonus = e.schoolType === 'private' ? 1 : e.schoolType === 'federal' ? 1 : 0
  addStat(ctx, 'knowledge', schoolGain + typeBonus, 'School')
  e.yearsInLevel += 1
  if (['university', 'polytechnic'].includes(e.level)) e.gpa = Math.round(e.gpa * 0.6 + c.stats.knowledge * 0.4 + (e.studyPoints > 0 ? e.studyPoints : 0) * 2)

  if (e.level === 'primary' && e.yearsInLevel >= 6) {
    e.level = 'jss'; e.yearsInLevel = 0; e.credential = 'primary'
    lines.push('You finished primary school and move on to Junior Secondary.')
    moment(s, 'Finished primary school.', 3)
  } else if (e.level === 'jss' && e.yearsInLevel >= 3) {
    e.level = 'sss'; e.yearsInLevel = 0
    lines.push('Welcome to Senior Secondary School.')
  } else if (e.level === 'sss' && e.yearsInLevel >= 3) {
    const score = c.stats.knowledge * 0.85 + Math.min(14, e.studyPoints * 2) + examBonus(ctx) + rng.int(-12, 12) + (c.traits.includes('lucky') ? 4 : 0)
    e.examResult = score >= 72 ? 'distinction' : score >= 44 ? 'pass' : 'fail'
    s.flags.examResult = e.examResult
    e.level = 'none'; e.yearsInLevel = 0
    if (e.examResult !== 'fail') {
      e.credential = 'ssce'; s.flags.examPassed = true
      lines.push(e.examResult === 'distinction' ? 'WAEC/JAMB result: DISTINCTION. The whole street heard.' : 'WAEC/JAMB result: you passed. Mama is already thanking God.')
      moment(s, e.examResult === 'distinction' ? 'Passed WAEC with distinction.' : 'Passed WAEC and JAMB.', 6)
      addStat(ctx, 'happiness', e.examResult === 'distinction' ? 10 : 5, 'Exam result')
    } else {
      lines.push('WAEC/JAMB result: you did not pass this time. It hurts, but it is not the end.')
      addStat(ctx, 'happiness', -8, 'Exam result')
      moment(s, 'Failed the school exams the first time.', 4)
    }
  } else if (e.level === 'university' && e.yearsInLevel >= 4) {
    if (e.gpa < 38 && !s.flags.carryover) {
      s.flags.carryover = true; e.yearsInLevel = 3
      lines.push('Carryover! You must repeat a year. The course outline has defeated you for now.')
      addStat(ctx, 'happiness', -6, 'Carryover')
    } else {
      e.credential = 'degree'; e.level = 'none'; e.yearsInLevel = 0; s.flags.graduated = true
      const first = e.gpa >= 70
      if (first) { s.flags.firstClass = true; lines.push('You graduated with FIRST CLASS honours!'); moment(s, 'Graduated with First Class honours.', 9) }
      else { lines.push(e.gpa >= 55 ? 'You graduated with a good Second Class degree.' : 'You graduated. A pass is a pass.'); moment(s, 'Graduated from university.', 7) }
      addStat(ctx, 'happiness', first ? 14 : 8, 'Graduation')
      addStat(ctx, 'reputation', first ? 8 : 4, 'Graduation')
      s.flags.pendingNYSC = true
    }
  } else if (e.level === 'polytechnic' && e.yearsInLevel >= 2) {
    e.credential = 'ond'; e.level = 'none'; e.yearsInLevel = 0; s.flags.graduated = true
    lines.push('You earned your Ordinary National Diploma.')
    moment(s, 'Earned a National Diploma.', 5)
    addStat(ctx, 'happiness', 7, 'Graduation')
  } else if (e.level === 'apprentice' && e.yearsInLevel >= 3) {
    e.credential = 'trade'; e.level = 'none'; e.yearsInLevel = 0
    lines.push('Your master signs you off: you have finished your apprenticeship ("settlement").')
    moment(s, 'Completed an apprenticeship.', 6)
    addStat(ctx, 'happiness', 8, 'Settlement')
    if (!c.job) setJob(ctx, 'trade', 2)
  }
  e.studyPoints = 0
  if (lines.length) for (const l of lines) log(s, 'system', l)
  return lines
}
