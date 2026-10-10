import type { GameState, Gender, Heritage, NPC, NpcRole } from '../core/types'
import type { Ctx } from './ctx'
import { NAME_POOLS } from '@content/names'

function pickName(ctx: Ctx, gender: Gender): string {
  const { s, rng } = ctx
  const used = new Set(Object.values(s.npcs).map((n) => n.name))
  used.add(s.character.name)
  const heritage: Heritage = rng.chance(0.75) ? s.character.heritage : rng.pick(['yoruba', 'igbo', 'hausa'] as Heritage[])
  const pool = NAME_POOLS[heritage][gender].filter((n) => !used.has(n))
  const fallback = NAME_POOLS.mix[gender].filter((n) => !used.has(n))
  return rng.pick(pool.length ? pool : fallback.length ? fallback : NAME_POOLS[heritage][gender])
}

const PEERS: NpcRole[] = ['friend', 'friend2', 'partner', 'rival', 'colleague', 'neighbour']

/** Age of an NPC relative to the player's current age. */
export function npcAge(s: GameState, n: NPC): number {
  return s.character.age - n.birthAge
}

let seq = 0

/**
 * Create an NPC and register it. `birthAge` is the player's age when the NPC was born
 * (negative for people older than the player).
 */
export function addNpc(ctx: Ctx, role: NpcRole, opts: { gender?: Gender; ageDiff?: number; closeness?: number } = {}): NPC {
  const { s, rng } = ctx
  const player = s.character
  const gender: Gender =
    opts.gender ??
    (role === 'mother' ? 'female' : role === 'father' ? 'male' : role === 'partner' ? (player.gender === 'male' ? 'female' : 'male') : rng.pick(['male', 'female'] as Gender[]))

  let birthAge: number
  if (PEERS.includes(role)) birthAge = -(opts.ageDiff ?? rng.int(-2, 3))
  else if (role === 'boss' || role === 'mentor') birthAge = -rng.int(8, 22)
  else if (role === 'child') birthAge = player.age
  else if (role === 'mother') birthAge = -rng.int(24, 33)
  else if (role === 'father') birthAge = -rng.int(27, 38)
  else birthAge = rng.int(-7, 5) // sibling

  const base = role === 'mother' || role === 'father' ? rng.int(55, 80) : role === 'sibling' ? rng.int(45, 70) : rng.int(35, 60)
  const npc: NPC = {
    id: `npc_${role}_${++seq}`,
    name: pickName(ctx, gender),
    gender,
    role,
    birthAge,
    alive: true,
    closeness: opts.closeness ?? base,
    contactedThisYear: false,
    memory: [],
  }
  s.npcs[npc.id] = npc
  if (role !== 'child') s.roles[role] = npc.id
  return npc
}
