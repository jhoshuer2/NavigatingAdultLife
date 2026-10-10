import type { StatKey, TraitId } from '@engine/core/types'

export interface TraitMods {
  gain?: Partial<Record<StatKey, number>> // multiplier on positive deltas
  loss?: Partial<Record<StatKey, number>> // multiplier on negative deltas
  hustleIncome?: number
  livingCost?: number
  maxEnergy?: number
  checkBonus?: number
  socialBonus?: number // extra closeness gain
  dashHearts?: number
}

export interface TraitDef {
  id: TraitId
  name: string
  icon: string
  perk: string
  downside: string
  mods: TraitMods
}

export const TRAITS: TraitDef[] = [
  { id: 'hustler', name: 'Hustler', icon: '💼', perk: 'Side hustles pay 25% more.', downside: 'Rest never feels restful (−1 Happiness from resting).', mods: { hustleIncome: 1.25 } },
  { id: 'bookworm', name: 'Bookworm', icon: '📚', perk: 'You learn 25% faster.', downside: 'Parties drain you (smaller Reputation gains).', mods: { gain: { knowledge: 1.25, reputation: 0.8 } } },
  { id: 'charmer', name: 'Smooth Talker', icon: '😏', perk: 'Reputation and friendships grow faster.', downside: 'Temptation finds you more often.', mods: { gain: { reputation: 1.25 }, socialBonus: 2 } },
  { id: 'streetSmart', name: 'Street-Smart', icon: '🧠', perk: 'Better odds on risky calls.', downside: 'School discipline is not your friend (−10% Knowledge gain).', mods: { checkBonus: 6, gain: { knowledge: 0.9 } } },
  { id: 'devout', name: 'Devout', icon: '🕊️', perk: 'Community and faith lift your mood; crises hurt less.', downside: 'Some shady options feel off-limits.', mods: { gain: { happiness: 1.1 }, loss: { happiness: 0.85, stress: 0.85 } } },
  { id: 'creative', name: 'Creative', icon: '🎨', perk: 'Creative careers open easier; art lifts Happiness.', downside: 'Corporate rules bore you.', mods: { gain: { happiness: 1.1 } } },
  { id: 'athletic', name: 'Gym Rat', icon: '🏋️', perk: 'Health recovers faster; stronger in Go-Slow Dash.', downside: 'Less patience for books (−10% Knowledge gain).', mods: { gain: { health: 1.4, knowledge: 0.9 }, dashHearts: 1 } },
  { id: 'frugal', name: 'Frugal', icon: '🪙', perk: 'Living costs 20% lower.', downside: 'People notice you never spray money (smaller Reputation gains).', mods: { livingCost: 0.8, gain: { reputation: 0.85 } } },
  { id: 'lucky', name: 'Lucky', icon: '🍀', perk: '+4 on every luck check.', downside: 'Success feels less earned (smaller Knowledge gain).', mods: { checkBonus: 4, gain: { knowledge: 0.95 } } },
  { id: 'anxious', name: 'Overthinker', icon: '😰', perk: 'You are prepared: crises cost less Energy.', downside: 'Lower baseline mood.', mods: { gain: { happiness: 0.9 }, loss: { energy: 0.9 } } },
  { id: 'foodie', name: 'Foodie', icon: '🍲', perk: 'Good food restores extra Energy and mood.', downside: 'Living costs 8% higher.', mods: { livingCost: 1.08, gain: { energy: 1.15 } } },
  { id: 'owambeSpirit', name: 'Owambe Spirit', icon: '🎉', perk: 'Celebrations give big Reputation and mood boosts.', downside: 'Always overspends on invitations.', mods: { gain: { reputation: 1.15, happiness: 1.1 }, livingCost: 1.05 } },
  { id: 'nightCrawler', name: 'Night Crawler', icon: '🌙', perk: 'Nightlife and creative events pay off.', downside: 'Mornings cost more Energy (−4 max Energy).', mods: { maxEnergy: -4, gain: { reputation: 1.1 } } },
  { id: 'musical', name: 'Musical', icon: '🎵', perk: 'Rhythm bonus in Go-Slow Dash; music lifts mood.', downside: 'Homework loses to headphones (−10% Knowledge gain).', mods: { gain: { happiness: 1.12, knowledge: 0.9 } } },
]

export const TRAIT_BY_ID = Object.fromEntries(TRAITS.map((t) => [t.id, t])) as Record<TraitId, TraitDef>
