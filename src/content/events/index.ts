import type { GameEvent } from '@engine/core/types'
import { childEvents } from './child'
import { teenEvents } from './teen'
import { youngAdultEvents } from './youngAdult'
import { adultEvents } from './adult'
import { elderEvents } from './elder'
import { scriptedEvents } from './scripted'
import { careerEvents } from './career'
import { familyEvents } from './family'
import { cultureEvents } from './culture'

export const EVENTS: GameEvent[] = [
  ...scriptedEvents, ...childEvents, ...teenEvents, ...youngAdultEvents, ...adultEvents, ...elderEvents, ...careerEvents, ...familyEvents, ...cultureEvents,
]
export const EVENT_BY_ID: Record<string, GameEvent> = Object.fromEntries(EVENTS.map((e) => [e.id, e]))
