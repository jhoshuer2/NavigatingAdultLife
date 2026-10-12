// A service in the place of worship: join the song (clap in time), listen to the message, give an offering.
// Deliberately faith-neutral wording; 🚩 cultural review welcome.
import { useEffect, useRef, useState } from 'react'
import type { WorldRenderer } from '../../world/WorldRenderer'
import { audio } from '@platform/audio'

const BEATS = 8
const LESSONS = [
  { say: 'A good name is better than riches. Treat your neighbour as you want to be treated.', q: 'What does the message ask of us?', o: ['Be kind and fair to our neighbours', 'Only look after ourselves', 'Avoid people we disagree with'], a: 0 },
  { say: 'Patience is a strength. The one who waits and works will see the harvest.', q: 'What is the message about?', o: ['Rushing ahead of everyone', 'Patience and steady work', 'Giving up quickly'], a: 1 },
  { say: 'Forgive, and you free yourself. Anger is a heavy load to carry alone.', q: 'What should we do with anger?', o: ['Keep it for later', 'Spread it around', 'Let it go and forgive'], a: 2 },
  { say: 'No one is an island. When a neighbour is hungry, share what you have.', q: 'What does the message teach?', o: ['Share with those in need', 'Keep your blessings hidden', 'Wait for others to give first'], a: 0 },
]
const SONGS = ['🎶 Sing it out!', '👏 Clap, clap!', '🎵 Oh, oh, oh!', '🎶 Raise your voices!']
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

type Phase = 'intro' | 'song' | 'message' | 'quiz' | 'offering' | 'end'

