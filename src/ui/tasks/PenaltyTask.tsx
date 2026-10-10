// Penalty shootout on the street pitch: swipe to aim and shoot, the keeper dives.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import type { Rect } from '../../world/layout'
import { audio } from '@platform/audio'
import { keeperDive, resolveShot, shotFromSwipe } from './rules'

const KICKS = 5

export function PenaltyTask({ r, pitch, onDone }: { r: WorldRenderer; pitch: Rect; onDone: (perf: number) => void }) {
  const gx = pitch.x1 - 0.5, gz = (pitch.z0 + pitch.z1) / 2, spot = gx - 6.5
  const [kick, setKick] = useState(0)
  const [goals, setGoals] = useState(0)
  const [msg, setMsg] = useState('Swipe up to shoot. Left and right aims; a longer swipe is a harder, higher shot.')
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const raf = useRef(0)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    r.setFrozen(true)
    r.placePlayer(spot - 1.5, gz, Math.PI / 2)
    r.addActor('keeper', { name: 'Keeper', gender: 'male', x: gx - 0.8, z: gz, heading: -Math.PI / 2 })
    r.lockActor('keeper', true)
    const kg = r.actorGroup('keeper'); if (kg) { kg.position.set(gx - 0.8, 0, gz); kg.rotation.set(0, -Math.PI / 2, 0) }
    r.setBall({ x: spot, y: 0, z: gz })
    r.setCameraOverride({ pos: [spot - 11, 6.4, gz + 2.4], look: [gx - 1.5, 0.8, gz - 0.2] })
    return () => { alive.current = false; cancelAnimationFrame(raf.current); r.removeActor('keeper'); r.setBall(null); r.setCameraOverride(null); r.setFrozen(false) }
  }, [r])

  const shoot = (dx: number, dy: number) => {
    if (busy || over) return
    const { aim, power, ty } = shotFromSwipe(dx, dy)
    if (power < 0.18) { setMsg('Swipe upwards from the ball to shoot.'); return }
    setBusy(true)
    const tz = gz + aim
    const kg = r.actorGroup('keeper')!
    const dive = keeperDive(aim)
    const kz = gz + dive * 1.9
    const result = resolveShot(aim, ty, dive)
    const wide = result === 'wide', over_ = result === 'over', saved = result === 'saved'
    const t0 = performance.now(), T = 750
    audio.sfx('click')
    const loop = (now: number) => {
      if (!alive.current) return
      const t = Math.min(1, (now - t0) / T)
      const bz = gz + (tz - gz) * t, bx = spot + (gx - spot) * t
      const by = ty * t + Math.sin(Math.PI * t) * 0.9
      r.setBall({ x: bx, y: Math.max(0, by), z: bz })
      const kp = Math.min(1, t * 1.6)
      kg.position.z = gz + (kz - gz) * kp; kg.rotation.x = dive * 1.1 * kp; kg.position.y = Math.abs(dive) * 0.2 * kp
      if (t < 1) raf.current = requestAnimationFrame(loop)
      else {
        const goal = !wide && !over_ && !saved
        if (goal) { setGoals((g) => g + 1); setMsg('⚽ GOAL! The compound erupts!'); r.say('player', 'GOAAAL! 🔥', 2.6); audio.sfx('good') }
        else if (saved) { setMsg('🧤 Saved! The keeper read you.'); r.say('keeper', 'Not today, my friend!', 2.4); audio.sfx('bad') }
        else { setMsg(over_ ? '🚀 Over the bar! Shoot lower next time.' : '📐 Wide of the post.'); r.say('keeper', 'Ha! Wide!', 2.2); audio.sfx('bad') }
        setTimeout(() => {
          if (!alive.current) return
          setKick((k) => { const n = k + 1; if (n >= KICKS) setOver(true); return n })
          kg.position.set(gx - 0.8, 0, gz); kg.rotation.set(0, -Math.PI / 2, 0)
          r.setBall({ x: spot, y: 0, z: gz }); setBusy(false)
        }, 1300)
      }
    }
    raf.current = requestAnimationFrame(loop)
  }

  return (
    <>
      <div className="absolute inset-0 z-20 touch-none" style={{ touchAction: 'none' }}
        onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY } }}
        onPointerUp={(e) => { const d = drag.current; drag.current = null; if (d) shoot(e.clientX - d.x, e.clientY - d.y) }} />
      <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
        <div className="card px-3 py-2 flex items-center justify-between" style={{ background: '#1e1a30ee' }}>
          <b className="font-display text-2xl text-danfo">⚽ Penalty shootout</b>
          <span className="font-black">{goals} goals · kick {Math.min(kick + 1, KICKS)}/{KICKS}</span>
        </div>
        <div className="card mt-1.5 px-3 py-2 text-sm font-bold pop" style={{ background: '#241f38f2' }} key={msg}>{msg}</div>
      </div>
      {over && (
        <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pt-4 pb-5 safe-pad rounded-t-3xl pop" style={{ background: '#14121ff5', borderTop: '2px solid #ffffff22' }}>
          <div className="font-display text-3xl text-danfo">Full time!</div>
          <div className="text-sm opacity-80 mt-1">You scored {goals} out of {KICKS}. {goals >= 4 ? 'The whole street is chanting your name.' : goals >= 2 ? 'Not bad at all. Keep practising.' : 'Tough day. The keeper had your number.'}</div>
          <button className="btn btn-primary w-full mt-3" onClick={() => onDone(goals / KICKS)}>Finish ▶</button>
        </div>
      )}
      {!over && <button className="chip absolute z-30 left-3 bottom-4 pointer-events-auto" style={{ background: '#1e1a30ee' }} onClick={() => onDone(goals / Math.max(1, kick || KICKS))}>✖ Leave pitch</button>}
    </>
  )
}
