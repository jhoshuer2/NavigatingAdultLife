import { useEffect, useRef } from 'react'
import { useGame } from './store'
import { Toasts } from './ui/components'
import { Title } from './ui/screens/Title'
import { Create } from './ui/screens/Create'
import { Play } from './ui/screens/Play'
import { Ending } from './ui/screens/Ending'
import { Achievements, History, Settings, Unlocks } from './ui/screens/Misc'
import { lazy, Suspense } from 'react'
const Dash = lazy(() => import('./ui/screens/Dash'))
import { audio } from '@platform/audio'
import { analyticsAvailable, setAnalyticsContext, startAnalytics } from '@platform/analytics'
import { ConsentScreen } from './ui/screens/Consent'

export default function App() {
  const { screen, toasts, init, tick, meta, openSheet } = useGame()
  const last = useRef(Date.now())
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
  useEffect(() => { if (screen === 'play' || screen === 'dash') return; if (screen === 'title' || screen === 'create') audio.playMusic('menu') }, [screen])
  useEffect(() => { void openSheet }, [openSheet])

  const consentOpen = analyticsAvailable() && !meta.consentAsked && screen === 'title'
  return (
    <div className="shell">
      <Toasts items={toasts} />
      {consentOpen && <ConsentScreen />}
      {screen === 'title' && <Title hold={consentOpen} />}
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
