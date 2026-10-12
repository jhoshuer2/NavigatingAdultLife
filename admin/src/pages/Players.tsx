import { useState } from 'react'
import { api, fmtDate, fmtDur, countryName, qs, type Admin, type FilterState } from '../api'
import { useApi } from '../hooks'
import { Card, Loading, Ranked, Table } from '../ui'

export function Players({ f, admin, id }: { f: FilterState; admin: Admin; id?: string }) {
  if (id) return <Detail id={id} admin={admin} />
  return <List f={f} admin={admin} />
}

function List({ f, admin }: { f: FilterState; admin: Admin }) {
  const [q, setQ] = useState(''); const [sort, setSort] = useState('last_seen'); const [dir, setDir] = useState<'asc' | 'desc'>('desc'); const [page, setPage] = useState(1)
  const [withTest, setWithTest] = useState(false)
  const query = qs(f, { q, sort, dir, page, size: 25, include_test: withTest ? 1 : undefined })
  const { data, error } = useApi<any>(`players?${query}`)
  const sortBtn = (key: string, label: string) => <button onClick={() => { if (sort === key) setDir(dir === 'asc' ? 'desc' : 'asc'); else { setSort(key); setDir('desc') } setPage(1) }} aria-label={`Sort by ${label}`}>{label}{sort === key ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}</button>
  return (
    <>
      <div className="bar">
        <input type="search" placeholder="Search by start of ID" aria-label="Search players" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} disabled={admin.role === 'analyst'} title={admin.role === 'analyst' ? 'Analysts see hashed IDs only' : ''} />
        {(admin.role === 'owner' || admin.role === 'analyst') && <a className="btn" href={`/api/admin/players.csv?${qs(f, { q, sort, dir })}`}>⬇ Export CSV{admin.role === 'analyst' ? ' (hashed IDs)' : ''}</a>}
        {admin.role === 'owner' && <label className="small"><input type="checkbox" checked={withTest} onChange={(e) => { setWithTest(e.target.checked); setPage(1) }} /> Include test devices (debug links, bots)</label>}
        <span className="muted small">Players are device IDs until accounts exist. A new browser or cleared data counts as a new player.</span>
      </div>
      <Card>
        {!data ? <Loading error={error} /> : (
          <>
            <div className="scroll"><table>
              <thead><tr>
                <th>Player</th><th>{sortBtn('first_seen', 'First seen')}</th><th>{sortBtn('last_seen', 'Last seen')}</th><th>{sortBtn('country', 'Location')}</th><th>Device</th>
                <th className="num">{sortBtn('sessions', 'Sessions')}</th><th className="num">{sortBtn('active', 'Active time')}</th><th className="num">{sortBtn('lives', 'Lives')}</th><th>Last feature</th><th>Tokens left</th><th>Status</th>
              </tr></thead>
              <tbody>{data.rows.map((r: any) => (
                <tr key={r.label}>
                  <td>{r.id ? <a href={`#players/${r.id}`}>{r.label}</a> : <code>{r.label}</code>}</td>
                  <td>{fmtDate(r.first_seen)}</td><td>{fmtDate(r.last_seen)}</td>
                  <td>{[r.city, countryName(r.country)].filter(Boolean).join(', ') || '–'}</td>
                  <td>{[r.device_type, r.os, r.browser].filter(Boolean).join(' · ')}</td>
                  <td className="num">{r.sessions_count}</td><td className="num">{fmtDur(r.active_seconds)}</td><td className="num">{r.lives_count}</td>
                  <td>{r.last_feature ?? '–'}</td><td className="muted" title="Needs the server token ledger (accounts milestone)">–</td>
                  <td><span className={`chip ${r.status}`}>{r.status}</span>{r.is_test && <span className="chip" style={{ marginLeft: 4 }}>test</span>}</td>
                </tr>))}</tbody>
            </table></div>
            {!data.rows.length && <p className="muted">No players match.</p>}
            <div className="bar" style={{ marginTop: 12, marginBottom: 0 }}>
              <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
              <span className="muted small">Page {data.page} of {Math.max(1, Math.ceil(data.total / data.size))} · {data.total} players</span>
              <button className="btn" disabled={page * data.size >= data.total} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          </>)}
      </Card>
    </>
  )
}

