// Online profile client (docs/PRD-multiplayer.md FR-M1). Anonymous: a display name, an age band and a recovery code.
// Nothing here runs unless the player opens Settings > Online profile and the account API is configured.
import type { AccountPublic, AccountRequestT, AccountResponse } from '@shared/account'

const env = import.meta.env as Record<string, string | undefined>
const URL_ = env?.VITE_ACCOUNT_URL || (env?.VITE_COLLECTOR_URL ? env.VITE_COLLECTOR_URL.replace(/\/api\/collect\/?$/, '/api/account') : '')
const KEY = 'nal.account.v1'

export const accountAvailable = () => !!URL_

interface Saved { token: string; account: AccountPublic }
const read = (): Saved | null => { try { const r = localStorage.getItem(KEY); return r ? (JSON.parse(r) as Saved) : null } catch { return null } }
const write = (s: Saved | null) => { try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY) } catch { /* ignore */ } }

export const savedAccount = (): AccountPublic | null => read()?.account ?? null

type Body = Distribute<AccountRequestT>
type Distribute<T> = T extends unknown ? Omit<T, never> : never

async function call(body: Body): Promise<AccountResponse> {
  if (!URL_) return { error: 'server' }
  const saved = read()
  try {
    const res = await fetch(URL_, { method: 'POST', headers: { 'content-type': 'application/json', ...(saved ? { authorization: `Bearer ${saved.token}` } : {}) }, body: JSON.stringify(body) })
    const json = (await res.json().catch(() => ({}))) as AccountResponse
    if (!res.ok && !json.error) return { error: res.status === 401 ? 'unauthorized' : 'server' }
    if (json.error === 'unauthorized') write(null)
    return json
  } catch { return { error: 'server' } }
}

function keep(r: AccountResponse): AccountResponse {
  if (r.account && (r.token || read())) write({ token: r.token ?? read()!.token, account: r.account })
  return r
}

export const createAccount = async (name: string, age_band: AccountPublic['age_band']) => keep(await call({ op: 'create', name, age_band }))
export const refreshAccount = async () => (read() ? keep(await call({ op: 'me' })) : ({ error: 'unauthorized' } as AccountResponse))
export const updateAccount = async (p: { name?: string; mp_enabled?: boolean; pin?: string }) => keep(await call({ op: 'update', ...p }))
export const setGuardianPin = async (pin: string, current_pin?: string) => keep(await call({ op: 'set_pin', pin, current_pin }))
export const recoverAccount = async (code: string) => keep(await call({ op: 'recover', code }))
export const rotateRecovery = async () => call({ op: 'rotate_recovery' })
export const signOutEverywhere = async () => { const r = await call({ op: 'logout_all' }); write(null); return r }
export const deleteAccount = async () => { const r = await call({ op: 'delete' }); if (r.ok) write(null); return r }
export const signOutHere = () => write(null)

export const ACCOUNT_ERRORS: Record<string, string> = {
  bad_name: 'That name is not allowed. Use 3 to 16 letters or numbers.',
  guardian_required: 'A parent or guardian must set a PIN first.',
  pin_required: 'Enter the guardian PIN.',
  bad_pin: 'Wrong PIN.',
  rate_limited: 'Too many tries. Wait a little and try again.',
  unauthorized: 'Please sign in again with your recovery code.',
  not_found: 'No account matches that code.',
  bad_request: 'Check what you typed and try again.',
  server: 'Could not reach the server. Try again later.',
}
