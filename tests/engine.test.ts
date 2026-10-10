import { describe, it, expect } from 'vitest'
import { makeRng } from '../src/engine/core/rng'
import { playLife, randomConfig } from '../src/engine/bot'
import { createNewLife, getActivities, doActivity, finishActions, chooseOption, continueAfterEvent, advanceYear, applyDashResult } from '../src/engine/api'
import { EVENTS } from '../src/content/events'
import { evalGroup } from '../src/engine/core/conditions'
import { ACTIVITIES } from '../src/content/activities'

const cfg = () => randomConfig(makeRng(42))

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = makeRng(123), b = makeRng(123)
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()])
  })
})

describe('life creation', () => {
  it('starts at age 6 in the action or events phase with stats in range', () => {
    const s = createNewLife(cfg(), 7)
    expect(s.character.age).toBe(6)
    expect(['action', 'events']).toContain(s.phase)
    for (const k of ['happiness', 'knowledge', 'reputation', 'health', 'stress', 'energy'] as const) {
      expect(s.character.stats[k]).toBeGreaterThanOrEqual(0)
      expect(s.character.stats[k]).toBeLessThanOrEqual(100)
    }
    expect(Object.keys(s.npcs).length).toBeGreaterThanOrEqual(4)
  })
  it('is pure: the input state is not mutated', () => {
    const s = createNewLife(cfg(), 7)
    const before = JSON.stringify(s)
    getActivities(s)
    doActivity(s, 'play')
    finishActions(s)
    expect(JSON.stringify(s)).toBe(before)
  })
  it('same seed and same inputs give the same life', () => {
    const a = playLife(99, 'random', cfg()).state
    const b = playLife(99, 'random', cfg()).state
    expect(JSON.stringify(a.ending)).toBe(JSON.stringify(b.ending))
  })
})

describe('year loop', () => {
  it('end year is always possible and ages the character', () => {
    let s = createNewLife(cfg(), 11)
    for (let i = 0; i < 3; i++) {
      while (s.phase === 'events') { const cur = s.eventQueue[0]; expect(cur).toBeTruthy(); s = s.activeEvent?.result ? continueAfterEvent(s) : chooseOption(s, EVENTS.find((e) => e.id === cur)!.choices[0].id) }
      s = finishActions(s)
      while (s.phase === 'events') { const cur = s.eventQueue[0]; s = s.activeEvent?.result ? continueAfterEvent(s) : chooseOption(s, EVENTS.find((e) => e.id === cur)!.choices[0].id) }
      expect(s.phase === 'summary' || s.phase === 'ended').toBe(true)
      s = advanceYear(s)
    }
    expect(s.character.age).toBe(9)
  })
  it('cannot spend more energy than available', () => {
    let s = createNewLife(cfg(), 5)
    while (s.phase === 'events') s = continueAfterEvent(chooseOption(s, EVENTS.find((e) => e.id === s.eventQueue[0])!.choices[0].id))
    for (let i = 0; i < 30; i++) { const r = doActivity(s, 'play'); s = r.state }
    expect(s.character.stats.energy).toBeGreaterThanOrEqual(0)
  })
})

describe('bot simulation', () => {
  it('plays 24 full lives with no errors and valid endings', () => {
    for (const kind of ['random', 'scholar', 'money'] as const) {
      for (let i = 0; i < 8; i++) {
        const r = playLife(500 + i * 31, kind)
        expect(r.error).toBeUndefined()
        expect(r.state.ending).toBeTruthy()
        expect(r.state.character.age).toBeLessThanOrEqual(90)
        const st = r.state.character.stats
        for (const v of [st.happiness, st.knowledge, st.reputation, st.health, st.stress]) { expect(Number.isFinite(v)).toBe(true); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100) }
        expect(Number.isFinite(st.cash)).toBe(true)
      }
    }
  }, 120000)
})

describe('go-slow dash result', () => {
  it('converts coins to cash and enforces the yearly cap', () => {
    let s = createNewLife(cfg(), 3)
    while (s.phase === 'events') s = continueAfterEvent(chooseOption(s, EVENTS.find((e) => e.id === s.eventQueue[0])!.choices[0].id))
    const cash0 = s.character.stats.cash
    const run = { coins: 30, distance: 800, closeCalls: 6, passengers: 0, mode: 'foot' as const, score: 1200 }
    const r1 = applyDashResult(s, run)
    expect(r1.cash).toBeGreaterThan(0)
    expect(r1.state.character.stats.cash).toBe(cash0 + r1.cash)
    let st = r1.state
    for (let i = 0; i < 3; i++) st = applyDashResult(st, run).state
    const r5 = applyDashResult(st, run)
    expect(r5.capped).toBe(true)
    expect(r5.cash).toBe(0)
    expect(r5.state.flags.dash500).toBe(true)
  })
})

