import { useRef, useState } from 'react'
import { useGame } from '../../store'
import { InstallRow } from '../Install'
import { Btn, CountUp, Ribbon, RoundBtn, Tile } from '../components'
import { LANGS, plain, say } from '@content/lang'
import { speak, voiceAvailable } from '@platform/voice'
import { Icon, type IconName } from '../icons'
import { ACHIEVEMENTS } from '@content/achievements'
import { UNLOCKABLES } from '@platform/meta'
import { fmtTime, remainingSec } from '@platform/tokens'
import { audio } from '@platform/audio'
import { DREAM_BY_ID } from '@content/dreams'
import type { DreamId } from '@engine/core/types'
import { nairaShort } from '../components'
import { clearFlags, exportFlags, loadFlags } from '@platform/feedback'
import { analyticsAvailable, forgetMe, shortDeviceCode } from '@platform/analytics'
import { PrivacyDetails } from './Consent'
import { OnlineProfile } from './OnlineProfile'
import { accountAvailable } from '@platform/account'

function Page({ title, children, back = 'title' }: { title: string; children: React.ReactNode; back?: 'title' | 'play' }) {
  const go = useGame((s) => s.go)
  return (
    <div className="screen flex flex-col">
      <header className="px-4 pt-3 flex items-center gap-3"><RoundBtn icon="back" label="Back" onClick={() => go(back)} size={44} /><Ribbon>{title}</Ribbon></header>
      <main className="flex-1 px-4 py-3 scroll-y safe-pad">{children}</main>
    </div>
  )
}

export function Achievements() {
  const { meta } = useGame()
  const got = Object.keys(meta.achievements)
  const [open, setOpen] = useState<string | null>(null)
  const sel = ACHIEVEMENTS.find((a) => a.id === open)
  const selHas = sel ? got.includes(sel.id) : false
  return (
    <Page title="Trophies">
      <div className="hud-glass rounded-2xl p-3 flex items-center gap-3">
        <Icon name="trophy" size={34} color="#ffd23f" />
        <div className="flex-1"><div className="bar"><i style={{ width: `${(got.length / ACHIEVEMENTS.length) * 100}%`, background: 'linear-gradient(90deg,#ffe27a,#ffc72c)' }} /></div></div>
        <span className="font-display text-lg">{got.length}/{ACHIEVEMENTS.length}</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 mt-3 stagger">
        {ACHIEVEMENTS.map((a) => {
          const has = got.includes(a.id)
          const hidden = a.hidden && !has
          return (
            <button key={a.id} className={`tile ${has ? 'is-on' : ''}`} onClick={() => setOpen(a.id === open ? null : a.id)} style={{ opacity: has ? 1 : 0.7 }}>
              <span className="text-[34px] leading-none" style={has ? undefined : { filter: 'grayscale(1) brightness(.4)' }}>{hidden ? '❓' : a.icon}</span>
              <span className="font-display text-[12px] leading-tight text-center uppercase">{hidden ? '???' : a.title}</span>
            </button>
          )
        })}
      </div>
      {sel && (
        <div className="fixed left-3 right-3 bottom-3 z-30 hud-glass rounded-2xl p-3 pop flex items-center gap-3" onClick={() => setOpen(null)}>
          <span className="text-4xl">{sel.hidden && !selHas ? '❓' : sel.icon}</span>
          <div className="flex-1 min-w-0"><div className="font-display uppercase leading-tight">{sel.hidden && !selHas ? 'Hidden' : sel.title}</div><div className="text-xs opacity-75">{sel.hidden && !selHas ? 'Keep playing to discover it.' : sel.desc}</div></div>
          <span className="chip chip-gold"><Icon name="shell" size={13} color="#3b2300" />{sel.cowries}</span>
        </div>
      )}
    </Page>
  )
}

export function Unlocks() {
  const { meta, buyUnlock, toast } = useGame()
  return (
    <Page title="Unlocks">
      <div className="hud-glass rounded-2xl p-3 flex items-center gap-3">
        <Icon name="shell" size={34} color="#ffd23f" />
        <div className="font-display text-4xl text-gold leading-none"><CountUp to={meta.cowries} /></div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mt-3 stagger">
        {UNLOCKABLES.map((u) => {
          const has = meta.unlocks.includes(u.id)
          const can = !has && meta.cowries >= u.cost
          return (
            <button key={u.id} className={`tile !justify-between !py-3 ${has ? 'is-on' : ''}`} disabled={has || !can} onClick={() => { if (buyUnlock(u.id)) { audio.sfx('good'); toast(`Unlocked: ${u.name}`) } }}>
              <span className="font-display text-[15px] uppercase leading-tight text-center">{u.name}</span>
              <span className="text-[11px] opacity-70 leading-snug text-center font-bold">{u.desc}</span>
              {has ? <span className="chip chip-green"><Icon name="check" size={12} />Owned</span> : <span className={`chip ${can ? 'chip-gold' : ''}`}><Icon name={can ? 'shell' : 'lock'} size={12} color={can ? '#3b2300' : '#fff'} />{u.cost}</span>}
            </button>
          )
        })}
      </div>
    </Page>
  )
}

