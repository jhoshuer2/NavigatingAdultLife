import { qs, type FilterState } from '../api'
import { useApi } from '../hooks'
import { Card, Chart, Kpi, Loading, Table } from '../ui'

export function Quality({ f }: { f: FilterState }) {
  const { data, error } = useApi<any>(`quality?${qs(f)}`)
  if (!data) return <Loading error={error} />
  const d = data.definitions
  const ms = (n: number | null) => (n === null || n === undefined ? '–' : n >= 1000 ? `${(n / 1000).toFixed(1)} s` : `${n} ms`)
  const group = (label: string, rows: any[]) => <Card title={label}><Table cols={[{ key: 'key', label: '' }, { key: 'devices', label: 'Devices', num: true }, { key: 'slow', label: 'Slow', num: true }, { key: 'webgl', label: 'No 3D', num: true }, { key: 'errors', label: 'Errors', num: true }, { key: 'median_load', label: 'Median load', num: true, render: (r) => ms(r.median_load) }]} rows={rows} /></Card>
  return (
    <>
      <div className="grid kpis">
        <Kpi label="Slow devices" value={data.slow_rate} def={d.slow} fmt={(n) => `${n}%`} />
        <Kpi label="3D could not start" value={data.webgl_rate} def={d.webgl} fmt={(n) => `${n}%`} />
        <Kpi label="Errors" value={data.errors} />
        <Kpi label="Devices with errors" value={data.error_devices} />
        <Kpi label="Active devices" value={data.active_devices} />
      </div>
      <div className="grid cols2">
        <Chart title="Page load time" kind="bar" def={d.load} data={data.load_bands} x="label" series={[{ key: 'count', label: 'Opens' }]} />
        <Card title="Errors, grouped" def={data.note}><Table cols={[{ key: 'message', label: 'Message' }, { key: 'n', label: 'Times', num: true }, { key: 'devices', label: 'Devices', num: true }, { key: 'versions', label: 'Versions', render: (r) => (r.versions ?? []).join(', ') }, { key: 'last_day', label: 'Last seen' }]} rows={data.errors_list} empty="No errors in this range." /></Card>
      </div>
      <div className="grid cols2" style={{ marginTop: 12 }}>{group('By game version', data.by_version)}{group('By device type', data.by_device)}</div>
    </>
  )
}
