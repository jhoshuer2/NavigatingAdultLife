// Guide language. The player picks English, Pidgin, or both; every guide line is written in both so nothing is machine-translated.
// 🚩 Cultural review welcome: the Pidgin lines are first drafts. Edit freely in `guideText.ts`.
export type Lang = 'en' | 'pcm' | 'both'
export interface Say { en: string; pcm: string }
export const LANGS: { id: Lang; label: string; sub: string; emoji: string }[] = [
  { id: 'en', label: 'English', sub: 'Plain English', emoji: '🇬🇧' },
  { id: 'pcm', label: 'Pidgin', sub: 'Naija Pidgin', emoji: '🇳🇬' },
  { id: 'both', label: 'Both', sub: 'Pidgin + English', emoji: '🗣️' },
]
export const say = (en: string, pcm: string): Say => ({ en, pcm })

/** The line to show for a language. In "both", Pidgin leads and English is the small second line. */
export function pick(lang: Lang | undefined, s: Say): { main: string; sub?: string } {
  if (lang === 'pcm') return { main: s.pcm }
  if (lang === 'both') return { main: s.pcm, sub: s.en }
  return { main: s.en }
}
export const plain = (lang: Lang | undefined, s: Say) => (lang === 'pcm' || lang === 'both' ? s.pcm : s.en)
