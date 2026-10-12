// The in-world guide: a GTA-style objective card with the Conductor's voice, a compass arrow when the target is off screen,
// and the language picker. The guide logic itself lives in src/world/guide.ts.
import { useEffect } from 'react'
import { Conductor, Modal, Tile } from './components'
import { Icon } from './icons'
import { useGame } from '../store'
import { LANGS, pick, plain, say, type Lang } from '@content/lang'
import { HOWTO } from '@content/taskGuide'
import { speakLine, stopSpeaking } from '@platform/voice'
import { vlang } from '@content/lang'
import type { GuideStep } from '../world/guide'
import type { WorldRenderer } from '../world/WorldRenderer'

export function Lines({ lang, s }: { lang?: Lang; s: { en: string; pcm: string } }) {
  const t = pick(lang, s)
  return <>{t.main}{t.sub && <span className="block text-[11px] font-semibold opacity-65 mt-0.5 leading-snug">{t.sub}</span>}</>
}

export function GuideCard({ step, lang, voice, onTap }: { step: GuideStep; lang?: Lang; voice: boolean; onTap: () => void }) {
  const stuck = step.key.startsWith('stuck')
  useEffect(() => { if (voice) void speakLine({ id: step.voice, lang: vlang(lang), text: plain(lang, step.say), key: `g:${step.key}` }) }, [step.key, lang, voice]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div key={step.key} className="pointer-events-auto mt-2 mx-2 flex items-center gap-1.5 rounded-2xl pl-1.5 pr-2 py-1.5 hud-glass pop" style={stuck ? { boxShadow: '0 0 0 2px var(--gold), 0 8px 24px rgba(0,0,0,.5)' } : undefined}>
      <button className="flex items-center gap-2.5 flex-1 min-w-0 text-left active:scale-[.99] transition-transform" onClick={onTap} aria-label="Guide">
        <span className="shrink-0"><Conductor size={42} mood={stuck ? 'hmm' : 'hype'} /></span>
        <span className="flex-1 min-w-0 text-[14px] font-bold leading-snug"><Lines lang={lang} s={step.say} />{step.detail && <span className="chip chip-gold !py-0 !text-[11px] mt-1 capitalize"><Icon name="pin" size={11} color="#3b2300" />{step.detail}</span>}</span>
        <span className="grid place-items-center w-9 h-9 rounded-full text-[19px] shrink-0 guide-nudge" style={{ background: 'linear-gradient(180deg,#ffe27a,#f59e0b)' }}>{step.icon}</span>
      </button>
      <button className="grid place-items-center w-9 h-9 rounded-full bg-white/10 shrink-0 text-[16px]" aria-label="Hear it again" onClick={() => void speakLine({ id: step.voice, lang: vlang(lang), text: plain(lang, step.say) })}>🔊</button>
    </div>
  )
}

/** Points at an off-screen target from the edge of the screen, with the distance, like a game waypoint. */
export function GuideCompass({ r, pos, aim }: { r: WorldRenderer | null; pos: { x: number; z: number }; aim?: { x: number; z: number } }) {
  if (!r || !aim) return null
  const W = window.innerWidth, H = window.innerHeight
  const m = { l: 34, r: 34, t: 190, b: 190 }
  const t = r.screenOf(aim.x, aim.z)
  const dist = Math.hypot(aim.x - pos.x, aim.z - pos.z)
  if (dist < 3 || (t.x > m.l && t.x < W - m.r && t.y > m.t && t.y < H - m.b)) return null
  const cx = W / 2, cy = (m.t + H - m.b) / 2, hw = (W - m.l - m.r) / 2, hh = (H - m.t - m.b) / 2
  const dx = t.x - cx, dy = t.y - cy
  const k = Math.min(hw / Math.max(Math.abs(dx), 1e-6), hh / Math.max(Math.abs(dy), 1e-6))
  const x = cx + dx * k, y = cy + dy * k
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI
  return (
    <div className="absolute z-[15] pointer-events-none flex flex-col items-center gap-1" style={{ left: x, top: y, transform: 'translate(-50%,-50%)' }} aria-hidden="true">
      <span className="grid place-items-center w-11 h-11 rounded-full glow-pulse" style={{ background: 'linear-gradient(180deg,#ffe27a,#f59e0b)', boxShadow: '0 4px 0 rgba(0,0,0,.4)', transform: `rotate(${deg}deg)` }}><Icon name="up" size={24} color="#3b2300" /></span>
      <span className="chip chip-gold !py-0 !text-[11px] whitespace-nowrap">{Math.round(dist)} m</span>
    </div>
  )
}

