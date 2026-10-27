// Live Rush races on the client: ghosts, standings and the challenge / lobby / race calls against a mocked server.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Ghost, Ghosts, ordinal, snapshotOf, standing } from '../src/minigames/go-slow-dash/ghost'
import { createDash } from '../src/minigames/go-slow-dash/sim'
import type { MatchView, SnapshotT } from '../shared/rush'

const snap = (dist: number, t: number, over: Partial<SnapshotT> = {}): SnapshotT => ({ dist, lane: 0, y: 0, slide: 0, score: Math.round(dist), hearts: 3, over: false, t, ...over })

describe('ghosts', () => {
  it('snapshotOf only carries what is needed and stays inside the server limits', () => {
    const st = createDash({ seed: 5, mode: 'foot', hearts: 3, assist: false })
    st.dist = 123.4; st.score = 99.6; st.lane = 1; st.y = -9
    const s = snapshotOf(st)
    expect(s).toMatchObject({ dist: 123.4, lane: 1, score: 100, hearts: 3, over: false })
    expect(s.y).toBe(-2)
  })

  it('glides toward the latest snapshot and carries on at the speed it was going, never far ahead', () => {
    const g = new Ghost('a', 'Ann#1')
    g.push(snap(0, 0), 0); g.push(snap(10, 1), 400) // 10 m per second
    for (let t = 400; t <= 900; t += 16) g.step(0.016, t)
    expect(g.st.dist).toBeGreaterThan(9); expect(g.st.dist).toBeLessThan(21)
    for (let t = 900; t <= 6000; t += 16) g.step(0.016, t) // snapshots stop: it must not run away
    expect(g.st.dist).toBeLessThan(10 + 10 * 1 + 1)
  })

  it('eases lanes, ignores a repeated snapshot and stops where a runner crashed', () => {
    const g = new Ghost('a', 'Ann#1')
    g.push(snap(50, 5, { lane: 1 }), 0)
    for (let t = 0; t < 500; t += 16) g.step(0.016, t)
    expect(g.st.x).toBeGreaterThan(0.95)
    g.push(snap(50, 5, { lane: -1 }), 600) // same t and dist: a repeat, so the lane does not flip
    for (let t = 600; t < 1200; t += 16) g.step(0.016, t)
    expect(g.st.x).toBeGreaterThan(0.9)
    g.push(snap(80, 8, { over: true }), 1300)
    for (let t = 1300; t < 3000; t += 16) g.step(0.016, t)
    expect(g.st.over).toBe(true); expect(g.st.dist).toBeCloseTo(80, 0)
  })

  it('keeps one ghost per other runner and drops those who left', () => {
    const gs = new Ghosts()
    gs.update([{ id: 'me', label: 'Me#1', snap: snap(0, 0) }, { id: 'a', label: 'A#1', snap: snap(5, 1) }, { id: 'b', label: 'B#1', snap: null }], 'me', 0)
    expect(gs.list().map((g) => g.id)).toEqual(['a', 'b']); expect(gs.states()).toHaveLength(2)
    gs.update([{ id: 'me', label: 'Me#1', snap: null }, { id: 'a', label: 'A#1', snap: snap(9, 2) }], 'me', 400)
    expect(gs.list().map((g) => g.id)).toEqual(['a'])
  })

  it('ranks you against the others', () => {
    expect(standing(500, [{ score: 900 }, { score: 100 }])).toEqual({ rank: 2, of: 3, leader: 900 })
    expect(standing(500, [])).toEqual({ rank: 1, of: 1, leader: 500 })
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22].map(ordinal)).toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd'])
  })
})

// ---- the network side, against a mocked fetch ----
const store: Record<string, string> = {}
const view = (over: Partial<MatchView> = {}): MatchView => ({ id: 'm1', status: 'inviting', seed: 7, secs: 60, host: 'Host#1', invite_until: 0, start_at: null, invited: 2, winner: null, players: [], ...over })

