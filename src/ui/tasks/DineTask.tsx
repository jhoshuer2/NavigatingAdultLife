// Sit down at the buka: order a plate, wait for it, eat, pay.
import { useEffect, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import { audio } from '@platform/audio'

const MENU = [
  { id: 'jollof', name: 'Jollof rice and chicken', e: '🍛', price: 3500, q: 0.9 },
  { id: 'amala', name: 'Amala, ewedu and gbegiri', e: '🍲', price: 2500, q: 0.8 },
  { id: 'poundo', name: 'Pounded yam and egusi', e: '🥘', price: 4000, q: 1 },
  { id: 'suya', name: 'Suya plate', e: '🍢', price: 3000, q: 0.85 },
]

export function DineTask({ r, cash, onDone }: { r: WorldRenderer; cash: number; onDone: (perf: number, spend: number) => void }) {
  const [phase, setPhase] = useState<'menu' | 'wait' | 'eat' | 'end'>('menu')
  const [dish, setDish] = useState<(typeof MENU)[number] | null>(null)

  useEffect(() => {
    r.setFrozen(true); r.setSitting(true)
    r.placePlayer(-5.5, 2.4, Math.PI)
    r.setCameraOverride({ pos: [-5.0, 9.5, 9.5], look: [-5.2, 0.9, 0.2], shift: 0.2 })
    r.say('mama', 'Welcome! What will you have?', 3.5)
    return () => { r.setSitting(false); r.setFrozen(false); r.setCameraOverride(null); r.clearMarks() }
  }, [r])

  const order = (d: (typeof MENU)[number]) => {
    setDish(d); setPhase('wait'); audio.sfx('click')
    r.say('player', `${d.name}, please.`, 2.6)
    setTimeout(() => r.say('mama', 'Coming right up!', 2.4), 1500)
    setTimeout(() => { r.addMark('plate', -5.5, 1.0, d.e); r.say('mama', 'Enjoy your food!', 2.2); setPhase('eat') }, 4200)
    setTimeout(() => { r.say('player', '😋 So good!', 2.2); setPhase('end') }, 8200)
  }
  return (
    <>
      <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
        <div className="card px-3 py-2 flex items-center justify-between" style={{ background: '#1e1a30ee' }}><b className="font-display text-2xl text-danfo">🍽️ At the buka</b>{phase === 'menu' && <button className="chip pointer-events-auto" onClick={() => onDone(0, 0)}>✖ Leave</button>}</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl" style={{ background: '#14121ff2', borderTop: '2px solid #ffffff22' }}>
        {phase === 'menu' && (
          <div className="grid gap-2">
            <div className="text-xs font-bold opacity-80">Menu</div>
            {MENU.map((d) => <button key={d.id} className="card-btn !py-2 flex items-center justify-between gap-2" disabled={cash < d.price} onClick={() => order(d)}><span><b>{d.e} {d.name}</b></span><span className="chip">₦{d.price.toLocaleString()}</span></button>)}
          </div>
        )}
        {(phase === 'wait' || phase === 'eat') && <div className="text-center text-sm py-3">{phase === 'wait' ? 'Waiting for your food…' : `Eating ${dish?.name}…`}</div>}
        {phase === 'end' && dish && (
          <div className="pop">
            <div className="font-display text-3xl text-danfo">Delicious!</div>
            <div className="text-sm opacity-80 mt-1">You enjoyed {dish.name} and paid ₦{dish.price.toLocaleString()}.</div>
            <button className="btn btn-primary w-full mt-3" onClick={() => onDone(dish.q, dish.price)}>Finish ▶</button>
          </div>
        )}
      </div>
    </>
  )
}
