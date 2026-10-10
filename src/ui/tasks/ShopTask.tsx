// Shopping in the market: browse the aisles on foot, find the goods you want, and haggle with the seller.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import { SHOP_SPOTS } from '../../world/layout'
import type { ItemDef } from '@content/items'
import { nairaShort } from '../components'
import { audio } from '@platform/audio'

interface Row { item: ItemDef; affordable: boolean }
const SELLERS: [string, 'male' | 'female'][] = [['Mama Nkechi', 'female'], ['Alhaji Bello', 'male'], ['Aunty Folake', 'female'], ['Chief Okon', 'male'], ['Iya Sade', 'female']]

export function ShopTask({ r, items, cash, energy, onBuy, onDeliver, onDone }: { r: WorldRenderer; items: Row[]; cash: number; energy: number; onBuy: (itemId: string, pricePct: number) => void; onDeliver: (itemId: string, mode: 'loader' | 'carry') => void; onDone: () => void }) {
  const spots = useRef(items.map((row, i) => ({ row, ...SHOP_SPOTS[i % SHOP_SPOTS.length] }))).current
  const [bought, setBought] = useState<string[]>([])
  const [near, setNear] = useState<string | null>(null)
  const [mode, setMode] = useState<'view' | 'haggle'>('view')
  const [tries, setTries] = useState(0)
  const [note, setNote] = useState('')
  const [locked, setLocked] = useState<string[]>([])
  const [deliver, setDeliver] = useState<ItemDef | null>(null)
  const floor = useRef<Record<string, number>>({})
  const seller = useRef<Record<string, string>>({})
  const nearRef = useRef<string | null>(null)

  useEffect(() => {
    spots.forEach((s) => { if (!bought.includes(s.row.item.id)) r.addMark(s.row.item.id, s.x, s.z, s.row.item.icon) })
    const poll = setInterval(() => {
      const me = r.position
      let best: string | null = null, bd = 1.9
      for (const s of spots) { if (bought.includes(s.row.item.id)) continue; const d = Math.hypot(me.x - s.x, me.z - s.z); if (d < bd) { bd = d; best = s.row.item.id } }
      if (best !== nearRef.current) {
        const prev = nearRef.current; if (prev) r.removeActor(`v_${prev}`)
        nearRef.current = best; setNear(best); setMode('view'); setTries(0); setNote('')
        if (best) {
          const s = spots.find((x) => x.row.item.id === best)!
          const [name, gender] = SELLERS[Math.abs(best.length * 7 + best.charCodeAt(0)) % SELLERS.length]
          seller.current[best] = name
          r.addActor(`v_${best}`, { name, gender, x: s.x, z: s.z - 1.5 })
          r.say(`v_${best}`, `Welcome! ${s.row.item.name}, very good quality.`, 3.5)
        }
      }
    }, 150)
    return () => { clearInterval(poll); r.clearMarks(); spots.forEach((s) => r.removeActor(`v_${s.row.item.id}`)) }
  }, [r, bought.length])

  const cur = near ? spots.find((s) => s.row.item.id === near)!.row.item : null
  const vid = near ? `v_${near}` : ''
  const buy = (pct: number) => {
    if (!cur) return
    onBuy(cur.id, pct); audio.sfx('good')
    r.say(vid, pct < 1 ? 'Okay, you have beaten me. Take it!' : 'Thank you! Come again.', 2.6)
    setBought((b) => [...b, cur.id]); r.removeMark(cur.id); setNear(null); nearRef.current = null
    if (cur.appliance) setDeliver(cur)
    setTimeout(() => r.removeActor(vid), 1800)
  }
  const startHaggle = () => { if (!cur) return; if (!floor.current[cur.id]) floor.current[cur.id] = 0.72 + Math.random() * 0.2; setMode('haggle'); r.say(vid, 'Last price is the price on the tag. But for you, let us talk.', 3.5) }
  const offer = (pct: number) => {
    if (!cur) return
    if (pct >= floor.current[cur.id]) { buy(pct); return }
    audio.sfx('bad')
    if (tries >= 1) { r.say(vid, 'Haba! No deal. Go and think about it.', 3); setLocked((l) => [...l, cur.id]); setMode('view'); setNote('The seller will not budge. Pay the tag price or move on.'); return }
    setTries(1); r.say(vid, 'Ehh! Add small money abeg!', 3); setNote('Too low. Try a little higher.')
  }

  const arrange = (mode: 'loader' | 'carry') => {
    if (!deliver) return
    const me = r.position
    if (mode === 'loader') {
      r.addActor('loader', { name: 'Loader', gender: 'male', x: me.x + 5, z: me.z + 0.5 }); r.moveActor('loader', me.x + 1.2, me.z + 0.5)
      r.say('loader', 'Oga, I go carry am reach your house!', 3.2)
      setTimeout(() => { r.addMark('box', me.x + 1.2, me.z + 0.5, '📦') }, 1200)
      setTimeout(() => { r.removeMark('box'); r.moveActor('loader', me.x + 12, me.z + 0.5) }, 3500)
      setTimeout(() => r.removeActor('loader'), 7000)
    } else r.say('player', 'It is light. I go carry am myself.', 2.6)
    onDeliver(deliver.id, mode); audio.sfx('good'); setDeliver(null)
  }
  const affordable = (pct: number) => !!cur && cash >= Math.round(cur.price * pct)
  return (
    <>
      <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
        <div className="card px-3 py-2 flex items-center justify-between" style={{ background: '#1e1a30ee' }}>
          <b className="font-display text-2xl text-danfo">🛒 Market</b>
          <span className="font-black text-sm">{nairaShort(cash)} · ⚡{energy}</span>
          <button className="chip pointer-events-auto" onClick={onDone}>✔ Done</button>
        </div>
        {!cur && <div className="card mt-1.5 px-3 py-2 text-sm font-bold" style={{ background: '#241f38f2' }}>{spots.length === 0 ? 'Nothing new to buy right now. Come back when you are older or richer.' : bought.length === spots.length ? 'You have bought everything on offer. Good shopping!' : 'Walk the aisles and stop at the glowing goods. Each purchase costs ⚡ Energy.'}</div>}
      </div>
      {deliver && (
        <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl pop" style={{ background: '#14121ff2', borderTop: '2px solid #ffffff22' }}>
          <div className="flex items-center gap-3"><div className="text-4xl">{deliver.icon}</div><div className="flex-1"><div className="font-black leading-tight">Bought: {deliver.name}</div><div className="text-xs opacity-75">How will it get home?</div></div></div>
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            <button className="btn btn-primary" disabled={cash < 3000} onClick={() => arrange('loader')}>🚚 Loader ₦3,000<div className="text-[10px] opacity-80">arrives in ~2 hours</div></button>
            <button className="btn" disabled={!deliver.light} onClick={() => arrange('carry')}>🧍 Carry it myself<div className="text-[10px] opacity-80">{deliver.light ? 'light enough' : 'too heavy'}</div></button>
          </div>
        </div>
      )}
      {cur && !deliver && (
        <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl pop" style={{ background: '#14121ff2', borderTop: '2px solid #ffffff22' }}>
          <div className="flex items-center gap-3"><div className="text-4xl">{cur.icon}</div><div className="flex-1 min-w-0"><div className="font-black leading-tight">{cur.name}</div><div className="text-xs opacity-75">{cur.desc}</div></div><span className="chip">{nairaShort(cur.price)}</span></div>
          {note && <div className="text-xs text-yellow-300 mt-1.5">{note}</div>}
          {mode === 'view' ? (
            <div className="grid grid-cols-2 gap-2 mt-2.5">
              <button className="btn btn-primary" disabled={!affordable(1) || energy < 5} onClick={() => buy(1)}>{affordable(1) ? `Buy ${nairaShort(cur.price)}` : 'Too expensive'}</button>
              <button className="btn" disabled={locked.includes(cur.id) || !affordable(0.75) || energy < 5} onClick={startHaggle}>🤝 Haggle</button>
            </div>
          ) : (
            <div className="mt-2.5">
              <div className="text-xs font-bold opacity-80 mb-1.5">Make an offer (seller{tries ? ' is losing patience' : ''}):</div>
              <div className="grid grid-cols-3 gap-2">{[0.7, 0.8, 0.9].map((p) => <button key={p} className="card-btn !p-2 text-center" onClick={() => offer(p)}><div className="font-black">{nairaShort(Math.round(cur.price * p))}</div><div className="text-[11px] opacity-70">{Math.round((1 - p) * 100)}% off</div></button>)}</div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
