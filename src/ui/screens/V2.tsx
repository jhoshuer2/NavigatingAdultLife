// Navigating Adult Life 2.0 screens: Home (S1), the level intro with character pick (S4) and the level result (S7).
import { useGame } from '../../store'
import { Portrait } from '../Portrait'
import { Confetti } from '../components'
import { audio } from '@platform/audio'
import { ZURI, NAVI, BABA_TUNDE, MAMA_FOLAKE, PLAYABLE } from '../../world/castData'
import { progressOf, type CharacterId } from '../../levels/progress'
import { CHAPTER1, LEVELS } from '../../levels/chapter1'
import { track } from '@platform/analytics'
import { ConsentScreen } from './Consent'
import { analyticsAvailable } from '@platform/analytics'

export const INK = '#1c1b22', CREAM = '#f3e7cf', ORANGE = '#e07a1f', FOREST = '#2f5a3a', YELLOW = '#f5b91c'

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
  const consentOpen = analyticsAvailable() && !meta.consentAsked
  const lvl = LEVELS[p.level]
  const inProgress = p.task > 0
  const doneLevels = Object.keys(p.stars).length
  const label = p.character === null ? 'Start' : inProgress ? 'Continue' : doneLevels > 0 ? 'Play again' : 'Start'
  const play = () => { audio.unlock(); audio.playMusic('menu'); go('levelIntro') }
  return (
    <Shell>
      {consentOpen && <ConsentScreen />}
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
          <div className="text-xs font-extrabold tracking-[.18em] uppercase" style={{ color: YELLOW }}>Chapters</div>
          <h2 className="font-display text-3xl leading-none mt-1 pr-24">Chapter 1: {CHAPTER1.title}</h2>
          <p className="text-sm opacity-90 mt-1 max-w-[16rem]">{CHAPTER1.blurb}</p>
          <div className="mt-3 text-sm font-extrabold">{lvl ? `${lvl.subtitle}: ${lvl.title}` : ''} · {doneLevels} of {CHAPTER1.totalLevels} levels{inProgress ? ` · task ${p.task + 1} of 4` : ''}</div>
          <div className="mt-2 h-2.5 rounded-full overflow-hidden" style={{ background: '#0004' }}><div className="h-full" style={{ width: `${(doneLevels / CHAPTER1.totalLevels) * 100}%`, background: YELLOW }} /></div>
          <div className="absolute right-2 top-3 flex -space-x-5 pointer-events-none"><Portrait spec={p.character === 'navi' ? NAVI : ZURI} expression="happy" size={84} /><Portrait spec={BABA_TUNDE} expression="proud" size={84} /></div>
          <V2Btn className="mt-4 w-full" onClick={play}>{label}</V2Btn>
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
      <header className="px-4 pt-4" style={{ paddingTop: 'calc(1rem + var(--safe-t))' }}><button className="font-extrabold underline" onClick={() => go('home')}>← Home</button></header>
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
        <div className="grid gap-2">
          <V2Btn disabled>Level 2 · coming soon</V2Btn>
          <V2Btn tone="cream" onClick={() => { useGame.getState().saveProgress({ ...p, task: 0 }); openLevel(0) }}>Play Level 1 again</V2Btn>
          <V2Btn tone="cream" onClick={() => go('home')}>Home</V2Btn>
        </div>
      </div>
    </Shell>
  )
}
