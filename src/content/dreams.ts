import type { DreamId } from '@engine/core/types'

export interface DreamDef { id: DreamId; name: string; icon: string; blurb: string; target: string }

export const DREAMS: DreamDef[] = [
  { id: 'bigOga', name: 'Big Oga', icon: '🏢', blurb: 'Reach the top level of any career.', target: 'Career level 4' },
  { id: 'propertyOwner', name: 'Property Owner', icon: '🏡', blurb: 'Own your own home and build serious wealth.', target: 'A home of your own and ₦15,000,000 in cash' },
  { id: 'star', name: 'Entertainment Star', icon: '🎤', blurb: 'Music, Nollywood, content: make the whole country know your name.', target: 'Creative track level 4' },
  { id: 'padi', name: "Everybody's Padi", icon: '🤝', blurb: 'Be the friend, cousin and neighbour everyone calls first.', target: 'Reputation 70 and 4 relationships at 80+' },
  { id: 'unicorn', name: 'Unicorn Founder', icon: '🦄', blurb: 'Build the startup that gets funded and makes headlines.', target: 'Tech career level 4 with your startup funded' },
]
export const DREAM_BY_ID = Object.fromEntries(DREAMS.map((d) => [d.id, d])) as Record<DreamId, DreamDef>
