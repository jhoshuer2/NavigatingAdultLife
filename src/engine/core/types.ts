// Pure engine types. No DOM, React or Three.js imports allowed in /engine.

export type LifeStage = 'child' | 'teen' | 'youngAdult' | 'adult' | 'elder'
export type Gender = 'male' | 'female'
export type Heritage = 'yoruba' | 'igbo' | 'hausa' | 'mix'
export type FamilyTier = 'struggling' | 'lowerMiddle' | 'middle' | 'comfortable'
export type SchoolType = 'public' | 'private' | 'federal'
export type Lifestyle = 'frugal' | 'normal' | 'baller'
export type StatKey = 'cash' | 'energy' | 'happiness' | 'knowledge' | 'reputation' | 'health' | 'stress'
export type EduLevel = 'primary' | 'jss' | 'sss' | 'none' | 'university' | 'polytechnic' | 'apprentice'
export type Credential = 'none' | 'primary' | 'ssce' | 'trade' | 'ond' | 'degree'
export type TrackId = 'trade' | 'civil' | 'corporate' | 'tech' | 'creative'
export type TraitId =
  | 'hustler' | 'bookworm' | 'charmer' | 'streetSmart' | 'devout' | 'creative' | 'athletic'
  | 'frugal' | 'lucky' | 'anxious' | 'foodie' | 'owambeSpirit' | 'nightCrawler' | 'musical'
export type DreamId =
  | 'politician' | 'business' | 'nineToFiver' | 'creator' | 'degree' | 'unsureAbuja' // Abuja
  | 'onile' | 'lastma' | 'governor' | 'pastor' | 'jobPerson' | 'unsureLagos' // Lagos
  | 'bigOga' | 'propertyOwner' | 'star' | 'padi' | 'unicorn' // older saves
export type NpcRole =
  | 'mother' | 'father' | 'sibling' | 'friend' | 'friend2' | 'partner' | 'boss' | 'rival'
  | 'neighbour' | 'child' | 'colleague' | 'mentor'
export type Tier = 'critSuccess' | 'success' | 'fail' | 'critFail'

export interface Stats {
  cash: number
  energy: number
  maxEnergy: number
  happiness: number
  knowledge: number
  reputation: number
  health: number
  stress: number
}

export interface Appearance {
  skinTone: number // 0..9
  faceShape: number // 0..3
  hairStyle: string
  hairColor: string
  facialHair?: string
  outfitType: string
  fabric: string
  topColor: string
  bottomColor: string
}

export interface NewLifeConfig {
  name: string
  nickname?: string
  gender: Gender
  heritage: Heritage
  appearance: Appearance
  traits: [TraitId, TraitId]
  dreamId: DreamId
  archetypeId: string
  homeId: string
  perkId?: string
}

export interface NPC {
  id: string
  name: string
  gender: Gender
  role: NpcRole
  birthAge: number // player's age when this NPC was born, negative if older (e.g. -28)
  alive: boolean
  closeness: number // 0..100
  contactedThisYear: boolean
  memory: { tag: string; age: number }[]
}

export interface JobState {
  trackId: TrackId
  level: number // 1..4
  years: number
  salary: number
  title: string
}

export interface EducationState {
  level: EduLevel
  yearsInLevel: number
  schoolType: SchoolType
  credential: Credential
  examResult?: 'distinction' | 'pass' | 'fail'
  studyPoints: number // study effort accumulated this year
  gpa: number // running knowledge average at tertiary, 0..100
}

export interface Character {
  id: string
  name: string
  nickname?: string
  gender: Gender
  heritage: Heritage
  familyTier: FamilyTier
  archetypeId: string
  dreamId: DreamId
  traits: TraitId[]
  appearance: Appearance
  age: number
  stats: Stats
  edu: EducationState
  job?: JobState
  lifestyle: Lifestyle
  housing: { type: 'family' | 'rent' | 'own'; tier: number; districtId: string }
  items: string[]
  childrenIds: string[]
  spouseId?: string
  hustleIncome: number
  dashCashouts: number
  perkIds: string[]
}

export type Effect =
  | { stat: StatKey; delta: number }
  | { flag: string; set: boolean | number | string }
  | { flagAdd: string; by: number }
  | { rel: NpcRole; delta: number }
  | { item: string }
  | { removeItem: string }
  | { job: { trackId: TrackId; level: number } | 'quit' | 'promote' | 'fire' }
  | { edu: EduLevel }
  | { credential: Credential }
  | { spawn: NpcRole }
  | { moment: string }
  | { schedule: { eventId: string; inYears: number } }
  | { lifestyle: Lifestyle }
  | { housing: { tier: number } }
  | { buyHome: true }
  | { school: SchoolType }
  | { resit: true }
  | { endPartner: true }
  | { marry: true }
  | { child: true }
  | { die: string }
  | { cowries: number }
  | { hustleIncome: number }

