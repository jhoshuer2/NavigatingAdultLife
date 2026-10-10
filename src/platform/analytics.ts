// Consent-gated telemetry SDK (docs/PRD-admin-analytics.md 4.1). Opt-in only: nothing is queued, stored or sent until the
// player agrees, and withdrawing consent clears the queue and stops everything at once. Failures never reach gameplay.
import type { EventName } from '@shared/events'

type Props = Record<string, string | number | boolean | null>
interface QueuedEvent { event_id: string; name: string; ts: string; device_id: string; session_id: string; life_id: string | null; app_version: string; props: Props }
export interface Ctx { screen: string; mode: 'world' | 'menu'; place: string | null }

const DEVICE_KEY = 'nal.device.v1'
const QUEUE_KEY = 'nal.telemetry.queue.v1'
const LIFE_KEY = 'nal.telemetry.life.v1'
const MAX_QUEUE = 500, MAX_BATCH = 50, MAX_AGE_MS = 7 * 86400e3
const IDLE_MS = 30 * 60e3, ACTIVE_WINDOW_MS = 60e3, FLUSH_MS = 15e3, HEARTBEAT_S = 30
export const CONSENT_VERSION = '1'

export interface Deps {
  endpoint: string
  fetch: typeof fetch
  beacon: ((url: string, data: Blob) => boolean) | null
  storage: { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }
  now: () => number
  uuid: () => string
  appVersion: string
  isTest: boolean
  context: () => Record<string, unknown>
}

const uuidv4 = () => (globalThis.crypto?.randomUUID?.() ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16) }))

export function createClient(d: Deps) {
  let consent = false, queue: QueuedEvent[] = [], deviceId = '', sessionId = '', lifeId: string | null = null
  let lastEventAt = 0, lastInput = d.now(), activeSec = 0, sinceBeat = 0, failures = 0, retryAt = 0, visible = true
  let ctx: Ctx = { screen: 'title', mode: 'world', place: null }
  const store = {
    get: (k: string) => { try { return d.storage.getItem(k) } catch { return null } },
    set: (k: string, v: string) => { try { d.storage.setItem(k, v) } catch { /* ignore */ } },
    del: (k: string) => { try { d.storage.removeItem(k) } catch { /* ignore */ } },
  }
  const persist = () => store.set(QUEUE_KEY, JSON.stringify(queue))
  const device = () => deviceId || (deviceId = store.get(DEVICE_KEY) || (() => { const id = d.uuid(); store.set(DEVICE_KEY, id); return id })())

  function emit(name: EventName, props: Props = {}) {
    if (!consent) return
    try {
      const t = d.now()
      if (!sessionId || t - lastEventAt > IDLE_MS) {
        if (sessionId) push('session_end', { reason: 'idle', active_seconds: 0 }, lastEventAt)
        sessionId = d.uuid(); push('session_start', {}, t)
      }
      lastEventAt = t
      push(name, props, t)
    } catch { /* never throw */ }
  }
  function push(name: string, props: Props, t: number) {
    queue.push({ event_id: d.uuid(), name, ts: new Date(t).toISOString(), device_id: device(), session_id: sessionId, life_id: lifeId, app_version: d.appVersion, props })
    if (queue.length > MAX_QUEUE) queue = queue.slice(queue.length - MAX_QUEUE)
    persist()
  }

  function body(batch: QueuedEvent[]) {
    return JSON.stringify({ v: 1, events: batch, ctx: { ...d.context(), consent_version: CONSENT_VERSION, is_test: d.isTest } })
  }
  async function flush(unloading = false) {
    if (!consent || !d.endpoint || !queue.length) return
    const t = d.now()
    queue = queue.filter((e) => t - Date.parse(e.ts) < MAX_AGE_MS)
    if (!queue.length) { persist(); return }
    if (!unloading && t < retryAt) return
    const batch = queue.slice(0, MAX_BATCH)
    const payload = body(batch)
    try {
      if (unloading && d.beacon && d.beacon(d.endpoint, new Blob([payload], { type: 'text/plain' }))) { queue = queue.slice(batch.length); persist(); return }
      const res = await d.fetch(d.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload, keepalive: true })
      if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 429)) { queue = queue.slice(batch.length); failures = 0; persist() } // 4xx: bad batch, drop it
      else throw new Error(String(res.status))
      if (queue.length && !unloading) void flush()
    } catch { failures++; retryAt = d.now() + Math.min(5 * 60e3, 2 ** failures * 1000) }
  }

  return {
    emit, flush,
    get consent() { return consent },
    get deviceId() { return device() },
    get queueLength() { return queue.length },
    setConsent(granted: boolean) {
      if (granted === consent) return
      if (!granted) { consent = false; queue = []; lifeId = null; store.del(QUEUE_KEY); store.del(LIFE_KEY); store.del(DEVICE_KEY); deviceId = ''; sessionId = ''; return }
      consent = true; if (lifeId) store.set(LIFE_KEY, lifeId)
      try { const q = JSON.parse(store.get(QUEUE_KEY) ?? '[]') as QueuedEvent[]; if (Array.isArray(q)) queue = q } catch { queue = [] }
      emit('consent_changed', { granted: true })
    },
    setLife(id: string | null) { lifeId = id; if (consent) { if (id) store.set(LIFE_KEY, id); else store.del(LIFE_KEY) } },
    restoreLife() { if (consent) lifeId = store.get(LIFE_KEY) ?? lifeId },
    setContext(c: Partial<Ctx>) { ctx = { ...ctx, ...c } },
    input() { lastInput = d.now() },
    setVisible(v: boolean) { visible = v },
    /** Call once a second. Counts active time (visible and recent input) and sends a heartbeat every 30 s. */
    tick() {
      if (!consent || !visible || d.now() - lastInput > ACTIVE_WINDOW_MS) return
      activeSec++; sinceBeat++
      if (sinceBeat >= HEARTBEAT_S) { emit('heartbeat', { active_seconds: sinceBeat, screen: ctx.screen, mode: ctx.mode, place: ctx.place }); sinceBeat = 0 }
    },
    /** Tab hidden or closing: send what is pending with the remaining active time. */
    leaving() {
      if (!consent) return
      if (sinceBeat > 0) { emit('heartbeat', { active_seconds: sinceBeat, screen: ctx.screen, mode: ctx.mode, place: ctx.place }); sinceBeat = 0 }
      void flush(true)
    },
    /** Erase on the server (by device id), then forget the id and queue locally. Allowed without consent: it is the player's own request. */
    async forget(): Promise<boolean> {
      const id = device(); let ok = true
      if (d.endpoint) { try { const r = await d.fetch(d.endpoint.replace(/collect$/, 'forget'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ device_id: id }) }); ok = r.ok } catch { ok = false } }
      if (ok) { queue = []; store.del(QUEUE_KEY); store.del(DEVICE_KEY); deviceId = ''; sessionId = '' }
      return ok
    },
  }
}

