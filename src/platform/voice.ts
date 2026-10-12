// Guide voice using the phone's built-in speech (Web Speech API). Free and offline on most phones. It prefers a Nigerian English
// voice, then other English voices, and reads Pidgin with the same voice. Swap in recorded lines later by adding them to
// ASSET_MANIFEST.sfx under a "voice:<id>" key (see src/assets/manifest.ts) and playing them from here.
interface Cfg { on: boolean; volume: number }
let cfg: Cfg = { on: true, volume: 0.8 }
const spoken = new Map<string, number>()

const synth = (): SpeechSynthesis | null => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null)
export const voiceAvailable = () => !!synth()

export function configureVoice(c: Cfg) { cfg = c; if (!c.on) stopSpeaking() }

function bestVoice(): SpeechSynthesisVoice | null {
  const list = synth()?.getVoices() ?? []
  const order = ['en-NG', 'en-ZA', 'en-GB', 'en-IE', 'en-AU', 'en-US', 'en']
  for (const l of order) { const v = list.find((x) => x.lang.replace('_', '-').toLowerCase().startsWith(l.toLowerCase())); if (v) return v }
  return null
}

export function stopSpeaking() { try { synth()?.cancel() } catch { /* ignore */ } }

/** Say a line. `key` stops the same line repeating within `gapMs` (e.g. while walking towards the same target). */
export function speak(text: string, key?: string, gapMs = 90000) {
  const s = synth(); if (!s || !cfg.on || !text.trim()) return
  const now = Date.now()
  if (key) { if (now - (spoken.get(key) ?? 0) < gapMs) return; spoken.set(key, now) }
  try {
    s.cancel()
    const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, '').replace(/₦/g, 'naira '))
    const v = bestVoice(); if (v) { u.voice = v; u.lang = v.lang }
    u.rate = 0.97; u.volume = Math.min(1, cfg.volume)
    s.speak(u)
  } catch { /* speech is a bonus, never a blocker */ }
}