describe('race calls', () => {
  beforeEach(() => {
    vi.resetModules()
    for (const k of Object.keys(store)) delete store[k]
    vi.stubGlobal('localStorage', { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v }, removeItem: (k: string) => { delete store[k] } })
    vi.stubEnv('VITE_ACCOUNT_URL', 'https://api.example/api/account')
  })
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })
  const signIn = (mp: boolean) => { store['nal.account.v1'] = JSON.stringify({ token: 'tok', account: { id: 'me', name: 'Me', tag: 1, label: 'Me#1', friend_code: 'X', age_band: '18plus', mp_enabled: mp, has_guardian_pin: false, chat_level: 'none', created_at: '' } }) }

  it('explains why a race is not possible', async () => {
    const r = await import('../src/platform/rush')
    expect(r.rushBlocked()).toBe('signin')
    signIn(false); expect(r.rushBlocked()).toBe('online_off'); expect(r.rushBlockedText('online_off')).toMatch(/Settings/)
    signIn(true); expect(r.rushBlocked()).toBeNull()
  })

  it('goes to /api/rush with the token and learns the server clock', async () => {
    signIn(true)
    const calls: { url: string; auth: string; body: any }[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: any) => { calls.push({ url, auth: init.headers.authorization, body: JSON.parse(init.body) }); return new Response(JSON.stringify({ now: Date.now() + 5000, invites: [] }), { status: 200 }) }))
    const r = await import('../src/platform/rush')
    const before = r.serverNow()
    await r.rushPing()
    expect(calls[0]).toMatchObject({ url: 'https://api.example/api/rush', auth: 'Bearer tok', body: { op: 'ping' } })
    expect(r.serverNow() - before).toBeGreaterThan(4000) // the clock now runs about 5 s ahead
  })

  it('a challenge with nobody around comes back already over, so the host is offered Alfred', async () => {
    signIn(true)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ now: Date.now(), match: view({ status: 'no_takers', invited: 0 }) }), { status: 200 })))
    const m = await import('../src/platform/match')
    expect((await m.sendChallenge(90))?.status).toBe('no_takers')
  })

  it('a failed request gives null instead of throwing', async () => {
    signIn(true)
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    const m = await import('../src/platform/match')
    expect(await m.sendChallenge(90)).toBeNull()
  })

  it('watches a lobby until the race starts, then stops polling', async () => {
    signIn(true); vi.useFakeTimers()
    const seq = [view(), view(), view({ status: 'running', start_at: Date.now() + 4000 })]
    let n = 0
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ now: Date.now(), match: seq[Math.min(n++, 2)] }), { status: 200 })))
    const m = await import('../src/platform/match')
    const seen: string[] = []
    m.watchLobby('m1', (v) => seen.push(v.status))
    await vi.advanceTimersByTimeAsync(5000)
    expect(seen).toEqual(['inviting', 'inviting', 'running']); expect(n).toBe(3)
    vi.useRealTimers()
  })

  it('sends snapshots at most every 400 ms and finishes by following the race to the end', async () => {
    signIn(true)
    const ops: string[] = []
    const done = view({ status: 'done', winner: 'me' })
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: any) => { const b = JSON.parse(init.body); ops.push(b.op); return new Response(JSON.stringify({ now: Date.now(), match: b.op === 'lobby' || b.op === 'finish' ? (b.op === 'finish' ? view({ status: 'running' }) : done) : view({ status: 'running' }) }), { status: 200 }) }))
    const m = await import('../src/platform/match')
    const link = new m.RaceLink(view({ status: 'running' }), 'me')
    expect(await link.tick(snap(1, 1), 1000)).toBe(true)
    expect(await link.tick(snap(2, 2), 1200)).toBe(false)
    expect(await link.tick(snap(3, 3), 1500)).toBe(true)
    const v = await link.finish(100, 50, () => {}, 5000)
    expect(v.status).toBe('done'); expect(ops).toEqual(['state', 'state', 'finish', 'lobby'])
    expect(await link.tick(snap(4, 4), 9000)).toBe(false) // finished: no more snapshots
  })
})
