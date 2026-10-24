// Navigating Adult Life 2.0 screens: Home (S1), the level intro with character pick (S4) and the level result (S7).
import { useEffect, useRef, useState } from 'react'
import { useGame } from '../../store'
import { Portrait } from '../Portrait'
import { Confetti } from '../components'
import { audio } from '@platform/audio'
import { ZURI, NAVI, BABA_TUNDE, MAMA_FOLAKE, PLAYABLE } from '../../world/castData'
import { progressOf, chapterState, type CharacterId } from '../../levels/progress'
import { CHAPTER1, LEVELS } from '../../levels/chapter1'
import { CHAPTERS } from '../../levels/chapters'
import { track } from '@platform/analytics'

import { INK, CREAM, ORANGE, FOREST, YELLOW } from '../theme'
export { INK, CREAM, ORANGE, FOREST, YELLOW }

export function V2Btn({ children, onClick, tone = 'orange', className = '', disabled }: { children: React.ReactNode; onClick?: () => void; tone?: 'orange' | 'green' | 'cream'; className?: string; disabled?: boolean }) {
  const bg = tone === 'orange' ? ORANGE : tone === 'green' ? FOREST : CREAM
  return (
    <button disabled={disabled} onClick={() => { audio.sfx('click'); onClick?.() }} className={`inline-flex items-center justify-center gap-2 font-display text-xl rounded-2xl px-6 min-h-14 active:translate-y-1 transition-transform disabled:opacity-50 ${className}`}
      style={{ background: bg, color: tone === 'cream' ? INK : '#fff', border: `3px solid ${INK}`, boxShadow: `0 5px 0 ${INK}` }}>{children}</button>
  )
}

export const charSpec = (c: CharacterId | null) => (c === 'navi' ? NAVI : ZURI)

function Shell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`screen flex flex-col ${className}`} style={{ background: CREAM, color: INK }}>{children}</div>
}

export function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-extrabold" style={{ background: '#fff8', border: `2px solid ${INK}` }}>{children}</span>
}

export function Home() {
  const { meta, go } = useGame()
  const p = progressOf(meta)
  const inProgress = p.task > 0
  const doneLevels = Object.keys(p.stars).length
  return (
    <Shell>
      <header className="flex items-center justify-between px-4 pt-4" style={{ paddingTop: 'calc(1rem + var(--safe-t))' }}>
        <div className="flex gap-2"><Pill>⭐ {p.points} points</Pill><Pill>🪙 {p.coins}</Pill></div>
        <button aria-label="Settings" className="grid place-items-center w-11 h-11 rounded-full text-xl" style={{ background: '#fff8', border: `2px solid ${INK}` }} onClick={() => go('settings')}>⚙</button>
      </header>
      <div className="px-5 pt-4 text-center">
        <div className="text-[13px] font-extrabold tracking-[.2em] uppercase opacity-70">Navigating</div>
        <h1 className="font-display leading-[.9]" style={{ fontSize: 'clamp(46px, 14vw, 72px)', color: ORANGE, WebkitTextStroke: `2px ${INK}` }}>ADULT LIFE</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 grid gap-4 content-start max-w-xl w-full mx-auto">
        <section className="rounded-3xl p-4 relative overflow-hidden" style={{ background: FOREST, color: '#fff', border: `3px solid ${INK}`, boxShadow: `0 6px 0 ${INK}` }}>
          <div className="text-xs font-extrabold tracking-[.18em] uppercase" style={{ color: YELLOW }}>Story</div>
          <h2 className="font-display text-3xl leading-none mt-1 pr-24">Chapters</h2>
          <p className="text-sm opacity-90 mt-1 max-w-[16rem]">Live a role for a day. One chapter at a time.</p>
          <div className="mt-3 text-sm font-extrabold">{inProgress ? `Chapter 1 · task ${p.task + 1} of 4` : `${doneLevels} of ${CHAPTER1.totalLevels} levels done`} · 1 of {CHAPTERS.length} chapters open</div>
          <div className="mt-2 h-2.5 rounded-full overflow-hidden" style={{ background: '#0004' }}><div className="h-full" style={{ width: `${(doneLevels / CHAPTER1.totalLevels) * 100}%`, background: YELLOW }} /></div>
          <div className="absolute right-2 top-3 flex -space-x-5 pointer-events-none"><Portrait spec={p.character === 'navi' ? NAVI : ZURI} expression="happy" size={84} /><Portrait spec={BABA_TUNDE} expression="proud" size={84} /></div>
          <V2Btn className="mt-4 w-full" onClick={() => { audio.unlock(); audio.playMusic('menu'); go('chapters') }}>Choose chapter</V2Btn>
        </section>
        <section className="rounded-3xl p-4 relative overflow-hidden" style={{ background: ORANGE, color: '#fff', border: `3px solid ${INK}`, boxShadow: `0 6px 0 ${INK}` }}>
          <div className="text-xs font-extrabold tracking-[.18em] uppercase" style={{ color: INK }}>Quick game</div>
          <h2 className="font-display text-3xl leading-none mt-1">The Rush</h2>
          <p className="text-sm mt-1 max-w-[15rem]">Run, jump, dodge. Race Alfred, or a real player when one is online.</p>
          <div className="mt-2 text-sm font-extrabold">Best: {p.rush.best} m · {p.rush.points} points</div>
          <div className="absolute right-3 top-3 pointer-events-none"><Portrait spec={MAMA_FOLAKE} expression="cheeky" size={84} /></div>
          <V2Btn tone="cream" className="mt-4 w-full" onClick={() => go('rushLobby')}>Play</V2Btn>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <V2Btn tone="cream" onClick={() => go('leaderboard')}>🏆 Leaderboard</V2Btn>
          <V2Btn tone="cream" onClick={() => go('achievements')}>🙂 Profile</V2Btn>
        </div>
      </div>
    </Shell>
  )
}

