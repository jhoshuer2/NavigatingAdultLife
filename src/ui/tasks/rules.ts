// Pure rules for the in-world tasks so they can be balanced and unit tested.

export const GOAL_HALF = 1.6
export const BAR_HEIGHT = 2.4

export type ShotResult = 'goal' | 'saved' | 'wide' | 'over'

/** Convert a swipe (pixels) to a lateral aim and a shot height. */
export function shotFromSwipe(dx: number, dy: number) {
  const aim = Math.max(-1, Math.min(1, dx / 150)) * 1.7
  const power = Math.min(1.25, -dy / 190)
  return { aim, power, ty: power * BAR_HEIGHT }
}

/** Keeper dive: guesses the shot side 30% of the time, otherwise picks at random. */
export function keeperDive(aim: number, rnd: () => number = Math.random): -1 | 0 | 1 {
  const side = Math.abs(aim) < 0.9 ? 0 : (Math.sign(aim) as -1 | 1)
  if (rnd() < 0.3) return side
  return ([-1, 0, 1] as const)[Math.floor(rnd() * 3)]
}

export function resolveShot(aim: number, ty: number, dive: -1 | 0 | 1): ShotResult {
  if (Math.abs(aim) > GOAL_HALF + 0.02) return 'wide'
  if (ty > BAR_HEIGHT + 0.05) return 'over'
  const kz = dive * 1.9
  return Math.abs(kz - aim) < 1.0 && ty < 1.8 ? 'saved' : 'goal'
}
