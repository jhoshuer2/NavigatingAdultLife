// The ten chapters. Only chapter 1 exists so far; the others are placeholders that show as locked cards until the one before them is finished.
import { CHAPTER1 } from './chapter1'

export interface ChapterDef { id: string; number: number; title: string; blurb: string; levels: string[]; totalLevels: number; built: boolean }

const placeholder = (n: number, title: string, blurb: string): ChapterDef => ({ id: `ch${n}`, number: n, title, blurb, levels: [], totalLevels: 9, built: false })

export const CHAPTERS: ChapterDef[] = [
  { id: CHAPTER1.id, number: 1, title: CHAPTER1.title, blurb: CHAPTER1.blurb, levels: CHAPTER1.levels, totalLevels: CHAPTER1.totalLevels, built: true },
  placeholder(2, 'First Job Hunt', 'Interviews, rejections and one lucky call.'),
  placeholder(3, 'Moving Out', 'Your own keys, your own rules, your own bills.'),
  placeholder(4, 'Payday', 'The money arrives. So do the requests.'),
  placeholder(5, 'The Big Break', 'A chance that asks a lot in return.'),
  placeholder(6, 'A Night at the Clinic', 'A long night that tests everyone.'),
  placeholder(7, 'Family Matters', 'Love, duty and a very loud group chat.'),
  placeholder(8, 'Starting Something', 'Your idea, your risk, your team.'),
  placeholder(9, 'Hard Choices', 'No right answers, only your answers.'),
  placeholder(10, 'Grown', 'Look back at how far you came.'),
]
