// Developer page (open with ?sheet=1): every cast member in 3D with poses, and every portrait expression. Used to compare against the character sheets.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { buildToon, EXPRESSIONS, type ToonParts } from '../world/toon'
import { NAMED, neighbour } from '../world/castData'
import { exercisePose, animateHuman } from '../world/characters'
import { Portrait } from '../ui/Portrait'

const POSES = ['idle', 'walk', 'run', 'lift', 'jacks', 'stretch'] as const

export default function CharacterSheet() {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = host.current!
    const w = el.clientWidth || 1000, h = 420
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: false }); r.setSize(w, h); r.setClearColor(0xf5efe4); el.appendChild(r.domElement)
    const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 1.15)); const sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(3, 8, 6); scene.add(sun)
    const cam = new THREE.PerspectiveCamera(32, w / h, 0.1, 100); cam.position.set(0, 3.6, 17); cam.lookAt(0, 2.1, 0)
    const cast = [...NAMED, neighbour(1), neighbour(2), neighbour(3), neighbour(4)]
    const people: { p: ToonParts; pose: number }[] = []
    cast.forEach((spec, i) => {
      const p = buildToon(spec); p.group.position.set((i - (cast.length - 1) / 2) * 2.5, 0, 0); p.group.rotation.y = i % 2 ? -0.3 : 0.3; scene.add(p.group)
      p.setExpression(EXPRESSIONS[(i * 4) % EXPRESSIONS.length]); people.push({ p, pose: i % POSES.length })
    })
    let raf = 0
    const loop = (ms: number) => {
      raf = requestAnimationFrame(loop); const t = ms / 1000
      for (const { p, pose } of people) {
        const k = POSES[pose]
        if (k === 'idle') animateHuman(p, t, false)
        else if (k === 'walk') animateHuman(p, t, true)
        else exercisePose(p, k === 'run' ? 'run' : k === 'lift' ? 'lift' : k === 'jacks' ? 'jacks' : 'stretch', t)
      }
      r.render(scene, cam)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); r.dispose(); r.domElement.remove() }
  }, [])
  return (
    <div style={{ background: '#f5efe4', color: '#1c1b22', minHeight: '100vh', padding: 12, fontFamily: 'system-ui', overflow: 'auto' }}>
      <h1 style={{ fontWeight: 900, fontSize: 28 }}>Cast sheet (3D, poses cycle)</h1>
      <div ref={host} style={{ width: '100%' }} />
      {NAMED.map((spec) => (
        <section key={spec.id} style={{ marginTop: 14 }}>
          <b>{spec.name}</b>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{EXPRESSIONS.map((e) => <div key={e} style={{ textAlign: 'center', fontSize: 11 }}><Portrait spec={spec} expression={e} size={88} /><div>{e}</div></div>)}</div>
        </section>
      ))}
    </div>
  )
}
