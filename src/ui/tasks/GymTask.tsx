// Work out at the gym: walk to the treadmill, the weights or the mats, then tap to do reps while your character runs, lifts or stretches.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import { audio } from '@platform/audio'

type Mode = 'run' | 'lift' | 'stretch'
const SPOT: Record<Mode, { walk: [number, number]; at: [number, number]; face: number; cam: { pos: [number, number, number]; look: [number, number, number] }; icon: string; title: string; verb: string; rep: string; line: string }> = {
  run: { walk: [-5.4, -3.4], at: [-4.7, -5.5], face: 0, cam: { pos: [-1.6, 3.4, 0.4], look: [-4.7, 1.5, -5.4] }, icon: '🏃', title: 'On the treadmill', verb: 'Run', rep: 'Stride!', line: 'Let us go!' },
  lift: { walk: [5.5, -1.2], at: [5.5, -1.7], face: 0, cam: { pos: [8.6, 3.2, 3.2], look: [5.5, 1.4, -2.2] }, icon: '🏋️', title: 'Lifting weights', verb: 'Lift', rep: 'Curl!', line: 'Feel the burn!' },
  stretch: { walk: [-5.6, 3.2], at: [-5.6, 3.0], face: Math.PI, cam: { pos: [-1.8, 3.4, 7.0], look: [-5.6, 1.3, 3.0] }, icon: '🧘', title: 'Stretching', verb: 'Stretch', rep: 'Reach!', line: 'Nice and slow.' },
}
const GOAL = 12

export function GymTask({ r, mode, onDone }: { r: WorldRenderer; mode: Mode; onDone: (perf?: number) => void }) {
  const sp = SPOT[mode]
  const [arrived, setArrived] = useState(false)
  const [reps, setReps] = useState(0)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    r.walkTo(sp.walk[0], sp.walk[1])
    const t0 = Date.now()
    const iv = window.setInterval(() => {
      const p = r.position
      if (Math.hypot(p.x - sp.walk[0], p.z - sp.walk[1]) < 0.6 || Date.now() - t0 > 6000) {
        clearInterval(iv)
        if (!alive.current) return
        r.setFrozen(true); r.placePlayer(sp.at[0], sp.at[1], sp.face); r.setCameraOverride(sp.cam); r.washPose(mode); setArrived(true)
        r.say('player', sp.line, 2)
      }
    }, 150)
    return () => { alive.current = false; clearInterval(iv); r.washPose(null); r.setCameraOverride(null); r.setFrozen(false); r.snapToFree() }
  }, [r, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = reps >= GOAL
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl pop" style={{ background: '#14121ff2', borderTop: '2px solid #ffffff22' }}>
      <div className="font-display text-2xl text-danfo mb-1">{sp.icon} {sp.title}</div>
      <div className="text-xs opacity-75 mb-2">Tap to do your reps. {GOAL} reps is a full set.</div>
      <div className="bar mb-3 !h-2.5"><i style={{ width: `${Math.min(100, (reps / GOAL) * 100)}%`, background: '#2fd27b' }} /></div>
      {!arrived
        ? <div className="btn w-full opacity-70 text-center">Walking there…</div>
        : done
          ? <button className="btn btn-primary w-full" onClick={() => onDone(1)}>💪 Great set! Done ▶</button>
          : <button className="btn btn-primary w-full !min-h-14 text-xl" onClick={() => { audio.sfx('tap'); setReps((n) => n + 1); if (reps + 1 === 6) r.say('player', 'Keep going!', 1.6) }}>{sp.icon} {sp.rep} ({reps}/{GOAL})</button>}
      {arrived && !done && reps >= 6 && <button className="btn w-full mt-2" onClick={() => onDone(Math.min(0.95, reps / GOAL))}>Finish early ▶</button>}
      <button className="btn w-full mt-2" onClick={() => onDone(undefined)}>✖ Stop</button>
    </div>
  )
}
