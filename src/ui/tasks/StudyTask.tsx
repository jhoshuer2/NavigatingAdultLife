// Study as a real scene: sit in a classroom while the teacher writes questions on the board, or study alone.
import { useEffect, useRef, useState } from 'react'
import { useGame } from '../../store'
import type { WorldRenderer } from '../../world/WorldRenderer'
import { audio } from '@platform/audio'

export type StudyMode = 'class' | 'library' | 'desk'

const wrap = (t: string, n = 30) => { const out: string[] = []; let cur = ''; for (const w of t.split(' ')) { const x = cur ? `${cur} ${w}` : w; if (x.length > n && cur) { out.push(cur); cur = w } else cur = x } if (cur) out.push(cur); return out.slice(0, 4) }
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const STUDENTS = ['s1', 's2', 's3', 's4', 's5', 'f2']
const TIME = 25

export function StudyTask({ r, mode, onDone }: { r: WorldRenderer; mode: StudyMode; onDone: () => void }) {
  const life = useGame((s) => s.life)
  const fb = useGame((s) => s.quizFeedback)
  const answer = useGame((s) => s.answer)
  const clearQuiz = useGame((s) => s.clearQuiz)
  const quiz = life?.quiz
  const q = fb ? fb.q : quiz?.questions[quiz.index]
  const [left, setLeft] = useState(TIME)
  const shownId = useRef<string | null>(null)
  const done = useRef(false)

  // stage the scene once
  useEffect(() => {
    r.setFrozen(true); r.setSitting(true)
    if (mode === 'class') { r.placePlayer(-1.5, 0.05, Math.PI); r.setCameraOverride({ pos: [-1.5, 10.5, 13.5], look: [-0.8, 1.0, -2.6], shift: 0.2 }) }
    else if (mode === 'library') { r.placePlayer(4.5, -3.0, Math.PI); r.setCameraOverride({ pos: [4.5, 9.5, 9.0], look: [4.5, 0.8, -3.4], shift: 0.2 }) }
    else { r.placePlayer(-8.65, -0.1, Math.PI); r.setCameraOverride({ pos: [-6.8, 9.0, 9.5], look: [-8.6, 0.8, -1.0], shift: 0.2 }) }
    return () => { r.setSitting(false); r.setFrozen(false); r.setCameraOverride(null); r.setBoard(['Class is in session', 'Sit down and open your books']) }
  }, [r, mode])

  // a new question: write it on the board, the class reacts
  useEffect(() => {
    if (!q || fb || shownId.current === q.id) return
    shownId.current = q.id; setLeft(TIME)
    if (mode === 'class') {
      r.setBoard([q.subject.toUpperCase(), ...wrap(q.q, 34).slice(0, 3)])
      r.say('teacher', pick(['Copy this down and answer quickly!', 'Who can answer this one?', 'Pens up. Eyes on the board!']), 4)
      setTimeout(() => r.say(pick(STUDENTS), pick(['✋ Sir, sir!', 'Ehh, I know this one!', 'I did not read o…', 'Please repeat the question?']), 3), 900)
    } else r.say('player', pick(['Okay, let me think…', 'Hmm, interesting one.', '📖 Reading…']), 2.5)
  }, [q, fb, mode, r])

  // countdown in class
  useEffect(() => {
    if (mode !== 'class' || fb || !quiz) return
    const t = setInterval(() => setLeft((v) => v - 1), 1000)
    return () => clearInterval(t)
  }, [mode, fb, quiz?.index])
  useEffect(() => { if (mode === 'class' && !fb && quiz && left <= 0) { r.say('teacher', 'Time up! Next time, faster.', 3); answer(-1) } }, [left])

  // react to the answer
  useEffect(() => {
    if (!fb) return
    if (fb.correct) { r.say('teacher', pick(['Correct! Well done.', 'Very good! Sit up straight.', 'Excellent. A gold star for you.']), 3.2); setTimeout(() => r.say(pick(STUDENTS), '👏', 2), 500) }
    else { r.say('teacher', pick(['Not quite. Read again.', 'Hmm. See me after class.', 'Close, but no.']), 3.2); setTimeout(() => r.say(pick(STUDENTS), '😬', 2), 500) }
  }, [fb])

  // finished
  useEffect(() => { if (!quiz && !fb && !done.current && shownId.current) { done.current = true; onDone() } }, [quiz, fb])

  if (!life || !q) return null
  const total = quiz?.questions.length ?? 3
  const idx = quiz ? quiz.index + 1 : total
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 px-3 pt-3 pb-4 safe-pad rounded-t-3xl" style={{ background: '#14121ff2', borderTop: '2px solid #ffffff22' }}>
      <div className="flex items-center justify-between text-[11px] font-black opacity-80 mb-1">
        <span>{mode === 'class' ? '🧑‍🏫 CLASSROOM' : mode === 'library' ? '📖 LIBRARY' : '📚 AT YOUR DESK'} · {q.subject.toUpperCase()} · {Math.min(idx, total)}/{total}</span>
        {mode === 'class' && !fb && <span style={{ color: left <= 8 ? '#ff6b5e' : undefined }}>⏱ {Math.max(0, left)}s</span>}
      </div>
      {mode === 'class' && !fb && <div className="bar mb-2"><i style={{ width: `${Math.max(0, left) / TIME * 100}%`, background: left <= 8 ? '#ff6b5e' : '#ffd23f' }} /></div>}
      <p className="font-bold leading-snug mb-2">{q.q}</p>
      <div className="grid gap-1.5">
        {q.options.map((o, i) => {
          const picked = fb && fb.picked === i, right = fb && q.answer === i
          return (
            <button key={i} className="card-btn !py-2 flex items-center gap-2.5" disabled={!!fb} onClick={() => { audio.sfx('click'); answer(i) }}
              style={fb ? { borderColor: right ? '#2fd27b' : picked ? '#ff6b5e' : undefined, background: right ? '#1d5a3a' : picked ? '#5a1f24' : undefined, opacity: 1 } : undefined}>
              <span className="grid place-items-center w-7 h-7 rounded-full shrink-0 font-display text-sm bg-white/15">{'ABCD'[i]}</span><span className="font-bold text-sm">{o}</span>
            </button>
          )
        })}
      </div>
      {fb && (
        <div className="mt-2 pop">
          <div className="card p-2 text-sm">{fb.correct ? '✅ ' : '❌ '}{fb.funny ?? (fb.correct ? '+Knowledge' : 'It happens to the best of us.')}</div>
          <button className="btn btn-primary w-full mt-2" onClick={clearQuiz}>{fb.last ? 'Finish ▶' : 'Next question ▶'}</button>
        </div>
      )}
    </div>
  )
}
