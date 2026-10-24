// The ten chapters (the lineup from the spec, section 12). Chapters 1 and 2 have a first playable level; the rest are placeholders that show as locked
// cards until the chapter before them is finished.
import { CHAPTER1 } from './chapter1'
import { LEVEL_C2L1, LEVEL_C2L2, LEVEL_C2L3 } from './chapter2'

export interface ChapterDef {
  id: string; number: number; title: string; blurb: string; levels: string[]; totalLevels: number; built: boolean
  /** while only some of the chapter's levels exist, finishing the built ones counts as finishing it, so testers can move on */
  prototype?: boolean
}

const placeholder = (n: number, title: string, blurb: string): ChapterDef => ({ id: `ch${n}`, number: n, title, blurb, levels: [], totalLevels: 9, built: false })

export const CHAPTERS: ChapterDef[] = [
  { id: CHAPTER1.id, number: 1, title: CHAPTER1.title, blurb: CHAPTER1.blurb, levels: ['ch1.l1', 'ch1.l2', 'ch1.l3', 'ch1.l4', 'ch1.l5', 'ch1.l6', 'ch1.l7', 'ch1.l8', 'ch1.l9'], totalLevels: CHAPTER1.totalLevels, built: true },
  { id: 'ch2', number: 2, title: 'Trial Day', blurb: 'An open football trial, a loud coach and a number on your back.', levels: [LEVEL_C2L1.id, LEVEL_C2L2.id, LEVEL_C2L3.id, 'ch2.l4', 'ch2.l5', 'ch2.l6', 'ch2.l7', 'ch2.l8', 'ch2.l9'], totalLevels: 9, built: true },
  { id: 'ch3', number: 3, title: 'Market Day', blurb: 'Buy, sell, bargain and keep your cool.', levels: Array.from({ length: 9 }, (_, i) => `ch3.l${i + 1}`), totalLevels: 9, built: true },
  { id: 'ch4', number: 4, title: 'Kitchen Rush', blurb: 'Orders pile up and the pot will not wait.', levels: Array.from({ length: 9 }, (_, i) => `ch4.l${i + 1}`), totalLevels: 9, built: true },
  placeholder(5, 'Beach Weekend', 'Sun, sand and a plan that keeps changing.'),
  placeholder(6, 'Move-Out Day', 'Boxes, keys and one stubborn sofa.'),
  placeholder(7, 'Campus Life', 'Lectures, deadlines and new friends.'),
  placeholder(8, 'Hospital Shift', 'A careful day behind the scenes.'),
  placeholder(9, 'Road Trip', 'Good music, bad directions.'),
  placeholder(10, 'Family Weekend', 'Everyone is coming. Everyone has opinions.'),
]
