import { describe, it, expect } from 'vitest'
import { makeRng } from '../src/engine/core/rng'
import { randomConfig } from '../src/engine/bot'
import { createNewLife, relocate, MOVE_COST, finishDreamLife } from '../src/engine/api'
import { withCtx } from '../src/engine/systems/ctx'
import { evaluateProgress } from '../src/engine/systems/progress'
import { dreamsFor } from '../src/content/dreams'
import { buildDistrict, DISTRICTS } from '../src/world/layout'
import { CITIES, cityOfHome, localise } from '../src/content/cities'
import { HOMES } from '../src/content/archetypes'
import { ITEM_BY_ID, ITEMS, wearOf } from '../src/content/items'
import { getShopItems } from '../src/engine/api'
import { NAME_POOLS } from '../src/content/names'

const lifeAt = (homeId: string, cash = 500000) => {
  const l = createNewLife({ ...randomConfig(makeRng(5)), homeId, archetypeId: 'silverSpoon' }, 9)
  l.phase = 'action'; l.quiz = undefined; l.character.stats.cash = cash; l.character.stats.energy = 100
  return l
}

describe('cities', () => {
  it('every home belongs to a city with a district theme that builds', () => {
    for (const h of HOMES) {
      expect(DISTRICTS[h.id], h.id).toBeTruthy()
      expect(DISTRICTS[h.id].city).toBe(h.city)
      expect(cityOfHome(h.id)).toBe(h.city)
      const d = buildDistrict(h.id)
      expect(d.places.length).toBe(11)
    }
    expect(cityOfHome('unknown-old-save')).toBe('lagos')
  })
  it('Abuja has green cabs and its own names, Lagos keeps the danfo', () => {
    expect(buildDistrict('garki').places.find((p) => p.id === 'busstop')!.name).toMatch(/Cab/)
    expect(buildDistrict('surulere').places.find((p) => p.id === 'busstop')!.name).toMatch(/Danfo/)
    expect(CITIES.abuja.vehicle.name).toBe('cab')
    expect(localise('abuja', 'a yellow danfo in Lagos')).toBe('a yellow cab in Abuja')
    expect(localise('lagos', 'a yellow danfo in Lagos')).toBe('a yellow danfo in Lagos')
  })
  it('moving costs money and energy, changes the city and keeps older friends honest', () => {
    const l = lifeAt('surulere')
    const r = relocate(l, 'garki')
    expect(r.ok).toBe(true)
    expect(r.state.character.housing.districtId).toBe('garki')
    expect(cityOfHome(r.state.character.housing.districtId)).toBe('abuja')
    expect(r.state.character.stats.cash).toBe(500000 - MOVE_COST)
    expect(r.state.character.stats.energy).toBe(75)
    expect(l.character.housing.districtId).toBe('surulere') // pure: the old state is untouched
    expect(relocate(lifeAt('surulere', 1000), 'garki').ok).toBe(false)
    expect(relocate(l, 'surulere').ok).toBe(false)
  })
})

describe('big dreams (the luck scroll)', () => {
  it('each city rolls its own six dreams, each with a path and a worn symbol', () => {
    expect(dreamsFor('abuja').map((d) => d.name)).toEqual(['Politician', 'Business Person', '9-5er', 'Content Creator', 'Degree Collector', 'I Never Know o'])
    expect(dreamsFor('lagos').map((d) => d.name)).toEqual(['Onile', 'LASTMA Officer', 'Governor', 'Pastor', 'Job Person', 'I no know o'])
    for (const d of [...dreamsFor('abuja'), ...dreamsFor('lagos')]) {
      expect(d.stages.length, d.id).toBeGreaterThanOrEqual(5)
      const it = ITEM_BY_ID[d.item!]
      expect(it, d.id).toBeTruthy()
      expect(it.heirloom).toBe(true)
      expect(it.wear?.length).toBeGreaterThan(0)
    }
  })
  it('the dream symbol starts on the character, is worn, and never shows in the shop', () => {
    const l = createNewLife({ ...randomConfig(makeRng(5)), homeId: 'surulere', dreamId: 'onile', archetypeId: 'silverSpoon' }, 9)
    expect(l.character.items).toEqual(['dreamKeys'])
    expect(wearOf(l.character.items)).toEqual(['keys'])
    const shop = getShopItems(l).map((x) => x.item.id)
    for (const i of ITEMS.filter((x) => x.heirloom)) expect(shop).not.toContain(i.id)
  })
  it('path steps complete in order and finish the dream', () => {
    const l = createNewLife({ ...randomConfig(makeRng(5)), homeId: 'surulere', dreamId: 'unsureLagos', archetypeId: 'silverSpoon' }, 9)
    expect(l.dreamStage).toBe(0)
    const rich = structuredClone(l)
    rich.character.edu.credential = 'degree'; rich.character.stats.cash = 9000000
    rich.character.stats.happiness = 90; rich.character.stats.reputation = 60
    rich.flags.n_hustle = 3; rich.flags.n_socialise = 4; rich.flags.n_community = 3
    rich.character.job = { trackId: 'civil', level: 1, title: 'x', salary: 1, years: 0, performance: 50 } as never
    for (const n of Object.values(rich.npcs)) n.closeness = 90
    const out = withCtx(rich, (ctx) => { evaluateProgress(ctx) }).state
    expect(out.dreamStage).toBe(6)
    expect(out.dreamDone).toBe(true)
    expect(finishDreamLife(out).ending?.id).toBe('dreamAchieved')
  })
})

describe('"Other" names', () => {
  it('has clearly gendered names with no duplicates across genders', () => {
    const { male, female } = NAME_POOLS.mix
    expect(male.length).toBeGreaterThanOrEqual(16); expect(female.length).toBeGreaterThanOrEqual(16)
    expect(male.filter((n) => female.includes(n))).toEqual([])
  })
})
