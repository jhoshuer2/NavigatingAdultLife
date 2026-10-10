import type { ConditionGroup } from '@engine/core/types'

export interface AchievementDef { id: string; title: string; desc: string; icon: string; cowries: number; hidden?: boolean; when: ConditionGroup }

const RAW: AchievementDef[] = [
  { id: 'first_dash', title: 'Oya Go!', desc: 'Play Go-Slow Dash for the first time.', icon: '🏃', cowries: 3, when: { all: [{ flag: 'dashPlayed' }] } },
  { id: 'dash_500', title: 'Five Hundred Meters of Wahala', desc: 'Run 500 m in a single Dash.', icon: '🛣️', cowries: 5, when: { all: [{ flag: 'dash500' }] } },
  { id: 'dash_1500', title: 'Danfo Legend', desc: 'Run 1,500 m in a single Dash.', icon: '🚌', cowries: 12, when: { all: [{ flag: 'dash1500' }] } },
  { id: 'waec', title: 'WAEC Warrior', desc: 'Pass your secondary school exams.', icon: '📜', cowries: 5, when: { all: [{ flag: 'examPassed' }] } },
  { id: 'distinction', title: 'Distinction!', desc: 'Score a distinction in your final exams.', icon: '🌟', cowries: 8, when: { all: [{ flagEq: ['examResult', 'distinction'] }] } },
  { id: 'first_class', title: 'First Class Honours', desc: 'Graduate with a first class degree.', icon: '🎓', cowries: 15, when: { all: [{ flag: 'firstClass' }] } },
  { id: 'scholar', title: 'Big Brain', desc: 'Reach 90 Knowledge.', icon: '🧠', cowries: 10, when: { all: [{ stat: ['knowledge', '>=', 90] }] } },
  { id: 'first_job', title: 'First Salary Alert', desc: 'Get your first job.', icon: '💵', cowries: 5, when: { all: [{ flag: 'hasWorked' }] } },
  { id: 'promoted', title: 'Moving Up', desc: 'Get promoted.', icon: '📈', cowries: 6, when: { all: [{ flag: 'promoted' }] } },
  { id: 'oga_top', title: 'Oga At The Top', desc: 'Reach level 4 in any career.', icon: '👑', cowries: 15, when: { all: [{ jobLevelAtLeast: 4 }] } },
  { id: 'master', title: 'Master Craftsperson', desc: 'Reach the top of the Trade track.', icon: '🛠️', cowries: 12, when: { all: [{ track: 'trade' }, { jobLevelAtLeast: 4 }] } },
  { id: 'eight_digits', title: 'Nine Figures', desc: 'Hold ₦100,000,000 in cash.', icon: '💰', cowries: 10, when: { all: [{ cashAtLeast: 100000000 }] } },
  { id: 'rags', title: 'Rags to Riches', desc: 'Start in a struggling family and reach ₦100,000,000.', icon: '✨', cowries: 20, hidden: true, when: { all: [{ tier: 'struggling' }, { cashAtLeast: 100000000 }] } },
  { id: 'debt_free', title: 'Debt Free', desc: 'Get out of debt and hold ₦1,000,000.', icon: '🧾', cowries: 6, when: { all: [{ flag: 'wasInDebt' }, { cashAtLeast: 1000000 }] } },
  { id: 'married', title: 'Wedding Bells', desc: 'Get married.', icon: '💍', cowries: 8, when: { all: [{ married: true }] } },
  { id: 'parent', title: 'Parent Era', desc: 'Have a child.', icon: '👶', cowries: 6, when: { all: [{ hasChildren: true }] } },
  { id: 'mama', title: "Mama's Favourite", desc: 'Reach 90 closeness with your mother.', icon: '❤️', cowries: 6, when: { all: [{ relAtLeast: ['mother', 90] }] } },
  { id: 'black_tax', title: 'Black Tax Champion', desc: 'Help family with money five times.', icon: '🤲', cowries: 8, when: { all: [{ flagAtLeast: ['blackTaxPaid', 5] }] } },
  { id: 'hustle_master', title: 'Serial Hustler', desc: 'Do your side hustle 10 times in one life.', icon: '🛍️', cowries: 8, when: { all: [{ flagAtLeast: ['hustleCount', 10] }] } },
  { id: 'owambe_legend', title: 'Legendary Sprayer', desc: 'Spray money big at an owambe.', icon: '🎉', cowries: 6, hidden: true, when: { all: [{ flag: 'legendarySprayer' }] } },
  { id: 'jollof_judge', title: 'Jollof Judge', desc: 'Survive a jollof argument without losing a friend.', icon: '🍚', cowries: 4, hidden: true, when: { all: [{ flag: 'jollofJudge' }] } },
  { id: 'harmattan', title: 'Harmattan Survivor', desc: 'Live through a Harmattan with your lips intact.', icon: '🌫️', cowries: 4, hidden: true, when: { all: [{ flag: 'harmattanSurvivor' }] } },
  { id: 'generator', title: 'Light Don Come', desc: 'Buy a generator.', icon: '💡', cowries: 3, when: { all: [{ hasItem: 'generator' }] } },
  { id: 'elder', title: 'Respected Elder', desc: 'Reach age 60.', icon: '🧓', cowries: 6, when: { all: [{ ageBetween: [60, 120] }] } },
  { id: 'octo', title: 'Long Life, Long Gist', desc: 'Reach age 80.', icon: '🎂', cowries: 12, when: { all: [{ ageBetween: [80, 120] }] } },
  { id: 'dream', title: 'Dream Achieved', desc: 'Achieve your Dream.', icon: '🌠', cowries: 20, when: { all: [{ dreamDone: true }] } },
]
// Cowries are scaled down so a first life earns roughly 25-50 and unlocks take several lives.
export const ACHIEVEMENTS: AchievementDef[] = RAW.map((a) => ({ ...a, cowries: Math.max(1, Math.round(a.cowries / 2)) }))
export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
