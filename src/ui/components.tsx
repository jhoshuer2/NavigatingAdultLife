// UI kit for "Danfo Nights" (see docs/DESIGN-AUDIT.md). Buttons, sheets, stat badges, tiles, mentor, motion helpers.
import { useEffect, useRef, useState } from 'react'
import type { ReactNode, ButtonHTMLAttributes } from 'react'
import type { StatDelta } from '@engine/core/types'
import { audio } from '@platform/audio'
import { Icon, type IconName } from './icons'

type Variant = 'primary' | 'green' | 'gold' | 'ghost' | 'danger'
export function Btn({ variant = 'primary', size, shine, className = '', onClick, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm'; shine?: boolean }) {
  return <button {...p} className={`btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${shine ? 'btn-shine' : ''} ${className}`} onClick={(e) => { audio.sfx('click'); onClick?.(e) }} />
}

/** Round icon button (back, close, settings). */
export function RoundBtn({ icon, label, onClick, size = 44, tone = 'ghost' }: { icon: IconName; label: string; onClick?: () => void; size?: number; tone?: 'ghost' | 'gold' | 'green' }) {
  const bg = tone === 'gold' ? 'linear-gradient(180deg,#ffe27a,#f59e0b)' : tone === 'green' ? 'linear-gradient(180deg,#55f09b,#12a152)' : 'linear-gradient(180deg, rgba(130,100,255,.5), rgba(60,40,170,.7))'
  return (
    <button aria-label={label} onClick={() => { audio.sfx(icon === 'close' || icon === 'back' ? 'close' : 'click'); onClick?.() }} className="grid place-items-center rounded-full active:translate-y-0.5 transition-transform pointer-events-auto"
      style={{ width: size, height: size, background: bg, boxShadow: 'inset 0 2px 0 rgba(255,255,255,.4), 0 3px 0 rgba(0,0,0,.45), 0 8px 14px rgba(0,0,0,.35)', border: '1px solid rgba(255,255,255,.18)' }}>
      <Icon name={icon} size={Math.round(size * 0.5)} color={icon === 'dice' ? '#fff' : tone === 'gold' ? '#3b2300' : '#fff'} />
    </button>
  )
}

export function Ribbon({ children, className = '' }: { children: ReactNode; className?: string }) { return <span className={`ribbon ${className}`}>{children}</span> }

/** A bottom sheet (phone) / centred card (desktop): grabber, ribbon title, round close button, glass body. */
export function Modal({ children, onClose, title, wide, hero }: { children: ReactNode; onClose?: () => void; title?: string; wide?: boolean; hero?: ReactNode }) {
  useEffect(() => { audio.sfx('open') }, [])
  useEffect(() => {
    if (!onClose) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(80% 60% at 50% 100%, rgba(106,61,245,.35), rgba(5,3,20,.82))', backdropFilter: 'blur(3px)' }} onClick={onClose} />
      <div className={`sheet relative w-full ${wide ? 'max-w-xl' : 'max-w-md'} max-h-[92vh] flex flex-col rounded-t-[28px] sm:rounded-b-[28px]`} style={{ background: 'linear-gradient(180deg,#2b1f86 0%, #170f4a 38%, #0f0a30 100%)', border: '1px solid rgba(255,255,255,.16)', borderBottom: 0, boxShadow: '0 -20px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.25)' }}>
        {hero}
        <div className="flex items-center justify-between px-4 pt-3 pb-1 relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-1.5 w-10 h-1 rounded-full bg-white/25" />
          {title ? <Ribbon className="mt-1">{title}</Ribbon> : <span />}
          {onClose && <div className="mt-1"><RoundBtn icon="close" label="Close" onClick={onClose} size={38} /></div>}
        </div>
        <div className="scroll-y px-4 pt-2 safe-pad flex-1 min-h-0">{children}</div>
      </div>
    </div>
  )
}

export const STAT_META = {
  cash: { icon: '₦', ic: 'coin', name: 'Cash', color: '#ffc72c', glow: '#ffd23f' },
  energy: { icon: '⚡', ic: 'bolt', name: 'Energy', color: '#ffd23f', glow: '#ffe27a' },
  happiness: { icon: '😊', ic: 'smile', name: 'Mood', color: '#ff7ab8', glow: '#ff9ccf' },
  knowledge: { icon: '📚', ic: 'book', name: 'Brain', color: '#5cc8ff', glow: '#8fe0ff' },
  reputation: { icon: '⭐', ic: 'star', name: 'Rep', color: '#ffa94d', glow: '#ffc880' },
  health: { icon: '❤️', ic: 'heart', name: 'Health', color: '#ff5a7a', glow: '#ff8aa0' },
  stress: { icon: '😮‍💨', ic: 'wind', name: 'Stress', color: '#b69cff', glow: '#cdbaff' },
} as const satisfies Record<string, { icon: string; ic: IconName; name: string; color: string; glow: string }>

/** A round stat badge: icon disc with the value beneath/aside. */
export function StatBadge({ stat, value, delta, size = 'md', ring }: { stat: keyof typeof STAT_META; value: number | string; delta?: number; size?: 'sm' | 'md'; ring?: number }) {
  const m = STAT_META[stat]
  const d = size === 'sm' ? 30 : 38
  return (
    <div className="flex items-center gap-1.5 min-w-0" aria-label={`${m.name} ${value}`}>
      <div className="relative grid place-items-center rounded-full shrink-0" style={{ width: d, height: d, background: `radial-gradient(circle at 35% 25%, ${m.glow}55, ${m.color}22 70%)`, boxShadow: `inset 0 0 0 2px ${m.color}aa, 0 0 12px ${m.color}44` }}>
        {ring !== undefined && <svg className="absolute inset-0" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="3" /><circle cx="18" cy="18" r="16" fill="none" stroke={m.color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${Math.max(0, Math.min(1, ring)) * 100.5} 100.5`} transform="rotate(-90 18 18)" /></svg>}
        <Icon name={m.ic} size={d * 0.52} />
      </div>
      <div className="leading-none"><div className="num text-[15px] text-white">{value}{delta ? <span className={`text-[11px] ml-0.5 ${(stat === 'stress' ? delta < 0 : delta > 0) ? 'text-green-300' : 'text-red-300'}`}>{delta > 0 ? '+' : ''}{delta}</span> : null}</div></div>
    </div>
  )
}

/** Horizontal stat meter (profile and sheets). */
export function StatBar({ stat, value, max = 100, delta }: { stat: keyof typeof STAT_META; value: number; max?: number; delta?: number }) {
  const m = STAT_META[stat]
  return (
    <div className="min-w-0" aria-label={`${m.name} ${value}`}>
      <div className="flex items-center justify-between leading-none mb-1">
        <span className="flex items-center gap-1 text-[12px] font-extrabold"><Icon name={m.ic} size={15} />{m.name}</span>
        <span className="num text-[13px]">{value}{delta ? <span className={(stat === 'stress' ? delta < 0 : delta > 0) ? 'text-green-300' : 'text-red-300'}> {delta > 0 ? '+' : ''}{delta}</span> : null}</span>
      </div>
      <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, background: `linear-gradient(180deg, ${m.glow}, ${m.color})` }} /></div>
    </div>
  )
}

export const naira = (n: number) => `${n < 0 ? '−' : ''}₦${Math.abs(Math.round(n)).toLocaleString('en-NG')}`
export const nairaShort = (n: number) => {
  const a = Math.abs(n)
  const s = a >= 1e9 ? `${(a / 1e9).toFixed(1)}B` : a >= 1e6 ? `${(a / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M` : a >= 1e4 ? `${Math.round(a / 1e3)}k` : a.toLocaleString('en-NG')
  return `${n < 0 ? '−' : ''}₦${s}`
}

/** Counts up to a value (rewards, recap numbers). */
export function CountUp({ to, ms = 900, format = (n: number) => String(Math.round(n)), className = '' }: { to: number; ms?: number; format?: (n: number) => string; className?: string }) {
  const [v, setV] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    const t0 = performance.now(), reduce = document.documentElement.classList.contains('reduce-motion')
    if (reduce) { setV(to); return }
    const loop = (now: number) => { const t = Math.min(1, (now - t0) / ms); setV(to * (1 - Math.pow(1 - t, 3))); if (t < 1) raf.current = requestAnimationFrame(loop) }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [to, ms])
  return <span className={`num ${className}`}>{format(v)}</span>
}

/** A burst of paper confetti for big moments (achievements, a good ending). */
export function Confetti({ n = 36 }: { n?: number }) {
  const bits = useRef(Array.from({ length: n }, (_, i) => ({ l: Math.random() * 100, d: Math.random() * 0.8, t: 1.6 + Math.random() * 1.6, c: ['#ffc72c', '#ff3d8b', '#35e0f0', '#2bd978', '#8f6bff'][i % 5], w: 6 + Math.random() * 6 }))).current
  useEffect(() => { audio.sfx('reward') }, [])
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      {bits.map((b, i) => <i key={i} style={{ position: 'absolute', top: 0, left: `${b.l}%`, width: b.w, height: b.w * 1.6, background: b.c, borderRadius: 2, animation: `confetti ${b.t}s ${b.d}s ease-in both` }} />)}
    </div>
  )
}

export function DeltaChips({ deltas, limit = 8 }: { deltas: StatDelta[]; limit?: number }) {
  const list = deltas.filter((d) => d.delta !== 0 && d.stat !== 'energy').slice(0, limit)
  if (!list.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Changes">
      {list.map((d, i) => {
        const pos = d.stat === 'stress' ? d.delta < 0 : d.delta > 0
        const meta = STAT_META[d.stat as keyof typeof STAT_META]
        const label = d.stat === 'cash' ? naira(d.delta) : `${d.delta > 0 ? '+' : ''}${d.delta}`
        return (
          <span key={i} className={`chip pop ${pos ? 'chip-green' : 'chip-red'}`} style={{ animationDelay: `${i * 70}ms` }}>
            {meta ? <Icon name={meta.ic} size={14} /> : <Icon name="chat" size={14} />}{d.stat === 'cash' && d.delta > 0 ? '+' : ''}{label}
          </span>
        )
      })}
    </div>
  )
}

export function Toasts({ items }: { items: { id: number; text: string; kind: 'ach' | 'info' }[] }) {
  const last = items[items.length - 1]
  useEffect(() => { if (last) audio.sfx(last.kind === 'ach' ? 'reward' : 'pop') }, [last?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
    {/* While a message is showing, everything behind it fades back so the message can be read; it returns to full strength when the message leaves. */}
    <div className="fixed inset-0 z-[59] pointer-events-none" style={{ background: 'rgba(8,5,30,.62)', opacity: items.length ? 1 : 0, transition: 'opacity .3s ease' }} aria-hidden="true" />
    <div className="fixed top-3 left-0 right-0 z-[60] flex flex-col items-center gap-2 pointer-events-none px-3" style={{ paddingTop: 'var(--safe-t)' }} aria-live="polite">
      {items.map((t) => {
        const ach = t.kind === 'ach'
        return (
          <div key={t.id} className="slide-r flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full max-w-sm font-extrabold text-sm" style={{ background: ach ? 'linear-gradient(90deg,#ffc72c,#f59e0b)' : 'linear-gradient(90deg, rgba(60,40,170,.96), rgba(26,18,84,.96))', color: ach ? '#3b2300' : '#fff', border: `1px solid ${ach ? '#fff3b0' : 'rgba(255,255,255,.2)'}`, boxShadow: '0 10px 24px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.35)' }}>
            <span className="grid place-items-center w-8 h-8 rounded-full" style={{ background: ach ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.14)' }}><Icon name={ach ? 'trophy' : 'check'} size={18} color={ach ? '#7a4700' : '#9bffc3'} /></span>
            <span className="leading-tight">{t.text.replace(/^[^\p{L}\p{N}]+\s*/u, '')}</span>
          </div>
        )
      })}
    </div>
    </>
  )
}

/** Oga Conductor: the danfo conductor who guides new players. A portrait in a speech card; one short line at a time. */
export function Conductor({ size = 72, mood = 'hype' }: { size?: number; mood?: 'hype' | 'wow' | 'hmm' }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label="Oga Conductor" style={{ flex: 'none', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.45))' }}>
      <defs>
        <radialGradient id="cbg" cx=".35" cy=".25" r=".9"><stop offset="0" stopColor="#ffe27a" /><stop offset="1" stopColor="#ff7a4d" /></radialGradient>
        <linearGradient id="ccap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd84a" /><stop offset="1" stopColor="#f59e0b" /></linearGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="url(#cbg)" stroke="#1a0f55" strokeWidth="4" />
      <path d="M14 104c4-18 20-26 46-26s42 8 46 26a56 56 0 0 1-92 0z" fill="#25c26a" stroke="#1a0f55" strokeWidth="3" />
      <path d="M60 80v26" stroke="#fff" strokeWidth="5" />
      <ellipse cx="60" cy="58" rx="27" ry="30" fill="#9a6339" stroke="#1a0f55" strokeWidth="3" />
      <path d="M31 40c1-18 14-27 29-27s28 9 29 27c-7-5-18-8-29-8s-22 3-29 8z" fill="url(#ccap)" stroke="#1a0f55" strokeWidth="3" />
      <path d="M31 40c-8 1-12 4-14 8 10-2 20-1 28 1z" fill="#1a0f55" />
      <rect x="31" y="35" width="58" height="6" rx="3" fill="#1a0f55" />
      <ellipse cx="49" cy="56" rx="4.2" ry={mood === 'wow' ? 6.4 : 5} fill="#fff" stroke="#1a0f55" strokeWidth="2" /><ellipse cx="71" cy="56" rx="4.2" ry={mood === 'wow' ? 6.4 : 5} fill="#fff" stroke="#1a0f55" strokeWidth="2" />
      <circle cx="50" cy="57" r="2.2" fill="#1a0f55" /><circle cx="72" cy="57" r="2.2" fill="#1a0f55" />
      <path d={mood === 'hmm' ? 'M41 47l14 3M79 47l-14 3' : 'M41 49l13-4M79 49l-13-4'} stroke="#1a0f55" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 66c4-4 28-4 32 0 0 3-4 4-8 3-3-1-13-1-16 0-4 1-8 0-8-3z" fill="#1a0f55" />
      <path d={mood === 'hmm' ? 'M50 76h20' : 'M48 72c3 12 21 12 24 0z'} fill={mood === 'hmm' ? 'none' : '#7a1020'} stroke="#1a0f55" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {mood !== 'hmm' && <path d="M52 72h16v4a8 6 0 0 1-16 0z" fill="#fff" />}
    </svg>
  )
}

export function Mentor({ children, mood = 'hype', onNext, nextLabel = 'Next', className = '' }: { children: ReactNode; mood?: 'hype' | 'wow' | 'hmm'; onNext?: () => void; nextLabel?: string; className?: string }) {
  return (
    <div className={`flex items-end gap-2 ${className}`}>
      <div className="float"><Conductor mood={mood} size={74} /></div>
      <div className="relative flex-1 rounded-2xl rounded-bl-md px-3.5 py-2.5 pop" style={{ background: '#fffaf0', color: '#1a0f55', boxShadow: '0 10px 24px rgba(0,0,0,.4)' }}>
        <div className="font-extrabold leading-snug text-[15px]">{children}</div>
        {onNext && <button className="mt-1.5 text-[12px] font-black uppercase tracking-wide text-violet" style={{ color: '#6a3df5' }} onClick={() => { audio.sfx('click'); onNext() }}>{nextLabel} ▸</button>}
      </div>
    </div>
  )
}

/** Big tappable tile: icon on top, short label, optional chip row. */
export function Tile({ icon, emoji, label, sub, on, disabled, locked, onClick, children, className = '' }: { icon?: IconName; emoji?: string; label: string; sub?: string; on?: boolean; disabled?: boolean; locked?: boolean; onClick?: () => void; children?: ReactNode; className?: string }) {
  return (
    <button className={`tile ${on ? 'is-on' : ''} ${className}`} disabled={disabled} onClick={() => { audio.sfx('tap'); onClick?.() }} aria-pressed={on}>
      {locked ? <Icon name="lock" size={26} /> : icon ? <Icon name={icon} size={30} /> : <span className="text-[30px] leading-none">{emoji}</span>}
      <span className="font-display text-[15px] leading-tight text-center uppercase tracking-wide">{label}</span>
      {sub && <span className="text-[11px] font-bold opacity-75 leading-tight text-center">{sub}</span>}
      {children}
      {on && <span className="absolute top-1.5 right-1.5 grid place-items-center w-5 h-5 rounded-full" style={{ background: 'var(--gold)' }}><Icon name="check" size={13} color="#3b2300" /></span>}
    </button>
  )
}
