// Shopping in the market: browse the aisles on foot, find the goods you want, and haggle with the seller.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import { SHOP_SPOTS } from '../../world/layout'
import type { ItemDef } from '@content/items'
import { nairaShort } from '../components'
import { audio } from '@platform/audio'

interface Row { item: ItemDef; affordable: boolean; canBuy: boolean; mum: { ok: boolean; who: string; why?: string } }
const SELLERS: [string, 'male' | 'female'][] = [['Mama Nkechi', 'female'], ['Alhaji Bello', 'male'], ['Aunty Folake', 'female'], ['Chief Okon', 'male'], ['Iya Sade', 'female']]

export function ShopTask({ r, items, cash, energy, onBuy, onDeliver, onDone }: { r: WorldRenderer; items: Row[]; cash: number; energy: number; onBuy: (itemId: string, pricePct: number, byMum?: boolean) => void; onDeliver: (itemId: string, hoursLater: number, fee: number) => void; onDone: () => void }) {
  // the first goods stand in the aisles; the whole range is in the Goods list
  const spots = useRef(items.slice(0, SHOP_SPOTS.length).map((row, i) => ({ row, ...SHOP_SPOTS[i] }))).current
  const mumRow = items.find((x) => x.mum.ok)
  const [list, setList] = useState(false)
  const [pick, setPick] = useState<string | null>(null)
  const say = (id: string, text: string, secs: number) => { try { r.say(id, text, secs) } catch { /* the speaker is not in the scene */ } }
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

  // a parent comes along to the market when you are a child
  useEffect(() => {
    if (!mumRow) return
    const me = r.position
    r.addActor('mama', { name: mumRow.mum.who, gender: mumRow.mum.who === 'Mama' ? 'female' : 'male', x: me.x + 1.6, z: me.z + 0.4 })
    const iv = setInterval(() => { const p = r.position; r.moveActor('mama', p.x + 1.5, p.z + 0.6) }, 1200)
    return () => { clearInterval(iv); r.removeActor('mama') }
  }, [r]) // eslint-disable-line react-hooks/exhaustive-deps
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

  const curId = pick ?? near
  const curRow = curId ? items.find((x) => x.item.id === curId && !bought.includes(x.item.id)) ?? null : null
  const cur = curRow?.item ?? null
  const vid = near && near === curId ? `v_${near}` : ''
  const buy = (pct: number, byMum = false) => {
    if (!cur) return
    onBuy(cur.id, pct, byMum); audio.sfx('good')
    if (vid) say(vid, byMum ? 'Thank you, madam! Very good choice.' : pct < 1 ? 'Okay, you have beaten me. Take it!' : 'Thank you! Come again.', 2.6)
    if (byMum) say('mama', cur.appliance ? 'Okay my dear. I will ask the loader to bring it home.' : cur.id === 'rice' ? 'Good thinking. The house needs food.' : 'Okay my dear. Take care of it.', 3.2)
    setBought((b) => [...b, cur.id]); r.removeMark(cur.id); setNear(null); nearRef.current = null; setPick(null)
    if (cur.appliance) { if (byMum) onDeliver(cur.id, cur.light ? 0 : 2, 0); else setDeliver(cur) }
    if (vid) setTimeout(() => r.removeActor(vid), 1800)
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
    onDeliver(deliver.id, mode === 'loader' ? 2 : 0, mode === 'loader' ? 3000 : 0); audio.sfx('good'); setDeliver(null)
  }
  const affordable = (pct: number) => !!cur && cash >= Math.round(cur.price * pct)
  const mine = curRow?.canBuy ?? false
  return (
    <>
      <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
        <div className="card px-3 py-2 flex items-center justify-between" style={{ background: '#1e1a30ee' }}>
          <b className="font-display text-2xl text-danfo">🛒 Market</b>
          <span className="font-black text-sm">{nairaShort(cash)} · ⚡{energy}</span>
          <span className="flex gap-1.5"><button className="chip chip-gold pointer-events-auto" onClick={() => { audio.sfx('click'); setList((v) => !v); setPick(null) }}>📋 Goods</button><button className="chip pointer-events-auto" onClick={onDone}>✔ Done</button></span>
        </div>
        {!cur && <div className="card mt-1.5 px-3 py-2 text-sm font-bold" style={{ background: '#241f38f2' }}>{spots.length === 0 ? 'Nothing new to buy right now. Come back when you are older or richer.' : bought.length === spots.length ? 'You have bought everything on offer. Good shopping!' : 'Walk the aisles and stop at the glowing goods. Each purchase costs ⚡ Energy.'}</div>}
      </div>
      {list && (
        <div className="absolute inset-x-2 top-16 bottom-2 z-30 card p-3 overflow-y-auto pop" style={{ background: '#1e1a30f5' }}>
          <div className="flex items-center justify-between mb-2"><b className="font-display text-xl text-danfo">What the market sells</b><button className="chip" onClick={() => setList(false)}>✖</button></div>
          {mumRow && <div className="text-xs opacity-80 mb-2">You are a child, so {mumRow.mum.who} came along. Pick anything and ask {mumRow.mum.who} to buy it. It comes out of your money.</div>}
          <div className="grid grid-cols-3 gap-2">
            {items.filter((x) => !bought.includes(x.item.id)).map((x) => {
              const ok = x.canBuy || x.mum.ok
              return (
                <button key={x.item.id} className="tile !p-1.5" style={{ opacity: ok ? 1 : 0.5 }} onClick={() => { audio.sfx('click'); setPick(x.item.id); setList(false); setMode('view'); setNote('') }}>
                  <span className="text-[28px] leading-none">{ok ? x.item.icon : '🔒'}</span>
                  <span className="font-display text-[11px] leading-tight text-center uppercase">{x.item.name}</span>
                  <span className="chip chip-gold !py-0 !text-[11px]">{nairaShort(x.item.price)}</span>
                  {!x.canBuy && x.mum.ok && <span className="text-[10px] font-bold text-green-300">ask {x.mum.who}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
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
              {mine && <button className="btn btn-primary" disabled={!affordable(1) || energy < 5} onClick={() => buy(1)}>{affordable(1) ? `Buy ${nairaShort(cur.price)}` : 'Too expensive'}</button>}
              {mine && <button className="btn" disabled={locked.includes(cur.id) || !affordable(0.75) || energy < 5 || !near} onClick={startHaggle}>🤝 Haggle</button>}
              {!mine && <div className="col-span-2 text-xs text-yellow-300">🔒 You are too young to buy this yourself.</div>}
              {curRow?.mum.ok && <button className="btn btn-primary col-span-2" disabled={!affordable(1) || energy < 5} onClick={() => buy(1, true)}>{affordable(1) ? `👩🏾 Ask ${curRow.mum.who} to buy it · ${nairaShort(cur.price)} of your money` : `Not enough money (${nairaShort(cash)})`}</button>}
              {!mine && curRow && !curRow.mum.ok && <div className="col-span-2 text-xs opacity-80">{curRow.mum.why}</div>}
              {pick && <button className="btn col-span-2" onClick={() => setPick(null)}>Back to the aisles</button>}
            </div>
          ) : (
            <div className="mt-2.5">
              <div className="text-xs font-bold opacity-80 mb-1.5">Make an offer (seller{tries ? ' is losing patience' : ''}):</div>
              <div className="grid grid-cols-3 gap-2">{[0.7, 0.8, 0.9].map((p) => <button key={p} className="tile !min-h-[72px] !p-1.5" onClick={() => offer(p)}><span className="font-display text-lg">{nairaShort(Math.round(cur.price * p))}</span><span className="chip chip-green !py-0 !text-[11px]">−{Math.round((1 - p) * 100)}%</span></button>)}</div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
