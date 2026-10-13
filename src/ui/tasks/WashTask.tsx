// Brush your teeth at the sink, or take a shower: you walk there, switch the water on and off yourself, and see every step.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import { audio } from '@platform/audio'

type Mode = 'brush' | 'bath'
interface Step { id: string; label: string; icon: string; run?: number; auto?: boolean; line: string }

const STEPS: Record<Mode, Step[]> = {
  brush: [
    { id: 'brush', label: 'Brush your teeth', icon: '🪥', run: 5, line: 'Up and down, front and back…' },
    { id: 'tapOn', label: 'Turn on the tap', icon: '🚰', line: 'Water is running.' },
    { id: 'rinse', label: 'Rinse your mouth', icon: '💦', run: 4, line: 'Swish, swish… ptoo!' },
    { id: 'tapOff', label: 'Turn off the tap', icon: '🚰', line: 'No wasting water.' },
  ],
  bath: [
    { id: 'on', label: 'Turn on the shower', icon: '🚿', line: 'Ahh, the water is here!' },
    { id: 'wet', label: 'Getting wet', icon: '💧', run: 2, auto: true, line: 'Cold! Then warm.' },
    { id: 'soap', label: 'Soap up', icon: '🧼', run: 3.5, line: 'Scrub, scrub, scrub!' },
    { id: 'rinse', label: 'Rinse off', icon: '💦', run: 3, line: 'All the soap goes down the drain.' },
    { id: 'off', label: 'Turn off the shower', icon: '🚿', line: 'Fresh and clean.' },
  ],
}

export function WashTask({ r, mode, onDone }: { r: WorldRenderer; mode: Mode; onDone: (perf?: number) => void }) {
  const steps = STEPS[mode]
  const [arrived, setArrived] = useState(false)
  const [i, setI] = useState(0)
  const [prog, setProg] = useState<number | null>(null) // 0..1 while a timed step runs
  const [finished, setFinished] = useState(false)
  const alive = useRef(true)
  const timer = useRef(0)

  // walk to the sink or the shower, then stand there facing it with a close camera
  useEffect(() => {
    alive.current = true
    const spot = r.washSpot(mode === 'brush' ? 'sink' : 'shower')
    if (!spot) { onDone(undefined); return }
    r.walkTo(spot.x, spot.z)
    const t0 = Date.now()
    const iv = window.setInterval(() => {
      const p = r.position
      if (Math.hypot(p.x - spot.x, p.z - spot.z) < 0.45 || Date.now() - t0 > 6000) {
        clearInterval(iv)
        if (!alive.current) return
        r.setFrozen(true); r.placePlayer(spot.x, spot.z, spot.face); r.setCameraOverride(spot.cam); setArrived(true)
        r.say('player', mode === 'brush' ? 'Time to brush.' : 'Shower time!', 2)
      }
    }, 150)
    return () => {
      alive.current = false; clearInterval(iv); clearInterval(timer.current)
      r.setWater('tap', false); r.setWater('shower', false); audio.water(null); r.washPose(null); r.setFoam('none')
      r.setCameraOverride(null); r.setFrozen(false); r.snapToFree()
    }
  }, [r, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => { if (i + 1 >= steps.length) setFinished(true); else setI(i + 1) }
  /** Run a timed action: progress fills, then the next step comes up. */
  const run = (secs: number, then: () => void) => {
    setProg(0); const t0 = Date.now()
    clearInterval(timer.current)
    timer.current = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - t0) / (secs * 1000)); setProg(p)
      if (p >= 1) { clearInterval(timer.current); setProg(null); if (alive.current) then() }
    }, 80)
  }

  const act = (s: Step) => {
    audio.sfx('toggle'); r.say('player', s.line, 2)
    if (s.id === 'brush') { r.washPose('brush'); r.setFoam('mouth'); run(s.run!, () => { r.washPose(null); next() }) }
    else if (s.id === 'tapOn') { r.setWater('tap', true); audio.water('tap'); next() }
    else if (s.id === 'rinse' && mode === 'brush') { r.washPose('rinse'); window.setTimeout(() => r.setFoam('none'), 1200); run(s.run!, () => { r.washPose(null); next() }) }
    else if (s.id === 'tapOff') { r.setWater('tap', false); audio.water(null); next() }
    else if (s.id === 'on') { r.setWater('shower', true); audio.water('shower'); r.washPose('shower'); next() }
    else if (s.id === 'soap') { r.washPose('soap'); r.setFoam('body'); run(s.run!, () => { r.washPose('shower'); next() }) }
    else if (s.id === 'rinse') { r.washPose('shower'); window.setTimeout(() => r.setFoam('none'), 1400); run(s.run!, next) }
    else if (s.id === 'off') { r.setWater('shower', false); audio.water(null); r.washPose(null); next() }
  }
  // the automatic "getting wet" step runs by itself right after the shower comes on
  useEffect(() => {
    const s = steps[i]
    if (arrived && s?.auto && prog === null && !finished) run(s.run!, next)
  }, [i, arrived]) // eslint-disable-line react-hooks/exhaustive-deps

  const cur = steps[i]
  const busy = prog !== null
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl pop" style={{ background: '#14121ff2', borderTop: '2px solid #ffffff22' }}>
      <div className="font-display text-2xl text-danfo mb-2">{mode === 'brush' ? '🪥 Brushing your teeth' : '🚿 Taking a bath'}</div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {steps.map((s, k) => <span key={s.id} className="chip !text-[12px]" style={{ background: k < i || finished ? '#1d5a3a' : k === i ? '#ffd23f' : '#ffffff18', color: k === i && !finished ? '#3b2300' : undefined }}>{k < i || finished ? '✔' : s.icon} {s.label}</span>)}
      </div>
      {busy && <div className="bar mb-3 !h-2"><i style={{ width: `${Math.round((prog ?? 0) * 100)}%`, background: '#5ec8ff' }} /></div>}
      {!arrived
        ? <div className="btn w-full opacity-70 text-center">Walking there…</div>
        : finished
          ? <button className="btn btn-primary w-full" onClick={() => onDone(1)}>{mode === 'brush' ? '😁 Sparkling clean. Done ▶' : '✨ Fresh and clean. Done ▶'}</button>
          : <button className="btn btn-primary w-full" disabled={busy || !!cur.auto} onClick={() => act(cur)}>{cur.icon} {busy || cur.auto ? `${cur.label}…` : cur.label}</button>}
      {!finished && <button className="btn w-full mt-2" onClick={() => onDone(undefined)}>✖ Stop</button>}
    </div>
  )
}