export function History() {
  const { meta } = useGame()
  const stat: [IconName, string, number][] = [['people', 'Lives', meta.stats.lives], ['trophy', 'Best legacy', meta.stats.bestLegacy], ['clock', 'Longest', meta.stats.longestLife], ['rocket', 'Dash best', meta.stats.dashBest]]
  return (
    <Page title="Past lives">
      <div className="grid grid-cols-4 gap-2">
        {stat.map(([ic, l, v]) => <div key={l} className="hud-glass rounded-2xl py-2 text-center"><Icon name={ic} size={20} color="#ffd23f" /><div className="font-display text-xl leading-none mt-1">{v}</div><div className="text-[10px] font-bold opacity-65 uppercase mt-0.5">{l}</div></div>)}
      </div>
      {meta.history.length === 0 && <p className="opacity-70 text-center mt-8">No finished lives yet.</p>}
      <div className="grid gap-2.5 mt-3 stagger">
        {meta.history.map((h, i) => (
          <div key={i} className="card p-3 flex items-center gap-3">
            <div className="w-14 h-14 rounded-full grid place-items-center font-display text-xl shrink-0" style={{ background: 'radial-gradient(circle at 30% 20%, #ffe27a, #c78a00)', color: '#3b2300' }}>{h.legacy}</div>
            <div className="min-w-0 flex-1">
              <div className="font-display uppercase leading-tight">{h.name}, {h.age}</div>
              <div className="text-xs opacity-75 leading-snug">{h.ending}</div>
              <div className="flex gap-1.5 mt-1"><span className="chip !py-0.5 chip-gold">{nairaShort(h.netWorth)}</span><span className={`chip !py-0.5 ${h.dreamDone ? 'chip-green' : ''}`}>{DREAM_BY_ID[h.dream as DreamId]?.icon ?? ''} {h.dreamDone ? 'Done' : 'Open'}</span></div>
            </div>
          </div>
        ))}
      </div>
    </Page>
  )
}

