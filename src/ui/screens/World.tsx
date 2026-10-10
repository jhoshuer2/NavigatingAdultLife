import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../store'
import { DeltaChips, Modal, StatBar, naira, nairaShort } from '../components'
import { getActivities } from '@engine/api'
import { useActivityRouter } from '../useActivities'
import { buildDistrict, SPAWN, WORLD, type District, type PlaceId } from '../../world/layout'
import { WorldRenderer, type Near, type NearInside, type WorldNpc } from '../../world/WorldRenderer'
import { INTERIORS, type HotAction } from '../../world/interiors'
import { fmtClock, isNight, isOpen, opensAt } from '../../world/time'
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
  const hourRef = useRef(hour); hourRef.current = hour
  const host = useRef<HTMLDivElement>(null)
  const rendRef = useRef<WorldRenderer | null>(null)
  const [near, setNear] = useState<Near>({ place: null, npc: null })
  const [fail, setFail] = useState(false)
  const [pos, setPos] = useState({ x: SPAWN.x, z: SPAWN.z, h: 0 })
  const [showHud, setShowHud] = useState(false)
  const [slow, setSlow] = useState(false)
  const districtId = life?.character.housing.districtId ?? 'surulere'
  const district = useMemo<District>(() => buildDistrict(districtId), [districtId])
  const age = life?.character.age ?? 6
  const ageBand = age < 12 ? 0 : age < 18 ? 1 : 2
  const modalOpen = !!g.sheet || life?.phase !== 'action' || !!life?.quiz || !!hotId || !!sleep || fade

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

  const enter = (place: PlaceId, want?: 'sleep') => {
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

  const toggle = (k: 'light' | 'tv' | 'fan') => { const n = { ...appl, [k]: !appl[k] }; setAppl(n); rendRef.current?.setInteriorState({ ...n, hour: sleep ? sleep.from + sleep.elapsed : hour }); audio.sfx('click') }
  const runCmd = (a: HotAction) => {
    const cmd = a.cmd
    if (cmd === 'sleep') { setHotId(null); startSleep() }
    else if (cmd.startsWith('toggle:')) toggle(cmd.slice(7) as 'light' | 'tv' | 'fan')
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
      <div className="absolute top-2 left-2 right-2 pointer-events-none">
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
          {!inside && <Minimap district={district} x={pos.x} z={pos.z} h={pos.h} onTap={(id) => g.goToPlace(id)} />}
        </div>
        <div className="flex gap-2 mt-1.5">
          <span className="chip pointer-events-auto" style={{ background: '#1e1a30ee' }}>📅 {MONTHS[month]} {life.year}</span>
          <span className="chip pointer-events-auto" style={{ background: '#1e1a30ee' }} aria-label="Time of day">{isNight(sleep ? sleep.from + sleep.elapsed : hour) ? '🌙' : '☀️'} {fmtClock(sleep ? (sleep.from + sleep.elapsed) % 24 : hour)}</span>
          {!sleep && <button className="chip pointer-events-auto" style={{ background: '#1e1a30ee' }} onClick={() => { g.advance(2); g.toast('⏳ Two hours pass.') }} aria-label="Wait two hours">⏳</button>}
          <button className="chip pointer-events-auto" style={{ background: '#1e1a30ee' }} onClick={() => g.openSheet('paywall')}>⏱</button>
          <button className="chip pointer-events-auto" style={{ background: '#1e1a30ee' }} onClick={() => g.go('settings')}>⚙️</button>
          <button className="chip pointer-events-auto" style={{ background: '#1e1a30ee' }} onClick={() => g.updateSettings({ lite: true })}>📋 Menu mode</button>
        </div>
        {slow && <div className="card mt-1.5 px-3 py-2 text-sm flex items-center gap-2 pointer-events-auto" style={{ background: '#5a3d00ee' }}><span className="flex-1">🐢 Running slowly on this phone?</span><button className="btn btn-primary !min-h-8 !px-3 !py-1 text-sm" onClick={() => g.updateSettings({ lite: true })}>Use menu mode</button></div>}
        {sug && !modalOpen && !inside && (
          <button className="card mt-1.5 px-3 py-2 flex items-center gap-3 text-left pointer-events-auto w-full" style={{ background: '#241f38f2' }} onClick={() => g.goToPlace(sug.place)}>
            <span className="text-2xl">{sug.icon}</span>
            <span className="flex-1 text-sm font-bold leading-snug">{sug.text}</span>
            <span className="btn btn-primary !min-h-9 !px-3 !py-1 text-sm">Go</span>
          </button>
        )}
        {life.lastAction && (
          <div className="card mt-1.5 px-3 py-2 text-sm font-bold pop max-w-[80%] pointer-events-none" key={life.lastAction.text} style={{ background: '#1e1a30ee' }}>
            {life.lastAction.text}<DeltaChips deltas={life.lastAction.deltas} limit={4} />
          </div>
        )}
      </div>

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
      {!modalOpen && inside && (
        <div className="absolute right-3 bottom-[6.2rem] flex flex-col items-end gap-2 pointer-events-none">
          {nearIn.person && <button className="btn btn-primary pointer-events-auto pop" onClick={() => talkInside(nearIn.person!)} aria-label="Talk">💬 Talk to {rendRef.current?.personAt(nearIn.person)?.name}</button>}
          {nearIn.hotspot && (() => { const h = INTERIORS[inside]?.hotspots.find((x) => x.id === nearIn.hotspot); return h ? <button className="btn btn-green pointer-events-auto pop !text-lg" onClick={() => setHotId(h.id)} aria-label="Interact">{h.icon} {h.name} <span className="text-xs opacity-70">(E)</span></button> : null })()}
          {nearIn.exit && <button className="btn pointer-events-auto pop" onClick={leave} aria-label="Go outside">🚪 Go outside</button>}
        </div>
      )}

      {/* joystick */}
      <div className="absolute left-4 bottom-[5.2rem] w-28 h-28 rounded-full touch-none" style={{ background: '#ffffff22', border: '3px solid #ffffff55', touchAction: 'none' }}
        onPointerDown={onJoyDown} onPointerMove={onJoyMove} onPointerUp={onJoyUp} onPointerCancel={onJoyUp} aria-label="Movement joystick">
        <div className="absolute w-12 h-12 rounded-full" style={{ left: 'calc(50% - 24px)', top: 'calc(50% - 24px)', transform: `translate(${knob.x}px, ${knob.y}px)`, background: knob.on ? '#ffd23f' : '#ffffffaa', border: '3px solid #1c1b22' }} />
      </div>


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
      <div className="absolute bottom-0 left-0 right-0 px-3 pt-2 pb-3 safe-pad flex gap-2" style={{ background: '#14121f', borderTop: '1px solid #ffffff14' }}>
        <button className="chip flex-1 justify-center !py-2.5 !text-sm" onClick={() => g.openSheet('places')}>📍 Places</button>
        <button className="chip flex-1 justify-center !py-2.5 !text-sm" onClick={() => g.openSheet('quests')}>📋 Quests</button>
        <button className="chip flex-1 justify-center !py-2.5 !text-sm" onClick={() => g.openSheet('profile')}>👤 Profile</button>
        <button className="chip flex-1 justify-center !py-2.5 !text-sm" style={{ background: '#1d5a3a' }} onClick={() => { audio.sfx('good'); if (inside) leave(); else g.goToPlace('home') }}>{inside ? '🚪 Outside' : '🏠 Home'}</button>
      </div>
    </div>
  )
}

