// Geo comes from the host's edge headers (Vercel). The IP address itself is never read, stored or logged.
export interface Geo { country: string | null; region: string | null; city: string | null }

export function geoFromHeaders(h: Headers): Geo {
  const dec = (v: string | null) => { if (!v) return null; try { return decodeURIComponent(v).slice(0, 80) } catch { return v.slice(0, 80) } }
  const country = h.get('x-vercel-ip-country')?.toUpperCase().slice(0, 2) || null
  return { country: country && /^[A-Z]{2}$/.test(country) ? country : null, region: dec(h.get('x-vercel-ip-country-region')), city: dec(h.get('x-vercel-ip-city')) }
}

/** ISO 3166-2:NG subdivision codes (Vercel sends the part after "NG-"). */
export const NG_STATES: Record<string, string> = {
  AB: 'Abia', AD: 'Adamawa', AK: 'Akwa Ibom', AN: 'Anambra', BA: 'Bauchi', BY: 'Bayelsa', BE: 'Benue', BO: 'Borno', CR: 'Cross River', DE: 'Delta',
  EB: 'Ebonyi', ED: 'Edo', EK: 'Ekiti', EN: 'Enugu', FC: 'Abuja (FCT)', GO: 'Gombe', IM: 'Imo', JI: 'Jigawa', KD: 'Kaduna', KN: 'Kano', KT: 'Katsina',
  KE: 'Kebbi', KO: 'Kogi', KW: 'Kwara', LA: 'Lagos', NA: 'Nasarawa', NI: 'Niger', OG: 'Ogun', ON: 'Ondo', OS: 'Osun', OY: 'Oyo', PL: 'Plateau',
  RI: 'Rivers', SO: 'Sokoto', TA: 'Taraba', YO: 'Yobe', ZA: 'Zamfara',
}
