import type { ActivityDef } from '@engine/core/types'

const ALL = ['child', 'teen', 'youngAdult', 'adult', 'elder'] as const
const YOUNG = ['child', 'teen'] as const
const SCHOOLISH = ['child', 'teen', 'youngAdult'] as const
const GROWN = ['youngAdult', 'adult', 'elder'] as const

export const ACTIVITIES: ActivityDef[] = [
  { id: 'study', label: 'Study', blurb: 'Pop quiz time. Right answers grow your brain.', icon: '📚', stages: [...ALL], cost: { energy: 20 }, special: 'study', maxPerYear: 2, scene: 'school' },
  {
    id: 'play', label: 'Play outside', blurb: 'Football, ludo, and shouting until your mother calls.', icon: '⚽', stages: [...YOUNG], cost: { energy: 12 },
    effects: [{ stat: 'happiness', delta: 6 }, { stat: 'health', delta: 3 }, { stat: 'stress', delta: -4 }], scene: 'compound',
  },
  {
    id: 'chores', label: 'Help at home', blurb: 'Sweep, fetch water, run errands. Elders notice.', icon: '🧹', stages: [...YOUNG], cost: { energy: 10 },
    effects: [{ stat: 'reputation', delta: 2 }, { stat: 'happiness', delta: -1 }, { rel: 'mother', delta: 3 }], scene: 'home',
  },
  {
    id: 'hustle', label: 'Side hustle', blurb: 'Sell, repair, tutor, deliver. Small money, real lessons.', icon: '🛍️', stages: ['teen', 'youngAdult', 'adult', 'elder'], cost: { energy: 22 },
    check: { stat: 'hustle', difficulty: 40 },
    outcomes: {
      critSuccess: { effects: [{ hustleIncome: 220000 }, { stat: 'reputation', delta: 2 }], text: 'A big customer pays double and tells everyone.' },
      success: { effects: [{ hustleIncome: 120000 }], text: 'A solid day at the market.' },
      fail: { effects: [{ hustleIncome: 35000 }, { stat: 'stress', delta: 3 }], text: 'Slow sales. You still ate.' },
      critFail: { effects: [{ hustleIncome: -20000 }, { stat: 'stress', delta: 6 }], text: 'Stock spoiled and a customer ran off without paying.' },
    },
    scene: 'market',
  },
  { id: 'socialise', label: 'Hang with a friend', blurb: 'Gist, suya, and doing nothing together.', icon: '🧑‍🤝‍🧑', stages: [...ALL], cost: { energy: 15 }, special: 'socialise', scene: 'mamaput' },
  { id: 'familyTime', label: 'Family time', blurb: 'Call or visit family. Mama has been asking.', icon: '👪', stages: [...ALL], cost: { energy: 10 }, special: 'familyTime', scene: 'home' },
  { id: 'rest', label: 'Rest & recover', blurb: 'Sleep, eat well, and let NEPA do whatever it wants.', icon: '🛌', stages: [...ALL], cost: { energy: 8 }, special: 'rest', scene: 'home' },
  {
    id: 'exercise', label: 'Exercise', blurb: 'Jog the street, do press-ups, avoid goats.', icon: '🏃', stages: ['teen', 'youngAdult', 'adult', 'elder'], cost: { energy: 15 },
    effects: [{ stat: 'health', delta: 5 }, { stat: 'stress', delta: -5 }, { stat: 'happiness', delta: 2 }], maxPerYear: 2, scene: 'compound',
  },
  {
    id: 'community', label: 'Faith & community', blurb: 'Service, fellowship, town union meetings and food.', icon: '🕊️', stages: [...ALL], cost: { energy: 10 },
    effects: [{ stat: 'happiness', delta: 4 }, { stat: 'reputation', delta: 2 }, { stat: 'stress', delta: -3 }], maxPerYear: 2, scene: 'event',
  },
  { id: 'dash', label: 'Play Go-Slow Dash', blurb: 'Run, dodge and collect ₦ coins through Lagos.', icon: '🏃‍♂️', stages: [...ALL], cost: { energy: 10 }, special: 'dash', scene: 'danfo' },
  { id: 'applyJob', label: 'Look for work', blurb: 'CVs, aptitude tests and "who do you know?"', icon: '📝', stages: ['youngAdult', 'adult'], cost: { energy: 15 }, special: 'applyJob', requires: { all: [{ employed: false }, { inSchool: false }] }, maxPerYear: 2, scene: 'office' },
  { id: 'overtime', label: 'Work harder', blurb: 'Stay late and impress somebody important.', icon: '⏰', stages: ['youngAdult', 'adult'], cost: { energy: 18 }, special: 'overtime', requires: { all: [{ employed: true }] }, maxPerYear: 2, scene: 'office' },
  {
    id: 'treat', label: 'Treat yourself', blurb: 'New shoes, good food, a little sweetness.', icon: '🍨', stages: [...SCHOOLISH, 'adult', 'elder'], cost: { energy: 5, cash: 40000 },
    effects: [{ stat: 'happiness', delta: 7 }, { stat: 'stress', delta: -4 }], maxPerYear: 2, scene: 'market',
  },
  { id: 'shop', label: 'Shop', blurb: 'Buy things that actually help.', icon: '🛒', stages: [...SCHOOLISH, 'adult', 'elder'], cost: { energy: 5 }, special: 'shop', scene: 'market' },
  { id: 'chat', label: 'Chat', blurb: 'A quick catch-up.', icon: '💬', stages: [...ALL], cost: { energy: 3 }, special: 'chat', maxPerYear: 6, hidden: true, scene: 'compound' },
  { id: 'tv', label: 'Watch TV', blurb: 'Nollywood, football or the news you cannot fix.', icon: '📺', stages: [...ALL], cost: { energy: 2 }, special: 'tv', maxPerYear: 3, hidden: true, scene: 'home' },
  { id: 'meal', label: 'Eat a meal', blurb: 'Rice, beans, eba, whatever Mama made.', icon: '🍛', stages: [...ALL], cost: { energy: 1 }, special: 'meal', maxPerYear: 3, hidden: true, scene: 'home' },
  { id: 'groom', label: 'Freshen up', blurb: 'Brush your teeth, bathe, look sharp.', icon: '🪥', stages: [...ALL], cost: { energy: 1 }, special: 'groom', maxPerYear: 3, hidden: true, scene: 'home' },
  {
    id: 'explore', label: 'Find a new route', blurb: 'You found a shortcut nobody told you about, and a few coins on the way.', icon: '🧭', stages: [...ALL], cost: { energy: 6 },
    effects: [{ stat: 'happiness', delta: 4 }, { stat: 'knowledge', delta: 1 }, { stat: 'stress', delta: -2 }, { stat: 'cash', delta: 1500 }], maxPerYear: 2, hidden: true, scene: 'compound',
  },
  {
    id: 'visit', label: "Visit a friend's house", blurb: 'Plantain, gist and a seat on a friend\'s sofa.', icon: '🏘️', stages: [...ALL], cost: { energy: 8 },
    effects: [{ stat: 'happiness', delta: 5 }, { stat: 'stress', delta: -3 }, { rel: 'friend', delta: 4 }], maxPerYear: 2, hidden: true, scene: 'home',
  },
  { id: 'quitJob', label: 'Resign', blurb: 'Walk away from your job. Bold. Possibly foolish.', icon: '🚪', stages: ['youngAdult', 'adult'], cost: { energy: 0 }, special: 'quitJob', requires: { all: [{ employed: true }] }, scene: 'office' },
]
export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]))
export { GROWN }
