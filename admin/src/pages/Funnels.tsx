import { useState } from 'react'
import { qs, type FilterState } from '../api'
import { useApi } from '../hooks'
import { Card, Chart, Loading, Table } from '../ui'

export function Funnels({ f }: { f: FilterState }) {
  const [by, setBy] = useState<'week' | 'country' | 'device_type'>('week')
  const { data, error } = useApi<any>(`funnels?${qs(f, { by })}`)
  if (!data) return <Loading error={error} />
  const fu = data.funnel, rt = data.retention
  const shade = (v: number | null) => (v === null ? 'transparent' : `var(--seq${Math.min(4, Math.floor(v / 20))})`)
  return (
    <>
      <p className="muted small">Players first seen in the selected dates. {fu.total} players in this view.</p>
      <Card title="Where new players drop off" def={fu.definition}>
        {fu.rows.map((r: any, i: number) => (
          <div className="hbar" style={{ gridTemplateColumns: '190px minmax(40px,1fr) minmax(110px,auto)' }} key={r.id}>
            <span>{i + 1}. {r.label}</span>
            <div className="track"><div className="fill" style={{ width: `${r.of_start_pct ?? 0}%` }} /></div>
            <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{r.count} · {r.of_start_pct ?? 0}%{i > 0 && r.lost > 0 ? <span className="muted small"> (−{r.lost})</span> : null}</span>
          </div>
        ))}
        <p className="muted small" style={{ marginBottom: 0 }}>Top-up counts real payments only; the game's test top-up is ignored.</p>
      </Card>
      <div style={{ marginTop: 12 }}>
        <Card title="Retention by cohort" def={rt.definition} actions={<div className="seg" role="group" aria-label="Group cohorts by">{([['week', 'Week'], ['country', 'Country'], ['device_type', 'Device']] as const).map(([k, l]) => <button key={k} aria-pressed={by === k} onClick={() => setBy(k)}>{l}</button>)}</div>}>
          {!rt.rows.length ? <p className="muted">No new players in this range.</p> : (
            <div className="scroll"><table>
              <thead><tr><th>{by === 'week' ? 'Week starting' : by === 'country' ? 'Country' : 'Device'}</th><th className="num">Players</th>{rt.days.map((d: number) => <th key={d} className="num">D{d}</th>)}</tr></thead>
              <tbody>{rt.rows.map((r: any) => <tr key={r.cohort}><td>{r.cohort}</td><td className="num">{r.size}</td>{r.values.map((v: number | null, i: number) => <td key={i} className="num" style={{ background: shade(v), color: v !== null && v >= 60 ? '#fff' : undefined }}>{v === null ? <span className="muted">–</span> : `${Math.round(v)}%`}</td>)}</tr>)}</tbody>
            </table></div>)}
        </Card>
      </div>
      <div className="grid cols2" style={{ marginTop: 12 }}>
        <Chart title="Age when players stop" kind="bar" def={data.dropoff.definition} data={data.dropoff.quit} x="label" series={[{ key: 'lives', label: 'Unfinished lives' }]} />
        <Card title="Most common endings"><Table cols={[{ key: 'ending_id', label: 'Ending' }, { key: 'lives', label: 'Lives', num: true }, { key: 'avg_age', label: 'Average age', num: true }]} rows={data.dropoff.endings} empty="No finished lives in this range." /></Card>
      </div>
    </>
  )
}
