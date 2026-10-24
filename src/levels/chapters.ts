// The ten chapters (the lineup from the spec, section 12). Chapters 1 and 2 have a first playable level; the rest are placeholders that show as locked
// cards until the chapter before them is finished.
import { CHAPTER1 } from './chapter1'
import { LEVEL_C2L1, LEVEL_C2L2 } from './chapter2'

export interface ChapterDef {
  id: string; number: number; title: string; blurb: string; levels: string[]; totalLevels: number; built: boolean
  /** while only some of the chapter's levels exist, finishing the built ones counts as finishing it, so testers can move on */
  prototype?: boolean
}

const placeholder = (n: number, title: string, blurb: string): ChapterDef => ({ id: `ch${n}`, number: n, title, blurb, levels: [], totalLevels: 9, built: false })

export const CHAPTERS: ChapterDef[] = [
  { id: CHAPTER1.id, number: 1, title: CHAPTER1.title, blurb: CHAPTER1.blurb, levels: CHAPTER1.levels, totalLevels: CHAPTER1.totalLevels, built: true, prototype: true },
  { id: 'ch2', number: 2, title: 'Trial Day', blurb: 'An open football trial, a loud coach and a number on your back.', levels: [LEVEL_C2L1.id, LEVEL_C2L2.id], totalLevels: 9, built: true, prototype: true },
  placeholder(3, 'Market Day', 'Buy, sell, bargain and keep your cool.'),
  placeholder(4, 'Kitchen Rush', 'Orders pile up and the pot will not wait.'),
  placeholder(5, 'Beach Weekend', 'Sun, sand and a plan that keeps changing.'),
  placeholder(6, 'Move-Out Day', 'Boxes, keys and one stubborn sofa.'),
  placeholder(7, 'Campus Life', 'Lectures, deadlines and new friends.'),
  placeholder(8, 'Hospital Shift', 'A careful day behind the scenes.'),
  placeholder(9, 'Road Trip', 'Good music, bad directions.'),
  placeholder(10, 'Family Weekend', 'Everyone is coming. Everyone has opinions.'),
]
