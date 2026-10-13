// Ride the bus to another place: the bus pulls up, you board, the screen goes dark while you ride, and you step off beside your destination.
import { useEffect, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'

export function RideTask({ r, door, name, onDone }: { r: WorldRenderer; door: { x: number; z: number }; name: string; onDone: () => void }) {
  const [dark, setDark] = useState(false)
  const [msg, setMsg] = useState('Waiting for the bus…')
  useEffect(() => {
    let alive = true
    ;(async () => {
      await r.rideBoard(); if (!alive) return
      setMsg('Oya enter!')
      await r.rideDepart(); if (!alive) return
      setMsg(`Riding to ${name}…`); setDark(true)
      await new Promise((res) => setTimeout(res, 1800)); if (!alive) return
      setDark(false)
      await r.rideArrive(door)
      if (alive) onDone()
    })()
    return () => { alive = false }
  }, [r]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <div className="absolute top-20 inset-x-0 z-30 flex justify-center pointer-events-none"><span className="chip chip-gold pop">🚌 {msg}</span></div>
      <div className="absolute inset-0 z-40 grid place-items-center bg-black pointer-events-none" style={{ opacity: dark ? 1 : 0, transition: 'opacity .6s' }}>
        <div className="text-center"><div className="text-6xl">🚌</div><div className="font-display text-2xl mt-2 text-danfo">{msg}</div></div>
      </div>
    </>
  )
}
