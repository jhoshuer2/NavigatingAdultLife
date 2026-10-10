import { useEffect, useRef } from 'react'
import { useGame } from './store'
import { Toasts } from './ui/components'
import { Title } from './ui/screens/Title'
import { Create } from './ui/screens/Create'
import { Play } from './ui/screens/Play'
import { Ending } from './ui/screens/Ending'
import { Achievements, History, Settings, Unlocks } from './ui/screens/Misc'
import { Dash } from './ui/screens/Dash'
import { audio } from '@platform/audio'

export default function App() {
  const { screen, toasts, init, tick, meta, openSheet } = useGame()
  const last = useRef(Date.now())
  useEffect(() => { init() }, [init])
  useEffect(() => { document.documentElement.classList.toggle('reduce-motion', meta.settings.reducedMotion) }, [meta.settings.reducedMotion])

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

  return (
    <div className="shell">
      <Toasts items={toasts} />
      {screen === 'title' && <Title />}
      {screen === 'create' && <Create />}
      {screen === 'play' && <Play />}
      {screen === 'ending' && <Ending />}
      {screen === 'achievements' && <Achievements />}
      {screen === 'unlocks' && <Unlocks />}
      {screen === 'history' && <History />}
      {screen === 'settings' && <Settings />}
      {screen === 'dash' && <Dash />}
    </div>
  )
}
