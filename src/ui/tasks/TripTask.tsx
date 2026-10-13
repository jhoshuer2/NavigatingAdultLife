// A group trip with your friends: hike up the hills in Abuja, spend a beach day in Lagos. Follow the pins in order, your friends keep up with you.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import type { Rect } from '../../world/layout'
import { audio } from '@platform/audio'

export type TripKind = 'hike' | 'beach'
const TIME = 55
const CFG = {
  hike: {
    title: '⛰️ Group hike', intro: 'Follow the pins up the hill with your friends. Take it steady, the top is worth it!',
    pins: ['🥾', '🌿', '🪨', '📸', '🏁'], notes: ['Good start! The air is fresh.', 'Watch the roots on the path.', 'Halfway! Snack break soon.', 'Almost there. Everybody keep up!', 'The top! Group photo time!'],
    mates: ['Come on, you can do it!', 'My legs! But the view...', 'Abuja is so green from here!', 'Wait for me!', 'We made it!'], end: ['You reached the top together.', 'Great view, great friends.'],
    emoji: '⛰️',
  },
  beach: {
    title: '🏖️ Beach day', intro: 'Follow the pins along the shore with your friends: football, shells, suya and a splash!',
    pins: ['🏐', '🐚', '🍢', '🥥', '🌊'], notes: ['Beach football! Pass it round.', 'Shells for Mama!', 'Suya on the sand. Yes!', 'Fresh coconut water.', 'Last one in the sea is a goat!'],
    mates: ['Pass! Pass the ball!', 'Look at this shell!', 'Extra pepper please!', 'This is the life!', 'Splash!'], end: ['What a day at the beach.', 'Sand in everything, smiles everywhere.'],
    emoji: '🏖️',
  },
} as const

export function TripTask({ r, area, kind, friends, onDone }: { r: WorldRenderer; area: Rect; kind: TripKind; friends: string[]; onDone: (perf: number) => void }) {
  const c = CFG[kind]
  const cx = (area.x0 + area.x1) / 2, z0 = area.z0, z1 = area.z1
  const pts = useRef(kind === 'hike'
    ? [{ x: cx - 5, z: z1 - 3.5 }, { x: cx + 5, z: z1 - 6 }, { x: cx - 5, z: z0 + 7 }, { x: cx + 4, z: z0 + 5 }, { x: cx, z: z0 + 3.4 }]
    : [{ x: cx + 7, z: z1 - 4 }, { x: cx - 6, z: z1 - 6 }, { x: cx - 8, z: z0 + 12 }, { x: cx + 6, z: z0 + 10 }, { x: cx, z: z0 + 8.2 }]).current
  const [next, setNext] = useState(0)
  const [left, setLeft] = useState(TIME)
  const [msg, setMsg] = useState<string>(c.intro)
  const nextRef = useRef(0), over = useRef(false)
  const ids = useRef(friends.map((_, i) => `mate${i}`)).current

  useEffect(() => {
    r.placePlayer(cx, z1 - 0.5, Math.PI)
    friends.forEach((name, i) => { r.addActor(ids[i], { name, gender: i % 2 ? 'male' : 'female', x: cx - 1.5 + i * 1.5, z: z1 + 0.8, label: true }); r.followPlayer(ids[i], true) })
    r.addMark('trip', pts[0].x, pts[0].z, c.pins[0])
    let raf = 0
    const loop = () => {
      if (over.current) return
      const me = r.position, p = pts[nextRef.current]
      if (p && Math.hypot(me.x - p.x, me.z - p.z) < 2) {
        const i = nextRef.current
        audio.sfx('good'); r.say(ids[i % ids.length] ?? 'player', c.mates[i], 2.4); setMsg(c.notes[i])
        nextRef.current++; setNext(nextRef.current)
        r.removeMark('trip')
        if (nextRef.current >= pts.length) { over.current = true; setMsg(c.end[0]); audio.sfx('level'); return }
        r.addMark('trip', pts[nextRef.current].x, pts[nextRef.current].z, c.pins[nextRef.current])
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const tick = setInterval(() => setLeft((v) => v - 1), 1000)
    return () => { cancelAnimationFrame(raf); clearInterval(tick); r.clearMarks(); ids.forEach((id) => r.removeActor(id)) }
  }, [r])
  useEffect(() => { if (left <= 0) over.current = true }, [left])

  const finished = over.current || left <= 0 || next >= pts.length
  const perf = Math.max(0, Math.min(1, (next / pts.length) * (0.65 + 0.35 * Math.max(0, left) / TIME)))
  return (
    <>
      <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
        <div className="card px-3 py-2 flex items-center justify-between" style={{ background: '#1e1a30ee' }}>
          <b className="font-display text-2xl text-danfo">{c.title}</b>
          <span className="font-black text-sm">{Math.min(next + 1, pts.length)}/{pts.length} · ⏱ {Math.max(0, left)}s</span>
          {!finished && <button className="chip pointer-events-auto" onClick={() => onDone(perf)}>✖ Stop</button>}
        </div>
        <div className="card mt-1.5 px-3 py-2 text-sm font-bold" style={{ background: '#241f38f2' }} key={msg}>{msg}</div>
      </div>
      {finished && (
        <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pt-4 pb-5 safe-pad rounded-t-3xl pop" style={{ background: '#14121ff5', borderTop: '2px solid #ffffff22' }}>
          <div className="font-display text-3xl text-danfo">{next >= pts.length ? `${c.emoji} Trip complete!` : 'Time up!'}</div>
          <div className="text-sm opacity-80 mt-1">{next} of {pts.length} stops. {next >= pts.length ? c.end[1] : 'You will make it further next time.'}</div>
          <button className="btn btn-primary w-full mt-3" onClick={() => onDone(perf)}>Finish ▶</button>
        </div>
      )}
    </>
  )
}
