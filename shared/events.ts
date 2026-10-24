// Telemetry event schema shared by the game SDK and the collector (docs/PRD-admin-analytics.md section 4.1).
// One definition so the two sides cannot drift. Props are an allow-list per event: anything else is dropped.
import { z } from 'zod'

export const MAX_BATCH = 50
export const MAX_EVENT_BYTES = 2048
export const SCHEMA_VERSION = 1

/** Allowed prop keys per event name. Free text from players is never allowed. */
export const EVENT_PROPS = {
  // lifecycle
  app_open: ['referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'display_mode', 'language', 'tz', 'screen_band', 'is_test', 'load_ms'],
  session_start: ['display_mode'],
  session_end: ['reason', 'active_seconds'],
  heartbeat: ['active_seconds', 'screen', 'mode', 'place'],
  consent_changed: ['granted'],
  pwa_installed: [],
  // onboarding
  title_viewed: [],
  create_started: [],
  create_completed: ['archetype', 'gender', 'district', 'birth_lottery'],
  tutorial_step: ['step'],
  tutorial_skipped: ['step'],
  tutorial_completed: [],
  // chapters (2.0)
  first_task_started: ['task', 'ms_since_open'],
  first_task_completed: ['task', 'duration_s'],
  level_started: ['level', 'character', 'resumed'],
  level_completed: ['level', 'stars', 'duration_s', 'mistakes', 'hints'],
  level_abandoned: ['level', 'task', 'duration_s'],
  task_failed: ['task', 'reason'],
  hint_used: ['task'],
  session_resume: ['level', 'task'],
  level_feedback: ['level', 'rating', 'issue'],
  rush_finished: ['mode', 'distance', 'won'],
  // life
  life_started: ['life_index'],
  year_ended: ['age', 'life_index'],
  life_ended: ['age', 'life_index', 'ending_id', 'years_lived', 'final_stats'],
  // world
  place_entered: ['place', 'hour'],
  place_exited: ['place'],
  door_opened: ['place'],
  map_opened: [],
  map_travel: ['place'],
  sleep_started: ['appliances_on'],
  sleep_ended: ['hours_slept', 'appliances_on'],
  wait_used: [],
  // tasks
  task_started: ['task', 'place', 'partner_role'],
  task_completed: ['task', 'place', 'perf', 'duration_s', 'partner_role'],
  task_abandoned: ['task', 'place', 'duration_s'],
  // activities / social / events
  activity_done: ['activity_id', 'energy_cost', 'cash_delta'],
  conversation_choice: ['tone', 'role', 'setting'],
  hangout_destination: ['setting'],
  story_event_shown: ['event_id'],
  story_choice_made: ['event_id', 'choice_id'],
  // minigame
  dash_started: ['mode'],
  dash_finished: ['mode', 'distance', 'coins'],
  // economy
  shop_viewed: [],
  item_bought: ['item_id', 'price'],
  paywall_seen: [],
  topup_started: ['item_id'],
  topup_completed: ['item_id', 'minutes', 'amount', 'currency'],
  tokens_spent: ['minutes'],
  // progress
  quest_completed: ['id'],
  achievement_unlocked: ['id'],
  unlock_bought: ['id'],
  // quality
  error: ['message'],
  slow_device_detected: ['fps_band', 'ua_class'],
  menu_mode_switched: ['on'],
  webgl_unavailable: [],
  // feedback
  content_flagged: ['event_id', 'reason'],
} as const satisfies Record<string, readonly string[]>

export type EventName = keyof typeof EVENT_PROPS
export const EVENT_NAMES = Object.keys(EVENT_PROPS) as EventName[]

const propValue = z.union([z.string().max(80), z.number().finite(), z.boolean(), z.null()])
const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

export const eventSchema = z.object({
  event_id: uuid,
  name: z.string().refine((n): n is EventName => n in EVENT_PROPS, 'unknown event'),
  ts: z.string().datetime({ offset: true }),
  device_id: uuid,
  session_id: uuid,
  life_id: uuid.nullish(),
  app_version: z.string().max(32),
  props: z.record(z.string().max(40), propValue).default({}),
})
export type TelemetryEvent = z.infer<typeof eventSchema>

export const batchSchema = z.object({
  v: z.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
  events: z.array(z.unknown()).max(MAX_BATCH),
  /** Client context, sent once per batch; the collector stores it on the device record. */
  ctx: z.object({
    language: z.string().max(20).optional(),
    tz: z.string().max(64).optional(),
    screen_band: z.enum(['xs', 'sm', 'md', 'lg']).optional(),
    display_mode: z.string().max(20).optional(),
    consent_version: z.string().max(20).optional(),
    is_test: z.boolean().optional(),
  }).optional(),
})
export type Batch = z.infer<typeof batchSchema>

/** Strip props that are not on the allow-list for this event. */
export function cleanProps(name: EventName, props: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const allowed = new Set<string>(EVENT_PROPS[name])
  const out: Record<string, string | number | boolean | null> = {}
  for (const [k, v] of Object.entries(props)) {
    if (allowed.has(k) && (v === null || ['string', 'number', 'boolean'].includes(typeof v))) out[k] = v as never
  }
  return out
}

/** Validate one raw event. Returns null when invalid or oversized. */
export function parseEvent(raw: unknown): TelemetryEvent | null {
  try { if (JSON.stringify(raw).length > MAX_EVENT_BYTES) return null } catch { return null }
  const r = eventSchema.safeParse(raw)
  if (!r.success) return null
  return { ...r.data, props: cleanProps(r.data.name as EventName, r.data.props) }
}
