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

import { fmtClock, isOpen, lightingAt, periodOf } from '../src/world/time'
describe('time and lighting', () => {
  it('formats the clock and reports opening hours', () => {
    expect(fmtClock(6.5)).toBe('6:30 AM'); expect(fmtClock(18.25)).toBe('6:15 PM'); expect(fmtClock(0)).toBe('12:00 AM')
    expect(isOpen('school', 9)).toBe(true); expect(isOpen('school', 18)).toBe(false); expect(isOpen('market', 21)).toBe(false)
    expect(isOpen('pitch', 3)).toBe(true) // open air places have no opening hours
    expect(periodOf(22)).toBe('night'); expect(periodOf(13)).toBe('afternoon')
  })
  it('is bright at noon and dark at night, and always returns finite values', () => {
    expect(lightingAt(12).dark).toBe(0); expect(lightingAt(23).dark).toBe(1)
    expect(lightingAt(12).hemiI).toBeGreaterThan(lightingAt(23).hemiI)
    for (let h = -3; h < 30; h += 0.5) { const l = lightingAt(h); expect(Number.isFinite(l.hemiI)).toBe(true); expect(l.dark).toBeGreaterThanOrEqual(0); expect(l.dark).toBeLessThanOrEqual(1) }
  })
})

import { INTERIORS, interiorBlockers } from '../src/world/interiors'
import { buildNavFor } from '../src/world/nav'
describe('interiors', () => {
  for (const [id, it] of Object.entries(INTERIORS)) {
    it_(id, it!)
  }
  function it_(id: string, def: NonNullable<(typeof INTERIORS)[keyof typeof INTERIORS]>) {
    it(`${id}: spawn, exit, hotspots and people are reachable and not inside furniture`, () => {
      const nav = buildNavFor(interiorBlockers(def), def.bounds, 0.5)
      expect(walkable(nav, def.spawn.x, def.spawn.z), 'spawn').toBe(true)
      expect(walkable(nav, def.door.x, def.door.z), 'exit').toBe(true)
      for (const h of def.hotspots) {
        expect(walkable(nav, h.x, h.z), `hotspot ${h.id} stand point`).toBe(true)
        const path = findPath(nav, def.spawn, { x: h.x, z: h.z })
        expect(path, `path to ${h.id}`).not.toBeNull()
      }
      for (const p of def.people) {
        expect(walkable(nav, p.x, p.z), `person ${p.id}`).toBe(true)
        expect(findPath(nav, def.spawn, { x: p.x, z: p.z }), `path to ${p.id}`).not.toBeNull()
      }
      expect(findPath(nav, { x: def.hotspots[0].x, z: def.hotspots[0].z }, def.door)).not.toBeNull()
    })
  }
})
