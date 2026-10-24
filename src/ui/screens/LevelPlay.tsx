// S5 level play: the 3D scene plus the only HUD the spec allows: level label, task dots, points, pause, one instruction line and the contextual action.
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useGame } from '../../store'
import { LevelRenderer, type Nearby } from '../../levels/LevelRenderer'
import { TaskRunner, type LevelResult } from '../../levels/TaskRunner'
import { LEVELS } from '../../levels/levels'
import { progressOf, type ChapterProgress } from '../../levels/progress'
import type { Line } from '../../levels/schema'
import { Portrait } from '../Portrait'
import { BABA_TUNDE, MAMA_FOLAKE, NEIGHBOUR, HELPER } from '../../world/castData'
import { charSpec, V2Btn, INK, CREAM, ORANGE, YELLOW, FOREST } from './V2'
import { audio, type SfxName } from '@platform/audio'
import { track } from '@platform/analytics'
import type { ToonSpec } from '../../world/toon'

/** the player's own look with a football kit: green shirt, white shorts */
const footballKit = (s: ToonSpec): ToonSpec => ({ ...s, top: 'tee', topColor: '#2f5a3a', innerColor: undefined, bottom: 'shorts', bottomColor: '#fbf8f0', shoes: 'sneaker', accessories: s.accessories.filter((a) => a === 'earrings' || a === 'watch') })
const SFX: Record<string, SfxName> = { ring: 'prompt', nope: 'bad', pick: 'coin', bump: 'hit' }
const opened = typeof performance !== 'undefined' ? performance.now() : 0

