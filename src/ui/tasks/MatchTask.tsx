// A 3-a-side street football match on the pitch: find a team, then play. Joystick to move, Pass and Shoot buttons.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import type { Rect } from '../../world/layout'
import { audio } from '@platform/audio'

interface Team { id: string; name: string; skill: number; stars: string; blurb: string; mates: [string, string] }
const TEAMS: Team[] = [
  { id: 'a', name: 'Compound Boys', skill: 0.8, stars: '⭐', blurb: 'Friendly, short of one player. Easy game.', mates: ['Dayo', 'Chidi'] },
  { id: 'b', name: 'Estate FC', skill: 1.0, stars: '⭐⭐', blurb: 'A balanced side looking for a third.', mates: ['Musa', 'Ifeanyi'] },
  { id: 'c', name: 'Danfo Dribblers', skill: 1.2, stars: '⭐⭐⭐', blurb: 'Fast and loud. They play to win.', mates: ['Tunde', 'Emeka'] },
]
const OPP_NAMES = ['Bright', 'Sule', 'Kola']
const MATCH_SECONDS = typeof location !== 'undefined' && location.search.includes('fastmatch=1') ? 18 : 80 // the debug flag only shortens test runs

interface P { id: string; team: 0 | 1; x: number; z: number; fx: number; fz: number; cd: number; think: number; me?: boolean; speed: number }

