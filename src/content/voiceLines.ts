// The complete list of lines that have a recorded voice clip. `scripts/voice-lines.ts` prints it, the clips are generated from
// it (one English and one Pidgin file per id) and saved as public/voice/<id>.<en|pcm>.mp3. Anything not listed here is spoken
// with the phone's built-in voice instead (see src/platform/voice.ts).
import { say, type Say } from './lang'
import { GEN, QUEST_HINTS, SUGS } from '../world/guide'
import { HOWTO } from './taskGuide'

export const COACH: Say[] = [
  say('Drag the stick to walk. Tap the ground works too!', 'Drag the stick to waka. You fit tap the ground too!'),
  say('Walk to the glowing ring, then tap the green button.', 'Waka go the shining ring, then press the green button.'),
  say('Actions cost energy. Done for the year? Go home and end it. I will point the way if you get stuck.', 'Everything dey cost energy. You don finish the year? Go house end am. If you hala say you lost, I go show you road.'),
]

export interface VoiceLine { id: string; en: string; pcm: string }

/** A how-to card read out as one clip: title, each step, then the goal. */
export function howtoText(h: (typeof HOWTO)[string], l: 'en' | 'pcm'): string {
  return [h.title[l], ...h.steps.map((s) => s.say[l]), h.goal[l]].join('. ').replace(/\.\./g, '.').replace(/([!?])\./g, '$1')
}

export function voiceLines(): VoiceLine[] {
  const out: VoiceLine[] = []
  for (const s of Object.values(SUGS)) out.push({ id: `sug_${s.id}`, en: s.say.en, pcm: s.say.pcm })
  for (const [k, v] of Object.entries(GEN)) out.push({ id: `g_${k}`, en: v.en, pcm: v.pcm })
  COACH.forEach((c, i) => out.push({ id: `coach_${i}`, en: c.en, pcm: c.pcm }))
  for (const [k, h] of Object.entries(HOWTO)) out.push({ id: `how_${k}`, en: howtoText(h, 'en'), pcm: howtoText(h, 'pcm') })
  for (const [q, stages] of Object.entries(QUEST_HINTS)) stages.forEach((h, i) => out.push({ id: `quest_${q}_${i}`, en: h.say.en, pcm: h.say.pcm }))
  return out
}
