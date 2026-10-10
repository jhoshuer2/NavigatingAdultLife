import type { GameState, NpcRole } from '../core/types'
import { fmtNaira } from '../core/helpers'

const ROLE_TOKENS: NpcRole[] = ['mother', 'father', 'sibling', 'friend', 'friend2', 'partner', 'boss', 'rival', 'neighbour', 'mentor', 'colleague']

export function fillText(s: GameState, text: string): string {
  const c = s.character
  const m = c.gender === 'male'
  const map: Record<string, string> = {
    name: c.nickname || c.name,
    they: m ? 'he' : 'she', They: m ? 'He' : 'She',
    their: m ? 'his' : 'her', Their: m ? 'His' : 'Her',
    them: m ? 'him' : 'her', Them: m ? 'Him' : 'Her',
    cash: fmtNaira(c.stats.cash), age: String(c.age),
    lost: String(s.flags.lostName ?? 'someone close'),
    lostRole: String(s.flags.lostRole ?? 'relative'),
    track: String(c.job?.title ?? 'job'),
    spouse: s.npcs[c.spouseId ?? '']?.name ?? 'your spouse',
    child: s.npcs[c.childrenIds[0] ?? '']?.name ?? 'your child',
    hall: 'campus',
  }
  for (const r of ROLE_TOKENS) map[r] = s.npcs[s.roles[r] ?? '']?.name ?? ({ mother: 'Mama', father: 'Papa', sibling: 'your sibling', friend: 'your friend', friend2: 'your other friend', partner: 'your partner', boss: 'your boss', rival: 'a rival', neighbour: 'the neighbour', mentor: 'your mentor', colleague: 'a colleague' } as Record<string, string>)[r]
  return text.replace(/\{(\w+)\}/g, (_, k: string) => map[k] ?? `{${k}}`)
}
