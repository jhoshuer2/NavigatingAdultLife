import { randomUUID } from 'node:crypto'
import { memoryDb, type Db } from '../server/db'

export async function freshDb(): Promise<Db> { return memoryDb() }

export interface Gen { device: string; session: string; life: string | null }
export const newGen = (): Gen => ({ device: randomUUID(), session: randomUUID(), life: null })

export function ev(g: Gen, name: string, props: Record<string, unknown> = {}, at = new Date(), over: Record<string, unknown> = {}) {
  return { event_id: randomUUID(), name, ts: at.toISOString(), device_id: g.device, session_id: g.session, life_id: g.life, app_version: '1.0', props, ...over }
}
export const batch = (events: unknown[], ctx: Record<string, unknown> = {}) => ({ v: 1, events, ctx: { consent_version: '1', language: 'en-NG', tz: 'Africa/Lagos', ...ctx } })
export const NG_HEADERS = (extra: Record<string, string> = {}) => new Headers({
  'user-agent': 'Mozilla/5.0 (Linux; Android 13; TECNO KG5k) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'x-vercel-ip-country': 'NG', 'x-vercel-ip-country-region': 'LA', 'x-vercel-ip-city': 'Ikeja', 'x-forwarded-for': '102.89.1.2', ...extra,
})
