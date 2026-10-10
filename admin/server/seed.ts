// Synthetic players for local development and tests. Goes through the real ingest path.
import { randomUUID } from 'node:crypto'
import type { Db } from './db'
import { ingest } from './ingest'

const PLACES = ['home', 'classroom', 'buka', 'pitch', 'market', 'church', 'workplace', 'jobcentre']
const TASKS = ['study', 'penalty', 'chores', 'jog', 'market', 'overtime', 'chat', 'hang']
const STORIES = ['ev_black_tax', 'ev_jamb_result', 'ev_nepa_bill', 'ev_wedding_owambe', 'ev_scholarship', 'ev_danfo_fare', 'ev_harmattan_cold']
const TONES = ['warm', 'funny', 'flat', 'meh']
const ACTS = ['study', 'exercise', 'socialise', 'hustle', 'rest', 'community', 'dash']
const GEOS = [
  { c: 'NG', r: 'LA', city: 'Lagos', w: 40 }, { c: 'NG', r: 'LA', city: 'Ikeja', w: 10 }, { c: 'NG', r: 'FC', city: 'Abuja', w: 14 }, { c: 'NG', r: 'RI', city: 'Port Harcourt', w: 8 },
  { c: 'NG', r: 'OY', city: 'Ibadan', w: 7 }, { c: 'NG', r: 'KN', city: 'Kano', w: 5 }, { c: 'NG', r: 'EN', city: 'Enugu', w: 4 }, { c: 'GB', r: 'ENG', city: 'London', w: 5 }, { c: 'US', r: 'TX', city: 'Houston', w: 4 }, { c: 'GH', r: 'AA', city: 'Accra', w: 3 },
]
const UAS = [
  'Mozilla/5.0 (Linux; Android 13; TECNO KG5k) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 12; SM-A125F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]
function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32) }

export async function seedPlayers(db: Db, opts: { players: number; days: number; now: Date; seed?: number }) {
  const rand = rng(opts.seed ?? 1)
  const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)]
  const totalW = GEOS.reduce((a, g) => a + g.w, 0)
  const geoPick = () => { let x = rand() * totalW; for (const g of GEOS) { if ((x -= g.w) < 0) return g } return GEOS[0] }
  for (let p = 0; p < opts.players; p++) {
    const device = randomUUID(), geo = geoPick(), ua = pick(UAS), startOffset = Math.floor(rand() * opts.days)
    const headers = new Headers({ 'user-agent': ua, 'x-vercel-ip-country': geo.c, 'x-vercel-ip-country-region': geo.r, 'x-vercel-ip-city': geo.city })
    let life: string | null = null
    for (let d = opts.days - 1 - startOffset; d >= 0; d--) {
      if (d !== opts.days - 1 - startOffset && rand() > 0.45) continue // not every day
      const day = new Date(opts.now.getTime() - d * 86400e3); day.setUTCHours(7 + Math.floor(rand() * 14), Math.floor(rand() * 60), 0, 0)
      const session = randomUUID(); const ev: unknown[] = []
      const e = (name: string, props: Record<string, unknown> = {}, offs = 0) => ev.push({ event_id: randomUUID(), name, ts: new Date(day.getTime() + offs * 1000).toISOString(), device_id: device, session_id: session, life_id: life, app_version: '1.0', props })
      let t = 0
      e('session_start'); if (d === opts.days - 1 - startOffset) e('app_open', { referrer: rand() < 0.5 ? 'wa.me' : null, display_mode: 'browser', load_ms: 500 + Math.floor(rand() * 7000) })
      if (!life && rand() < 0.9) { life = randomUUID(); e('create_started'); e('create_completed', { archetype: pick(['scholar', 'hustler', 'creative']), gender: pick(['male', 'female']), district: pick(['mainland', 'island']) }, 20); e('life_started', { life_index: 1 }, 30) }
      const beats = 1 + Math.floor(rand() * 12)
      for (let i = 0; i < beats; i++) {
        t += 30; e('heartbeat', { active_seconds: 30, screen: rand() < 0.12 ? 'dash' : rand() < 0.15 ? 'title' : 'play', mode: rand() < 0.1 ? 'menu' : 'world' }, t)
        if (rand() < 0.6) e('place_entered', { place: pick(PLACES), hour: 8 + Math.floor(rand() * 12) }, t)
        if (rand() < 0.4) e('task_completed', { task: pick(TASKS), perf: Math.round(rand() * 100) / 100, duration_s: 30 }, t)
        if (rand() < 0.5) e('activity_done', { activity_id: pick(ACTS), energy_cost: 10, cash_delta: 0 }, t)
        if (rand() < 0.1) e('map_opened', {}, t)
        if (rand() < 0.05) e('paywall_seen', {}, t)
      }
      if (life) {
        if (rand() < 0.5) e('year_ended', { age: 18 + Math.floor(rand() * 40), life_index: 1 }, t + 2)
        const st = pick(STORIES); if (rand() < 0.6) { e('story_event_shown', { event_id: st }, t + 3); e('story_choice_made', { event_id: st, choice_id: pick(['a', 'b', 'c']) }, t + 4); if (rand() < 0.05) e('content_flagged', { event_id: st, reason: 'flagged' }, t + 5) }
      }
      if (rand() < 0.5) { const task = pick(TASKS); e('task_started', { task }, t + 1); if (rand() < 0.2) e('task_abandoned', { task, duration_s: 10 }, t + 2) }
      if (rand() < 0.4) e('conversation_choice', { tone: pick(TONES), role: pick(['friend', 'mother', 'boss']), setting: 'street' }, t + 1)
      if (rand() < 0.06) e('error', { message: pick(['TypeError: x is undefined', 'Failed to fetch', 'WebGL context lost']) }, t + 1)
      if (rand() < 0.08) e('slow_device_detected', {}, t + 1)
      if (rand() < 0.02) e('webgl_unavailable', {}, t + 1)
      if (life && rand() < 0.08) { e('life_ended', { age: 30 + Math.floor(rand() * 60), ending_id: pick(['peaceful', 'legacy', 'broke']) }, t + 5); life = null }
      await ingest(db, { v: 1, events: ev, ctx: { consent_version: '1', language: 'en-NG', tz: geo.c === 'NG' ? 'Africa/Lagos' : 'UTC', screen_band: 'xs' } }, headers, new Date(day.getTime() + (t + 10) * 1000))
    }
  }
}
