import { useRef, useState } from 'react'
import { useGame } from '../../store'
import { Btn } from '../components'
import { ACHIEVEMENTS } from '@content/achievements'
import { UNLOCKABLES } from '@platform/meta'
import { fmtTime, remainingSec } from '@platform/tokens'
import { audio } from '@platform/audio'
import { DREAM_BY_ID } from '@content/dreams'
import type { DreamId } from '@engine/core/types'
import { nairaShort } from '../components'

function Page({ title, children, back = 'title' }: { title: string; children: React.ReactNode; back?: 'title' | 'play' }) {
  const go = useGame((s) => s.go)
  return (
    <div className="min-h-full flex flex-col">
      <header className="px-4 pt-3 flex items-center gap-3"><button className="btn btn-ghost !min-h-10 !px-3" onClick={() => go(back)} aria-label="Back">←</button><h1 className="font-display text-4xl text-danfo">{title}</h1></header>
      <main className="flex-1 px-4 py-3 scroll-y safe-pad">{children}</main>
    </div>
  )
}

export function Achievements() {
  const { meta } = useGame()
  const got = Object.keys(meta.achievements)
  return (
    <Page title="Achievements">
      <div className="text-sm opacity-70 mb-3">{got.length}/{ACHIEVEMENTS.length} unlocked. Achievements carry across all your lives.</div>
      <div className="grid gap-2">
        {ACHIEVEMENTS.map((a) => {
          const has = got.includes(a.id)
          const hidden = a.hidden && !has
          return (
            <div key={a.id} className="card p-3 flex gap-3 items-center" style={{ opacity: has ? 1 : 0.6, borderColor: has ? '#ffd23f' : undefined }}>
              <div className="text-3xl w-10 text-center">{hidden ? '❓' : a.icon}</div>
              <div className="flex-1 min-w-0"><b>{hidden ? 'Hidden achievement' : a.title}</b><div className="text-xs opacity-75">{hidden ? 'Keep playing to discover it.' : a.desc}</div></div>
              <span className="chip">🐚 {a.cowries}</span>
            </div>
          )
        })}
      </div>
    </Page>
  )
}

export function Unlocks() {
  const { meta, buyUnlock, toast } = useGame()
  return (
    <Page title="Unlocks">
      <div className="card p-3 flex items-center justify-between"><div><div className="text-xs opacity-60">Your Cowries</div><div className="font-display text-4xl text-danfo">🐚 {meta.cowries}</div></div><div className="text-xs opacity-70 max-w-[55%]">Earn Cowries from achievements, quests and how your life ends.</div></div>
      <div className="grid gap-2 mt-3">
        {UNLOCKABLES.map((u) => {
          const has = meta.unlocks.includes(u.id)
          return (
            <button key={u.id} className="card-btn" disabled={has || meta.cowries < u.cost} onClick={() => { if (buyUnlock(u.id)) { audio.sfx('good'); toast(`Unlocked: ${u.name}`) } }}>
              <div className="flex justify-between"><b>{u.name}</b><span className="chip">{has ? '✅ Owned' : `🐚 ${u.cost}`}</span></div>
              <div className="text-xs opacity-70">{u.desc}</div>
            </button>
          )
        })}
      </div>
    </Page>
  )
}

export function History() {
  const { meta } = useGame()
  return (
    <Page title="Past lives">
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="card p-2">Lives played <b className="block text-xl">{meta.stats.lives}</b></div>
        <div className="card p-2">Best legacy <b className="block text-xl">{meta.stats.bestLegacy}</b></div>
        <div className="card p-2">Longest life <b className="block text-xl">{meta.stats.longestLife}</b></div>
        <div className="card p-2">Dash best <b className="block text-xl">{meta.stats.dashBest}</b></div>
      </div>
      {meta.history.length === 0 && <p className="opacity-70">No finished lives yet. Go and live one!</p>}
      <div className="grid gap-2">
        {meta.history.map((h, i) => (
          <div key={i} className="card p-3">
            <div className="flex justify-between"><b>{h.name}, {h.age}</b><span className="chip">Legacy {h.legacy}</span></div>
            <div className="text-sm text-danfo">{h.ending}</div>
            <div className="text-xs opacity-70">Net worth {nairaShort(h.netWorth)} · Dream: {DREAM_BY_ID[h.dream as DreamId]?.name ?? ''}{h.dreamDone ? ' ✅' : ''}</div>
          </div>
        ))}
      </div>
    </Page>
  )
}

export function Settings() {
  const { meta, updateSettings, exportJson, importJson, toast, setUnlimited, life } = useGame()
  const file = useRef<HTMLInputElement>(null)
  const [consent, setConsent] = useState(meta.consentAnalytics)
  const s = meta.settings
  const Toggle = ({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) => (
    <button className="card-btn flex items-center justify-between w-full" onClick={() => onChange(!on)} role="switch" aria-checked={on}><span className="font-bold">{label}</span><span className="chip" style={{ background: on ? '#1d5a3a' : '#ffffff14' }}>{on ? 'On' : 'Off'}</span></button>
  )
  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'navigating-adult-life-save.json'; a.click(); URL.revokeObjectURL(a.href)
  }
  return (
    <Page title="Settings" back={life ? 'play' : 'title'}>
      <div className="grid gap-2">
        <Toggle label="Sound effects" on={s.sound} onChange={(v) => { updateSettings({ sound: v }); audio.configure({ ...s, sound: v }) }} />
        <Toggle label="Music" on={s.music} onChange={(v) => { updateSettings({ music: v }); audio.configure({ ...s, music: v }) }} />
        <div className="card p-3"><label className="font-bold block mb-1" htmlFor="vol">Volume</label><input id="vol" type="range" min="0" max="1" step="0.05" value={s.volume} onChange={(e) => { const v = Number(e.target.value); updateSettings({ volume: v }); audio.configure({ ...s, volume: v }) }} className="w-full" /></div>
        <Toggle label="Reduced motion" on={s.reducedMotion} onChange={(v) => { updateSettings({ reducedMotion: v }); document.documentElement.classList.toggle('reduce-motion', v) }} />
        <Toggle label="Larger text" on={s.bigText} onChange={(v) => updateSettings({ bigText: v })} />
        <Toggle label="Dash assist mode (slower, forgiving)" on={s.assist} onChange={(v) => updateSettings({ assist: v })} />
        <Toggle label="Anonymous analytics (optional)" on={consent} onChange={(v) => { setConsent(v); useGame.setState({ meta: { ...meta, consentAnalytics: v } }) }} />
      </div>
      <h2 className="font-display text-2xl text-danfo mt-5">Play time</h2>
      <div className="card p-3 mt-1 text-sm">Time left: <b>{fmtTime(remainingSec(meta))}</b>. Free time refills daily (up to 2 hours banked).
        <div className="mt-2"><Toggle label="Unlimited time (playtest mode)" on={meta.tokens.unlimited} onChange={setUnlimited} /></div></div>
      <h2 className="font-display text-2xl text-danfo mt-5">Your data</h2>
      <div className="grid gap-2 mt-1">
        <Btn variant="ghost" onClick={download}>⬇️ Export save file</Btn>
        <Btn variant="ghost" onClick={() => file.current?.click()}>⬆️ Import save file</Btn>
        <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const ok = importJson(await f.text()); toast(ok ? 'Save imported' : 'That file could not be read') }} />
      </div>
      <p className="text-xs opacity-50 mt-6">Navigating Adult Life · playtest build · music and art are placeholders. Saves live in this browser only.</p>
    </Page>
  )
}
