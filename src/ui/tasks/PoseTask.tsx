// Sit on the sofa (watch TV) or lie on the bed. Stand up any time.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'

export function PoseTask({ r, mode, tvOn, onToggleTv, onWatch, onSleep, onDone }: { r: WorldRenderer; mode: 'sofa' | 'bed'; tvOn: boolean; onToggleTv: () => void; onWatch: () => void; onSleep: () => void; onDone: () => void }) {
  const [ok, setOk] = useState(true)
  const stand = useRef<{ x: number; z: number } | null>(null)
  useEffect(() => {
    if (mode === 'sofa') {
      const seat = r.claimSeat('sofa')
      if (!seat) { setOk(false); return }
      stand.current = { x: seat.ax, z: seat.az }
      r.setFrozen(true); r.setSitting(true); r.placePlayer(seat.x, seat.z, seat.face)
      r.say('player', 'Ahh, comfortable.', 2.2)
      return () => { r.setSitting(false); r.setFrozen(false); r.placePlayer(seat.ax, seat.az, 0); r.releaseSeat() }
    }
    r.setSleeping(true, false)
    r.say('player', 'Ahh… so soft.', 2.2)
    return () => { r.setSleeping(false) }
  }, [r, mode])
  useEffect(() => { if (!ok) onDone() }, [ok])
  if (!ok) return null
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl pop" style={{ background: '#14121ff2', borderTop: '2px solid #ffffff22' }}>
      <div className="font-display text-2xl text-danfo mb-2">{mode === 'sofa' ? '🛋️ On the sofa' : '🛏️ Lying on the bed'}</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: mode === 'sofa' ? '1fr 1fr' : '1fr 1fr' }}>
        {mode === 'sofa' && <button className="btn" onClick={onToggleTv}>📺 TV {tvOn ? 'ON' : 'OFF'}</button>}
        {mode === 'sofa' && <button className="btn btn-primary" onClick={() => { onDone(); onWatch() }}>🍿 Watch TV</button>}
        {mode === 'bed' && <button className="btn btn-primary" onClick={() => { onDone(); onSleep() }}>😴 Fall asleep</button>}
        <button className="btn" onClick={onDone}>🧍 {mode === 'sofa' ? 'Stand up' : 'Get up'}</button>
      </div>
    </div>
  )
}
