// A real conversation: both characters face each other and speak in bubbles. Your replies shape the bond.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import { buildConversation, groupOf, scoreOf, type Exchange, type Setting, type Tone } from '@content/dialogue'
import { audio } from '@platform/audio'
import { track } from '@platform/analytics'

const GREET: Record<string, string> = { friend: 'Hey! Long time!', partner: 'Hey you. 😊', mother: 'Welcome, my child.', father: 'Good to see you.', sibling: 'Oh, it is you.', child: 'Yaaay!', boss: 'Good day. Come in.' }
const TONE: Record<Tone, string> = { warm: '💚 Warm', funny: '😂 Funny', meh: '😐 Flat' }

export interface Partner { id: string; name: string }

export function TalkTask({ r, partner, role, setting, rounds, title, greet, script, onDone }: { r: WorldRenderer; partner: Partner; role: string; setting: Setting; rounds: number; title: string; greet?: string; script?: Exchange[]; onDone: (perf: number) => void }) {
  const convo = useMemo<Exchange[]>(() => script ?? buildConversation(role, setting, rounds), [role, setting, rounds, script])
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState<'greet' | 'ask' | 'wait' | 'end'>('greet')
  const [last, setLast] = useState<{ tone: Tone } | null>(null)
  const scores = useRef<number[]>([])
  const alive = useRef(true)
  const g = groupOf(role)

  useEffect(() => {
    alive.current = true
    r.setFrozen(true)
    const a = r.npcPos(partner.id) ?? r.actorPos(partner.id) ?? { x: r.position.x + 1.6, z: r.position.z }
    const me = r.position
    let dx = me.x - a.x, dz = me.z - a.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d
    r.placePlayer(a.x + dx * 1.7, a.z + dz * 1.7, Math.atan2(-dx, -dz))
    const mx = a.x + dx * 0.85, mz = a.z + dz * 0.85
    r.setCameraOverride({ pos: [mx, 8, mz + 11], look: [mx, 1.9, mz], shift: 0.2 })
    return () => { alive.current = false; r.setCameraOverride(null); r.setFrozen(false) }
  }, [r, partner.id])

  // both of you speak first: a greeting each way, then the conversation starts
  useEffect(() => {
    const hi = greet ?? GREET[g] ?? 'Hello!'
    r.say('player', `Hi ${partner.name}!`, 2.6)
    const a = setTimeout(() => { if (alive.current) r.say(partner.id, hi, 2.6) }, 1500)
    const b = setTimeout(() => { if (alive.current) setPhase('ask') }, 3300)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])
  useEffect(() => { if (phase === 'ask' && convo[i]) r.say(partner.id, convo[i].npc, 60) }, [i, phase])

  const choose = (k: number) => {
    const ex = convo[i], o = ex.options[k]
    audio.sfx(o.tone === 'meh' ? 'bad' : 'good'); track('conversation_choice', { tone: o.tone, role, setting })
    scores.current.push(scoreOf(o.tone, g)); setLast({ tone: o.tone }); setPhase('wait')
    r.say('player', o.text, 4)
    setTimeout(() => { if (alive.current) r.say(partner.id, o.reply, 4) }, 1600)
    setTimeout(() => { if (!alive.current) return; if (i + 1 >= convo.length) setPhase('end'); else { setI(i + 1); setPhase('ask') } }, 4000)
  }

  const perf = scores.current.length ? scores.current.reduce((a, b) => a + b, 0) / scores.current.length : 0.5
  const ex = convo[i]
  const order = useMemo(() => (ex ? [0, 1, 2].sort(() => Math.random() - 0.5) : []), [i])
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl" style={{ background: '#14121ff2', borderTop: '2px solid #ffffff22' }}>
      <div className="flex items-center justify-between text-[11px] font-black opacity-80 mb-1"><span>💬 {title} · {Math.min(i + 1, convo.length)}/{convo.length}</span>{last && <span>{TONE[last.tone]}</span>}</div>
      {phase === 'ask' && ex && (
        <>
          <div className="text-xs opacity-70 mb-1.5">{partner.name} says: “{ex.npc}”</div>
          <div className="grid gap-1.5">{order.map((k, i) => <button key={k} className="card-btn !py-2 flex items-center gap-2.5" onClick={() => choose(k)}><span className="grid place-items-center w-7 h-7 rounded-full shrink-0 font-display text-sm" style={{ background: 'var(--gold)', color: '#3b2300' }}>{'ABCD'[i]}</span><span className="font-bold text-sm">{ex.options[k].text}</span></button>)}</div>
        </>
      )}
      {(phase === 'wait' || phase === 'greet') && <div className="text-sm opacity-80 py-3 text-center">{phase === 'greet' ? 'Saying hello…' : '…'}</div>}
      {phase === 'end' && (
        <div className="pop">
          <div className="font-display text-2xl text-danfo">{perf >= 0.8 ? 'What a lovely time together!' : perf >= 0.5 ? 'A nice, easy conversation.' : 'A little awkward, but you showed up.'}</div>
          <div className="bar mt-2"><i style={{ width: `${Math.round(perf * 100)}%`, background: '#ff7ab8' }} /></div>
          <button className="btn btn-primary w-full mt-3" onClick={() => onDone(perf)}>Done ▶</button>
        </div>
      )}
    </div>
  )
}
