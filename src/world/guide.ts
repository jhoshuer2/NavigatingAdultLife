// "What should I do next?" suggestions and place/NPC rules for the world view. Pure helpers over GameState.
import type { GameState } from '@engine/core/types'
import type { District, PlaceId } from './layout'
import { INTERIORS } from './interiors'
import { say, type Say } from '@content/lang'

export interface Suggestion { id: string; place: PlaceId; text: string; icon: string; say: Say; act?: string }
const S = (id: string, place: PlaceId, icon: string, en: string, pcm: string, act?: string): Suggestion => ({ id, place, text: en, icon, say: say(en, pcm), act })
/** Every thing the guide can suggest. Each has a recorded voice clip named `sug_<id>` (see src/content/voiceLines.ts). */
export const SUGS = {
  sleepTired: S('sleepTired', 'home', '🌙', 'Sleep at home', 'Go house sleep, you don tire', 'sleep'),
  restSick: S('restSick', 'home', '❤️', 'Rest at home', 'Go house rest, make your body cool', 'sleep'),
  cheer: S('cheer', 'mamaput', '🍲', 'Cheer up at the buka', 'Go the buka chop, make your mind rest', 'treat'),
  stress: S('stress', 'pitch', '⚽', 'Burn stress at the pitch', 'Go the pitch play ball, comot stress', 'play'),
  study: S('study', 'school', '📚', 'Study at school', 'Go school read your book', 'study'),
  job: S('job', 'jobcentre', '📝', 'Find a job', 'Go Job Centre find work', 'applyJob'),
  boss: S('boss', 'office', '⏰', 'Impress the boss', 'Go office show Oga say you sabi work', 'overtime'),
  hustle: S('hustle', 'market', '🛍️', 'Hustle at the market', 'Go market hustle small money', 'hustle'),
  playKid: S('playKid', 'pitch', '⚽', 'Play outside', 'Go outside play', 'play'),
  friend: S('friend', 'mamaput', '🧑‍🤝‍🧑', 'Catch up with a friend', 'Go gist with your padi', 'socialise'),
  family: S('family', 'home', '👪', 'Family time at home', 'Go sit with your people for house', 'familyTime'),
  endYear: S('endYear', 'home', '🌙', 'Sleep to end the year', 'Go house sleep, make new year start', 'sleep'),
} as const

export function suggest(life: GameState): Suggestion | null {
  if (life.phase !== 'action' || life.quiz) return null
  const c = life.character
  const used = (id: string) => Number(life.activityCounts[id] ?? 0)
  const inSchool = c.edu.level !== 'none'
  if (c.stats.energy < 12) return SUGS.sleepTired
  if (c.stats.health < 40) return SUGS.restSick
  if (c.stats.happiness < 35) return SUGS.cheer
  if (c.stats.stress > 70) return SUGS.stress
  if (inSchool && used('study') < 2) return SUGS.study
  if (!c.job && !inSchool && c.age >= 18 && c.age < 62) return SUGS.job
  if (c.job && used('overtime') < 1 && c.age < 60) return SUGS.boss
  if (c.age >= 14 && used('hustle') < 1 && c.stats.energy >= 22) return SUGS.hustle
  if (c.age < 14 && used('play') < 1) return SUGS.playKid
  if (used('socialise') < 1 && c.stats.energy >= 15) return SUGS.friend
  if (used('familyTime') < 1) return SUGS.family
  return SUGS.endYear
}

/** The fixed guide lines that are not tied to a place name. Each has a recorded voice clip named `g_<id>`. */
export const GEN = {
  stuckQ: say('Not sure what to do? Open your Quests. They tell you where to go.', 'You no sure wetin to do? Open your Quests. E go tell you where to go.'),
  stuckM: say('Open the Map. Your next stop is lit up. Tap Go and you will walk there.', 'Open the Map. Your next place dey shine. Press Go, you go waka reach.'),
  enter: say('You are here. Tap the big green button.', 'You don reach. Press the big green button.'),
  exit: say('Go outside first. Tap the door button.', 'Comot outside first. Press the door button.'),
  look: say('Walk around. Tap the green button when a spot or a person shows up.', 'Waka around. Press the green button when person or place show.'),
  spot: say('Walk to the glowing spot. Then tap the green button.', 'Waka go the shining place. Then press the green button.'),
} as const

