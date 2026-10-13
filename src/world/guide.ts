// "What should I do next?" suggestions and place/NPC rules for the world view. Pure helpers over GameState.
import type { GameState } from '@engine/core/types'
import type { District, PlaceId } from './layout'
import { INTERIORS } from './interiors'
import { flavourOf } from './flavour'
import { errandSpot, type ErrandKind } from './errands'
import { say, type Say } from '@content/lang'
import { ACTIVITY_BY_ID } from '@content/activities'
import { DREAM_BY_ID, type DreamStage, type DreamVerb } from '@content/dreams'

export interface Suggestion { id: string; place: PlaceId; text: string; icon: string; say: Say; act?: string; /** a side trip to a spot in the neighbourhood instead of a place */ errand?: ErrandKind }
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

/** What each kind of dream step means in the world: where to go and what to do there. */
const GOALS: Record<DreamVerb, { place: PlaceId; icon: string; act?: string; en: string; pcm: string }> = {
  study: { place: 'school', icon: '📚', act: 'study', en: 'Study at school', pcm: 'Go school read your book' },
  church: { place: 'worship', icon: '🙏', act: 'community', en: 'Join the service at worship', pcm: 'Go worship join service' },
  hustle: { place: 'market', icon: '🛍️', act: 'hustle', en: 'Hustle at the market', pcm: 'Go market hustle small money' },
  save: { place: 'market', icon: '💰', act: 'hustle', en: 'Hustle and save your money', pcm: 'Hustle for market, save your money' },
  job: { place: 'jobcentre', icon: '📝', act: 'applyJob', en: 'Find a job at the Job Centre', pcm: 'Go Job Centre find work' },
  work: { place: 'office', icon: '⏰', act: 'overtime', en: 'Work hard at the office', pcm: 'Go office work well well' },
  social: { place: 'mamaput', icon: '🧑‍🤝‍🧑', act: 'socialise', en: 'Hang out with people at the buka', pcm: 'Go the buka gist with people' },
  fit: { place: 'pitch', icon: '🏃', act: 'exercise', en: 'Exercise at the pitch', pcm: 'Go the pitch do exercise' },
  shop: { place: 'market', icon: '🛒', act: 'shop', en: 'Buy what you need at the market', pcm: 'Go market buy wetin you need' },
  house: { place: 'market', icon: '🏠', act: 'hustle', en: 'Keep saving. Your house chance will come', pcm: 'Dey save. Your house chance go come' },
  family: { place: 'home', icon: '👪', act: 'familyTime', en: 'Spend time with your people', pcm: 'Go sit with your people' },
}

export interface DreamGoal { index: number; total: number; stage: DreamStage; suggestion: Suggestion; doable: boolean; note?: string }
/** The next step on the way to the big dream, as something the guide can point at. null when there is no path (older saves) or it is done. */
export function dreamGoal(life: GameState): DreamGoal | null {
  const def = DREAM_BY_ID[life.character.dreamId]
  if (!def || !def.stages.length || life.dreamDone) return null
  const index = Math.min(life.dreamStage ?? 0, def.stages.length - 1)
  const stage = def.stages[index]
  const g = GOALS[stage.verb]
  const c = life.character
  const inSchool = c.edu.level !== 'none'
  const doable = { study: inSchool, church: c.age >= 8, hustle: c.age >= 14, save: c.age >= 14, job: !c.job && !inSchool && c.age >= 16, work: !!c.job, social: true, fit: c.age >= 10, shop: c.age >= 12, house: c.age >= 14, family: true }[stage.verb]
  // not doable right now if the activity is used up for the year or you are too tired for it: then the guide falls back to ending the year
  const actDef = g.act ? ACTIVITY_BY_ID[g.act] : undefined
  const capped = !!actDef?.maxPerYear && Number(life.activityCounts[actDef.id] ?? 0) >= actDef.maxPerYear
  const tired = !!actDef && c.stats.energy < actDef.cost.energy
  const suggestion: Suggestion = { id: `dream_${stage.verb}`, place: g.place, text: `${stage.title}: ${g.en}`, icon: g.icon, say: say(`${stage.title}. ${g.en}`, `${stage.title}. ${g.pcm}`), act: g.act }
  return { index, total: def.stages.length, stage, suggestion, doable: doable && !capped && !tired, note: capped ? 'You have done this enough for the year. Sleep at home to start the next year.' : tired ? 'You are too tired for this now. Rest first.' : undefined }
}

