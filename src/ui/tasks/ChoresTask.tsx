// Household chores: walk around the home and tidy each marked spot before time runs out.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import { HOME_CHORES } from '../../world/interiors'
import { audio } from '@platform/audio'

const TIME = 40

export function ChoresTask({ r, motherId, onDone }: { r: WorldRenderer; motherId: string | null; onDone: (perf: number) => void }) {
  const [done, setDone] = useState<string[]>([])
  const [left, setLeft] = useState(TIME)
  const [msg, setMsg] = useState('Mama has a list. Walk to each glowing 🧹 spot to tidy it. Be quick!')
  const doneRef = useRef<string[]>([])
  const fin = useRef(false)

  useEffect(() => {
    for (const c of HOME_CHORES) r.addMark(c.id, c.x, c.z, c.emoji)
    if (motherId) r.say(motherId, 'Sweep, wash, fold. Before I count to forty!', 4)
    const poll = setInterval(() => {
      const me = r.position
      for (const c of HOME_CHORES) {
        if (doneRef.current.includes(c.id)) continue
        if (Math.hypot(me.x - c.x, me.z - c.z) < 1.5) {
          doneRef.current = [...doneRef.current, c.id]; setDone(doneRef.current)
          r.removeMark(c.id); r.say('player', `${c.emoji} Done!`, 1.4); audio.sfx('good'); setMsg(`✅ ${c.note}`)
          if (motherId && doneRef.current.length === 3) r.say(motherId, 'Ehen! Keep going, my child.', 2.5)
        }
      }
    }, 150)
    const tick = setInterval(() => setLeft((v) => v - 1), 1000)
    return () => { clearInterval(poll); clearInterval(tick); r.clearMarks() }
  }, [r])

  const total = HOME_CHORES.length
  const over = fin.current || done.length >= total || left <= 0
  useEffect(() => { if (over) fin.current = true }, [over])
  const perf = Math.min(1, (done.length / total) * (0.7 + 0.3 * Math.max(0, left) / TIME))
  const next = HOME_CHORES.find((c) => !done.includes(c.id))
  return (
    <>
      <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
        <div className="card px-3 py-2 flex items-center justify-between" style={{ background: '#1e1a30ee' }}>
          <b className="font-display text-2xl text-danfo">🧹 Chores</b>
          <span className="font-black text-sm">{done.length}/{total} · ⏱ {Math.max(0, left)}s</span>
          {!over && <button className="chip pointer-events-auto" onClick={() => onDone(perf)}>✖ Stop</button>}
        </div>
        <div className="bar mt-1.5"><i style={{ width: `${Math.max(0, left) / TIME * 100}%`, background: left < 15 ? '#ff6b5e' : '#ffd23f' }} /></div>
        <div className="card mt-1.5 px-3 py-2 text-sm font-bold pop" style={{ background: '#241f38f2' }} key={msg}>{msg}{next && !over ? ` Next: ${next.emoji} ${next.note}.` : ''}</div>
      </div>
      {over && (
        <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pt-4 pb-5 safe-pad rounded-t-3xl pop" style={{ background: '#14121ff5', borderTop: '2px solid #ffffff22' }}>
          <div className="font-display text-3xl text-danfo">{done.length >= total ? 'Spotless!' : 'Time up!'}</div>
          <div className="text-sm opacity-80 mt-1">You finished {done.length} of {total} chores. {done.length >= total ? 'Mama is pleased and, miracle, silent.' : 'Mama will do the rest, and mention it for a week.'}</div>
          <button className="btn btn-primary w-full mt-3" onClick={() => onDone(perf)}>Finish ▶</button>
        </div>
      )}
    </>
  )
}
