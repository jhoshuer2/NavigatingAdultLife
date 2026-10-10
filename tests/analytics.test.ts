import { describe, expect, it } from 'vitest'
import { createClient, type Deps } from '@platform/analytics'
import { EVENT_NAMES, MAX_BATCH, parseEvent } from '@shared/events'

function harness(over: Partial<Deps> = {}) {
  let t = Date.UTC(2026, 0, 1, 12), n = 0
  const mem = new Map<string, string>()
  const calls: { url: string; body: any }[] = []
  const beacons: string[] = []
  let status = 204
  const deps: Deps = {
    endpoint: 'https://c.test/api/collect',
    fetch: (async (url: string, init: RequestInit) => { calls.push({ url, body: JSON.parse(String(init.body)) }); return new Response(null, { status }) }) as unknown as typeof fetch,
    beacon: (u) => { beacons.push(u); return true },
    storage: { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) },
    now: () => t, uuid: () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`,
    appVersion: 't', isTest: false, context: () => ({ language: 'en' }), ...over,
  }
  const c = createClient(deps)
  return { c, calls, beacons, mem, setStatus: (s: number) => { status = s }, advance: (ms: number) => { t += ms } }
}

describe('telemetry SDK', () => {
  it('does nothing without consent (no queue, storage or network)', async () => {
    const h = harness(); h.c.setLife('00000000-0000-4000-8000-0000000000aa')
    h.c.emit('title_viewed'); h.c.tick(); h.c.leaving(); await h.c.flush()
    expect(h.c.queueLength).toBe(0); expect(h.calls.length).toBe(0); expect(h.beacons.length).toBe(0); expect(h.mem.size).toBe(0)
  })
  it('sends a batch after consent with session, device and consent events', async () => {
    const h = harness(); h.c.setConsent(true); h.c.emit('title_viewed'); await h.c.flush()
    expect(h.calls.length).toBe(1)
    const names = h.calls[0].body.events.map((e: any) => e.name)
    expect(names).toEqual(['session_start', 'consent_changed', 'title_viewed'])
    expect(new Set(h.calls[0].body.events.map((e: any) => e.device_id)).size).toBe(1)
    expect(h.c.queueLength).toBe(0)
    for (const e of h.calls[0].body.events) expect(parseEvent(e)).not.toBeNull()
  })
  it('withdrawing consent clears the queue and stops all requests', async () => {
    const h = harness(); h.c.setConsent(true); h.c.emit('title_viewed'); h.c.setConsent(false)
    await h.c.flush(); h.c.leaving(); h.c.emit('map_opened')
    expect([...h.mem.keys()]).toEqual([])
    expect(h.calls.length).toBe(0); expect(h.beacons.length).toBe(0); expect(h.c.queueLength).toBe(0)
  })
  it('keeps events on server errors and retries with backoff, without duplicating ids', async () => {
    const h = harness(); h.c.setConsent(true); h.c.emit('title_viewed'); h.setStatus(500)
    await h.c.flush(); expect(h.c.queueLength).toBe(3)
    await h.c.flush(); expect(h.calls.length).toBe(1) // still backing off
    h.setStatus(204); h.advance(10_000); await h.c.flush()
    expect(h.calls.length).toBe(2); expect(h.c.queueLength).toBe(0)
    expect(h.calls[1].body.events.map((e: any) => e.event_id)).toEqual(h.calls[0].body.events.map((e: any) => e.event_id))
  })
  it('drops a batch the server rejects as invalid (4xx) so it cannot block the queue', async () => {
    const h = harness(); h.c.setConsent(true); h.setStatus(400); await h.c.flush(); expect(h.c.queueLength).toBe(0)
  })
  it('caps the queue at 500 and drops events older than 7 days', async () => {
    const h = harness({ endpoint: '' }); h.c.setConsent(true)
    for (let i = 0; i < 600; i++) h.c.emit('wait_used')
    expect(h.c.queueLength).toBe(500)
    const h2 = harness(); h2.c.setConsent(true); h2.c.emit('wait_used'); h2.advance(8 * 86400e3); h2.setStatus(204); await h2.c.flush()
    expect(h2.calls.length).toBe(0)
  })
  it('sends at most 50 events per request', async () => {
    const h = harness(); h.c.setConsent(true); for (let i = 0; i < 120; i++) h.c.emit('wait_used'); await h.c.flush()
    expect(h.calls.length).toBeGreaterThan(1); for (const c of h.calls) expect(c.body.events.length).toBeLessThanOrEqual(MAX_BATCH)
  })
  it('counts only active seconds and heartbeats every 30 s', () => {
    const h = harness(); h.c.setConsent(true)
    for (let i = 0; i < 30; i++) { h.advance(1000); h.c.input(); h.c.tick() }
    h.advance(120_000) // idle: no input for 2 minutes
    for (let i = 0; i < 30; i++) { h.advance(1000); h.c.tick() }
    const hb = (JSON.parse((h.mem.get('nal.telemetry.queue.v1') as string)) as any[]).filter((e) => e.name === 'heartbeat')
    expect(hb.length).toBe(1); expect(hb[0].props.active_seconds).toBe(30)
  })
  it('hidden tab does not count and leaving() beacons the remainder', () => {
    const h = harness(); h.c.setConsent(true)
    for (let i = 0; i < 10; i++) { h.advance(1000); h.c.input(); h.c.tick() }
    h.c.setVisible(false); for (let i = 0; i < 10; i++) { h.advance(1000); h.c.tick() }
    h.c.leaving(); expect(h.beacons.length).toBe(1)
  })
  it('starts a new session after 30 minutes idle', async () => {
    const h = harness(); h.c.setConsent(true); h.c.emit('wait_used'); h.advance(31 * 60e3); h.c.emit('wait_used'); await h.c.flush()
    const ev = h.calls[0].body.events as any[]
    expect(ev.filter((e) => e.name === 'session_start').length).toBe(2)
    expect(ev.filter((e) => e.name === 'session_end').length).toBe(1)
  })
  it('forget() calls the server then wipes the local id', async () => {
    const h = harness(); h.c.setConsent(true); const id = h.c.deviceId
    expect(await h.c.forget()).toBe(true)
    expect(h.calls.at(-1)?.url).toBe('https://c.test/api/forget'); expect(h.calls.at(-1)?.body.device_id).toBe(id)
    expect(h.c.deviceId).not.toBe(id)
  })
})

describe('event schema', () => {
  const base = { event_id: '00000000-0000-4000-8000-000000000001', ts: '2026-01-01T00:00:00.000Z', device_id: '00000000-0000-4000-8000-000000000002', session_id: '00000000-0000-4000-8000-000000000003', app_version: '1' }
  it('accepts a known event and strips props that are not allow-listed (e.g. a player name)', () => {
    const e = parseEvent({ ...base, name: 'create_completed', props: { archetype: 'a', player_name: 'Ada', gender: 'f' } })
    expect(e?.props).toEqual({ archetype: 'a', gender: 'f' })
  })
  it('rejects unknown names, bad ids and oversized events', () => {
    expect(parseEvent({ ...base, name: 'nope', props: {} })).toBeNull()
    expect(parseEvent({ ...base, event_id: 'x', name: 'wait_used' })).toBeNull()
    expect(parseEvent({ ...base, name: 'error', props: { message: 'x'.repeat(5000) } })).toBeNull()
  })
  it('has a defined allow-list for every event', () => { expect(EVENT_NAMES.length).toBeGreaterThan(40) })
})
