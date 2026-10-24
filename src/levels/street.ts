// The stretch of town west of a level's main scene, for levels that start with a ride. The stop is at x = -30. Each vehicle has its own setting:
// a bus stop on a road, a train station on rails, a helipad, a ferry dock on the water.
import type { Deco, Rect, Theme, Vehicle } from './schema'

const R = (x0: number, x1: number, z0: number, z1: number): Rect => ({ x0, x1, z0, z1 })
export interface StreetSet { floor: Rect & { color: string }; deco: Deco[] }
const base = (road: Deco, sign: string, extra: Deco[] = [], floor = '#d9cdb0'): StreetSet => ({
  floor: { x0: -34, x1: -12.4, z0: -6, z1: 3.2, color: floor },
  deco: [road, { kind: 'wall', x: -23.2, z: -7.6, w: 23, d: 2, h: 3.2, color: '#f3e7cf' }, { kind: 'sign', x: -30, z: 1.6, label: sign, w: 1.8 },
    { kind: 'tree', x: -24, z: -4.6 }, { kind: 'tree', x: -18, z: -4.8 }, { kind: 'lamp', x: -20, z: 2.2 }, { kind: 'lamp', x: -26, z: 2.2 }, ...extra],
})
export const SETS: Record<Vehicle, StreetSet> = {
  bus: base({ kind: 'road', x: -23.2, z: 4.4, w: 22.4, d: 2.6 }, 'BUS STOP'),
  train: base({ kind: 'rail', x: -23.2, z: 4.4, w: 22.4, d: 2.6 }, 'STATION', [], '#cfc8b8'),
  helicopter: base({ kind: 'road', x: -23.2, z: 4.4, w: 22.4, d: 2.6, color: '#8c8a84' }, 'HELIPAD', [{ kind: 'pad', x: -28.6, z: 4.4, w: 4 }], '#cfcac0'),
  ferry: base({ kind: 'water', x: -23.2, z: 4.9, w: 22.4, d: 3.6 }, 'FERRY DOCK', [{ kind: 'rug', x: -28.6, z: 3.4, w: 4.6, d: 1.2, color: '#a87a50' }], '#d6c9a8'),
}
export const STREET = SETS.bus
export const STREET_BOUNDS = R(-34, 12.4, -6, 6)
export const withStreet = (t: Theme, vehicle: Vehicle = 'bus'): Theme => { const s = SETS[vehicle]; return { ...t, floors: [...t.floors, s.floor], deco: [...t.deco, ...s.deco] } }
/** words for the player: what it is called and where it waits */
export const VEHICLE_INFO: Record<Vehicle, { noun: string; sign: string; hint: string }> = {
  bus: { noun: 'bus', sign: 'BUS STOP', hint: 'Walk to the BUS STOP sign, wait for the yellow bus and tap Board the bus.' },
  train: { noun: 'train', sign: 'STATION', hint: 'Walk to the STATION sign, wait for the train and tap Board the train.' },
  helicopter: { noun: 'helicopter', sign: 'HELIPAD', hint: 'Walk to the HELIPAD sign, wait for the helicopter to land and tap Board the helicopter.' },
  ferry: { noun: 'ferry', sign: 'FERRY DOCK', hint: 'Walk to the FERRY DOCK sign, wait for the ferry and tap Board the ferry.' },
}