/** Free-time ideas for the part of the day between the day's work and bedtime. */
const FUN = {
  // mornings and afternoons of a normal Nigerian child (and anyone living at home)
  groom: S('groomMorning', 'home', '🪥', 'Brush your teeth and freshen up', 'Go brush your teeth, freshen up', 'groom'),
  breakfast: S('askFood', 'home', '🍛', 'Ask Mama for food', 'Ask Mama for food', 'meal'),
  chores: S('helpMama', 'home', '🧹', 'Help Mama wash the plates and sweep', 'Help Mama wash plate, sweep house', 'chores'),
  football: S('footballFun', 'pitch', '⚽', 'Go and play football at the pitch', 'Go the pitch play football', 'play'),
  tv: S('watchTv', 'home', '📺', 'Watch TV for a while at home', 'Go house watch TV small', 'tv'),
  dash: S('dashFun', 'busstop', '🪙', 'Play Go-Slow Dash at the bus stop and collect coins', 'Go the bus stop play Go-Slow Dash, collect coins', 'dash'),
  visit: { ...S('visitFriend', 'home', '🏘️', "Visit a friend at their house", 'Go visit your padi for house'), errand: 'visit' as ErrandKind },
  explore: { ...S('exploreRoute', 'home', '🧭', 'Find a new route: follow the compass', 'Find new road: follow the compass'), errand: 'explore' as ErrandKind },
  pitch: S('pitchFun', 'pitch', '🏃', 'Exercise at the pitch', 'Go the pitch do exercise', 'exercise'),
  treat: S('treatFun', 'mamaput', '🍨', 'Treat yourself at the buka', 'Go the buka treat yourself', 'treat'),
  wait: S('waitEvening', 'home', '🛋️', 'Take it easy at home until evening', 'Rest for house till evening come', 'sleep'),
  hike: S('hikeFun', 'outing', '⛰️', 'Go on a group hike with your friends', 'Go hike with your padis for hill', 'hike'),
  beach: S('beachFun', 'outing', '🏖️', 'Go to the beach with your friends', 'Go beach with your padis', 'beach'),
  evening: S('eveningSleep', 'home', '🌙', 'It is evening. Go home and sleep to start a new year', 'Evening don reach. Go house sleep, make new year start', 'sleep'),
}
/** The kind of errand and where it is, for the guide, the map pin and the arrival check. */
export const errandSeed = (life: GameState, kind: ErrandKind) => life.seed + life.character.age * 7 + (kind === 'visit' ? 1 : 2)

