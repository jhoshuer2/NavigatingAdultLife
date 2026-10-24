import { describe, it, expect } from 'vitest'
import { NAMED, PLAYABLE, neighbour } from '../src/world/castData'
import { buildToon, EXPRESSIONS } from '../src/world/toon'

describe('character kit', () => {
  it('builds the four named characters and every neighbour variant', () => {
    const specs = [...NAMED, ...Array.from({ length: 24 }, (_, n) => neighbour(n))]
    for (const s of specs) {
      const p = buildToon(s)
      expect(p.group.children.length).toBeGreaterThan(0)
      for (const e of EXPRESSIONS) p.setExpression(e)
    }
  })
  it('lets the player pick Zuri or Navi', () => {
    expect(PLAYABLE.map(p => p.name)).toEqual(['Zuri', 'Navi'])
  })
})
