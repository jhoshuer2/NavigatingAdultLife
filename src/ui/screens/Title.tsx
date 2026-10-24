import { useEffect, useState } from 'react'
import { useGame } from '../../store'
import { Btn, nairaShort } from '../components'
import { Icon, type IconName } from '../icons'
import { TitleArt } from '../TitleArt'
import { InstallChip } from '../Install'
import { audio } from '@platform/audio'
import { speakLine } from '@platform/voice'
import { vlang } from '../../content/lang'
import { fmtTime, remainingSec } from '@platform/tokens'
import { randomConfig } from '@engine/bot'
import { makeRng } from '@engine/core/rng'

const quick = () => randomConfig(makeRng((Math.random() * 2 ** 32) >>> 0))

function Round({ icon, label, onClick, badge }: { icon: IconName; label: string; onClick: () => void; badge?: string | number }) {
  return (
    <button className="flex flex-col items-center gap-1.5 group" onClick={() => { audio.sfx('click'); onClick() }} aria-label={label}>
      <span className="relative grid place-items-center w-14 h-14 rounded-2xl transition-transform group-active:translate-y-1" style={{ background: 'linear-gradient(180deg, rgba(150,120,255,.45), rgba(60,40,170,.7))', border: '1px solid rgba(28,27,34,.22)', boxShadow: 'inset 0 2px 0 rgba(28,27,34,.35), 0 4px 0 rgba(0,0,0,.45), 0 10px 16px rgba(0,0,0,.3)' }}>
        <Icon name={icon} size={28} />
        {badge !== undefined && <span className="absolute -top-1.5 -right-1.5 num text-[11px] px-1.5 rounded-full" style={{ background: 'var(--gold)', color: '#3b2300' }}>{badge}</span>}
      </span>
      <span className="text-[11px] font-extrabold uppercase tracking-wider opacity-85">{label}</span>
    </button>
  )
}

const GREETING = 'Oya enter, make we waka this life journey!'
const DRIVE_SEC = 2.6

/** `hold` keeps the danfo parked off-screen (e.g. while the privacy prompt is up); it rolls in with engine sound once released. */
export function Title({ hold = false }: { hold?: boolean }) {
  const { go, life, meta, newLife, continueLife } = useGame()
  const left = remainingSec(meta)
  const [say, setSay] = useState(false)
  useEffect(() => {
    if (hold) return
    audio.busArrive(DRIVE_SEC)
    const a = window.setTimeout(() => { setSay(true); void speakLine({ id: 'bus_greet', lang: vlang(useGame.getState().meta.settings.lang), text: GREETING, key: 'bus_greet', gapMs: 20000 }) }, DRIVE_SEC * 1000 - 150)
    const b = window.setTimeout(() => setSay(false), DRIVE_SEC * 1000 + 7000)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [hold])
  const start = () => { audio.unlock(); audio.playMusic('menu') }
  return (
    <div className="screen flex flex-col relative" onPointerDown={start}>
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-3 pt-3" style={{ paddingTop: 'calc(.75rem + var(--safe-t))' }}>
        <span className="chip" style={{ background: 'rgba(255,250,240,.92)', backdropFilter: 'blur(6px)' }}><Icon name="shell" size={16} /><b className="num">{meta.cowries}</b></span>
        <button className="chip" style={{ background: 'rgba(255,250,240,.92)', backdropFilter: 'blur(6px)' }} onClick={() => useGame.getState().openSheet('paywall')} aria-label="Play time"><Icon name="clock" size={16} /><b className="num">{meta.tokens.unlimited ? '∞' : fmtTime(left)}</b></button>
      </div>
      <TitleArt className="h-[56vh] min-h-[330px] max-h-[520px] shrink-0" drive={hold ? 'wait' : 'go'} say={say ? GREETING : undefined} />
      <div className="relative -mt-14 px-5 text-center z-10">
        <div className="rise" style={{ animationDelay: '.25s' }}>
          <div className="inline-block"><span className="ribbon !text-[13px] !py-0.5 !px-5 tracking-[.18em]">Navigating</span></div>
          <h1 className="font-display leading-[.82] mt-1" style={{ fontSize: 'clamp(64px, 19vw, 92px)', background: 'linear-gradient(180deg,#fffbd6 0%,#ffd23f 48%,#ff9d2e 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: 'drop-shadow(3px 0 0 #1c1b22) drop-shadow(-3px 0 0 #1c1b22) drop-shadow(0 3px 0 #1c1b22) drop-shadow(0 -3px 0 #1c1b22) drop-shadow(0 8px 0 #1c1b22) drop-shadow(0 0 26px rgba(255,199,44,.5))' }}>ADULT<br />LIFE</h1>
        </div>
        <p className="mt-2 text-[15px] font-extrabold opacity-90 rise" style={{ animationDelay: '.45s' }}>Grow up Nigerian. Choose well, or choose funny.</p>
      </div>
      <div className="px-5 mt-5 flex flex-col items-center gap-4 safe-pad z-10">
        {life ? (
          <>
            <Btn className="w-full max-w-sm !min-h-16 !text-2xl" shine onClick={() => { start(); continueLife() }}><Icon name="play" size={24} color="#fff" /> Continue</Btn>
            <button className="text-[13px] font-extrabold opacity-80 -mt-1" onClick={() => { start(); go('create') }}>{life.character.nickname || life.character.name}, age {life.character.age} · <u>start a new life</u></button>
          </>
        ) : (
          <Btn className="w-full max-w-sm !min-h-16 !text-2xl" shine onClick={() => { start(); go('create') }}><Icon name="play" size={24} color="#fff" /> Play</Btn>
        )}
        <div className="flex items-start justify-center gap-5 mt-1 rise" style={{ animationDelay: '.6s' }}>
          <Round icon="trophy" label="Trophies" onClick={() => go('achievements')} />
          <Round icon="shell" label="Shop" onClick={() => go('unlocks')} badge={meta.cowries || undefined} />
          <Round icon="scroll" label="Lives" onClick={() => go('history')} />
          <Round icon="gear" label="Settings" onClick={() => go('settings')} />
        </div>
        <InstallChip />
        {!life && meta.stats.lives === 0 && <button className="text-[12px] font-bold opacity-60 underline" onClick={() => newLife(quick())}>Quick start with a random life</button>}
        <span className="hidden">{nairaShort(0)}</span>
      </div>
    </div>
  )
}
