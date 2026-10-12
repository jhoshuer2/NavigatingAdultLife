// The big dream. The luck scroll rolls one at random (from the list for your city) and the whole life is about reaching it.
// Every dream is a path of steps. A step is done when its condition holds, steps are completed in order, and the last one
// finishes the dream. `verb` is what the guide tells you to do for that step (see GOALS in world/guide.ts).
import type { ConditionGroup, DreamId } from '@engine/core/types'

export type DreamVerb = 'study' | 'church' | 'hustle' | 'job' | 'work' | 'social' | 'fit' | 'shop' | 'save' | 'house' | 'family'
export interface DreamStage { title: string; verb: DreamVerb; when: ConditionGroup }
export interface DreamDef {
  id: DreamId
  city: 'lagos' | 'abuja' | 'old'
  name: string
  icon: string
  blurb: string
  target: string
  item?: string // the symbol of the dream, worn by your character (an entry in content/items.ts)
  stages: DreamStage[]
}

const all = (...c: NonNullable<ConditionGroup['all']>): ConditionGroup => ({ all: c })
const n = (key: string, v: number) => ({ flagAtLeast: [key, v] as [string, number] })
const rep = (v: number) => ({ stat: ['reputation', '>=', v] as ['reputation', '>=', number] })
const joy = (v: number) => ({ stat: ['happiness', '>=', v] as ['happiness', '>=', number] })
const fit = (v: number) => ({ stat: ['health', '>=', v] as ['health', '>=', number] })
const know = (v: number) => ({ stat: ['knowledge', '>=', v] as ['knowledge', '>=', number] })
const school: DreamStage = { title: 'Finish secondary school', verb: 'study', when: all({ credentialAtLeast: 'ssce' }) }

