// Seeded PRNG (mulberry32). State is a single uint32 so it can live inside GameState.

export function nextRng(state: number): { value: number; state: number } {
  let t = (state + 0x6d2b79f5) >>> 0
  const next = t
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: next }
}

export interface Rng {
  next(): number
  int(min: number, max: number): number
  pick<T>(arr: readonly T[]): T
  chance(p: number): boolean
  weighted<T>(items: readonly T[], weight: (t: T) => number): T | undefined
  shuffle<T>(arr: readonly T[]): T[]
  state(): number
}

export function makeRng(initial: number): Rng {
  let s = initial >>> 0
  const next = () => {
    const r = nextRng(s)
    s = r.state
    return r.value
  }
  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    weighted: (items, weight) => {
      const total = items.reduce((a, i) => a + Math.max(0, weight(i)), 0)
      if (total <= 0) return undefined
      let r = next() * total
      for (const i of items) {
        r -= Math.max(0, weight(i))
        if (r <= 0) return i
      }
      return items[items.length - 1]
    },
    shuffle: (arr) => {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
    state: () => s,
  }
}

export function hashSeed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
