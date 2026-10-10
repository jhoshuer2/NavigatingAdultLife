import type { GameState, LogEntry } from '../core/types'

export function log(s: GameState, kind: LogEntry['kind'], text: string, extra: Partial<LogEntry> = {}) {
  s.log.push({ age: s.character.age, kind, text, ...extra })
  if (s.log.length > 120) s.log.splice(0, s.log.length - 120)
}