export default function LevelPlay() {
  const { meta, levelStart, saveProgress, showLevelResult, go, activeLevel } = useGame()
  const level = LEVELS[activeLevel] ?? LEVELS['ch1.l1']
  const baseSpec = charSpec(progressOf(meta).character)
  const spec = level.kit ? footballKit(baseSpec) : baseSpec
  const canvas = useRef<HTMLCanvasElement>(null)
  const runner = useRef<TaskRunner>()
  const scene = useRef<LevelRenderer>()
  const [, bump] = useReducer((n: number) => n + 1, 0)
  const [line, setLine] = useState<Line | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [moved, setMoved] = useState(false)
  const [doing, setDoing] = useState<string | null>(null)
  const [near, setNear] = useState<Nearby | null>(null)
  const [paused, setPaused] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const finished = useRef(false)
  const startedAt = useRef(Date.now())
  const lastProgress = useRef<ChapterProgress>(progressOf(meta))
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }
  const queue = useRef<Line[]>([])
  const speaking = useRef(false)

  const playQueue = useCallback(() => {
    if (speaking.current) return
    const next = queue.current.shift()
    if (!next) { setLine(null); scene.current?.setSpeaker(null); return }
    speaking.current = true; setLine(next); scene.current?.setExpression(next.who, next.expr ?? 'neutral'); scene.current?.setSpeaker(next.who)
    later(() => { speaking.current = false; playQueue() }, 2600)
  }, [])

  useEffect(() => {
    const cv = canvas.current!
    const r = new LevelRenderer(cv, level, spec, levelStart)
    scene.current = r
    const prog = progressOf(meta)
    const rn = new TaskRunner(level, { ...prog, level: level.id, task: levelStart }, {
      say: (l) => { queue.current.push(l); playQueue() },
      toast: (t) => { setToast(t); later(() => setToast(null), 1400) },
      taskStarted: (i) => {
        const pr = lastProgress.current
        if (pr.completed.length === 0 && i === 0) track('first_task_started', { task: level.tasks[0].id, ms_since_open: Math.round(performance.now() - opened) })
        setBanner(`TASK ${i + 1} OF ${level.tasks.length} · ${level.tasks[i].title}`); later(() => setBanner(null), 2400); setHint(null)
      },
      taskDone: (i, awarded) => {
        if (awarded && lastProgress.current.completed.length === 0) track('first_task_completed', { task: level.tasks[i].id, duration_s: Math.round((Date.now() - startedAt.current) / 1000) })
        audio.sfx('reward'); setDone(awarded ? 'TASK COMPLETE  +1 POINT' : 'TASK COMPLETE'); later(() => setDone(null), 1500)
      },
      taskFailed: (i, reason) => track('task_failed', { task: level.tasks[i].id, reason }),
      levelDone: (res: LevelResult) => {
        finished.current = true
        track('level_completed', { level: level.id, stars: res.stars, duration_s: res.seconds, mistakes: res.mistakes, hints: res.hints })
        later(() => showLevelResult(res), 2200)
      },
      save: (p) => { lastProgress.current = p; saveProgress(p) },
      changed: () => bump(),
      sfx: (n) => audio.sfx(SFX[n] ?? 'click'),
    }, levelStart)
    runner.current = rn; r.runner = rn; r.onNearby = setNear; r.onAction = (l) => setDoing(l); r.onFirstMove = () => setMoved(true); r.onFx = (n) => audio.sfx(n === 'tap' ? 'tap' : 'prompt')
    track('level_started', { level: level.id, character: spec.id, resumed: levelStart > 0 })
    if (new URLSearchParams(location.search).get('debug') === '1') (window as unknown as Record<string, unknown>).__level = { runner: rn, scene: r }
    audio.playMusic('play')
    return () => {
      if (!finished.current) track('level_abandoned', { level: level.id, task: rn.idx, duration_s: Math.round((Date.now() - startedAt.current) / 1000) })
      timers.current.forEach(clearTimeout); r.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // controls: keyboard and the on-screen stick share one input
  const keys = useRef({ x: 0, z: 0 })
  const stick = useRef({ x: 0, z: 0 })
  const sync = () => { const s = scene.current; if (!s) return; s.input.x = paused ? 0 : keys.current.x || stick.current.x; s.input.z = paused ? 0 : keys.current.z || stick.current.z }
  useEffect(() => { sync(); if (scene.current) scene.current.paused = paused }, [paused])
  // penalty task: a needle swings across a bar; Kick stops it, and the green zone decides whether it is a goal
  const needleRef = useRef(0.5)
  const [needle, setNeedle] = useState(0.5)
  const kickReady = !!near && near.id === 'kick' && !paused
  useEffect(() => {
    if (!kickReady) return
    let raf = 0; const t0 = performance.now()
    const loop = () => { const v = 0.5 + 0.5 * Math.sin(((performance.now() - t0) / 1000) * 3.2); needleRef.current = v; setNeedle(v); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [kickReady])
  const act = useCallback(() => {
    const rn = runner.current, sc = scene.current
    if (!rn || !sc || !near || paused || sc.busy) return
    if (near.id === 'bus') { sc.boardBus(); return }
    if (near.id === 'kick') { const v = needleRef.current, ok = Math.abs(v - 0.5) < rn.kickBand; sc.kickBall(ok, v, () => rn.kickResult(ok)); return }
    sc.perform(near, () => rn.interact(near.id))
  }, [near, paused])
  useEffect(() => {
    const down = new Set<string>()
    const upd = () => { keys.current = { x: (down.has('d') || down.has('arrowright') ? 1 : 0) - (down.has('a') || down.has('arrowleft') ? 1 : 0), z: (down.has('s') || down.has('arrowdown') ? 1 : 0) - (down.has('w') || down.has('arrowup') ? 1 : 0) }; sync() }
    const kd = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (['e', ' ', 'enter'].includes(k)) { act(); return } if (k === 'escape') { setPaused((p) => !p); return } down.add(k); upd() }
    const ku = (e: KeyboardEvent) => { down.delete(e.key.toLowerCase()); upd() }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act, paused])

  // stuck detection: after 35 s on one task with no progress the hint appears by itself, once
  const hintedFor = useRef(-1)
  const taskSecs = useRef({ idx: -1, at: 0 })
  useEffect(() => {
    const iv = window.setInterval(() => {
      const rn = runner.current; if (!rn || rn.finished || paused) return
      if (taskSecs.current.idx !== rn.idx) taskSecs.current = { idx: rn.idx, at: rn.seconds }
      else if (rn.seconds - taskSecs.current.at > 35 && hintedFor.current !== rn.idx && rn.task.kind !== 'reach') { hintedFor.current = rn.idx; setHint(rn.task.hint) }
    }, 1000)
    return () => clearInterval(iv)
  }, [paused])

  const rn = runner.current
  const task = rn?.task
  const p = rn?.progress ?? progressOf(meta)
  const speakerSpec = (w: Line['who']) => (w === 'folake' ? MAMA_FOLAKE : w === 'tunde' ? BABA_TUNDE : w === 'neighbour' ? NEIGHBOUR : w === 'helper' ? HELPER : spec)
  const speakerName = (w: Line['who']) => (w === 'folake' ? 'Mama Folake' : w === 'tunde' ? 'Baba Tunde' : w === 'neighbour' ? 'The Neighbour' : w === 'helper' ? 'The Helper' : spec.name)
  const collectInfo = !rn || !task ? '' : task.kind === 'collect' ? (rn.budgetLeft !== null ? ` (${rn.collected.length}/${level.budgets?.[rn.idx]?.need} · ₦${rn.budgetLeft} left)` : ` (${rn.collected.length}/${level.items.filter((i) => i.task === rn.idx).length})`)
    : task.kind === 'kick' ? ` (${rn.goals}/${level.kick?.goals ?? 3})` : task.kind === 'hold' ? ` (${Math.floor(rn.holdT)}/${rn.holdNeed} s)` : task.kind === 'sequence' ? ` (${rn.seqPos}/${level.sequences?.[rn.idx]?.length ?? 0})` : task.kind === 'serve' ? ` (${rn.fed}/${rn.serve?.guests.length ?? 0} fed)` : task.kind === 'talk' ? ` (${rn.spoken}/${rn.people.length})` : ''
  const onStick = (e: React.PointerEvent<HTMLDivElement>, end = false) => {
    const el = e.currentTarget.getBoundingClientRect()
    if (end) { stick.current = { x: 0, z: 0 }; setKnob({ x: 0, y: 0 }); sync(); return }
    const dx = e.clientX - (el.left + el.width / 2), dy = e.clientY - (el.top + el.height / 2), m = Math.hypot(dx, dy), max = el.width / 2
    const k = Math.min(1, m / max); const nx = m ? dx / m : 0, ny = m ? dy / m : 0
    stick.current = { x: nx * k, z: ny * k }; setKnob({ x: nx * k * 34, y: ny * k * 34 }); sync()
  }
  const [knob, setKnob] = useState({ x: 0, y: 0 })

  return (
    <div className="screen relative select-none" style={{ background: '#f1d9a8', touchAction: 'none' }}>
      <div className="absolute inset-0" onPointerUp={(e) => { if (!paused) scene.current?.moveTo(e.clientX, e.clientY) }}><canvas ref={canvas} className="w-full h-full block" /></div>

      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 px-3 pointer-events-none" style={{ paddingTop: 'calc(.6rem + var(--safe-t))' }}>
        <div className="rounded-2xl px-3 py-1.5 pointer-events-auto" style={{ background: `${CREAM}ee`, border: `2px solid ${INK}`, color: INK }}>
          <div className="text-[11px] font-extrabold uppercase tracking-wider">{level.subtitle} · {level.title}</div>
          <div className="flex gap-1.5 mt-1" aria-label="Task progress">{level.tasks.map((t, i) => <span key={t.id} className="w-4 h-4 rounded-full" style={{ background: i < (rn?.idx ?? 0) || rn?.finished ? FOREST : i === rn?.idx ? YELLOW : '#0002', border: `2px solid ${INK}` }} />)}</div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="rounded-full px-3 py-1 text-sm font-extrabold" style={{ background: `${CREAM}ee`, border: `2px solid ${INK}`, color: INK }}>⭐ {p.points}</span>
          <button aria-label="Hint" className="w-11 h-11 rounded-full font-display text-xl" style={{ background: YELLOW, border: `3px solid ${INK}`, color: INK }} onClick={() => { const h = runner.current?.hint(); if (h) { setHint(h); track('hint_used', { task: runner.current!.task.id }) } }}>?</button>
          <button aria-label="Pause" className="w-11 h-11 rounded-full font-display text-xl" style={{ background: CREAM, border: `3px solid ${INK}`, color: INK }} onClick={() => setPaused(true)}>II</button>
        </div>
      </div>

      {task && !rn?.finished && (
        <div className="absolute inset-x-0 flex justify-center px-4 pointer-events-none" style={{ top: 'calc(4.6rem + var(--safe-t))' }}>
          <div className="rounded-full px-4 py-1.5 font-extrabold text-center" style={{ background: INK, color: '#fff' }}>{task.objective}{collectInfo}</div>
        </div>
      )}
      {task?.kind === 'reach' && rn && !rn.finished && (
        <div className="absolute inset-x-0 flex justify-center pointer-events-none" style={{ top: 'calc(7.6rem + var(--safe-t))' }}>
          <div className="font-display text-5xl" style={{ color: rn.timeLeft < 6 ? '#d62828' : INK, WebkitTextStroke: '2px #fff', textShadow: '0 3px 0 #0003' }}>{Math.ceil(rn.timeLeft)}</div>
        </div>
      )}

      {(() => {
        // one small pill at the top, under the instruction, never over the scene: what is happening now, in priority order
        const t = doing ?? done ?? toast ?? banner ?? (!moved ? 'Drag the stick to move. Tap the orange button to act.' : null)
        if (!t) return null
        const tone = done ? FOREST : doing ? INK : banner ? ORANGE : '#fff'
        return <div className="absolute inset-x-0 flex justify-center pointer-events-none" style={{ top: 'calc(7.2rem + var(--safe-t))' }}><div key={t} className="fade-in rounded-full px-4 py-1 text-sm font-extrabold text-center" style={{ background: tone, color: tone === '#fff' ? INK : '#fff', border: `2px solid ${INK}`, opacity: 0.92 }}>{t}</div></div>
      })()}

      {(line || hint) && (
        <div className="absolute inset-x-0 px-3 pointer-events-none" style={{ bottom: 'calc(9.6rem + var(--safe-b))' }}>
          {hint && !line && <div className="mx-auto max-w-sm rounded-2xl p-2 text-sm font-bold text-center" style={{ background: YELLOW + 'ee', border: `3px solid ${INK}`, color: INK }}>💡 {hint}</div>}
          {line && (
            <div className="mx-auto max-w-sm flex items-center gap-2 rounded-2xl p-1.5 pr-3 text-sm" style={{ background: '#ffffffe6', border: `3px solid ${INK}`, color: INK, boxShadow: `0 4px 0 ${INK}` }}>
              <Portrait spec={speakerSpec(line.who)} expression={line.expr ?? 'neutral'} size={44} />
              <div><div className="text-xs font-extrabold uppercase tracking-wide" style={{ color: ORANGE }}>{line.name ?? speakerName(line.who)}</div><div className="font-bold leading-tight">{line.text}</div></div>
            </div>
          )}
        </div>
      )}

      {rn?.convoOptions && !paused && (
        <div className="absolute inset-x-0 px-4 grid gap-2 justify-items-center" style={{ bottom: 'calc(15.4rem + var(--safe-b))' }}>
          {rn.convoOptions.map((o) => <V2Btn key={o.id} tone="cream" className="!min-h-12 !text-base w-full max-w-sm" onClick={() => runner.current?.interact(`c:${o.id}`)}>{o.label}</V2Btn>)}
        </div>
      )}
      {kickReady && rn && (
        <div className="absolute inset-x-0 flex justify-center pointer-events-none" style={{ bottom: 'calc(14.2rem + var(--safe-b))' }}>
          <div className="relative h-7 rounded-full overflow-hidden" style={{ width: 260, background: CREAM, border: `3px solid ${INK}` }} aria-label="Kick timing">
            <div className="absolute inset-y-0" style={{ left: `${(0.5 - rn.kickBand) * 100}%`, width: `${rn.kickBand * 200}%`, background: '#7fc48a' }} />
            <div className="absolute inset-y-0 w-1.5" style={{ left: `calc(${needle * 100}% - 3px)`, background: INK }} />
          </div>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-5 pointer-events-none" style={{ paddingBottom: 'calc(1.4rem + var(--safe-b))' }}>
        <div className="relative w-36 h-36 rounded-full pointer-events-auto" style={{ background: '#fff6', border: `3px solid ${INK}` }} aria-label="Move stick"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onStick(e) }} onPointerMove={(e) => { if (e.buttons) onStick(e) }} onPointerUp={(e) => onStick(e, true)} onPointerCancel={(e) => onStick(e, true)}>
          <div className="absolute w-14 h-14 rounded-full" style={{ left: `calc(50% - 28px + ${knob.x}px)`, top: `calc(50% - 28px + ${knob.y}px)`, background: INK }} />
        </div>
        <div className="grid gap-2 justify-items-end pointer-events-auto">
          {task?.kind === 'collect' && rn && rn.budgetLeft !== null && rn.collected.length > 0 && <V2Btn tone="cream" className="!min-h-12 !text-lg" onClick={() => runner.current?.interact('reset')}>Start over</V2Btn>}
          {task?.kind === 'choose' && !rn?.choice && <V2Btn tone="cream" className="!min-h-12 !text-lg" onClick={() => runner.current?.interact('none')}>Go without</V2Btn>}
          <button disabled={!near || paused} onClick={act} className="rounded-full font-display text-xl px-5 min-h-20 min-w-24 text-center disabled:opacity-40 transition-opacity"
            style={{ background: near ? ORANGE : '#fff8', color: near ? '#fff' : INK, border: `3px solid ${INK}`, boxShadow: `0 5px 0 ${INK}` }}>
            {near ? near.label : 'Interact'}
          </button>
        </div>
      </div>

      {paused && (
        <div className="absolute inset-0 grid place-items-center p-6" style={{ background: '#1c1b22cc' }}>
          <div className="w-full max-w-xs rounded-3xl p-5 grid gap-3 text-center" style={{ background: CREAM, border: `3px solid ${INK}`, color: INK }}>
            <h2 className="font-display text-4xl">Paused</h2>
            <V2Btn onClick={() => setPaused(false)}>Resume</V2Btn>
            <V2Btn tone="cream" onClick={() => { saveProgress({ ...progressOf(useGame.getState().meta), task: 0 }); finished.current = true; track('level_abandoned', { level: level.id, task: runner.current?.idx ?? 0, duration_s: Math.round((Date.now() - startedAt.current) / 1000) }); useGame.getState().openLevel(0) }}>Restart level</V2Btn>
            <V2Btn tone="green" onClick={() => go('home')}>Back to Home</V2Btn>
            <p className="text-xs font-bold opacity-70">Your progress is saved at every task.</p>
          </div>
        </div>
      )}
    </div>
  )
}
