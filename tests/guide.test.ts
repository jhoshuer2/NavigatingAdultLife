import { describe, it, expect } from 'vitest'
import { makeRng } from '../src/engine/core/rng'
import { randomConfig } from '../src/engine/bot'
import { createNewLife } from '../src/engine/api'
import { buildDistrict } from '../src/world/layout'
import { bearing, guideStep, QUEST_HINTS, suggest } from '../src/world/guide'
import { QUESTS } from '../src/content/quests'
import { pick, say } from '../src/content/lang'

const life = () => { const l = createNewLife(randomConfig(makeRng(42)), 7); l.phase = 'action'; l.quiz = undefined; return l }
const district = buildDistrict('surulere')
const base = (over: object = {}) => ({ life: life(), district, inside: null, near: null, pos: { x: 0, z: 0 }, stuck: 0 as const, track: null, ...over })

describe('guide', () => {
  it('uses compass words (up on screen is north)', () => {
    expect(bearing({ x: 0, z: 0 }, { x: 0, z: -10 }).dir).toBe('north')
    expect(bearing({ x: 0, z: 0 }, { x: 10, z: 0 }).dir).toBe('east')
    expect(bearing({ x: 0, z: 0 }, { x: -8, z: 8 }).dir).toBe('south-west')
  })
  it('walks you to the suggested place, then tells you to tap the door button', () => {
    const l = life(); const sug = suggest(l)!
    const far = guideStep(base({ life: l }))!
    expect(far.target).toEqual({ t: 'place', place: sug.place })
    expect(far.say).toEqual(sug.say)
    expect(far.detail).toMatch(/steps/)
    expect(guideStep(base({ life: l, near: sug.place }))!.target).toEqual({ t: 'enter', place: sug.place })
  })
  it('sends you out of the wrong building and to the right spot in the right one', () => {
    const l = life(); const sug = suggest(l)!
    const wrong = sug.place === 'home' ? 'school' : 'home'
    expect(guideStep(base({ life: l, inside: wrong }))!.target.t).toBe('exit')
    const right = guideStep(base({ life: l, inside: sug.place }))!
    expect(['hotspot', 'none']).toContain(right.target.t)
  })
  it('points to Quests, then the Map, when the player is stuck', () => {
    expect(guideStep(base({ stuck: 1 }))!.target).toEqual({ t: 'ui', el: 'quests' })
    expect(guideStep(base({ stuck: 2 }))!.target).toEqual({ t: 'ui', el: 'map' })
  })
  it('follows a tracked quest over its own suggestion', () => {
    const t = guideStep(base({ track: { place: 'market', say: say('a', 'b') } }))!
    expect(t.target).toEqual({ t: 'place', place: 'market' })
  })
  it('has a where-to-go hint for every quest stage', () => {
    for (const q of QUESTS) expect(QUEST_HINTS[q.id]?.length, q.id).toBe(q.stages.length)
  })
  it('shows Pidgin first and English second in "both"', () => {
    const s = say('Go home', 'Go house')
    expect(pick('en', s)).toEqual({ main: 'Go home' })
    expect(pick('pcm', s)).toEqual({ main: 'Go house' })
    expect(pick('both', s)).toEqual({ main: 'Go house', sub: 'Go home' })
  })
})

import { HOWTO } from '../src/content/taskGuide'
describe('how-to cards', () => {
  it('cover every task kind and the Dash, each with steps and a goal in both languages', () => {
    for (const k of ['study', 'talk', 'penalty', 'market', 'chores', 'overtime', 'service', 'shop', 'jog', 'match', 'cook', 'dine', 'dash', 'dashDanfo']) {
      const h = HOWTO[k]; expect(h, k).toBeTruthy()
      expect(h.steps.length).toBeGreaterThan(0)
      for (const s of [h.title, h.goal, ...h.steps.map((x) => x.say)]) { expect(s.en.length).toBeGreaterThan(0); expect(s.pcm.length).toBeGreaterThan(0) }
    }
  })
})

describe('voice', () => {
  it('does nothing (and does not throw) when speech is unavailable or off, and never repeats a keyed line too soon', async () => {
    const spoken: string[] = []
    class U { text: string; constructor(t: string) { this.text = t } voice: unknown; lang = ''; rate = 1; volume = 1 }
    ;(globalThis as unknown as { window: unknown }).window = { speechSynthesis: { cancel() {}, speak: (u: U) => spoken.push(u.text), getVoices: () => [{ lang: 'en-NG', name: 'x' }] } }
    ;(globalThis as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = U
    const v = await import('../src/platform/voice')
    v.configureVoice({ on: false, volume: 1 }); v.speak('off'); expect(spoken).toEqual([])
    v.configureVoice({ on: true, volume: 1 }); v.speak('Waka go ₦5 🙂', 'k1'); v.speak('again', 'k1'); expect(spoken).toEqual(['Waka go naira 5 '])
  })
})
