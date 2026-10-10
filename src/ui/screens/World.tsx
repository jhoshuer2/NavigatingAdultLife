import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../store'
import { Btn, DeltaChips, Mentor, Modal, RoundBtn, StatBadge, naira, nairaShort } from '../components'
import { Icon, type IconName } from '../icons'
import { Avatar } from '../Avatar'
import { getActivities, getShopItems } from '@engine/api'
import { useActivityRouter } from '../useActivities'
import { buildDistrict, DISTRICTS, SPAWN, WORLD, type District, type PlaceId } from '../../world/layout'
import { WorldRenderer, type Near, type NearInside, type WorldNpc } from '../../world/WorldRenderer'
import { INTERIORS, type HotAction } from '../../world/interiors'
import { fmtClock, isNight, isOpen, opensAt } from '../../world/time'
import type { NpcRole } from '@engine/core/types'
import { StudyTask, type StudyMode } from '../tasks/StudyTask'
import { PenaltyTask } from '../tasks/PenaltyTask'
import { MarketTask } from '../tasks/MarketTask'
import { ChoresTask, type Helper } from '../tasks/ChoresTask'
import { OvertimeTask } from '../tasks/OvertimeTask'
import { WorshipTask } from '../tasks/WorshipTask'
import { ShopTask } from '../tasks/ShopTask'
import { JogTask } from '../tasks/JogTask'
import { MatchTask } from '../tasks/MatchTask'
import { PoseTask } from '../tasks/PoseTask'
import { CookTask } from '../tasks/CookTask'
import { DineTask } from '../tasks/DineTask'
import { TalkTask, type Partner } from '../tasks/TalkTask'
import type { Exchange, Setting } from '@content/dialogue'
import { placeActive, suggest } from '../../world/guide'
import { installedSet } from '@content/appliances'
import { ITEM_BY_ID } from '@content/items'
import { outdoorAnchor, presenceAt, type Activity } from '../../world/residents'
import { audio } from '@platform/audio'
import { track, setAnalyticsContext } from '@platform/analytics'

