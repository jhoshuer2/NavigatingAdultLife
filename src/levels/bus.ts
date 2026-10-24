// Puts a bus ride in front of an existing level: a new first task (walk to the stop, board, ride across town, get off at the gate) and a street west of
// the scene. Everything keyed by task index is shifted by one so the level's own tasks keep working.
import type { LevelDef, Line, Vehicle } from './schema'
import { T } from './chapter1b'
import { VEHICLE_INFO, withStreet } from './street'

export interface BusOpts { /** default bus */ vehicle?: Vehicle; to: string; title: string; purpose: string; objective: string; success: string; intro: Line[]; done: Line[] }
const shift = <V>(m: Record<number, V> | undefined): Record<number, V> | undefined => m && Object.fromEntries(Object.entries(m).map(([k, v]) => [Number(k) + 1, v]))

export function withBus(l: LevelDef, o: BusOpts): LevelDef {
  const task = T(l.id, 0, 'ride', o.title, { purpose: o.purpose, objective: o.objective, success: o.success, intro: o.intro, done: o.done, hint: VEHICLE_INFO[o.vehicle ?? 'bus'].hint })
  return {
    ...l,
    tasks: [task, ...l.tasks],
    bounds: { x0: -34, x1: Math.max(12.4, l.bounds.x1), z0: Math.min(-6, l.bounds.z0), z1: Math.max(6, l.bounds.z1) },
    theme: l.sceneKind === 'scene' && l.theme ? withStreet(l.theme, o.vehicle) : l.theme,
    spawn: { x: -32, z: 0.4 },
    items: l.items.map((i) => ({ ...i, task: i.task + 1 })),
    spots: l.spots.map((s) => ({ ...s, task: s.task + 1 })),
    sequences: shift(l.sequences), holds: shift(l.holds), budgets: shift(l.budgets),
    serves: shift(l.serves), talks: shift(l.talks), rides: { 0: { vehicle: o.vehicle, stop: { x: -30, z: 1.8 }, busZ: 4.4, from: 'home', to: o.to }, ...shift(l.rides) },
    variants: l.variants && Object.fromEntries(Object.entries(l.variants).map(([k, v]) => [k, { ...v, goals: shift(v.goals) }])),
    gotoAreas: [{ x: -13.4, z: 0.8, r: 1.4 }, ...(l.gotoAreas ?? [])],
    guideAreas: [{ x: -30, z: 1.8, r: 2 }, ...l.guideAreas],
    crowd: [...(l.crowd ?? []), { x: -22, z: 0.4, rot: 1.6 }, { x: -17, z: 1.4, rot: -1.5 }],
  }
}
