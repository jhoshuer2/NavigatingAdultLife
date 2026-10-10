// Playtime Tokens (PRD 3.10). Client-side meter for M1; the server-side ledger arrives in M2.
import { DAILY_SEC, FREE_CAP_SEC, WELCOME_SEC, type MetaProfile } from './meta'

const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

/** Grants the welcome allowance once and the daily refill (capped so free balance never exceeds 2 hours). */
export function refreshTokens(meta: MetaProfile, now = new Date()): MetaProfile {
  const t = { ...meta.tokens }
  if (!t.welcomeGranted) { t.freeSec = WELCOME_SEC; t.welcomeGranted = true; t.lastRefillDay = dayKey(now) }
  else if (t.lastRefillDay !== dayKey(now)) { t.freeSec = Math.min(FREE_CAP_SEC, t.freeSec + DAILY_SEC); t.lastRefillDay = dayKey(now) }
  return { ...meta, tokens: t }
}

export function remainingSec(meta: MetaProfile): number {
  return meta.tokens.unlimited ? Infinity : meta.tokens.freeSec + meta.tokens.paidSec
}

/** Consume time: free tokens first, then purchased. */
export function consume(meta: MetaProfile, sec: number): MetaProfile {
  if (meta.tokens.unlimited) return meta
  const t = { ...meta.tokens }
  const fromFree = Math.min(t.freeSec, sec)
  t.freeSec -= fromFree
  t.paidSec = Math.max(0, t.paidSec - (sec - fromFree))
  return { ...meta, tokens: t }
}

export function addPaid(meta: MetaProfile, minutes: number): MetaProfile {
  return { ...meta, tokens: { ...meta.tokens, paidSec: meta.tokens.paidSec + minutes * 60 } }
}

export function fmtTime(sec: number): string {
  if (!isFinite(sec)) return '∞'
  const m = Math.max(0, Math.floor(sec / 60))
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`
}

export function secondsToNextRefill(now = new Date()): number {
  const next = new Date(now); next.setHours(24, 0, 0, 0)
  return Math.floor((next.getTime() - now.getTime()) / 1000)
}
export const TOP_UP_PACKS = [
  { id: 'p60', minutes: 60, price: 500, label: '1 hour' },
  { id: 'p180', minutes: 180, price: 1200, label: '3 hours' },
  { id: 'p600', minutes: 600, price: 3500, label: '10 hours' },
]
