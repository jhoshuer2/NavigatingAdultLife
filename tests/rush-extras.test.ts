import { describe, it, expect } from 'vitest'
import { createDash, stepDash, isSky, FLY_Y, WINGS_SECS, boostAt, wingsAt, type DashState, type DashObj } from '../src/minigames/go-slow-dash/sim'
import { createRival, stepRival } from '../src/minigames/go-slow-dash/race'

const mk = (seed = 7) => createDash({ seed, mode: 'foot', hearts: 3, assist: false })
const put = (st: DashState, o: Partial<DashObj> & Pick<DashObj, 'type' | 'kind'>) => { st.objs.push({ id: st.nextId++, lane: 0, dist: st.dist + 1.2, ...o } as DashObj) }
/** an empty road for the next stretch: obstacles ahead are removed so only what the test places can hit */
const clear = (st: DashState) => { st.objs = st.objs.filter((o) => o.type === 'coin' || o.type === 'tunnel'); st.hearts = 3; st.invuln = 0 }
const run = (st: DashState, secs: number) => { for (let i = 0; i < secs * 60; i++) stepDash(st, 1 / 60) }

describe('rush extras', () => {
  it('boosts, wings, rides and sky rows depend only on the seed (both runners meet the same ones)', () => {
    const a = mk(11), b = mk(11)
    run(a, 40); run(b, 40)
    const key = (s: DashState) => s.objs.filter((o) => o.type === 'power' || isSky(o.kind)).map((o) => `${o.kind}@${Math.round(o.dist)}:${o.lane}`).sort().join()
    expect(key(a)).toBe(key(b))
    expect(boostAt(11, 0)).toBeGreaterThan(200); expect(wingsAt(11, 1)).toBeGreaterThan(wingsAt(11, 0))
  })
  it('extras appear along the road: boosts, a ride and wings with a sky stretch', () => {
    const s = mk(3); s.spawnedTo = 40
    for (let i = 0; i < 60 * 80 && s.dist < 900; i++) { s.hearts = 99; stepDash(s, 1 / 60) }
    const kinds = new Set(s.objs.filter((o) => o.type === 'power').map((o) => o.kind))
    expect(kinds.has('boost') && kinds.has('wings') && (kinds.has('skate') || kinds.has('bike'))).toBe(true)
    expect(s.objs.some((o) => isSky(o.kind))).toBe(true)
  })
  it('sky obstacles are never more than one per row and never closer than 20 m', () => {
    const s = mk(5); for (let i = 0; i < 60 * 120 && s.dist < 2500; i++) { s.hearts = 99; stepDash(s, 1 / 60) }
    const sky = s.objs.filter((o) => isSky(o.kind)).sort((a, b) => a.dist - b.dist)
    for (let i = 1; i < sky.length; i++) expect(sky[i].dist - sky[i - 1].dist, 'gap').toBeGreaterThanOrEqual(19)
    expect(sky.every((o) => !o.wide)).toBe(true)
  })
  it('a boost lifts speed above the normal top speed and fades', () => {
    const s = mk(); s.hearts = 99; run(s, 12); const top = s.maxSpeed; clear(s)
    put(s, { type: 'power', kind: 'boost' }); run(s, 1.5)
    expect(s.powers.boost).toBeGreaterThan(0); expect(s.speed).toBeGreaterThan(top * 1.1)
    s.hearts = 99; run(s, 10); expect(s.speed).toBeLessThanOrEqual(top + 0.01)
  })
  it('flying ignores ground obstacles, a sky obstacle knocks you back to the road without costing a heart', () => {
    const s = mk(); clear(s); run(s, 0.1); clear(s)
    put(s, { type: 'power', kind: 'wings', dist: s.dist + 0.5 }); run(s, 1.5)
    expect(s.powers.wings).toBeGreaterThan(0); expect(s.y).toBeGreaterThan(FLY_Y * 0.8)
    put(s, { type: 'obstacle', kind: 'barrier', lane: s.lane, dist: s.dist + 6 }); run(s, 1)
    expect(s.hearts).toBe(3)
    put(s, { type: 'obstacle', kind: 'bird', lane: s.lane, dist: s.dist + 6 }); run(s, 1)
    expect(s.hearts).toBe(3); expect(s.powers.wings).toBe(0)
    run(s, 2); expect(s.y).toBeLessThan(0.5)
  })
  it('wings end by themselves after their time', () => {
    const s = mk(); clear(s); put(s, { type: 'power', kind: 'wings' }); s.hearts = 99; run(s, WINGS_SECS + 3)
    expect(s.powers.wings).toBe(0)
  })
  it('on the ground, sky things pass overhead without a hit', () => {
    const s = mk(); clear(s); put(s, { type: 'obstacle', kind: 'drone', lane: 0, dist: s.dist + 3 }); run(s, 1)
    expect(s.hearts).toBe(3)
  })
  it('a ride speeds you up and absorbs one hit instead of a heart', () => {
    const s = mk(); s.hearts = 99; run(s, 12); const top = s.maxSpeed; clear(s)
    put(s, { type: 'power', kind: 'bike' }); run(s, 3)
    expect(s.ride?.kind).toBe('bike'); expect(s.speed).toBeGreaterThan(top * 1.1)
    put(s, { type: 'obstacle', kind: 'barrier', lane: s.lane, dist: s.dist + 3 }); run(s, 1)
    expect(s.hearts).toBe(3); expect(s.ride).toBeNull()
    clear(s); run(s, 1.5)
    put(s, { type: 'obstacle', kind: 'barrier', lane: s.lane, dist: s.dist + 3 }); run(s, 1)
    expect(s.hearts).toBe(2)
  })
  it('the computer runner picks extras up too', () => {
    const rv = createRival({ seed: 4, mode: 'foot', hearts: 3, assist: false })
    let got = false
    for (let i = 0; i < 60 * 90 && !rv.st.over; i++) { stepRival(rv, 1 / 60); if (rv.st.powers.boost > 0 || rv.st.powers.wings > 0 || rv.st.ride) got = true }
    expect(got).toBe(true)
  })
})
