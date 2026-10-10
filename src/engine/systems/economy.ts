import type { Ctx } from './ctx'
import type { FamilyTier, EduLevel, SchoolType } from '../core/types'
import { traitProduct, fmtNaira } from '../core/helpers'
import { ITEM_BY_ID } from '@content/items'
import { HOMES } from '@content/archetypes'
import { addStat } from './effects'
import { jobFor, TRACKS } from '@content/jobs'

export const RENT = [180000, 600000, 1400000, 3200000, 7000000]
export const RENT_NAME = ['Shared room', 'Mini-flat', 'Two-bedroom flat', 'Big flat', 'Duplex']
export const LIFESTYLE_MULT = { frugal: 0.7, normal: 1, baller: 1.6 }

const POCKET: Record<FamilyTier, number> = { struggling: 20000, lowerMiddle: 50000, middle: 120000, comfortable: 320000 }
const COVERAGE: Record<FamilyTier, number> = { struggling: 0.25, lowerMiddle: 0.55, middle: 0.85, comfortable: 1 }

export function schoolFee(level: EduLevel, type: SchoolType, yearsInLevel: number): number {
  switch (level) {
    case 'primary': return type === 'private' ? 180000 : type === 'federal' ? 60000 : 25000
    case 'jss': case 'sss': return type === 'private' ? 280000 : type === 'federal' ? 90000 : 40000
    case 'university': return type === 'private' ? 1400000 : 110000
    case 'polytechnic': return 80000
    case 'apprentice': return yearsInLevel === 0 ? 250000 : 0
    default: return 0
  }
}

export function livingCostBase(ctx: Ctx): number {
  const c = ctx.s.character
  const home = HOMES.find((h) => h.id === c.housing.districtId)
  const hm = home?.costMult ?? 1
  return Math.round(380000 * hm * LIFESTYLE_MULT[c.lifestyle] * traitProduct(c, 'livingCost'))
}

export interface Settlement { income: number; expenses: number; lines: string[] }

export function settleMoney(ctx: Ctx): Settlement {
  const { s, rng } = ctx
  const c = s.character
  const lines: string[] = []
  let income = 0
  let expenses = 0

  // INCOME
  if (c.job) {
    const pay = Math.round(c.job.salary * (0.97 + rng.next() * 0.06))
    income += pay
    lines.push(`Salary as ${c.job.title}: ${fmtNaira(pay)}`)
  } else if (s.flags.pension) {
    const pay = Number(s.flags.pension)
    income += pay
    lines.push(`Pension: ${fmtNaira(pay)}`)
  }
  if (c.hustleIncome !== 0) {
    income += c.hustleIncome
    lines.push(`Side hustle: ${fmtNaira(c.hustleIncome)}`)
  }
  const inTertiary = ['university', 'polytechnic', 'apprentice'].includes(c.edu.level)
  if (c.age < 22 || (inTertiary && c.age < 27)) {
    const pocket = Math.round(POCKET[c.familyTier] * (c.age < 12 ? 0.5 : inTertiary ? 1.6 : 1))
    income += pocket
    lines.push(`Family allowance: ${fmtNaira(pocket)}`)
  }
  if (s.flags.diasporaCousin && c.age >= 12 && c.age < 40) {
    income += 90000
    lines.push('Gift from your cousin abroad: ₦90,000')
  }
  if (c.spouseId && s.npcs[c.spouseId]?.alive) {
    const sp = Math.round((700000 + rng.next() * 2200000) / 1000) * 1000
    income += sp
    lines.push(`Spouse contribution: ${fmtNaira(sp)}`)
  }

  // EXPENSES
  if (c.job) {
    const taxRate = 0.08 + Math.min(0.22, c.job.salary / 60000000)
    const tax = Math.round(c.job.salary * taxRate)
    expenses += tax
    lines.push(`Tax and pension deductions: ${fmtNaira(tax)}`)
  }
  const fee = schoolFee(c.edu.level, c.edu.schoolType, c.edu.yearsInLevel)
  if (fee > 0) {
    const cover = c.age < 24 ? (s.flags.scholarship ? Math.max(0.9, COVERAGE[c.familyTier]) : COVERAGE[c.familyTier]) : 0
    const mine = Math.round(fee * (1 - cover))
    if (mine > 0) { expenses += mine; lines.push(`School fees (your share): ${fmtNaira(mine)}`) }
  }
  if (c.housing.type === 'family') {
    if (c.age >= 22 && c.job) {
      const contribution = Math.round(c.job.salary * 0.08)
      expenses += contribution
      lines.push(`Contribution to the family house: ${fmtNaira(contribution)}`)
    }
  } else {
    const earned = (c.job?.salary ?? 0) + c.hustleIncome
    const base = Math.max(livingCostBase(ctx), Math.round(earned * 0.34 * LIFESTYLE_MULT[c.lifestyle] * traitProduct(c, 'livingCost')))
    const rent = c.housing.type === 'rent' ? Math.round(RENT[c.housing.tier] * (HOMES.find((h) => h.id === c.housing.districtId)?.costMult ?? 1)) : 0
    const mult = c.spouseId ? 1.4 : 1
    expenses += Math.round(base * mult)
    lines.push(`Food and upkeep: ${fmtNaira(Math.round(base * mult))}`)
    if (rent) { expenses += rent; lines.push(`Rent, paid upfront (${RENT_NAME[c.housing.tier]}): ${fmtNaira(rent)}`) }
  }
  if (c.job && c.age >= 24 && c.age < 62) {
    const support = Math.round(c.job.salary * 0.07)
    expenses += support
    lines.push(`Support to relatives: ${fmtNaira(support)}`)
  }
  if (c.age >= 50) {
    const med = Math.round(120000 * ((c.age - 45) / 8) * (c.items.includes('medCover') ? 0.5 : 1))
    expenses += med
    lines.push(`Medical costs: ${fmtNaira(med)}`)
  }
  if (c.childrenIds.length) {
    const kid = c.childrenIds.length * 260000
    expenses += kid
    lines.push(`Children (food, school, clothes): ${fmtNaira(kid)}`)
  }
  if (c.stats.cash < 0) {
    const interest = Math.round(-c.stats.cash * 0.12)
    expenses += interest
    lines.push(`Interest on debt: ${fmtNaira(interest)}`)
  }
  const gen = c.items.includes('generator') ? 1 : 0
  if (gen && c.age >= 18) { expenses += 60000; lines.push('Generator fuel: ₦60,000') }

  if (income) addStat(ctx, 'cash', income, 'Income')
  if (expenses) addStat(ctx, 'cash', -expenses, 'Expenses')
  return { income, expenses, lines }
}

export function applyPassiveItems(ctx: Ctx) {
  const c = ctx.s.character
  for (const id of c.items) {
    const p = ITEM_BY_ID[id]?.passive
    if (!p) continue
    if (p.yearlyHappiness) addStat(ctx, 'happiness', p.yearlyHappiness, 'Items')
    if (p.yearlyStress) addStat(ctx, 'stress', p.yearlyStress, 'Items')
    if (p.yearlyRep) addStat(ctx, 'reputation', p.yearlyRep, 'Items')
  }
}

export const retireAge = (trackId: string) => ({ civil: 60, corporate: 60, tech: 62, trade: 68, creative: 65 } as Record<string, number>)[trackId] ?? 62

export function pensionFor(trackId: string, salary: number): number {
  const rate = TRACKS.find((t) => t.id === trackId)?.pension ?? 0
  return Math.round((salary * rate) / 1000) * 1000
}
export { jobFor }
