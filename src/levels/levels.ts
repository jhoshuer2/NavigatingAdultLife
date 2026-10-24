import { LEVEL1 } from './chapter1'
import { LEVEL_C2L1 } from './chapter2'
import type { LevelDef } from './schema'

/** Every level that exists, by id. */
export const LEVELS: Record<string, LevelDef> = { [LEVEL1.id]: LEVEL1, [LEVEL_C2L1.id]: LEVEL_C2L1 }