export const DREAMS: DreamDef[] = [
  // ---- Abuja ----
  { id: 'politician', city: 'abuja', name: 'Politician', icon: '🗳️', blurb: 'Win the people’s trust and a seat at the table.', target: 'Reputation 70, a degree and a campaign chest', item: 'dreamFila', stages: [
    school,
    { title: 'Join the community and be seen', verb: 'church', when: all(n('n_community', 4), rep(30)) },
    { title: 'Earn a university degree', verb: 'study', when: all({ credentialAtLeast: 'degree' }) },
    { title: 'Build your name at work', verb: 'work', when: all({ jobLevelAtLeast: 2 }, rep(52)) },
    { title: 'Raise your campaign money (₦5M)', verb: 'save', when: all({ cashAtLeast: 5000000 }) },
    { title: 'Win the people’s trust', verb: 'church', when: all(rep(68), n('n_community', 12)) },
  ] },
  { id: 'business', city: 'abuja', name: 'Business Person', icon: '💼', blurb: 'Build something of your own that pays you and others.', target: 'Savings of ₦8M and a proven hustle', item: 'dreamCase', stages: [
    school,
    { title: 'Start hustling at the market', verb: 'hustle', when: all(n('n_hustle', 4)) },
    { title: 'Learn on a real job', verb: 'job', when: all({ employed: true }) },
    { title: 'Save your seed money (₦1.5M)', verb: 'save', when: all({ cashAtLeast: 1500000 }) },
    { title: 'Grow your side income', verb: 'hustle', when: all(n('n_hustle', 12), { cashAtLeast: 4000000 }) },
    { title: 'Open your business (₦8M saved)', verb: 'save', when: all(n('n_hustle', 20), { cashAtLeast: 8000000 }) },
  ] },
  { id: 'nineToFiver', city: 'abuja', name: '9-5er', icon: '🕘', blurb: 'A steady job, a place of your own and evenings to yourself.', target: 'Job level 3, your own rent and a calm life', item: 'dreamLanyard', stages: [
    school,
    { title: 'Get a diploma or degree', verb: 'study', when: all({ credentialAtLeast: 'ond' }) },
    { title: 'Land a job', verb: 'job', when: all({ employed: true }) },
    { title: 'Get promoted to level 2', verb: 'work', when: all({ jobLevelAtLeast: 2 }) },
    { title: 'Rent your own place', verb: 'save', when: all({ any: [{ housing: 'rent' }, { housing: 'own' }] }, { cashAtLeast: 1000000 }) },
    { title: 'Level 3 with a calm life', verb: 'work', when: all({ jobLevelAtLeast: 3 }, joy(50), { stat: ['stress', '<=', 55] }) },
  ] },
  { id: 'creator', city: 'abuja', name: 'Content Creator', icon: '📱', blurb: 'Make people laugh, think and follow you.', target: 'Creative level 3 with a real following', item: 'dreamPhones', stages: [
    { title: 'Get your first smartphone', verb: 'shop', when: all({ hasItem: 'phone' }) },
    { title: 'Make friends and be seen', verb: 'social', when: all(n('n_socialise', 4), rep(25)) },
    { title: 'Land your first creative gig', verb: 'job', when: all({ track: 'creative' }) },
    { title: 'Become a gigging artist', verb: 'work', when: all({ track: 'creative' }, { jobLevelAtLeast: 2 }) },
    { title: 'Get a laptop for editing', verb: 'shop', when: all({ hasItem: 'laptop' }) },
    { title: 'Become a rising name', verb: 'work', when: all({ track: 'creative' }, { jobLevelAtLeast: 3 }, rep(40)) },
  ] },
  { id: 'degree', city: 'abuja', name: 'Degree Collector', icon: '🎓', blurb: 'Books, exams and certificates. Learning is the flex.', target: 'A degree and a brilliant mind', item: 'dreamGrad', stages: [
    school,
    { title: 'Study hard', verb: 'study', when: all(know(45)) },
    { title: 'Earn a diploma (OND)', verb: 'study', when: all({ credentialAtLeast: 'ond' }) },
    { title: 'Earn a university degree', verb: 'study', when: all({ credentialAtLeast: 'degree' }) },
    { title: 'Keep reading: sharpen your mind', verb: 'study', when: all({ credentialAtLeast: 'degree' }, know(75)) },
    { title: 'Master of knowledge', verb: 'study', when: all({ credentialAtLeast: 'degree' }, know(88), n('n_study', 25)) },
  ] },
  { id: 'unsureAbuja', city: 'abuja', name: 'I Never Know o', icon: '🤷', blurb: 'No big plan. Try things, meet people and see where life leads.', target: 'A good life: work, friends, peace of mind', item: 'dreamCompass', stages: [
    school,
    { title: 'Try things: hustle, hang out and join the community', verb: 'hustle', when: all(n('n_hustle', 2), n('n_socialise', 3), n('n_community', 2)) },
    { title: 'Find work', verb: 'job', when: all({ employed: true }) },
    { title: 'Be happy', verb: 'social', when: all(joy(62)) },
    { title: 'Be respected, with a real friend', verb: 'social', when: all(rep(40), { relAtLeast: ['friend', 60] }) },
    { title: 'Save a little (₦3M)', verb: 'save', when: all({ cashAtLeast: 3000000 }) },
  ] },
  // ---- Lagos ----
  { id: 'onile', city: 'lagos', name: 'Onile', icon: '🏠', blurb: 'Landlord. A house of your own and tenants who pay on time.', target: 'Own a house and ₦8M in the bank', item: 'dreamKeys', stages: [
    school,
    { title: 'Start hustling at the market', verb: 'hustle', when: all(n('n_hustle', 4)) },
    { title: 'Get a job', verb: 'job', when: all({ employed: true }) },
    { title: 'Save for land (₦6M)', verb: 'save', when: all({ cashAtLeast: 6000000 }) },
    { title: 'Buy land and build your house', verb: 'house', when: all({ housing: 'own' }) },
    { title: 'Be a landlord with ₦8M in the bank', verb: 'save', when: all({ housing: 'own' }, { cashAtLeast: 8000000 }) },
  ] },
  { id: 'lastma', city: 'lagos', name: 'LASTMA Officer', icon: '🦺', blurb: 'Keep Lagos moving: whistle, vest and zero nonsense at the junction.', target: 'Civil service level 3 and a fit body', item: 'dreamVest', stages: [
    school,
    { title: 'Get fit: exercise at the pitch', verb: 'fit', when: all(n('n_exercise', 3), fit(65)) },
    { title: 'Join the civil service', verb: 'job', when: all({ track: 'civil' }) },
    { title: 'Become an Officer (level 2)', verb: 'work', when: all({ track: 'civil' }, { jobLevelAtLeast: 2 }) },
    { title: 'Be respected in the community', verb: 'church', when: all(n('n_community', 4), rep(40)) },
    { title: 'Become a senior officer', verb: 'work', when: all({ track: 'civil' }, { any: [{ jobLevelAtLeast: 3 }, { stat: ['reputation', '>=', 55] }] }, { jobLevelAtLeast: 2 }, rep(45)) },
  ] },
  { id: 'governor', city: 'lagos', name: 'Governor', icon: '🏛️', blurb: 'Lead the state. Everybody has an opinion about you.', target: 'Reputation 70, a degree and a campaign chest', item: 'dreamFila', stages: [
    school,
    { title: 'Join the community and be seen', verb: 'church', when: all(n('n_community', 5), rep(30)) },
    { title: 'Earn a university degree', verb: 'study', when: all({ credentialAtLeast: 'degree' }) },
    { title: 'Build your name at work', verb: 'work', when: all({ jobLevelAtLeast: 2 }, rep(55)) },
    { title: 'Raise campaign money (₦8M)', verb: 'save', when: all({ cashAtLeast: 8000000 }) },
    { title: 'Win the people’s vote', verb: 'church', when: all(rep(70), n('n_community', 12), { jobLevelAtLeast: 3 }) },
  ] },
  { id: 'pastor', city: 'lagos', name: 'Pastor', icon: '⛪', blurb: 'Serve, preach and guide a congregation.', target: 'A life of service and respect', item: 'dreamCross', stages: [
    school,
    { title: 'Join the service every week', verb: 'church', when: all(n('n_community', 5)) },
    { title: 'Live well: be respected and at peace', verb: 'social', when: all(rep(35), joy(55)) },
    { title: 'Serve more: join 9 services', verb: 'church', when: all(n('n_community', 9)) },
    { title: 'Be close to your people', verb: 'family', when: all({ relAtLeast: ['friend', 60] }, { relAtLeast: ['mother', 55] }) },
    { title: 'Lead the congregation', verb: 'church', when: all(n('n_community', 16), rep(58)) },
  ] },
  { id: 'jobPerson', city: 'lagos', name: 'Job Person', icon: '💼', blurb: 'A proper job with a salary at the end of the month.', target: 'Job level 3 and some savings', item: 'dreamLanyard', stages: [
    school,
    { title: 'Get a diploma or degree', verb: 'study', when: all({ credentialAtLeast: 'ond' }) },
    { title: 'Land a job', verb: 'job', when: all({ employed: true }) },
    { title: 'Get promoted to level 2', verb: 'work', when: all({ jobLevelAtLeast: 2 }) },
    { title: 'Save a little (₦1.5M)', verb: 'save', when: all({ cashAtLeast: 1500000 }) },
    { title: 'Reach level 3', verb: 'work', when: all({ jobLevelAtLeast: 3 }) },
  ] },
  { id: 'unsureLagos', city: 'lagos', name: 'I no know o', icon: '🤷', blurb: 'No big plan. Try things, meet people and see where life leads.', target: 'A good life: work, friends, peace of mind', item: 'dreamCompass', stages: [
    school,
    { title: 'Try things: hustle, hang out and join the community', verb: 'hustle', when: all(n('n_hustle', 2), n('n_socialise', 3), n('n_community', 2)) },
    { title: 'Find work', verb: 'job', when: all({ employed: true }) },
    { title: 'Be happy', verb: 'social', when: all(joy(62)) },
    { title: 'Be respected, with a real friend', verb: 'social', when: all(rep(40), { relAtLeast: ['friend', 60] }) },
    { title: 'Save a little (₦3M)', verb: 'save', when: all({ cashAtLeast: 3000000 }) },
  ] },
  // ---- dreams from older saves (not offered any more; they keep their old goals) ----
  { id: 'bigOga', city: 'old', name: 'Big Oga', icon: '🏢', blurb: 'Reach the top level of any career.', target: 'Career level 4', stages: [] },
  { id: 'propertyOwner', city: 'old', name: 'Property Owner', icon: '🏡', blurb: 'Own your own home and build serious wealth.', target: 'A home of your own and ₦15,000,000 in cash', stages: [] },
  { id: 'star', city: 'old', name: 'Entertainment Star', icon: '🎤', blurb: 'Music, Nollywood, content.', target: 'Creative track level 4', stages: [] },
  { id: 'padi', city: 'old', name: "Everybody's Padi", icon: '🤝', blurb: 'Be the friend everyone calls first.', target: 'Reputation 70 and 4 relationships at 80+', stages: [] },
  { id: 'unicorn', city: 'old', name: 'Unicorn Founder', icon: '🦄', blurb: 'Build the startup that gets funded.', target: 'Tech career level 4 with your startup funded', stages: [] },
]
export const DREAM_BY_ID = Object.fromEntries(DREAMS.map((d) => [d.id, d])) as Record<DreamId, DreamDef>
/** The dreams the luck scroll can roll in a city. */
export const dreamsFor = (city: 'lagos' | 'abuja'): DreamDef[] => DREAMS.filter((d) => d.city === city)
