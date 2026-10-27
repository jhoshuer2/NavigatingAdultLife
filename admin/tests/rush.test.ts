import { beforeAll, describe, expect, it } from 'vitest'
import { handleAccount } from '../server/account'
import { handleRush } from '../server/rush'
import { freshDb } from './helpers'
import type { Db } from '../server/db'
import { ACTIVE_SECS, COUNTDOWN_SECS, INVITE_SECS, WIN_POINTS } from '../../shared/rush'

beforeAll(() => { process.env.ACCOUNT_SECRET = 'test-secret'; process.env.GAME_ORIGINS = 'https://game.example' })

let ipn = 0, T = 1_800_000_000_000 // a controllable server clock
const clock = () => T
const hdr = (token?: string) => { const h = new Headers({ 'content-type': 'application/json', origin: 'https://game.example', 'x-forwarded-for': `10.1.0.${++ipn}` }); if (token) h.set('authorization', `Bearer ${token}`); return h }
async function acct(db: Db, body: unknown, token?: string) {
  const res = await handleAccount(new Request('https://api.example/api/account', { method: 'POST', headers: hdr(token), body: JSON.stringify(body) }), db)
  return (await res.json()) as Record<string, any>
}
async function rush(db: Db, token: string, body: unknown) {
  const res = await handleRush(new Request('https://api.example/api/rush', { method: 'POST', headers: hdr(token), body: JSON.stringify(body) }), db, clock)
  return { status: res.status, body: (await res.json()) as Record<string, any> }
}
async function player(db: Db, name: string, mp = true) {
  const c = await acct(db, { op: 'create', name, age_band: '18plus' })
  if (mp) await acct(db, { op: 'update', mp_enabled: true }, c.token)
  return { token: c.token as string, id: c.account.id as string, label: c.account.label as string }
}
const snap = (score: number, dist = 100, over = false) => ({ dist, lane: 0, y: 0, slide: 0, score, hearts: 3, over, t: 10 })

