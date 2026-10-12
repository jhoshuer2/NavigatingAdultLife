// Run a market stall: customers queue up, ask for goods, haggle, and lose patience if you are slow.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import { audio } from '@platform/audio'

const ITEMS = [{ e: '🍅', n: 'tomatoes' }, { e: '🧅', n: 'onions' }, { e: '🐟', n: 'fish' }, { e: '🍌', n: 'plantain' }]
const NAMES: [string, 'male' | 'female'][] = [['Mama Tayo', 'female'], ['Chinedu', 'male'], ['Aunty Bisi', 'female'], ['Alhaji Musa', 'male'], ['Ngozi', 'female'], ['Emeka', 'male'], ['Hauwa', 'female'], ['Segun', 'male']]
const CUSTOMERS = 6
const PATIENCE = 8
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

export function MarketTask({ r, spot, onDone }: { r: WorldRenderer; spot: { x: number; z: number }; onDone: (perf: number) => void }) {
  const [n, setN] = useState(0) // customers started
  const [phase, setPhase] = useState<'coming' | 'order' | 'price' | 'between' | 'end'>('coming')
  const [want, setWant] = useState(0)
  const [haggle, setHaggle] = useState(false)
  const [patience, setPatience] = useState(PATIENCE)
  const [takings, setTakings] = useState(0)
  const [msg, setMsg] = useState('Customers are coming. Give them what they ask for, quickly!')
  const score = useRef<number[]>([])
  const cid = useRef('')
  const cnt = useRef(0)
  const alive = useRef(true)
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => { const t = window.setTimeout(() => { if (alive.current) fn() }, ms); timers.current.push(t) }
  const cz = spot.z - 2.1

  const walk = (id: string, tx: number, ms: number, then: () => void) => {
    const g = r.actorGroup(id); if (!g) return
    const x0 = g.position.x, t0 = performance.now()
    g.rotation.y = tx > x0 ? Math.PI / 2 : -Math.PI / 2
    const step = (now: number) => {
      if (!alive.current) return
      const t = Math.min(1, (now - t0) / ms); g.position.x = x0 + (tx - x0) * t
      if (t < 1) requestAnimationFrame(step); else then()
    }
    requestAnimationFrame(step)
  }

  const nextCustomer = (i: number) => {
    if (i >= CUSTOMERS) { setPhase('end'); return }
    const [name, gender] = pick(NAMES); const id = `c${i}`; cid.current = id
    const w = Math.floor(Math.random() * ITEMS.length)
    r.addActor(id, { name, gender, x: spot.x - 10, z: cz, heading: Math.PI / 2 }); r.lockActor(id, true)
    cnt.current = i + 1; setN(i + 1); setPhase('coming'); setWant(w); setHaggle(i % 3 === 2); setPatience(PATIENCE)
    const tx = spot.x + (Math.random() - 0.5) * 1.6
    walk(id, tx, 1400, () => {
      const g = r.actorGroup(id); if (g) g.rotation.y = 0
      r.say(id, `${pick(['Abeg,', 'Good afternoon,', 'Please,', 'My friend,'])} give me some ${ITEMS[w].n} ${ITEMS[w].e}`, PATIENCE)
      setPhase('order')
    })
  }
  const leave = (good: boolean, line: string) => {
    const id = cid.current; setPhase('between'); r.say(id, line, 2.2); if (good) audio.sfx('good'); else audio.sfx('bad')
    later(() => walk(id, spot.x + 11, 1500, () => { r.removeActor(id); nextCustomer(cnt.current) }), 1500)
  }

  useEffect(() => {
    alive.current = true
    r.setFrozen(true); r.setStall({ x: spot.x, z: spot.z })
    r.placePlayer(spot.x, spot.z + 1.5, Math.PI)
    r.setCameraOverride({ pos: [spot.x, 14.5, spot.z + 8.5], look: [spot.x, 0.6, spot.z - 1.6], shift: 0.16 })
    later(() => nextCustomer(0), 900)
    return () => { alive.current = false; timers.current.forEach(clearTimeout); for (let i = 0; i < CUSTOMERS; i++) r.removeActor(`c${i}`); r.setStall(null); r.setCameraOverride(null); r.setFrozen(false) }
  }, [r])

  // patience ticks while a customer waits
  useEffect(() => {
    if (phase !== 'order' && phase !== 'price') return
    const t = setInterval(() => setPatience((p) => p - 0.1), 100)
    return () => clearInterval(t)
  }, [phase, n])
  useEffect(() => { if ((phase === 'order' || phase === 'price') && patience <= 0) { score.current.push(0); setMsg('😤 Too slow. They walked away.'); leave(false, 'You are too slow! I am going.') } }, [patience])

  const sell = (i: number) => {
    if (phase !== 'order') return
    if (i !== want) { score.current.push(0); setMsg('❌ Wrong goods. They are not pleased.'); leave(false, 'That is not what I asked for!'); return }
    audio.sfx('click')
    if (haggle) { setPhase('price'); setPatience(PATIENCE); r.say(cid.current, 'How much? Do not rob me o. Last price?', PATIENCE); return }
    const earn = 300 + Math.floor(Math.random() * 200); score.current.push(1); setTakings((t) => t + earn); setMsg(`✅ Sold! +₦${earn}`); leave(true, 'Thank you! God bless your hustle 🙏')
  }
  const price = (kind: 'fair' | 'high' | 'low') => {
    if (phase !== 'price') return
    if (kind === 'fair') { const e = 450; score.current.push(1); setTakings((t) => t + e); setMsg(`🤝 Fair price. +₦${e}`); leave(true, 'Okay, that is fair. Deal!') }
    else if (kind === 'high') { if (Math.random() < 0.5) { const e = 620; score.current.push(1.0); setTakings((t) => t + e); setMsg(`😏 They paid extra! +₦${e}`); leave(true, 'Hmm… fine, take it.') } else { score.current.push(0); setMsg('🙅 Too expensive. They walked away.'); leave(false, 'Haba! That is robbery!') } }
    else { const e = 260; score.current.push(0.6); setTakings((t) => t + e); setMsg(`📉 You sold cheap. +₦${e}`); leave(true, 'Wow, thank you! I will tell my friends.') }
  }

  const perf = Math.min(1, score.current.reduce((a, b) => a + b, 0) / CUSTOMERS)
  return (
    <>
      <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
        <div className="card px-3 py-2 flex items-center justify-between" style={{ background: '#1e1a30ee' }}>
          <b className="font-display text-2xl text-danfo">🧺 Your stall</b>
          <span className="font-black text-sm">{Math.min(n, CUSTOMERS)}/{CUSTOMERS} · ₦{takings.toLocaleString()}</span>
          {phase !== 'end' && <button className="chip pointer-events-auto" onClick={() => onDone(perf)}>✖ Close</button>}
        </div>
        <div className="card mt-1.5 px-3 py-2 text-sm font-bold pop" style={{ background: '#241f38f2' }} key={msg}>{msg}</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl" style={{ background: '#14121ff2', borderTop: '2px solid #ffffff22' }}>
        {(phase === 'order' || phase === 'price') && <div className="bar mb-2"><i style={{ width: `${Math.max(0, patience) / PATIENCE * 100}%`, background: patience < 3 ? '#ff6b5e' : '#2fd27b' }} /></div>}
        {phase === 'order' && (
          <>
            <div className="text-xs font-bold opacity-80 mb-1.5">They want {ITEMS[want].n}. Tap the right goods{haggle ? ' (then settle the price)' : ''}:</div>
            <div className="grid grid-cols-4 gap-2">{ITEMS.map((it, i) => <button key={it.n} className="tile !min-h-[72px] !p-1.5" onClick={() => sell(i)} aria-label={it.n}><span className="text-3xl leading-none">{it.e}</span><span className="font-display text-[11px] uppercase">{it.n}</span></button>)}</div>
          </>
        )}
        {phase === 'price' && (
          <>
            <div className="text-xs font-bold opacity-80 mb-1.5">“Last price?” Name your price:</div>
            <div className="grid grid-cols-3 gap-2">
              <button className="tile !min-h-[72px] !p-1.5" onClick={() => price('fair')}><span className="text-2xl leading-none">🤝</span><span className="font-display text-[11px] uppercase">Fair</span></button>
              <button className="tile !min-h-[72px] !p-1.5" onClick={() => price('high')}><span className="text-2xl leading-none">💰</span><span className="font-display text-[11px] uppercase">+20%</span><span className="chip chip-red !py-0 !text-[10px]">Risky</span></button>
              <button className="tile !min-h-[72px] !p-1.5" onClick={() => price('low')}><span className="text-2xl leading-none">📉</span><span className="font-display text-[11px] uppercase">Discount</span></button>
            </div>
          </>
        )}
        {(phase === 'coming' || phase === 'between') && <div className="text-center text-sm opacity-70 py-3">…</div>}
        {phase === 'end' && (
          <div className="pop">
            <div className="font-display text-3xl text-danfo">Market closed for the day!</div>
            <div className="text-sm opacity-80 mt-1">You took ₦{takings.toLocaleString()}. {perf >= 0.8 ? 'Customers will remember you. Excellent hustle.' : perf >= 0.5 ? 'A decent day. Keep at it.' : 'Slow day. Be quicker and read the customers.'}</div>
            <button className="btn btn-primary w-full mt-3" onClick={() => onDone(perf)}>Finish ▶</button>
          </div>
        )}
      </div>
    </>
  )
}