function Minimap({ district, x, z, h, onTap }: { district: District; x: number; z: number; h: number; onTap: (id: PlaceId) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const S = 92
  const base = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = S * 2
    const g = c.getContext('2d')!
    const k = (S * 2) / (WORLD.half * 2)
    const X = (v: number) => (v + WORLD.half) * k
    g.fillStyle = '#' + district.theme.ground.toString(16).padStart(6, '0'); g.fillRect(0, 0, S * 2, S * 2)
    g.fillStyle = '#4b4b55'; for (const r of district.roads) g.fillRect(X(r.x0), X(r.z0), (r.x1 - r.x0) * k, (r.z1 - r.z0) * k)
    g.fillStyle = '#d9c9a8'; for (const b of district.buildings) g.fillRect(X(b.rect.x0), X(b.rect.z0), (b.rect.x1 - b.rect.x0) * k, (b.rect.z1 - b.rect.z0) * k)
    g.font = `${S * 0.24}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'
    for (const p of district.places) { g.fillStyle = '#1c1b22cc'; g.beginPath(); g.arc(X(p.door.x), X(p.door.z), S * 0.12, 0, Math.PI * 2); g.fill(); g.fillText(p.icon, X(p.door.x), X(p.door.z) + 1) }
    return c
  }, [district])
  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const g = cv.getContext('2d')!
    g.clearRect(0, 0, S * 2, S * 2); g.drawImage(base, 0, 0)
    const k = (S * 2) / (WORLD.half * 2)
    g.save(); g.translate((x + WORLD.half) * k, (z + WORLD.half) * k); g.rotate(-h + Math.PI)
    g.fillStyle = '#ffd23f'; g.strokeStyle = '#1c1b22'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -9); g.lineTo(7, 8); g.lineTo(-7, 8); g.closePath(); g.fill(); g.stroke(); g.restore()
  }, [base, x, z, h])
  const tap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const wx = ((e.clientX - r.left) / r.width) * WORLD.half * 2 - WORLD.half, wz = ((e.clientY - r.top) / r.height) * WORLD.half * 2 - WORLD.half
    let best: PlaceId | null = null, bd = 9
    for (const p of district.places) { const d = Math.hypot(p.door.x - wx, p.door.z - wz); if (d < bd) { bd = d; best = p.id } }
    if (best) onTap(best)
  }
  return <canvas ref={ref} width={S * 2} height={S * 2} className="rounded-full pointer-events-auto shrink-0" style={{ width: S, height: S, border: '3px solid #1c1b22', boxShadow: '0 0 0 2px #fff8ea66' }} onPointerUp={tap} aria-label="Minimap. Tap a place to walk there." />
}