export function MatchTask({ r, pitch, actAs, onDone }: { r: WorldRenderer; pitch: Rect; actAs: string; onDone: (perf: number) => void }) {
  const cx = (pitch.x0 + pitch.x1) / 2, cz = (pitch.z0 + pitch.z1) / 2
  const [phase, setPhase] = useState<'lobby' | 'play' | 'end'>('lobby')
  const [team, setTeam] = useState<Team | null>(null)
  const [score, setScore] = useState<[number, number]>([0, 0])
  const [clock, setClock] = useState(0)
  const [msg, setMsg] = useState('')
  const [mine, setMine] = useState(0)
  const kickRef = useRef<((k: 'shoot' | 'pass') => void) | null>(null)
  const alive = useRef(true)

  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  useEffect(() => {
    if (phase !== 'play' || !team) return
    const x0 = pitch.x0 + 0.8, x1 = pitch.x1 - 0.8, z0 = pitch.z0 + 0.8, z1 = pitch.z1 - 0.8
    const goalHalf = 1.7
    r.setCameraOverride({ pos: [cx, 25, cz + 15], look: [cx, 0, cz + 0.5] })
    const mk = (id: string, name: string, t: 0 | 1, x: number, z: number, speed: number) => {
      r.addActor(id, { name, gender: 'male', x, z, heading: t === 0 ? Math.PI / 2 : -Math.PI / 2, top: t === 0 ? '#1d6fd1' : '#d62828' }); r.lockActor(id, true)
      return { id, team: t, x, z, fx: t === 0 ? 1 : -1, fz: 0, cd: 0, think: Math.random(), speed } as P
    }
    const skill = team.skill
    const players: P[] = [
      { id: 'me', team: 0, x: cx - 1.2, z: cz, fx: 1, fz: 0, cd: 0, think: 0, me: true, speed: 5.6 },
      mk('tm1', team.mates[0], 0, cx - 4.5, cz - 3, 3.8), mk('tm2', team.mates[1], 0, cx - 4.5, cz + 3, 3.8),
      mk('op1', OPP_NAMES[0], 1, cx + 1.2, cz, 3.1 * skill), mk('op2', OPP_NAMES[1], 1, cx + 4.5, cz - 3, 3.1 * skill), mk('op3', OPP_NAMES[2], 1, cx + 4.5, cz + 3, 3.1 * skill),
    ]
    const byId = (id: string) => players.find((p) => p.id === id)!
    const ball = { x: cx, z: cz, vx: 0, vz: 0, owner: null as string | null, last: null as string | null }
    r.placePlayer(cx - 1.2, cz, Math.PI / 2)
    r.setBall({ x: ball.x, y: 0, z: ball.z })
    let sc: [number, number] = [0, 0], myGoals = 0, t = 0, pause = 1.2, raf = 0, last = performance.now(), ended = false, lastHud = 0
    let prevMe = { x: cx - 1.2, z: cz }
    const reset = (kickTeam: 0 | 1) => {
      players[0].x = cx - 1.2; players[0].z = cz; r.placePlayer(cx - 1.2, cz, Math.PI / 2)
      const set = (id: string, x: number, z: number) => { const p = byId(id); p.x = x; p.z = z; p.cd = 0 }
      set('tm1', cx - 4.5, cz - 3); set('tm2', cx - 4.5, cz + 3); set('op1', cx + 1.2, cz); set('op2', cx + 4.5, cz - 3); set('op3', cx + 4.5, cz + 3)
      ball.x = cx; ball.z = cz; ball.vx = ball.vz = 0; ball.owner = null; pause = 1.6
      void kickTeam
    }
    const kick = (p: P, tx: number, tz: number, power: number) => {
      const dx = tx - ball.x, dz = tz - ball.z, d = Math.hypot(dx, dz) || 1
      ball.vx = (dx / d) * power; ball.vz = (dz / d) * power; ball.owner = null; ball.last = p.id; p.cd = 0.55
    }
    const goalX = (team_: 0 | 1) => (team_ === 0 ? x1 + 0.5 : x0 - 0.5)
    const doShoot = (p: P) => { const gx = goalX(p.team); const spread = p.me ? 1.5 : 2.4 / (p.team === 1 ? skill : 1); kick(p, gx, cz + (Math.random() - 0.5) * 2 * spread, 15) }
    const doPass = (p: P) => {
      const mates = players.filter((q) => q.team === p.team && q.id !== p.id)
      const ahead = mates.filter((q) => (q.x - p.x) * (p.team === 0 ? 1 : -1) > -1).sort((a, b) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z))
      const q = (ahead[0] ?? mates[0]); kick(p, q.x + q.fx * 1.2, q.z + q.fz * 1.2, 11)
    }
    kickRef.current = (k) => { const me = players[0]; if (ball.owner !== 'me') return; if (k === 'shoot') doShoot(me); else doPass(me) }
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key.toLowerCase() === 'z') { e.preventDefault(); kickRef.current?.('shoot') } if (e.key.toLowerCase() === 'x') kickRef.current?.('pass') }
    window.addEventListener('keydown', onKey)

    const move = (p: P, tx: number, tz: number, sp: number, dt: number) => {
      const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz)
      if (d < 0.2) return
      const m = Math.min(d, sp * dt); p.x += (dx / d) * m; p.z += (dz / d) * m; p.fx = dx / d; p.fz = dz / d
      p.x = Math.max(x0, Math.min(x1, p.x)); p.z = Math.max(z0, Math.min(z1, p.z))
    }
    const keeperId = (t_: 0 | 1) => (t_ === 0 ? 'tm1' : 'op1')
    const think = (p: P, dt: number) => {
      if (p.me) return
      // the rearmost player of each side keeps goal: guard the line and catch shots
      if (p.id === keeperId(p.team) && ball.owner !== p.id) {
        const gx = goalX(p.team === 0 ? 1 : 0) // own goal is the opposite end
        const lineX = p.team === 0 ? x0 + 0.6 : x1 - 0.6
        void gx
        const tz = Math.max(cz - 1.5, Math.min(cz + 1.5, ball.z))
        move(p, lineX + (p.team === 0 ? 0.6 : -0.6), tz, p.speed * 1.6, dt)
        if (!ball.owner && p.cd <= 0 && Math.hypot(p.x - ball.x, p.z - ball.z) < 1.4 && Math.hypot(ball.vx, ball.vz) < 20 && Math.random() < 0.7) ball.owner = p.id
        else if (ball.owner && ball.owner !== p.id && Math.hypot(p.x - ball.x, p.z - ball.z) < 1.4 && byId(ball.owner).team !== p.team && Math.random() < dt * 2.5) ball.owner = p.id
        return
      }
      const own = ball.owner ? byId(ball.owner) : null
      const attackX = goalX(p.team), ownGoal = goalX(p.team === 0 ? 1 : 0)
      const tm = players.filter((q) => q.team === p.team && !q.me)
      const closest = [...tm].sort((a, b) => Math.hypot(a.x - ball.x, a.z - ball.z) - Math.hypot(b.x - ball.x, b.z - ball.z))[0]
      if (own?.id === p.id) {
        p.think -= dt
        const toGoal = Math.abs(attackX - p.x)
        if (p.think <= 0) { p.think = 0.5 + Math.random() * 0.5; if (toGoal < 9 && Math.random() < 0.7) { doShoot(p); return } if (Math.random() < 0.3) { doPass(p); return } }
        move(p, attackX, cz + (p.z < cz ? -1 : 1) * 1.5, p.speed * 0.92, dt)
      } else if (own && own.team === p.team) {
        const side = p.id.endsWith('2') ? -1 : 1
        move(p, own.x + (p.team === 0 ? 4 : -4), cz + side * 3.2, p.speed * 0.85, dt)
      } else if (closest.id === p.id || !own) {
        move(p, ball.x, ball.z, p.speed, dt)
      } else {
        const gx = ownGoal + (p.team === 0 ? 3.5 : -3.5)
        move(p, (ball.x + gx) / 2, (ball.z + cz) / 2, p.speed * 0.8, dt)
      }
    }

    const loop = (now: number) => {
      if (!alive.current || ended) return
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const me = players[0]
      const rp = r.position
      me.x = Math.max(x0, Math.min(x1, rp.x)); me.z = Math.max(z0, Math.min(z1, rp.z))
      if (me.x !== rp.x || me.z !== rp.z) r.placePlayer(me.x, me.z)
      const mvx = me.x - prevMe.x, mvz = me.z - prevMe.z
      if (Math.hypot(mvx, mvz) > 0.01) { const l = Math.hypot(mvx, mvz); me.fx = mvx / l; me.fz = mvz / l }
      prevMe = { x: me.x, z: me.z }
      if (pause > 0) pause -= dt
      else {
        t += dt
        for (const p of players) { p.cd = Math.max(0, p.cd - dt); think(p, dt) }
        // ball
        if (ball.owner) { const o = byId(ball.owner); ball.x = o.x + o.fx * 0.9; ball.z = o.z + o.fz * 0.9; ball.vx = ball.vz = 0 }
        else {
          ball.x += ball.vx * dt; ball.z += ball.vz * dt
          const damp = Math.pow(0.32, dt); ball.vx *= damp; ball.vz *= damp
          if (ball.z < z0 - 0.3) { ball.z = z0 - 0.3; ball.vz = Math.abs(ball.vz) * 0.7 }
          if (ball.z > z1 + 0.3) { ball.z = z1 + 0.3; ball.vz = -Math.abs(ball.vz) * 0.7 }
          const inMouth = Math.abs(ball.z - cz) < goalHalf
          for (const side of [0, 1] as const) {
            const gx = goalX(side)
            if ((side === 0 && ball.x > x1 + 0.2) || (side === 1 && ball.x < x0 - 0.2)) {
              if (inMouth) {
                sc = side === 0 ? [sc[0] + 1, sc[1]] : [sc[0], sc[1] + 1]; setScore([...sc] as [number, number])
                if (side === 0 && ball.last === 'me') { myGoals++; setMine(myGoals) }
                setMsg(side === 0 ? '⚽ GOAL! Your team scores!' : '😬 They scored…'); audio.sfx(side === 0 ? 'good' : 'bad')
                r.say(side === 0 ? (ball.last === 'me' ? 'player' : 'tm1') : 'op1', side === 0 ? 'GOAAAL! 🔥' : 'Yes!!', 2); reset(side === 0 ? 1 : 0)
              } else { ball.x = gx > cx ? x1 : x0; ball.vx = -ball.vx * 0.5 }
            }
          }
          for (const p of players) {
            if (p.cd > 0) continue
            if (Math.hypot(p.x - ball.x, p.z - ball.z) < 0.95 && Math.hypot(ball.vx, ball.vz) < 13) { ball.owner = p.id; break }
          }
        }
        // tackles: get close to the player with the ball
        if (ball.owner) {
          const o = byId(ball.owner)
          for (const p of players) if (p.team !== o.team && p.cd <= 0 && Math.hypot(p.x - o.x, p.z - o.z) < 1.0 && Math.random() < dt * (p.me ? 3.2 : 1.1)) { ball.owner = p.id; o.cd = 0.5; break }
        }
        if (t >= MATCH_SECONDS) { ended = true; r.setBall(null); setPhase('end'); return }
      }
      // draw actors
      for (const p of players) {
        if (p.me) continue
        const g = r.actorGroup(p.id); if (g) { g.position.x = p.x; g.position.z = p.z; g.rotation.y = Math.atan2(p.fx, p.fz) }
      }
      r.setBall({ x: ball.x, y: 0, z: ball.z })
      if (now - lastHud > 200) { lastHud = now; setClock(Math.min(90, Math.round((t / MATCH_SECONDS) * 90))) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); kickRef.current = null; for (const id of ['tm1', 'tm2', 'op1', 'op2', 'op3']) r.removeActor(id); r.setBall(null); r.setCameraOverride(null) }
  }, [phase, team])

  const result = score[0] > score[1] ? 'win' : score[0] === score[1] ? 'draw' : 'loss'
  const perf = Math.min(1, 0.3 + (result === 'win' ? 0.45 : result === 'draw' ? 0.25 : 0) + 0.25 * Math.min(1, mine / 2))
  return (
    <>
      {phase === 'lobby' && (
        <div className="absolute inset-x-0 bottom-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl pop" style={{ background: '#14121ff5', borderTop: '2px solid #ffffff22' }}>
          <div className="font-display text-2xl text-danfo">⚽ Find a team</div>
          <div className="text-xs opacity-75 mb-2">Three-a-side. Pick a squad that needs a player, then play 90 minutes (fast).</div>
          <div className="grid gap-2">{TEAMS.map((tm) => <button key={tm.id} className="card-btn" onClick={() => { setTeam(tm); setPhase('play'); r.say('player', `I am in, ${tm.name}!`, 2) }}><div className="flex justify-between"><b>{tm.name}</b><span className="chip">{tm.stars}</span></div><div className="text-xs opacity-75">{tm.blurb} Teammates: {tm.mates.join(' and ')}</div></button>)}</div>
          <button className="btn w-full mt-2" onClick={() => onDone(-1)}>Not now</button>
        </div>
      )}
      {phase === 'play' && (
        <>
          <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
            <div className="card px-3 py-2 flex items-center justify-between" style={{ background: '#1e1a30ee' }}>
              <span className="font-display text-xl text-danfo">{team?.name}</span>
              <span className="font-display text-3xl">{score[0]} – {score[1]}</span>
              <span className="font-black text-sm">{clock}'</span>
            </div>
            {msg && <div className="card mt-1.5 px-3 py-2 text-sm font-bold pop" style={{ background: '#241f38f2' }} key={msg + score.join()}>{msg}</div>}
          </div>
          <div className="absolute right-4 bottom-6 z-30 flex flex-col gap-2 pointer-events-auto">
            <button className="btn btn-primary !min-h-14 !text-lg touch-none" onPointerDown={() => kickRef.current?.('shoot')}>⚽ Shoot</button>
            <button className="btn !min-h-12 touch-none" onPointerDown={() => kickRef.current?.('pass')}>↗ Pass</button>
          </div>
        </>
      )}
      {phase === 'end' && (
        <div className="absolute inset-x-0 bottom-0 z-30 px-4 pt-4 pb-5 safe-pad rounded-t-3xl pop" style={{ background: '#14121ff5', borderTop: '2px solid #ffffff22' }}>
          <div className="font-display text-3xl text-danfo">{result === 'win' ? 'You won!' : result === 'draw' ? 'A fair draw.' : 'Beaten this time.'}</div>
          <div className="text-sm opacity-80 mt-1">{score[0]} – {score[1]} with {team?.name}. You scored {mine}. {result === 'win' ? 'The whole pitch is chanting.' : 'Run it back tomorrow.'}</div>
          <button className="btn btn-primary w-full mt-3" onClick={() => onDone(perf)}>Finish ▶</button>
        </div>
      )}
      <span className="hidden">{actAs}</span>
    </>
  )
}
