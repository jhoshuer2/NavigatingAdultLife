import { create } from 'zustand'
import type { GameState, NewLifeConfig, Lifestyle, QuizQuestion } from '@engine/core/types'
import { createNewLife, doActivity, setClock, submitQuizAnswer, finishActions, chooseOption, continueAfterEvent, advanceYear, setLifestyle, applyDashResult, type ActivityArgs, type MiniGameResult } from '@engine/api'
import { ACHIEVEMENT_BY_ID } from '@content/achievements'
import { defaultMeta, mergeEnding, UNLOCKABLES, type MetaProfile, type Settings } from '@platform/meta'
import { loadLife, loadMeta, saveLife, saveMeta, importSave, exportSave } from '@platform/storage'
import { addPaid, consume, refreshTokens, remainingSec } from '@platform/tokens'
import { audio } from '@platform/audio'
import { track } from '@platform/analytics'
import { ACTIVITY_HOURS } from './world/time'

export type Screen = 'title' | 'create' | 'play' | 'ending' | 'achievements' | 'unlocks' | 'settings' | 'dash' | 'history'
export type Sheet = null | 'shop' | 'jobs' | 'quests' | 'profile' | 'pick-social' | 'pick-family' | 'lifestyle' | 'paywall' | 'place' | 'npc' | 'places'

import type { PlaceId } from './world/layout'

interface Toast { id: number; text: string; kind: 'ach' | 'info' }

interface Store {
  screen: Screen
  life: GameState | null
  meta: MetaProfile
  sheet: Sheet
  toasts: Toast[]
  quizFeedback: { correct: boolean; funny?: string; q: QuizQuestion; picked: number; last: boolean } | null
  dashMode: 'foot' | 'danfo'
  lastDash: { result: MiniGameResult; cash: number; capped: boolean } | null
  endingRecorded: boolean
  placeId: PlaceId | null
  npcId: string | null
  walkReq: { place: PlaceId; n: number } | null
  hour: number
  day: number
  enterReq: { place: PlaceId; intent?: 'sleep'; n: number } | null
  enterPlace: (id: PlaceId, intent?: 'sleep') => void
  advance: (hours: number) => void
  setHourTo: (hour: number, dayAdd?: number) => void
  openPlace: (id: PlaceId) => void
  openNpc: (id: string) => void
  goToPlace: (id: PlaceId) => void
  go: (s: Screen) => void
  openSheet: (s: Sheet) => void
  toast: (text: string, kind?: Toast['kind']) => void
  init: () => void
  newLife: (cfg: NewLifeConfig) => void
  continueLife: () => void
  act: (id: string, args?: ActivityArgs) => void
  answer: (i: number) => void
  endActions: () => void
  clearQuiz: () => void
  choose: (id: string) => void
  proceed: () => void
  nextYear: () => void
  lifestyle: (l: Lifestyle) => void
  startDash: () => void
  finishDash: (r: MiniGameResult) => void
  abandonLife: () => void
  updateSettings: (p: Partial<Settings>) => void
  buyUnlock: (id: string) => boolean
  tick: (sec: number) => void
  topUpTest: (minutes: number) => void
  setUnlimited: (v: boolean) => void
  exportJson: () => string
  importJson: (t: string) => boolean
  setLife: (s: GameState) => void
  finishTutorial: () => void
}

let toastId = 1

