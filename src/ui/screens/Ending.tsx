import { useGame } from '../../store'
import { Btn, nairaShort } from '../components'
import { Avatar } from '../Avatar'
import { ACHIEVEMENT_BY_ID } from '@content/achievements'
import { DREAM_BY_ID } from '@content/dreams'
import { shareCard } from '@platform/share'
import { audio } from '@platform/audio'
import { useEffect } from 'react'

export function Ending() {
  const { life, go, toast, meta } = useGame()
  useEffect(() => { audio.playMusic('menu'); audio.sfx('level') }, [])
  const e = life?.ending
  if (!life || !e) return <div className="p-6"><Btn onClick={() => go('title')}>Back</Btn></div>
  const c = life.character
  const dream = DREAM_BY_ID[c.dreamId]
  const doShare = async () => {
    const r = await shareCard({ name: c.nickname || c.name, age: c.age, ending: e, dream: dream.name })
    toast(r === 'shared' ? 'Shared!' : r === 'downloaded' ? 'Image saved' : 'Could not create the card')
  }
  return (
    <div className="min-h-full flex flex-col">
      <header className="px-4 pt-6 text-center">
        <div className="text-xs font-extrabold uppercase tracking-widest opacity-60">The story ends</div>
        <h1 className="font-display text-6xl text-danfo leading-none mt-1 drop-shadow-[0_4px_0_#1c1b22]">{e.title}</h1>
        <div className="flex justify-center mt-2"><div className="card p-1 pattern-ankara"><Avatar look={c.appearance} gender={c.gender} age={c.age} size={100} /></div></div>
      </header>
      <main className="px-4 py-3 flex-1">
        <div className="card p-4 leading-relaxed">{e.obituary}</div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="card p-2"><div className="text-xs opacity-60">Legacy</div><b className="text-2xl text-danfo">{e.legacy}</b></div>
          <div className="card p-2"><div className="text-xs opacity-60">Net worth</div><b className="text-xl text-green-300">{nairaShort(e.netWorth)}</b></div>
          <div className="card p-2"><div className="text-xs opacity-60">Cowries</div><b className="text-2xl">🐚 {e.cowries}</b></div>
        </div>
        <div className="card p-3 mt-3 text-sm">{dream.icon} <b>Dream: {dream.name}</b> {e.dreamDone ? '✅ achieved!' : '— not achieved this time.'}</div>
        <h2 className="font-display text-2xl text-danfo mt-4">Life highlights</h2>
        <ul className="mt-1 space-y-1 text-sm">{e.topMoments.map((m, i) => <li key={i}>• {m}</li>)}</ul>
        {e.achievements.length > 0 && <>
          <h2 className="font-display text-2xl text-danfo mt-4">Achievements this life</h2>
          <div className="flex flex-wrap gap-1.5 mt-1">{e.achievements.map((a) => <span key={a} className="chip">{ACHIEVEMENT_BY_ID[a]?.icon} {ACHIEVEMENT_BY_ID[a]?.title}</span>)}</div>
        </>}
        <div className="text-xs opacity-60 mt-3">Total Cowries: 🐚 {meta.cowries}. Spend them in Unlocks for new looks and starting perks.</div>
      </main>
      <footer className="px-4 pb-4 grid gap-2 safe-pad">
        <Btn variant="green" className="!text-lg" onClick={() => go('create')}>✨ Live another life</Btn>
        <div className="grid grid-cols-2 gap-2"><Btn variant="ghost" onClick={doShare}>📤 Share</Btn><Btn variant="ghost" onClick={() => go('unlocks')}>🐚 Unlocks</Btn></div>
        <Btn variant="ghost" onClick={() => go('title')}>Main menu</Btn>
      </footer>
    </div>
  )
}
