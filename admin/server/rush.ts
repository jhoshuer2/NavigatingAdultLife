// Live Rush races API: presence, challenges to every active player, accept/decline, race snapshots, results and the global board.
// One POST endpoint like /api/account (same Bearer token and CORS). Vercel cannot hold websockets, so clients poll; the match state machine
// below advances lazily on every call, so no cron or background worker is needed.
import { randomInt, randomUUID } from 'node:crypto'
import {
  ACTIVE_SECS, COUNTDOWN_SECS, DROP_SECS, INVITE_SECS, MAX_INVITEES, RushRequest, WIN_POINTS,
  type BoardRow, type MatchPlayer, type MatchStatus, type MatchView, type PlayerStatus, type RushError, type RushResponse, type SnapshotT,
} from '../../shared/rush'
import { accountCors, load, throttle, type Row } from './account'
import { getDb, type Db } from './db'
import { json, readJson } from './http'

const STATUS: Record<RushError, number> = { bad_request: 400, unauthorized: 401, mp_off: 403, rate_limited: 429, not_found: 404, closed: 409, server: 500 }
const fail = (e: RushError, cors: Record<string, string>) => json({ error: e } satisfies RushResponse, STATUS[e], cors)

/** What a believable run looks like, per second of race time: used to reject forged snapshots and scores (the road tops out near 70 m/s). */
const MAX_DIST_PER_SEC = 80, MAX_SCORE_PER_SEC = 400, GRACE_SECS = 15

const iso = (ms: number) => new Date(ms).toISOString()
const at = (d: Date | string | null | undefined) => (d ? new Date(d).getTime() : null)

interface MatchRow { match_id: string; host_id: string; seed: number; secs: number; status: MatchStatus; invite_until: Date | string; start_at: Date | string | null }
interface PlayerRow { match_id: string; account_id: string; status: PlayerStatus; snap: SnapshotT | null; snap_at: Date | string | null; score: number; dist: number; rank: number | null; name: string; tag: number }

const label = (p: { name: string; tag: number }) => `${p.name}#${p.tag}`

async function playersOf(db: Db, matchId: string): Promise<PlayerRow[]> {
  return (await db.query<PlayerRow>(
    'SELECT p.*, a.name, a.tag FROM rush_players p JOIN accounts a ON a.account_id = p.account_id WHERE p.match_id=$1 ORDER BY a.name', [matchId],
  )).rows
}

/** Move a race along: invitations close, the race starts, silent runners drop out and finished races are ranked and scored. Safe to call any time. */
async function advance(db: Db, matchId: string, now: number): Promise<void> {
  const m = (await db.query<MatchRow>('SELECT * FROM rush_matches WHERE match_id=$1', [matchId])).rows[0]
  if (!m) return
  let players = await playersOf(db, matchId)
  if (m.status === 'inviting') {
    const others = players.filter((p) => p.account_id !== m.host_id)
    const accepted = others.filter((p) => p.status === 'accepted').length
    const waiting = others.filter((p) => p.status === 'invited').length
    if (now >= at(m.invite_until)! || waiting === 0) {
      if (accepted === 0) await db.query("UPDATE rush_matches SET status='no_takers', finished_at=$2 WHERE match_id=$1 AND status='inviting'", [matchId, iso(now)])
      else {
        const go = await db.query("UPDATE rush_matches SET status='running', start_at=$2 WHERE match_id=$1 AND status='inviting' RETURNING match_id", [matchId, iso(now + COUNTDOWN_SECS * 1000)])
        if (go.rowCount) await db.query("UPDATE rush_players SET status='declined' WHERE match_id=$1 AND status='invited'", [matchId]) // never answered: not racing
      }
    }
    return
  }
  if (m.status !== 'running') return
  const start = at(m.start_at)!
  for (const p of players) {
    if (p.status !== 'accepted') continue
    const last = Math.max(at(p.snap_at) ?? start, start)
    if (now > last + DROP_SECS * 1000) await db.query("UPDATE rush_players SET status='dropped' WHERE match_id=$1 AND account_id=$2 AND status='accepted'", [matchId, p.account_id])
  }
  players = await playersOf(db, matchId)
  const racing = players.filter((p) => p.status === 'accepted').length
  const deadline = start + (m.secs + GRACE_SECS) * 1000
  if (racing > 0 && now <= deadline) return
  await finalize(db, matchId, now)
}