export function Settings() {
  const { meta, updateSettings, exportJson, importJson, toast, setUnlimited, life, setConsent, resetTips } = useGame()
  const file = useRef<HTMLInputElement>(null)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const s = meta.settings
  const Toggle = ({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) => (
    <button className="card-btn flex items-center justify-between w-full" onClick={() => { audio.sfx('toggle'); onChange(!on) }} role="switch" aria-checked={on}><span className="font-bold text-sm">{label}</span><span className="relative w-12 h-7 rounded-full shrink-0 transition-colors" style={{ background: on ? 'var(--green)' : 'rgba(255,255,255,.18)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,.4)' }}><span className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all" style={{ left: on ? 22 : 2, boxShadow: '0 2px 4px rgba(0,0,0,.4)' }} /></span></button>
  )
  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'navigating-adult-life-save.json'; a.click(); URL.revokeObjectURL(a.href)
  }
  return (
    <Page title="Settings" back={life ? 'play' : 'title'}>
      <h2 className="font-display text-xl text-white/90 uppercase tracking-wide mb-1">Guide</h2>
      <div className="grid grid-cols-3 gap-2.5">
        {LANGS.map((l) => <Tile key={l.id} emoji={l.emoji} label={l.label} sub={l.sub} on={(s.lang ?? 'en') === l.id} onClick={() => updateSettings({ lang: l.id })} />)}
      </div>
      <div className="grid gap-2 mt-2.5"><Toggle label="Show me what to do next" on={s.guide !== false} onChange={(v) => updateSettings({ guide: v })} />{voiceAvailable() && <Toggle label="Guide voice (speaks the tips)" on={s.voice !== false} onChange={(v) => { updateSettings({ voice: v }); if (v) speak(plain(s.lang, say('Hello! I go guide you.', 'How far! I go guide you.'))) }} />}<Btn variant="ghost" onClick={() => { resetTips(); toast('Tips will show again') }}>Show the how-to tips again</Btn></div>
      <h2 className="font-display text-xl text-white/90 uppercase tracking-wide mt-6 mb-1">Sound and display</h2>
      <div className="grid gap-2">
        <Toggle label="Sound effects" on={s.sound} onChange={(v) => { updateSettings({ sound: v }); audio.configure({ ...s, sound: v }) }} />
        <Toggle label="Music" on={s.music} onChange={(v) => { updateSettings({ music: v }); audio.configure({ ...s, music: v }) }} />
        <div className="card p-3"><label className="font-bold block mb-1" htmlFor="vol">Volume</label><input id="vol" type="range" min="0" max="1" step="0.05" value={s.volume} onChange={(e) => { const v = Number(e.target.value); updateSettings({ volume: v }); audio.configure({ ...s, volume: v }) }} className="w-full" /></div>
        <Toggle label="Reduced motion" on={s.reducedMotion} onChange={(v) => { updateSettings({ reducedMotion: v }); document.documentElement.classList.toggle('reduce-motion', v) }} />
 <Toggle label="Simple menu mode (lighter on older phones)" on={s.lite} onChange={(v) => updateSettings({ lite: v })} />
        <Toggle label="Larger text" on={s.bigText} onChange={(v) => updateSettings({ bigText: v })} />
        <Toggle label="Dash assist mode (slower, forgiving)" on={s.assist} onChange={(v) => updateSettings({ assist: v })} />
        <Toggle label="Share anonymous play statistics (optional)" on={meta.consentAnalytics} onChange={setConsent} />
        <button className="text-xs underline opacity-70 text-left" onClick={() => setShowPrivacy(!showPrivacy)}>{showPrivacy ? 'Hide' : 'What is collected?'}</button>
        {showPrivacy && <div className="card p-3"><PrivacyDetails />{analyticsAvailable() && <div className="text-xs mt-2 opacity-70">Your device code: <b>{shortDeviceCode()}</b></div>}</div>}
        {analyticsAvailable() && <Btn variant="danger" onClick={async () => { if (!confirm('Delete the play statistics stored about this device?')) return; const ok = await forgetMe(); toast(ok ? 'Your statistics were deleted' : 'Could not reach the server. Try again later.') }}>🗑 Delete my statistics</Btn>}
      </div>
      {accountAvailable() && <><h2 className="font-display text-xl text-white/90 uppercase tracking-wide mt-6 mb-1">Online profile</h2><OnlineProfile /></>}
      <h2 className="font-display text-xl text-white/90 uppercase tracking-wide mt-6 mb-1">Play time</h2>
      <div className="card p-3 mt-1 text-sm">Time left: <b>{fmtTime(remainingSec(meta))}</b>. Free time refills daily (up to 2 hours banked).
        <div className="mt-2"><Toggle label="Unlimited time (playtest mode)" on={meta.tokens.unlimited} onChange={setUnlimited} /></div></div>
      <h2 className="font-display text-xl text-white/90 uppercase tracking-wide mt-6 mb-1">Install</h2>
      <InstallRow />
      <h2 className="font-display text-xl text-white/90 uppercase tracking-wide mt-6 mb-1">Your data</h2>
      <div className="grid gap-2 mt-1">
        <Btn variant="ghost" onClick={download}>⬇️ Export save file</Btn>
        <Btn variant="ghost" onClick={() => file.current?.click()}>⬆️ Import save file</Btn>
        <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const ok = importJson(await f.text()); toast(ok ? 'Save imported' : 'That file could not be read') }} />
      </div>
      <h2 className="font-display text-xl text-white/90 uppercase tracking-wide mt-6 mb-1">Playtest feedback</h2>
      <p className="text-xs opacity-70">Tap 🚩 on any event to flag it. Flags are saved on this device ({loadFlags().length} so far).</p>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <Btn variant="ghost" onClick={() => { const blob = new Blob([exportFlags()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'nal-feedback.json'; a.click(); URL.revokeObjectURL(a.href) }}>⬇️ Export flags</Btn>
        <Btn variant="ghost" onClick={() => { if (confirm('Clear all saved flags?')) { clearFlags(); toast('Flags cleared') } }}>🗑 Clear</Btn>
      </div>
      <p className="text-xs opacity-50 mt-6">Navigating Adult Life · playtest build · music and art are placeholders. Saves live in this browser only.</p>
    </Page>
  )
}
