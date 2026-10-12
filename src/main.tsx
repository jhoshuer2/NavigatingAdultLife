import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './ui/index.css'
import App from './App'
import { registerSW } from 'virtual:pwa-register'

try { registerSW({ immediate: true }) } catch { /* service worker unavailable */ }

if (new URLSearchParams(location.search).get('debug') === '1') {
  // Dev/e2e helper: jump a bot-played life to a given age. Not linked from the UI.
  void import('./store').then(async ({ useGame }) => {
    const bot = await import('@engine/bot')
    const errands = await import('./world/errands'); const layout = await import('./world/layout'); const guide = await import('./world/guide')
    ;(window as unknown as Record<string, unknown>).__nal = {
      useGame,
      errandAt: (kind: 'explore' | 'visit') => { const l = useGame.getState().life!; return errands.errandSpot(layout.buildDistrict(l.character.housing.districtId), kind, guide.errandSeed(l, kind)) },
      jump: (age: number, kind: 'random' | 'scholar' | 'money' = 'scholar', seed = 7) => {
        const r = bot.playLife(seed, kind, undefined, 4000, age)
        useGame.setState({ life: r.state, screen: 'play', sheet: null })
      },
    }
  })
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
