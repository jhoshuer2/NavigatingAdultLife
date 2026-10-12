import { create } from 'zustand'
import type { GameState, NewLifeConfig, Lifestyle, QuizQuestion } from '@engine/core/types'
import { createNewLife, doActivity, setClock, setFlag, payCash, submitQuizAnswer, finishActions, chooseOption, continueAfterEvent, advanceYear, setLifestyle, applyDashResult, type ActivityArgs, type MiniGameResult } from '@engine/api'
import { ACHIEVEMENT_BY_ID } from '@content/achievements'
import { defaultMeta, mergeEnding, UNLOCKABLES, type MetaProfile, type Settings } from '@platform/meta'
import { loadLife, loadMeta, saveLife, saveMeta, importSave, exportSave } from '@platform/storage'
import { addPaid, consume, refreshTokens, remainingSec } from '@platform/tokens'
import { audio } from '@platform/audio'
import { track, setLifeId, restoreLifeId, newLifeId, setAnalyticsConsent, setAnalyticsContext } from '@platform/analytics'
import { ACTIVITY_HOURS } from './world/time'

export type Screen = 'title' | 'create' | 'play' | 'ending' | 'achievements' | 'unlocks' | 'settings' | 'dash' | 'history'
export type Sheet = null | 'shop' | 'jobs' | 'quests' | 'profile' | 'pick-social' | 'pick-family' | 'lifestyle' | 'paywall' | 'place' | 'npc' | 'places'