export function LevelIntro() {
  const { meta, go, openLevel, chooseCharacter, saveProgress } = useGame()
  const p = progressOf(meta)
  const level = LEVELS[p.level] ?? LEVELS['ch1.l1']
  const chosen = p.character
  const resume = p.task > 0
  const go1 = (task: number) => { audio.unlock(); if (task > 0) track('session_resume', { level: level.id, task }); openLevel(task) }
  return (
    <Shell>
      <header className="px-4 pt-4" style={{ paddingTop: 'calc(1rem + var(--safe-t))' }}><button className="font-extrabold underline" onClick={() => go('chapters')}>← Chapters</button></header>
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-3 max-w-xl w-full mx-auto grid content-start gap-4">
        <div className="text-center">
          <div className="text-sm font-extrabold tracking-[.2em] uppercase" style={{ color: ORANGE }}>Chapter 1 · {CHAPTER1.title}</div>
          <h1 className="font-display text-5xl leading-[.95] mt-1">{level.subtitle}<br />{level.title}</h1>
        </div>
        <p className="text-center text-lg font-semibold">{level.intro}</p>
        <div className="rounded-3xl p-4" style={{ background: '#fff8', border: `3px solid ${INK}` }}>
          <div className="font-display text-2xl text-center">{chosen ? 'Your character' : 'Who are you today?'}</div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {PLAYABLE.map((c) => {
              const id = c.id as CharacterId, on = chosen === id
              return (
                <button key={id} className="rounded-2xl p-2 grid justify-items-center active:translate-y-0.5" onClick={() => { audio.sfx('pop'); chooseCharacter(id) }}
                  style={{ background: on ? YELLOW : '#fff', border: `3px solid ${INK}`, boxShadow: on ? `0 4px 0 ${INK}` : 'none' }}>
                  <Portrait spec={c} expression={on ? 'happy' : 'neutral'} size={96} />
                  <b className="font-display text-2xl">{c.name}</b><span className="text-xs font-bold opacity-70">{id === 'zuri' ? '22 · up for anything' : '24 · stays calm, mostly'}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="grid gap-2">
          {resume ? (<>
            <V2Btn disabled={!chosen} onClick={() => go1(p.task)}>Continue: task {p.task + 1} of {level.tasks.length}</V2Btn>
            <V2Btn tone="cream" disabled={!chosen} onClick={() => { saveProgress({ ...p, task: 0 }); go1(0) }}>Start the level again</V2Btn>
          </>) : <V2Btn disabled={!chosen} onClick={() => go1(0)}>{chosen ? "Let's go" : 'Pick a character'}</V2Btn>}
        </div>
      </div>
    </Shell>
  )
}

export function LevelResult() {
  const { lastLevel: r, meta, go, openLevel } = useGame()
  const p = progressOf(meta)
  const level = LEVELS[r?.levelId ?? 'ch1.l1']
  if (!r) return <Shell><V2Btn onClick={() => go('home')}>Home</V2Btn></Shell>
  const itemName = r.item ? r.item.replace('powerbank', 'power bank') : null
  return (
    <Shell>
      <Confetti n={r.stars * 14} />
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-6 max-w-xl w-full mx-auto grid content-start gap-4 text-center">
        <div className="text-sm font-extrabold tracking-[.2em] uppercase" style={{ color: ORANGE }}>{level.subtitle} complete</div>
        <h1 className="font-display text-5xl leading-[.95]">{level.title}</h1>
        <div className="text-6xl tracking-widest" aria-label={`${r.stars} stars`}>{[1, 2, 3].map((i) => <span key={i} style={{ opacity: i <= r.stars ? 1 : 0.2 }}>⭐</span>)}</div>
        <div className="flex justify-center gap-6 font-bold">
          <div><div className="font-display text-3xl">{Math.floor(r.seconds / 60)}:{String(r.seconds % 60).padStart(2, '0')}</div>time</div>
          <div><div className="font-display text-3xl">{r.mistakes}</div>mistakes</div>
          <div><div className="font-display text-3xl">{r.hints}</div>hints</div>
        </div>
        <div className="rounded-2xl p-3 text-left text-sm font-semibold" style={{ background: '#fff8', border: `2px solid ${INK}` }}>
          {level.starRules.map((t, i) => <div key={i} style={{ opacity: i < r.stars ? 1 : 0.5 }}>{'⭐'.repeat(i + 1)} {t}</div>)}
        </div>
        <div className="flex justify-center gap-3"><Pill>⭐ {p.points} points{r.points ? ` (+${r.points})` : ''}</Pill><Pill>🪙 {p.coins} coins</Pill></div>
        <div className="flex items-center gap-3 rounded-2xl p-3 text-left" style={{ background: FOREST, color: '#fff', border: `3px solid ${INK}` }}>
          <Portrait spec={BABA_TUNDE} expression="surprised" size={72} />
          <div className="text-sm font-semibold">Baba Tunde: "Look at the street... something has changed out here."<div className="opacity-80 mt-1">{itemName ? `You took the ${itemName}. It will matter in Level 2.` : 'You travelled light. That will matter in Level 2.'}</div></div>
        </div>
        <Feedback levelId={r.levelId} />
        <div className="grid gap-2">
          <V2Btn disabled>Level 2 · coming soon</V2Btn>
          <V2Btn tone="cream" onClick={() => { useGame.getState().saveProgress({ ...p, task: 0 }); openLevel(0) }}>Play Level 1 again</V2Btn>
          <V2Btn tone="cream" onClick={() => go('home')}>Home</V2Btn>
        </div>
      </div>
    </Shell>
  )
}

export function Leaderboard() {
  const { meta, go } = useGame()
  const p = progressOf(meta)
  const spec = charSpec(p.character)
  const stars = Object.values(p.stars).reduce((a, b) => a + b, 0)
  return (
    <Shell>
      <header className="px-4 pt-4" style={{ paddingTop: 'calc(1rem + var(--safe-t))' }}><button className="font-extrabold underline" onClick={() => go('home')}>← Home</button></header>
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-3 max-w-xl w-full mx-auto grid content-start gap-4">
        <h1 className="font-display text-5xl text-center">Leaderboard</h1>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl py-2 text-center font-display text-xl" style={{ background: YELLOW, border: `3px solid ${INK}` }}>Local</div>
          <div className="rounded-2xl py-2 text-center font-display text-xl opacity-50" style={{ background: '#fff8', border: `3px solid ${INK}` }}>Global · soon</div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl p-3" style={{ background: '#fff', border: `3px solid ${INK}` }}>
          <span className="font-display text-3xl w-8 text-center">1</span>
          <Portrait spec={spec} expression="proud" size={64} />
          <div className="flex-1"><div className="font-display text-2xl leading-none">{spec.name} (you)</div><div className="text-sm font-bold opacity-70">{stars} stars · Rush best {p.rush.best} m</div></div>
          <div className="text-right"><div className="font-display text-3xl leading-none">{p.points}</div><div className="text-xs font-bold">points</div></div>
        </div>
        <p className="text-sm font-semibold opacity-80 text-center">The local board shows the players on this device. Global ranking needs the online service and is not built yet; points on this device will count when it is.</p>
      </div>
    </Shell>
  )
}

const ISSUES = [['controls', 'Controls'], ['what', 'What to do'], ['camera', 'Camera'], ['slow', 'Too slow']] as const
/** One tap rating after the level, plus what confused them. No free text, so nothing personal is ever sent. */
function Feedback({ levelId }: { levelId: string }) {
  const [rating, setRating] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const send = (issue: string) => { track('level_feedback', { level: levelId, rating: rating ?? 'okay', issue }); setSent(true) }
  if (sent) return <div className="font-bold text-sm">Thank you. That helps us fix it.</div>
  return (
    <div className="rounded-2xl p-3" style={{ background: '#fff8', border: `2px solid ${INK}` }}>
      <div className="font-display text-xl">How was it?</div>
      {!rating ? (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {([['loved', '😍 Loved it'], ['okay', '🙂 Okay'], ['confusing', '😕 Confusing']] as const).map(([k, l]) => (
            <button key={k} className="rounded-xl py-2 text-sm font-extrabold active:translate-y-0.5" style={{ background: '#fff', border: `2px solid ${INK}` }} onClick={() => { audio.sfx('pop'); setRating(k); if (k === 'loved') { track('level_feedback', { level: levelId, rating: k, issue: 'none' }); setSent(true) } }}>{l}</button>
          ))}
        </div>
      ) : (
        <div className="mt-2"><div className="text-sm font-bold">What got in the way?</div>
          <div className="grid grid-cols-2 gap-2 mt-1">{ISSUES.map(([k, l]) => <button key={k} className="rounded-xl py-2 text-sm font-extrabold" style={{ background: '#fff', border: `2px solid ${INK}` }} onClick={() => send(k)}>{l}</button>)}</div>
          <button className="text-xs font-bold underline mt-2" onClick={() => send('none')}>Nothing, skip</button></div>
      )}
    </div>
  )
}

/** Chapter select: one tall card per chapter in a sideways row. The open chapter has its Start button, the rest are dimmed with a lock. */
export function Chapters() {
  const { meta, go } = useGame()
  const p = progressOf(meta)
  const unlockAll = typeof location !== 'undefined' && location.search.includes('debug=1') && location.search.includes('unlockall=1')
  const row = useRef<HTMLDivElement>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [shake, setShake] = useState<number | null>(null)
  const inProgress = p.task > 0
  const doneLevels = Object.keys(p.stars).length
  const [at, setAt] = useState(0)
  useEffect(() => { const el = row.current; if (!el) return; const on = () => setAt(Math.round(el.scrollLeft / (el.clientWidth * 0.72))); el.addEventListener('scroll', on, { passive: true }); return () => el.removeEventListener('scroll', on) }, [])
  const label = p.character === null ? 'Start' : inProgress ? 'Continue' : doneLevels > 0 ? 'Play again' : 'Start'
  const tapLocked = (i: number) => { audio.sfx('bad'); setShake(i); setHint(`Finish Chapter ${i} to unlock Chapter ${i + 1}.`); window.setTimeout(() => setShake(null), 400); window.setTimeout(() => setHint(null), 2400) }
  return (
    <Shell>
      <header className="flex items-center justify-between px-4 pt-4" style={{ paddingTop: 'calc(1rem + var(--safe-t))' }}>
        <button className="font-extrabold underline" onClick={() => go('home')}>← Home</button>
        <Pill>⭐ {p.points} points</Pill>
      </header>
      <div className="px-5 pt-3"><h1 className="font-display text-5xl leading-none">Chapters</h1><p className="text-sm font-bold opacity-70 mt-1">Finish a chapter to open the next one.</p></div>
      <div ref={row} className="flex gap-4 overflow-x-auto px-5 py-5 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
        {CHAPTERS.map((c, i) => {
          const st = chapterState(p, CHAPTERS, i, unlockAll)
          const locked = st === 'locked'
          const lvDone = c.levels.filter((l) => (p.stars[l] ?? 0) > 0).length
          return (
            <article key={c.id} onClick={() => locked && tapLocked(i)} className={`snap-start shrink-0 rounded-3xl overflow-hidden flex flex-col ${shake === i ? 'shake' : ''}`}
              style={{ width: '72%', maxWidth: 300, background: locked ? '#e4d7bb' : '#fffaf0', border: `3px solid ${INK}`, boxShadow: `0 6px 0 ${INK}`, opacity: locked ? 0.7 : 1, minHeight: 440 }}>
              <div className="relative h-44 grid place-items-center" style={{ background: locked ? '#bdb29a' : i === 0 ? FOREST : ORANGE, filter: locked ? 'grayscale(.6)' : 'none' }}>
                {c.built ? <div className="flex -space-x-5"><Portrait spec={p.character === 'navi' ? NAVI : ZURI} expression="happy" size={104} /><Portrait spec={BABA_TUNDE} expression="proud" size={104} /></div>
                  : <div className="font-display text-7xl opacity-60" style={{ color: INK }}>{c.number}</div>}
                {locked && <span className="absolute top-2 right-2 grid place-items-center w-10 h-10 rounded-full text-xl" style={{ background: CREAM, border: `3px solid ${INK}` }} aria-label="Locked">🔒</span>}
                {st === 'done' && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-extrabold" style={{ background: YELLOW, border: `2px solid ${INK}` }}>DONE</span>}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs font-extrabold tracking-[.18em] uppercase" style={{ color: ORANGE }}>Chapter {c.number}</div>
                <h2 className="font-display text-3xl leading-none mt-1">{c.title}</h2>
                <p className="text-sm font-semibold opacity-80 mt-2">{c.blurb}</p>
                <div className="mt-auto pt-3">
                  <div className="text-xs font-extrabold">{c.built ? `${lvDone} of ${c.totalLevels} levels` : `${c.totalLevels} levels`}</div>
                  <div className="mt-1 h-2 rounded-full overflow-hidden" style={{ background: '#0002' }}><div className="h-full" style={{ width: `${(lvDone / c.totalLevels) * 100}%`, background: FOREST }} /></div>
                  {locked ? <div className="mt-3 text-center text-sm font-extrabold opacity-80">🔒 Finish Chapter {c.number - 1} to unlock</div>
                    : c.built ? <V2Btn className="mt-3 w-full" onClick={() => { audio.unlock(); go('levelIntro') }}>{label}</V2Btn>
                    : <V2Btn className="mt-3 w-full" disabled>Coming soon</V2Btn>}
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <div className="flex justify-center gap-1.5 pb-2" aria-hidden="true">{CHAPTERS.map((c, i) => <span key={c.id} className="w-2.5 h-2.5 rounded-full" style={{ background: i === at ? INK : '#0003' }} />)}</div>
      {hint && <div className="fixed inset-x-0 bottom-8 flex justify-center pointer-events-none"><div className="fade-in rounded-full px-4 py-2 font-extrabold text-sm" style={{ background: INK, color: '#fff' }}>{hint}</div></div>}
    </Shell>
  )
}
