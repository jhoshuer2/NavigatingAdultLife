import { useEffect, useRef, useState } from 'react'
import { useGame } from './store'
import { Toasts } from './ui/components'
import { Home, Chapters, LevelIntro, LevelResult, Leaderboard } from './ui/screens/V2'
import { Create } from './ui/screens/Create'
import { Play } from './ui/screens/Play'
import { Ending } from './ui/screens/Ending'
import { Achievements, History, Settings, Unlocks } from './ui/screens/Misc'
import { lazy, Suspense } from 'react'
const LevelPlay = lazy(() => import('./ui/screens/LevelPlay'))
const Dash = lazy(() => import('./ui/screens/Dash'))
const CharacterSheet = lazy(() => import('./dev/CharacterSheet'))
import { audio } from '@platform/audio'
import { setAnalyticsContext, startAnalytics } from '@platform/analytics'

/** Shown whenever sound is switched on but the browser is still blocking it, so silence is never a mystery. One tap turns it on. */
function SoundPill({ enabled }: { enabled: boolean }) {
  const [st, setSt] = useState(audio.status())
  useEffect(() => { const iv = setInterval(() => setSt(audio.status()), 700); return () => clearInterval(iv) }, [])
  if (!enabled || st === 'running' || st === 'off') return null
  // before the first tap the browser keeps every page silent; any tap starts the sound. 'suspended' means a tap did not manage it.
  const text = st === 'waiting' ? '🔊 Tap anywhere to start the sound' : '🔇 Sound is blocked. Tap here to turn it on'
  return <button className="fixed left-1/2 -translate-x-1/2 z-[60] chip chip-gold !text-[13px] !py-1.5 !px-3 pop" style={{ top: 'calc(.5rem + var(--safe-t))' }} onClick={async () => { setSt(await audio.check()); audio.playMusic('menu') }}>{text}</button>
}

export default function App() {
  if (typeof location !== 'undefined' && location.search.includes('sheet=1')) return <Suspense fallback={null}><CharacterSheet /></Suspense>
  const { screen, toasts, init, tick, meta, openSheet, levelNonce } = useGame()
  const last = useRef(Date.now())
  const [rushKey, setRushKey] = useState(0)
  useEffect(() => { init(); startAnalytics() }, [init])
  useEffect(() => { document.documentElement.classList.toggle('reduce-motion', meta.settings.reducedMotion) }, [meta.settings.reducedMotion])

  useEffect(() => { setAnalyticsContext({ mode: meta.settings.lite ? 'menu' : 'world', screen }) }, [meta.settings.lite, screen])

  // Playtime token meter: only counts while the tab is visible and the player interacted in the last 60 s.
  useEffect(() => {
    const touch = () => { last.current = Date.now() }
    for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, touch, { passive: true })
    const iv = setInterval(() => {
      const active = document.visibilityState === 'visible' && Date.now() - last.current < 60000
      const playing = ['play', 'dash'].includes(useGame.getState().screen)
      if (active && playing) tick(1)
    }, 1000)
    return () => { clearInterval(iv); for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.removeEventListener(ev, touch) }
  }, [tick])
  useEffect(() => { if (screen === 'play' || screen === 'dash') return; if (screen === 'home' || screen === 'create') audio.playMusic('menu') }, [screen])
  useEffect(() => { void openSheet }, [openSheet])

    return (
    <div className="shell">
      <Toasts items={toasts} />
      <SoundPill enabled={meta.settings.sound} />
      {screen === 'home' && <Home />}
      {screen === 'chapters' && <Chapters />}
      {screen === 'levelIntro' && <LevelIntro />}
      {screen === 'levelPlay' && <Suspense fallback={<div className="p-8 text-center font-display text-3xl">Loading…</div>}><LevelPlay key={levelNonce} /></Suspense>}
      {screen === 'levelResult' && <LevelResult />}
      {screen === 'leaderboard' && <Leaderboard />}
      {(screen === 'rushLobby' || screen === 'rushPlay') && <Suspense fallback={<div className="p-8 text-center font-display text-3xl">Loading the road…</div>}><Dash key={rushKey} rush again={() => setRushKey((k) => k + 1)} /></Suspense>}
      {screen === 'create' && <Create />}
      {screen === 'play' && <Play />}
      {screen === 'ending' && <Ending />}
      {screen === 'achievements' && <Achievements />}
      {screen === 'unlocks' && <Unlocks />}
      {screen === 'history' && <History />}
      {screen === 'settings' && <Settings />}
      {screen === 'dash' && <Suspense fallback={<div className="p-8 text-center font-display text-3xl text-danfo">Loading the road…</div>}><Dash /></Suspense>}
    </div>
  )
}
