// Public engine API. All functions are pure: they clone the state and return a new one.
import type { GameState, Lifestyle, NewLifeConfig, NpcRole, TrackId } from './core/types'
import { withCtx, type Ctx } from './systems/ctx'
import { newState, setupLife, endActions, acknowledgeEvent, nextYear } from './systems/lifecycle'
import { listActivities, performActivity, answerQuiz, shopItems, jobOptions, type ActivityArgs } from './systems/activities'
import { resolveChoice, choiceAvailable } from './systems/events'
import { addStat, moment } from './systems/effects'
import { log } from './systems/log'
import { HOMES } from '@content/archetypes'
import { CITIES, cityOfHome } from '@content/cities'
import { npcByRole } from './core/helpers'
import { dreamProgress, evaluateProgress } from './systems/progress'
import { EVENT_BY_ID } from '@content/events'
import { fillText } from './systems/text'
import { traitSum } from './core/helpers'

export { SCHEMA_VERSION, START_AGE, MAX_AGE } from './systems/lifecycle'

export function createNewLife(config: NewLifeConfig, seed: number): GameState {
  const base = newState(config, seed)
  return withCtx(base, (ctx) => {
    setupLife(ctx, config)
    evaluateProgress(ctx)
  }).state
}

/** Set or clear a flag (used for deliveries and installed appliances). */
export function setFlag(state: GameState, key: string, val: boolean | number | string | null): GameState {
  const s = structuredClone(state); if (val === null) delete s.flags[key]; else s.flags[key] = val; return s
}
/** Pay a one-off cost outside an activity (for example a loader's fee). */
export function payCash(state: GameState, amount: number, label: string): GameState {
  return withCtx(state, (ctx) => { addStat(ctx, 'cash', -amount, label) }).state
}
export const MOVE_COST = 100000
export const MOVE_ENERGY = 25

/** Move to a home in another district or city. Costs cash and energy, and old friends drift a little. */
export function relocate(state: GameState, homeId: string): { state: GameState; ok: boolean; reason?: string } {
  const home = HOMES.find((h) => h.id === homeId)
  const c0 = state.character
  if (!home || home.id === c0.housing.districtId) return { state, ok: false, reason: 'Pick a different place.' }
  if (state.phase !== 'action') return { state, ok: false, reason: 'Finish what you are doing first.' }
  if (c0.stats.cash < MOVE_COST) return { state, ok: false, reason: `Moving costs ₦${MOVE_COST.toLocaleString('en-NG')}.` }
  if (c0.stats.energy < MOVE_ENERGY) return { state, ok: false, reason: 'You are too tired to pack. Rest first.' }
  const newCity = cityOfHome(home.id) !== cityOfHome(c0.housing.districtId)
  const out = withCtx(state, (ctx) => {
    const c = ctx.s.character
    addStat(ctx, 'cash', -MOVE_COST, 'Moving')
    c.stats.energy -= MOVE_ENERGY
    c.housing = { ...c.housing, type: c.housing.type === 'own' ? 'rent' : c.housing.type, districtId: home.id }
    ctx.s.flags.cityMoves = (Number(ctx.s.flags.cityMoves) || 0) + (newCity ? 1 : 0)
    if (newCity) {
      for (const role of ['friend', 'friend2'] as const) { const n = npcByRole(ctx.s, role); if (n) n.closeness = Math.max(0, n.closeness - 10) }
      addStat(ctx, 'stress', 4, 'New city')
      addStat(ctx, 'happiness', 3, 'Fresh start')
      moment(ctx.s, `Moved to ${home.district}, ${CITIES[cityOfHome(home.id)].name}.`, 3)
    } else moment(ctx.s, `Moved to ${home.district}.`, 1)
  })
  return { state: out.state, ok: true }
}

export function setClock(state: GameState, hour: number, day: number): GameState {
  const s = structuredClone(state); s.clock = { hour, day }; return s
}

export function getActivities(state: GameState) { return withCtx(state, (ctx) => listActivities(ctx)).result }
export function getShopItems(state: GameState) { return withCtx(state, (ctx) => shopItems(ctx)).result }
export function getJobOptions(state: GameState) { return withCtx(state, (ctx) => jobOptions(ctx)).result }
export function getDreamProgress(state: GameState) { return withCtx(state, (ctx) => dreamProgress(ctx)).result }

export function doActivity(state: GameState, id: string, args: ActivityArgs = {}): { state: GameState; ok: boolean } {
  const r = withCtx(state, (ctx) => { const ok = performActivity(ctx, id, args); if (ok) evaluateProgress(ctx); return ok })
  return { state: r.result ? r.state : state, ok: r.result }
}