/** `hour` is the time of day (default morning). From 7 pm until the early hours the guide only wants you in bed, wherever you are. */
export function suggest(life: GameState, hour = 8): Suggestion | null {
  if (life.phase !== 'action' || life.quiz) return null
  const c = life.character
  const used = (id: string) => Number(life.activityCounts[id] ?? 0)
  const inSchool = c.edu.level !== 'none'
  if (c.stats.energy < 12) return SUGS.sleepTired
  if (c.stats.health < 40) return SUGS.restSick
  if (c.stats.happiness < 35) return SUGS.cheer
  if (c.stats.stress > 70) return SUGS.stress
  if (hour >= 19 || hour < 5) return FUN.evening // night: bed
  // the morning at home: freshen up, eat, help Mama, then off to school or work
  const young = c.age < 18
  if (hour >= 5 && hour < 11 && c.age >= 5) {
    if (used('groom') < 1) return FUN.groom
    if (used('meal') < 1 && c.age < 30) return FUN.breakfast
    if (young && used('chores') < 1 && c.stats.energy >= 12) return FUN.chores
  }
  const goal = dreamGoal(life)
  if (goal?.doable) return goal.suggestion
  if (inSchool && used('study') < 2) return SUGS.study
  // the day's work is done: free time until evening (play the Dash, visit a friend, find a new route)
  if (c.age >= 6 && used('dash') < 1 && c.stats.energy >= 18) return FUN.dash
  if (hour >= 12 && young && used('play') < 2 && c.stats.energy >= 14) return FUN.football
  if (!c.job && !inSchool && c.age >= 18 && c.age < 62) return SUGS.job
  if (c.job && used('overtime') < 1 && c.age < 60) return SUGS.boss
  if (c.age >= 14 && used('hustle') < 1 && c.stats.energy >= 22) return SUGS.hustle
  if (c.age < 14 && used('play') < 1) return SUGS.playKid
  if (c.age >= 8 && !life.flags[`d_visit_${c.age}`] && c.stats.energy >= 14) return FUN.visit
  if (c.age >= 8 && !life.flags[`d_explore_${c.age}`] && c.stats.energy >= 12) return FUN.explore
  { const trip = flavourOf(c.housing.districtId).outing; if (hour >= 11 && c.age >= 13 && used(trip) < 1 && c.stats.energy >= 24 && (trip !== 'beach' || c.stats.cash >= 8000)) return FUN[trip] }
  if (used('socialise') < 1 && c.stats.energy >= 15) return SUGS.friend
  if (used('familyTime') < 1) return SUGS.family
  if (hour >= 14 && life.flags['inst:tv'] && used('tv') < 1) return FUN.tv
  if (hour >= 12 && used('meal') < 2 && c.age < 30) return { ...FUN.breakfast, id: 'askLunch', text: 'Ask Mama for lunch', say: say('Ask Mama for lunch', 'Ask Mama for food, make you chop') }
  if (c.age >= 10 && used('exercise') < 2 && c.stats.energy >= 20) return FUN.pitch
  if (used('treat') < 1 && c.stats.cash >= 40000 && c.stats.energy >= 10) return FUN.treat
  return FUN.wait
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
  home: { sleep: 'bed', groom: 'bath', chores: 'kitchen' },
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
export interface GuideStep { key: string; icon: string; say: Say; /** id of the recorded voice clip for this line, if any */ voice?: string; /** extra on-screen detail that is not spoken (place name, direction, steps) */ detail?: string; target: GuideTarget; /** where the compass should point (world x,z) */ aim?: { x: number; z: number } }

export interface GuideCtx {
  life: GameState
  hour?: number
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

export function guideStep(ctx: GuideCtx): GuideStep | null {
  const { life, district, inside, near, pos, stuck, track } = ctx
  if (life.phase !== 'action' || life.quiz) return null
  const sug = track ?? suggest(life, ctx.hour)
  if (!sug) return null
  const pl = district.places.find((p) => p.id === sug.place)
  const placeName = pl?.name ?? 'the place'
  const icon = 'icon' in sug ? (sug as Suggestion).icon : '📍'
  if (stuck === 1) return { key: 'stuck-q', icon: '🎯', say: GEN.stuckQ, voice: 'g_stuckQ', target: { t: 'ui', el: 'quests' } }
  if (stuck === 2) return { key: 'stuck-m', icon: '🗺️', say: GEN.stuckM, voice: 'g_stuckM', target: { t: 'ui', el: 'map' } }
  const errand = 'errand' in sug ? (sug as Suggestion).errand : undefined
  if (errand) {
    if (inside) return { key: 'exit', icon: '🚪', say: GEN.exit, detail: 'Then: your errand', voice: 'g_exit', target: { t: 'exit' }, aim: INTERIORS[inside]?.door }
    const sp = errandSpot(district, errand, errandSeed(life, errand)); const b = bearing(pos, sp)
    return { key: `errand-${errand}`, icon, say: sug.say, detail: `${b.dir} · ${b.steps} steps`, target: { t: 'none' }, aim: sp }
  }
  const act = sug.act
  if (inside) {
    if (inside === sug.place) {
      const spot = act ? SPOT[inside]?.[act] : undefined
      const h = spot ? INTERIORS[inside]?.hotspots.find((x) => x.id === spot) : undefined
      if (h) return { key: `spot-${h.id}`, icon: h.icon, say: GEN.spot, detail: h.name, voice: 'g_spot', target: { t: 'hotspot', id: h.id }, aim: { x: h.x, z: h.z } }
      return { key: `look-${inside}`, icon, say: GEN.look, voice: 'g_look', target: { t: 'none' } }
    }
    const door = INTERIORS[inside]?.door
    return { key: 'exit', icon: '🚪', say: GEN.exit, detail: `Then: ${placeName}`, voice: 'g_exit', target: { t: 'exit' }, aim: door }
  }
  if (!pl) return null
  if (near === sug.place) return { key: `enter-${sug.place}`, icon, say: GEN.enter, detail: placeName, voice: 'g_enter', target: { t: 'enter', place: sug.place } }
  const b = bearing(pos, pl.door)
  return { key: `go-${sug.place}`, icon, say: sug.say, detail: `${b.dir} · ${b.steps} steps`, voice: 'id' in sug ? `sug_${sug.id}` : sug.voice, target: { t: 'place', place: sug.place }, aim: pl.door }
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
