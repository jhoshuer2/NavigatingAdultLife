import { useState } from 'react'
import type { AccountPublic } from '@shared/account'
import { Btn, Tile } from '../components'
import { Icon } from '../icons'
import { useGame } from '../../store'
import { audio } from '@platform/audio'
import { ACCOUNT_ERRORS, createAccount, deleteAccount, recoverAccount, rotateRecovery, savedAccount, setGuardianPin, signOutEverywhere, signOutHere, updateAccount } from '@platform/account'

const BANDS: { id: AccountPublic['age_band']; label: string; sub: string; emoji: string }[] = [
  { id: 'under13', label: 'Under 13', sub: 'Guardian PIN', emoji: '🧒' },
  { id: '13to17', label: '13 to 17', sub: 'Teen', emoji: '🧑' },
  { id: '18plus', label: '18+', sub: 'Adult', emoji: '🧔' },
]

/** Settings > Online profile. Anonymous: no email or phone. Multiplayer itself is a later phase; this only manages the profile. */
export function OnlineProfile() {
  const toast = useGame((s) => s.toast)
  const [acc, setAcc] = useState<AccountPublic | null>(savedAccount())
  const [busy, setBusy] = useState(false)
  const [name, setName] = useState('')
  const [band, setBand] = useState<AccountPublic['age_band']>('13to17')
  const [code, setCode] = useState('')
  const [recovery, setRecovery] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [mode, setMode] = useState<'new' | 'recover'>('new')

  const run = async (f: () => Promise<{ error?: string; account?: AccountPublic; recovery_code?: string; ok?: boolean }>, ok?: string) => {
    setBusy(true)
    const r = await f()
    setBusy(false)
    if (r.error) { toast(ACCOUNT_ERRORS[r.error] ?? ACCOUNT_ERRORS.server); return null }
    if (r.account) setAcc(r.account)
    if (r.recovery_code) setRecovery(r.recovery_code)
    if (ok) toast(ok)
    return r
  }
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); toast('Copied') } catch { toast('Copy it by hand') } }

  const recoveryCard = recovery && (
    <div className="hud-glass rounded-2xl p-3 mt-2 text-center pop">
      <div className="chip chip-gold !py-0.5"><Icon name="lock" size={12} color="#3b2300" />Recovery code</div>
      <div className="font-display text-2xl tracking-widest mt-2 select-all">{recovery}</div>
      <div className="text-xs opacity-70 mt-1">Write it down. It is the only way back into this profile on another phone.</div>
      <div className="flex gap-2 mt-2"><Btn size="sm" variant="ghost" className="flex-1" onClick={() => copy(recovery)}>Copy</Btn><Btn size="sm" variant="green" className="flex-1" onClick={() => setRecovery(null)}>I saved it</Btn></div>
    </div>
  )

  if (!acc) {
    return (
      <div>
        <div className="flex gap-2 mb-2"><Btn size="sm" variant={mode === 'new' ? 'green' : 'ghost'} onClick={() => setMode('new')}>New profile</Btn><Btn size="sm" variant={mode === 'recover' ? 'green' : 'ghost'} onClick={() => setMode('recover')}>I have a code</Btn></div>
        {mode === 'new' ? (
          <div className="card p-3">
            <input className="w-full rounded-xl bg-black/30 px-3 py-3 font-bold outline-none focus:ring-2 ring-white/60" placeholder="Pick a name" maxLength={16} value={name} onChange={(e) => setName(e.target.value)} aria-label="Display name" />
            <div className="grid grid-cols-3 gap-2 mt-2">{BANDS.map((b) => <Tile key={b.id} emoji={b.emoji} label={b.label} sub={b.sub} on={band === b.id} onClick={() => setBand(b.id)} />)}</div>
            <Btn variant="green" className="w-full mt-3" disabled={busy || name.trim().length < 3} onClick={() => run(() => createAccount(name.trim(), band), 'Profile created')}>Create profile</Btn>
          </div>
        ) : (
          <div className="card p-3">
            <input className="w-full rounded-xl bg-black/30 px-3 py-3 font-display tracking-widest uppercase outline-none focus:ring-2 ring-white/60" placeholder="XXXX-XXXX-XXXX-XXXX" maxLength={19} value={code} onChange={(e) => setCode(e.target.value)} aria-label="Recovery code" />
            <Btn variant="green" className="w-full mt-3" disabled={busy || code.trim().length < 19} onClick={() => run(() => recoverAccount(code), 'Welcome back')}>Restore</Btn>
          </div>
        )}
        {recoveryCard}
      </div>
    )
  }

  return (
    <div className="card p-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full grid place-items-center font-display text-xl" style={{ background: 'radial-gradient(circle at 30% 20%, #5cc8ff, #2a4fd0)', boxShadow: 'inset 0 0 0 2px rgba(28,27,34,.35)' }}>{acc.name[0]}</div>
        <div className="min-w-0 flex-1"><div className="font-display text-xl leading-none">{acc.label}</div><div className="text-xs opacity-70 mt-1">Friend code <b className="select-all">{acc.friend_code}</b></div></div>
        <button className="chip" onClick={() => copy(acc.friend_code)} aria-label="Copy friend code"><Icon name="share" size={13} /></button>
      </div>
      {recoveryCard}
      <button className="card-btn flex items-center justify-between w-full mt-3" role="switch" aria-checked={acc.mp_enabled} disabled={busy} onClick={() => { audio.sfx('toggle'); return run(() => updateAccount({ mp_enabled: !acc.mp_enabled, ...(pin ? { pin } : {}) })) }}>
        <span className="font-bold text-sm">Play with other people (coming soon)</span>
        <span className="relative w-12 h-7 rounded-full shrink-0" style={{ background: acc.mp_enabled ? 'var(--green)' : 'rgba(28,27,34,.18)' }}><span className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all" style={{ left: acc.mp_enabled ? 22 : 2 }} /></span>
      </button>
      <div className="flex gap-2 mt-2">
        <input className="flex-1 min-w-0 rounded-xl bg-black/30 px-3 py-2 font-bold outline-none focus:ring-2 ring-white/60" inputMode="numeric" maxLength={4} placeholder={acc.has_guardian_pin ? 'Guardian PIN' : 'New PIN'} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} aria-label="Guardian PIN" />
        <Btn size="sm" variant="ghost" disabled={busy || pin.length !== 4} onClick={async () => { if (await run(() => setGuardianPin(pin), acc.has_guardian_pin ? 'PIN checked' : 'Guardian PIN set')) setPin('') }}>{acc.has_guardian_pin ? 'Unlock' : 'Set PIN'}</Btn>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <Btn size="sm" variant="ghost" disabled={busy} onClick={() => run(rotateRecovery, 'New recovery code')}>New code</Btn>
        <Btn size="sm" variant="ghost" onClick={() => { signOutHere(); setAcc(null) }}>Sign out</Btn>
        <Btn size="sm" variant="ghost" disabled={busy} onClick={async () => { await signOutEverywhere(); setAcc(null) }}>Sign out all</Btn>
        <Btn size="sm" variant="danger" disabled={busy} onClick={async () => { if (!confirm('Delete this online profile for good?')) return; const r = await run(deleteAccount, 'Profile deleted'); if (r) setAcc(null) }}>Delete</Btn>
      </div>
    </div>
  )
}