async function finalize(db: Db, matchId: string, now: number): Promise<void> {
  await db.tx(async (t) => {
    const done = await t.query("UPDATE rush_matches SET status='done', finished_at=$2 WHERE match_id=$1 AND status='running' RETURNING match_id", [matchId, iso(now)])
    if (!done.rowCount) return // another request already finished it
    await t.query("UPDATE rush_players SET status='dropped' WHERE match_id=$1 AND status='accepted'", [matchId])
    const rows = (await t.query<PlayerRow>("SELECT * FROM rush_players WHERE match_id=$1 AND status IN ('finished','dropped')", [matchId])).rows
    // a runner who dropped out is scored on their last snapshot
    const ran = rows.map((p) => ({ id: p.account_id, status: p.status, score: p.status === 'finished' ? p.score : p.snap?.score ?? p.score, dist: p.status === 'finished' ? p.dist : Math.round(p.snap?.dist ?? p.dist), had: p.status === 'finished' || !!p.snap }))
    const real = ran.filter((r) => r.had)
    real.sort((a, b) => b.score - a.score || b.dist - a.dist)
    const rankOf = (r: { score: number; dist: number }) => 1 + real.filter((o) => o.score > r.score || (o.score === r.score && o.dist > r.dist)).length
    for (const r of ran) await t.query('UPDATE rush_players SET score=$3, dist=$4, rank=$5 WHERE match_id=$1 AND account_id=$2', [matchId, r.id, r.score, r.dist, r.had ? rankOf(r) : null])
    const top = real.filter((r) => rankOf(r) === 1)
    const winner = real.length >= 2 && top.length === 1 ? top[0].id : null // a draw, or nobody left to race, scores no win
    for (const r of real) {
      const won = r.id === winner
      await t.query(
        `INSERT INTO rush_board (account_id, points, wins, plays, best_dist, updated_at) VALUES ($1,$2,$3,1,$4,$5)
         ON CONFLICT (account_id) DO UPDATE SET points = rush_board.points + $2, wins = rush_board.wins + $3, plays = rush_board.plays + 1, best_dist = GREATEST(rush_board.best_dist, $4), updated_at = $5`,
        [r.id, won ? WIN_POINTS : 0, won ? 1 : 0, r.dist, iso(now)],
      )
    }
  })
}

async function view(db: Db, matchId: string): Promise<MatchView | null> {
  const m = (await db.query<MatchRow>('SELECT * FROM rush_matches WHERE match_id=$1', [matchId])).rows[0]
  if (!m) return null
  const players = await playersOf(db, matchId)
  const host = players.find((p) => p.account_id === m.host_id)
  const showSnap = m.status === 'running' || m.status === 'done'
  const list: MatchPlayer[] = players.map((p) => ({
    id: p.account_id, label: label(p), score: p.snap && p.status !== 'finished' ? p.snap.score : p.score, dist: p.snap && p.status !== 'finished' ? Math.round(p.snap.dist) : p.dist,
    status: p.account_id === m.host_id && p.status === 'accepted' ? 'host' : p.status, rank: p.rank, snap: showSnap ? p.snap : null,
  }))
  const top = m.status === 'done' ? list.filter((p) => p.rank === 1) : []
  const racers = list.filter((p) => p.rank !== null).length
  return {
    id: m.match_id, status: m.status, seed: m.seed, secs: m.secs, host: host ? label(host) : '', invite_until: at(m.invite_until)!, start_at: at(m.start_at),
    invited: players.length - 1, winner: m.status === 'done' && racers >= 2 && top.length === 1 ? top[0].id : null, players: list,
  }
}

