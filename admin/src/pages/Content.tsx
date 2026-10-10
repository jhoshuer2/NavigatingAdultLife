import { qs, type FilterState } from '../api'
import { useApi } from '../hooks'
import { Card, Loading, Ranked, Table } from '../ui'

export function Content({ f }: { f: FilterState }) {
  const { data, error } = useApi<any>(`content?${qs(f)}`)
  if (!data) return <Loading error={error} />
  const tonePalette: Record<string, string> = { warm: 'Warm', funny: 'Funny', flat: 'Flat', meh: 'Meh' }
  return (
    <>
      <div className="grid cols2">
        <Card title="Flagged for cultural review" def="Events players flagged with the 🚩 button, with how often each event was shown. Only the event and a count are sent, never the player's note.">
          <Table cols={[{ key: 'event_id', label: 'Event' }, { key: 'flags', label: 'Flags', num: true }, { key: 'shown', label: 'Shown', num: true }, { key: 'flag_rate', label: 'Flag rate', num: true, render: (r) => (r.flag_rate === null ? '–' : `${r.flag_rate}%`) }]} rows={data.flagged} empty="No flags in this range." />
        </Card>
        <Card title="Conversation tone mix" def="Which kind of reply players pick in talk and hang-out scenes."><Ranked rows={data.tones} label={(r) => tonePalette[r.tone] ?? r.tone} value={(r) => r.count} /></Card>
      </div>
      <div style={{ marginTop: 12 }}>
        <Card title="Task completion" def={data.definitions.completion}>
          <Table cols={[{ key: 'task', label: 'Task' }, { key: 'started', label: 'Started', num: true }, { key: 'completed', label: 'Finished', num: true }, { key: 'abandoned', label: 'Left early', num: true }, { key: 'completion_pct', label: 'Completion', num: true, render: (r) => (r.completion_pct === null ? '–' : `${r.completion_pct}%`) }, { key: 'avg_score', label: 'Average score', num: true, render: (r) => r.avg_score ?? '–' }]} rows={data.tasks} />
        </Card>
      </div>
      <div style={{ marginTop: 12 }}>
        <Card title="Story events" def="How often each event appeared and how players chose. The most common choice is listed first.">
          <Table cols={[{ key: 'event_id', label: 'Event' }, { key: 'shown', label: 'Shown', num: true }, { key: 'flags', label: 'Flags', num: true }, { key: 'choices', label: 'Choices (share)', render: (r) => { const t = r.choices.reduce((a: number, c: any) => a + c.n, 0) || 1; return r.choices.map((c: any) => `${c.choice || '?'} ${Math.round((c.n / t) * 100)}%`).join(' · ') || '–' } }]} rows={data.stories} />
        </Card>
      </div>
    </>
  )
}
