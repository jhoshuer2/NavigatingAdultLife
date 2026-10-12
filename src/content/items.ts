import type { Effect } from '@engine/core/types'

/** What a character visibly wears or carries (3D world and portrait). */
export type Wear = 'chain' | 'badge' | 'pouch' | 'scarf' | 'glasses' | 'backpack' | 'cap' | 'fila' | 'case' | 'headphones' | 'gradcap' | 'keys' | 'vest' | 'cross'

export interface ItemDef {
  id: string
  name: string
  icon: string
  desc: string
  price: number
  minAge: number
  effects?: Effect[]
  appliance?: boolean
  heirloom?: boolean // handed to you by the luck scroll, never sold in the market
  wear?: Wear[]
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
  // Heirlooms: one comes with every luck-scroll result. They are on your character from the first day and they work.
  { id: 'goldChain', name: 'Grandpa’s gold chain', icon: '📿', desc: 'Old money shows. People take you more seriously.', price: 0, minAge: 0, heirloom: true, wear: ['chain'], passive: { yearlyRep: 1, hireBonus: 2 } },
  { id: 'idBadge', name: 'Federal ID lanyard', icon: '🪪', desc: 'Your parent’s name opens doors. Interviews go easier.', price: 0, minAge: 0, heirloom: true, wear: ['badge'], passive: { hireBonus: 4, examBonus: 2 } },
  { id: 'coinPouch', name: 'Mama’s coin pouch', icon: '👝', desc: 'Every kobo counts. Your side hustles pay more.', price: 0, minAge: 0, heirloom: true, wear: ['pouch'], passive: { hustleMult: 1.15 } },
  { id: 'familyScarf', name: 'Mama’s ankara scarf', icon: '🧣', desc: 'Seven people, one scarf, plenty of love. Happier every year.', price: 0, minAge: 0, heirloom: true, wear: ['scarf'], passive: { yearlyHappiness: 2 } },
  { id: 'scholarKit', name: 'Teacher’s backpack and glasses', icon: '🎒', desc: 'A teacher believed in you. You study and write exams better.', price: 0, minAge: 0, heirloom: true, wear: ['backpack', 'glasses'], passive: { studyBonus: 2, examBonus: 4 } },
  { id: 'cousinCap', name: 'Cousin’s cap from abroad', icon: '🧢', desc: 'A little of the world on your head. Good vibes, better hiring odds.', price: 0, minAge: 0, heirloom: true, wear: ['cap'], passive: { yearlyHappiness: 1, hireBonus: 3 } },
  // Dream symbols: the luck scroll rolls your dream and gives you its symbol. They are worn and they help.
  { id: 'dreamFila', name: 'The politician’s fila', icon: '🧢', desc: 'Looks like a leader. People listen to you a little more.', price: 0, minAge: 0, heirloom: true, wear: ['fila'], passive: { yearlyRep: 1, hireBonus: 2 } },
  { id: 'dreamCase', name: 'The business briefcase', icon: '💼', desc: 'Deals go better with a briefcase. Side hustles pay more.', price: 0, minAge: 0, heirloom: true, wear: ['case'], passive: { hustleMult: 1.15, hireBonus: 2 } },
  { id: 'dreamLanyard', name: 'The staff lanyard', icon: '🪪', desc: 'A proper job is waiting. Interviews go easier.', price: 0, minAge: 0, heirloom: true, wear: ['badge'], passive: { hireBonus: 4 } },
  { id: 'dreamPhones', name: 'The creator’s headphones', icon: '🎧', desc: 'Always creating. A little happier every year.', price: 0, minAge: 0, heirloom: true, wear: ['headphones'], passive: { yearlyHappiness: 2 } },
  { id: 'dreamGrad', name: 'The graduate’s cap', icon: '🎓', desc: 'Books stick better. You study and write exams well.', price: 0, minAge: 0, heirloom: true, wear: ['gradcap'], passive: { studyBonus: 2, examBonus: 4 } },
  { id: 'dreamCompass', name: 'The traveller’s cap', icon: '🧭', desc: 'No plan, no problem. You adapt and stay cheerful.', price: 0, minAge: 0, heirloom: true, wear: ['cap'], passive: { yearlyHappiness: 2, hireBonus: 1 } },
  { id: 'dreamKeys', name: 'The landlord’s keys', icon: '🗝️', desc: 'One day these keys will open your own doors.', price: 0, minAge: 0, heirloom: true, wear: ['keys'], passive: { yearlyRep: 1, hustleMult: 1.1 } },
  { id: 'dreamVest', name: 'The reflective vest', icon: '🦺', desc: 'Respect at the junction. Civil service hiring goes better.', price: 0, minAge: 0, heirloom: true, wear: ['vest'], passive: { hireBonus: 4, yearlyRep: 1 } },
  { id: 'dreamCross', name: 'The pastor’s cross', icon: '✝️', desc: 'Peace and purpose. Happier and calmer every year.', price: 0, minAge: 0, heirloom: true, wear: ['cross'], passive: { yearlyHappiness: 1, yearlyStress: -1, yearlyRep: 1 } },
]
export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]))

/** Everything the character visibly wears, from the items they own. */
export const wearOf = (items: string[]): Wear[] => items.flatMap((i) => ITEM_BY_ID[i]?.wear ?? [])
