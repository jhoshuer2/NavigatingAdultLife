// Guide voice. Recorded clips (public/voice/<id>.<en|pcm>.mp3, listed in public/voice/manifest.json) are played when a line has one;
// everything else is spoken with the phone's built-in speech (Web Speech API), which prefers a Nigerian English voice and reads
// Pidgin with the same voice. The clips are generated from src/content/voiceLines.ts with scripts/voice-lines.ts.
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

export function stopSpeaking() {
  try { synth()?.cancel() } catch { /* ignore */ }
  try { clip?.pause() } catch { /* ignore */ }
  clip = null
}

// --- recorded clips ---
const BASE = (typeof import.meta !== 'undefined' && (import.meta.env?.BASE_URL as string | undefined)) || '/'
let manifest: Set<string> | null = null
let manifestLoad: Promise<void> | null = null
let clip: HTMLAudioElement | null = null
const blobs = new Map<string, string>()
let ticket = 0

const loadManifest = () => (manifestLoad ??= fetch(`${BASE}voice/manifest.json`).then((r) => (r.ok ? r.json() : [])).then((a: string[]) => { manifest = new Set(a) }).catch(() => { manifest = new Set() }))

async function playClip(name: string, mine: number): Promise<boolean> {
  try {
    let url = blobs.get(name)
    if (!url) { const r = await fetch(`${BASE}voice/${name}.mp3`); if (!r.ok) return false; url = URL.createObjectURL(await r.blob()); blobs.set(name, url) }
    if (mine !== ticket) return true // a newer line took over while this one loaded
    const a = new Audio(url); a.volume = Math.min(1, cfg.volume); clip = a
    await a.play()
    return true
  } catch { return false }
}

/** Say a line: the recorded clip `id` in the player's language if there is one, otherwise the phone's voice reading `text`. */
export async function speakLine(o: { id?: string; lang: 'en' | 'pcm'; text: string; key?: string; gapMs?: number }) {
  if (!cfg.on) return
  const now = Date.now()
  if (o.key) { if (now - (spoken.get(o.key) ?? 0) < (o.gapMs ?? 90000)) return; spoken.set(o.key, now) }
  const mine = ++ticket
  stopSpeaking()
  if (o.id) {
    await loadManifest()
    if (mine !== ticket) return
    const name = `${o.id}.${o.lang}`
    if (manifest?.has(name) && (await playClip(name, mine))) return
  }
  if (mine === ticket) speak(o.text)
}

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