function Detail({ id, admin }: { id: string; admin: Admin }) {
  const { data, error } = useApi<any>(`player/${id}`)
  const [msg, setMsg] = useState('')
  if (!data) return <Loading error={error} />
  const d = data.device
  const erase = async () => {
    if (!confirm('Delete everything stored about this player? This cannot be undone and is recorded in the audit log.')) return
    try { await api(`player/${id}/erase`, { method: 'POST' }); location.hash = 'players' } catch (e) { setMsg((e as Error).message) }
  }
  return (
    <>
      <p><a href="#players">← All players</a></p>
      <div className="grid cols2">
        <Card title={`Player ${id.slice(0, 8)}`} actions={(admin.role === 'owner' || admin.role === 'support') && <button className="btn danger" onClick={erase}>Delete this player's data</button>}>
          {msg && <div className="err" role="alert">{msg}</div>}
          <Table cols={[{ key: 'k', label: 'Field' }, { key: 'v', label: 'Value' }]} rows={[
            { k: 'First seen', v: fmtDate(d.first_seen) }, { k: 'Last seen', v: fmtDate(d.last_seen) }, { k: 'Location', v: [d.city, d.region, countryName(d.country)].filter(Boolean).join(', ') || '–' },
            { k: 'Device', v: [d.device_type, d.os, `${d.browser} ${d.browser_version}`].join(' · ') }, { k: 'Language / time zone', v: `${d.language ?? '–'} / ${d.tz ?? '–'}` },
            { k: 'Sessions', v: d.sessions_count }, { k: 'Total active time', v: fmtDur(d.active_seconds) }, { k: 'Lives', v: d.lives_count }, { k: 'Consent', v: `v${d.consent_version ?? '?'} on ${fmtDate(d.consent_at)}` },
            { k: 'Token balance', v: 'Not tracked on the server yet' },
          ]} />
        </Card>
        <Card title="What they use"><Ranked rows={data.features.slice(0, 12)} label={(r) => r.feature} value={(r) => r.uses} /></Card>
      </div>
      <div className="grid" style={{ marginTop: 12 }}>
        <Card title="Sessions (latest 50)"><Table cols={[
          { key: 'started_at', label: 'Started', render: (r) => fmtDate(r.started_at) }, { key: 'active_seconds', label: 'Active time', num: true, render: (r) => fmtDur(r.active_seconds) },
          { key: 'span', label: 'Wall-clock', num: true, render: (r) => fmtDur((Date.parse(r.last_event_at) - Date.parse(r.started_at)) / 1000) },
          { key: 'screens', label: 'Where the time went', render: (r) => Object.entries(r.screens as Record<string, number>).map(([k, v]) => `${k} ${fmtDur(v)}`).join(' · ') || '–' }, { key: 'entry_referrer', label: 'Came from', render: (r) => r.entry_referrer ?? '–' },
        ]} rows={data.sessions} /></Card>
        <Card title="Lives"><Table cols={[
          { key: 'started_at', label: 'Started', render: (r) => fmtDate(r.started_at) }, { key: 'archetype', label: 'Archetype', render: (r) => r.archetype ?? '–' }, { key: 'district', label: 'District', render: (r) => r.district ?? '–' },
          { key: 'age_reached', label: 'Age reached', num: true, render: (r) => r.age_reached ?? '–' }, { key: 'ending_id', label: 'Ending', render: (r) => r.ending_id ?? 'in progress' },
        ]} rows={data.lives} /></Card>
        <Card title="Content flags"><Table cols={[{ key: 'ts', label: 'When', render: (r) => fmtDate(r.ts) }, { key: 'p', label: 'Event', render: (r) => r.props.event_id ?? '–' }, { key: 'r', label: 'Reason', render: (r) => r.props.reason ?? '–' }]} rows={data.flags} empty="No flags from this player." /></Card>
      </div>
    </>
  )
}
