import type { TelemetryEvent } from '../../shared/events'

/** Map an event to the "feature" it counts as (Features page). Returns null for events that are not feature use. */
export function featureOf(e: Pick<TelemetryEvent, 'name' | 'props'>): { feature: string; score?: number } | null {
  const p = e.props
  const s = (k: string) => (typeof p[k] === 'string' || typeof p[k] === 'number' ? String(p[k]) : null)
  switch (e.name) {
    case 'place_entered': return s('place') ? { feature: `place:${s('place')}` } : null
    case 'task_completed': return s('task') ? { feature: `task:${s('task')}`, score: typeof p.perf === 'number' ? p.perf : undefined } : null
    case 'activity_done': return s('activity_id') ? { feature: `activity:${s('activity_id')}` } : null
    case 'dash_finished': return { feature: `minigame:dash_${s('mode') ?? 'foot'}` }
    case 'shop_viewed': return { feature: 'shop' }
    case 'item_bought': return { feature: 'shop_purchase' }
    case 'map_opened': return { feature: 'map' }
    case 'map_travel': return { feature: 'map_travel' }
    case 'wait_used': return { feature: 'wait' }
    case 'sleep_started': return { feature: 'sleep' }
    case 'menu_mode_switched': return { feature: 'menu_mode_switch' }
    case 'story_choice_made': return { feature: 'story_events' }
    case 'quest_completed': return { feature: 'quests' }
    case 'achievement_unlocked': return { feature: 'achievements' }
    case 'unlock_bought': return { feature: 'unlocks' }
    case 'paywall_seen': return { feature: 'paywall' }
    default: return null
  }
}

/** Where heartbeat seconds were spent. */
export function playtimeBucket(screen: unknown, mode: unknown): 'world' | 'menu_mode' | 'minigame' | 'menus' {
  if (screen === 'dash') return 'minigame'
  if (screen === 'play') return mode === 'menu' ? 'menu_mode' : 'world'
  return 'menus'
}