export function submitQuizAnswer(state: GameState, optionIndex: number) {
  const r = withCtx(state, (ctx) => { const res = answerQuiz(ctx, optionIndex); evaluateProgress(ctx); return res })
  return { state: r.state, result: r.result }
}

export function finishActions(state: GameState): GameState {
  return withCtx(state, (ctx) => { endActions(ctx) }).state
}

export function chooseOption(state: GameState, choiceId: string): GameState {
  return withCtx(state, (ctx) => { if (state.activeEvent?.result) return; resolveChoice(ctx, choiceId); evaluateProgress(ctx) }).state
}

export function continueAfterEvent(state: GameState): GameState {
  return withCtx(state, (ctx) => { acknowledgeEvent(ctx) }).state
}

export function advanceYear(state: GameState): GameState {
  return withCtx(state, (ctx) => { nextYear(ctx) }).state
}

export function setLifestyle(state: GameState, lifestyle: Lifestyle): GameState {
  return withCtx(state, (ctx) => { ctx.s.character.lifestyle = lifestyle }).state
}

export interface MiniGameResult { coins: number; distance: number; closeCalls: number; passengers: number; mode: 'foot' | 'danfo'; score: number; fares?: number; missionsDone?: number; raceWon?: boolean }

/** Apply the result of a Go-Slow Dash run to the life sim. Pure; the cash-out cap is enforced here. */
export function applyDashResult(state: GameState, r: MiniGameResult): { state: GameState; cash: number; capped: boolean } {
  const out = withCtx(state, (ctx) => {
    const { s } = ctx
    const c = s.character
    const mult = { child: 0.5, teen: 1, youngAdult: 3, adult: 4, elder: 2 }[ageStage(c.age)]
    const worth = Math.round((r.coins * 1000 + (r.fares ?? r.passengers * 1500)) * mult)
    const capped = c.dashCashouts >= 3
    if (!capped) { c.dashCashouts += 1; if (worth) addStat(ctx, 'cash', worth, 'Go-Slow Dash'); s.cowriesEarnedLife += Math.min(3, r.missionsDone ?? 0) }
    const hp = Math.min(4, Math.floor(r.distance / 400)) + (traitSum(c, 'dashHearts') ? 1 : 0)
    if (hp) addStat(ctx, 'health', hp, 'Go-Slow Dash')
    addStat(ctx, 'happiness', 2, 'Go-Slow Dash')
    if (r.closeCalls >= 5) addStat(ctx, 'reputation', 1, 'Go-Slow Dash')
    s.flags.dashPlayed = true
    if (r.raceWon) s.flags.dashRaceWon = true
    if (r.distance >= 500) s.flags.dash500 = true
    if (r.distance >= 1500) s.flags.dash1500 = true
    s.dashBest = Math.max(s.dashBest, r.score)
    s.lastAction = { text: capped ? 'Great run! No more fares this year, but you feel great.' : `Run finished: ${Math.round(r.distance)} m, ${r.coins} coins.`, deltas: [] }
    evaluateProgress(ctx)
    return { cash: capped ? 0 : worth, capped }
  })
  return { state: out.state, cash: out.result.cash, capped: out.result.capped }
}
function ageStage(age: number) { return age < 12 ? 'child' : age < 18 ? 'teen' : age < 30 ? 'youngAdult' : age < 60 ? 'adult' : 'elder' } // eslint-disable-line

import { buildEnding } from './systems/ending'
/** Compute what ending a state would get right now (used by tests and previews). */
/** The player reached the big dream and chose to close this life: build the ending and move on to a new life. */
export function finishDreamLife(state: GameState): GameState {
  return withCtx(state, (ctx) => {
    const s = ctx.s
    s.ending = buildEnding(ctx, 'The big dream came true.', true)
    s.phase = 'ended'
    log(s, 'system', `Dream achieved at ${s.character.age}.`)
  }).state
}
export function previewEnding(state: GameState) { return withCtx(state, (ctx) => buildEnding(ctx, 'Preview.')).result }

export function currentEvent(state: GameState) {
  const id = state.eventQueue[0]
  const ev = id ? EVENT_BY_ID[id] : undefined
  if (!ev) return undefined
  const text = fillText(state, ev.text)
  const choices = withCtx(state, (ctx) => ev.choices.map((c) => ({ choice: c, ...choiceAvailable(ctx, c), label: fillText(state, c.label), affordable: !c.cost?.cash || state.character.stats.cash >= c.cost.cash })).filter((c) => !c.choice.requires || c.ok)).result
  return { event: ev, text, choices }
}

export type { ActivityArgs, Ctx }
export type { NpcRole, TrackId }