// Which spot inside each building does the suggested thing. Missing = no single spot (people walk around, so just look around).
const SPOT: Partial<Record<PlaceId, Partial<Record<string, string>>>> = {
  home: { sleep: 'bed' },
  school: { study: 'mydesk', socialise: 'mates' },
  office: { overtime: 'mydesk' },
  jobcentre: { applyJob: 'counter' },
  mamaput: { socialise: 'table', treat: 'order' },
  worship: { worship: 'pew' },
}

/** For each quest and stage: what to do and where. The Quests sheet shows this and can start guiding you there. */
export interface QuestHint { place?: PlaceId; act?: string; say: Say }
export const QUEST_HINTS: Record<string, QuestHint[]> = {
  q_waec: [{ place: 'school', act: 'study', say: say('Keep going to school and study. Grow up to secondary school.', 'Dey go school dey read. Grow reach secondary school.') }, { place: 'school', act: 'study', say: say('Study at school. Your WAEC result comes at the end of secondary school.', 'Read well for school. WAEC result go come when secondary school finish.') }],
  q_path: [{ place: 'school', act: 'study', say: say('This comes when school ends. Keep studying and end the year.', 'E go come when school finish. Keep reading, then end the year.') }],
  q_dash: [{ say: say('Open More in the bottom bar and pick Go-Slow Dash.', 'Open More for the bottom bar, pick Go-Slow Dash.') }, { say: say('Play Go-Slow Dash again. Dodge, collect coins, run far.', 'Play Go-Slow Dash again. Dodge, pick coin, run far.') }],
  q_friends: [{ place: 'mamaput', act: 'socialise', say: say('Hang out with your friend at the buka. Chat and be kind.', 'Go the buka gist with your padi. Talk well, be nice.') }, { place: 'mamaput', act: 'socialise', say: say('Meet a second friend. Hang out at the buka or the pitch.', 'Meet another padi. Go the buka or the pitch.') }],
  q_job: [{ place: 'jobcentre', act: 'applyJob', say: say('Go to the Job Centre and apply at the Job desk.', 'Go Job Centre, apply for the Job desk.') }],
  q_save: [{ place: 'market', act: 'hustle', say: say('Hustle at the market and spend less. Save your cash.', 'Hustle for market, spend small. Save your money.') }],
  q_promo: [{ place: 'office', act: 'overtime', say: say('Work late at your desk in the office and impress the boss.', 'Work overtime for your desk for office, impress Oga.') }],
  q_love: [{ place: 'mamaput', act: 'socialise', say: say('Meet people. Go out, hang out and be open.', 'Meet people. Go out, gist, open your heart.') }, { place: 'home', act: 'familyTime', say: say('Spend time with your partner. The big day comes with closeness.', 'Spend time with your person. The big day dey come when una close.') }],
}

export type GuideTarget =
  | { t: 'place'; place: PlaceId }
  | { t: 'enter'; place: PlaceId }
  | { t: 'hotspot'; id: string }
  | { t: 'exit' }
  | { t: 'ui'; el: 'quests' | 'map' | 'places' | 'home' }
  | { t: 'none' }
export interface GuideStep { key: string; icon: string; say: Say; /** id of the recorded voice clip for this line, if any */ voice?: string; target: GuideTarget; /** where the compass should point (world x,z) */ aim?: { x: number; z: number } }

export interface GuideCtx {
  life: GameState
  district: District
  inside: PlaceId | null
  /** outdoors: the place whose door you are standing at */
  near: PlaceId | null
  pos: { x: number; z: number }
  /** 0 = fine, 1 and 2 = the player has not done anything for a while */
  stuck: 0 | 1 | 2
  /** a task the player chose to follow (quest "show me") */
  track: { place: PlaceId; say: Say; act?: string; voice?: string } | null
}

