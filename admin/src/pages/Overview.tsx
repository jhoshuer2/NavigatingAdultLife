import { fmtDur, qs, type FilterState } from '../api'
import { useApi } from '../hooks'
import { Chart, Kpi, Loading } from '../ui'

export function Overview({ f }: { f: FilterState }) {
  const { data, error } = useApi<any>(`overview?${qs(f)}`)
  if (!data) return <Loading error={error} />
  const k = data.kpis, p = data.previous, d = data.definitions
  const md = (s: string) => s.slice(5)
  return (
    <>
      <div className="grid kpis">
        <Kpi label="DAU (last day)" value={k.dau} prev={p.dau} def={d.dau} />
        <Kpi label="WAU" value={k.wau} prev={p.wau} def={d.wau} />
        <Kpi label="MAU" value={k.mau} prev={p.mau} def={d.mau} />
        <Kpi label="New players" value={k.new_players} prev={p.new_players} def={d.new_players} />
        <Kpi label="Returning players" value={k.returning_players} prev={p.returning_players} def={d.returning_players} />
        <Kpi label="Active time per player per day" value={k.avg_active_per_player_day} prev={p.avg_active_per_player_day} def={d.avg_active_per_player_day} fmt={fmtDur} />
        <Kpi label="Average session" value={k.avg_session} prev={p.avg_session} def={d.avg_session} fmt={fmtDur} />
        <Kpi label="Lives started" value={k.lives_started} prev={p.lives_started} def={d.lives_started} />
        <Kpi label="Lives completed" value={k.lives_completed} prev={p.lives_completed} def={d.lives_completed} />
        <Kpi label="Paywall conversion" value={k.paywall_conversion} def={d.paywall_conversion} />
      </div>
      <div className="grid cols2">
        <Chart title="Active players per day" def={d.dau} data={data.series} x="day" xFmt={md} series={[{ key: 'active', label: 'Active players' }]} />
        <Chart title="New vs returning" data={data.series} x="day" xFmt={md} series={[{ key: 'new_players', label: 'New' }, { key: 'returning_players', label: 'Returning' }]} />
        <Chart title="Sessions per day" data={data.series} x="day" xFmt={md} series={[{ key: 'sessions', label: 'Sessions' }]} />
        <Chart title="Total active time per day" data={data.series} x="day" xFmt={md} series={[{ key: 'active_seconds', label: 'Active time', fmt: fmtDur }]} />
      </div>
      <p className="muted small">Test traffic (debug links, unlimited-time mode, bots) is excluded. Days are UTC. Only players who agreed to statistics are counted, so these numbers undercount.</p>
    </>
  )
}
