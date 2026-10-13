// Finding someone to race in Go-Slow Dash. There is no live race server yet, so the search always comes back empty after a short wait and the game
// falls back to the computer runner. When a real lobby exists it plugs in here: resolve with { name } for a human opponent.
export interface Opponent { name: string; live: true }
export function findRunner(waitMs = 3200): { promise: Promise<Opponent | null>; cancel: () => void } {
  let timer = 0
  let done: (o: Opponent | null) => void = () => {}
  const promise = new Promise<Opponent | null>((resolve) => { done = resolve; timer = window.setTimeout(() => resolve(null), waitMs) })
  return { promise, cancel: () => { window.clearTimeout(timer); done(null) } }
}
