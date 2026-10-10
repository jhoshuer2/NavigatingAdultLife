// Player accounts for online play (docs/PRD-multiplayer.md FR-M1). Shared by the game client and the account API.
// Accounts are anonymous: a display name, an age band and a recovery code. No email or phone is collected.
import { z } from 'zod'

export const AGE_BANDS = ['under13', '13to17', '18plus'] as const
export type AgeBand = (typeof AGE_BANDS)[number]
export type ChatLevel = 'none' | 'friends' | 'local'

/** 3 to 16 characters: letters, digits, spaces and . _ ' - inside; must start and end with a letter or digit. */
export const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9 _.'-]{1,14}[A-Za-z0-9]$/
export const PIN_RE = /^\d{4}$/
export const RECOVERY_RE = /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/

// A short blocklist plus rules against phone numbers, emails and links. The owner should extend this with Pidgin, Yoruba, Igbo and Hausa words.
const BLOCKED = ['fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'nigga', 'nigger', 'rape', 'porn', 'sex', 'admin', 'moderator', 'support', 'official', 'asshole', 'bastard']
export function isCleanName(raw: string): boolean {
  const name = raw.trim()
  if (!NAME_RE.test(name)) return false
  const flat = name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's')
  if (BLOCKED.some((w) => flat.includes(w))) return false
  if (/\d{5,}/.test(name.replace(/\s/g, ''))) return false // phone numbers
  return true
}

const name = z.string().trim().refine(isCleanName, 'bad_name')
const pin = z.string().regex(PIN_RE)

export const AccountRequest = z.discriminatedUnion('op', [
  z.object({ op: z.literal('create'), name, age_band: z.enum(AGE_BANDS) }),
  z.object({ op: z.literal('me') }),
  z.object({ op: z.literal('update'), name: name.optional(), mp_enabled: z.boolean().optional(), pin: pin.optional() }),
  z.object({ op: z.literal('set_pin'), pin, current_pin: pin.optional() }),
  z.object({ op: z.literal('recover'), code: z.string().trim().toUpperCase().regex(RECOVERY_RE) }),
  z.object({ op: z.literal('rotate_recovery') }),
  z.object({ op: z.literal('logout_all') }),
  z.object({ op: z.literal('delete') }),
])
export type AccountRequestT = z.infer<typeof AccountRequest>

export interface AccountPublic {
  id: string
  name: string
  tag: number
  label: string // Name#1234
  friend_code: string
  age_band: AgeBand
  mp_enabled: boolean
  has_guardian_pin: boolean
  chat_level: ChatLevel
  created_at: string
}

export type AccountError = 'bad_request' | 'bad_name' | 'unauthorized' | 'guardian_required' | 'pin_required' | 'bad_pin' | 'rate_limited' | 'not_found' | 'server'
export interface AccountResponse { account?: AccountPublic; token?: string; recovery_code?: string; ok?: boolean; error?: AccountError }