export type Condition =
  | { ageBetween: [number, number] }
  | { stage: LifeStage | LifeStage[] }
  | { flag: string }
  | { flagAbsent: string }
  | { flagEq: [string, boolean | number | string] }
  | { flagAtLeast: [string, number] }
  | { stat: [StatKey, '>=' | '<=', number] }
  | { cashAtLeast: number }
  | { cashBelow: number }
  | { inSchool: boolean }
  | { eduLevel: EduLevel | EduLevel[] }
  | { credentialAtLeast: Credential }
  | { employed: boolean }
  | { track: TrackId }
  | { jobLevelAtLeast: number }
  | { trait: TraitId }
  | { heritage: Heritage }
  | { city: 'lagos' | 'abuja' }
  | { tier: FamilyTier | FamilyTier[] }
  | { gender: Gender }
  | { married: boolean }
  | { hasChildren: boolean }
  | { hasPartner: boolean }
  | { hasItem: string }
  | { relAtLeast: [NpcRole, number] }
  | { roleAlive: [NpcRole, boolean] }
  | { seen: string }
  | { notSeen: string }
  | { housing: 'family' | 'rent' | 'own' }
  | { dream: DreamId }
  | { dreamDone: boolean }
  | { chance: number }
  | { any: Condition[] }

export interface ConditionGroup {
  all?: Condition[]
  any?: Condition[]
  not?: Condition[]
}

export interface Outcome {
  effects?: Effect[]
  text?: string
}

export interface Choice {
  id: string
  label: string
  hint?: string
  requires?: ConditionGroup
  cost?: { cash?: number; energy?: number }
  risk?: 'safe' | 'risky' | 'gamble'
  effects?: Effect[]
  check?: { stat: StatKey | 'hustle' | 'charm'; difficulty: number; luck?: boolean }
  outcomes?: Partial<Record<Tier, Outcome>>
  resultText?: string
}

export interface GameEvent {
  id: string
  title: string
  text: string
  tags?: string[]
  stage?: LifeStage[]
  weight: number
  cooldownYears?: number
  once?: boolean
  scripted?: boolean
  conditions?: ConditionGroup
  choices: Choice[]
  /** which NPC role to show a portrait for */
  who?: NpcRole
}

export interface ActivityDef {
  id: string
  label: string
  blurb: string
  icon: string
  stages: LifeStage[]
  cost: { energy: number; cash?: number }
  requires?: ConditionGroup
  effects?: Effect[]
  check?: { stat: StatKey | 'hustle' | 'charm'; difficulty: number }
  outcomes?: Partial<Record<Tier, Outcome>>
  special?: 'study' | 'dash' | 'applyJob' | 'socialise' | 'familyTime' | 'rest' | 'shop' | 'quitJob' | 'overtime' | 'chat' | 'tv' | 'meal' | 'groom'
  hidden?: boolean
  maxPerYear?: number
  scene?: string
}

export interface LogEntry {
  age: number
  kind: 'stat' | 'event' | 'activity' | 'system' | 'moment'
  text: string
  eventId?: string
  choiceId?: string
}

export interface Moment { age: number; text: string; weight: number }

export interface ActiveEvent {
  eventId: string
  /** resolved choice outcome shown after choosing */
  result?: { text: string; tier?: Tier; deltas: StatDelta[] }
}

export interface StatDelta { stat: StatKey | 'rel' | 'other'; delta: number; label: string }

export type Phase = 'action' | 'events' | 'summary' | 'ended'

export interface QuizQuestion {
  id: string
  q: string
  options: string[]
  answer: number
  subject: 'maths' | 'english' | 'science' | 'general' | 'ict'
  minAge: number
  maxAge: number
  funnyRight?: string
  funnyWrong?: string
}

export interface ActiveQuiz { questions: QuizQuestion[]; index: number; correct: number; gained: number }

export interface YearSummary {
  age: number
  headline: string
  income: number
  expenses: number
  lines: string[]
  deltas: StatDelta[]
  unlocked: string[]
}

export interface Ending {
  id: string
  title: string
  cause: string
  obituary: string
  legacy: number
  cowries: number
  topMoments: string[]
  netWorth: number
  dreamDone: boolean
  achievements: string[]
}

export interface GameState {
  schemaVersion: number
  seed: number
  rng: number
  startYear: number
  year: number
  character: Character
  npcs: Record<string, NPC>
  roles: Partial<Record<NpcRole, string>>
  flags: Record<string, boolean | number | string>
  eventQueue: string[]
  after: 'action' | 'summary'
  scheduled: { eventId: string; fireAge: number }[]
  eventHistory: Record<string, { lastAge: number; count: number }>
  quests: Record<string, { stage: number; done: boolean }>
  achievements: string[]
  log: LogEntry[]
  moments: Moment[]
  yearDeltas: StatDelta[]
  yearStartCash: number
  yearIncome: number
  yearExpenses: number
  yearLines: string[]
  phase: Phase
  activeEvent?: ActiveEvent
  quiz?: ActiveQuiz
  summary?: YearSummary
  ending?: Ending
  newUnlocks: string[]
  activityCounts: Record<string, number>
  avgHappiness: { sum: number; n: number }
  maxCash: number
  dreamDone: boolean
  dreamStage?: number // how many steps of the dream path are complete (older saves start at 0)
  dashBest: number
  cowriesEarnedLife: number
  lastAction?: { text: string; deltas: StatDelta[] }
  /** In-world time of day (a typical day within the year). Cosmetic and used for opening hours and sleep. */
  clock?: { hour: number; day: number }
}
