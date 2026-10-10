// A jog round the pitch: hit the numbered checkpoints in order, sprint with your stamina, dodge the goats.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import type { Rect } from '../../world/layout'
import { audio } from '@platform/audio'

const TIME = 32
const LAPS = 2
const NUMS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']

export function JogTask({ r, pitch, onDone }: { r: WorldRenderer; pitch: Rect; onDone: (perf: number) => void }) {
  const cx = (pitch.x0 + pitch.x1) / 2, cz = (pitch.z0 + pitch.z1) / 2
  const lap = [{ x: pitch.x1 - 2, z: pitch.z1 - 2 }, { x: pitch.x1 - 2, z: pitch.z0 + 2 }, { x: cx, z: pitch.z0 + 2.5 }, { x: pitch.x0 + 2, z: pitch.z0 + 2 }, { x: pitch.x0 + 2, z: pitch.z1 - 2 }]
  const pts = useRef(Array.from({ length: LAPS }, () => lap).flat()).current
  const [next, setNext] = useState(0)
  const [left, setLeft] = useState(TIME)
  const [stamina, setStamina] = useState(100)
  const [bumps, setBumps] = useState(0)
  const [msg, setMsg] = useState('Run two laps: follow the numbers 1️⃣ to 5️⃣, twice. Hold Sprint for speed, but it drains your stamina. Dodge the goats!')
  const nextRef = useRef(0), stam = useRef(100), sprint = useRef(false), stun = useRef(0), bumpsRef = useRef(0), over = useRef(false)

  useEffect(() => {
    r.placePlayer(cx, cz, 0)
    r.addMark('cp', pts[0].x, pts[0].z, NUMS[0])
    const goats = [{ id: 'g1', z: cz - 3.5, x: pitch.x0 + 2, d: 1, v: 3.4 }, { id: 'g2', z: cz + 0.5, x: pitch.x1 - 2, d: -1, v: 2.8 }, { id: 'g3', z: cz + 4.5, x: cx, d: 1, v: 3.9 }]
    goats.forEach((g) => r.addMark(g.id, g.x, g.z, '🐐'))
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      if (over.current) return
      const me = r.position
      for (const g of goats) {
        g.x += g.d * g.v * dt; if (g.x > pitch.x1 - 1.5) g.d = -1; if (g.x < pitch.x0 + 1.5) g.d = 1
        r.moveMark(g.id, g.x, g.z)
        if (stun.current <= 0 && Math.hypot(me.x - g.x, me.z - g.z) < 1.3) { stun.current = 1.1; bumpsRef.current++; setBumps(bumpsRef.current); r.say('player', 'Eh! Goat!', 1.2); audio.sfx('bad'); setMsg('🐐 A goat blocked you!') }
      }
      stun.current = Math.max(0, stun.current - dt)
      // stamina
      if (sprint.current && stam.current > 0 && stun.current <= 0) stam.current = Math.max(0, stam.current - 38 * dt); else stam.current = Math.min(100, stam.current + 14 * dt)
      r.speedMul = stun.current > 0 ? 0.25 : sprint.current && stam.current > 0 ? 1.7 : 1
      setStamina(Math.round(stam.current))
      // checkpoint
      const cp = pts[nextRef.current]
      if (cp && Math.hypot(me.x - cp.x, me.z - cp.z) < 1.8) {
        nextRef.current++; setNext(nextRef.current); audio.sfx('good')
        if (nextRef.current >= pts.length) { r.removeMark('cp'); over.current = true; setMsg('🏁 Lap complete!'); return }
        r.moveMark('cp', pts[nextRef.current].x, pts[nextRef.current].z); r.removeMark('cp'); r.addMark('cp', pts[nextRef.current].x, pts[nextRef.current].z, NUMS[nextRef.current % 5]); setMsg(`✅ Checkpoint ${nextRef.current}!`)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const tick = setInterval(() => setLeft((v) => v - 1), 1000)
    return () => { cancelAnimationFrame(raf); clearInterval(tick); r.speedMul = 1; r.clearMarks() }
  }, [r])

  useEffect(() => { if (left <= 0) over.current = true }, [left])
  const finished = over.current || left <= 0 || next >= pts.length
  const perf = Math.max(0, Math.min(1, (next / pts.length) * (0.6 + 0.4 * Math.max(0, left) / TIME) - bumps * 0.04))
  return (
    <>
      <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
        <div className="card px-3 py-2 flex items-center justify-between" style={{ background: '#1e1a30ee' }}>
          <b className="font-display text-2xl text-danfo">🏃 Jog</b>
          <span className="font-black text-sm">{Math.min(next + 1, pts.length)}/{pts.length} · ⏱ {Math.max(0, left)}s</span>
          {!finished && <button className="chip pointer-events-auto" onClick={() => onDone(perf)}>✖ Stop</button>}
        </div>
        <div className="card mt-1.5 px-3 py-2 text-sm font-bold" style={{ background: '#241f38f2' }} key={msg}>{msg}</div>
      </div>
      {!finished && (
        <div className="absolute right-4 bottom-8 z-30 w-28 pointer-events-auto text-center">
          <div className="bar mb-1.5"><i style={{ width: `${stamina}%`, background: stamina < 25 ? '#ff6b5e' : '#2fd27b' }} /></div>
          <button className="btn btn-primary w-full !min-h-16 !text-lg touch-none" style={{ touchAction: 'none' }} onPointerDown={() => { sprint.current = true }} onPointerUp={() => { sprint.current = false }} onPointerLeave={() => { sprint.current = false }} onPointerCancel={() => { sprint.current = false }}>⚡ Sprint</button>
        </div>
      )}
      {finished && (
        <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pt-4 pb-5 safe-pad rounded-t-3xl pop" style={{ background: '#14121ff5', borderTop: '2px solid #ffffff22' }}>
          <div className="font-display text-3xl text-danfo">{next >= pts.length ? 'Lap done!' : 'Time up!'}</div>
          <div className="text-sm opacity-80 mt-1">{next} of {pts.length} checkpoints{bumps ? `, ${bumps} goat bump${bumps > 1 ? 's' : ''}` : ', no goat bumps'}. {perf >= 0.75 ? 'Strong run. Your heart thanks you.' : perf >= 0.4 ? 'Good effort. Keep it up.' : 'Slow start. Next time, sprint early.'}</div>
          <button className="btn btn-primary w-full mt-3" onClick={() => onDone(perf)}>Finish ▶</button>
        </div>
      )}
    </>
  )
}
