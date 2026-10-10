import type { GameState } from '@engine/core/types'
import { SCHEMA_VERSION } from '@engine/api'
import { defaultMeta, type MetaProfile } from './meta'

const LIFE_KEY = 'nal.life.v1'
const META_KEY = 'nal.meta.v1'

function read(key: string): string | null { try { return localStorage.getItem(key) } catch { return null } }
function write(key: string, v: string): boolean { try { localStorage.setItem(key, v); return true } catch { return false } }

export function loadLife(): GameState | null {
  const raw = read(LIFE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { schemaVersion: number; state: GameState }
    return migrate(parsed)
  } catch { return null }
}
export function saveLife(s: GameState | null): boolean {
  if (!s) { try { localStorage.removeItem(LIFE_KEY) } catch { /* ignore */ } return true }
  return write(LIFE_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, state: s }))
}
function migrate(p: { schemaVersion: number; state: GameState }): GameState | null {
  if (!p || !p.state) return null
  // Future migrations: switch (p.schemaVersion) { case 1: ... }
  if (p.schemaVersion > SCHEMA_VERSION) return null
  return p.state
}

export function loadMeta(): MetaProfile {
  const raw = read(META_KEY)
  if (!raw) return defaultMeta()
  try { return { ...defaultMeta(), ...(JSON.parse(raw) as MetaProfile) } } catch { return defaultMeta() }
}
export function saveMeta(m: MetaProfile): boolean { return write(META_KEY, JSON.stringify(m)) }

export function exportSave(life: GameState | null, meta: MetaProfile): string {
  return JSON.stringify({ app: 'navigating-adult-life', schemaVersion: SCHEMA_VERSION, life, meta })
}
export function importSave(text: string): { life: GameState | null; meta: MetaProfile } | null {
  try {
    const p = JSON.parse(text) as { app?: string; life: GameState | null; meta: MetaProfile }
    if (p.app !== 'navigating-adult-life' || !p.meta) return null
    return { life: p.life ?? null, meta: { ...defaultMeta(), ...p.meta } }
  } catch { return null }
}
