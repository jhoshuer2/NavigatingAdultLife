import type { GameState } from '../core/types'
import type { Rng } from '../core/rng'
import { makeRng } from '../core/rng'

export interface Ctx { s: GameState; rng: Rng }

/** Clone the state, run fn on the clone with a seeded rng, persist rng state, return the clone. */
export function withCtx<T>(state: GameState, fn: (ctx: Ctx) => T): { state: GameState; result: T } {
  const s = structuredClone(state)
  const rng = makeRng(s.rng)
  const ctx: Ctx = { s, rng }
  const result = fn(ctx)
  s.rng = rng.state()
  return { state: s, result }
}
