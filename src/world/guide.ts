// "What should I do next?" suggestions and place/NPC rules for the world view. Pure helpers over GameState.
import type { GameState, NpcRole } from '@engine/core/types'
import type { PlaceId } from './layout'

export interface Suggestion { place: PlaceId; text: string; icon: string }

export function suggest(life: GameState): Suggestion | null {
  if (life.phase !== 'action' || life.quiz) return null
  const c = life.character
  const used = (id: string) => Number(life.activityCounts[id] ?? 0)
  const inSchool = c.edu.level !== 'none'
  if (c.stats.energy < 12) return { place: 'home', icon: '🌙', text: "You are worn out. Head home and sleep to end the year." }
  if (c.stats.health < 40) return { place: 'home', icon: '❤️', text: 'You are not feeling well. Rest at home.' }
  if (c.stats.happiness < 35) return { place: 'mamaput', icon: '🍲', text: 'Your mood is low. Hang with a friend at the buka.' }
  if (c.stats.stress > 70) return { place: 'pitch', icon: '⚽', text: 'Stress is high. Burn it off at the pitch.' }
  if (inSchool && used('study') < 2) return { place: 'school', icon: '📚', text: 'Study at school: pop quizzes grow your Knowledge.' }
  if (!c.job && !inSchool && c.age >= 18 && c.age < 62) return { place: 'jobcentre', icon: '📝', text: 'You need work. Visit the Job Centre.' }
  if (c.job && used('overtime') < 1 && c.age < 60) return { place: 'office', icon: '⏰', text: 'Impress the boss: work harder at your workplace.' }
  if (c.age >= 14 && used('hustle') < 1 && c.stats.energy >= 22) return { place: 'market', icon: '🛍️', text: 'Make a little money: do a side hustle at the market.' }
  if (c.age < 14 && used('play') < 1) return { place: 'pitch', icon: '⚽', text: 'Go and play outside!' }
  if (used('socialise') < 1 && c.stats.energy >= 15) return { place: 'mamaput', icon: '🧑‍🤝‍🧑', text: 'Catch up with a friend at the buka.' }
  if (used('familyTime') < 1) return { place: 'home', icon: '👪', text: 'Spend time with your family at home.' }
  return { place: 'home', icon: '🌙', text: 'You have done enough. Sleep at home to end the year.' }
}

/** Where each persistent NPC stands in the district. */
export function npcSpot(role: NpcRole): { x: number; z: number } | null {
  switch (role) {
    case 'mother': return { x: -22.5, z: -6.4 }
    case 'father': return { x: -14.5, z: -6.6 }
    case 'sibling': return { x: -18.5, z: -4.6 }
    case 'child': return { x: -23, z: -4.2 }
    case 'friend': return { x: 36.2, z: 7.4 }
    case 'friend2': return { x: -35.5, z: -25.5 }
    case 'partner': return { x: 23.5, z: 7.4 }
    case 'boss': return { x: -16.8, z: 9.2 }
    default: return null
  }
}

export function placeActive(life: GameState, id: PlaceId): boolean {
  const c = life.character
  const inSchool = c.edu.level !== 'none'
  switch (id) {
    case 'office': return !!c.job
    case 'jobcentre': return !c.job && !inSchool && c.age >= 18 && c.age < 62
    case 'school': return true
    default: return true
  }
}

export function placeNote(life: GameState, id: PlaceId): string | null {
  const c = life.character
  const inSchool = c.edu.level !== 'none'
  if (id === 'office' && !c.job) return "You don't work here. If you are looking for a job, try the Job Centre."
  if (id === 'jobcentre') { if (c.job) return 'You already have a job. Come back if you lose it or want to switch.'; if (inSchool) return 'Finish school first. The desk clerk says: "Come back with your certificate."'; if (c.age < 18) return 'Too young to apply. Come back at 18.'; if (c.age >= 62) return 'Time to enjoy retirement.' }
  return null
}
