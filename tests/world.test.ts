import { describe, it, expect } from 'vitest'
import { buildDistrict, DISTRICTS, SPAWN } from '../src/world/layout'
import { buildNav, findPath, walkable, moveWithCollision } from '../src/world/nav'

describe('district layout and navigation', () => {
  for (const id of Object.keys(DISTRICTS)) {
    it(`${id}: spawn and every place door are walkable and reachable`, () => {
      const d = buildDistrict(id)
      const nav = buildNav(d)
      expect(walkable(nav, SPAWN.x, SPAWN.z)).toBe(true)
      for (const p of d.places) {
        expect(walkable(nav, p.door.x, p.door.z), `${id} door ${p.id}`).toBe(true)
        const path = findPath(nav, SPAWN, p.door)
        expect(path, `${id} path to ${p.id}`).not.toBeNull()
        const last = path![path!.length - 1]
        expect(Math.hypot(last.x - p.door.x, last.z - p.door.z)).toBeLessThan(2)
      }
    })
    it(`${id}: no filler building overlaps a place or the main roads`, () => {
      const d = buildDistrict(id)
      for (const b of d.buildings) { expect(b.rect.z0 > 5 || b.rect.z1 < -5 || b.rect.x0 > 5 || b.rect.x1 < -5, `${id} building on road`).toBe(true) }
      const rects = d.buildings.map((b) => b.rect)
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j]
        expect(a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0, `${id} buildings ${i}/${j} overlap`).toBe(false)
      }
    })
  }
  it('collision stops the player at walls and slides along them', () => {
    const blockers = [{ x0: 0, x1: 4, z0: 0, z1: 4 }]
    const p = moveWithCollision(blockers, -1, 2, 1, 0.5)
    expect(p.x).toBeLessThan(0)
    expect(p.z).toBeGreaterThan(2)
  })
})
