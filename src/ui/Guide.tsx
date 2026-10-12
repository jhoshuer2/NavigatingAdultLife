// The in-world guide: a GTA-style objective card with the Conductor's voice, a compass arrow when the target is off screen,
// and the language picker. The guide logic itself lives in src/world/guide.ts.
import { Conductor, Modal, Tile } from './components'
import { Icon } from './icons'
import { useGame } from '../store'
import { LANGS, pick, say, type Lang } from '@content/lang'
import type { GuideStep } from '../world/guide'
import type { WorldRenderer } from '../world/WorldRenderer'

export function Lines({ lang, s }: { lang?: Lang; s: { en: string; pcm: string } }) {
  const t = pick(lang, s)
  return <>{t.main}{t.sub && <span className="block text-[11px] font-semibold opacity-65 mt-0.5 leading-snug">{t.sub}</span>}</>
}

export function GuideCard({ step, lang, onTap }: { step: GuideStep; lang?: Lang; onTap: () => void }) {
  const stuck = step.key.startsWith('stuck')
  return (
    <button key={step.key} className="pointer-events-auto mt-2 mx-2 flex items-center gap-2.5 rounded-2xl pl-1.5 pr-3 py-1.5 hud-glass text-left pop active:scale-[.99] transition-transform" onClick={onTap} aria-label="Guide" style={stuck ? { boxShadow: '0 0 0 2px var(--gold), 0 8px 24px rgba(0,0,0,.5)' } : undefined}>
      <span className="shrink-0"><Conductor size={42} mood={stuck ? 'hmm' : 'hype'} /></span>
      <span className="flex-1 min-w-0 text-[14px] font-bold leading-snug"><Lines lang={lang} s={step.say} /></span>
      <span className="grid place-items-center w-9 h-9 rounded-full text-[19px] shrink-0 guide-nudge" style={{ background: 'linear-gradient(180deg,#ffe27a,#f59e0b)' }}>{step.icon}</span>
    </button>
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
