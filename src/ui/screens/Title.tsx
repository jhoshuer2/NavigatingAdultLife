import { useGame } from '../../store'
import { Btn } from '../components'
import { SceneArt } from '../SceneArt'
import { Avatar } from '../Avatar'
import { audio } from '@platform/audio'
import { fmtTime } from '@platform/tokens'
import { remainingSec } from '@platform/tokens'

const demo = { skinTone: 5, faceShape: 1, hairStyle: 'braids', hairColor: '#141414', outfitType: 'owambe', fabric: 'ankara', topColor: '#0f7a4a', bottomColor: '#222222' }
const demo2 = { skinTone: 3, faceShape: 0, hairStyle: 'lowcut', hairColor: '#141414', facialHair: 'stubble', outfitType: 'traditional', fabric: 'asoOke', topColor: '#2b3a8c', bottomColor: '#222222' }

export function Title() {
  const { go, life, meta, newLife, continueLife } = useGame()
  const left = remainingSec(meta)
  const start = () => { audio.unlock(); audio.playMusic('menu') }
  return (
    <div className="min-h-full flex flex-col" onPointerDown={start}>
      <div className="relative h-64 overflow-hidden">
        <SceneArt scene="danfo" className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-x-0 bottom-0 h-24" style={{ background: 'linear-gradient(transparent, #1a1530)' }} />
        <div className="absolute left-2 bottom-0"><Avatar look={demo} gender="female" size={110} /></div>
        <div className="absolute right-2 bottom-0"><Avatar look={demo2} gender="male" size={110} /></div>
      </div>
      <div className="px-5 -mt-8 relative text-center">
        <h1 className="font-display text-6xl leading-[0.9] text-danfo drop-shadow-[0_4px_0_#1c1b22]">Navigating<br />Adult Life</h1>
        <p className="mt-3 text-base font-bold opacity-90">Grow up Nigerian. Choose well. Or choose funny.</p>
        <p className="text-xs opacity-60 mt-1">School · hustle · love · family · legacy</p>
      </div>
      <div className="px-5 mt-6 flex flex-col gap-3 safe-pad">
        {life && <Btn onClick={() => { start(); continueLife() }}>▶ Continue — {life.character.nickname || life.character.name}, age {life.character.age}</Btn>}
        <Btn variant={life ? 'ghost' : 'primary'} onClick={() => { start(); go('create') }}>✨ New life</Btn>
        <div className="grid grid-cols-2 gap-3">
          <Btn variant="ghost" onClick={() => go('achievements')}>🏆 Achievements</Btn>
          <Btn variant="ghost" onClick={() => go('unlocks')}>🐚 Unlocks <span className="chip">{meta.cowries}</span></Btn>
          <Btn variant="ghost" onClick={() => go('history')}>📜 Past lives</Btn>
          <Btn variant="ghost" onClick={() => go('settings')}>⚙️ Settings</Btn>
        </div>
        <div className="text-center text-xs opacity-70 mt-1">
          Play time left: <b>{fmtTime(left)}</b> · {meta.tokens.unlimited ? 'unlimited test mode' : 'free daily time refills every day'}
        </div>
        {!life && meta.stats.lives === 0 && <button className="text-xs underline opacity-60" onClick={() => newLife(quick())}>Skip creation: random life</button>}
      </div>
    </div>
  )
}

import { randomConfig } from '@engine/bot'
import { makeRng } from '@engine/core/rng'
const quick = () => randomConfig(makeRng((Math.random() * 2 ** 32) >>> 0))
