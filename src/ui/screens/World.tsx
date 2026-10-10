import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../store'
import { DeltaChips, StatBar, naira, nairaShort } from '../components'
import { buildDistrict, SPAWN, WORLD, type District, type PlaceId } from '../../world/layout'
import { WorldRenderer, type Near, type WorldNpc } from '../../world/WorldRenderer'
import { npcSpot, placeActive, suggest } from '../../world/guide'
import { audio } from '@platform/audio'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SEASON = (m: number) => (m === 11 ? '🎄 Detty December' : m <= 1 ? '🌫️ Harmattan' : m >= 4 && m <= 8 ? '🌧️ Rainy season' : '☀️ Dry heat')

export default function World() {
  const g = useGame()
  const { life, meta, walkReq } = g
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
  const modalOpen = !!g.sheet || life?.phase !== 'action' || !!life?.quiz

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
    try { r = new WorldRenderer(el, district, { look: c.appearance, age: c.age, uniform: c.edu.level !== 'none' && c.age < 18, month, spawn: SPAWN }) } catch { setFail(true); return }
    rendRef.current = r
    r.onNear(setNear)
    r.onPosition((x, z, h) => setPos({ x, z, h }))
    r.onSlow(() => setSlow(true))
    const ro = new ResizeObserver(() => r.resize()); ro.observe(el)
    r.start()
    if (new URLSearchParams(location.search).get('debug') === '1') (window as unknown as { __world?: WorldRenderer }).__world = r
    return () => { ro.disconnect(); r.dispose(); rendRef.current = null }
    // re-create only when the district changes (new home) or the avatar's age band changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [district, ageBand])

  // keep scene state in sync with the game
  useEffect(() => {
    const r = rendRef.current; if (!r || !life) return
    r.setMonth(month)
    const labels: Partial<Record<PlaceId, boolean>> = {}
    for (const p of district.places) labels[p.id] = placeActive(life, p.id)
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
  }, [life, district, month, ageBand])

  const sug = useMemo(() => (life ? suggest(life) : null), [life])
  useEffect(() => { rendRef.current?.setHighlight(sug?.place ?? null) }, [sug])

  // walk requests (from the Places list or the guidance card)
  useEffect(() => {
    if (!walkReq || !rendRef.current) return
    const p = district.places.find((x) => x.id === walkReq.place)
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
  }, [modalOpen, near])

  const interact = useCallback(() => {
    if (near.place) g.openPlace(near.place)
    else if (near.npc) g.openNpc(near.npc)
  }, [near, g])

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
          <Minimap district={district} x={pos.x} z={pos.z} h={pos.h} onTap={(id) => g.goToPlace(id)} />
        </div>
        <div className="flex gap-2 mt-1.5">
          <span className="chip pointer-events-auto" style={{ background: '#1e1a30ee' }}>📅 {MONTHS[month]} {life.year} · {SEASON(month)}</span>
          <button className="chip pointer-events-auto" style={{ background: '#1e1a30ee' }} onClick={() => g.openSheet('paywall')}>⏱</button>
          <button className="chip pointer-events-auto" style={{ background: '#1e1a30ee' }} onClick={() => g.go('settings')}>⚙️</button>
          <button className="chip pointer-events-auto" style={{ background: '#1e1a30ee' }} onClick={() => g.updateSettings({ lite: true })}>📋 Menu mode</button>
        </div>
        {slow && <div className="card mt-1.5 px-3 py-2 text-sm flex items-center gap-2 pointer-events-auto" style={{ background: '#5a3d00ee' }}><span className="flex-1">🐢 Running slowly on this phone?</span><button className="btn btn-primary !min-h-8 !px-3 !py-1 text-sm" onClick={() => g.updateSettings({ lite: true })}>Use menu mode</button></div>}
        {sug && !modalOpen && (
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

      {/* proximity prompts: a place and/or a person */}
      {!modalOpen && (nearNpc || nearPlace) && (
        <div className="absolute right-3 bottom-[6.2rem] flex flex-col items-end gap-2 pointer-events-none">
          {nearNpc && <button className="btn btn-primary pointer-events-auto pop" onClick={() => g.openNpc(near.npc!)} aria-label="Talk">💬 Talk to {nearNpc.name}</button>}
          {nearPlace && <button className="btn btn-green pointer-events-auto pop !text-lg" onClick={() => g.openPlace(near.place!)} aria-label="Interact">{nearPlace.icon} {nearPlace.name} <span className="text-xs opacity-70">(E)</span></button>}
        </div>
      )}

      {/* joystick */}
      <div className="absolute left-4 bottom-[5.2rem] w-28 h-28 rounded-full touch-none" style={{ background: '#ffffff22', border: '3px solid #ffffff55', touchAction: 'none' }}
        onPointerDown={onJoyDown} onPointerMove={onJoyMove} onPointerUp={onJoyUp} onPointerCancel={onJoyUp} aria-label="Movement joystick">
        <div className="absolute w-12 h-12 rounded-full" style={{ left: 'calc(50% - 24px)', top: 'calc(50% - 24px)', transform: `translate(${knob.x}px, ${knob.y}px)`, background: knob.on ? '#ffd23f' : '#ffffffaa', border: '3px solid #1c1b22' }} />
      </div>

      {/* bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pt-2 pb-3 safe-pad flex gap-2" style={{ background: '#14121f', borderTop: '1px solid #ffffff14' }}>
        <button className="chip flex-1 justify-center !py-2.5 !text-sm" onClick={() => g.openSheet('places')}>📍 Places</button>
        <button className="chip flex-1 justify-center !py-2.5 !text-sm" onClick={() => g.openSheet('quests')}>📋 Quests</button>
        <button className="chip flex-1 justify-center !py-2.5 !text-sm" onClick={() => g.openSheet('profile')}>👤 Profile</button>
        <button className="chip flex-1 justify-center !py-2.5 !text-sm" style={{ background: '#1d5a3a' }} onClick={() => { audio.sfx('good'); g.goToPlace('home') }}>🌙 Home</button>
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
