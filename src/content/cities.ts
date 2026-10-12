// The two cities you can live in. A city decides the look of the streets, the vehicles, place names and the flavour of
// events. Your district (stored as housing.districtId) belongs to exactly one city, so everything else derives from it.
import { HOMES } from './archetypes'

export type CityId = 'lagos' | 'abuja'

export interface CityDef {
  id: CityId
  name: string
  icon: string
  tagline: string
  vibe: string[]
  vehicle: { name: string; plural: string; look: string } // what people ride on the streets
  stop: string // the bus stop / cab rank
  hubs: string // landmark line used in blurbs
  greet: string // what the conductor says in this city
  dashBlurb: string
}

export const CITIES: Record<CityId, CityDef> = {
  lagos: {
    id: 'lagos', name: 'Lagos', icon: '🚌', tagline: 'Fast, loud, packed. Everybody is hustling.',
    vibe: ['Yellow danfo buses', 'Go-slow traffic', 'Markets and mainland energy'],
    vehicle: { name: 'danfo', plural: 'danfos', look: 'yellow bus with a black stripe' },
    stop: 'Danfo Bus Stop', hubs: 'Obalende, Oshodi and the Third Mainland Bridge',
    greet: 'Oya enter, make we waka this life journey!',
    dashBlurb: 'Run, dodge and collect ₦ coins through Lagos.',
  },
  abuja: {
    id: 'abuja', name: 'Abuja', icon: '🚕', tagline: 'Planned, green, calmer. Government town with big dreams.',
    vibe: ['Green taxis', 'Wide roads and roundabouts', 'Secretariats, estates and Zuma Rock views'],
    vehicle: { name: 'cab', plural: 'cabs', look: 'green and white taxi' },
    stop: 'Cab Rank', hubs: 'Wuse, Garki and the Three Arms Zone',
    greet: 'Oya enter, make we waka this Abuja journey!',
    dashBlurb: 'Run, dodge and collect ₦ coins through Abuja.',
  },
}
export const CITY_LIST: CityDef[] = [CITIES.lagos, CITIES.abuja]

/** Which city a home or district id belongs to. Unknown ids count as Lagos, which keeps older saves working. */
export const cityOfHome = (homeId: string): CityId => HOMES.find((h) => h.id === homeId)?.city ?? 'lagos'

/** Rewrite Lagos transport words for the player's city (used for text that is shared between the cities). */
export function localise(city: CityId, text: string): string {
  if (city === 'lagos') return text
  return text.replace(/\bdanfos\b/g, 'cabs').replace(/\bdanfo\b/g, 'cab').replace(/\bDanfos\b/g, 'Cabs').replace(/\bDanfo\b/g, 'Cab').replace(/\bLagos\b/g, 'Abuja').replace(/\bkeke\b/g, 'cab').replace(/\bKeke\b/g, 'Cab')
}