describe('rush races', () => {
  it('requires a signed-in account with online play on', async () => {
    const db = await freshDb()
    const off = await player(db, 'Offline', false)
    expect((await rush(db, 'nope', { op: 'ping' })).status).toBe(401)
    expect((await rush(db, off.token, { op: 'ping' })).body.error).toBe('mp_off')
    const on = await player(db, 'Online')
    const r = await rush(db, on.token, { op: 'ping' })
    expect(r.status).toBe(200); expect(r.body.invites).toEqual([]); expect(r.body.now).toBe(T)
  })

  it('invites only players who are active right now with online play on', async () => {
    const db = await freshDb()
    const host = await player(db, 'Host'), live = await player(db, 'Live'), stale = await player(db, 'Stale'), off = await player(db, 'Off', false)
    await rush(db, live.token, { op: 'ping' }) // seen now
    T += (ACTIVE_SECS + 5) * 1000 // stale last pinged long ago, live pings again just now
    await rush(db, live.token, { op: 'ping' })
    void stale; void off
    const c = await rush(db, host.token, { op: 'challenge', secs: 90 })
    expect(c.status).toBe(200)
    expect(c.body.match.invited).toBe(1)
    expect(c.body.match.players.map((p: any) => p.id).sort()).toEqual([host.id, live.id].sort())
    const inv = await rush(db, live.token, { op: 'ping' })
    expect(inv.body.invites).toHaveLength(1); expect(inv.body.invites[0].from).toBe(host.label); expect(inv.body.invites[0].left_ms).toBeGreaterThan(0)
    expect((await rush(db, stale.token, { op: 'ping' })).body.invites).toHaveLength(0) // not invited: it had gone quiet before the challenge
  })

  it('ends with no takers when the window closes unanswered, so the host can race Alfred', async () => {
    const db = await freshDb()
    const host = await player(db, 'Host2'), a = await player(db, 'Ann')
    await rush(db, a.token, { op: 'ping' })
    const c = await rush(db, host.token, { op: 'challenge', secs: 60 })
    expect((await rush(db, host.token, { op: 'lobby', match: c.body.match.id })).body.match.status).toBe('inviting')
    T += (INVITE_SECS + 1) * 1000
    const l = await rush(db, host.token, { op: 'lobby', match: c.body.match.id })
    expect(l.body.match.status).toBe('no_takers')
    expect((await rush(db, a.token, { op: 'ping' })).body.invites).toHaveLength(0)
  })

  it('ends at once when nobody is around to ask, and when everyone declines', async () => {
    const db = await freshDb()
    const host = await player(db, 'Lonely')
    const c = await rush(db, host.token, { op: 'challenge', secs: 60 })
    expect(c.body.match.status).toBe('no_takers'); expect(c.body.match.invited).toBe(0)
    const a = await player(db, 'Decliner'); await rush(db, a.token, { op: 'ping' })
    const c2 = await rush(db, host.token, { op: 'challenge', secs: 60 })
    expect(c2.body.match.status).toBe('inviting')
    const r = await rush(db, a.token, { op: 'respond', match: c2.body.match.id, accept: false })
    expect(r.body.match.status).toBe('no_takers')
  })

  it('lets several players accept, shares one seed and ranks the race; only the winner gets points', async () => {
    const db = await freshDb()
    const host = await player(db, 'Hosty'), b = await player(db, 'Bola'), c = await player(db, 'Chidi'), d = await player(db, 'Dami')
    for (const p of [b, c, d]) await rush(db, p.token, { op: 'ping' })
    const ch = await rush(db, host.token, { op: 'challenge', secs: 90 })
    const id = ch.body.match.id as string
    expect(ch.body.match.invited).toBe(3)
    expect((await rush(db, b.token, { op: 'respond', match: id, accept: true })).body.match.status).toBe('inviting')
    await rush(db, c.token, { op: 'respond', match: id, accept: true })
    await rush(db, d.token, { op: 'respond', match: id, accept: false }) // everyone has answered: the race starts straight away
    const lobby = (await rush(db, host.token, { op: 'lobby', match: id })).body.match
    expect(lobby.status).toBe('running'); expect(lobby.start_at).toBe(T + COUNTDOWN_SECS * 1000)
    const seeds = await Promise.all([host, b, c].map(async (p) => (await rush(db, p.token, { op: 'lobby', match: id })).body.match.seed))
    expect(new Set(seeds).size).toBe(1)
    expect(lobby.players.find((p: any) => p.id === d.id).status).toBe('declined')
    expect((await rush(db, d.token, { op: 'finish', match: id, score: 100, dist: 100 })).body.match.players.find((p: any) => p.id === d.id).status).toBe('declined')

    T += (COUNTDOWN_SECS + 2) * 1000
    await rush(db, b.token, { op: 'state', match: id, snap: snap(400) }); await rush(db, c.token, { op: 'state', match: id, snap: snap(100) })
    const s = await rush(db, host.token, { op: 'state', match: id, snap: snap(500) })
    expect(s.body.match.players.find((p: any) => p.id === host.id).snap.score).toBe(500)
    expect(s.body.match.players.find((p: any) => p.id === d.id).snap).toBeNull()
    T += 8000
    await rush(db, host.token, { op: 'finish', match: id, score: 900, dist: 700 })
    await rush(db, b.token, { op: 'finish', match: id, score: 1200, dist: 800 })
    const last = await rush(db, c.token, { op: 'finish', match: id, score: 300, dist: 200 })
    expect(last.body.match.status).toBe('done'); expect(last.body.match.winner).toBe(b.id)
    expect(last.body.match.players.filter((p: any) => p.rank !== null).map((p: any) => [p.label, p.rank]).sort()).toEqual([[b.label, 1], [host.label, 2], [c.label, 3]].sort())

    const board = (await rush(db, host.token, { op: 'board' })).body
    expect(board.board[0]).toMatchObject({ label: b.label, points: WIN_POINTS, wins: 1, plays: 1, best_dist: 800 })
    expect(board.board.find((r: any) => r.label === host.label)).toMatchObject({ points: 0, plays: 1 })
    expect(board.board.find((r: any) => r.label === d.label)).toBeUndefined() // declined: not a player
    expect(board.me).toMatchObject({ label: host.label, rank: 2 })
  })

  it('scores a draw as no win and counts a silent runner as dropped on their last snapshot', async () => {
    const db = await freshDb()
    const h = await player(db, 'DrawA'), o = await player(db, 'DrawB'), ghost = await player(db, 'DrawC')
    for (const p of [o, ghost]) await rush(db, p.token, { op: 'ping' })
    const ch = await rush(db, h.token, { op: 'challenge', secs: 60 }); const id = ch.body.match.id
    await rush(db, o.token, { op: 'respond', match: id, accept: true }); await rush(db, ghost.token, { op: 'respond', match: id, accept: true })
    T += (COUNTDOWN_SECS + 5) * 1000
    await rush(db, ghost.token, { op: 'state', match: id, snap: snap(50) })
    await rush(db, h.token, { op: 'finish', match: id, score: 400, dist: 300 })
    T += 12_000 // the ghost stops sending
    const r = await rush(db, o.token, { op: 'finish', match: id, score: 400, dist: 300 })
    expect(r.body.match.status).toBe('done'); expect(r.body.match.winner).toBeNull()
    expect(r.body.match.players.find((p: any) => p.id === ghost.id)).toMatchObject({ status: 'dropped', rank: 3, score: 50 })
    const board = (await rush(db, h.token, { op: 'board' })).body.board
    expect(board.every((x: any) => x.points === 0 || ![h.label, o.label].includes(x.label))).toBe(true)
  })

  it('rejects forged scores and snapshots, late answers and strangers', async () => {
    const db = await freshDb()
    const h = await player(db, 'Forger'), o = await player(db, 'Honest'), x = await player(db, 'Stranger')
    await rush(db, o.token, { op: 'ping' }); await rush(db, x.token, { op: 'ping' })
    const ch = await rush(db, h.token, { op: 'challenge', secs: 60 }); const id = ch.body.match.id
    await rush(db, o.token, { op: 'respond', match: id, accept: true }); await rush(db, x.token, { op: 'respond', match: id, accept: false })
    T += (COUNTDOWN_SECS + 5) * 1000
    expect((await rush(db, h.token, { op: 'state', match: id, snap: snap(9_000_000, 90000) })).status).toBe(400)
    expect((await rush(db, h.token, { op: 'finish', match: id, score: 9_000_000, dist: 50000 })).status).toBe(400)
    expect((await rush(db, o.token, { op: 'respond', match: id, accept: true })).status).toBe(409) // already answered
    const other = await player(db, 'Outsider')
    expect((await rush(db, other.token, { op: 'lobby', match: id })).status).toBe(404)
    expect((await rush(db, h.token, { op: 'lobby', match: '00000000-0000-4000-8000-000000000000' })).status).toBe(404)
    expect((await rush(db, h.token, { op: 'finish', match: id, score: 'lots', dist: 1 })).status).toBe(400)
  })

  it('does not invite a player who is already racing, and an answer after the window is closed', async () => {
    const db = await freshDb()
    const a = await player(db, 'RacerA'), b = await player(db, 'RacerB'), c = await player(db, 'RacerC'), d = await player(db, 'RacerD')
    await rush(db, b.token, { op: 'ping' }); await rush(db, c.token, { op: 'ping' }); await rush(db, d.token, { op: 'ping' })
    const m1 = (await rush(db, a.token, { op: 'challenge', secs: 60 })).body.match.id
    await rush(db, b.token, { op: 'respond', match: m1, accept: true }) // b is now in a race
    const second = await rush(db, c.token, { op: 'challenge', secs: 60 })
    expect(second.body.match.players.some((p: any) => p.id === b.id)).toBe(false)
    T += (INVITE_SECS + 1) * 1000
    expect((await rush(db, d.token, { op: 'respond', match: m1, accept: true })).status).toBe(409)
  })

  it('deleting an account removes its race rows, and old races are purged', async () => {
    const db = await freshDb()
    const a = await player(db, 'GoneA'), b = await player(db, 'GoneB')
    await rush(db, b.token, { op: 'ping' })
    const id = (await rush(db, a.token, { op: 'challenge', secs: 60 })).body.match.id
    await rush(db, b.token, { op: 'respond', match: id, accept: true })
    await acct(db, { op: 'delete' }, a.token)
    expect((await db.query('SELECT 1 FROM rush_matches')).rows).toHaveLength(0)
    expect((await db.query('SELECT 1 FROM rush_players')).rows).toHaveLength(0)
  })
})