import type { PlaceId } from './world/layout'
import type { Say } from '@content/lang'

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
  taskActive: boolean
  deliveredNow: { ids: string[]; n: number } | null
  orderDelivery: (itemId: string, hoursLater: number, fee: number) => void
  deliverDue: () => void
  setTaskActive: (v: boolean) => void
  talkReq: { kind: 'chat' | 'hang' | 'family' | 'food'; role: string; n: number } | null
  startTalk: (kind: 'chat' | 'hang' | 'family' | 'food', role: string) => void
  penaltyReq: { act: string; n: number } | null
  marketReq: { n: number } | null
  matchReq: { n: number } | null
  startMatch: () => void
  jogReq: { n: number } | null
  startJog: () => void
  startShopReq: { n: number } | null
  startShop: () => void
  startChoresReq: { n: number } | null
  startChores: () => void
  startMarket: () => void
  startPenalty: (act: string) => void
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
  guideTrack: { place: PlaceId; say: Say; act?: string } | null
  setLang: (l: 'en' | 'pcm' | 'both') => void
  setGuideTrack: (t: { place: PlaceId; say: Say; act?: string } | null) => void
  setConsent: (granted: boolean) => void
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
    if (prev) {
      for (const a of life.achievements) if (!prev.achievements.includes(a)) track('achievement_unlocked', { id: a })
      for (const [id] of q) track('quest_completed', { id })
      if (life.character.age > prev.character.age && life.phase !== 'ended') track('year_ended', { age: life.character.age, life_index: get().meta.stats.lives })
      if (life.activeEvent && life.activeEvent.eventId !== prev.activeEvent?.eventId) track('story_event_shown', { event_id: life.activeEvent.eventId })
    }
    if (life.phase === 'ended' && !get().endingRecorded) {
      const meta = mergeEnding(get().meta, life)
      const st = life.character.stats
      track('life_ended', { age: life.character.age, life_index: meta.stats.lives, ending_id: life.ending?.id ?? null, years_lived: life.character.age, final_stats: `cash:${Math.round(st.cash)} health:${Math.round(st.health)} happiness:${Math.round(st.happiness)}` })
      setLifeId(null)
      saveMeta(meta); saveLife(null)
      set({ meta, endingRecorded: true, screen: 'ending' })
    }
  }
  const setMeta = (meta: MetaProfile) => { saveMeta(meta); set({ meta }); audio.configure(meta.settings) }
  return {
    screen: 'title', life: null, meta: defaultMeta(), sheet: null, toasts: [], quizFeedback: null, dashMode: 'foot', lastDash: null, endingRecorded: false, placeId: null, npcId: null, walkReq: null, hour: 8, day: 0, enterReq: null, taskActive: false, deliveredNow: null, talkReq: null, penaltyReq: null, marketReq: null, startChoresReq: null, startShopReq: null, jogReq: null, matchReq: null,
    startMatch: () => set((st) => ({ matchReq: { n: (st.matchReq?.n ?? 0) + 1 }, sheet: null })),
    startJog: () => set((st) => ({ jogReq: { n: (st.jogReq?.n ?? 0) + 1 }, sheet: null })),
    startShop: () => set((st) => ({ startShopReq: { n: (st.startShopReq?.n ?? 0) + 1 }, sheet: null })),
    startChores: () => set((st) => ({ startChoresReq: { n: (st.startChoresReq?.n ?? 0) + 1 }, sheet: null })),
    startMarket: () => set((st) => ({ marketReq: { n: (st.marketReq?.n ?? 0) + 1 }, sheet: null })),
    orderDelivery: (itemId, hoursLater, fee) => {
      const st = get(); let life = st.life; if (!life) return
      if (fee) life = payCash(life, fee, 'Loader')
      life = setFlag(life, `dlv:${itemId}`, st.day * 24 + st.hour + hoursLater)
      commit(life)
      if (hoursLater <= 0) get().deliverDue()
    },
    deliverDue: () => {
      const st = get(); let life = st.life; if (!life) return
      const abs = st.day * 24 + st.hour; const ids: string[] = []
      for (const [k, v] of Object.entries(life.flags)) if (k.startsWith('dlv:') && Number(v) <= abs) { const id = k.slice(4); life = setFlag(setFlag(life, k, null), `inst:${id}`, 1); ids.push(id) }
      if (ids.length) { commit(life); set({ deliveredNow: { ids, n: (st.deliveredNow?.n ?? 0) + 1 } }) }
    },
    setTaskActive: (v) => set({ taskActive: v }),
    startTalk: (kind, role) => set((st) => ({ talkReq: { kind, role, n: (st.talkReq?.n ?? 0) + 1 }, sheet: null })),
    startPenalty: (act) => set((st) => ({ penaltyReq: { act, n: (st.penaltyReq?.n ?? 0) + 1 }, sheet: null })),
    enterPlace: (id, intent) => set((st) => ({ enterReq: { place: id, intent, n: (st.enterReq?.n ?? 0) + 1 }, sheet: null })),
    advance: (hours) => { const { hour, day } = get(); let h = hour + hours, d = day; while (h >= 24) { h -= 24; d++ }; get().setHourTo(h, d - day) },
    setHourTo: (h, dayAdd = 0) => { const st = get(); const day = st.day + dayAdd; set({ hour: h, day }); if (st.life) { const l = setClock(st.life, h, day); saveLife(l); set({ life: l }) }; get().deliverDue() },
    openPlace: (id) => set({ placeId: id, sheet: 'place' }),
    openNpc: (id) => set({ npcId: id, sheet: 'npc' }),
    goToPlace: (id) => set((st) => ({ walkReq: { place: id, n: (st.walkReq?.n ?? 0) + 1 }, sheet: null })),
    go: (screen) => {
      set({ screen, sheet: null }); setAnalyticsContext({ screen })
      if (screen === 'title') track('title_viewed'); else if (screen === 'create') track('create_started')
    },
    openSheet: (sheet) => { set({ sheet }); if (sheet === 'paywall') track('paywall_seen'); else if (sheet === 'shop') track('shop_viewed') },
    toast: (text, kind = 'info') => {
      const id = toastId++
      set((s) => ({ toasts: [...s.toasts, { id, text, kind }] }))
      setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200)
    },
    init: () => {
      const meta = refreshTokens(loadMeta())
      const qs = new URLSearchParams(location.search)
      if (qs.get('unlimited') === '1') { meta.tokens.unlimited = true; if (!qs.get('asklang')) meta.langAsked = true } // playtest/test mode skips the language question
      saveMeta(meta)
      audio.configure(meta.settings)
      document.documentElement.classList.toggle('big-text', meta.settings.bigText)
      setAnalyticsConsent(meta.consentAnalytics); restoreLifeId()
      const life = loadLife(); set({ meta, life, hour: life?.clock?.hour ?? 8, day: life?.clock?.day ?? 0 })
    },
    newLife: (cfg) => {
      const seed = (Math.random() * 2 ** 32) >>> 0
      const life = createNewLife(cfg, seed)
      saveLife(life)
      setLifeId(newLifeId())
      const cfgTrack = { archetype: cfg.archetypeId, gender: cfg.gender, district: cfg.homeId }
      track('create_completed', cfgTrack)
      track('life_started', { life_index: get().meta.stats.lives + 1 })
      set({ life, endingRecorded: false, screen: 'play', sheet: null, quizFeedback: null, hour: 8, day: 0 })
    },
    continueLife: () => { if (get().life) set({ screen: 'play' }) },
    act: (id, args) => { const life = get().life; if (!life) return; const r = doActivity(life, id, args); if (r.ok) { track(id === 'shop' ? 'item_bought' : 'activity_done', id === 'shop' ? { item_id: String(args?.itemId ?? '') } : { activity_id: id, energy_cost: Math.round(life.character.stats.energy - r.state.character.stats.energy), cash_delta: Math.round(r.state.character.stats.cash - life.character.stats.cash) }); commit(r.state); set({ sheet: null }); if (id !== 'rest' && ACTIVITY_HOURS[id]) get().advance(ACTIVITY_HOURS[id]) } },
    answer: (i) => {
      const life = get().life; if (!life) return
      const q = life.quiz?.questions[life.quiz.index]
      const r = submitQuizAnswer(life, i)
      if (r.result && q) { set({ quizFeedback: { correct: r.result.correct, funny: r.result.funny, q, picked: i, last: r.result.done } }); audio.sfx(r.result.correct ? 'good' : 'bad') }
      commit(r.state)
    },
    clearQuiz: () => set({ quizFeedback: null }),
    endActions: () => { const life = get().life; if (life) { commit(finishActions(life)) } },
    choose: (id) => { const life = get().life; if (life) { track('story_choice_made', { event_id: life.activeEvent?.eventId ?? null, choice_id: id }); commit(chooseOption(life, id)) } },
    proceed: () => { const life = get().life; if (life) commit(continueAfterEvent(life)) },
    nextYear: () => { const life = get().life; if (life) { commit(advanceYear(life)); set({ hour: 7 }) } },
    lifestyle: (l) => { const life = get().life; if (life) { commit(setLifestyle(life, l)); set({ sheet: null }) } },
    startDash: () => {
      const life = get().life; if (!life) return
      const mode: 'foot' | 'danfo' = life.character.job && life.character.age >= 22 && life.character.job.trackId !== 'creative' ? 'danfo' : 'foot'
      const r = doActivity(life, 'dash')
      if (r.ok) { commit(r.state); track('dash_started', { mode }); setAnalyticsContext({ screen: 'dash' }); set({ dashMode: mode, screen: 'dash', lastDash: null }) }
    },
    finishDash: (res) => {
      const life = get().life; if (!life) return
      const r = applyDashResult(life, res)
      commit(r.state)
      track('dash_finished', { mode: res.mode, distance: Math.round(res.distance), coins: res.coins })
      setAnalyticsContext({ screen: 'play' })
      set({ lastDash: { result: res, cash: r.cash, capped: r.capped }, screen: 'play' })
    },
    abandonLife: () => { saveLife(null); set({ life: null, screen: 'title' }) },
    updateSettings: (p) => { const m = get().meta; const settings = { ...m.settings, ...p }; if (p.lite !== undefined && p.lite !== m.settings.lite) track('menu_mode_switched', { on: p.lite }); setMeta({ ...m, settings }); document.documentElement.classList.toggle('big-text', settings.bigText) },
    buyUnlock: (id) => {
      const m = get().meta; const u = UNLOCKABLES.find((x) => x.id === id)
      if (!u || m.unlocks.includes(id) || m.cowries < u.cost) return false
      track('unlock_bought', { id })
      setMeta({ ...m, cowries: m.cowries - u.cost, unlocks: [...m.unlocks, id] }); return true
    },
    tick: (sec) => {
      const m = get().meta
      if (m.tokens.unlimited) return
      const next = consume(m, sec)
      saveMeta(next); set({ meta: next })
      if (remainingSec(next) <= 0 && get().sheet !== 'paywall') { track('paywall_seen'); set({ sheet: 'paywall' }) }
    },
    topUpTest: (minutes) => { track('topup_completed', { item_id: `p${minutes}`, minutes, amount: 0, currency: 'MOCK' }); setMeta(addPaid(get().meta, minutes)); set({ sheet: null }) },
    setUnlimited: (v) => { const m = get().meta; setMeta({ ...m, tokens: { ...m.tokens, unlimited: v } }) },
    exportJson: () => exportSave(get().life, get().meta),
    importJson: (t) => { const r = importSave(t); if (!r) return false; setMeta(r.meta); saveLife(r.life); set({ life: r.life }); return true },
    setLife: (life) => { saveLife(life); set({ life }) },
    guideTrack: null,
    setLang: (l) => { const m = get().meta; setMeta({ ...m, langAsked: true, settings: { ...m.settings, lang: l } }) },
    setGuideTrack: (t) => set({ guideTrack: t, sheet: t ? null : get().sheet }),
    finishTutorial: () => { if (!get().meta.seenTutorial) track('tutorial_completed'); setMeta({ ...get().meta, seenTutorial: true }) },
    setConsent: (granted) => { setMeta({ ...get().meta, consentAnalytics: granted, consentAsked: true }); setAnalyticsConsent(granted) },
  }
})