describe('content integrity', () => {
  it('event ids are unique and every choice has an id and a label', () => {
    const ids = new Set<string>()
    for (const e of EVENTS) {
      expect(ids.has(e.id), `duplicate ${e.id}`).toBe(false)
      ids.add(e.id)
      expect(e.choices.length).toBeGreaterThanOrEqual(1)
      const cids = new Set<string>()
      for (const c of e.choices) { expect(c.label.length).toBeGreaterThan(0); expect(cids.has(c.id), `dup choice ${e.id}.${c.id}`).toBe(false); cids.add(c.id) }
    }
  })
  it('scheduled and moment text never reference unknown events', () => {
    const ids = new Set(EVENTS.map((e) => e.id))
    const walk = (effects: unknown[] | undefined) => { for (const e of effects ?? []) { const x = e as { schedule?: { eventId: string } }; if (x.schedule) expect(ids.has(x.schedule.eventId)).toBe(true) } }
    for (const e of EVENTS) for (const c of e.choices) { walk(c.effects); for (const o of Object.values(c.outcomes ?? {})) walk(o?.effects) }
    expect(ids.has('evt_loss')).toBe(true)
  })
  it('string lengths are mobile friendly', () => {
    for (const e of EVENTS) { expect(e.title.length).toBeLessThanOrEqual(46); expect(e.text.length).toBeLessThanOrEqual(520); for (const c of e.choices) expect(c.label.length).toBeLessThanOrEqual(70) }
  })
  it('activities have unique ids and conditions evaluate', () => {
    const s = createNewLife(cfg(), 1)
    const ids = new Set<string>()
    for (const a of ACTIVITIES) { expect(ids.has(a.id)).toBe(false); ids.add(a.id); expect(() => evalGroup(s, a.requires)).not.toThrow() }
  })
  it('has at least 80 events', () => { expect(EVENTS.length).toBeGreaterThanOrEqual(80) })
})

import { previewEnding } from '../src/engine/api'
import type { GameState } from '../src/engine/core/types'

describe('endings', () => {
  const base = () => { const s = createNewLife(cfg(), 77); s.character.age = 70; return s }
  const kid = (s: GameState) => { for (const id of ['k1', 'k2']) { s.npcs[id] = { id, name: id, gender: 'male', role: 'child', birthAge: 30, alive: true, closeness: 80, contactedThisYear: false, memory: [] }; s.character.childrenIds.push(id) } }
  it('every one of the 9 endings is reachable from a hand-built scenario', () => {
    const got = new Set<string>()
    let s = base(); s.character.age = 30; got.add(previewEnding(s).id)                                  // cutShort
    s = base(); s.character.job = { trackId: 'corporate', level: 4, years: 5, salary: 1, title: 'Executive' }; got.add(previewEnding(s).id) // bigOga
    s = base(); kid(s); for (const n of Object.values(s.npcs)) n.closeness = 90; got.add(previewEnding(s).id)                       // familyPillar
    s = base(); s.character.stats.cash = 90000000; for (const n of Object.values(s.npcs)) n.closeness = 10; got.add(previewEnding(s).id) // lonely
    s = base(); s.character.stats.knowledge = 95; s.character.edu.credential = 'degree'; s.character.stats.cash = 30000000; got.add(previewEnding(s).id) // scholar
    s = base(); s.character.stats.cash = 1000000; s.character.stats.reputation = 20; s.character.stats.happiness = 20; for (const n of Object.values(s.npcs)) n.closeness = 90; got.add(previewEnding(s).id) // brokeBeloved
    s = base(); s.character.stats.cash = 50000000; s.flags.hustleCount = 9; s.character.stats.reputation = 20; for (const n of Object.values(s.npcs)) n.closeness = 10; got.add(previewEnding(s).id) // hustler
    s = base(); s.character.stats.cash = 50000000; s.character.stats.reputation = 80; for (const n of Object.values(s.npcs)) n.closeness = 10; got.add(previewEnding(s).id) // respected
    s = base(); s.character.stats.cash = 50000000; s.character.stats.reputation = 30; s.character.stats.happiness = 70; for (const n of Object.values(s.npcs)) n.closeness = 10; got.add(previewEnding(s).id) // comfortable
    expect([...got].sort()).toEqual(['bigOga', 'brokeBeloved', 'comfortable', 'cutShort', 'familyPillar', 'hustler', 'lonely', 'respected', 'scholar'])
  })
})

describe('saves', () => {
  it('a state survives a JSON round trip and continues identically', () => {
    let a = createNewLife(cfg(), 123)
    while (a.phase === 'events') a = continueAfterEvent(chooseOption(a, EVENTS.find((e) => e.id === a.eventQueue[0])!.choices[0].id))
    const b = JSON.parse(JSON.stringify(a)) as GameState
    const fa = finishActions(a), fb = finishActions(b)
    expect(JSON.stringify(fa)).toBe(JSON.stringify(fb))
  })
})

describe('no soft locks', () => {
  it('every event has at least one choice with no requirements', () => {
    for (const e of EVENTS) expect(e.choices.some((c) => !c.requires), e.id).toBe(true)
  })
})

import { pickQuestions, QUIZ_BANK } from '../src/content/quiz'
describe('quiz', () => {
  it('has a healthy bank and shuffles answer positions', () => {
    expect(QUIZ_BANK.length).toBeGreaterThanOrEqual(80)
    const rng = makeRng(5)
    const positions = new Set<number>()
    for (let i = 0; i < 60; i++) for (const q of pickQuestions(rng, 16, 3, new Set())) { expect(q.options[q.answer]).toBeTruthy(); positions.add(q.answer) }
    expect(positions.size).toBeGreaterThanOrEqual(3)
  })
  it('every question has a valid answer index and 4 distinct options', () => {
    for (const q of QUIZ_BANK) { expect(q.answer).toBeGreaterThanOrEqual(0); expect(q.answer).toBeLessThan(q.options.length); expect(new Set(q.options).size).toBe(q.options.length) }
  })
})
