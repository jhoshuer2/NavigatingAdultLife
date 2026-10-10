import { useState } from 'react'
import { api, fmtDate, type Admin } from '../api'
import { useApi } from '../hooks'
import { Card, Loading, Table } from '../ui'

export function Settings({ admin }: { admin: Admin }) {
  const [tab, setTab] = useState<'users' | 'audit' | 'schema'>('users')
  return (
    <>
      <div className="seg tabs" role="group" aria-label="Settings section">{(['users', 'audit', 'schema'] as const).map((t) => <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>{{ users: 'Users and roles', audit: 'Audit log', schema: 'Data and retention' }[t]}</button>)}</div>
      {tab === 'users' && <Users me={admin} />}{tab === 'audit' && <Audit />}{tab === 'schema' && <Schema />}
    </>
  )
}

function Users({ me }: { me: Admin }) {
  const [n, setN] = useState(0); const { data, error } = useApi<any>(`settings/users?n=${n}`)
  const [f, setF] = useState({ email: '', role: 'analyst' }); const [made, setMade] = useState<any>(null); const [err, setErr] = useState('')
  if (!data) return <Loading error={error} />
  return (
    <div className="grid">
      <Card title="Add a user">
        <form className="bar" onSubmit={async (e) => { e.preventDefault(); setErr(''); try { setMade(await api('settings/users', { method: 'POST', body: f })); setF({ ...f, email: '' }); setN(n + 1) } catch (x) { setErr((x as Error).message) } }}>
          <input type="email" required placeholder="email" aria-label="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <select aria-label="Role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{['owner', 'analyst', 'support', 'engineer'].map((r) => <option key={r}>{r}</option>)}</select>
          <button className="btn primary">Create</button>
        </form>
        {err && <div className="err" role="alert">{err}</div>}
        {made && <div className="card" role="status"><b>Copy these now. They are shown once.</b><br />Password: <code>{made.password}</code><br />2FA secret: <code>{made.totp_secret}</code><br /><span className="muted small">Add the secret to an authenticator app. Send the details to the person privately.</span></div>}
        <p className="muted small">Roles: owner (everything), analyst (aggregates and hashed exports, no single-player pages), support (look up one player, erase on request), engineer (overview only for now).</p>
      </Card>
      <Card title="Users"><Table cols={[{ key: 'email', label: 'Email' }, { key: 'role', label: 'Role' }, { key: 'created_at', label: 'Created', render: (r) => fmtDate(r.created_at) }, { key: 'disabled', label: '', render: (r) => r.disabled ? <span className="chip">disabled</span> : r.admin_id === me.admin_id ? <span className="muted small">you</span> : <button className="btn danger" onClick={async () => { if (confirm(`Disable ${r.email}?`)) { await api(`settings/users/${r.admin_id}/disable`, { method: 'POST' }); setN(n + 1) } }}>Disable</button> }]} rows={data.users} /></Card>
    </div>
  )
}

function Audit() {
  const { data, error } = useApi<any>('settings/audit')
  if (!data) return <Loading error={error} />
  return <Card title="Audit log (latest 200)" def="Every sign-in, single-player lookup, export, erasure and user change. It cannot be edited or deleted."><Table cols={[{ key: 'at', label: 'When', render: (r) => fmtDate(r.at) }, { key: 'admin_email', label: 'Who', render: (r) => r.admin_email ?? '–' }, { key: 'action', label: 'Action' }, { key: 'target', label: 'Target', render: (r) => r.target ?? '–' }, { key: 'ip_hash', label: 'Network (hashed)', render: (r) => r.ip_hash ?? '–' }]} rows={data.rows} /></Card>
}

function Schema() {
  const { data, error } = useApi<any>('settings/schema')
  if (!data) return <Loading error={error} />
  const r = data.retention
  return (
    <div className="grid">
      <Card title="Retention"><p>Detailed events are deleted after <b>{r.rawEventsDays} days</b>. Daily summaries, sessions and lives after <b>{r.summaryMonths} months</b>. The audit log after <b>{r.auditMonths} months</b>. A daily job applies these.</p></Card>
      <Card title="Collector health (last 14 days)"><Table cols={[{ key: 'day', label: 'Day' }, { key: 'accepted', label: 'Accepted', num: true }, { key: 'duplicate', label: 'Duplicate', num: true }, { key: 'invalid', label: 'Invalid', num: true }, { key: 'rate_limited', label: 'Rate limited', num: true }]} rows={data.ingest} /></Card>
      <Card title="Events the game can send" def="Only these fields are stored for each event. Anything else is dropped by the collector, and no free text from players is ever accepted."><Table cols={[{ key: 'name', label: 'Event' }, { key: 'props', label: 'Allowed fields' }]} rows={Object.entries(data.events).map(([name, props]) => ({ name, props: (props as string[]).join(', ') || '–' }))} /></Card>
      <Card title="Metric definitions"><Table cols={[{ key: 'k', label: 'Metric' }, { key: 'v', label: 'Definition' }]} rows={Object.entries(data.definitions).map(([k, v]) => ({ k, v }))} /></Card>
    </div>
  )
}
