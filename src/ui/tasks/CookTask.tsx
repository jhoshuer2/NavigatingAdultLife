// Cook a meal: pick the right ingredients, stir at the right moments, then sit down and eat.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import { audio } from '@platform/audio'

const SHELF = [{ id: 'rice', e: '🍚' }, { id: 'tomato', e: '🍅' }, { id: 'pepper', e: '🌶️' }, { id: 'onion', e: '🧅' }, { id: 'oil', e: '🫒' }, { id: 'egg', e: '🥚' }, { id: 'beans', e: '🫘' }, { id: 'plantain', e: '🍌' }]
const RECIPES = [
  { name: 'Jollof rice', need: ['rice', 'tomato', 'pepper', 'onion'], e: '🍛' },
  { name: 'Beans and plantain', need: ['beans', 'plantain', 'onion', 'oil'], e: '🫘' },
  { name: 'Egg stew and rice', need: ['egg', 'tomato', 'pepper', 'rice'], e: '🍳' },
]
const STIRS = 3
const PERIOD = 1300

export function CookTask({ r, free, onDone }: { r: WorldRenderer; free: boolean; onDone: (perf: number, spend: number) => void }) {
  const recipe = useRef(RECIPES[Math.floor(Math.random() * RECIPES.length)]).current
  const [phase, setPhase] = useState<'pick' | 'stir' | 'eat' | 'end'>('pick')
  const [added, setAdded] = useState<string[]>([])
  const [wrong, setWrong] = useState(0)
  const [stirs, setStirs] = useState(0)
  const [burn, setBurn] = useState(0)
  const [mark, setMark] = useState(0)
  const [msg, setMsg] = useState(`Today: ${recipe.name}. Add the ingredients it needs.`)
  const t0 = useRef(0), tapped = useRef(false), seat = useRef<{ ax: number; az: number } | null>(null)
  const spend = free ? 0 : 1500

  useEffect(() => {
    r.setFrozen(true)
    r.placePlayer(5.5, -4.7, Math.PI)
    r.setCameraOverride({ pos: [5.6, 10, 5], look: [5.6, 0.8, -4.6], shift: 0.2 })
    r.addMark('pot', 5.5, -5.6, '🍲')
    return () => { r.setFrozen(false); r.setSitting(false); r.setCameraOverride(null); r.clearMarks(); r.releaseSeat() }
  }, [r])

  const add = (id: string) => {
    if (phase !== 'pick' || added.includes(id)) return
    if (recipe.need.includes(id)) {
      const n = [...added, id]; setAdded(n); audio.sfx('good'); r.say('player', `+ ${SHELF.find((s) => s.id === id)!.e}`, 1.2)
      if (n.length === recipe.need.length) { setMsg('Now stir! Tap Stir when the marker is in the green zone.'); setTimeout(() => { setPhase('stir') }, 700) }
    } else { setWrong((w) => w + 1); audio.sfx('bad'); setMsg(`❌ ${SHELF.find((s) => s.id === id)!.e} does not belong in ${recipe.name}.`); r.say('player', 'Hmm, not that.', 1.4) }
  }

  useEffect(() => {
    if (phase !== 'stir') return
    let raf = 0; t0.current = performance.now(); let last = -1
    const loop = (now: number) => {
      const t = (now - t0.current) / PERIOD; const p = t % 1
      setMark(p)
      const beat = Math.floor(t)
      if (beat !== last) { if (last >= 0 && !tapped.current) { setBurn((b) => b + 1); setMsg('🔥 The bottom is catching!') } tapped.current = false; last = beat }
      if (beat >= STIRS + 2) { setPhase('eat'); return }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase])
  const stir = () => {
    if (phase !== 'stir' || tapped.current) return
    tapped.current = true
    const p = ((performance.now() - t0.current) / PERIOD) % 1
    if (Math.abs(p - 0.5) < 0.16) { setStirs((s) => s + 1); setMsg('🥄 Good stir!'); audio.sfx('good'); r.say('player', '🥄', 0.8) } else { setBurn((b) => b + 1); setMsg(p < 0.5 ? 'Too early.' : 'Too late.'); audio.sfx('bad') }
  }

  useEffect(() => {
    if (phase !== 'eat') return
    r.removeMark('pot')
    const s = r.claimSeat('table')
    if (s) { seat.current = s; r.placePlayer(s.x, s.z, s.face); r.setSitting(true); r.setCameraOverride({ pos: [7.2, 10, 3.5], look: [7.2, 0.8, -2.2], shift: 0.2 }) }
    r.addMark('plate', s ? 7.3 : 5.5, s ? -2.6 : -3.8, recipe.e)
    r.say('player', 'Mmm, smells so good!', 2.4)
    const t = setTimeout(() => { r.say('player', '😋 Delicious!', 2); setPhase('end') }, 3000)
    return () => clearTimeout(t)
  }, [phase])

  const quality = Math.max(0, 1 - wrong * 0.15 - burn * 0.2) * (0.55 + 0.45 * Math.min(1, stirs / STIRS))
  return (
    <>
      <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
        <div className="card px-3 py-2 flex items-center justify-between" style={{ background: '#1e1a30ee' }}>
          <b className="font-display text-2xl text-danfo">🍳 {recipe.name}</b>
          {phase !== 'end' && <button className="chip pointer-events-auto" onClick={() => onDone(0.2, 0)}>✖ Stop</button>}
        </div>
        <div className="card mt-1.5 px-3 py-2 text-sm font-bold" style={{ background: '#241f38f2' }} key={msg}>{msg}</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl" style={{ background: '#14121ff2', borderTop: '2px solid #ffffff22' }}>
        {phase === 'pick' && (
          <>
            <div className="text-xs font-bold opacity-80 mb-1.5">Recipe needs: {recipe.need.map((n) => SHELF.find((s) => s.id === n)!.e).join(' ')} {free ? '(the family provides the ingredients)' : '(ingredients cost ₦1,500)'}</div>
            <div className="grid grid-cols-4 gap-2">{SHELF.map((s) => <button key={s.id} className="tile !min-h-[72px] !p-1.5" disabled={added.includes(s.id)} onClick={() => add(s.id)} aria-label={s.id}><span className="text-3xl leading-none">{s.e}</span><span className="font-display text-[11px] uppercase">{s.id}</span></button>)}</div>
          </>
        )}
        {phase === 'stir' && (
          <>
            <div className="text-xs font-bold opacity-80 mb-1.5">Stir {stirs}/{STIRS}</div>
            <div className="relative h-8 rounded-full overflow-hidden mb-2" style={{ background: '#2a2540' }}><div className="absolute top-0 bottom-0" style={{ left: '34%', width: '32%', background: '#2fd27b66' }} /><div className="absolute top-0 bottom-0 w-2 rounded" style={{ left: `${mark * 100}%`, background: '#ffd23f' }} /></div>
            <button className="btn btn-primary w-full !text-xl !min-h-14" onPointerDown={stir}>🥄 Stir</button>
          </>
        )}
        {phase === 'eat' && <div className="text-center text-sm py-3">Dishing up and sitting down to eat…</div>}
        {phase === 'end' && (
          <div className="pop">
            <div className="font-display text-3xl text-danfo">{quality >= 0.8 ? 'Perfect meal!' : quality >= 0.5 ? 'Tasty enough.' : 'A little burnt, but food is food.'}</div>
            <div className="text-sm opacity-80 mt-1">{wrong ? `${wrong} wrong ingredient${wrong > 1 ? 's' : ''}. ` : ''}{burn ? `${burn} stir miss${burn > 1 ? 'es' : ''}. ` : ''}You {spend ? `spent ₦${spend.toLocaleString()} on ingredients and ` : ''}ate well.</div>
            <button className="btn btn-primary w-full mt-3" onClick={() => onDone(quality, spend)}>Finish ▶</button>
          </div>
        )}
      </div>
    </>
  )
}
