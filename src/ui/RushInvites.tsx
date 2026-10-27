// "<Name> challenges you to The Rush": a popup on any screen while the game is open. Accept to join the race, or let it time out.
import { useEffect, useState } from 'react'
import { useGame } from '../store'
import { useRush } from '@platform/rushStore'
import { rushRespond } from '@platform/rush'
import { savedAccount } from '@platform/account'
import { audio } from '@platform/audio'
import { Btn } from './components'

const declined = new Set<string>() // challenges this player already answered, so a slow ping does not bring one back

export default function RushInvites() {
  const { invites, busy } = useRush()
  const [, tick] = useState(0)
  const [working, setWorking] = useState(false)
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 250); return () => clearInterval(t) }, [])
  const open = invites.map((i) => ({ ...i, left: i.left_ms - (Date.now() - i.at) })).filter((i) => i.left > 0 && !declined.has(i.match))
  const inv = open[0]
  const [heard, setHeard] = useState('')
  useEffect(() => { if (inv && !busy && heard !== inv.match) { setHeard(inv.match); audio.sfx('horn') } }, [inv, busy, heard])
  if (!inv || busy) return null
  const me = savedAccount()?.id ?? ''
  const answer = async (accept: boolean) => {
    if (working) return
    declined.add(inv.match)
    if (!accept) { void rushRespond(inv.match, false); useRush.getState().setInvites(open.filter((i) => i.match !== inv.match)); return }
    setWorking(true)
    const r = await rushRespond(inv.match, true)
    setWorking(false)
    if (!r.match || r.match.status === 'no_takers' || r.match.status === 'done') return // it closed just before the tap
    useRush.getState().setInvites([])
    useRush.getState().setRace({ stage: r.match.status === 'running' ? 'live' : 'lobby', view: r.match, me })
    useGame.getState().go('rushPlay')
  }
  return (
    <div className="fixed inset-x-0 z-[70] mx-auto max-w-[480px] px-3 pointer-events-none" style={{ top: 'calc(.5rem + var(--safe-t))' }} role="alertdialog" aria-label="Rush challenge">
      <div className="card p-3 pop pointer-events-auto" style={{ background: '#f3e7cf' }}>
        <div className="flex items-center gap-3">
          <div className="text-4xl" aria-hidden>🏁</div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl leading-tight truncate">{inv.from} challenges you!</div>
            <div className="text-xs font-bold opacity-80">The Rush · {Math.floor(inv.rush_secs / 60)}:{String(inv.rush_secs % 60).padStart(2, '0')} · same road, best score wins</div>
          </div>
          <div className="font-display text-2xl tabular-nums" aria-label={`${Math.ceil(inv.left / 1000)} seconds left`}>{Math.ceil(inv.left / 1000)}</div>
        </div>
        <div className="mt-1.5 h-1.5 rounded bg-black/15"><i className="block h-full rounded" style={{ width: `${Math.min(100, (inv.left / 20000) * 100)}%`, background: '#e07a1f' }} /></div>
        <div className="flex gap-2 mt-2">
          <Btn variant="green" className="flex-1" disabled={working} onClick={() => void answer(true)}>Accept</Btn>
          <Btn variant="ghost" className="flex-1" disabled={working} onClick={() => void answer(false)}>Not now</Btn>
        </div>
      </div>
    </div>
  )
}