const FOOD_SCRIPT: Exchange[] = [{ npc: 'You look hungry. What would you like to eat?', options: [{ text: 'Rice and stew, please. Thank you!', tone: 'warm', reply: 'Sit down, it is coming. Wash your hands first.' }, { text: 'Whatever smells like love!', tone: 'funny', reply: 'Ha! Always so easy to please. Sit down.' }, { text: 'Anything.', tone: 'meh', reply: 'Anything is not a meal! Sit down, I will decide.' }] }]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function World() {
  const g = useGame()
  const { life, meta, walkReq, enterReq, hour } = g
  const route = useActivityRouter()
  const [inside, setInside] = useState<PlaceId | null>(null)
  const [nearIn, setNearIn] = useState<NearInside>({ hotspot: null, person: null, exit: false })
  const [appl, setAppl] = useState({ light: false, tv: false, fan: false })
  const [hotId, setHotId] = useState<string | null>(null)
  const [fade, setFade] = useState(false)
  const [sleep, setSleep] = useState<{ from: number; elapsed: number } | null>(null)
  const intent = useRef<'sleep' | null>(null)
  type Task =
    | { kind: 'study'; mode: StudyMode }
    | { kind: 'penalty'; act: string }
    | { kind: 'market' }
    | { kind: 'chores'; helper?: Helper }
    | { kind: 'overtime' }
    | { kind: 'service' }
    | { kind: 'shop' }
    | { kind: 'jog' }
    | { kind: 'match'; actAs: string }
    | { kind: 'pose'; mode: 'sofa' | 'bed' }
    | { kind: 'cook' }
    | { kind: 'dine' }
    | { kind: 'talk'; partner: Partner; role: NpcRole; setting: Setting; rounds: number; title: string; actId: string; hidden?: string; greet?: string; script?: Exchange[] }
  const [task, setTask] = useState<Task | null>(null)
  const [hang, setHang] = useState<{ role: NpcRole; npcId: string; name: string; gender: 'male' | 'female'; dest: PlaceId } | null>(null)
  const [coopPick, setCoopPick] = useState<Helper[] | null>(null)
  const pendingChores = useRef<((h?: Helper) => void) | null>(null)
  const [destPick, setDestPick] = useState<{ role: NpcRole; npcId: string } | null>(null)
  const hourRef = useRef(hour); hourRef.current = hour
  const host = useRef<HTMLDivElement>(null)
  const rendRef = useRef<WorldRenderer | null>(null)
  const [near, setNear] = useState<Near>({ place: null, npc: null })
  const [fail, setFail] = useState(false)
  const [pos, setPos] = useState({ x: SPAWN.x, z: SPAWN.z, h: 0 })
  const [slow, setSlow] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  // telemetry only (no gameplay effect): where the player is and which task they run
  const taskLog = useRef<{ t0: number; perf?: number; abandoned?: boolean } | null>(null)
  useEffect(() => { setAnalyticsContext({ place: inside }); if (!inside) return; track('place_entered', { place: inside, hour: Math.floor(hourRef.current) }); return () => track('place_exited', { place: inside }) }, [inside])
  useEffect(() => {
    const k = task?.kind === 'talk' ? task.actId : task?.kind; if (!task || !k) return
    const log = { t0: Date.now() } as { t0: number; perf?: number; abandoned?: boolean }; taskLog.current = log
    const place = inside; track('task_started', { task: k, place })
    return () => { const d = Math.round((Date.now() - log.t0) / 1000); if (log.abandoned) track('task_abandoned', { task: k, place, duration_s: d }); else track('task_completed', { task: k, place, perf: log.perf === undefined ? null : Math.round(log.perf * 100) / 100, duration_s: d }); taskLog.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.kind])
  const [menuOpen, setMenuOpen] = useState(false)
  const [coach, setCoach] = useState(0)
  const [replay, setReplay] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const districtId = life?.character.housing.districtId ?? 'surulere'
  const district = useMemo<District>(() => buildDistrict(districtId), [districtId])
  const age = life?.character.age ?? 6
  const ageBand = age < 12 ? 0 : age < 18 ? 1 : 2
  const modalOpen = !!g.sheet || life?.phase !== 'action' || (!!life?.quiz && !task) || (!!task && task.kind !== 'chores' && task.kind !== 'shop' && task.kind !== 'jog' && task.kind !== 'match') || !!destPick || !!coopPick || !!hotId || !!sleep || fade || mapOpen

  const month = useMemo(() => {
    if (!life) return 0
    const start = Number(life.flags.__startEnergy ?? life.character.stats.maxEnergy) || 1
    return Math.min(11, Math.max(0, Math.floor((1 - life.character.stats.energy / start) * 11.99)))
  }, [life])

  // mount
  useEffect(() => {
    const el = host.current
    if (!el || !life) return
    const c = life.character
    let r: WorldRenderer
    try { r = new WorldRenderer(el, district, { look: c.appearance, age: c.age, uniform: c.edu.level !== 'none' && c.age < 18, month, hour: hourRef.current, spawn: SPAWN }) } catch { track('webgl_unavailable'); setFail(true); return }
    rendRef.current = r
    r.onNear(setNear)
    r.onNearInside((n) => {
      setNearIn(n)
      if (intent.current === 'sleep' && n.hotspot === 'bed') { intent.current = null; setHotId('bed') }
    })
    r.onPosition((x, z, h) => setPos({ x, z, h }))
    r.onSlow(() => { setSlow(true); track('slow_device_detected') })
    const ro = new ResizeObserver(() => r.resize()); ro.observe(el)
    r.start()
    if (new URLSearchParams(location.search).get('debug') === '1') (window as unknown as { __world?: WorldRenderer }).__world = r
    return () => { ro.disconnect(); r.dispose(); rendRef.current = null; setInside(null); setSleep(null) }
    // re-create only when the district changes (new home) or the avatar's age band changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [district, ageBand])

  // keep scene state in sync with the game
  useEffect(() => {
    const r = rendRef.current; if (!r || !life) return
    r.setMonth(month)
    const labels: Partial<Record<PlaceId, 'open' | 'closed' | 'inactive'>> = {}
    for (const p of district.places) labels[p.id] = !isOpen(p.id, hour) ? 'closed' : placeActive(life, p.id) ? 'open' : 'inactive'
    r.setPlaceLabels(labels)
    const list: WorldNpc[] = []
    for (const n of Object.values(life.npcs)) {
      if (!n.alive) continue
      if (n.role === 'boss' && !life.character.job) continue
      if (n.role === 'child' && n.id !== life.character.childrenIds[0]) continue
      const pr = presenceAt(n.role, hour, n.id)
      if (pr.where !== 'out') continue // at home, at work, at school, in a shop or asleep: not on the street
      const near = district.places.find((p) => p.id === (pr.near ?? 'home')) ?? district.places[0]
      const a = outdoorAnchor(near.id, near.door)
      list.push({ id: n.id, name: n.name, gender: n.gender, x: a.x + (Math.random() - 0.5) * a.r, z: a.z + (Math.random() - 0.5) * a.r, role: n.role, wander: a })
    }
    r.setNpcs(list)
  }, [life, district, month, ageBand, hour])

  useEffect(() => { if (!sleep) rendRef.current?.setHour(hour) }, [hour, sleep, district, ageBand])

  const coachOn = (!meta.seenTutorial || replay) && life?.phase === 'action'
  useEffect(() => {
    if (!coachOn) return
    if (coach === 0 && Math.hypot(pos.x - SPAWN.x, pos.z - SPAWN.z) > 4) setCoach(1)
    if (coach === 1 && (inside || g.sheet === 'place')) setCoach(2)
  }, [coachOn, coach, pos, inside, g.sheet])
  const lastText = life?.lastAction?.text
  useEffect(() => { if (!lastText) return; setFlash(lastText); const t = setTimeout(() => setFlash(null), 3800); return () => clearTimeout(t) }, [lastText])

  const installed = useMemo(() => installedSet(life?.character.housing.type ?? 'family', life?.flags ?? {}), [life?.character.housing.type, life?.flags])
  useEffect(() => { rendRef.current?.setInstalled(installed) }, [installed, inside])

  // a loader arrives with a delivery: walk in with the box, set it down, and the appliance appears
  useEffect(() => {
    const d = g.deliveredNow; if (!d) return
    const names = d.ids.map((id) => ITEM_BY_ID[id]?.name ?? id).join(', ')
    g.toast(`📦 Delivered to your home: ${names}`)
    const r = rendRef.current
    if (!r || r.inside !== 'home' || task) return
    const def = INTERIORS.home!
    d.ids.forEach((id, i) => {
      const spot = r.applianceSpot(id); if (!spot) return
      const lid = `loader${i}`
      setTimeout(() => {
        r.addActor(lid, { name: 'Loader', gender: 'male', x: def.door.x, z: def.door.z })
        r.moveActor(lid, spot.x, Math.min(spot.z + 1.8, def.bounds.z1 - 1.5))
        r.say(lid, `Oga, your ${ITEM_BY_ID[id]?.name ?? 'delivery'} don land!`, 3.5)
        setTimeout(() => { r.addMark(`box${i}`, spot.x, spot.z, '📦') }, 2200)
        setTimeout(() => { r.removeMark(`box${i}`); r.setInstalled(installed); r.moveActor(lid, def.door.x, def.door.z) }, 4600)
        setTimeout(() => r.removeActor(lid), 8200)
      }, i * 500)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.deliveredNow])

  // people inside a building follow their own routines (and arrive or leave as the clock moves)
  const residentMap = (place: PlaceId): Record<string, Activity | null> => {
    const m: Record<string, Activity | null> = {}
    if (!life) return m
    for (const n of Object.values(life.npcs)) {
      if (!n.alive) continue
      if (n.role === 'boss' && !life.character.job) { m[n.role] = null; continue }
      if (n.role === 'child' && n.id !== life.character.childrenIds[0]) { m[n.role] = null; continue }
      const pr = presenceAt(n.role, hour, n.id)
      const familyRole = n.role === 'mother' || n.role === 'father' || n.role === 'sibling'
      if (place === 'home' && familyRole && life.character.housing.type !== 'family') { m[n.role] = null; continue }
      m[n.role] = (place === 'home' ? pr.where === 'home' : pr.where === `place:${place}`) ? pr.activity : null
    }
    return m
  }
  useEffect(() => { const r = rendRef.current; if (r?.inside) r.setResidents(residentMap(r.inside), false) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [hour, inside, life?.npcs])

  const sug = useMemo(() => (life ? suggest(life) : null), [life])
  useEffect(() => { rendRef.current?.setHighlight(sug?.place ?? null) }, [sug])

  // walk requests (from the Places list or the guidance card)
  useEffect(() => {
    if (!walkReq || !rendRef.current) return
    const p = district.places.find((x) => x.id === walkReq.place)
    if (rendRef.current.inside) { rendRef.current.exitInterior(); setInside(null); setHotId(null) }
    if (p) rendRef.current.walkTo(p.door.x, p.door.z)
  }, [walkReq, district])

  // keyboard
  useEffect(() => {
    const keys = new Set<string>()
    const update = () => {
      if (modalOpen) { rendRef.current?.setInput(0, 0); return }
      const x = (keys.has('arrowright') || keys.has('d') ? 1 : 0) - (keys.has('arrowleft') || keys.has('a') ? 1 : 0)
      const z = (keys.has('arrowdown') || keys.has('s') ? 1 : 0) - (keys.has('arrowup') || keys.has('w') ? 1 : 0)
      rendRef.current?.setInput(x, z)
    }
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'e' || k === 'enter') { if (!modalOpen) interact(); return }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) { keys.add(k); update(); if (k.startsWith('arrow')) e.preventDefault() }
    }
    const up = (e: KeyboardEvent) => { keys.delete(e.key.toLowerCase()); update() }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); rendRef.current?.setInput(0, 0) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, near, nearIn, hour, fade, inside])

  const enter = (place: PlaceId, want?: 'sleep', then?: () => void) => {
    const r = rendRef.current; if (!r || !life || r.inside || fade) return
    const p = district.places.find((x) => x.id === place); const def = INTERIORS[place]
    if (!p || !def) { g.openPlace(place); return }
    if (!isOpen(place, hour)) { g.toast(`🔒 ${p.name} is closed. Opens at ${fmtClock(opensAt(place))}.`); return }
    audio.sfx('click'); setFade(true)
    setTimeout(() => {
      const people: { id: string; name: string; gender: 'male' | 'female'; role: string }[] = []
      for (const n of Object.values(life.npcs)) {
        if (!n.alive) continue
        if (n.role === 'boss' && !life.character.job) continue
        if (n.role === 'child' && n.id !== life.character.childrenIds[0]) continue
        people.push({ id: n.id, name: n.name, gender: n.gender, role: n.role })
      }
      const dark = isNight(hour)
      const st = { light: dark, tv: place === 'home' && hour >= 17.5 && hour < 23, fan: place === 'home' && hour >= 11 && hour < 23, hour }
      setAppl({ light: st.light, tv: st.tv, fan: st.fan })
      if (r.enterInterior(place, people, st, { x: p.door.x, z: p.door.z }, installed)) {
        r.setResidents(residentMap(place), true)
        setInside(place); setNearIn({ hotspot: null, person: null, exit: false }); setNear({ place: null, npc: null })
        if (then) setTimeout(then, 60)
        if (want === 'sleep') { intent.current = 'sleep'; const b = r.hotspotPos('bed'); if (b) { r.setInteriorMarker('bed'); r.walkTo(b.x, b.z) } }
      }
      setFade(false)
    }, 280)
  }
  const leave = () => {
    const r = rendRef.current; if (!r || !r.inside || fade) return
    audio.sfx('click'); setFade(true); intent.current = null
    setTimeout(() => { r.exitInterior(); setInside(null); setHotId(null); setNearIn({ hotspot: null, person: null, exit: false }); setFade(false) }, 280)
  }
  useEffect(() => { if (enterReq) enter(enterReq.place, enterReq.intent) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [enterReq])

  const talkInside = (pid: string) => {
    const info = rendRef.current?.personAt(pid); if (!info) return
    const npc = info.npcId ? life!.npcs[info.npcId] : null
    if (npc) g.openNpc(npc.id)
    else {
      // a bystander (teacher, classmate, cook...): a short real conversation in speech bubbles, no stats at stake
      const warm = ['teacher', 'elder', 'cook'].includes(info.role)
      setTask({ kind: 'talk', partner: { id: pid, name: info.name }, role: (warm ? 'mother' : 'friend') as NpcRole, setting: settingHere(), rounds: 1, title: `Talking with ${info.name}`, actId: '', greet: info.line })
    }
  }
  const interact = useCallback(() => {
    if (rendRef.current?.inside) {
      if (nearIn.hotspot) setHotId(nearIn.hotspot)
      else if (nearIn.person) talkInside(nearIn.person)
      else if (nearIn.exit) leave()
      return
    }
    if (near.place) { if (INTERIORS[near.place]) enter(near.place); else g.openPlace(near.place) }
    else if (near.npc) g.openNpc(near.npc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, nearIn, g, hour, fade, life])


  // ---------- in-world tasks ----------
  const enabledAct = (id: string) => { const a = life ? getActivities(life).find((x) => x.def.id === id) : null; return a?.enabled ? null : (a?.reason ?? 'Not available right now.') }
  useEffect(() => { rendRef.current?.setLabelsVisible(!task) }, [task])
  useEffect(() => { g.setTaskActive(!!task && task.kind === 'study'); return () => g.setTaskActive(false) }, [task])
  const startStudy = (mode: StudyMode) => {
    const why = enabledAct('study'); if (why) { g.toast(why); return }
    g.act('study'); setTask({ kind: 'study', mode })
  }
  const startPenalty = (actId: string) => {
    const r = rendRef.current; if (!r || fade) return
    const why = enabledAct(actId); if (why) { g.toast(why); return }
    setFade(true)
    setTimeout(() => { if (r.inside) { r.exitInterior(); setInside(null); setHotId(null) } setTask({ kind: 'penalty', act: actId }); setFade(false) }, 280)
  }
  useEffect(() => { if (g.penaltyReq) startPenalty(g.penaltyReq.act) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [g.penaltyReq])

  const startMatch = () => {
    const r = rendRef.current; if (!r || fade) return
    const actAs = !enabledAct('play') ? 'play' : !enabledAct('exercise') ? 'exercise' : ''
    if (!actAs) { g.toast(enabledAct('exercise') ?? 'Too tired for a match.'); return }
    setFade(true)
    setTimeout(() => { if (r.inside) { r.exitInterior(); setInside(null); setHotId(null) } const pl = district.places.find((p) => p.id === 'pitch')!; r.placePlayer((pl.rect.x0 + pl.rect.x1) / 2 - 1.2, (pl.rect.z0 + pl.rect.z1) / 2, Math.PI / 2); setTask({ kind: 'match', actAs }); setFade(false) }, 280)
  }
  useEffect(() => { if (g.matchReq) startMatch() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [g.matchReq])

  const startJog = () => {
    const r = rendRef.current; if (!r || fade) return
    const why = enabledAct('exercise'); if (why) { g.toast(why); return }
    setFade(true)
    setTimeout(() => { if (r.inside) { r.exitInterior(); setInside(null); setHotId(null) } setTask({ kind: 'jog' }); setFade(false) }, 280)
  }
  useEffect(() => { if (g.jogReq) startJog() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [g.jogReq])

  const startShop = () => {
    const r = rendRef.current; if (!r || fade) return
    const why = enabledAct('shop'); if (why) { g.toast(why); return }
    if (!isOpen('market', hour)) { g.toast(`🔒 The market is closed. Opens at ${fmtClock(opensAt('market'))}.`); return }
    const d = district.places.find((p) => p.id === 'market')!
    setFade(true)
    setTimeout(() => { if (r.inside) { r.exitInterior(); setInside(null); setHotId(null) } r.placePlayer(d.door.x, d.door.z + 1.2, Math.PI); setTask({ kind: 'shop' }); setFade(false) }, 280)
  }
  useEffect(() => { if (g.startShopReq) startShop() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [g.startShopReq])

  const startMarket = () => {
    const r = rendRef.current; if (!r || fade) return
    const why = enabledAct('hustle'); if (why) { g.toast(why); return }
    if (!isOpen('market', hour)) { g.toast(`🔒 The market is closed. Opens at ${fmtClock(opensAt('market'))}.`); return }
    setFade(true)
    setTimeout(() => { if (r.inside) { r.exitInterior(); setInside(null); setHotId(null) } setTask({ kind: 'market' }); setFade(false) }, 280)
  }
  useEffect(() => { if (g.marketReq) startMarket() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [g.marketReq])

  const beginOvertime = () => {
    const why = enabledAct('overtime'); if (why) { g.toast(why); return }
    setTask({ kind: 'overtime' })
  }
  const beginChores = () => {
    const r = rendRef.current; if (!r) return
    const why = enabledAct('chores'); if (why) { g.toast(why); return }
    // anyone at home right now can lend a hand
    const home: Helper[] = []
    if (life!.character.housing.type === 'family') for (const n of Object.values(life!.npcs)) { if (!n.alive || !['mother', 'father', 'sibling'].includes(n.role)) continue; if (presenceAt(n.role, hour, n.id).where === 'home') home.push({ name: n.name, gender: n.gender, role: n.role }) }
    const go = (helper?: Helper) => { if (r.inside === 'home') setTask({ kind: 'chores', helper }); else enter('home', undefined, () => setTask({ kind: 'chores', helper })) }
    if (home.length) { pendingChores.current = go; setCoopPick(home); return }
    go()
  }
  useEffect(() => { if (g.startChoresReq) beginChores() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [g.startChoresReq])

  const settingHere = (): Setting => { const p = rendRef.current?.inside; return p === 'home' ? 'home' : p === 'mamaput' ? 'mamaput' : p === 'school' ? 'school' : p === 'office' ? 'office' : near.place === 'pitch' ? 'pitch' : 'street' }
  const beginTalk = (kind: 'chat' | 'hang' | 'family' | 'food', role: NpcRole) => {
    const r = rendRef.current; if (!r || !life) return
    const npc = life.npcs[life.roles[role] ?? ''] ?? (role === 'child' ? life.npcs[life.character.childrenIds[0]] : undefined); if (!npc) return
    const actId = kind === 'chat' ? 'chat' : kind === 'hang' ? 'socialise' : kind === 'food' ? 'meal' : 'familyTime'
    const why = enabledAct(actId); if (why) { g.toast(why); return }
    if (kind === 'hang' && !r.inside && role !== 'mother' && role !== 'father' && role !== 'sibling' && role !== 'child') { setDestPick({ role, npcId: npc.id }); return }
    let partner: Partner; let hidden: string | undefined
    if (r.inside) {
      const def = INTERIORS[r.inside]; const person = def?.people.find((p) => p.persistent === role)
      if (person) partner = { id: person.id, name: npc.name }
      else { const me = r.position; r.addActor('buddy', { name: npc.name, gender: npc.gender, x: me.x + 1.6, z: me.z, heading: -Math.PI / 2 }); partner = { id: 'buddy', name: npc.name } }
    } else if (r.npcPos(npc.id)) partner = { id: npc.id, name: npc.name }
    else { const me = r.position; r.addActor('buddy', { name: npc.name, gender: npc.gender, x: me.x + 1.6, z: me.z, heading: -Math.PI / 2 }); partner = { id: 'buddy', name: npc.name } }
    setTask({ kind: 'talk', partner, role, setting: settingHere(), rounds: kind === 'chat' ? 2 : kind === 'food' ? 1 : 3, script: kind === 'food' ? FOOD_SCRIPT : undefined, title: kind === 'food' ? `Asking ${npc.name} for food` : kind === 'chat' ? `Chatting with ${npc.name}` : kind === 'hang' ? `Hanging out with ${npc.name}` : `Time with ${npc.name}`, actId, hidden })
  }
  useEffect(() => { if (g.talkReq) beginTalk(g.talkReq.kind, g.talkReq.role as NpcRole) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [g.talkReq])

  const startHang = (dest: PlaceId) => {
    const r = rendRef.current; if (!r || !destPick || !life) return
    const npc = life.npcs[destPick.npcId]; const me = r.position
    r.addActor('buddy', { name: npc.name, gender: npc.gender, x: me.x + 1.5, z: me.z + 0.5 })
    r.hideNpc(npc.id, true); r.followPlayer('buddy', true)
    setHang({ role: destPick.role, npcId: npc.id, name: npc.name, gender: npc.gender, dest }); setDestPick(null); track('hangout_destination', { setting: dest })
    const p = district.places.find((x) => x.id === dest)
    if (p) r.walkTo(p.door.x, p.door.z)
    g.toast(`🚶 Walking to ${p?.name ?? 'there'} with ${npc.name}…`)
  }
  const cancelHang = () => { const r = rendRef.current; if (r) { r.removeActor('buddy'); r.hideNpc(hang?.npcId ?? '', false); r.followPlayer('buddy', false) } setHang(null) }
  useEffect(() => {
    if (!hang || task) return
    const t = setInterval(() => {
      const r = rendRef.current; if (!r || r.inside || fade) return
      const d = district.places.find((x) => x.id === hang.dest); if (!d) return
      const me = r.position
      if (Math.hypot(me.x - d.door.x, me.z - d.door.z) > 2.2 || r.walking) return
      clearInterval(t)
      const npcRole = hang.role
      if (INTERIORS[hang.dest]) {
        r.removeActor('buddy')
        enter(hang.dest, undefined, () => {
          const rr = rendRef.current; if (!rr || !rr.inside) return
          const def = INTERIORS[rr.inside]!
          const person = def.people.find((p) => p.persistent === npcRole)
          if (person) rr.hidePerson(person.id, true)
          const hs = def.hotspots.find((h) => h.actions.some((a) => a.cmd === 'act:socialise')) ?? def.hotspots[0]
          rr.placePlayer(hs.x + 0.9, hs.z + 0.6, Math.PI)
          rr.addActor('buddy', { name: hang.name, gender: hang.gender, x: hs.x - 0.9, z: hs.z, heading: 0 })
          setTask({ kind: 'talk', partner: { id: 'buddy', name: hang.name }, role: npcRole, setting: rr.inside === 'mamaput' ? 'mamaput' : 'street', rounds: 3, title: `Hanging out with ${hang.name}`, actId: 'socialise', hidden: person?.id })
        })
      } else {
        r.followPlayer('buddy', false)
        setTask({ kind: 'talk', partner: { id: 'buddy', name: hang.name }, role: npcRole, setting: hang.dest === 'pitch' ? 'pitch' : 'street', rounds: 3, title: `Hanging out with ${hang.name}`, actId: 'socialise' })
      }
    }, 300)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hang, task, fade])

  const endTask = (perf?: number, donation = 0, spendAmt = 0, helperRole?: string) => {
    const r = rendRef.current; const t = task
    if (taskLog.current) { taskLog.current.perf = perf; taskLog.current.abandoned = perf === undefined && t?.kind !== 'shop' }
    setTask(null)
    if (!t) return
    if (t.kind === 'penalty') { if (perf !== undefined) g.act(t.act, { perf }) }
    else if (t.kind === 'chores') { if (perf !== undefined) g.act('chores', { perf, target: helperRole as NpcRole | undefined }) }
    else if (t.kind === 'cook' || t.kind === 'dine') { if (perf !== undefined) g.act('meal', { perf, spend: spendAmt }) }
    else if (t.kind === 'match') { if (perf !== undefined && perf >= 0) g.act(t.actAs, { perf }) }
    else if (t.kind === 'jog') { if (perf !== undefined) g.act('exercise', { perf }) }
    else if (t.kind === 'service') { if (perf !== undefined) g.act('community', { perf, donation }) }
    else if (t.kind === 'overtime') { if (perf !== undefined) g.act('overtime', { perf }) }
    else if (t.kind === 'market') { if (perf !== undefined) g.act('hustle', { perf }) }
    else if (t.kind === 'talk') {
      if (r) { r.removeActor('buddy'); if (t.hidden) r.hidePerson(t.hidden, false); if (hang) r.hideNpc(hang.npcId, false) }
      setHang(null)
      if (perf !== undefined && t.actId) g.act(t.actId, { target: t.role, perf })
    }
    r?.clearDirected()
  }

  const toggle = (k: 'light' | 'tv' | 'fan') => { const n = { ...appl, [k]: !appl[k] }; setAppl(n); rendRef.current?.setInteriorState({ ...n, hour: sleep ? sleep.from + sleep.elapsed : hour }); audio.sfx('click') }
  const runCmd = (a: HotAction) => {
    const cmd = a.cmd
    if (cmd === 'sleep') { setHotId(null); startSleep() }
    else if (cmd.startsWith('toggle:')) toggle(cmd.slice(7) as 'light' | 'tv' | 'fan')
    else if (cmd === 'pose:sofa' || cmd === 'pose:bed') { setHotId(null); setTask({ kind: 'pose', mode: cmd === 'pose:sofa' ? 'sofa' : 'bed' }) }
    else if (cmd === 'task:cook') { setHotId(null); const why = enabledAct('meal'); if (why) g.toast(why); else setTask({ kind: 'cook' }) }
    else if (cmd === 'task:dine') { setHotId(null); const why = enabledAct('meal'); if (why) g.toast(why); else setTask({ kind: 'dine' }) }
    else if (cmd === 'task:chores') { setHotId(null); beginChores() }
    else if (cmd === 'task:service') { setHotId(null); const why = enabledAct('community'); if (why) g.toast(why); else setTask({ kind: 'service' }) }
    else if (cmd === 'task:overtime') { setHotId(null); beginOvertime() }
    else if (cmd.startsWith('task:')) { setHotId(null); startStudy(cmd.slice(5) as StudyMode) }
    else if (cmd.startsWith('act:')) { setHotId(null); route(cmd.slice(4)) }
    else if (cmd.startsWith('chat:')) { setHotId(null); const role = cmd.slice(5); const n = Object.values(life!.npcs).find((x) => x.role === role && x.alive); if (n) g.openNpc(n.id) }
    else if (cmd === 'exit') { setHotId(null); leave() }
  }

  // sleeping: fast-forward the clock, wake any time
  const startSleep = () => {
    const r = rendRef.current; if (!r) return
    r.setSleeping(true); setSleep({ from: hour, elapsed: 0 }); audio.sfx('good'); track('sleep_started', { appliances_on: (appl.tv ? 1 : 0) + (appl.fan ? 1 : 0) + (appl.light ? 1 : 0) })
  }
  useEffect(() => {
    if (!sleep) return
    const t = setInterval(() => setSleep((s) => (s ? (s.elapsed >= 9 ? s : { ...s, elapsed: Math.min(9, s.elapsed + 0.2) }) : s)), 100)
    return () => clearInterval(t)
  }, [!!sleep])
  useEffect(() => { if (sleep) rendRef.current?.setHour(((sleep.from + sleep.elapsed) % 24)) }, [sleep])
  const wake = () => {
    if (!sleep) return
    const hrs = Math.round(sleep.elapsed * 2) / 2
    const raw = sleep.from + sleep.elapsed; const dayAdd = Math.floor(raw / 24); const h = raw % 24
    rendRef.current?.setSleeping(false)
    const on = (appl.tv ? 1 : 0) + (appl.fan ? 1 : 0) + (appl.light ? 1 : 0)
    track('sleep_ended', { hours_slept: hrs, appliances_on: on })
    g.act('rest', { hours: Math.max(0.5, hrs), appliancesOn: on })
    g.setHourTo(h, dayAdd)
    rendRef.current?.setHour(h)
    setSleep(null)
    g.toast(on ? `☀️ You woke up. Everything was left on: ₦${(on * 2500).toLocaleString()} gone on power.` : '☀️ You woke up rested.')
  }

  // joystick + tap to move
  const joy = useRef<{ id: number; cx: number; cy: number } | null>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0, on: false })
  const onJoyDown = (e: React.PointerEvent) => {
    if (modalOpen) return
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    joy.current = { id: e.pointerId, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    onJoyMove(e)
  }
  const onJoyMove = (e: React.PointerEvent) => {
    const j = joy.current; if (!j || e.pointerId !== j.id) return
    let dx = e.clientX - j.cx, dy = e.clientY - j.cy
    const m = Math.hypot(dx, dy), max = 44
    if (m > max) { dx = (dx / m) * max; dy = (dy / m) * max }
    setKnob({ x: dx, y: dy, on: true })
    const n = Math.hypot(dx, dy) / max
    rendRef.current?.setInput(n > 0.18 ? dx / max : 0, n > 0.18 ? dy / max : 0)
  }
  const onJoyUp = () => { joy.current = null; setKnob({ x: 0, y: 0, on: false }); rendRef.current?.setInput(0, 0) }

  const tap = useRef<{ x: number; y: number; t: number } | null>(null)
  const onCanvasDown = (e: React.PointerEvent) => { tap.current = { x: e.clientX, y: e.clientY, t: performance.now() } }
  const onCanvasUp = (e: React.PointerEvent) => {
    const t = tap.current; tap.current = null
    if (!t || modalOpen) return
    if (Math.hypot(e.clientX - t.x, e.clientY - t.y) < 10 && performance.now() - t.t < 400) {
      const p = rendRef.current?.pickGround(e.clientX, e.clientY)
      if (p && Math.abs(p.x) < WORLD.half && Math.abs(p.z) < WORLD.half) rendRef.current?.walkTo(p.x, p.z)
    }
  }

  if (!life) return null
  const c = life.character
  const nearPlace = near.place ? district.places.find((p) => p.id === near.place) : null
  const nearNpc = near.npc ? life.npcs[near.npc] : null
  void meta

  if (fail) return <div className="p-6 text-center"><p className="mb-3 opacity-80">Your device could not start the 3D world. Switching to menu mode.</p><button className="btn btn-primary" onClick={() => g.updateSettings({ lite: true })}>Use menu mode</button></div>

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#9ed3ff' }}>
      <div ref={host} className="absolute inset-0" onPointerDown={onCanvasDown} onPointerUp={onCanvasUp} />

      {/* top HUD: who you are, what you have, what is going on */}
      <div className={`absolute top-0 inset-x-0 pointer-events-none ${task ? 'hidden' : ''}`} style={{ paddingTop: 'calc(.5rem + var(--safe-t))' }}>
        <div className="flex items-start gap-2 px-2">
          <button className="hud-glass pointer-events-auto flex items-center gap-2.5 rounded-[22px] pl-1.5 pr-3 py-1.5 text-left flex-1 min-w-0" onClick={() => { audio.sfx('click'); g.openSheet('profile') }} aria-label={`${c.nickname || c.name}, age ${c.age}. Open profile`}>
            <span className="relative shrink-0 rounded-full overflow-hidden" style={{ width: 52, height: 52, background: 'radial-gradient(circle at 35% 25%, #ffe27a, #ff7a4d)', boxShadow: '0 0 0 2px #1a0f55, 0 0 0 4px var(--gold)' }}>
              <span className="block" style={{ marginTop: 1, marginLeft: -2 }}><Avatar look={c.appearance} gender={c.gender} age={c.age} uniform={c.edu.level !== 'none' && c.age < 18} size={56} /></span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="font-display text-[17px] uppercase truncate leading-none">{c.nickname || c.name}<span className="opacity-60 text-[13px]"> · {c.age}</span></span>
                <span className="flex items-center gap-1 shrink-0" aria-label={`Cash ${naira(c.stats.cash)}`}><Icon name="coin" size={19} /><span className="num text-[18px]" style={{ color: '#ffe27a' }}>{nairaShort(c.stats.cash)}</span></span>
              </span>
              <span className="flex items-center gap-1.5 mt-1.5" aria-label={`Energy ${c.stats.energy}`}>
                <Icon name="bolt" size={17} />
                <span className="bar flex-1 !h-[11px]"><i style={{ width: `${Math.max(0, Math.min(100, (c.stats.energy / Math.max(c.stats.maxEnergy, 1)) * 100))}%`, background: c.stats.energy / Math.max(c.stats.maxEnergy, 1) < 0.25 ? 'linear-gradient(180deg,#ff8a8d,#ff5a5f)' : 'linear-gradient(180deg,#fff08a,#ffc72c)' }} /></span>
                <span className="num text-[13px] w-6 text-right">{c.stats.energy}</span>
              </span>
            </span>
          </button>
          {!inside
            ? <Minimap district={district} x={pos.x} z={pos.z} h={pos.h} onOpen={() => { track('map_opened'); setMapOpen(true) }} />
            : <div className="hud-glass pointer-events-none rounded-2xl px-3 py-2 flex items-center gap-1.5 max-w-[40%]"><Icon name="door" size={18} /><span className="font-display text-[14px] uppercase leading-tight truncate">{INTERIORS[inside]?.name}</span></div>}
        </div>
        <div className="flex items-center gap-2 px-2 mt-2">
          <button className="hud-glass pointer-events-auto flex items-center gap-2.5 rounded-full px-2.5 py-1" onClick={() => g.openSheet('profile')} aria-label="Stats">
            <StatBadge stat="happiness" value={c.stats.happiness} size="sm" />
            <StatBadge stat="knowledge" value={c.stats.knowledge} size="sm" />
            <StatBadge stat="reputation" value={c.stats.reputation} size="sm" />
            {c.stats.health < 50 && <StatBadge stat="health" value={c.stats.health} size="sm" />}
            {c.stats.stress > 60 && <StatBadge stat="stress" value={c.stats.stress} size="sm" />}
          </button>
          <span className="ml-auto flex items-center gap-2">
            <span className="hud-glass pointer-events-auto flex items-center gap-1.5 rounded-full px-2.5 py-1.5" aria-label="Date and time"><Icon name={isNight(sleep ? sleep.from + sleep.elapsed : hour) ? 'moon' : 'sun'} size={17} /><span className="num text-[13px] whitespace-nowrap">{MONTHS[month]} · {fmtClock(sleep ? (sleep.from + sleep.elapsed) % 24 : hour)}</span></span>
            {!sleep && <RoundBtn icon="hourglass" label="Wait two hours" size={36} onClick={() => { track('wait_used'); g.advance(2); g.toast('Two hours pass') }} />}
          </span>
        </div>
        {menuOpen && (
          <div className="hud-glass mt-2 mr-2 ml-auto p-2 grid gap-1 pointer-events-auto w-56 rounded-2xl pop">
            {([['info', 'How to play', () => { setMenuOpen(false); setCoach(0); setReplay(true) }], ['clock', 'Play time', () => { setMenuOpen(false); g.openSheet('paywall') }], ['gear', 'Settings', () => { setMenuOpen(false); g.go('settings') }], ['scroll', 'Menu mode', () => g.updateSettings({ lite: true })]] as [IconName, string, () => void][]).map(([ic, label, fn]) => (
              <button key={label} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left font-extrabold active:bg-white/10" onClick={fn}><Icon name={ic} size={20} />{label}</button>
            ))}
          </div>
        )}
        {slow && <div className="hud-glass mt-2 mx-2 px-3 py-2 rounded-2xl text-sm flex items-center gap-2 pointer-events-auto"><span className="flex-1">Running slowly?</span><Btn size="sm" onClick={() => g.updateSettings({ lite: true })}>Menu mode</Btn></div>}
        {sug && !coachOn && !modalOpen && !inside && (
          <button className="pointer-events-auto mt-2 mx-2 flex items-center gap-2 rounded-full pl-1.5 pr-2 py-1 hud-glass active:scale-[.98] transition-transform" onClick={() => { audio.sfx('click'); g.goToPlace(sug.place) }} aria-label={`Next: ${sug.text}`}>
            <span className="grid place-items-center w-8 h-8 rounded-full text-[18px]" style={{ background: 'linear-gradient(180deg,#ffe27a,#f59e0b)' }}>{sug.icon}</span>
            <span className="font-display text-[15px] uppercase tracking-wide pr-1">{sug.text}</span>
            <span className="grid place-items-center w-7 h-7 rounded-full glow-pulse" style={{ background: 'var(--green)' }}><Icon name="chevron" size={16} color="#052e16" /></span>
          </button>
        )}
        {flash && life.lastAction && !modalOpen && !coachOn && (
          <div className="mx-2 mt-2 flex justify-center" key={flash} aria-label={life.lastAction.text}><DeltaChips deltas={life.lastAction.deltas} limit={5} /></div>
        )}
      </div>

      {coachOn && !modalOpen && (
        <div className="absolute inset-x-3 bottom-[8.4rem] z-20 pointer-events-auto">
          <Mentor mood={coach === 2 ? 'wow' : 'hype'} nextLabel={coach < 2 ? 'Next' : 'Got it!'} onNext={() => { if (coach < 2) setCoach(coach + 1); else { setReplay(false); g.finishTutorial() } }}>
            {coach === 0 && 'Drag the stick to walk. Tap the ground works too!'}
            {coach === 1 && `Walk to the glowing ring${sug ? ` at the ${district.places.find((p) => p.id === sug.place)?.name ?? 'place'}` : ''}, then tap the green button.`}
            {coach === 2 && 'Actions cost energy. Done for the year? Go home and end it.'}
          </Mentor>
          {coach < 2 && <button className="block mx-auto mt-1 text-[12px] font-extrabold uppercase tracking-wider opacity-70" onClick={() => { setReplay(false); g.finishTutorial() }}>Skip</button>}
        </div>
      )}

      {mapOpen && <MapModal district={district} x={pos.x} z={pos.z} h={pos.h} hour={hour} life={life} sugPlace={sug?.place ?? null} onClose={() => setMapOpen(false)} onGo={(id) => { track('map_travel', { place: id }); setMapOpen(false); g.goToPlace(id) }} />}

      {/* proximity prompts: one big round action button, like a controller prompt */}
      {!modalOpen && !inside && !task && (nearNpc || nearPlace) && (
        <div className="absolute right-3 bottom-[7rem] flex items-end gap-3 pointer-events-none">
          {nearPlace && INTERIORS[nearPlace.id] && <Prompt small icon="menu" label="Options" tone="ghost" onClick={() => g.openPlace(near.place!)} />}
          {nearNpc && <Prompt small icon="chat" label={nearNpc.name} tone="gold" onClick={() => g.openNpc(near.npc!)} />}
          {nearPlace && INTERIORS[nearPlace.id] && (isOpen(nearPlace.id, hour)
            ? <Prompt icon="door" label={`Enter ${nearPlace.name}`} tone="green" hint="E" onClick={() => enter(nearPlace.id)} />
            : <Prompt icon="lock" label={`Opens ${fmtClock(opensAt(nearPlace.id))}`} tone="ghost" onClick={() => enter(nearPlace.id)} />)}
          {nearPlace && !INTERIORS[nearPlace.id] && <Prompt emoji={nearPlace.icon} label={nearPlace.name} tone="green" hint="E" onClick={() => g.openPlace(near.place!)} />}
        </div>
      )}
      {!modalOpen && inside && !task && (
        <div className="absolute right-3 bottom-[7rem] flex items-end gap-3 pointer-events-none">
          {nearIn.exit && <Prompt small icon="door" label="Go outside" tone="ghost" onClick={leave} />}
          {nearIn.person && <Prompt small icon="chat" label={rendRef.current?.personAt(nearIn.person)?.name ?? 'Talk'} tone="gold" onClick={() => talkInside(nearIn.person!)} />}
          {nearIn.hotspot && (() => { const h = INTERIORS[inside]?.hotspots.find((x) => x.id === nearIn.hotspot); return h ? <Prompt emoji={h.icon} label={h.name} tone="green" hint="E" onClick={() => setHotId(h.id)} /> : null })()}
        </div>
      )}

      {task?.kind === 'study' && rendRef.current && <StudyTask r={rendRef.current} mode={task.mode} onDone={() => setTask(null)} />}
      {task?.kind === 'penalty' && rendRef.current && <PenaltyTask r={rendRef.current} pitch={district.places.find((p) => p.id === 'pitch')!.rect} onDone={(perf) => endTask(perf)} />}
      {task?.kind === 'chores' && rendRef.current && <ChoresTask r={rendRef.current} motherId={INTERIORS.home?.people.find((p) => p.persistent === 'mother')?.id ?? null} helper={task.helper} onDone={(perf, hr) => endTask(perf, 0, 0, hr)} />}
      {task?.kind === 'pose' && rendRef.current && <PoseTask r={rendRef.current} mode={task.mode} tvOn={appl.tv} onToggleTv={() => toggle('tv')} onWatch={() => { const why = enabledAct('tv'); if (why) g.toast(why); else g.act('tv') }} onSleep={() => startSleep()} onDone={() => setTask(null)} />}
      {task?.kind === 'cook' && rendRef.current && <CookTask r={rendRef.current} free={life.character.housing.type === 'family'} onDone={(perf, sp) => endTask(perf, 0, sp)} />}
      {task?.kind === 'dine' && rendRef.current && <DineTask r={rendRef.current} cash={life.character.stats.cash} onDone={(perf, sp) => endTask(sp ? perf : undefined, 0, sp)} />}
      {task?.kind === 'match' && rendRef.current && <MatchTask r={rendRef.current} pitch={district.places.find((p) => p.id === 'pitch')!.rect} actAs={task.actAs} onDone={(perf) => endTask(perf)} />}
      {task?.kind === 'jog' && rendRef.current && <JogTask r={rendRef.current} pitch={district.places.find((p) => p.id === 'pitch')!.rect} onDone={(perf) => endTask(perf)} />}
      {task?.kind === 'shop' && rendRef.current && <ShopTask r={rendRef.current} items={getShopItems(life)} cash={life.character.stats.cash} energy={life.character.stats.energy} onBuy={(itemId, pricePct) => g.act('shop', { itemId, pricePct })} onDeliver={(id, mode) => g.orderDelivery(id, mode === 'loader' ? 2 : 0, mode === 'loader' ? 3000 : 0)} onDone={() => endTask()} />}
      {task?.kind === 'service' && rendRef.current && <WorshipTask r={rendRef.current} cash={life.character.stats.cash} onDone={(perf, don) => endTask(perf, don)} />}
      {task?.kind === 'overtime' && rendRef.current && <OvertimeTask r={rendRef.current} onDone={(perf) => endTask(perf)} />}
      {task?.kind === 'market' && rendRef.current && <MarketTask r={rendRef.current} spot={{ x: district.places.find((p) => p.id === 'market')!.door.x, z: district.places.find((p) => p.id === 'market')!.door.z + 2.1 }} onDone={(perf) => endTask(perf)} />}
      {task?.kind === 'talk' && rendRef.current && <TalkTask r={rendRef.current} partner={task.partner} role={task.role} setting={task.setting} rounds={task.rounds} title={task.title} greet={task.greet} script={task.script} onDone={(perf) => endTask(perf)} />}
      {hang && !task && (
        <div className="absolute left-3 right-3 bottom-[5.4rem] z-20 card px-3 py-2 flex items-center gap-2 pointer-events-auto" style={{ background: '#1d3a2aee' }}><span className="flex-1 text-sm font-bold">🚶 With {hang.name} → {district.places.find((p) => p.id === hang.dest)?.name}</span><button className="chip" onClick={cancelHang}>✖ Cancel</button></div>
      )}
      {coopPick && (
        <Modal onClose={() => setCoopPick(null)}>
          <div className="font-display text-[26px] text-white leading-none">Team up?</div>
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {coopPick.map((h) => <button key={h.role} className="tile" onClick={() => { audio.sfx('click'); const f = pendingChores.current; setCoopPick(null); f?.(h) }}><span className="text-[32px] leading-none">🤝</span><span className="font-display text-[15px] uppercase">{h.name}</span><span className="chip chip-green !py-0.5">Faster</span></button>)}
            <button className="tile" onClick={() => { audio.sfx('click'); const f = pendingChores.current; setCoopPick(null); f?.() }}><span className="text-[32px] leading-none">🧍</span><span className="font-display text-[15px] uppercase">Solo</span></button>
          </div>
        </Modal>
      )}
      {destPick && (
        <Modal onClose={() => setDestPick(null)}>
          <div className="font-display text-[26px] text-white leading-none">Where to, with {life.npcs[destPick.npcId]?.name}?</div>
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <button className="tile" onClick={() => { audio.sfx('click'); startHang('pitch') }}><span className="text-[32px] leading-none">⚽</span><span className="font-display text-[15px] uppercase text-center">{district.places.find((p) => p.id === 'pitch')?.name}</span></button>
            <button className="tile" onClick={() => { audio.sfx('click'); startHang('mamaput') }} disabled={!isOpen('mamaput', hour)}><span className="text-[32px] leading-none">{isOpen('mamaput', hour) ? '🍲' : '🔒'}</span><span className="font-display text-[15px] uppercase text-center">{district.places.find((p) => p.id === 'mamaput')?.name}</span>{!isOpen('mamaput', hour) && <span className="chip chip-gold !py-0.5">{fmtClock(opensAt('mamaput'))}</span>}</button>
          </div>
        </Modal>
      )}

      {/* joystick */}
      {(!task || task.kind === 'chores' || task.kind === 'shop' || task.kind === 'jog' || task.kind === 'match') && (
        <div className="joy absolute left-4 bottom-[7rem] w-[116px] h-[116px] rounded-full touch-none" style={{ touchAction: 'none' }}
          onPointerDown={onJoyDown} onPointerMove={onJoyMove} onPointerUp={onJoyUp} onPointerCancel={onJoyUp} aria-label="Movement joystick">
          {[0, 90, 180, 270].map((r) => <span key={r} className="absolute left-1/2 top-1/2 opacity-45" style={{ transform: `translate(-50%,-50%) rotate(${r}deg) translateY(-44px)` }}><Icon name="up" size={11} color="#fff" /></span>)}
          <div className="joy-knob absolute w-[50px] h-[50px] rounded-full" style={{ left: 'calc(50% - 25px)', top: 'calc(50% - 25px)', transform: `translate(${knob.x}px, ${knob.y}px) scale(${knob.on ? 1.08 : 1})`, transition: knob.on ? 'none' : 'transform .18s var(--ease)' }} />
        </div>
      )}

      {hotId && inside && (() => {
        const h = INTERIORS[inside]?.hotspots.find((x) => x.id === hotId); if (!h) return null
        const acts = getActivities(life)
        return (
          <Modal onClose={() => setHotId(null)}>
            <div className="flex items-center gap-3"><div className="w-14 h-14 rounded-[18px] grid place-items-center text-3xl" style={{ background: 'radial-gradient(circle at 30% 20%, #8a5cff, #3b22a8)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.25)' }}>{h.icon}</div><div className="font-display text-[26px] text-white leading-none">{h.name}</div></div>
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              {h.actions.filter((a) => !a.needs || installed.has(a.needs)).map((a) => {
                const isAct = a.cmd.startsWith('act:'); const ar = isAct ? acts.find((x) => x.def.id === a.cmd.slice(4)) : null
                const tg = a.cmd.startsWith('toggle:') ? appl[a.cmd.slice(7) as 'light' | 'tv' | 'fan'] : null
                const isSleep = a.cmd === 'sleep'
                const dis = (isAct && (!ar?.enabled || life.phase !== 'action')) || (isSleep && life.phase !== 'action')
                return (
                  <button key={a.label} className={`tile ${tg ? 'is-on' : ''}`} disabled={dis} onClick={() => runCmd(a)}>
                    <span className="text-[32px] leading-none">{dis && isAct && !ar?.enabled ? '🔒' : a.icon}</span>
                    <span className="font-display text-[14px] leading-tight text-center uppercase">{a.label}</span>
                    {tg !== null ? <span className={`chip !py-0.5 ${tg ? 'chip-green' : ''}`}>{tg ? 'ON' : 'OFF'}</span> : ar ? (ar.enabled ? <span className="chip !py-0.5">{ar.def.cost.energy ? <><Icon name="bolt" size={12} color="#ffd23f" />{ar.def.cost.energy}</> : 'free'}</span> : <span className="text-[11px] font-bold text-yellow-300 text-center leading-tight">{ar.reason}</span>) : null}
                  </button>
                )
              })}
            </div>
            {h.id === 'bed' && (appl.tv || appl.fan || appl.light) && <div className="hud-glass rounded-2xl px-3 py-2 mt-3 text-sm">Still on: {[appl.light && '💡', appl.tv && '📺', appl.fan && '🌀'].filter(Boolean).join(' ')}. Switch off before sleeping.</div>}
          </Modal>
        )
      })()}

      {sleep && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-24 pointer-events-auto" style={{ background: 'rgba(5,6,24,0.55)' }}>
          <div className="text-6xl animate-pulse">😴</div>
          <div className="font-display text-4xl text-danfo mt-2">{fmtClock((sleep.from + sleep.elapsed) % 24)}</div>
          <div className="text-sm opacity-80 mb-4">{Math.round(sleep.elapsed * 10) / 10}h asleep{(appl.tv || appl.fan || appl.light) ? ' · appliances still on 💸' : ''}</div>
          <button className="btn btn-primary !text-xl" onClick={wake}>☀️ Wake up</button>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none z-40 transition-opacity duration-300" style={{ background: '#0b0a14', opacity: fade ? 1 : 0 }} />

      {/* dock */}
      {!task && (
        <nav className="absolute bottom-0 inset-x-0 z-10 px-3 pt-8 safe-pad dock-fade pointer-events-none" aria-label="Main">
          <div className="hud-glass pointer-events-auto mx-auto max-w-sm flex items-end justify-between rounded-[28px] px-2 pt-1.5 pb-1.5">
            <DockBtn icon="pin" label="Places" onClick={() => g.openSheet('places')} />
            <DockBtn icon="scroll" label="Quests" onClick={() => g.openSheet('quests')} />
            <button className="relative -mt-7 flex flex-col items-center gap-0.5" onClick={() => { audio.sfx('good'); if (inside) leave(); else g.goToPlace('home') }} aria-label={inside ? 'Go outside' : 'Go home'}>
              <span className={`btn btn-gold btn-round !w-[66px] !h-[66px] ${sug?.place === 'home' && !inside ? 'glow-pulse' : ''}`}><Icon name={inside ? 'door' : 'home'} size={32} color="#7a4700" /></span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider">{inside ? 'Outside' : 'Home'}</span>
            </button>
            <DockBtn icon="user" label="Profile" onClick={() => g.openSheet('profile')} />
            <DockBtn icon="menu" label="More" onClick={() => setMenuOpen((v) => !v)} />
          </div>
        </nav>
      )}
    </div>
  )
}

function DockBtn({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button className="flex flex-col items-center gap-0.5 w-[58px] py-1 active:scale-95 transition-transform" onClick={() => { audio.sfx('tap'); onClick() }} aria-label={label}>
      <Icon name={icon} size={28} /><span className="text-[10px] font-extrabold uppercase tracking-wider opacity-85">{label}</span>
    </button>
  )
}

/** A controller-style action prompt: round button, name chip above, key hint on desktop. */
function Prompt({ icon, emoji, label, tone, hint, small, onClick }: { icon?: IconName; emoji?: string; label: string; tone: 'green' | 'gold' | 'ghost'; hint?: string; small?: boolean; onClick: () => void }) {
  const d = small ? 54 : 80
  useEffect(() => { if (!small) audio.sfx('prompt') }, [label, small])
  return (
    <div className="flex flex-col items-center gap-1.5 pointer-events-auto pop max-w-[132px]">
      <span className="chip !text-[11px] !py-0.5 text-center leading-tight" style={{ background: 'rgba(10,7,34,.78)', backdropFilter: 'blur(4px)' }}>{label}</span>
      <button className={`btn btn-${tone} btn-round ${small ? '' : 'glow-pulse'}`} style={{ width: d, height: d, minHeight: d }} onClick={() => { audio.sfx('click'); onClick() }} aria-label={label}>
        {emoji ? <span style={{ fontSize: d * 0.5, lineHeight: 1 }}>{emoji}</span> : <Icon name={icon!} size={d * 0.48} color={tone === 'gold' ? '#7a4700' : '#fff'} />}
        {hint && <kbd className="kbd-hint absolute -bottom-1 -right-1 place-items-center w-5 h-5 rounded-md text-[11px] font-black" style={{ background: '#fff', color: '#1a0f55' }}>{hint}</kbd>}
      </button>
    </div>
  )
}

function drawBase(district: District, S: number) {
  const c = document.createElement('canvas'); c.width = c.height = S
  const g = c.getContext('2d')!
  const k = S / (WORLD.half * 2)
  const X = (v: number) => (v + WORLD.half) * k
  g.fillStyle = '#' + district.theme.ground.toString(16).padStart(6, '0'); g.fillRect(0, 0, S, S)
  g.fillStyle = '#4b4b55'; for (const r of district.roads) g.fillRect(X(r.x0), X(r.z0), (r.x1 - r.x0) * k, (r.z1 - r.z0) * k)
  g.fillStyle = '#d9c9a8'; for (const b of district.buildings) g.fillRect(X(b.rect.x0), X(b.rect.z0), (b.rect.x1 - b.rect.x0) * k, (b.rect.z1 - b.rect.z0) * k)
  return c
}
function drawPlayer(g: CanvasRenderingContext2D, S: number, x: number, z: number, h: number, size: number) {
  const k = S / (WORLD.half * 2)
  g.save(); g.translate((x + WORLD.half) * k, (z + WORLD.half) * k); g.rotate(-h + Math.PI)
  g.fillStyle = '#ffd23f'; g.strokeStyle = '#1c1b22'; g.lineWidth = Math.max(2, size / 3); g.beginPath(); g.moveTo(0, -size); g.lineTo(size * 0.78, size * 0.9); g.lineTo(-size * 0.78, size * 0.9); g.closePath(); g.fill(); g.stroke(); g.restore()
}

function Minimap({ district, x, z, h, onOpen }: { district: District; x: number; z: number; h: number; onOpen: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const S = 92, R = S * 2
  const base = useMemo(() => {
    const c = drawBase(district, R); const g = c.getContext('2d')!; const k = R / (WORLD.half * 2)
    g.font = `${S * 0.24}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'
    for (const p of district.places) { const X = (p.door.x + WORLD.half) * k, Y = (p.door.z + WORLD.half) * k; g.fillStyle = '#2a1a7acc'; g.beginPath(); g.arc(X, Y, S * 0.12, 0, Math.PI * 2); g.fill(); g.fillText(p.icon, X, Y + 1) }
    return c
  }, [district])
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const g = cv.getContext('2d')!
    g.clearRect(0, 0, R, R); g.drawImage(base, 0, 0); drawPlayer(g, R, x, z, h, 9)
  }, [base, x, z, h])
  return (
    <button className="relative rounded-full pointer-events-auto shrink-0 p-0" style={{ width: S, height: S }} onClick={onOpen} aria-label="Open the full map">
      <canvas ref={ref} width={R} height={R} className="rounded-full" style={{ width: S, height: S, border: '3px solid rgba(255,255,255,.85)', boxShadow: '0 0 0 3px #3b22a8, 0 6px 16px rgba(0,0,0,.5)' }} />
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 chip chip-gold !py-0 !px-1.5 !text-[10px]"><Icon name="map" size={11} color="#3b2300" />MAP</span>
    </button>
  )
}

function MapModal({ district, x, z, h, hour, life, sugPlace, onClose, onGo }: { district: District; x: number; z: number; h: number; hour: number; life: NonNullable<ReturnType<typeof useGame.getState>['life']>; sugPlace: PlaceId | null; onClose: () => void; onGo: (id: PlaceId) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [sel, setSel] = useState<PlaceId | null>(sugPlace)
  const S = 640
  const base = useMemo(() => drawBase(district, S), [district])
  const stateOf = (id: PlaceId) => (!isOpen(id, hour) ? 'closed' : placeActive(life, id) ? 'open' : 'inactive')
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const g = cv.getContext('2d')!; const k = S / (WORLD.half * 2)
    g.clearRect(0, 0, S, S); g.drawImage(base, 0, 0)
    g.font = '28px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'
    for (const p of district.places) {
      const X = (p.door.x + WORLD.half) * k, Y = (p.door.z + WORLD.half) * k, st = stateOf(p.id)
      g.beginPath(); g.arc(X, Y, 24, 0, Math.PI * 2); g.fillStyle = st === 'open' ? '#2a1a7a' : '#55555f'; g.fill()
      g.lineWidth = p.id === sel ? 6 : p.id === sugPlace ? 5 : 2; g.strokeStyle = p.id === sel ? '#2bd978' : p.id === sugPlace ? '#ffc72c' : '#ffffffaa'; g.stroke()
      g.fillText(st === 'closed' ? '🔒' : p.icon, X, Y + 2)
    }
    drawPlayer(g, S, x, z, h, 16)
  }, [base, x, z, h, sel, sugPlace, hour])
  const tap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const wx = ((e.clientX - r.left) / r.width) * WORLD.half * 2 - WORLD.half, wz = ((e.clientY - r.top) / r.height) * WORLD.half * 2 - WORLD.half
    let best: PlaceId | null = null, bd = 12
    for (const p of district.places) { const d = Math.hypot(p.door.x - wx, p.door.z - wz); if (d < bd) { bd = d; best = p.id } }
    if (best) setSel(best)
  }
  const place = district.places.find((p) => p.id === sel)
  const st = sel ? stateOf(sel) : null
  return (
    <Modal title={DISTRICTS[life.character.housing.districtId]?.name ?? 'Your area'} onClose={onClose}>
      <canvas ref={ref} width={S} height={S} className="w-full rounded-3xl touch-none" style={{ border: '3px solid rgba(255,255,255,.7)', boxShadow: '0 8px 24px rgba(0,0,0,.5)', aspectRatio: '1 / 1' }} onPointerUp={tap} aria-label="Map. Tap a place to select it." />
      <div className="flex gap-1.5 mt-2 text-[11px] font-bold opacity-80"><span className="chip !py-0.5">▲ You</span><span className="chip chip-gold !py-0.5">Next stop</span><span className="chip !py-0.5">🔒 Closed</span></div>
      {place ? (
        <div className="hud-glass rounded-2xl p-3 mt-3 flex items-center gap-3 pop" key={place.id}>
          <div className="w-12 h-12 rounded-2xl grid place-items-center text-3xl shrink-0" style={{ background: 'radial-gradient(circle at 30% 20%, #8a5cff, #3b22a8)' }}>{st === 'closed' ? '🔒' : place.icon}</div>
          <div className="flex-1 min-w-0"><div className="font-display uppercase leading-tight">{place.name}</div>{st !== 'open' && <div className="text-xs text-yellow-300 font-bold">{st === 'closed' ? `Opens ${fmtClock(opensAt(place.id))}` : 'Nothing here now'}</div>}</div>
          {st !== 'inactive' && <Btn variant="green" size="sm" onClick={() => onGo(place.id)}><Icon name="pin" size={16} /> Go</Btn>}
        </div>
      ) : <div className="text-sm opacity-70 text-center mt-3">Tap a place</div>}
      <div className="grid grid-cols-4 gap-2 mt-3">
        {district.places.map((p) => <button key={p.id} className={`tile !min-h-[64px] !p-1 ${p.id === sel ? 'is-on' : ''}`} style={{ opacity: stateOf(p.id) === 'open' ? 1 : 0.55 }} onClick={() => setSel(p.id)} aria-label={p.name}><span className="text-2xl leading-none">{stateOf(p.id) === 'closed' ? '🔒' : p.icon}</span></button>)}
      </div>
    </Modal>
  )
}
