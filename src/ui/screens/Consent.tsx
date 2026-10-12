import { useGame } from '../../store'
import { Btn, Modal } from '../components'
import { audio } from '@platform/audio'

/** What we collect, in plain language. Shared by the first-run screen and Settings. */
export function PrivacyDetails() {
  return (
    <div className="text-sm grid gap-2 opacity-90">
      <div><b>We collect:</b> a random code for this device, when and for how long you play, which parts of the game you use (places, tasks, activities, mini-game, shop), your approximate location (country, state and city, worked out from your connection), your language, and the kind of phone and browser you use.</div>
      <div><b>We never collect:</b> your name or the names you give characters, your exact location, your IP address, contacts, or anything you type.</div>
      <div><b>Why:</b> to see how many people play and where the game is boring, broken or loved, so we can fix it. Nothing is used for adverts or sold.</div>
      <div><b>How long:</b> detailed events are deleted after 90 days; yearly summaries after about two years.</div>
      <div><b>Your choice:</b> it is off unless you say yes. You can switch it off any time in Settings, which stops it straight away, and you can ask us to delete the data tied to this device.</div>
    </div>
  )
}

/** First-run opt-in screen. Off until the player agrees (NDPA: consent must be freely given and unticked by default). */
export function ConsentScreen() {
  const setConsent = useGame((s) => s.setConsent)
  // The tap on either answer is the player's first gesture: unlock audio and start the music from here.
  const answer = (yes: boolean) => { audio.unlock(); audio.playMusic('menu'); setConsent(yes) }
  return (
    <Modal title="Help us make the game better?">
      <p className="text-sm mb-2">Can we count how the game is played? It is optional, and the game works exactly the same either way.</p>
      <PrivacyDetails />
      <div className="grid gap-2 mt-4">
        <Btn variant="green" onClick={() => answer(true)}>Yes, count my play</Btn>
        <Btn variant="ghost" onClick={() => answer(false)}>No thanks</Btn>
      </div>
    </Modal>
  )
}
