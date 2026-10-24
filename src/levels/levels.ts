import { LEVEL1 } from './chapter1'
import { LEVEL_C2L1, LEVEL_C2L2, LEVEL_C2L3 } from './chapter2'
import { LEVEL_C1L2, LEVEL_C1L3, LEVEL_C1L4, LEVEL_C1L5, LEVEL_C1L6, LEVEL_C1L7, LEVEL_C1L8, LEVEL_C1L9 } from './chapter1b'
import type { LevelDef } from './schema'

/** Every level that exists, by id. */
export const LEVELS: Record<string, LevelDef> = { [LEVEL1.id]: LEVEL1, ...Object.fromEntries([LEVEL_C1L2, LEVEL_C1L3, LEVEL_C1L4, LEVEL_C1L5, LEVEL_C1L6, LEVEL_C1L7, LEVEL_C1L8, LEVEL_C1L9].map((l) => [l.id, l])), [LEVEL_C2L1.id]: LEVEL_C2L1, [LEVEL_C2L2.id]: LEVEL_C2L2, [LEVEL_C2L3.id]: LEVEL_C2L3 }
