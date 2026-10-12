import { useGame } from '../../store'
import { Btn, Confetti, CountUp, Ribbon, nairaShort } from '../components'
import { Icon } from '../icons'
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
    <div className="screen flex flex-col stage">
      <Confetti n={34} />
      <header className="px-4 pt-6 text-center">
        <Ribbon>Final whistle</Ribbon>
        <div className="flex justify-center mt-4"><div className="rounded-3xl p-1 pattern-ankara" style={{ boxShadow: '0 0 0 3px rgba(255,255,255,.3), 0 0 40px rgba(255,199,44,.4)' }}><Avatar look={c.appearance} gender={c.gender} age={c.age} size={110} /></div></div>
        <h1 className="font-display text-[34px] text-white leading-tight mt-3" style={{ textShadow: '0 3px 0 rgba(0,0,0,.45)' }}>{e.title}</h1>
      </header>
      <main className="px-4 py-3 flex-1 scroll-y">
        <div className="grid grid-cols-3 gap-2.5 text-center stagger">
          <div className="hud-glass rounded-2xl py-3"><Icon name="trophy" size={22} color="#ffd23f" /><div className="font-display text-3xl text-gold leading-none mt-1"><CountUp to={e.legacy} /></div><div className="text-[10px] font-bold uppercase opacity-65 mt-0.5">Legacy</div></div>
          <div className="hud-glass rounded-2xl py-3"><Icon name="coin" size={22} color="#8dffbb" /><div className="font-display text-2xl text-green-300 leading-none mt-1.5">{nairaShort(e.netWorth)}</div><div className="text-[10px] font-bold uppercase opacity-65 mt-1">Net worth</div></div>
          <div className="hud-glass rounded-2xl py-3"><Icon name="shell" size={22} color="#ffd23f" /><div className="font-display text-3xl leading-none mt-1"><CountUp to={e.cowries} /></div><div className="text-[10px] font-bold uppercase opacity-65 mt-0.5">Cowries</div></div>
        </div>
        <div className="hud-glass rounded-2xl p-3 mt-3 flex items-center gap-3"><span className="text-3xl">{dream.icon}</span><div className="flex-1 font-display uppercase text-sm">{dream.name}</div><span className={`chip ${e.dreamDone ? 'chip-green' : ''}`}>{e.dreamDone ? 'Achieved' : 'Not this time'}</span></div>
        <details className="mt-3"><summary className="chip cursor-pointer list-none">Their story <Icon name="chevron" size={12} /></summary><div className="card p-3 mt-2 leading-relaxed text-sm">{e.obituary}</div></details>
        {e.topMoments.length > 0 && <details className="mt-2"><summary className="chip cursor-pointer list-none">Highlights <Icon name="chevron" size={12} /></summary><ul className="mt-2 space-y-1 text-sm">{e.topMoments.map((m, i) => <li key={i}>• {m}</li>)}</ul></details>}
        {e.achievements.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{e.achievements.map((a) => <span key={a} className="chip chip-gold">{ACHIEVEMENT_BY_ID[a]?.icon} {ACHIEVEMENT_BY_ID[a]?.title}</span>)}</div>}
      </main>
      <footer className="px-4 pb-4 pt-2 grid gap-2 safe-pad">
        <Btn variant="green" shine className="!text-xl" onClick={() => go('create')}><Icon name="play" size={20} /> Live another life</Btn>
        <div className="grid grid-cols-3 gap-2"><Btn variant="ghost" onClick={doShare}><Icon name="share" size={18} /></Btn><Btn variant="ghost" onClick={() => go('unlocks')}><Icon name="shell" size={18} color="#ffd23f" />{meta.cowries}</Btn><Btn variant="ghost" onClick={() => go('title')}><Icon name="home" size={18} /></Btn></div>
      </footer>
    </div>
  )
}
