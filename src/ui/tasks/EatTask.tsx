// You asked for food and it arrives: sit at the table and eat, with a few bites, before the meal counts.
import { useEffect, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import { audio } from '@platform/audio'

export function EatTask({ r, who, onDone }: { r: WorldRenderer; who: string; onDone: () => void }) {
  const [bites, setBites] = useState(0)
  const BITES = 6
  useEffect(() => {
    const seat = r.claimSeat('table')
    r.setFrozen(true)
    if (seat) { r.setSitting(true); r.placePlayer(seat.x, seat.z, seat.face) }
    r.say('player', 'Mmm. This smells so good!', 2.4)
    return () => { r.setSitting(false); r.setFrozen(false); r.releaseSeat(); if (seat) r.placePlayer(seat.ax, seat.az, 0); r.snapToFree() }
  }, [r])
  useEffect(() => {
    if (bites >= BITES) return
    const t = setTimeout(() => { audio.sfx('tap'); setBites((b) => b + 1) }, 650)
    return () => clearTimeout(t)
  }, [bites])
  useEffect(() => {
    if (bites === 2) r.say('player', 'Rice and stew, my favourite.', 2.2)
    if (bites === 4) r.say('player', `Thank you, ${who}!`, 2.2)
  }, [bites])
  const done = bites >= BITES
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl pop" style={{ background: '#14121ff2', borderTop: '2px solid #ffffff22' }}>
      <div className="font-display text-2xl text-danfo mb-1">🍛 {done ? 'That was delicious!' : 'Eating…'}</div>
      <div className="flex items-center gap-2 text-[34px] leading-none justify-center my-2" aria-hidden="true">{Array.from({ length: BITES }, (_, i) => <span key={i} style={{ opacity: i < BITES - bites ? 1 : 0.15, transition: 'opacity .3s' }}>🍛</span>)}</div>
      <button className="btn btn-primary w-full" disabled={!done} onClick={onDone}>{done ? 'Done ▶' : 'Eating…'}</button>
    </div>
  )
}
