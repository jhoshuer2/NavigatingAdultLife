// Developer page (?poses=1): every pose on a row of characters, so a screenshot shows whether the hands, knees and back read correctly.
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { buildToon } from '../world/toon'
import { applyPose, POSES, type Pose } from '../world/poses'
import { neighbour } from '../world/castData'

export default function PoseSheet() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current!, names = Object.keys(POSES) as Pose[]
    const cols = 7, rows = Math.ceil(names.length / cols)
    const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true }); r.setSize(cols * 200, rows * 260, false)
    const sc = new THREE.Scene(); sc.background = new THREE.Color('#f1d9a8')
    sc.add(new THREE.HemisphereLight(0xfff1d6, 0x7a6a58, 1.2)); const sun = new THREE.DirectionalLight(0xffe2b0, 0.9); sun.position.set(-4, 8, 6); sc.add(sun)
    names.forEach((n, i) => {
      const t = buildToon({ ...neighbour(i + 4, i % 2 ? 'man' : 'boy'), accessories: [] as never[] })
      t.group.position.set((i % cols) * 3 - (cols - 1) * 1.5, -Math.floor(i / cols) * 3.6, 0); t.group.rotation.y = 1.25
      applyPose(t, n, 0.4, 1); sc.add(t.group)
      const label = document.createElement('canvas'); label.width = 256; label.height = 64
      const g = label.getContext('2d')!; g.fillStyle = '#1c1b22'; g.font = '700 40px system-ui'; g.textAlign = 'center'; g.fillText(n, 128, 44)
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(label), transparent: true })); sp.scale.set(2.4, 0.6, 1); sp.position.set(t.group.position.x, t.group.position.y - 0.4, 1); sc.add(sp)
    })
    const cy = -(rows - 1) * 1.8 + 0.8, cam = new THREE.PerspectiveCamera(38, (cols * 200) / (rows * 260), 0.1, 100); cam.position.set(0, cy, 24.5); cam.lookAt(0, cy, 0)
    r.render(sc, cam)
    ;(window as unknown as Record<string, unknown>).__posesReady = true
    return () => r.dispose()
  }, [])
  return <canvas ref={ref} style={{ width: '100%', height: 'auto', display: 'block' }} />
}
