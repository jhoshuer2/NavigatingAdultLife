import { useEffect, useState } from 'react'
import { api, defaultFilters, rangeFor, type Admin, type FilterState } from './api'
import { useApi } from './hooks'
import { Overview } from './pages/Overview'
import { Players } from './pages/Players'
import { Geography } from './pages/Geography'
import { Engagement } from './pages/Engagement'
import { Features } from './pages/Features'
import { Settings } from './pages/Settings'

const PAGES: { id: string; label: string; roles: Admin['role'][]; filters: boolean }[] = [
  { id: 'overview', label: 'Overview', roles: ['owner', 'analyst', 'engineer'], filters: true },
  { id: 'players', label: 'Players', roles: ['owner', 'analyst', 'support'], filters: true },
  { id: 'geography', label: 'Geography', roles: ['owner', 'analyst'], filters: true },
  { id: 'engagement', label: 'Engagement', roles: ['owner', 'analyst'], filters: true },
  { id: 'features', label: 'Features', roles: ['owner', 'analyst'], filters: true },
  { id: 'settings', label: 'Settings', roles: ['owner'], filters: false },
]

function useHash() {
  const [h, setH] = useState(() => location.hash.slice(1) || 'overview')
  useEffect(() => { const f = () => setH(location.hash.slice(1) || 'overview'); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return h
}

function Login({ onDone }: { onDone: (a: Admin) => void }) {
  const [f, setF] = useState({ email: '', password: '', code: '' }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })
  return (
    <div className="login card">
      <h2>Adult Life Admin</h2>
      <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(''); try { onDone((await api('login', { method: 'POST', body: f })).admin) } catch (x) { setErr((x as Error).message) } setBusy(false) }}>
        <label>Email<input type="email" autoComplete="username" required value={f.email} onChange={set('email')} /></label>
        <label>Password<input type="password" autoComplete="current-password" required value={f.password} onChange={set('password')} /></label>
        <label>6-digit code from your authenticator app<input inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" required value={f.code} onChange={set('code')} /></label>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}

function FilterBar({ f, set }: { f: FilterState; set: (f: FilterState) => void }) {
  const { data: o } = useApi<{ countries: string[]; app_versions: string[]; device_types: string[] }>('options')
  const pick = (r: FilterState['range']) => set({ ...f, range: r, ...rangeFor(r, f.from, f.to) })
  const sel = (k: 'country' | 'device_type' | 'app_version' | 'cohort', label: string, opts: [string, string][]) => (
    <select aria-label={label} value={f[k]} onChange={(e) => set({ ...f, [k]: e.target.value })}><option value="all">{label}: all</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
  )
  return (
    <div className="bar" role="group" aria-label="Filters">
      <div className="seg" role="group" aria-label="Date range">{(['7d', '30d', '90d'] as const).map((r) => <button key={r} aria-pressed={f.range === r} onClick={() => pick(r)}>{r === '7d' ? '7 days' : r === '30d' ? '30 days' : '90 days'}</button>)}<button aria-pressed={f.range === 'custom'} onClick={() => set({ ...f, range: 'custom' })}>Custom</button></div>
      {f.range === 'custom' && <><input type="date" aria-label="From" value={f.from} max={f.to} onChange={(e) => set({ ...f, from: e.target.value })} /><input type="date" aria-label="To" value={f.to} min={f.from} onChange={(e) => set({ ...f, to: e.target.value })} /></>}
      {sel('country', 'Country', (o?.countries ?? []).map((c) => [c, c]))}
      {sel('device_type', 'Device', (o?.device_types ?? []).map((c) => [c, c]))}
      {sel('app_version', 'Version', (o?.app_versions ?? []).map((c) => [c, c]))}
      {sel('cohort', 'Players', [['new', 'New'], ['returning', 'Returning']])}
    </div>
  )
}

export default function App() {
  const [admin, setAdmin] = useState<Admin | null | undefined>(undefined)
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const hash = useHash()
  useEffect(() => { api('me').then((r) => setAdmin(r.admin)).catch(() => setAdmin(null)) }, [])
  if (admin === undefined) return <p className="muted" style={{ padding: 24 }}>Loading…</p>
  if (!admin) return <Login onDone={setAdmin} />
  const allowed = PAGES.filter((p) => p.roles.includes(admin.role))
  const [id, sub] = hash.split('/'); const page = allowed.find((p) => p.id === id) ?? allowed[0]
  const body = {
    overview: <Overview f={filters} />, players: <Players f={filters} admin={admin} id={sub} />, geography: <Geography f={filters} />,
    engagement: <Engagement f={filters} />, features: <Features f={filters} />, settings: <Settings admin={admin} />,
  }[page.id]
  return (
    <div className="shell">
      <nav className="nav" aria-label="Main">
        <h1>Adult Life · Admin</h1>
        {allowed.map((p) => <a key={p.id} href={`#${p.id}`} aria-current={p.id === page.id ? 'page' : undefined}>{p.label}</a>)}
        <div className="who">{admin.email}<br />{admin.role} · <a href="#" onClick={async (e) => { e.preventDefault(); await api('logout', { method: 'POST' }); setAdmin(null) }}>Sign out</a></div>
      </nav>
      <main>
        <h2>{page.label}</h2>
        {page.filters && <FilterBar f={filters} set={setFilters} />}
        {body}
      </main>
    </div>
  )
}
