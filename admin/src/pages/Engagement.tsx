import { fmtDur, qs, type FilterState } from '../api'
import { useApi } from '../hooks'
import { Card, Chart, Kpi, Loading, Ranked } from '../ui'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const BUCKETS: Record<string, string> = { world: '3D world', menu_mode: 'Menu mode', minigame: 'Go-Slow Dash', menus: 'Title, creation and other screens' }

export function Engagement({ f }: { f: FilterState }) {
  const { data, error } = useApi<any>(`engagement?${qs(f)}`)
  if (!data) return <Loading error={error} />
  const grid: number[][] = DAYS.map(() => Array(24).fill(0)); let max = 1
  for (const h of data.heat) { grid[h.dow][h.hour] = h.seconds; max = Math.max(max, h.seconds) }
  const level = (v: number) => (v === 0 ? 'var(--grid)' : `var(--seq${Math.min(4, Math.ceil((v / max) * 4))})`)
  const total = data.split.reduce((a: number, r: any) => a + r.seconds, 0) || 1
  return (
    <>
      <div className="grid kpis">
        <Kpi label="Stickiness (DAU/MAU)" value={data.stickiness} def={data.definitions.stickiness} fmt={(n) => `${n}%`} />
        <Kpi label="Sessions per active day" value={data.sessionsPerActiveDay} fmt={(n) => String(n)} />
        <Kpi label="Days played per week" value={data.daysPlayedPerWeek} fmt={(n) => String(n)} />
      </div>
      <div className="grid cols2">
        <Chart title="Session length" kind="bar" data={data.sessionHist} x="label" series={[{ key: 'count', label: 'Sessions' }]} def="Active time per session, not wall-clock time." />
        <Chart title="Daily playtime per player" kind="bar" data={data.dailyHist} x="label" series={[{ key: 'count', label: 'Player-days' }]} def="Active time per player per day, for days with at least 10 active seconds." />
        <Card title="Where playtime goes"><Ranked rows={data.split} label={(r) => BUCKETS[r.bucket] ?? r.bucket} value={(r) => r.seconds} fmt={(n) => `${Math.round((n / total) * 100)}% · ${fmtDur(n)}`} /></Card>
        <Card title="When people play" def="Active seconds by weekday and hour in the player's own time zone. Darker means more play.">
          <div className="heat" role="img" aria-label="Heatmap of play by weekday and hour">
            <div className="lab" />{Array.from({ length: 24 }, (_, h) => <div key={h} className="lab" style={{ justifyContent: 'center' }}>{h % 6 === 0 ? h : ''}</div>)}
            {grid.map((row, d) => [<div key={`l${d}`} className="lab">{DAYS[d]}</div>, ...row.map((v, h) => <div key={`${d}-${h}`} style={{ background: level(v) }} title={`${DAYS[d]} ${h}:00 · ${fmtDur(v)}`} />)])}
          </div>
        </Card>
      </div>
    </>
  )
}
