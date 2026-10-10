import type { ConditionGroup, Effect } from '@engine/core/types'

export interface QuestDef {
  id: string
  title: string
  stages: { text: string; when: ConditionGroup }[]
  reward: Effect[]
  cowries: number
  rewardText: string
}

export const QUESTS: QuestDef[] = [
  { id: 'q_waec', title: 'Pass your exams', stages: [{ text: 'Get to secondary school', when: { all: [{ ageBetween: [12, 120] }] } }, { text: 'Pass WAEC/NECO and JAMB', when: { all: [{ flag: 'examPassed' }] } }], reward: [{ stat: 'happiness', delta: 6 }, { stat: 'reputation', delta: 4 }], cowries: 4, rewardText: 'Your family throws a small party.' },
  { id: 'q_path', title: 'Choose your path', stages: [{ text: 'Decide what comes after school', when: { all: [{ flag: 'pathChosen' }] } }], reward: [{ stat: 'happiness', delta: 4 }], cowries: 2, rewardText: 'A path, at last.' },
  { id: 'q_dash', title: 'Hit the road', stages: [{ text: 'Play Go-Slow Dash', when: { all: [{ flag: 'dashPlayed' }] } }, { text: 'Run 500 m in one go', when: { all: [{ flag: 'dash500' }] } }], reward: [{ hustleIncome: 100000 }, { stat: 'health', delta: 3 }], cowries: 4, rewardText: 'A passenger tips you big.' },
  { id: 'q_friends', title: 'Real padis', stages: [{ text: 'Get close to your best friend (60+)', when: { all: [{ relAtLeast: ['friend', 60] }] } }, { text: 'Get close to a second friend (60+)', when: { all: [{ relAtLeast: ['friend2', 60] }] } }], reward: [{ stat: 'happiness', delta: 6 }, { stat: 'reputation', delta: 3 }], cowries: 4, rewardText: 'Friends who show up. Rare.' },
  { id: 'q_job', title: 'First salary', stages: [{ text: 'Get your first job', when: { all: [{ flag: 'hasWorked' }] } }], reward: [{ stat: 'cash', delta: 150000 }, { stat: 'happiness', delta: 5 }], cowries: 4, rewardText: 'Welcome gift from the office.' },
  { id: 'q_save', title: 'Save a million', stages: [{ text: 'Hold ₦1,000,000 in cash', when: { all: [{ cashAtLeast: 1000000 }] } }], reward: [{ stat: 'reputation', delta: 3 }, { stat: 'stress', delta: -4 }], cowries: 4, rewardText: 'A comforting number to look at.' },
  { id: 'q_promo', title: 'Climb the ladder', stages: [{ text: 'Get promoted', when: { all: [{ flag: 'promoted' }] } }], reward: [{ stat: 'cash', delta: 250000 }, { stat: 'reputation', delta: 4 }], cowries: 5, rewardText: 'Congratulations alert!' },
  { id: 'q_love', title: 'Love and wedding', stages: [{ text: 'Find a partner', when: { all: [{ hasPartner: true }] } }, { text: 'Get married', when: { all: [{ married: true }] } }], reward: [{ stat: 'happiness', delta: 8 }, { stat: 'reputation', delta: 5 }], cowries: 6, rewardText: 'Aso-ebi for the whole street.' },
]
