import type { Effect } from '@engine/core/types'

export interface ItemDef {
  id: string
  name: string
  icon: string
  desc: string
  price: number
  minAge: number
  effects?: Effect[]
  appliance?: boolean
  light?: boolean // light enough to carry home yourself
  passive?: { studyBonus?: number; hustleMult?: number; hireBonus?: number; yearlyHappiness?: number; yearlyStress?: number; yearlyRep?: number; examBonus?: number }
}

export const ITEMS: ItemDef[] = [
  { id: 'schoolBag', name: 'Good school bag', icon: '🎒', desc: 'Books stay dry. Study works a bit better.', price: 25000, minAge: 6, passive: { studyBonus: 1 }, effects: [{ stat: 'happiness', delta: 2 }] },
  { id: 'textbooks', name: 'Past questions & textbooks', icon: '📖', desc: 'Exam prep that actually matches the exam.', price: 45000, minAge: 12, passive: { examBonus: 6, studyBonus: 1 } },
  { id: 'phone', name: 'Smartphone', icon: '📱', desc: 'Jobs, gist and distractions. Helps you get hired.', price: 180000, minAge: 14, passive: { hireBonus: 4, yearlyHappiness: 1 } },
  { id: 'laptop', name: 'Laptop', icon: '💻', desc: 'Study, freelance, build. A serious tool.', price: 650000, minAge: 16, passive: { studyBonus: 1, hireBonus: 5, hustleMult: 1.15 } },
  { id: 'smartClothes', name: 'Sharp outfit', icon: '👔', desc: 'People treat you differently. They really do.', price: 120000, minAge: 14, passive: { yearlyRep: 1, hireBonus: 3 }, effects: [{ stat: 'reputation', delta: 3 }] },
  { id: 'generator', name: 'Small generator', icon: '⚙️', desc: 'NEPA stress hurts less. Fuel is another story.', price: 300000, minAge: 18, passive: { yearlyStress: -2 }, effects: [{ stat: 'stress', delta: -4 }] },
  { id: 'sewing', name: 'Sewing machine / toolkit', icon: '🧵', desc: 'Tools of the trade. Side hustles pay more.', price: 220000, minAge: 14, passive: { hustleMult: 1.25 } },
  { id: 'instrument', name: 'Mic & keyboard', icon: '🎹', desc: 'Make music. The neighbours may disagree.', price: 280000, minAge: 14, passive: { yearlyHappiness: 2 }, effects: [{ stat: 'happiness', delta: 3 }] },
  { id: 'bike', name: 'Bicycle', icon: '🚲', desc: 'Free transport, free exercise.', price: 90000, minAge: 8, passive: { yearlyHappiness: 1 }, effects: [{ stat: 'health', delta: 3 }] },
  { id: 'tv', name: 'Flat-screen TV', icon: '📺', desc: 'Football, Nollywood and the news you cannot fix. Needs delivery.', price: 280000, minAge: 14, appliance: true, passive: { yearlyHappiness: 1 } },
  { id: 'fridge', name: 'Fridge-freezer', icon: '🧊', desc: 'Cold water and food that lasts. Needs a loader.', price: 450000, minAge: 16, appliance: true, passive: { yearlyStress: -1 } },
  { id: 'fan', name: 'Standing fan', icon: '🌀', desc: 'Survive the heat. Light enough to carry home.', price: 45000, minAge: 12, appliance: true, light: true, passive: { yearlyStress: -1 } },
  { id: 'ac', name: 'Air conditioner', icon: '❄️', desc: 'Cool nights, hot electricity bills. Needs a loader.', price: 550000, minAge: 18, appliance: true, passive: { yearlyStress: -2 } },
  { id: 'medCover', name: 'Health plan (HMO)', icon: '🩺', desc: 'Hospital bills hurt less for the rest of your life.', price: 250000, minAge: 18, effects: [{ stat: 'health', delta: 4 }] },
]
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]))