// ---------- default browser instance ----------
const ENDPOINT = (import.meta.env?.VITE_COLLECTOR_URL as string | undefined) ?? ''
const qs = () => { try { return new URLSearchParams(location.search) } catch { return new URLSearchParams() } }
const band = () => { const w = innerWidth; return w < 480 ? 'xs' : w < 768 ? 'sm' : w < 1200 ? 'md' : 'lg' }
const loadMs = () => { try { const n = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined; const v = n ? Math.round(n.domContentLoadedEventEnd) : 0; return v > 0 ? v : null } catch { return null } }
const displayMode = () => { try { return matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser' } catch { return 'browser' } }

let client: ReturnType<typeof createClient> | null = null
function get() {
  if (client) return client
  const q = qs()
  client = createClient({
    endpoint: ENDPOINT, fetch: (...a) => fetch(...a),
    beacon: typeof navigator !== 'undefined' && navigator.sendBeacon ? (u, b) => navigator.sendBeacon(u, b) : null,
    storage: localStorage, now: Date.now, uuid: uuidv4, appVersion: (import.meta.env?.VITE_APP_VERSION as string | undefined) ?? 'dev',
    isTest: q.get('debug') === '1' || q.get('unlimited') === '1' || (typeof navigator !== 'undefined' && navigator.webdriver === true),
    context: () => ({ language: navigator.language, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, screen_band: band(), display_mode: displayMode() }),
  })
  return client
}

export function track(name: EventName, props?: Props) { try { get().emit(name, props) } catch { /* ignore */ } }
export function setLifeId(id: string | null) { try { get().setLife(id) } catch { /* ignore */ } }
export function restoreLifeId() { try { get().restoreLife() } catch { /* ignore */ } }
export function setAnalyticsContext(c: Partial<Ctx>) { try { get().setContext(c) } catch { /* ignore */ } }
export const newLifeId = uuidv4
export const shortDeviceCode = () => { try { return get().deviceId.slice(0, 8).toUpperCase() } catch { return '' } }
export const analyticsAvailable = () => !!ENDPOINT
export function setAnalyticsConsent(granted: boolean) {
  try {
    const c = get(); const was = c.consent
    if (granted && !was) { c.setConsent(true); const q = qs(); track('app_open', { referrer: document.referrer ? new URL(document.referrer).host : null, utm_source: q.get('utm_source'), utm_medium: q.get('utm_medium'), utm_campaign: q.get('utm_campaign'), display_mode: displayMode(), load_ms: loadMs() }) }
    else if (!granted && was) c.setConsent(false)
  } catch { /* ignore */ }
}
export const forgetMe = () => get().forget()

let started = false
/** Wire browser listeners once. Safe to call repeatedly. */
export function startAnalytics() {
  if (started || typeof window === 'undefined') return
  started = true
  const c = get()
  const touch = () => c.input()
  for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, touch, { passive: true })
  document.addEventListener('visibilitychange', () => { c.setVisible(document.visibilityState === 'visible'); if (document.visibilityState === 'hidden') c.leaving() })
  window.addEventListener('pagehide', () => c.leaving())
  window.addEventListener('online', () => void c.flush())
  window.addEventListener('appinstalled', () => track('pwa_installed'))
  window.addEventListener('error', (e) => track('error', { message: String(e.message ?? '').slice(0, 80) }))
  window.addEventListener('unhandledrejection', (e) => track('error', { message: String((e.reason as Error)?.message ?? e.reason ?? '').slice(0, 80) }))
  setInterval(() => c.tick(), 1000)
  setInterval(() => void c.flush(), FLUSH_MS)
}
