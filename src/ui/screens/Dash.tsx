import { useGame } from '../../store'
import { Btn } from '../components'

// Temporary placeholder: replaced by the Three.js Go-Slow Dash in the next step.
export function Dash() {
  const { finishDash, dashMode } = useGame()
  return (
    <div className="p-6 text-center">
      <h1 className="font-display text-4xl text-danfo">Go-Slow Dash ({dashMode})</h1>
      <p className="my-4 opacity-70">Runner loading…</p>
      <Btn onClick={() => finishDash({ coins: 12, distance: 420, closeCalls: 3, passengers: 0, mode: dashMode, score: 900 })}>Finish (placeholder)</Btn>
    </div>
  )
}