export const useGame = create<Store>((set, get) => {
  const commit = (life: GameState) => {
    const prev = get().life
    saveLife(life)
    // achievement toasts
    if (prev) for (const a of life.achievements) if (!prev.achievements.includes(a)) { const d = ACHIEVEMENT_BY_ID[a]; if (d) { get().toast(`${d.icon} Achievement: ${d.title}`, 'ach'); audio.sfx('level') } }
    const q = prev ? Object.entries(life.quests).filter(([id, s]) => s.done && !prev.quests[id]?.done) : []
    for (const [id] of q) get().toast(`✅ Quest complete: ${id.replace('q_', '').replace(/_/g, ' ')}`, 'info')
    set({ life })
    if (life.phase === 'ended' && !get().endingRecorded) {
      const meta = mergeEnding(get().meta, life)
      track(meta.consentAnalytics, 'life_ended', life.ending?.id)
      saveMeta(meta); saveLife(null)
      set({ meta, endingRecorded: true, screen: 'ending' })
    }
  }
  const setMeta = (meta: MetaProfile) => { saveMeta(meta); set({ meta }); audio.configure(meta.settings) }
  return {
    screen: 'title', life: null, meta: defaultMeta(), sheet: null, toasts: [], quizFeedback: null, dashMode: 'foot', lastDash: null, endingRecorded: false, placeId: null, npcId: null, walkReq: null, hour: 8, day: 0, enterReq: null,
    enterPlace: (id, intent) => set((st) => ({ enterReq: { place: id, intent, n: (st.enterReq?.n ?? 0) + 1 }, sheet: null })),
    advance: (hours) => { const { hour, day } = get(); let h = hour + hours, d = day; while (h >= 24) { h -= 24; d++ }; get().setHourTo(h, d - day) },
    setHourTo: (h, dayAdd = 0) => { const st = get(); const day = st.day + dayAdd; set({ hour: h, day }); if (st.life) { const l = setClock(st.life, h, day); saveLife(l); set({ life: l }) } },
    openPlace: (id) => set({ placeId: id, sheet: 'place' }),
    openNpc: (id) => set({ npcId: id, sheet: 'npc' }),
    goToPlace: (id) => set((st) => ({ walkReq: { place: id, n: (st.walkReq?.n ?? 0) + 1 }, sheet: null })),
    go: (screen) => { set({ screen, sheet: null }) },
    openSheet: (sheet) => set({ sheet }),
    toast: (text, kind = 'info') => {
      const id = toastId++
      set((s) => ({ toasts: [...s.toasts, { id, text, kind }] }))
      setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200)
    },
    init: () => {
      const meta = refreshTokens(loadMeta())
      if (new URLSearchParams(location.search).get('unlimited') === '1') meta.tokens.unlimited = true
      saveMeta(meta)
      audio.configure(meta.settings)
      document.documentElement.classList.toggle('big-text', meta.settings.bigText)
      const life = loadLife(); set({ meta, life, hour: life?.clock?.hour ?? 8, day: life?.clock?.day ?? 0 })
    },
    newLife: (cfg) => {
      const seed = (Math.random() * 2 ** 32) >>> 0
      const life = createNewLife(cfg, seed)
      saveLife(life)
      track(get().meta.consentAnalytics, 'life_started')
      set({ life, endingRecorded: false, screen: 'play', sheet: null, quizFeedback: null, hour: 8, day: 0 })
    },
    continueLife: () => { if (get().life) set({ screen: 'play' }) },
    act: (id, args) => { const life = get().life; if (!life) return; const r = doActivity(life, id, args); if (r.ok) { commit(r.state); set({ sheet: null }); if (id !== 'rest' && ACTIVITY_HOURS[id]) get().advance(ACTIVITY_HOURS[id]) } },
    answer: (i) => {
      const life = get().life; if (!life) return
      const q = life.quiz?.questions[life.quiz.index]
      const r = submitQuizAnswer(life, i)
      if (r.result && q) { set({ quizFeedback: { correct: r.result.correct, funny: r.result.funny, q, picked: i, last: r.result.done } }); audio.sfx(r.result.correct ? 'good' : 'bad') }
      commit(r.state)
    },
    clearQuiz: () => set({ quizFeedback: null }),
    endActions: () => { const life = get().life; if (life) { commit(finishActions(life)) } },
    choose: (id) => { const life = get().life; if (life) commit(chooseOption(life, id)) },
    proceed: () => { const life = get().life; if (life) commit(continueAfterEvent(life)) },
    nextYear: () => { const life = get().life; if (life) { commit(advanceYear(life)); set({ hour: 7 }) } },
    lifestyle: (l) => { const life = get().life; if (life) { commit(setLifestyle(life, l)); set({ sheet: null }) } },
    startDash: () => {
      const life = get().life; if (!life) return
      const mode: 'foot' | 'danfo' = life.character.job && life.character.age >= 22 && life.character.job.trackId !== 'creative' ? 'danfo' : 'foot'
      const r = doActivity(life, 'dash')
      if (r.ok) { commit(r.state); set({ dashMode: mode, screen: 'dash', lastDash: null }) }
    },
    finishDash: (res) => {
      const life = get().life; if (!life) return
      const r = applyDashResult(life, res)
      commit(r.state)
      set({ lastDash: { result: res, cash: r.cash, capped: r.capped }, screen: 'play' })
    },
    abandonLife: () => { saveLife(null); set({ life: null, screen: 'title' }) },
    updateSettings: (p) => { const m = get().meta; const settings = { ...m.settings, ...p }; setMeta({ ...m, settings }); document.documentElement.classList.toggle('big-text', settings.bigText) },
    buyUnlock: (id) => {
      const m = get().meta; const u = UNLOCKABLES.find((x) => x.id === id)
      if (!u || m.unlocks.includes(id) || m.cowries < u.cost) return false
      setMeta({ ...m, cowries: m.cowries - u.cost, unlocks: [...m.unlocks, id] }); return true
    },
    tick: (sec) => {
      const m = get().meta
      if (m.tokens.unlimited) return
      const next = consume(m, sec)
      saveMeta(next); set({ meta: next })
      if (remainingSec(next) <= 0 && get().sheet !== 'paywall') set({ sheet: 'paywall' })
    },
    topUpTest: (minutes) => { setMeta(addPaid(get().meta, minutes)); set({ sheet: null }) },
    setUnlimited: (v) => { const m = get().meta; setMeta({ ...m, tokens: { ...m.tokens, unlimited: v } }) },
    exportJson: () => exportSave(get().life, get().meta),
    importJson: (t) => { const r = importSave(t); if (!r) return false; setMeta(r.meta); saveLife(r.life); set({ life: r.life }); return true },
    setLife: (life) => { saveLife(life); set({ life }) },
    finishTutorial: () => setMeta({ ...get().meta, seenTutorial: true }),
  }
})
