// Playtest feedback ("Flag this"): content id + note, stored locally and exportable (PRD 16.3 H).
const KEY = 'nal.feedback.v1'
export interface Flag { at: number; contentId: string; kind: 'event' | 'activity' | 'other'; age: number; note: string; build: string }

export const BUILD = 'm1-playtest'
export function loadFlags(): Flag[] { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Flag[] } catch { return [] } }
export function addFlag(f: Omit<Flag, 'at' | 'build'>): Flag[] {
  const all = [...loadFlags(), { ...f, at: Date.now(), build: BUILD }]
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* storage full or blocked */ }
  return all
}
export function clearFlags() { try { localStorage.removeItem(KEY) } catch { /* ignore */ } }
export function exportFlags(): string { return JSON.stringify(loadFlags(), null, 2) }
