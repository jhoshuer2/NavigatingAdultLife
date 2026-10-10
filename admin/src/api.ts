export class ApiError extends Error { constructor(public status: number, message: string) { super(message) } }

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch(`/api/admin/${path}`, {
    method: opts.method ?? 'GET', credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...(opts.method && opts.method !== 'GET' ? { 'x-nal-admin': '1' } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new ApiError(r.status, (j as { error?: string }).error ?? `Error ${r.status}`)
  return j as T
}

export interface Admin { admin_id: string; email: string; role: 'owner' | 'analyst' | 'support' | 'engineer' }
export interface FilterState { range: '7d' | '30d' | '90d' | 'custom'; from: string; to: string; country: string; device_type: string; app_version: string; cohort: string }

const day = (d: Date) => d.toISOString().slice(0, 10)
export function rangeFor(range: FilterState['range'], from?: string, to?: string) {
  const end = new Date(); const t = day(end)
  if (range === 'custom' && from && to) return { from, to }
  const n = range === '7d' ? 7 : range === '90d' ? 90 : 30
  return { from: day(new Date(end.getTime() - (n - 1) * 86400e3)), to: t }
}
export const defaultFilters = (): FilterState => ({ range: '30d', ...rangeFor('30d'), country: 'all', device_type: 'all', app_version: 'all', cohort: 'all' })
export const qs = (f: FilterState, extra: Record<string, string | number | undefined> = {}) => {
  const p = new URLSearchParams({ from: f.from, to: f.to })
  for (const k of ['country', 'device_type', 'app_version', 'cohort'] as const) if (f[k] !== 'all') p.set(k, f[k])
  for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== '') p.set(k, String(v))
  return p.toString()
}

export const fmtDur = (s: number) => s < 60 ? `${Math.round(s)}s` : s < 3600 ? `${Math.floor(s / 60)}m ${String(Math.round(s % 60)).padStart(2, '0')}s` : `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m`
export const fmtNum = (n: number) => n.toLocaleString('en-NG')
export const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : '–'
const regions = new Intl.DisplayNames(['en'], { type: 'region' })
export const countryName = (c: string | null) => { try { return c && c !== '??' ? regions.of(c) ?? c : 'Unknown' } catch { return c ?? 'Unknown' } }
