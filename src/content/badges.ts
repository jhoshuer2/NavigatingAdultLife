// Profile badges for the 2.0 game. They are worked out from the saved profile every time (never stored on their own), so a save made before
// badges existed shows the right ones straight away and nothing can get out of step with the real progress.
import { CHAPTERS } from '../levels/chapters'
import { LEVELS } from '../levels/levels'
import { chapterState, type ChapterProgress } from '../levels/progress'

export type BadgeGroup = 'story' | 'rush' | 'online'
export interface BadgeDef { id: string; group: BadgeGroup; title: string; desc: string; icon: string; need: number; have: (p: ChapterProgress) => number }
export interface BadgeState extends BadgeDef { earned: boolean; value: number }

const chapterIcons = ['🏙️', '⚖️', '🧺', '🍲', '🏖️', '📦', '🎓', '🩺', '🚐', '👨‍👩‍👧‍👦']
const starsOf = (p: ChapterProgress, ids: string[]) => ids.map((l) => p.stars[l] ?? 0)
const doneChapter = (p: ChapterProgress, i: number) => chapterState(p, CHAPTERS, i) === 'done'

const chapterBadges: BadgeDef[] = CHAPTERS.map((c, i) => {
  const last = LEVELS[c.levels[c.levels.length - 1]]
  const title = last?.badge ?? c.title
  return {
    id: `chapter${c.number}`, group: 'story', title, icon: chapterIcons[i] ?? '🏅', need: c.totalLevels,
    desc: `Finish every level of Chapter ${c.number}, ${c.title}.`,
    have: (p) => c.levels.filter((l) => (p.stars[l] ?? 0) > 0).length,
  }
})

const allStars = (p: ChapterProgress) => Object.values(p.stars).reduce((a, b) => a + b, 0)
export const BADGES: BadgeDef[] = [
  ...chapterBadges,
  { id: 'first_steps', group: 'story', title: 'First Steps', icon: '👣', need: 1, desc: 'Finish your first level.', have: (p) => Math.min(1, Object.values(p.stars).filter((s) => s > 0).length) },
  { id: 'three_stars', group: 'story', title: 'Three Stars', icon: '⭐', need: 1, desc: 'Finish any level with 3 stars.', have: (p) => Math.min(1, Object.values(p.stars).filter((s) => s >= 3).length) },
  { id: 'perfect_chapter', group: 'story', title: 'Perfect Chapter', icon: '🌟', need: 1, desc: 'Get 3 stars on every level of one chapter.', have: (p) => Math.min(1, CHAPTERS.filter((c) => c.levels.length >= c.totalLevels && starsOf(p, c.levels).every((s) => s >= 3)).length) },
  { id: 'star_collector', group: 'story', title: 'Star Collector', icon: '✨', need: 50, desc: 'Collect 50 stars across all levels.', have: allStars },
  { id: 'made_it', group: 'story', title: 'Made It', icon: '🏆', need: CHAPTERS.length, desc: 'Finish all ten chapters.', have: (p) => CHAPTERS.filter((_, i) => doneChapter(p, i)).length },

  { id: 'rush_500', group: 'rush', title: '500 Metres', icon: '🏃', need: 500, desc: 'Run 500 m in one Rush.', have: (p) => p.rush.best },
  { id: 'rush_1000', group: 'rush', title: 'One Kilometre', icon: '🛣️', need: 1000, desc: 'Run 1 km in one Rush.', have: (p) => p.rush.best },
  { id: 'rush_2500', group: 'rush', title: 'Rush Legend', icon: '🚀', need: 2500, desc: 'Run 2.5 km in one Rush.', have: (p) => p.rush.best },
  { id: 'alfred_1', group: 'rush', title: 'Beat Alfred', icon: '🤖', need: 1, desc: 'Win a race against Alfred ai.', have: (p) => p.rush.alfredWins ?? 0 },
  { id: 'alfred_10', group: 'rush', title: 'Alfred Beater', icon: '🦾', need: 10, desc: 'Win 10 races against Alfred ai.', have: (p) => p.rush.alfredWins ?? 0 },

  { id: 'live_1', group: 'online', title: 'Live Racer', icon: '🏁', need: 1, desc: 'Finish a race against real players.', have: (p) => p.rush.livePlays ?? 0 },
  { id: 'live_win_1', group: 'online', title: 'First Live Win', icon: '🥇', need: 1, desc: 'Win a race against real players.', have: (p) => p.rush.liveWins ?? 0 },
  { id: 'live_win_5', group: 'online', title: 'Crowd Favourite', icon: '🏅', need: 5, desc: 'Win 5 races against real players.', have: (p) => p.rush.liveWins ?? 0 },
  { id: 'top3', group: 'online', title: 'Top 3', icon: '👑', need: 1, desc: 'Reach the top 3 on the Global leaderboard.', have: (p) => (p.rush.bestRank && p.rush.bestRank <= 3 ? 1 : 0) },
]

export const BADGE_GROUPS: { id: BadgeGroup; title: string; blurb: string }[] = [
  { id: 'story', title: 'Story', blurb: 'Chapters and stars' },
  { id: 'rush', title: 'The Rush', blurb: 'Distance and Alfred ai' },
  { id: 'online', title: 'Online races', blurb: 'Race real players' },
]

export function badgeState(p: ChapterProgress): BadgeState[] {
  return BADGES.map((b) => { const value = Math.min(b.need, b.have(p)); return { ...b, value, earned: value >= b.need } })
}
export const earnedIds = (p: ChapterProgress): string[] => badgeState(p).filter((b) => b.earned).map((b) => b.id)