const DIR = [['north', 'north'], ['north-east', 'north-east'], ['east', 'east'], ['south-east', 'south-east'], ['south', 'south'], ['south-west', 'south-west'], ['west', 'west'], ['north-west', 'north-west']]
/** Compass words and a rough step count. The camera never turns, so up on screen is north (negative z). */
export function bearing(from: { x: number; z: number }, to: { x: number; z: number }): { dir: string; steps: number; deg: number } {
  const dx = to.x - from.x, dz = to.z - from.z
  const deg = (Math.atan2(dx, -dz) * 180) / Math.PI // 0 = up/north, 90 = east
  const dir = DIR[Math.round(((deg + 360) % 360) / 45) % 8][0]
  return { dir, steps: Math.max(1, Math.round(Math.hypot(dx, dz) / 0.8)), deg }
}

const dot = (t: string) => t.replace(/[.\s]+$/, '')

export function guideStep(ctx: GuideCtx): GuideStep | null {
  const { life, district, inside, near, pos, stuck, track } = ctx
  if (life.phase !== 'action' || life.quiz) return null
  const sug = track ?? suggest(life)
  if (!sug) return null
  const pl = district.places.find((p) => p.id === sug.place)
  const placeName = pl?.name ?? 'the place'
  const icon = 'icon' in sug ? (sug as Suggestion).icon : '📍'
  if (stuck === 1) return { key: 'stuck-q', icon: '🎯', say: GEN.stuckQ, voice: 'g_stuckQ', target: { t: 'ui', el: 'quests' } }
  if (stuck === 2) return { key: 'stuck-m', icon: '🗺️', say: GEN.stuckM, voice: 'g_stuckM', target: { t: 'ui', el: 'map' } }
  const act = sug.act
  if (inside) {
    if (inside === sug.place) {
      const spot = act ? SPOT[inside]?.[act] : undefined
      const h = spot ? INTERIORS[inside]?.hotspots.find((x) => x.id === spot) : undefined
      if (h) return { key: `spot-${h.id}`, icon: h.icon, say: say(`Walk to: ${h.name}. Then tap the green button.`, `Waka go: ${h.name}. Then press the green button.`), voice: 'g_spot', target: { t: 'hotspot', id: h.id }, aim: { x: h.x, z: h.z } }
      return { key: `look-${inside}`, icon, say: GEN.look, voice: 'g_look', target: { t: 'none' } }
    }
    const door = INTERIORS[inside]?.door
    return { key: 'exit', icon: '🚪', say: say(`Go outside first, then to ${placeName}.`, `Comot outside first, then go ${placeName}.`), voice: 'g_exit', target: { t: 'exit' }, aim: door }
  }
  if (!pl) return null
  if (near === sug.place) return { key: `enter-${sug.place}`, icon, say: say(`You are at ${placeName}. Tap the big green button.`, `You don reach ${placeName}. Press the big green button.`), voice: 'g_enter', target: { t: 'enter', place: sug.place } }
  const b = bearing(pos, pl.door)
  return { key: `go-${sug.place}`, icon, say: say(`${dot(sug.say.en)}. Walk ${b.dir}, about ${b.steps} steps.`, `${dot(sug.say.pcm)}. Waka go ${b.dir}, about ${b.steps} steps.`), voice: 'id' in sug ? `sug_${sug.id}` : sug.voice, target: { t: 'place', place: sug.place }, aim: pl.door }
}

export function placeActive(life: GameState, id: PlaceId): boolean {
  const c = life.character
  const inSchool = c.edu.level !== 'none'
  switch (id) {
    case 'office': return !!c.job
    case 'jobcentre': return !c.job && !inSchool && c.age >= 18 && c.age < 62
    case 'school': return true
    default: return true
  }
}

export function placeNote(life: GameState, id: PlaceId): string | null {
  const c = life.character
  const inSchool = c.edu.level !== 'none'
  if (id === 'office' && !c.job) return "You don't work here. If you are looking for a job, try the Job Centre."
  if (id === 'jobcentre') { if (c.job) return 'You already have a job. Come back if you lose it or want to switch.'; if (inSchool) return 'Finish school first. The desk clerk says: "Come back with your certificate."'; if (c.age < 18) return 'Too young to apply. Come back at 18.'; if (c.age >= 62) return 'Time to enjoy retirement.' }
  return null
}
