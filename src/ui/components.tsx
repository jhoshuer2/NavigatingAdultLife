import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { useEffect } from 'react'
import type { StatDelta } from '@engine/core/types'
import { audio } from '@platform/audio'

export function Btn({ variant = 'primary', className = '', onClick, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'green' | 'ghost' | 'danger' }) {
  return <button {...p} className={`btn btn-${variant} ${className}`} onClick={(e) => { audio.sfx('click'); onClick?.(e) }} />
}

export function Modal({ children, onClose, title, wide }: { children: ReactNode; onClose?: () => void; title?: string; wide?: boolean }) {
  useEffect(() => {
    if (!onClose) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={`sheet relative w-full ${wide ? 'max-w-xl' : 'max-w-md'} max-h-[92vh] scroll-y card rounded-b-none sm:rounded-b-[20px] p-4 safe-pad`} style={{ background: '#1e1a30' }}>
        {title && <h2 className="font-display text-3xl text-danfo mb-2">{title}</h2>}
        {children}
      </div>
    </div>
  )
}

export const STAT_META = {
  cash: { icon: '₦', name: 'Cash', color: '#2fd27b' },
  energy: { icon: '⚡', name: 'Energy', color: '#ffd23f' },
  happiness: { icon: '😊', name: 'Happiness', color: '#ff7ab8' },
  knowledge: { icon: '📚', name: 'Knowledge', color: '#6ab7ff' },
  reputation: { icon: '⭐', name: 'Reputation', color: '#ffa94d' },
  health: { icon: '❤️', name: 'Health', color: '#ff6b5e' },
  stress: { icon: '😮‍💨', name: 'Stress', color: '#b69cff' },
} as const

export function StatBar({ stat, value, max = 100, delta }: { stat: keyof typeof STAT_META; value: number; max?: number; delta?: number }) {
  const m = STAT_META[stat]
  return (
    <div className="min-w-0" aria-label={`${m.name} ${value}`}>
      <div className="flex items-center justify-between text-xs font-extrabold leading-none mb-1">
        <span>{m.icon} <span className="opacity-80 hidden sm:inline">{m.name}</span></span>
        <span className="tabular-nums">{value}{delta ? <span className={(stat === 'stress' ? delta < 0 : delta > 0) ? 'text-green-300' : 'text-red-300'}> {delta > 0 ? '+' : ''}{delta}</span> : null}</span>
      </div>
      <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, background: m.color }} /></div>
    </div>
  )
}

export const naira = (n: number) => `${n < 0 ? '−' : ''}₦${Math.abs(Math.round(n)).toLocaleString('en-NG')}`
export const nairaShort = (n: number) => {
  const a = Math.abs(n)
  const s = a >= 1e9 ? `${(a / 1e9).toFixed(1)}B` : a >= 1e6 ? `${(a / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M` : a >= 1e4 ? `${Math.round(a / 1e3)}k` : a.toLocaleString('en-NG')
  return `${n < 0 ? '−' : ''}₦${s}`
}

export function DeltaChips({ deltas, limit = 8 }: { deltas: StatDelta[]; limit?: number }) {
  const list = deltas.filter((d) => d.delta !== 0 && d.stat !== 'energy').slice(0, limit)
  if (!list.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2" aria-label="Changes">
      {list.map((d, i) => {
        const pos = d.stat === 'stress' ? d.delta < 0 : d.delta > 0
        const label = d.stat === 'cash' ? naira(d.delta) : `${d.delta > 0 ? '+' : ''}${d.delta}`
        const name = d.stat === 'rel' ? d.label : STAT_META[d.stat as keyof typeof STAT_META]?.name ?? d.label
        const sign = d.stat === 'cash' && d.delta > 0 ? '+' : ''
        return (
          <span key={i} className="chip pop" style={{ background: pos ? '#1d5a3a' : '#5a1f24', color: pos ? '#9bffc3' : '#ffb3ae' }}>
            {STAT_META[d.stat as keyof typeof STAT_META]?.icon ?? '💬'} {sign}{label} <span className="opacity-70">{name}</span>
          </span>
        )
      })}
    </div>
  )
}

export function Toasts({ items }: { items: { id: number; text: string; kind: 'ach' | 'info' }[] }) {
  return (
    <div className="fixed top-3 left-0 right-0 z-[60] flex flex-col items-center gap-2 pointer-events-none px-3" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="pop card px-4 py-2 font-extrabold text-sm max-w-sm" style={{ background: t.kind === 'ach' ? '#5a3d00' : '#241f38', borderColor: t.kind === 'ach' ? '#ffd23f' : '#3a3358' }}>{t.text}</div>
      ))}
    </div>
  )
}
