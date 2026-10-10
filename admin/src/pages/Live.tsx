import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Kpi, Loading, Ranked, Table } from '../ui'

export function Live() {
  const [data, setData] = useState<any>(null); const [err, setErr] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    const load = () => api('live').then((d) => { if (live) { setData(d); setErr(null) } }).catch((e: Error) => live && setErr(e.message))
    load(); const t = setInterval(load, 15000)
    return () => { live = false; clearInterval(t) }
  }, [])
  if (!data) return <Loading error={err} />
  return (
    <>
      <div className="grid kpis"><Kpi label="Playing now" value={data.online} def={data.definition} /></div>
      <p className="muted small" role="status">Updates every 15 seconds.</p>
      <div className="grid cols2">
        <Card title="By country"><Ranked rows={data.by_country} label={(r) => r.key} value={(r) => r.count} /></Card>
        <Card title="By screen"><Ranked rows={data.by_screen} label={(r) => r.key} value={(r) => r.count} /></Card>
      </div>
      <div style={{ marginTop: 12 }}><Card title="Players"><Table cols={[{ key: 'label', label: 'Player' }, { key: 'country', label: 'Country', render: (r) => r.country ?? '–' }, { key: 'city', label: 'City', render: (r) => r.city ?? '–' }, { key: 'screen', label: 'Screen', render: (r) => r.screen ?? '–' }, { key: 'device_type', label: 'Device', render: (r) => r.device_type ?? '–' }]} rows={data.players} empty="Nobody is playing right now." /></Card></div>
    </>
  )
}
