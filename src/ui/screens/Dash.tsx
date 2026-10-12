import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../store'
import { Btn, naira } from '../components'
import { HowToBody } from '../Guide'
import { cityOfHome, localise } from '@content/cities'
import { wearOf } from '@content/items'
import { HOWTO } from '@content/taskGuide'
import { plain, vlang } from '@content/lang'
import { speakLine, stopSpeaking } from '@platform/voice'
import { createDash, resultOf, segmentAt, stepDash, ROUTES, type DashEvent, type DashResult, type DashState } from '../../minigames/go-slow-dash/sim'
import { DashRenderer } from '../../minigames/go-slow-dash/renderer'
import { audio } from '@platform/audio'
import { traitSum } from '@engine/core/helpers'

interface Hud { score: number; coins: number; hearts: number; speed: number; dist: number; seg: string; next: string; toNext: number; segPct: number; missions: { text: string; pct: number; done: boolean }[]; powers: { magnet: number; hop: number; suya: number }; aboard: number; fares: number; combo: number; brake: boolean }
type Phase = 'ready' | 'run' | 'paused' | 'over'

export default function Dash() {
  const { life, dashMode, meta, finishDash } = useGame()
  const host = useRef<HTMLDivElement>(null)
  const city = cityOfHome(life?.character.housing.districtId ?? 'surulere')
  const how0 = HOWTO[dashMode === 'foot' ? 'dash' : 'dashDanfo']
  const lz = (x: { en: string; pcm: string }) => ({ en: localise(city, x.en), pcm: localise(city, x.pcm) })
  const how = city === 'lagos' ? how0 : { ...how0, title: lz(how0.title), steps: how0.steps.map((x) => ({ ...x, say: lz(x.say) })), goal: lz(how0.goal) }
  const howVoice = city === 'lagos' || dashMode === 'foot' ? `how_${dashMode === 'foot' ? 'dash' : 'dashDanfo'}` : undefined // the recorded clips say "danfo"

  const dashLine = [plain(meta.settings.lang, how.title), ...how.steps.map((x) => plain(meta.settings.lang, x.say)), plain(meta.settings.lang, how.goal)].join('. ')
  const simRef = useRef<DashState | null>(null)
  const rendRef = useRef<DashRenderer | null>(null)
  const phaseRef = useRef<Phase>('ready')
  const [phase, setPhaseState] = useState<Phase>('ready')
  useEffect(() => { if (phase === 'ready' && meta.settings.guide !== false && meta.settings.sound && meta.settings.voice !== false) void speakLine({ id: howVoice, lang: vlang(meta.settings.lang), text: dashLine, key: 'howto:dash', gapMs: 20000 }) }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps
  const [hud, setHud] = useState<Hud | null>(null)
  const [pops, setPops] = useState<{ id: number; text: string }[]>([])
  const [result, setResult] = useState<DashResult | null>(null)
  const [flash, setFlash] = useState(false)
  const [webglFail, setWebglFail] = useState(false)
  const popId = useRef(1)
  const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseState(p) }

  const config = useMemo(() => {
    const c = life!.character
    const hearts = 3 + (traitSum(c, 'dashHearts') > 0 ? 1 : 0)
    return { seed: (Math.random() * 2 ** 31) >>> 0, mode: dashMode, hearts, assist: meta.settings.assist, routeId: city === 'abuja' ? 'abuja' : 'oshodi' }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pop = useCallback((text: string) => {
    const id = popId.current++
    setPops((p) => [...p.slice(-3), { id, text }])
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1400)
  }, [])

  const handleEvents = useCallback((evs: DashEvent[]) => {
    for (const e of evs) {
      switch (e.t) {
        case 'coin': audio.sfx('coin'); break
        case 'hit': audio.sfx('hit'); rendRef.current?.hit(); setFlash(true); setTimeout(() => setFlash(false), 180); break
        case 'jump': audio.sfx('jump'); break
        case 'power': audio.sfx('power'); pop(e.kind === 'magnet' ? '🧲 Magnet!' : e.kind === 'hop' ? '🦘 Super Hop!' : '🍢 Suya boost!'); break
        case 'close': pop('Close call! +25'); break
        case 'load': audio.sfx('horn'); pop(`🚏 ${e.n} passenger${e.n > 1 ? 's' : ''} on board`); break
        case 'drop': audio.sfx('good'); pop(`💵 Fare ${naira(e.fare)}`); break
        case 'mission': audio.sfx('level'); pop(`✅ ${e.text}`); break
        case 'segment': pop(`📍 ${e.name}`); break
        case 'over': { audio.sfx('bad'); const st = simRef.current!; setResult(resultOf(st)); setPhase('over'); break }
      }
    }
  }, [pop])

  // mount renderer + loop
  useEffect(() => {
    const el = host.current
    if (!el || !life) return
    const c = life.character
    const st = createDash(config)
    simRef.current = st
    let r: DashRenderer
    try { r = new DashRenderer(el, { mode: dashMode, look: c.appearance, gender: c.gender, age: c.age, wear: wearOf(c.items), city }) } catch { setWebglFail(true); return }
    rendRef.current = r
    audio.playMusic('dash')
    const ro = new ResizeObserver(() => r.resize()); ro.observe(el)
    let raf = 0, last = performance.now(), acc = 0, hudT = 0, time = 0
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(0.1, (now - last) / 1000); last = now; time += dt
      if (phaseRef.current === 'run') {
        acc += dt
        while (acc >= 1 / 60) { acc -= 1 / 60; const evs = stepDash(st, 1 / 60); if (evs.length) handleEvents(evs) }
      }
      r.render(st, dt, time)
      hudT += dt
      if (hudT > 0.1) {
        hudT = 0
        const sg = segmentAt(st.dist, config.routeId)
        const route = ROUTES[config.routeId]
        setHud({
          score: st.score, coins: st.coins, hearts: st.hearts, speed: Math.round(st.speed * 3.6), dist: Math.round(st.dist), seg: sg.seg.name, next: route[(sg.index + 1) % route.length].name, toNext: Math.round(sg.toNext), segPct: sg.into / sg.seg.length,
          missions: st.missions.map((m) => ({ text: m.text, pct: Math.min(1, m.progress / m.target), done: m.done })), powers: { ...st.powers }, aboard: st.aboard, fares: st.fares, combo: Math.round(st.combo * 10) / 10, brake: st.braking,
        })
      }
    }
    raf = requestAnimationFrame(loop)
    const onVis = () => { if (document.visibilityState === 'hidden' && phaseRef.current === 'run') setPhase('paused') }
    document.addEventListener('visibilitychange', onVis)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); r.dispose(); rendRef.current = null; audio.playMusic('play') }
  }, [life, config, dashMode, handleEvents])

  // controls
  const act = useCallback((a: 'left' | 'right' | 'jump' | 'slide') => { const st = simRef.current; if (st && phaseRef.current === 'run') st.queue.push(a) }, [])
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const st = simRef.current; if (!st) return
      const k = e.key.toLowerCase()
      if (['arrowleft', 'a'].includes(k)) act('left')
      else if (['arrowright', 'd'].includes(k)) act('right')
      else if (['arrowup', 'w', ' '].includes(k)) { if (phaseRef.current === 'ready') start(); else act('jump') }
      else if (['arrowdown', 's'].includes(k)) { if (dashMode === 'danfo') st.braking = true; else act('slide') }
      else if (k === 'p' || k === 'escape') setPhase(phaseRef.current === 'run' ? 'paused' : phaseRef.current === 'paused' ? 'run' : phaseRef.current)
      if (k.startsWith('arrow') || k === ' ') e.preventDefault()
    }
    const up = (e: KeyboardEvent) => { if (['arrowdown', 's'].includes(e.key.toLowerCase()) && simRef.current) simRef.current.braking = false }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act, dashMode])

  const swipe = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const onDown = (e: React.PointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY, moved: false } }
  const onMove = (e: React.PointerEvent) => {
    const s = swipe.current; if (!s) return
    const dx = e.clientX - s.x, dy = e.clientY - s.y
    if (Math.abs(dx) > 26 && Math.abs(dx) > Math.abs(dy)) { act(dx < 0 ? 'left' : 'right'); s.x = e.clientX; s.y = e.clientY; s.moved = true }
    else if (dy < -30) { act('jump'); s.x = e.clientX; s.y = e.clientY; s.moved = true }
    else if (dy > 30 && dashMode === 'foot') { act('slide'); s.x = e.clientX; s.y = e.clientY; s.moved = true }
  }
  const onUp = () => { const s = swipe.current; swipe.current = null; if (s && !s.moved && phaseRef.current === 'run') act('jump') }

  const start = () => { audio.unlock(); setPhase('run'); pop('GO! 🏁') }
  const goAgain = () => { if (!result) return; finishDash(toMini(result)); useGame.getState().startDash() }
  const back = () => { if (result) finishDash(toMini(result)) }
  const quit = () => { const st = simRef.current; if (!st) return; st.over = true; setResult(resultOf(st)); setPhase('over') }
  const route = ROUTES[config.routeId]
  void route

  if (webglFail) return (
    <div className="p-6 text-center">
      <h1 className="font-display text-4xl text-danfo">Go-Slow Dash</h1>
      <p className="my-3 opacity-80">Your device could not start the 3D game. Your Energy is safe: tap below to return to your life.</p>
      <Btn onClick={() => finishDash({ coins: 0, distance: 0, closeCalls: 0, passengers: 0, mode: dashMode, score: 0 })}>Back to life</Btn>
    </div>
  )

  return (
    <div className="fixed inset-0 mx-auto max-w-[480px] overflow-hidden select-none" style={{ touchAction: 'none', background: '#ffb28a' }}>
      <div ref={host} className="absolute inset-0" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => (swipe.current = null)} />
      {flash && <div className="absolute inset-0 pointer-events-none" style={{ background: '#ff0000', opacity: 0.28 }} />}
      {hud && (
        <>
          <div className="absolute top-2 left-2 right-2 pointer-events-none">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-display text-4xl text-white drop-shadow-[0_3px_0_#1c1b22] leading-none tabular-nums">{hud.score.toLocaleString()}</div>
                <div className="chip mt-1" style={{ background: '#1c1b22cc' }}>🪙 {hud.coins}{hud.combo > 1 ? ` · x${hud.combo}` : ''}</div>
              </div>
              <div className="text-2xl drop-shadow" aria-label={`${hud.hearts} hearts left`}>{Array.from({ length: Math.max(config.hearts, hud.hearts) }, (_, i) => <span key={i} style={{ opacity: i < hud.hearts ? 1 : 0.25 }}>{dashMode === 'foot' ? '❤️' : '🔧'}</span>)}</div>
              <button className="btn btn-ghost !min-h-10 !px-3 pointer-events-auto" onClick={() => setPhase(phase === 'paused' ? 'run' : 'paused')} aria-label="Pause">⏸</button>
            </div>
            <div className="mt-2 rounded-xl px-3 py-1.5 text-xs font-bold" style={{ background: '#1c1b22cc' }}>
              <div className="flex justify-between"><span>📍 {hud.seg}</span><span>Next: {hud.next} · {hud.toNext} m</span></div>
              <div className="bar mt-1"><i style={{ width: `${Math.round(hud.segPct * 100)}%`, background: '#ffd23f' }} /></div>
            </div>
          </div>
          <div className="absolute left-2 bottom-24 pointer-events-none flex flex-col gap-1">
            <div className="chip" style={{ background: '#1c1b22cc' }}>{hud.speed} km/h · {hud.dist} m</div>
            {dashMode === 'danfo' && <div className="chip" style={{ background: '#1c1b22cc' }}>{city === 'abuja' ? '🚕' : '🚌'} {hud.aboard} on board · fares {naira(hud.fares)}</div>}
            {(['magnet', 'hop', 'suya'] as const).map((k) => hud.powers[k] > 0 && <div key={k} className="chip pop" style={{ background: '#2fd27bcc', color: '#06241a' }}>{k === 'magnet' ? '🧲' : k === 'hop' ? '🦘' : '🍢'} {hud.powers[k].toFixed(0)}s</div>)}
          </div>
          <div className="absolute right-2 top-28 pointer-events-none w-40 text-[11px] font-bold space-y-1">
            {hud.missions.map((m, i) => <div key={i} className="rounded-lg px-2 py-1" style={{ background: m.done ? '#1d5a3acc' : '#1c1b22b0' }}>{m.done ? '✅ ' : ''}{m.text}<div className="bar mt-0.5 !h-1"><i style={{ width: `${m.pct * 100}%`, background: '#ffd23f' }} /></div></div>)}
          </div>
        </>
      )}
      <div className="absolute inset-x-0 top-40 flex flex-col items-center gap-1.5 pointer-events-none">{pops.map((p) => <div key={p.id} className="pop chip !text-base !px-3" style={{ background: '#1c1b22e0' }}>{p.text}</div>)}</div>
      {phase === 'run' && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-3">
          <button className="btn btn-ghost !min-w-14" aria-label="Move left" onPointerDown={(e) => { e.stopPropagation(); act('left') }}>◀</button>
          {dashMode === 'foot'
            ? <><button className="btn btn-ghost !min-w-14" aria-label="Jump" onPointerDown={(e) => { e.stopPropagation(); act('jump') }}>▲</button><button className="btn btn-ghost !min-w-14" aria-label="Slide" onPointerDown={(e) => { e.stopPropagation(); act('slide') }}>▼</button></>
            : <><button className="btn btn-ghost !min-w-14" aria-label="Hop (needs Super Hop)" onPointerDown={(e) => { e.stopPropagation(); act('jump') }}>🦘</button><button className="btn btn-primary !min-w-24" aria-label="Brake" onPointerDown={(e) => { e.stopPropagation(); if (simRef.current) simRef.current.braking = true }} onPointerUp={() => { if (simRef.current) simRef.current.braking = false }} onPointerLeave={() => { if (simRef.current) simRef.current.braking = false }}>🛑 BRAKE</button></>}
          <button className="btn btn-ghost !min-w-14" aria-label="Move right" onPointerDown={(e) => { e.stopPropagation(); act('right') }}>▶</button>
        </div>
      )}

      {phase === 'ready' && (
        <div className="absolute inset-0 grid place-items-center p-5" style={{ background: '#0008' }}>
          <div className="card p-5 text-center max-w-sm pop" style={{ background: '#1e1a30' }}>
            <h2 className="font-display text-4xl text-danfo">Go-Slow Dash</h2>
            <div className="text-left"><HowToBody h={how} lang={meta.settings.lang} /></div>
            <div className="flex gap-2 mt-4"><button className="btn btn-ghost !min-h-[52px] !px-4" aria-label="Hear it again" onClick={() => void speakLine({ id: howVoice, lang: vlang(meta.settings.lang), text: dashLine })}>🔊</button><Btn variant="green" className="flex-1 !text-xl" onClick={() => { stopSpeaking(); start() }}>▶ Tap to start</Btn></div>
            <p className="text-[11px] opacity-60 mt-2">Keyboard: ← → lanes · ↑/Space jump · ↓ slide/brake · P pause</p>
          </div>
        </div>
      )}
      {phase === 'paused' && (
        <div className="absolute inset-0 grid place-items-center p-5" style={{ background: '#000a' }}>
          <div className="card p-5 w-full max-w-sm pop" style={{ background: '#1e1a30' }}>
            <h2 className="font-display text-4xl text-danfo text-center">Paused</h2>
            <div className="mt-2 space-y-1.5 text-sm">{hud?.missions.map((m, i) => <div key={i}><div className="flex justify-between"><span>{m.done ? '✅' : '🎯'} {m.text}</span></div><div className="bar mt-0.5"><i style={{ width: `${m.pct * 100}%`, background: '#2fd27b' }} /></div></div>)}</div>
            <Btn className="w-full mt-4" onClick={() => setPhase('run')}>Continue</Btn>
            <Btn variant="danger" className="w-full mt-2" onClick={quit}>End run</Btn>
          </div>
        </div>
      )}
      {phase === 'over' && result && (
        <div className="absolute inset-0 grid place-items-center p-4 overflow-y-auto" style={{ background: '#000b' }}>
          <div className="card p-5 w-full max-w-sm text-center pop" style={{ background: '#1e1a30' }}>
            <div className="font-display text-5xl text-red-400 -rotate-2">WAHALA!</div>
            <div className="font-display text-6xl text-danfo leading-none mt-1">{result.score.toLocaleString()}</div>
            {result.score > (life?.dashBest ?? 0) && <div className="chip mt-1" style={{ background: '#2fd27b', color: '#06241a' }}>New best!</div>}
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div className="card p-2">🪙 Coins <b className="block text-lg">{result.coins}</b></div>
              <div className="card p-2">🛣 Distance <b className="block text-lg">{(result.distance / 1000).toFixed(2)} km</b></div>
              <div className="card p-2">{dashMode === 'danfo' ? `${city === 'abuja' ? '🚕' : '🚌'} Passengers` : '😮 Close calls'} <b className="block text-lg">{dashMode === 'danfo' ? result.passengers : result.closeCalls}</b></div>
              <div className="card p-2">🎯 Missions <b className="block text-lg">{result.missionsDone}/3</b></div>
            </div>
            <p className="text-xs opacity-70 mt-2">Coins and fares become cash when you return to your life.</p>
            <Btn variant="green" className="w-full mt-3" onClick={goAgain}>GO AGAIN ⚡10</Btn>
            <Btn variant="ghost" className="w-full mt-2" onClick={back}>Back to my life</Btn>
          </div>
        </div>
      )}
    </div>
  )
}

function toMini(r: DashResult) {
  return { coins: r.coins, distance: r.distance, closeCalls: r.closeCalls, passengers: r.passengers, mode: r.mode, score: r.score, fares: r.fares, missionsDone: r.missionsDone }
}
