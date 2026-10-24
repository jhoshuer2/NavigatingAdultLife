// The ten chapters (the lineup from the spec, section 12). All ten are built; a chapter shows as a locked card until the chapter before it is finished.
import { CHAPTER1 } from './chapter1'
import { LEVEL_C2L1 } from './chapter2'

export interface ChapterDef {
  id: string; number: number; title: string; blurb: string; levels: string[]; totalLevels: number; built: boolean
  /** while only some of the chapter's levels exist, finishing the built ones counts as finishing it, so testers can move on */
  prototype?: boolean
}


export const CHAPTERS: ChapterDef[] = [
  { id: CHAPTER1.id, number: 1, title: CHAPTER1.title, blurb: CHAPTER1.blurb, levels: ['ch1.l1', 'ch1.l2', 'ch1.l3', 'ch1.l4', 'ch1.l5', 'ch1.l6', 'ch1.l7', 'ch1.l8', 'ch1.l9'], totalLevels: CHAPTER1.totalLevels, built: true },
  { id: 'ch2', number: 2, title: 'Trial Day', blurb: 'An open football trial, a loud coach and a number on your back.', levels: [LEVEL_C2L1.id, 'ch2.l2', 'ch2.l3', 'ch2.l4', 'ch2.l5', 'ch2.l6', 'ch2.l7', 'ch2.l8', 'ch2.l9'], totalLevels: 9, built: true },
  { id: 'ch3', number: 3, title: 'Market Day', blurb: 'Buy, sell, bargain and keep your cool.', levels: Array.from({ length: 9 }, (_, i) => `ch3.l${i + 1}`), totalLevels: 9, built: true },
  { id: 'ch4', number: 4, title: 'Kitchen Rush', blurb: 'Orders pile up and the pot will not wait.', levels: Array.from({ length: 9 }, (_, i) => `ch4.l${i + 1}`), totalLevels: 9, built: true },
  { id: 'ch5', number: 5, title: 'Beach Weekend', blurb: 'Sun, sand and a plan that keeps changing.', levels: Array.from({ length: 9 }, (_, i) => `ch5.l${i + 1}`), totalLevels: 9, built: true },
  { id: 'ch6', number: 6, title: 'Move-Out Day', blurb: 'Boxes, keys and one stubborn sofa.', levels: Array.from({ length: 9 }, (_, i) => `ch6.l${i + 1}`), totalLevels: 9, built: true },
  { id: 'ch7', number: 7, title: 'Campus Life', blurb: 'Lectures, deadlines and new friends.', levels: Array.from({ length: 9 }, (_, i) => `ch7.l${i + 1}`), totalLevels: 9, built: true },
  { id: 'ch8', number: 8, title: 'Hospital Shift', blurb: 'A careful day behind the scenes.', levels: Array.from({ length: 9 }, (_, i) => `ch8.l${i + 1}`), totalLevels: 9, built: true },
  { id: 'ch9', number: 9, title: 'Road Trip', blurb: 'Good music, bad directions.', levels: Array.from({ length: 9 }, (_, i) => `ch9.l${i + 1}`), totalLevels: 9, built: true },
  { id: 'ch10', number: 10, title: 'Family Weekend', blurb: 'Everyone is coming. Everyone has opinions.', levels: Array.from({ length: 9 }, (_, i) => `ch10.l${i + 1}`), totalLevels: 9, built: true },
]
