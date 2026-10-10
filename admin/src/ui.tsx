import { useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fmtNum } from './api'

/** "?" badge: the definition of a metric on hover or keyboard focus (FR-A1). */
export function Def({ text }: { text?: string }) {
  if (!text) return null
  return <button type="button" className="def" aria-label={`Definition: ${text}`}>?<span className="tip" role="tooltip">{text}</span></button>
}

export function Kpi({ label, value, prev, def, fmt = fmtNum, invert }: { label: string; value: number | null; prev?: number | null; def?: string; fmt?: (n: number) => string; invert?: boolean }) {
  const d = value !== null && prev !== null && prev !== undefined && prev > 0 ? Math.round(((value - prev) / prev) * 100) : null
  const good = d === null ? '' : (d >= 0) !== !!invert ? 'up' : 'down'
  return (
    <div className="card kpi">
      <div className="label">{label}<Def text={def} /></div>
      <div className="value">{value === null ? '–' : fmt(value)}</div>
      <div className="delta">{d === null ? <span className="muted">{value === null ? 'Not available yet' : 'no earlier data'}</span> : <><b className={good}>{d > 0 ? '▲' : d < 0 ? '▼' : '■'} {Math.abs(d)}%</b> vs previous period</>}</div>
    </div>
  )
}

export function Card({ title, def, children, actions }: { title?: string; def?: string; children: ReactNode; actions?: ReactNode }) {
  return <section className="card">{(title || actions) && <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 8 }}><h3 style={{ margin: 0, display: 'flex', gap: 6, alignItems: 'center' }}>{title}<Def text={def} /></h3>{actions}</div>}{children}</section>
}

export function Table({ cols, rows, empty = 'No data in this range.' }: { cols: { key: string; label: string; num?: boolean; render?: (r: any) => ReactNode }[]; rows: any[]; empty?: string }) {
  if (!rows.length) return <p className="muted">{empty}</p>
  return (
    <div className="scroll"><table>
      <thead><tr>{cols.map((c) => <th key={c.key} className={c.num ? 'num' : ''}>{c.label}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c.key} className={c.num ? 'num' : ''}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>)}</tbody>
    </table></div>
  )
}

const COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)']
type Series = { key: string; label: string; fmt?: (n: number) => string }

/** A chart with a "Table" switch so numbers are readable without colour or sight. */
export function Chart({ title, def, data, x, series, kind = 'line', height = 240, xFmt }: { title: string; def?: string; data: any[]; x: string; series: Series[]; kind?: 'line' | 'bar'; height?: number; xFmt?: (v: string) => string }) {
  const [table, setTable] = useState(false)
  const fx = xFmt ?? ((v: string) => v)
  return (
    <Card title={title} def={def} actions={<div className="seg" role="group" aria-label="View"><button aria-pressed={!table} onClick={() => setTable(false)}>Chart</button><button aria-pressed={table} onClick={() => setTable(true)}>Table</button></div>}>
      {table ? <div style={{ maxHeight: height + 40, overflow: 'auto' }}><Table cols={[{ key: x, label: '' }, ...series.map((s) => ({ key: s.key, label: s.label, num: true, render: (r: any) => (s.fmt ?? fmtNum)(r[s.key]) }))]} rows={data} /></div> : (
        <div style={{ height }} role="img" aria-label={`${title}. ${series.map((s) => s.label).join(', ')} over ${data.length} points. Switch to Table for the numbers.`}>
          <ResponsiveContainer width="100%" height="100%">
            {kind === 'line' ? (
              <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey={x} tickFormatter={fx} tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--line)" minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--line)" allowDecimals={false} />
                <Tooltip labelFormatter={fx as never} formatter={((v: number, _n: string, p: any) => [(series.find((s) => s.key === p.dataKey)?.fmt ?? fmtNum)(v), series.find((s) => s.key === p.dataKey)?.label]) as never} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--ink)' }} />
                {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
                {series.map((s, i) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={COLORS[i]} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }} />)}
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis dataKey={x} tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--line)" interval={0} angle={-30} textAnchor="end" height={52} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} stroke="var(--line)" allowDecimals={false} />
                <Tooltip cursor={{ fill: 'var(--grid)' }} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--ink)' }} />
                {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={COLORS[i]} radius={[4, 4, 0, 0]} />)}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

/** Horizontal bars for ranked lists (countries, states, features). */
export function Ranked({ rows, label, value, fmt = fmtNum, max }: { rows: any[]; label: (r: any) => ReactNode; value: (r: any) => number; fmt?: (n: number) => string; max?: number }) {
  const m = max ?? Math.max(1, ...rows.map(value))
  if (!rows.length) return <p className="muted">No data in this range.</p>
  return <div>{rows.map((r, i) => <div className="hbar" key={i}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label(r)}</span><div className="track"><div className="fill" style={{ width: `${(value(r) / m) * 100}%` }} /></div><span className="num" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(value(r))}</span></div>)}</div>
}

export function Loading({ error }: { error?: string | null }) { return <p className={error ? 'err' : 'muted'} role={error ? 'alert' : 'status'}>{error ?? 'Loading…'}</p> }
