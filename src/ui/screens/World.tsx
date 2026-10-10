import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../store'
import { DeltaChips, Modal, StatBar, naira, nairaShort } from '../components'
import { getActivities } from '@engine/api'
import { useActivityRouter } from '../useActivities'
import { buildDistrict, DISTRICTS, SPAWN, WORLD, type District, type PlaceId } from '../../world/layout'
import { WorldRenderer, type Near, type NearInside, type WorldNpc } from '../../world/WorldRenderer'
import { INTERIORS, type HotAction } from '../../world/interiors'
import { fmtClock, isNight, isOpen, opensAt } from '../../world/time'
import type { NpcRole } from '@engine/core/types'
import { StudyTask, type StudyMode } from '../tasks/StudyTask'
import { PenaltyTask } from '../tasks/PenaltyTask'
import { MarketTask } from '../tasks/MarketTask'
import { ChoresTask } from '../tasks/ChoresTask'
import { OvertimeTask } from '../tasks/OvertimeTask'
import { WorshipTask } from '../tasks/WorshipTask'
import { TalkTask, type Partner } from '../tasks/TalkTask'
import type { Setting } from '@content/dialogue'
import { npcSpot, placeActive, suggest } from '../../world/guide'
import { audio } from '@platform/audio'

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
    | { kind: 'chores' }
    | { kind: 'overtime' }
    | { kind: 'service' }
    | { kind: 'talk'; partner: Partner; role: NpcRole; setting: Setting; rounds: number; title: string; actId: string; hidden?: string }
  const [task, setTask] = useState<Task | null>(null)
  const [hang, setHang] = useState<{ role: NpcRole; npcId: string; name: string; gender: 'male' | 'female'; dest: PlaceId } | null>(null)
  const [destPick, setDestPick] = useState<{ role: NpcRole; npcId: string } | null>(null)
  const hourRef = useRef(hour); hourRef.current = hour
  const host = useRef<HTMLDivElement>(null)
  const rendRef = useRef<WorldRenderer | null>(null)
  const [near, setNear] = useState<Near>({ place: null, npc: null })
  const [fail, setFail] = useState(false)
  const [pos, setPos] = useState({ x: SPAWN.x, z: SPAWN.z, h: 0 })
  const [showHud, setShowHud] = useState(false)
  const [slow, setSlow] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [coach, setCoach] = useState(0)
  const [replay, setReplay] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const districtId = life?.character.housing.districtId ?? 'surulere'
  const district = useMemo<District>(() => buildDistrict(districtId), [districtId])
  const age = life?.character.age ?? 6
  const ageBand = age < 12 ? 0 : age < 18 ? 1 : 2
  const modalOpen = !!g.sheet || life?.phase !== 'action' || (!!life?.quiz && !task) || (!!task && task.kind !== 'chores') || !!destPick || !!hotId || !!sleep || fade || mapOpen

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
    try { r = new WorldRenderer(el, district, { look: c.appearance, age: c.age, uniform: c.edu.level !== 'none' && c.age < 18, month, hour: hourRef.current, spawn: SPAWN }) } catch { setFail(true); return }
    rendRef.current = r
    r.onNear(setNear)
    r.onNearInside((n) => {
      setNearIn(n)
      if (intent.current === 'sleep' && n.hotspot === 'bed') { intent.current = null; setHotId('bed') }
    })
    r.onPosition((x, z, h) => setPos({ x, z, h }))
    r.onSlow(() => setSlow(true))
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
      const spot = npcSpot(n.role)
      if (!spot) continue
      if (n.role === 'boss' && !life.character.job) continue
      if (n.role === 'child' && n.id !== life.character.childrenIds[0]) continue
      list.push({ id: n.id, name: n.name, gender: n.gender, x: spot.x, z: spot.z, role: n.role })
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
      if (r.enterInterior(place, people, st, { x: p.door.x, z: p.door.z })) {
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
    const npc = info.persistent ? Object.values(life!.npcs).find((n) => n.role === info.persistent && n.alive) : null
    if (npc) g.openNpc(npc.id)
    else g.toast(`${info.name}: “${info.line}”`)
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
    if (r.inside === 'home') { setTask({ kind: 'chores' }); return }
    enter('home', undefined, () => setTask({ kind: 'chores' }))
  }
  useEffect(() => { if (g.startChoresReq) beginChores() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [g.startChoresReq])

  const settingHere = (): Setting => { const p = rendRef.current?.inside; return p === 'home' ? 'home' : p === 'mamaput' ? 'mamaput' : p === 'school' ? 'school' : p === 'office' ? 'office' : near.place === 'pitch' ? 'pitch' : 'street' }
  const beginTalk = (kind: 'chat' | 'hang' | 'family', role: NpcRole) => {
    const r = rendRef.current; if (!r || !life) return
    const npc = life.npcs[life.roles[role] ?? ''] ?? (role === 'child' ? life.npcs[life.character.childrenIds[0]] : undefined); if (!npc) return
    const actId = kind === 'chat' ? 'chat' : kind === 'hang' ? 'socialise' : 'familyTime'
    const why = enabledAct(actId); if (why) { g.toast(why); return }
    if (kind === 'hang' && !r.inside && role !== 'mother' && role !== 'father' && role !== 'sibling' && role !== 'child') { setDestPick({ role, npcId: npc.id }); return }
    let partner: Partner; let hidden: string | undefined
    if (r.inside) {
      const def = INTERIORS[r.inside]; const person = def?.people.find((p) => p.persistent === role)
      if (person) partner = { id: person.id, name: npc.name }
      else { const me = r.position; r.addActor('buddy', { name: npc.name, gender: npc.gender, x: me.x + 1.6, z: me.z, heading: -Math.PI / 2 }); partner = { id: 'buddy', name: npc.name } }
    } else if (r.npcPos(npc.id)) partner = { id: npc.id, name: npc.name }
    else { const me = r.position; r.addActor('buddy', { name: npc.name, gender: npc.gender, x: me.x + 1.6, z: me.z, heading: -Math.PI / 2 }); partner = { id: 'buddy', name: npc.name } }
    setTask({ kind: 'talk', partner, role, setting: settingHere(), rounds: kind === 'chat' ? 2 : 3, title: kind === 'chat' ? `Chatting with ${npc.name}` : kind === 'hang' ? `Hanging out with ${npc.name}` : `Time with ${npc.name}`, actId, hidden })
  }
  useEffect(() => { if (g.talkReq) beginTalk(g.talkReq.kind, g.talkReq.role as NpcRole) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [g.talkReq])

  const startHang = (dest: PlaceId) => {
    const r = rendRef.current; if (!r || !destPick || !life) return
    const npc = life.npcs[destPick.npcId]; const me = r.position
    r.addActor('buddy', { name: npc.name, gender: npc.gender, x: me.x + 1.5, z: me.z + 0.5 })
    r.hideNpc(npc.id, true); r.followPlayer('buddy', true)
    setHang({ role: destPick.role, npcId: npc.id, name: npc.name, gender: npc.gender, dest }); setDestPick(null)
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

  const endTask = (perf?: number, donation = 0) => {
    const r = rendRef.current; const t = task
    setTask(null)
    if (!t) return
    if (t.kind === 'penalty') { if (perf !== undefined) g.act(t.act, { perf }) }
    else if (t.kind === 'chores') { if (perf !== undefined) g.act('chores', { perf }) }
    else if (t.kind === 'service') { if (perf !== undefined) g.act('community', { perf, donation }) }
    else if (t.kind === 'overtime') { if (perf !== undefined) g.act('overtime', { perf }) }
    else if (t.kind === 'market') { if (perf !== undefined) g.act('hustle', { perf }) }
    else if (t.kind === 'talk') {
      if (r) { r.removeActor('buddy'); if (t.hidden) r.hidePerson(t.hidden, false); if (hang) r.hideNpc(hang.npcId, false) }
      setHang(null)
      if (perf !== undefined) g.act(t.actId, { target: t.role, perf })
    }
    r?.clearDirected()
  }

  const toggle = (k: 'light' | 'tv' | 'fan') => { const n = { ...appl, [k]: !appl[k] }; setAppl(n); rendRef.current?.setInteriorState({ ...n, hour: sleep ? sleep.from + sleep.elapsed : hour }); audio.sfx('click') }
  const runCmd = (a: HotAction) => {
    const cmd = a.cmd
    if (cmd === 'sleep') { setHotId(null); startSleep() }
    else if (cmd.startsWith('toggle:')) toggle(cmd.slice(7) as 'light' | 'tv' | 'fan')
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
    r.setSleeping(true); setSleep({ from: hour, elapsed: 0 }); audio.sfx('good')
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
  const reserved = Number(life.flags.__reserved ?? 0)
  const nearPlace = near.place ? district.places.find((p) => p.id === near.place) : null
  const nearNpc = near.npc ? life.npcs[near.npc] : null
  const delta = (k: string) => life.yearDeltas.filter((d) => d.stat === k).reduce((a, d) => a + d.delta, 0)
  void meta

  if (fail) return <div className="p-6 text-center"><p className="mb-3 opacity-80">Your device could not start the 3D world. Switching to menu mode.</p><button className="btn btn-primary" onClick={() => g.updateSettings({ lite: true })}>Use menu mode</button></div>

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#9ed3ff' }}>
      <div ref={host} className="absolute inset-0" onPointerDown={onCanvasDown} onPointerUp={onCanvasUp} />

      {/* top HUD */}
      <div className={`absolute top-2 left-2 right-2 pointer-events-none ${task ? 'hidden' : ''}`}>
        <div className="flex items-start gap-2">
          <button className="card px-3 py-1.5 pointer-events-auto text-left flex-1 min-w-0" style={{ background: '#1e1a30ee' }} onClick={() => setShowHud((v) => !v)} aria-label="Toggle stats">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-xl text-danfo truncate">{c.nickname || c.name}, {c.age}</span>
              <span className="font-display text-2xl text-green-300 tabular-nums" aria-label={`Cash ${naira(c.stats.cash)}`}>{nairaShort(c.stats.cash)}</span>
            </div>
            <div className="flex gap-2 items-center mt-1">
              <div className="flex-1"><StatBar stat="energy" value={c.stats.energy} max={Math.max(c.stats.maxEnergy, 1)} delta={0} /></div>
              {!showHud && <span className="text-[11px] font-bold opacity-80">😊{c.stats.happiness} 📚{c.stats.knowledge} ⭐{c.stats.reputation}</span>}
            </div>
            {showHud && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1.5">
                <StatBar stat="happiness" value={c.stats.happiness} delta={delta('happiness')} />
                <StatBar stat="knowledge" value={c.stats.knowledge} delta={delta('knowledge')} />
                <StatBar stat="reputation" value={c.stats.reputation} delta={delta('reputation')} />
                <StatBar stat="health" value={c.stats.health} delta={delta('health')} />
                <StatBar stat="stress" value={c.stats.stress} delta={delta('stress')} />
                <div className="text-[11px] opacity-70 self-end">{reserved > 0 ? `${c.edu.level !== 'none' ? 'School' : 'Work'} uses ⚡${reserved}` : ''}</div>
              </div>
            )}
          </button>
          {!inside && <Minimap district={district} x={pos.x} z={pos.z} h={pos.h} onOpen={() => setMapOpen(true)} />}
        </div>
        <div className="flex gap-2 mt-1.5 items-center">
          <span className="chip pointer-events-auto" style={{ background: '#1e1a30ee' }} aria-label="Date and time">📅 {MONTHS[month]} · {isNight(sleep ? sleep.from + sleep.elapsed : hour) ? '🌙' : '☀️'} {fmtClock(sleep ? (sleep.from + sleep.elapsed) % 24 : hour)}</span>
          {!sleep && <button className="chip pointer-events-auto" style={{ background: '#1e1a30ee' }} onClick={() => { g.advance(2); g.toast('⏳ Two hours pass.') }} aria-label="Wait two hours">⏳ Wait</button>}
          <button className="chip pointer-events-auto ml-auto" style={{ background: '#1e1a30ee' }} onClick={() => setMenuOpen((v) => !v)} aria-label="More">☰</button>
        </div>
        {menuOpen && (
          <div className="card mt-1.5 p-2 grid gap-1.5 pointer-events-auto w-56 ml-auto" style={{ background: '#1e1a30f5' }}>
            <button className="chip justify-start" onClick={() => { setMenuOpen(false); setCoach(0); setReplay(true) }}>❓ How to play</button>
            <button className="chip justify-start" onClick={() => { setMenuOpen(false); g.openSheet('paywall') }}>⏱ Playtime</button>
            <button className="chip justify-start" onClick={() => { setMenuOpen(false); g.go('settings') }}>⚙️ Settings</button>
            <button className="chip justify-start" onClick={() => g.updateSettings({ lite: true })}>📋 Menu mode</button>
          </div>
        )}
        {slow && <div className="card mt-1.5 px-3 py-2 text-sm flex items-center gap-2 pointer-events-auto" style={{ background: '#5a3d00ee' }}><span className="flex-1">🐢 Running slowly?</span><button className="btn btn-primary !min-h-8 !px-3 !py-1 text-sm" onClick={() => g.updateSettings({ lite: true })}>Menu mode</button></div>}
        {coachOn && !modalOpen ? (
          <div className="card mt-1.5 px-3 py-2.5 pointer-events-auto pop" style={{ background: '#2a2200f5', borderColor: '#ffd23f' }}>
            <div className="text-[11px] font-black opacity-70 mb-0.5">HOW TO PLAY · {coach + 1}/3</div>
            <div className="text-sm font-bold leading-snug">
              {coach === 0 && '👋 Welcome! Drag the joystick (bottom-left) to walk. You can also tap the ground, or use W A S D.'}
              {coach === 1 && `🎯 Walk to the glowing yellow ring${sug ? ` at ${district.places.find((p) => p.id === sug.place)?.name ?? 'the place'}` : ''}, then tap the green Enter button.`}
              {coach === 2 && '⚡ Every action costs Energy. When you have done enough, go 🏠 Home and tap End the year. Tap the little map any time to see everywhere.'}
            </div>
            <div className="flex gap-2 mt-2">
              <button className="btn btn-primary !min-h-8 !px-3 !py-1 text-sm" onClick={() => { if (coach < 2) setCoach(coach + 1); else { setReplay(false); g.finishTutorial() } }}>{coach < 2 ? 'Next' : 'Got it!'}</button>
              {coach < 2 && <button className="chip" onClick={() => { setReplay(false); g.finishTutorial() }}>Skip</button>}
            </div>
          </div>
        ) : sug && !modalOpen && !inside && (
          <button className="card mt-1.5 px-3 py-1.5 flex items-center gap-2 text-left pointer-events-auto w-full" style={{ background: '#241f38f2' }} onClick={() => g.goToPlace(sug.place)}>
            <span className="text-xl">{sug.icon}</span>
            <span className="flex-1 text-[13px] font-bold leading-snug">{sug.text}</span>
            <span className="btn btn-primary !min-h-8 !px-3 !py-0.5 text-sm">Go</span>
          </button>
        )}
        {flash && life.lastAction && !modalOpen && !coachOn && (
          <div className="card mt-1.5 px-3 py-2 text-sm font-bold pop max-w-[80%] pointer-events-none" key={flash} style={{ background: '#1e1a30ee' }}>
            {life.lastAction.text}<DeltaChips deltas={life.lastAction.deltas} limit={4} />
          </div>
        )}
      </div>

      {mapOpen && <MapModal district={district} x={pos.x} z={pos.z} h={pos.h} hour={hour} life={life} sugPlace={sug?.place ?? null} onClose={() => setMapOpen(false)} onGo={(id) => { setMapOpen(false); g.goToPlace(id) }} />}

      {/* proximity prompts */}
      {!modalOpen && !inside && (nearNpc || nearPlace) && (
        <div className="absolute right-3 bottom-[6.2rem] flex flex-col items-end gap-2 pointer-events-none">
          {nearNpc && <button className="btn btn-primary pointer-events-auto pop" onClick={() => g.openNpc(near.npc!)} aria-label="Talk">💬 Talk to {nearNpc.name}</button>}
          {nearPlace && INTERIORS[nearPlace.id] && (
            <div className="flex flex-col items-end gap-1.5 pointer-events-auto pop">
              <button className="chip" style={{ background: '#1e1a30ee' }} onClick={() => g.openPlace(near.place!)} aria-label="Place options">⋯ Options</button>
              {isOpen(nearPlace.id, hour)
                ? <button className="btn btn-green !text-lg" onClick={() => enter(nearPlace.id)} aria-label="Interact">🚪 Enter {nearPlace.name} <span className="text-xs opacity-70">(E)</span></button>
                : <button className="btn !text-base" style={{ background: '#4a4a55' }} onClick={() => enter(nearPlace.id)} aria-label="Interact">🔒 Closed until {fmtClock(opensAt(nearPlace.id))}</button>}
            </div>
          )}
          {nearPlace && !INTERIORS[nearPlace.id] && <button className="btn btn-green pointer-events-auto pop !text-lg" onClick={() => g.openPlace(near.place!)} aria-label="Interact">{nearPlace.icon} {nearPlace.name} <span className="text-xs opacity-70">(E)</span></button>}
        </div>
      )}
      {!modalOpen && inside && !task && (
        <div className="absolute right-3 bottom-[6.2rem] flex flex-col items-end gap-2 pointer-events-none">
          {nearIn.person && <button className="btn btn-primary pointer-events-auto pop" onClick={() => talkInside(nearIn.person!)} aria-label="Talk">💬 Talk to {rendRef.current?.personAt(nearIn.person)?.name}</button>}
          {nearIn.hotspot && (() => { const h = INTERIORS[inside]?.hotspots.find((x) => x.id === nearIn.hotspot); return h ? <button className="btn btn-green pointer-events-auto pop !text-lg" onClick={() => setHotId(h.id)} aria-label="Interact">{h.icon} {h.name} <span className="text-xs opacity-70">(E)</span></button> : null })()}
          {nearIn.exit && <button className="btn pointer-events-auto pop" onClick={leave} aria-label="Go outside">🚪 Go outside</button>}
        </div>
      )}

      {task?.kind === 'study' && rendRef.current && <StudyTask r={rendRef.current} mode={task.mode} onDone={() => setTask(null)} />}
      {task?.kind === 'penalty' && rendRef.current && <PenaltyTask r={rendRef.current} pitch={district.places.find((p) => p.id === 'pitch')!.rect} onDone={(perf) => endTask(perf)} />}
      {task?.kind === 'chores' && rendRef.current && <ChoresTask r={rendRef.current} motherId={INTERIORS.home?.people.find((p) => p.persistent === 'mother')?.id ?? null} onDone={(perf) => endTask(perf)} />}
      {task?.kind === 'service' && rendRef.current && <WorshipTask r={rendRef.current} cash={life.character.stats.cash} onDone={(perf, don) => endTask(perf, don)} />}
      {task?.kind === 'overtime' && rendRef.current && <OvertimeTask r={rendRef.current} onDone={(perf) => endTask(perf)} />}
      {task?.kind === 'market' && rendRef.current && <MarketTask r={rendRef.current} spot={{ x: district.places.find((p) => p.id === 'market')!.door.x, z: district.places.find((p) => p.id === 'market')!.door.z + 2.1 }} onDone={(perf) => endTask(perf)} />}
      {task?.kind === 'talk' && rendRef.current && <TalkTask r={rendRef.current} partner={task.partner} role={task.role} setting={task.setting} rounds={task.rounds} title={task.title} onDone={(perf) => endTask(perf)} />}
      {hang && !task && (
        <div className="absolute left-3 right-3 bottom-[5.4rem] z-20 card px-3 py-2 flex items-center gap-2 pointer-events-auto" style={{ background: '#1d3a2aee' }}><span className="flex-1 text-sm font-bold">🚶 With {hang.name} → {district.places.find((p) => p.id === hang.dest)?.name}</span><button className="chip" onClick={cancelHang}>✖ Cancel</button></div>
      )}
      {destPick && (
        <Modal onClose={() => setDestPick(null)}>
          <div className="font-display text-3xl text-danfo">Where to?</div>
          <div className="text-sm opacity-75 mb-3">You and {life.npcs[destPick.npcId]?.name} will walk there together and talk.</div>
          <div className="grid gap-2">
            <button className="card-btn" onClick={() => startHang('pitch')}><b>⚽ {district.places.find((p) => p.id === 'pitch')?.name}</b><div className="text-xs opacity-75">Fresh air, a ball and the neighbourhood.</div></button>
            <button className="card-btn" onClick={() => startHang('mamaput')} disabled={!isOpen('mamaput', hour)}><b>🍲 {district.places.find((p) => p.id === 'mamaput')?.name}</b><div className="text-xs opacity-75">{isOpen('mamaput', hour) ? 'Sit down, eat and gist.' : `Closed until ${fmtClock(opensAt('mamaput'))}.`}</div></button>
          </div>
          <button className="btn w-full mt-3" onClick={() => setDestPick(null)}>Cancel</button>
        </Modal>
      )}

      {/* joystick */}
      {(!task || task.kind === 'chores') && <div className="absolute left-4 bottom-[5.2rem] w-28 h-28 rounded-full touch-none" style={{ background: '#ffffff22', border: '3px solid #ffffff55', touchAction: 'none' }}
        onPointerDown={onJoyDown} onPointerMove={onJoyMove} onPointerUp={onJoyUp} onPointerCancel={onJoyUp} aria-label="Movement joystick">
        <div className="absolute w-12 h-12 rounded-full" style={{ left: 'calc(50% - 24px)', top: 'calc(50% - 24px)', transform: `translate(${knob.x}px, ${knob.y}px)`, background: knob.on ? '#ffd23f' : '#ffffffaa', border: '3px solid #1c1b22' }} />
      </div>}


      {hotId && inside && (() => {
        const h = INTERIORS[inside]?.hotspots.find((x) => x.id === hotId); if (!h) return null
        const acts = getActivities(life)
        return (
          <Modal onClose={() => setHotId(null)}>
            <div className="flex items-center gap-3"><div className="text-4xl">{h.icon}</div><div className="font-display text-3xl text-danfo leading-none">{h.name}</div></div>
            <div className="grid gap-2 mt-3">
              {h.actions.map((a) => {
                const isAct = a.cmd.startsWith('act:'); const ar = isAct ? acts.find((x) => x.def.id === a.cmd.slice(4)) : null
                const tg = a.cmd.startsWith('toggle:') ? appl[a.cmd.slice(7) as 'light' | 'tv' | 'fan'] : null
                const isSleep = a.cmd === 'sleep'
                const dis = (isAct && (!ar?.enabled || life.phase !== 'action')) || (isSleep && life.phase !== 'action')
                return (
                  <button key={a.label} className="card-btn" disabled={dis} onClick={() => runCmd(a)}>
                    <div className="flex items-center justify-between gap-2"><b>{a.icon} {a.label}</b>{tg !== null ? <span className="chip">{tg ? 'ON' : 'OFF'}</span> : ar ? <span className="chip">{ar.def.cost.energy ? `⚡${ar.def.cost.energy}` : 'free'}</span> : null}</div>
                    {isAct && ar && !ar.enabled && <div className="text-xs text-yellow-300 mt-0.5">{ar.reason}</div>}
                    {isSleep && <div className="text-xs opacity-75 mt-0.5">{hour >= 19 || hour < 5 ? 'Switch things off first. Appliances left on cost money and spoil your rest.' : 'Take a nap. Wake whenever you like.'}</div>}
                  </button>
                )
              })}
              {h.id === 'bed' && (appl.tv || appl.fan || appl.light) && <div className="card p-2 text-xs opacity-80">Still on: {[appl.light && '💡 light', appl.tv && '📺 TV', appl.fan && '🌀 fan'].filter(Boolean).join(', ')}. Turn them off before sleeping to save NEPA bill.</div>}
            </div>
            <button className="btn w-full mt-3" onClick={() => setHotId(null)}>Close</button>
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

      {/* bottom bar */}
      {!task && <div className="absolute bottom-0 left-0 right-0 px-3 pt-2 pb-3 safe-pad flex gap-2" style={{ background: '#14121f', borderTop: '1px solid #ffffff14' }}>
        <button className="chip flex-1 justify-center !py-2.5 !text-sm" onClick={() => g.openSheet('places')}>📍 Places</button>
        <button className="chip flex-1 justify-center !py-2.5 !text-sm" onClick={() => g.openSheet('quests')}>📋 Quests</button>
        <button className="chip flex-1 justify-center !py-2.5 !text-sm" onClick={() => g.openSheet('profile')}>👤 Profile</button>
        <button className="chip flex-1 justify-center !py-2.5 !text-sm" style={{ background: '#1d5a3a' }} onClick={() => { audio.sfx('good'); if (inside) leave(); else g.goToPlace('home') }}>{inside ? '🚪 Outside' : '🏠 Home'}</button>
      </div>}
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
    for (const p of district.places) { const X = (p.door.x + WORLD.half) * k, Y = (p.door.z + WORLD.half) * k; g.fillStyle = '#1c1b22cc'; g.beginPath(); g.arc(X, Y, S * 0.12, 0, Math.PI * 2); g.fill(); g.fillText(p.icon, X, Y + 1) }
    return c
  }, [district])
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const g = cv.getContext('2d')!
    g.clearRect(0, 0, R, R); g.drawImage(base, 0, 0); drawPlayer(g, R, x, z, h, 9)
  }, [base, x, z, h])
  return (
    <button className="relative rounded-full pointer-events-auto shrink-0 p-0" style={{ width: S, height: S }} onClick={onOpen} aria-label="Open the full map">
      <canvas ref={ref} width={R} height={R} className="rounded-full" style={{ width: S, height: S, border: '3px solid #1c1b22', boxShadow: '0 0 0 2px #fff8ea66' }} />
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-black px-1.5 rounded-full" style={{ background: '#ffd23f', color: '#1c1b22' }}>🗺️ MAP</span>
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
      g.beginPath(); g.arc(X, Y, 24, 0, Math.PI * 2); g.fillStyle = st === 'open' ? '#1c1b22' : '#55555f'; g.fill()
      g.lineWidth = p.id === sel ? 6 : p.id === sugPlace ? 5 : 2; g.strokeStyle = p.id === sel ? '#2fd27b' : p.id === sugPlace ? '#ffd23f' : '#fff8ea88'; g.stroke()
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
    <Modal title={`🗺️ ${DISTRICTS[life.character.housing.districtId]?.name ?? 'Your area'}`} onClose={onClose}>
      <canvas ref={ref} width={S} height={S} className="w-full rounded-2xl touch-none" style={{ border: '3px solid #1c1b22', aspectRatio: '1 / 1' }} onPointerUp={tap} aria-label="Map. Tap a place to select it." />
      <div className="text-[11px] opacity-70 mt-1">▲ You · yellow ring = suggested next stop · 🔒 closed right now</div>
      {place ? (
        <div className="card p-3 mt-2 flex items-center gap-3">
          <div className="text-3xl">{place.icon}</div>
          <div className="flex-1 min-w-0"><div className="font-black leading-tight">{place.name}</div><div className="text-xs opacity-75">{st === 'closed' ? `Closed. Opens ${fmtClock(opensAt(place.id))}` : st === 'inactive' ? 'Nothing for you here right now' : place.blurb}</div></div>
          <button className="btn btn-green !min-h-10 !px-4" onClick={() => onGo(place.id)}>🚶 Go</button>
        </div>
      ) : <div className="text-sm opacity-75 mt-2">Tap a place on the map to see it and walk there.</div>}
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {district.places.map((p) => <button key={p.id} className="chip justify-start" style={{ opacity: stateOf(p.id) === 'open' ? 1 : 0.55, outline: p.id === sel ? '2px solid #2fd27b' : 'none' }} onClick={() => setSel(p.id)}>{p.icon} {p.name}</button>)}
      </div>
      <button className="btn w-full mt-3" onClick={onClose}>Close map</button>
    </Modal>
  )
}