/** The caps a snapshot or final score must stay under, given how long the race has really been running. */
function plausible(m: MatchRow, now: number, dist: number, score: number): boolean {
  const elapsed = Math.min(m.secs + GRACE_SECS, Math.max(0, (now - (at(m.start_at) ?? now)) / 1000)) + 2
  return dist <= MAX_DIST_PER_SEC * elapsed && score <= MAX_SCORE_PER_SEC * elapsed + 2000
}

export async function handleRush(req: Request, injected?: Db, clock: () => number = Date.now): Promise<Response> {
  const cors = accountCors(req)
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: cors })
  const raw = await readJson(req)
  if (!raw.ok) return new Response(null, { status: raw.status, headers: cors })
  const parsed = RushRequest.safeParse(raw.body)
  if (!parsed.success) return fail('bad_request', cors)
  const q = parsed.data
  try {
    const db = injected ?? await getDb()
    const now = clock()
    const bearer = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '') || null
    const me: Row | null = await load(db, bearer)
    if (!me) return fail('unauthorized', cors)
    if (!me.mp_enabled) return fail('mp_off', cors)
    await db.query('UPDATE accounts SET last_seen=$2 WHERE account_id=$1', [me.account_id, iso(now)])
    const out = (extra: RushResponse = {}) => json({ now, ...extra } satisfies RushResponse, 200, cors)

    switch (q.op) {
      case 'ping': {
        const invites = (await db.query<{ match_id: string; rush_secs: number; invite_until: Date | string; name: string; tag: number }>(
          `SELECT m.match_id, m.secs AS rush_secs, m.invite_until, a.name, a.tag FROM rush_players p
             JOIN rush_matches m ON m.match_id = p.match_id JOIN accounts a ON a.account_id = m.host_id
            WHERE p.account_id=$1 AND p.status='invited' AND m.status='inviting' AND m.invite_until > $2 ORDER BY m.created_at DESC`, [me.account_id, iso(now)],
        )).rows.map((r) => ({ match: r.match_id, from: label(r), rush_secs: r.rush_secs, left_ms: at(r.invite_until)! - now }))
        return out({ invites })
      }

      case 'challenge': {
        if (!(await throttle(db, me.account_id, 'rush_challenge', 6, 60e3))) return fail('rate_limited', cors)
        await db.query("UPDATE rush_matches SET status='no_takers', finished_at=$2 WHERE host_id=$1 AND status='inviting'", [me.account_id, iso(now)]) // an older open challenge is replaced
        // everyone active in the game right now, who has switched online play on and is not already in a race
        const targets = (await db.query<{ account_id: string }>(
          `SELECT a.account_id FROM accounts a WHERE a.mp_enabled AND a.account_id <> $1 AND a.last_seen > $2
              AND NOT EXISTS (SELECT 1 FROM rush_players p JOIN rush_matches m ON m.match_id = p.match_id
                               WHERE p.account_id = a.account_id AND p.status = 'accepted' AND m.status IN ('inviting','running'))
            ORDER BY a.last_seen DESC LIMIT $3`, [me.account_id, iso(now - ACTIVE_SECS * 1000), MAX_INVITEES],
        )).rows
        const id = randomUUID()
        await db.tx(async (t) => {
          await t.query('INSERT INTO rush_matches (match_id, host_id, seed, secs, invite_until, created_at) VALUES ($1,$2,$3,$4,$5,$6)', [id, me.account_id, randomInt(1, 2 ** 31 - 1), q.secs, iso(now + INVITE_SECS * 1000), iso(now)])
          await t.query("INSERT INTO rush_players (match_id, account_id, status) VALUES ($1,$2,'accepted')", [id, me.account_id])
          for (const r of targets) await t.query("INSERT INTO rush_players (match_id, account_id, status) VALUES ($1,$2,'invited')", [id, r.account_id])
        })
        if (!targets.length) await advance(db, id, now) // nobody to ask: it ends straight away so the host can race Alfred
        return out({ match: (await view(db, id))! })
      }

      case 'respond': {
        const p = (await db.query<{ status: string; status_m: string; invite_until: Date | string }>(
          'SELECT p.status, m.status AS status_m, m.invite_until FROM rush_players p JOIN rush_matches m ON m.match_id = p.match_id WHERE p.match_id=$1 AND p.account_id=$2', [q.match, me.account_id],
        )).rows[0]
        if (!p) return fail('not_found', cors)
        if (p.status !== 'invited' || p.status_m !== 'inviting' || now >= at(p.invite_until)!) return fail('closed', cors)
        await db.query('UPDATE rush_players SET status=$3 WHERE match_id=$1 AND account_id=$2', [q.match, me.account_id, q.accept ? 'accepted' : 'declined'])
        await advance(db, q.match, now)
        return out({ match: (await view(db, q.match))! })
      }

      case 'lobby':
      case 'state':
      case 'finish':
      case 'leave': {
        const m = (await db.query<MatchRow>('SELECT * FROM rush_matches WHERE match_id=$1', [q.match])).rows[0]
        const p = m && (await db.query<{ status: PlayerStatus }>('SELECT status FROM rush_players WHERE match_id=$1 AND account_id=$2', [q.match, me.account_id])).rows[0]
        if (!m || !p) return fail('not_found', cors)
        if (q.op === 'state' && m.status === 'running' && p.status === 'accepted' && now >= at(m.start_at)! - 1000) {
          if (!plausible(m, now, q.snap.dist, q.snap.score)) return fail('bad_request', cors)
          await db.query("UPDATE rush_players SET snap=$3, snap_at=$4 WHERE match_id=$1 AND account_id=$2 AND status='accepted'", [q.match, me.account_id, JSON.stringify(q.snap), iso(now)])
        }
        if (q.op === 'finish' && m.status === 'running' && p.status === 'accepted') {
          if (!plausible(m, now, q.dist, q.score)) return fail('bad_request', cors)
          await db.query("UPDATE rush_players SET status='finished', score=$3, dist=$4, snap_at=$5 WHERE match_id=$1 AND account_id=$2 AND status='accepted'", [q.match, me.account_id, q.score, Math.round(q.dist), iso(now)])
        }
        if (q.op === 'leave' && (p.status === 'accepted' || p.status === 'invited') && m.status !== 'done') {
          if (m.status === 'inviting' && me.account_id === m.host_id) await db.query("UPDATE rush_matches SET status='no_takers', finished_at=$2 WHERE match_id=$1 AND status='inviting'", [q.match, iso(now)])
          else await db.query("UPDATE rush_players SET status = CASE WHEN status='invited' THEN 'declined' ELSE 'dropped' END WHERE match_id=$1 AND account_id=$2", [q.match, me.account_id])
        }
        await advance(db, q.match, now)
        return out({ match: (await view(db, q.match))! })
      }

      case 'board': {
        const rows = (await db.query<{ account_id: string; name: string; tag: number; points: number; wins: number; plays: number; best_dist: number }>(
          'SELECT b.*, a.name, a.tag FROM rush_board b JOIN accounts a ON a.account_id = b.account_id ORDER BY b.points DESC, b.wins DESC, b.best_dist DESC, a.name LIMIT 50',
        )).rows
        const board: BoardRow[] = rows.map((r) => ({ label: label(r), points: r.points, wins: r.wins, plays: r.plays, best_dist: r.best_dist, me: r.account_id === me.account_id || undefined }))
        const mine = (await db.query<{ points: number; wins: number; plays: number; best_dist: number; rank: number }>(
          `SELECT points, wins, plays, best_dist, 1 + (SELECT count(*)::int FROM rush_board o WHERE o.points > b.points OR (o.points = b.points AND o.wins > b.wins)) AS rank FROM rush_board b WHERE account_id=$1`, [me.account_id],
        )).rows[0]
        return out({ board, me: mine ? { label: `${me.name}#${me.tag}`, ...mine, me: true } : undefined })
      }
    }
  } catch (e) {
    console.error('rush failed', (e as Error).message)
    return fail('server', cors)
  }
  return fail('bad_request', cors)
}