export function WorshipTask({ r, cash, onDone }: { r: WorldRenderer; cash: number; onDone: (perf: number, donation: number) => void }) {
  const lesson = useRef(pick(LESSONS)).current
  const [phase, setPhase] = useState<Phase>('intro')
  const [beat, setBeat] = useState(0)
  const [hits, setHits] = useState(0)
  const [mark, setMark] = useState(0)
  const [flash, setFlash] = useState('')
  const [right, setRight] = useState<boolean | null>(null)
  const [gift, setGift] = useState(0)
  const clapped = useRef(false)
  const t0 = useRef(0)

  useEffect(() => {
    r.setFrozen(true); r.setSitting(true)
    r.placePlayer(2.0, -0.8, Math.PI)
    r.setCameraOverride({ pos: [0.4, 13.5, 13], look: [0.2, 1.0, -1.6], shift: 0.2 })
    r.say('elder', 'Welcome, everyone. Let us begin.', 4)
    return () => { r.setSitting(false); r.setFrozen(false); r.setCameraOverride(null) }
  }, [r])

  // song: a marker sweeps across; clap when it is inside the glowing zone
  useEffect(() => {
    if (phase !== 'song') return
    let raf = 0, b = 0
    const PERIOD = 1500
    t0.current = performance.now(); clapped.current = false
    const loop = (now: number) => {
      const p = ((now - t0.current) % PERIOD) / PERIOD
      setMark(p)
      const nb = Math.floor((now - t0.current) / PERIOD)
      if (nb !== b) { b = nb; clapped.current = false; if (nb >= BEATS) { setPhase('message'); return } setBeat(nb); r.say(pick(['m1', 'm2', 'm3', 'm4', 'm5']), pick(SONGS), 1.4) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  useEffect(() => { if (phase === 'message') { r.say('elder', lesson.say, 9); const t = setTimeout(() => setPhase('quiz'), 4200); return () => clearTimeout(t) } }, [phase])

  const clap = () => {
    if (phase !== 'song' || clapped.current) return
    clapped.current = true
    const p = ((performance.now() - t0.current) % 1500) / 1500
    if (Math.abs(p - 0.5) < 0.12) { setHits((h) => h + 1); setFlash('👏 In time!'); audio.sfx('good'); r.say('player', '👏', 0.8) } else { setFlash(p < 0.5 ? 'Too early' : 'Too late'); audio.sfx('bad') }
  }
  const answer = (i: number) => {
    const ok = i === lesson.a; setRight(ok); audio.sfx(ok ? 'good' : 'bad')
    r.say('elder', ok ? 'Well said, my child.' : 'Think on it a little more.', 3)
    setTimeout(() => setPhase('offering'), 1400)
  }
  const give = (amt: number) => {
    setGift(amt); r.say('player', amt ? '🙏 God bless.' : '🙏', 2); r.say('m3', 'Peace be with you.', 3); setTimeout(() => setPhase('end'), 1100)
  }
  const perf = Math.min(1, (hits / BEATS) * 0.5 + (right ? 0.5 : 0.15))
  const opts = [0, 200, 1000, 5000].filter((a) => a === 0 || a <= cash)
  return (
    <>
      <div className="absolute top-2 left-2 right-2 z-30 pointer-events-none">
        <div className="card px-3 py-2 flex items-center justify-between" style={{ background: '#1e1a30ee' }}>
          <b className="font-display text-2xl text-danfo">🕊️ Service</b>
          <span className="font-black text-sm">{phase === 'song' ? `Song ${Math.min(beat + 1, BEATS)}/${BEATS} · 👏 ${hits}` : phase === 'message' || phase === 'quiz' ? 'The message' : phase === 'offering' ? 'Offering' : ''}</span>
          {phase !== 'end' && <button className="chip pointer-events-auto" onClick={() => onDone(0.3, 0)}>✖ Leave</button>}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl" style={{ background: '#14121ff2', borderTop: '2px solid #ffffff22' }}>
        {phase === 'intro' && (<div><div className="font-display text-2xl text-danfo">Take a seat</div><div className="text-sm opacity-80 mt-1">The service has three parts: a song (clap in time), a short message, and an offering. Everyone is welcome.</div><button className="btn btn-primary w-full mt-3" onClick={() => setPhase('song')}>Begin ▶</button></div>)}
        {phase === 'song' && (
          <div>
            <div className="text-xs font-bold opacity-80 mb-1.5">Tap Clap when the marker is inside the green zone {flash && <span className="ml-2 text-yellow-300">{flash}</span>}</div>
            <div className="relative h-8 rounded-full overflow-hidden mb-2" style={{ background: '#2a2540' }}>
              <div className="absolute top-0 bottom-0" style={{ left: '38%', width: '24%', background: '#2fd27b66' }} />
              <div className="absolute top-0 bottom-0 w-2 rounded" style={{ left: `${mark * 100}%`, background: '#ffd23f' }} />
            </div>
            <button className="btn btn-primary w-full !text-xl !min-h-14" onPointerDown={clap}>👏 Clap</button>
          </div>
        )}
        {phase === 'message' && (<div><div className="font-display text-2xl text-danfo">The message</div><div className="text-sm opacity-90 mt-1 leading-snug">“{lesson.say}”</div></div>)}
        {phase === 'quiz' && (
          <div>
            <div className="font-bold mb-2">{lesson.q}</div>
            <div className="grid gap-1.5">{lesson.o.map((o, i) => <button key={i} className="card-btn !py-2 flex items-center gap-2.5" disabled={right !== null} onClick={() => answer(i)} style={right !== null ? { borderColor: i === lesson.a ? '#2bd978' : undefined, opacity: 1 } : undefined}><span className="grid place-items-center w-7 h-7 rounded-full shrink-0 font-display text-sm" style={{ background: 'var(--gold)', color: '#3b2300' }}>{'ABCD'[i]}</span><span className="font-bold text-sm">{o}</span></button>)}</div>
          </div>
        )}
        {phase === 'offering' && (
          <div>
            <div className="font-bold mb-1">Offering</div>
            <div className="text-xs opacity-75 mb-2">Give what you are able. Giving is optional and nobody is watching your hand.</div>
            <div className="grid grid-cols-2 gap-2">{opts.map((a) => <button key={a} className="tile !min-h-[60px]" onClick={() => give(a)}><span className="font-display">{a === 0 ? '🙏 None' : `₦${a.toLocaleString()}`}</span></button>)}</div>
          </div>
        )}
        {phase === 'end' && (
          <div className="pop">
            <div className="font-display text-3xl text-danfo">Peace be with you</div>
            <div className="text-sm opacity-80 mt-1">You clapped in time {hits}/{BEATS} times{right ? ' and understood the message' : ''}{gift ? `, and gave ₦${gift.toLocaleString()}` : ''}. People greet you on the way out.</div>
            <button className="btn btn-primary w-full mt-3" onClick={() => onDone(perf, gift)}>Finish ▶</button>
          </div>
        )}
      </div>
    </>
  )
}
