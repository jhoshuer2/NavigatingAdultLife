import { countryName, fmtDur, qs, type FilterState } from '../api'
import { useApi } from '../hooks'
import { Card, Loading, Ranked, Table } from '../ui'

export function Geography({ f }: { f: FilterState }) {
  const { data, error } = useApi<any>(`geography?${qs(f)}`)
  if (!data) return <Loading error={error} />
  const pct = (v: number | null) => (v === null ? '–' : `${v}%`)
  return (
    <>
      <p className="muted small">{data.note}</p>
      <div className="grid cols2">
        <Card title="Players by country"><Ranked rows={data.countries.slice(0, 12)} label={(r) => countryName(r.country)} value={(r) => r.players} /></Card>
        <Card title="Nigeria by state"><Ranked rows={data.states.slice(0, 15)} label={(r) => r.name} value={(r) => r.players} /></Card>
      </div>
      <div className="grid" style={{ marginTop: 12 }}>
        <Card title="Countries" def="D1 and D7 retention: share of players first seen in the range who came back exactly 1 or 7 days later. Blank when the range is too short or the group too small.">
          <Table cols={[
            { key: 'country', label: 'Country', render: (r) => countryName(r.country) }, { key: 'players', label: 'Players', num: true }, { key: 'new_players', label: 'New', num: true }, { key: 'sessions', label: 'Sessions', num: true },
            { key: 'avg_playtime_per_player', label: 'Avg playtime / player', num: true, render: (r) => fmtDur(r.avg_playtime_per_player) }, { key: 'd1', label: 'D1 retention', num: true, render: (r) => pct(r.d1) }, { key: 'd7', label: 'D7 retention', num: true, render: (r) => pct(r.d7) },
          ]} rows={data.countries} />
        </Card>
        <Card title="Nigerian states"><Table cols={[{ key: 'name', label: 'State' }, { key: 'players', label: 'Players', num: true }, { key: 'sessions', label: 'Sessions', num: true }, { key: 'avg_playtime_per_player', label: 'Avg playtime / player', num: true, render: (r) => fmtDur(r.avg_playtime_per_player) }]} rows={data.states} /></Card>
        <Card title="Top cities in Nigeria (approximate)"><Table cols={[{ key: 'city', label: 'City' }, { key: 'players', label: 'Players', num: true }]} rows={data.cities} /></Card>
      </div>
    </>
  )
}
