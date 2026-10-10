import { useState } from 'react'
import { qs, type FilterState } from '../api'
import { useApi } from '../hooks'
import { Card, Loading, Ranked, Table } from '../ui'

const GROUPS: Record<string, string> = { all: 'All', place: 'Places', task: 'Tasks', activity: 'Activities', minigame: 'Mini-games', other: 'Other' }

export function Features({ f }: { f: FilterState }) {
  const { data, error } = useApi<any>(`features?${qs(f)}`)
  const [g, setG] = useState('all')
  if (!data) return <Loading error={error} />
  const rows = data.rows.filter((r: any) => g === 'all' || r.group === g)
  const tasks = data.rows.filter((r: any) => r.group === 'task' && r.avg_score !== null)
  return (
    <>
      <div className="seg tabs" role="group" aria-label="Feature group">{Object.entries(GROUPS).map(([k, l]) => <button key={k} aria-pressed={g === k} onClick={() => setG(k)}>{l}</button>)}</div>
      <div className="grid cols2">
        <Card title="Most used" def={data.definitions.feature_user}><Ranked rows={rows.slice(0, 15)} label={(r) => r.feature} value={(r) => r.users} max={data.active_players} /></Card>
        <Card title="Task performance" def={data.definitions.task_score}><Ranked rows={tasks} label={(r) => r.feature.replace('task:', '')} value={(r) => r.avg_score} fmt={(n) => n.toFixed(2)} max={1} /></Card>
      </div>
      <div style={{ marginTop: 12 }}><Card title="All features" def="Adoption is the share of active players in the range who used it at least once. Trend compares uses with the previous period of the same length.">
        <Table cols={[
          { key: 'feature', label: 'Feature' }, { key: 'users', label: 'Players', num: true }, { key: 'adoption_pct', label: 'Adoption', num: true, render: (r) => `${r.adoption_pct}%` },
          { key: 'uses', label: 'Total uses', num: true }, { key: 'uses_per_user', label: 'Uses / player', num: true },
          { key: 'trend_pct', label: 'Trend', num: true, render: (r) => (r.trend_pct === null ? '–' : `${r.trend_pct > 0 ? '▲' : r.trend_pct < 0 ? '▼' : '■'} ${Math.abs(r.trend_pct)}%`) },
        ]} rows={rows} />
      </Card></div>
    </>
  )
}
