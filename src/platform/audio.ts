// Placeholder music and SFX synthesised with the Web Audio API (ADR 002). Replace via src/assets/manifest.ts.
import { ASSET_MANIFEST } from '../assets/manifest'

type Track = 'menu' | 'play' | 'dash'
interface Cfg { sound: boolean; music: boolean; volume: number }

const PENT = [0, 3, 5, 7, 10] // minor pentatonic
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

class AudioEngine {
  private ctx?: AudioContext
  private master?: GainNode
  private musicGain?: GainNode
  private noise?: AudioBuffer
  private timer?: number
  private track?: Track
  private step = 0
  private nextTime = 0
  private cfg: Cfg = { sound: true, music: true, volume: 0.6 }
  private fileAudio?: HTMLAudioElement

  configure(c: Cfg) {
    this.cfg = c
    if (this.master) this.master.gain.value = c.sound ? c.volume : 0
    if (this.musicGain) this.musicGain.gain.value = c.music ? 0.5 : 0
    if (this.fileAudio) this.fileAudio.volume = c.music && c.sound ? c.volume * 0.6 : 0
  }

  /** Must be called from a user gesture. */
  unlock() {
    if (this.ctx) { void this.ctx.resume(); return }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AC()
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination)
      this.musicGain = this.ctx.createGain(); this.musicGain.connect(this.master)
      const len = this.ctx.sampleRate
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
      const d = this.noise.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
      this.configure(this.cfg)
      if (this.track) this.playMusic(this.track)
    } catch { /* audio unavailable */ }
  }

  private tone(freq: number, t: number, dur: number, type: OscillatorType, vol: number, dest?: AudioNode, slideTo?: number) {
    const c = this.ctx; if (!c || !this.master) return
    const o = c.createOscillator(); const g = c.createGain()
    o.type = type; o.frequency.setValueAtTime(freq, t)
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g); g.connect(dest ?? this.master); o.start(t); o.stop(t + dur + 0.05)
  }
  private hit(t: number, dur: number, vol: number, hp: number, dest?: AudioNode) {
    const c = this.ctx; if (!c || !this.master || !this.noise) return
    const s = c.createBufferSource(); s.buffer = this.noise
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    s.connect(f); f.connect(g); g.connect(dest ?? this.master); s.start(t); s.stop(t + dur + 0.02)
  }

  playMusic(track: Track) {
    this.track = track
    const file = ASSET_MANIFEST.music[track]
    this.stopTimers()
    if (file) {
      this.fileAudio?.pause()
      this.fileAudio = new Audio(file); this.fileAudio.loop = true
      this.fileAudio.volume = this.cfg.music && this.cfg.sound ? this.cfg.volume * 0.6 : 0
      void this.fileAudio.play().catch(() => undefined)
      return
    }
    const c = this.ctx; if (!c) return
    this.step = 0; this.nextTime = c.currentTime + 0.1
    this.timer = window.setInterval(() => this.schedule(), 40)
  }
  stopMusic() { this.track = undefined; this.stopTimers(); this.fileAudio?.pause() }
  private stopTimers() { if (this.timer) { clearInterval(this.timer); this.timer = undefined } }

  private schedule() {
    const c = this.ctx; const mg = this.musicGain
    if (!c || !mg || !this.track) return
    const bpm = this.track === 'menu' ? 96 : this.track === 'play' ? 108 : 124
    const sixteenth = 60 / bpm / 4
    while (this.nextTime < c.currentTime + 0.2) {
      const i = this.step % 16
      const bar = Math.floor(this.step / 16) % 4
      const t = this.nextTime + (i % 2 === 1 ? sixteenth * 0.12 : 0) // light swing
      const root = [45, 43, 41, 43][bar] // A, G, F, G
      const dash = this.track === 'dash'
      if (i % 4 === 0 && (this.track !== 'menu' || i % 8 === 0)) this.tone(110, t, 0.18, 'sine', 0.55, mg, 45)
      if (this.track !== 'menu' && (i === 4 || i === 12)) this.hit(t, 0.12, 0.28, 1500, mg)
      if (this.track === 'menu' && i === 8) this.hit(t, 0.1, 0.12, 2500, mg)
      if (i % 2 === 0 || dash) this.hit(t, 0.04, i % 4 === 2 ? 0.1 : 0.05, 7000, mg)
      const bassPat = [0, -1, -1, 0, -1, 7, -1, -1, 0, -1, 3, -1, 5, -1, 7, -1]
      if (bassPat[i] >= 0) this.tone(midi(root + bassPat[i]), t, sixteenth * 1.8, 'triangle', 0.3, mg)
      if (this.track !== 'menu' && i % 2 === 1) this.tone(midi(root + 24 + PENT[(i + bar * 2) % 5]), t, sixteenth * 1.4, 'square', 0.045, mg)
      if (this.track === 'menu' && i % 8 === 0) { this.tone(midi(root + 24), t, sixteenth * 7, 'sine', 0.08, mg); this.tone(midi(root + 31), t, sixteenth * 7, 'sine', 0.06, mg) }
      this.nextTime += sixteenth
      this.step++
    }
  }

  sfx(name: 'click' | 'coin' | 'hit' | 'good' | 'bad' | 'power' | 'jump' | 'horn' | 'level') {
    if (!this.cfg.sound) return
    const file = ASSET_MANIFEST.sfx[name]
    if (file) { const a = new Audio(file); a.volume = this.cfg.volume; void a.play().catch(() => undefined); return }
    const c = this.ctx; if (!c) return
    const t = c.currentTime
    switch (name) {
      case 'click': this.tone(520, t, 0.06, 'triangle', 0.25); break
      case 'coin': this.tone(880, t, 0.08, 'square', 0.18); this.tone(1320, t + 0.07, 0.14, 'square', 0.18); break
      case 'hit': this.hit(t, 0.25, 0.6, 200); this.tone(160, t, 0.25, 'sawtooth', 0.35, undefined, 60); break
      case 'good': [523, 659, 784].forEach((f, i) => this.tone(f, t + i * 0.08, 0.2, 'triangle', 0.25)); break
      case 'bad': this.tone(260, t, 0.3, 'sawtooth', 0.25, undefined, 120); break
      case 'power': [440, 660, 880, 1320].forEach((f, i) => this.tone(f, t + i * 0.05, 0.12, 'square', 0.15)); break
      case 'jump': this.tone(300, t, 0.14, 'sine', 0.3, undefined, 700); break
      case 'horn': this.tone(330, t, 0.35, 'sawtooth', 0.22); this.tone(415, t, 0.35, 'sawtooth', 0.18); break
      case 'level': [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, t + i * 0.09, 0.22, 'triangle', 0.25)); break
    }
  }
}

export const audio = new AudioEngine()
