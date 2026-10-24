// The stretch of town west of a level's main scene, for levels that start with a bus ride. The bus stop is at x = -30.
import type { Deco, Rect, Theme } from './schema'

const R = (x0: number, x1: number, z0: number, z1: number): Rect => ({ x0, x1, z0, z1 })
export const STREET: { floor: Rect & { color: string }; deco: Deco[] } = {
  floor: { x0: -34, x1: -12.4, z0: -6, z1: 3.2, color: '#d9cdb0' },
  deco: [{ kind: 'road', x: -23.2, z: 4.4, w: 22.4, d: 2.6 }, { kind: 'wall', x: -23.2, z: -7.6, w: 23, d: 2, h: 3.2, color: '#f3e7cf' }, { kind: 'sign', x: -30, z: 1.6, label: 'BUS STOP', w: 1.8 },
    { kind: 'tree', x: -24, z: -4.6 }, { kind: 'tree', x: -18, z: -4.8 }, { kind: 'lamp', x: -20, z: 2.2 }, { kind: 'lamp', x: -26, z: 2.2 }],
}
export const STREET_BOUNDS = R(-34, 12.4, -6, 6)
/** the same stretch as a train station: a platform, rails instead of a road, a station sign */
export const STATION: typeof STREET = {
  floor: { ...STREET.floor, color: '#cfc8b8' },
  deco: STREET.deco.map((d) => d.kind === 'road' ? { ...d, kind: 'rail' as const, d: 2.6 } : d.kind === 'sign' ? { ...d, label: 'STATION', w: 1.8 } : d),
}
export const withStreet = (t: Theme, vehicle: 'bus' | 'train' = 'bus'): Theme => { const s = vehicle === 'train' ? STATION : STREET; return { ...t, floors: [...t.floors, s.floor], deco: [...t.deco, ...s.deco] } }
