// Which appliances are installed in the player's home. Family homes come furnished; rented and owned homes start bare
// and you buy appliances at the market and have a loader deliver them.
export const BASE_BY_HOUSING: Record<string, string[]> = {
  family: ['tv', 'fan', 'fridge', 'cooker', 'sofa'],
  rent: ['cooker', 'sofa'],
  own: ['cooker', 'sofa', 'fan'],
}

export function installedSet(housingType: string, flags: Record<string, boolean | number | string>): Set<string> {
  const s = new Set(BASE_BY_HOUSING[housingType] ?? BASE_BY_HOUSING.family)
  for (const k of Object.keys(flags)) if (k.startsWith('inst:') && flags[k]) s.add(k.slice(5))
  return s
}
