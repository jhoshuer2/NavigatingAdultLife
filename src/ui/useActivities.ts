import { useGame } from '../store'

/** Routes an activity id to the right UI: modal pickers for some, direct for others. */
export function useActivityRouter() {
  const g = useGame()
  return (id: string, args?: Record<string, unknown>) => {
    if (id === 'socialise') return g.openSheet('pick-social')
    if (id === 'familyTime') return g.openSheet('pick-family')
    if (id === 'shop') return g.openSheet('shop')
    if (id === 'applyJob') return g.openSheet('jobs')
    if (id === 'dash') return g.startDash()
    if (id === 'quitJob' && !confirm('Resign from your job?')) return
    g.act(id, args as never)
  }
}
