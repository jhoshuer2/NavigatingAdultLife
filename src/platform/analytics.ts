// Consent-gated, anonymous funnel events. M1 keeps them local (no network); a collector can be wired in later.
const KEY = 'nal.analytics.v1'
type Counts = Record<string, number>

export function track(consent: boolean, name: string, detail?: string) {
  if (!consent) return
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Counts
    const k = detail ? `${name}:${detail}` : name
    c[k] = (c[k] ?? 0) + 1
    localStorage.setItem(KEY, JSON.stringify(c))
  } catch { /* ignore */ }
}
export const readAnalytics = (): Counts => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Counts } catch { return {} } }