export function LangPicker() {
  const setLang = useGame((s) => s.setLang)
  return (
    <Modal title="Language">
      <div className="text-center">
        <div className="font-display text-[22px] text-white leading-tight">How you wan make we guide you?</div>
        <div className="text-sm opacity-70 mt-1">How should we guide you?</div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 mt-4">
        {LANGS.map((l) => <Tile key={l.id} emoji={l.emoji} label={l.label} sub={l.sub} onClick={() => setLang(l.id)} />)}
      </div>
      <div className="text-[11px] opacity-55 text-center mt-3">{say('You can change this any time in Settings.', 'You fit change am any time for Settings.').pcm}</div>
    </Modal>
  )
}

/** The "how do I play this?" card shown before a task. The task only starts when the player taps Start. */
export function TaskCoach({ kind, lang, onStart }: { kind: string; lang?: Lang; onStart: () => void }) {
  const h = HOWTO[kind]
  const voiceLines = h ? [plain(lang, h.title), ...h.steps.map((s) => plain(lang, s.say)), plain(lang, h.goal)].join('. ') : ''
  useEffect(() => { if (h) void speakLine({ id: `how_${kind}`, lang: vlang(lang), text: voiceLines, key: `howto:${kind}`, gapMs: 20000 }) }, [kind]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!h) return null
  return (
    <div className="absolute inset-0 z-40 grid place-items-end sm:place-items-center p-3 pb-6" style={{ background: 'rgba(5,3,20,.72)', backdropFilter: 'blur(3px)' }} role="dialog" aria-label="How to play">
      <div className="hud-glass rounded-[26px] p-4 w-full max-w-sm pop">
        <div className="flex items-center gap-3">
          <Conductor size={54} mood="hype" />
          <div className="min-w-0 flex-1"><div className="font-display text-[24px] leading-none text-white uppercase" style={{ textShadow: '0 2px 0 rgba(0,0,0,.4)' }}>{h.icon} <Lines lang={lang} s={h.title} /></div></div>
        </div>
        <HowToBody h={h} lang={lang} />
        <div className="flex gap-2 mt-4">
          <button className="btn btn-ghost !min-h-[52px] !px-4" onClick={() => void speakLine({ id: `how_${kind}`, lang: vlang(lang), text: voiceLines })} aria-label="Hear it again">🔊</button>
          <button className="btn btn-green btn-shine flex-1 !text-xl" onClick={() => { stopSpeaking(); onStart() }}>Start <Icon name="chevron" size={20} /></button>
        </div>
      </div>
    </div>
  )
}

export function HowToBody({ h, lang }: { h: (typeof HOWTO)[string]; lang?: Lang }) {
  return (
    <>
        <ol className="mt-3 grid gap-2">
          {h.steps.map((s, i) => (
            <li key={i} className="flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2">
              <span className="grid place-items-center w-9 h-9 rounded-full text-[20px] shrink-0" style={{ background: 'linear-gradient(180deg,#ffe27a,#f59e0b)' }}>{s.icon}</span>
              <span className="text-[14px] font-bold leading-snug"><Lines lang={lang} s={s.say} /></span>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex items-center gap-2 text-[13px] font-extrabold text-gold"><Icon name="star" size={16} color="#ffd23f" /><span><Lines lang={lang} s={h.goal} /></span></div>
    </>
  )
}
