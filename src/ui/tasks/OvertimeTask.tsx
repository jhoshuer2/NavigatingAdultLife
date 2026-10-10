// Overtime: sort the stack of documents into the right trays before the boss comes round.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import { audio } from '@platform/audio'

type Cat = 'accounts' | 'memo' | 'report'
const TRAYS: { id: Cat; icon: string; name: string }[] = [{ id: 'accounts', icon: '🧾', name: 'Accounts' }, { id: 'memo', icon: '📣', name: 'Memos' }, { id: 'report', icon: '📊', name: 'Reports' }]
const DOCS: { t: string; c: Cat }[] = [
  { t: 'Invoice #204: Lagos Logistics, ₦80,000 due Friday', c: 'accounts' }, { t: 'Receipt: generator diesel, ₦45,000', c: 'accounts' }, { t: 'Salary schedule for the month', c: 'accounts' }, { t: 'Overdue payment reminder: supplier', c: 'accounts' }, { t: 'Petty cash request, ₦12,000', c: 'accounts' },
  { t: 'All staff: generator servicing on Friday', c: 'memo' }, { t: 'Reminder: dress code on Fridays', c: 'memo' }, { t: 'Office party: bring a dish!', c: 'memo' }, { t: 'Notice: the gate closes at 6 PM', c: 'memo' }, { t: 'Staff meeting moved to 3 PM', c: 'memo' },
  { t: 'Q3 sales figures and targets', c: 'report' }, { t: 'Customer survey results summary', c: 'report' }, { t: 'Monthly performance review', c: 'report' }, { t: 'Project progress: week 12 update', c: 'report' }, { t: 'Market analysis: competitor pricing', c: 'report' },
]
const COUNT = 8
const PER = 7

export function OvertimeTask({ r, onDone }: { r: WorldRenderer; onDone: (perf: number) => void }) {
  const deck = useRef(DOCS.map((d) => ({ d, k: Math.random() })).sort((a, b) => a.k - b.k).slice(0, COUNT).map((x) => x.d)).current
  const [i, setI] = useState(0)
  const [right, setRight] = useState(0)
  const [left, setLeft] = useState(PER)
  const [msg, setMsg] = useState('Sort each document into the correct tray. The boss is watching.')
  const [ended, setEnded] = useState(false)
  const lock = useRef(false)

  useEffect(() => {
    r.setFrozen(true); r.setSitting(true)
    r.placePlayer(-6.3, -2.5, Math.PI)
    r.setCameraOverride({ pos: [-6.0, 9.5, 7.0], look: [-6.2, 0.9, -3.0], shift: 0.2 })
    setMsg('Boss: “I want those documents sorted tonight.” Sort each one into the right tray.')
    return () => { r.setSitting(false); r.setFrozen(false); r.setCameraOverride(null) }
  }, [r])

  useEffect(() => {
    if (ended) return
    setLeft(PER)
    const t = setInterval(() => setLeft((v) => v - 0.1), 100)
    return () => clearInterval(t)
  }, [i, ended])
  useEffect(() => { if (!ended && left <= 0) answer(null) }, [left])

  const advance = () => { lock.current = false; if (i + 1 >= COUNT) setEnded(true); else setI(i + 1) }
  const answer = (c: Cat | null) => {
    if (lock.current || ended) return
    lock.current = true
    const ok = c === deck[i].c
    if (ok) { setRight((x) => x + 1); setMsg('✅ Filed!'); audio.sfx('good'); r.say('player', '📄 Filed!', 1.2) }
    else { setMsg(c ? '❌ Wrong tray.' : '⏱ Too slow.'); audio.sfx('bad'); r.say('boss', c ? 'That does not belong there!' : 'Faster please.', 2) }
    setTimeout(advance, 450)
  }

  const perf = right / COUNT
  return (
    <>
      <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
        <div className="card px-3 py-2 flex items-center justify-between" style={{ background: '#1e1a30ee' }}>
          <b className="font-display text-2xl text-danfo">⏰ Overtime</b>
          <span className="font-black text-sm">{Math.min(i + 1, COUNT)}/{COUNT} · ✅ {right}</span>
          {!ended && <button className="chip pointer-events-auto" onClick={() => onDone(perf)}>✖ Clock out</button>}
        </div>
        <div className="card mt-1.5 px-3 py-2 text-sm font-bold pop" style={{ background: '#241f38f2' }} key={msg + i}>{msg}</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl" style={{ background: '#14121ff2', borderTop: '2px solid #ffffff22' }}>
        {!ended ? (
          <>
            <div className="bar mb-2"><i style={{ width: `${Math.max(0, left) / PER * 100}%`, background: left < 2.5 ? '#ff6b5e' : '#2fd27b' }} /></div>
            <div className="card p-3 mb-2 font-bold leading-snug" style={{ background: '#f4f1e6', color: '#1c1b22', transform: 'rotate(-0.6deg)' }}>📄 {deck[i].t}</div>
            <div className="grid grid-cols-3 gap-2">{TRAYS.map((t) => <button key={t.id} className="card-btn !p-2 text-center" onClick={() => answer(t.id)}><div className="text-3xl">{t.icon}</div><div className="text-[11px] font-bold">{t.name}</div></button>)}</div>
          </>
        ) : (
          <div className="pop">
            <div className="font-display text-3xl text-danfo">Desk cleared!</div>
            <div className="text-sm opacity-80 mt-1">{right} of {COUNT} filed correctly. {perf >= 0.8 ? 'The boss noticed. Promotion energy.' : perf >= 0.5 ? 'Decent night. A few misfiled.' : 'Messy night. Tomorrow you will find them.'}</div>
            <button className="btn btn-primary w-full mt-3" onClick={() => onDone(perf)}>Finish ▶</button>
          </div>
        )}
      </div>
    </>
  )
}
