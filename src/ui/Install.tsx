import { useEffect, useState, useSyncExternalStore } from 'react'
import { Btn, Modal } from './components'
import { audio } from '@platform/audio'
import { dismissInstall, installDismissed, installMode, promptInstall, subscribeInstall, type InstallMode } from '@platform/install'

const useMode = (): InstallMode => {
  const [, tick] = useState(0)
  useEffect(() => subscribeInstall(() => tick((n) => n + 1)), [])
  return useSyncExternalStore(subscribeInstall, installMode, () => 'manual' as InstallMode)
}

function Steps({ mode }: { mode: InstallMode }) {
  const ios = mode === 'ios'
  const steps = ios
    ? ['Open this page in Safari.', 'Tap the Share button (the square with the arrow) at the bottom.', 'Scroll down and tap “Add to Home Screen”.', 'Tap Add. The game now opens like a normal app.']
    : ['Open the browser menu (the three dots, top right).', 'Tap “Install app” or “Add to Home screen”.', 'Tap Install. The game now opens like a normal app.']
  return <ol className="grid gap-2 text-sm list-decimal pl-5">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
}

/** Runs the one-tap install where the browser allows it, otherwise opens the right steps. */
export function useInstall() {
  const mode = useMode()
  const [steps, setSteps] = useState(false)
  const run = async () => {
    audio.sfx('click')
    if (mode === 'prompt') { const r = await promptInstall(); if (r === 'dismissed') dismissInstall(); return }
    setSteps(true)
  }
  const modal = steps ? (
    <Modal title="Install on your phone" onClose={() => setSteps(false)}>
      <p className="text-sm mb-3 opacity-90">Play full screen, straight from your home screen, even with a weak connection.</p>
      <Steps mode={mode} />
      <Btn variant="green" className="w-full mt-4" onClick={() => setSteps(false)}>Got it</Btn>
    </Modal>
  ) : null
  return { mode, run, modal }
}

/** Small button for the title screen. Hidden once installed or after the player waves it off. */
export function InstallChip() {
  const { mode, run, modal } = useInstall()
  const [hide, setHide] = useState(installDismissed())
  if (mode === 'installed' || hide) return null
  return (
    <>
      <div className="chip !py-1.5 !pl-3 !pr-1 gap-2 rise" style={{ animationDelay: '.7s', background: 'rgba(10,7,34,.55)', backdropFilter: 'blur(6px)' }}>
        <button className="font-extrabold text-[13px]" onClick={run}>📲 Install the app</button>
        <button className="opacity-60 text-lg leading-none px-2" aria-label="Hide" onClick={() => { dismissInstall(); setHide(true) }}>×</button>
      </div>
      {modal}
    </>
  )
}

/** Settings row. */
export function InstallRow() {
  const { mode, run, modal } = useInstall()
  if (mode === 'installed') return <div className="card p-3 text-sm">✅ Installed. You are playing the app.</div>
  return <><Btn variant="ghost" onClick={run}>📲 Install on my phone</Btn>{modal}</>
}
