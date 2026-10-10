import type { Credential, TrackId } from '@engine/core/types'

export interface JobDef {
  trackId: TrackId
  level: number
  title: string
  salary: [number, number]
  energy: number
  stress: number
  minCredential: Credential
  minKnowledge: number
  minReputation: number
  promoteAt: number // performance needed to be promoted INTO next level
  minYears: number // years in this level before promotion
  layoffRisk: number
  hireDifficulty: number
}

export interface TrackDef { id: TrackId; name: string; icon: string; blurb: string; pension: number }

export const TRACKS: TrackDef[] = [
  { id: 'trade', name: 'Trade & Artisan', icon: '🧵', blurb: 'Tailor, mechanic, stylist: skill with your hands, your own workshop one day.', pension: 0 },
  { id: 'civil', name: 'Civil Service & Teaching', icon: '🏛️', blurb: 'Slow, stable, pension at the end.', pension: 0.4 },
  { id: 'corporate', name: 'Corporate', icon: '💼', blurb: 'Banks and telecoms: suits, targets and Monday meetings.', pension: 0.3 },
  { id: 'tech', name: 'Tech', icon: '💻', blurb: 'Code, support and startups. High variance, high ceiling.', pension: 0.05 },
  { id: 'creative', name: 'Creative', icon: '🎬', blurb: 'Music, Nollywood and content. Feast or famine.', pension: 0 },
]

const j = (trackId: TrackId, level: number, title: string, salary: [number, number], energy: number, stress: number, minCredential: Credential, minKnowledge: number, minReputation: number, promoteAt: number, minYears: number, layoffRisk: number, hireDifficulty: number): JobDef =>
  ({ trackId, level, title, salary, energy, stress, minCredential, minKnowledge, minReputation, promoteAt, minYears, layoffRisk, hireDifficulty })

export const JOBS: JobDef[] = [
  j('trade', 1, 'Apprentice', [300000, 700000], 35, 2, 'none', 0, 0, 42, 3, 0.01, 30),
  j('trade', 2, 'Journeyman', [900000, 1800000], 38, 3, 'trade', 0, 10, 52, 4, 0.02, 35),
  j('trade', 3, 'Workshop Owner', [2500000, 6000000], 42, 5, 'trade', 0, 25, 68, 6, 0.04, 40),
  j('trade', 4, 'Master & Trainer', [6000000, 14000000], 40, 4, 'trade', 0, 40, 100, 99, 0.02, 50),
  j('civil', 1, 'Junior Officer', [800000, 1400000], 30, 2, 'ssce', 25, 0, 42, 3, 0.005, 40),
  j('civil', 2, 'Officer', [1500000, 2600000], 32, 3, 'ssce', 30, 8, 52, 4, 0.005, 40),
  j('civil', 3, 'Principal Officer', [2800000, 5000000], 34, 4, 'ond', 40, 20, 68, 6, 0.005, 45),
  j('civil', 4, 'Director', [5500000, 11000000], 36, 6, 'degree', 50, 35, 100, 99, 0.005, 55),
  j('corporate', 1, 'Graduate Trainee', [1200000, 2200000], 38, 5, 'degree', 40, 5, 47, 2, 0.03, 50),
  j('corporate', 2, 'Analyst', [2500000, 4500000], 40, 6, 'degree', 45, 15, 58, 3, 0.04, 50),
  j('corporate', 3, 'Manager', [5000000, 10000000], 42, 8, 'degree', 55, 30, 74, 5, 0.05, 55),
  j('corporate', 4, 'Executive', [11000000, 30000000], 45, 10, 'degree', 65, 50, 100, 99, 0.04, 65),
  j('tech', 1, 'Junior Developer', [1400000, 2800000], 38, 5, 'ssce', 45, 0, 52, 2, 0.04, 48),
  j('tech', 2, 'Developer', [3000000, 6500000], 40, 6, 'ssce', 55, 10, 63, 3, 0.05, 52),
  j('tech', 3, 'Senior / Lead', [7000000, 15000000], 42, 8, 'ssce', 65, 25, 78, 5, 0.06, 58),
  j('tech', 4, 'CTO / Founder', [15000000, 60000000], 45, 10, 'ssce', 72, 40, 100, 99, 0.06, 65),
  j('creative', 1, 'Hopeful', [200000, 900000], 32, 3, 'none', 0, 8, 47, 2, 0.06, 38),
  j('creative', 2, 'Gigging Artist', [900000, 3000000], 36, 4, 'none', 0, 20, 60, 3, 0.07, 45),
  j('creative', 3, 'Rising Name', [3500000, 12000000], 40, 6, 'none', 0, 40, 75, 5, 0.08, 55),
  j('creative', 4, 'National Star', [14000000, 80000000], 44, 8, 'none', 0, 60, 100, 99, 0.06, 65),
]
export const jobFor = (trackId: TrackId, level: number) => JOBS.find((x) => x.trackId === trackId && x.level === level)
