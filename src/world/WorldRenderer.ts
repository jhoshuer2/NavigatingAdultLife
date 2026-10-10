// Three.js renderer for the explorable district. Static scenery is merged into a few draw calls.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Appearance, Gender } from '@engine/core/types'
import { WORLD, type District, type PlaceId, type Rect } from './layout'
import { buildNav, findPath, moveWithCollision, type Nav } from './nav'
import { animateHuman, buildHuman, hashLook, type HumanParts } from './characters'

class Batch {
  private geos: THREE.BufferGeometry[] = []
  private paint(g: THREE.BufferGeometry, color: number) {
    const c = new THREE.Color(color); const n = g.attributes.position.count
    const arr = new Float32Array(n * 3); for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
    if (g.index) g = g.toNonIndexed()
    g.deleteAttribute('uv')
    this.geos.push(g)
  }
  box(cx: number, cy: number, cz: number, w: number, h: number, d: number, color: number, rotY = 0) {
    const g = new THREE.BoxGeometry(w, h, d); if (rotY) g.rotateY(rotY); g.translate(cx, cy, cz); this.paint(g, color)
  }
  cone(cx: number, cy: number, cz: number, r: number, h: number, color: number, seg = 7) { const g = new THREE.ConeGeometry(r, h, seg); g.translate(cx, cy, cz); this.paint(g, color) }
  cyl(cx: number, cy: number, cz: number, rt: number, rb: number, h: number, color: number, seg = 8) { const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(cx, cy, cz); this.paint(g, color) }
  sphere(cx: number, cy: number, cz: number, r: number, color: number) { const g = new THREE.SphereGeometry(r, 7, 5); g.translate(cx, cy, cz); this.paint(g, color) }
  build(): THREE.Mesh | null {
    if (!this.geos.length) return null
    const merged = mergeGeometries(this.geos, false)!
    this.geos.forEach((g) => g.dispose())
    return new THREE.Mesh(merged, new THREE.MeshLambertMaterial({ vertexColors: true }))
  }
}

const BUBBLES = [
  'Wetin dey happen?', 'This go-slow wan kill me!', 'Abeg, one chance!', 'NEPA don take light again.', 'Oya, enter! Enter!', 'Jollof wars never end.', 'How market?', 'Sunday rice loading…',
  'Omo, this sun!', 'Sapa is real.', 'Na so e be.', 'Fuel don cost again!', 'Wahala for who no get generator.', 'Boss, na ₦200 only!', 'Small chops dey?', 'I dey come.',
]

export interface WorldNpc { id: string; name: string; gender: Gender; x: number; z: number; role: string }
export interface Near { place: PlaceId | null; npc: string | null }

export class WorldRenderer {
  readonly renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(52, 1, 0.5, 220)
  private nav: Nav
  private player: HumanParts
  private px: number
  private pz: number
  private heading = 0
  private moving = false
  private input = { x: 0, z: 0 }
  private path: { x: number; z: number }[] | null = null
  private raf = 0
  private last = 0
  private time = 0
  private raycaster = new THREE.Raycaster()
  private ground: THREE.Mesh
  private npcs = new Map<string, { parts: HumanParts; npc: WorldNpc; label: THREE.Sprite }>()
  private ambient: { parts: HumanParts; x: number; z: number; heading: number; timer: number; speed: number; bubble?: THREE.Sprite; bubbleT: number; sayT: number }[] = []
  private labelSprites = new Map<PlaceId, THREE.Sprite>()
  private textCache = new Map<string, THREE.SpriteMaterial>()
  private highlight: { place: PlaceId | null; ring: THREE.Mesh; arrow: THREE.Mesh } | null = null
  private nearCb?: (n: Near) => void
  private slowCb?: () => void
  private posCb?: (x: number, z: number, heading: number) => void
  private lastNear: Near = { place: null, npc: null }
  private posT = 0
  private quality = 0
  private frameMs = 16
  private slowFor = 0
  private ctxLost = false
  private disposed = false
  zoom = 1
  private followX = 0
  private followZ = 0

  constructor(private container: HTMLElement, private district: District, opts: { look: Appearance; age: number; uniform: boolean; month: number; spawn: { x: number; z: number } }) {
    const dpr = window.devicePixelRatio || 1
    this.renderer = new THREE.WebGLRenderer({ antialias: dpr <= 1.5, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(dpr, 1.5))
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block'
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.ctxLost = true })
    this.nav = buildNav(district)
    this.px = this.followX = opts.spawn.x; this.pz = this.followZ = opts.spawn.z

    this.scene.add(new THREE.HemisphereLight(0xfff0dc, 0x6a5a7a, 1.05))
    const sun = new THREE.DirectionalLight(0xfff0d0, 0.95); sun.position.set(-20, 40, 18); this.scene.add(sun)
    this.setMonth(opts.month)

    // ground
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.half * 2 + 60, WORLD.half * 2 + 60), new THREE.MeshLambertMaterial({ color: district.theme.ground }))
    this.ground.rotation.x = -Math.PI / 2; this.ground.position.y = -0.02; this.scene.add(this.ground)
    this.buildStatic()
    this.player = buildHuman({ look: opts.look, age: opts.age, uniform: opts.uniform, scale: 1.1 })
    this.scene.add(this.player.group)
    this.player.group.position.set(this.px, 0, this.pz)
    // shadow blob
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.7, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.04; this.player.group.add(sh)
    this.makeAmbient()
    this.makeHighlight()
    this.resize()
  }

  // ---------- environment ----------
  setMonth(m: number) {
    // 0..11. Harmattan haze (Dec-Feb), rains (May-Sep), clear otherwise.
    const harm = m === 11 || m <= 1, rain = m >= 4 && m <= 8
    const sky = harm ? 0xe6d3b2 : rain ? 0xa9bccb : m === 9 || m === 10 ? 0xffc9a0 : 0x9ed3ff
    this.scene.background = new THREE.Color(sky)
    this.scene.fog = new THREE.Fog(sky, harm ? 60 : rain ? 70 : 90, harm ? 150 : 180)
  }

  private buildStatic() {
    const d = this.district, t = d.theme
    const b = new Batch()
    // roads + sidewalks
    for (const r of d.roads) b.box((r.x0 + r.x1) / 2, 0.02, (r.z0 + r.z1) / 2, r.x1 - r.x0, 0.06, r.z1 - r.z0, t.roadColor)
    for (const r of d.sidewalks) b.box((r.x0 + r.x1) / 2, 0.07, (r.z0 + r.z1) / 2, r.x1 - r.x0, 0.12, r.z1 - r.z0, t.sidewalk)
    // dashed centre lines
    for (let x = -48; x < 48; x += 4) if (Math.abs(x) > 3.5) b.box(x + 1, 0.06, 0, 2, 0.02, 0.18, 0xf4f1e6)
    for (let z = -48; z < 48; z += 4) if (Math.abs(z) > 3.5) b.box(0, 0.06, z + 1, 0.18, 0.02, 2, 0xf4f1e6)
    // kerb stripes
    for (let x = -48; x < 48; x += 2) for (const z of [-3.1, 3.1]) b.box(x + 0.5, 0.1, z, 1, 0.12, 0.25, (x / 2) % 2 ? 0x1c1b22 : 0xffffff)
    // football pitch
    const pitch = d.places.find((p) => p.id === 'pitch')!
    b.box((pitch.rect.x0 + pitch.rect.x1) / 2, 0.03, (pitch.rect.z0 + pitch.rect.z1) / 2, pitch.rect.x1 - pitch.rect.x0, 0.05, pitch.rect.z1 - pitch.rect.z0, 0x2f9a4a)
    for (const gx of [pitch.rect.x0 + 0.5, pitch.rect.x1 - 0.5]) { b.box(gx, 1.2, (pitch.rect.z0 + pitch.rect.z1) / 2 - 1.6, 0.15, 2.4, 0.15, 0xffffff); b.box(gx, 1.2, (pitch.rect.z0 + pitch.rect.z1) / 2 + 1.6, 0.15, 2.4, 0.15, 0xffffff); b.box(gx, 2.4, (pitch.rect.z0 + pitch.rect.z1) / 2, 0.15, 0.15, 3.3, 0xffffff) }
    b.box((pitch.rect.x0 + pitch.rect.x1) / 2, 0.06, (pitch.rect.z0 + pitch.rect.z1) / 2, 0.15, 0.02, pitch.rect.z1 - pitch.rect.z0, 0xffffff)
    // market floor
    const mk = d.places.find((p) => p.id === 'market')!
    b.box((mk.rect.x0 + mk.rect.x1) / 2, 0.04, (mk.rect.z0 + mk.rect.z1) / 2, mk.rect.x1 - mk.rect.x0, 0.05, mk.rect.z1 - mk.rect.z0, 0xb98d57)
    // buildings
    for (const bl of d.buildings) {
      const { rect: r, h, color, roof } = bl
      const w = r.x1 - r.x0, dd = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2
      b.box(cx, h / 2, cz, w, h, dd, color)
      b.box(cx, h + 0.25, cz, w + 0.5, 0.5, dd + 0.5, roof)
      // south-facing windows (toward the camera) and east/west faces
      const rows = Math.max(1, Math.floor((h - 1.5) / 3)), cols = Math.max(1, Math.floor(w / 2.6))
      for (let rr = 0; rr < rows; rr++) for (let c = 0; c < cols; c++) {
        const lit = (rr * 7 + c * 3 + Math.floor(cx)) % 4 === 0
        b.box(r.x0 + (c + 0.5) * (w / cols), 2 + rr * 3, r.z1 + 0.04, 1.1, 1.4, 0.08, lit ? 0xffe9a6 : 0x4c6a8a)
      }
      const dc = Math.max(1, Math.floor(dd / 3.2))
      for (let rr = 0; rr < rows; rr++) for (let c = 0; c < dc; c++) b.box(r.x1 + 0.04, 2 + rr * 3, r.z0 + (c + 0.5) * (dd / dc), 0.08, 1.4, 1.1, 0x4c6a8a)
      if (bl.place) {
        const pl = d.places.find((p) => p.id === bl.place)!
        b.box(pl.door.x, 1.1, r.z1 + 0.05, 1.6, 2.2, 0.12, 0x6a3b1d) // door on the south face
        if (pl.door.z < r.z0) b.box(pl.door.x, 1.1, r.z0 - 0.05, 1.6, 2.2, 0.12, 0x6a3b1d)
        b.box(cx, h + 1.3, cz, Math.min(w - 2, 6), 1.6, 0.3, pl.color) // roof sign board
      }
    }
    // compound fence + gate marker near home
    const home = d.places.find((p) => p.id === 'home')!
    b.box(home.door.x, 0.05, home.door.z + 1, 3, 0.05, 3, 0xfff1a8)
    // props
    for (const p of d.props) {
      const cx = (p.rect.x0 + p.rect.x1) / 2, cz = (p.rect.z0 + p.rect.z1) / 2, w = p.rect.x1 - p.rect.x0, dd = p.rect.z1 - p.rect.z0
      if (p.kind === 'tree') { b.cyl(cx, p.h * 0.3, cz, 0.18, 0.28, p.h * 0.6, 0x6a4a2a); b.cone(cx, p.h * 0.75, cz, 1.4, p.h * 0.9, p.color); b.cone(cx, p.h * 1.1, cz, 1.0, p.h * 0.7, 0x3a9a4a) }
      else if (p.kind === 'lamp') { b.box(cx, 2.7, cz, 0.14, 5.4, 0.14, p.color); b.box(cx + (cz < 0 ? 0 : 0), 5.4, cz + (cz < 0 ? 0.4 : -0.4), 0.3, 0.12, 0.9, 0xffe9a6) }
      else if (p.kind === 'stall') { b.box(cx, 0.55, cz, w, 1.1, dd, 0x6a3b1d); b.cyl(cx, 1.6, cz, 0.04, 0.04, 2.1, 0x4a3320); b.cone(cx, 2.55, cz, 2.0, 0.7, p.color, 8); b.box(cx, 1.2, cz, w * 0.7, 0.18, dd * 0.7, [0xd9534f, 0xf0ad4e, 0x5cb85c][Math.floor(cx + cz) % 3]) }
      else if (p.kind === 'kiosk') { b.box(cx, 1.2, cz, w, 2.4, dd, p.color); b.box(cx, 2.55, cz, w + 0.4, 0.3, dd + 0.4, 0xffd23f) }
      else if (p.kind === 'bus') {
        b.box(cx, 1.4, cz, w, 1.8, dd, 0xffd23f); b.box(cx, 1.15, cz, w + 0.04, 0.34, dd + 0.04, 0x1c1b22); b.box(cx, 2.35, cz, w - 0.2, 0.12, dd - 0.6, 0x3a3a44)
        for (let i = 0; i < 3; i++) b.box(cx, 1.85, cz - dd / 2 + 1 + i * (dd / 3.3), w + 0.06, 0.5, 1.0, 0x9fd1ff)
        for (const sx of [-0.9, 0.9]) for (const sz of [-1.6, 1.6]) b.cyl(cx + sx, 0.45, cz + sz, 0.45, 0.45, 0.3, 0x1c1b22, 10)
      }
    }
    // bus stop shelter
    const bs = d.places.find((p) => p.id === 'busstop')!
    b.box((bs.rect.x0 + bs.rect.x1) / 2, 3.0, (bs.rect.z0 + bs.rect.z1) / 2, 4, 0.3, 5, 0xffd23f)
    for (const [sx, sz] of [[bs.rect.x0 + 0.3, bs.rect.z0 + 0.3], [bs.rect.x1 - 0.3, bs.rect.z0 + 0.3], [bs.rect.x0 + 0.3, bs.rect.z1 - 0.3], [bs.rect.x1 - 0.3, bs.rect.z1 - 0.3]]) b.box(sx, 1.5, sz, 0.2, 3, 0.2, 0x555566)
    // generators and water tanks for flavour
    for (const bl of d.buildings.slice(0, 18)) if (!bl.place) { b.box(bl.rect.x1 + 0.7, 0.45, bl.rect.z1 - 1, 0.9, 0.9, 0.9, 0xc4262e) }
    const mesh = b.build()
    if (mesh) this.scene.add(mesh)
  }

  private textSprite(text: string, opts: { icon?: string; bg?: string; fg?: string; size?: number } = {}): THREE.Sprite {
    const key = `${opts.icon ?? ''}|${text}|${opts.bg ?? ''}`
    let m = this.textCache.get(key)
    if (!m) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 128
      const g = c.getContext('2d')!
      const label = (opts.icon ? opts.icon + ' ' : '') + text
      g.font = '800 40px system-ui, "Nunito", sans-serif'
      const w = Math.min(496, g.measureText(label).width + 40)
      g.fillStyle = opts.bg ?? 'rgba(20,18,31,0.88)'; g.beginPath(); (g as CanvasRenderingContext2D & { roundRect: (...a: number[]) => void }).roundRect((512 - w) / 2, 22, w, 84, 30); g.fill()
      g.fillStyle = opts.fg ?? '#fff8ea'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, 256, 66, 480)
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
      m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })
      this.textCache.set(key, m)
    }
    const s = new THREE.Sprite(m); const sc = opts.size ?? 6; s.scale.set(sc, sc / 4, 1); return s
  }

  setPlaceLabels(active: Partial<Record<PlaceId, boolean>>) {
    for (const [id, s] of this.labelSprites) { this.scene.remove(s); void id }
    this.labelSprites.clear()
    for (const p of this.district.places) {
      const on = active[p.id] !== false
      const s = this.textSprite(p.name, { icon: p.icon, bg: on ? 'rgba(20,18,31,0.88)' : 'rgba(60,60,70,0.7)', fg: on ? '#fff8ea' : '#aaa' , size: Math.min(15, 5.5 + p.name.length * 0.5) })
      const bl = this.district.buildings.find((x) => x.place === p.id)
      s.position.set(p.door.x + (p.open ? 0 : 0), bl ? bl.h + 3.4 : 5.2, p.open ? p.door.z : (p.rect.z0 + p.rect.z1) / 2)
      this.scene.add(s); this.labelSprites.set(p.id, s)
    }
  }

  private makeHighlight() {
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.9, 24), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.12; ring.visible = false
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 4), new THREE.MeshBasicMaterial({ color: 0xffd23f })); arrow.rotation.x = Math.PI; arrow.visible = false
    this.scene.add(ring, arrow)
    this.highlight = { place: null, ring, arrow }
  }
  setHighlight(place: PlaceId | null) { if (this.highlight) this.highlight.place = place }

  private makeAmbient() {
    const rng = (a: number, b: number) => a + Math.random() * (b - a)
    const names = ['Tola', 'Emeka', 'Aisha', 'Bayo', 'Chioma', 'Musa', 'Kemi', 'Obi', 'Zainab', 'Femi', 'Ngozi', 'Sani', 'Ade', 'Ife']
    for (let i = 0; i < 9; i++) {
      const g: Gender = i % 2 ? 'male' : 'female'
      const parts = buildHuman({ look: hashLook(names[i] + i, g), age: 20 + (i % 5) * 8, scale: 1.1 })
      let x = 0, z = 0, ok = false
      for (let k = 0; k < 40 && !ok; k++) { x = rng(-40, 40); z = Math.random() < 0.5 ? rng(-5, 5) : rng(-40, 40); ok = this.free(x, z) }
      parts.group.position.set(x, 0, z); this.scene.add(parts.group)
      this.ambient.push({ parts, x, z, heading: rng(0, Math.PI * 2), timer: rng(1, 4), speed: rng(1.2, 2.4), bubbleT: 0, sayT: rng(3, 12) })
    }
  }
  private free(x: number, z: number) { return Math.abs(x) < WORLD.half - 2 && Math.abs(z) < WORLD.half - 2 && !this.district.blockers.some((b) => x > b.x0 - 0.6 && x < b.x1 + 0.6 && z > b.z0 - 0.6 && z < b.z1 + 0.6) }

  setNpcs(list: WorldNpc[]) {
    const keep = new Set(list.map((n) => n.id))
    for (const [id, o] of this.npcs) if (!keep.has(id)) { this.scene.remove(o.parts.group); this.scene.remove(o.label); this.npcs.delete(id) }
    for (const n of list) {
      const ex = this.npcs.get(n.id)
      if (ex) { ex.npc = n; ex.parts.group.position.set(n.x, 0, n.z); ex.label.position.set(n.x, 3.7, n.z); continue }
      const parts = buildHuman({ look: hashLook(n.name, n.gender), age: n.role === 'mother' || n.role === 'father' ? 45 : n.role === 'child' ? 6 : 22, scale: 1.15 })
      parts.group.position.set(n.x, 0, n.z); this.scene.add(parts.group)
      const label = this.textSprite(n.name, { bg: 'rgba(255,210,63,0.92)', fg: '#1c1b22', size: 3.4 }); label.position.set(n.x, 3.7, n.z); this.scene.add(label)
      this.npcs.set(n.id, { parts, npc: n, label })
    }
  }

  // ---------- control ----------
  get position() { return { x: this.px, z: this.pz } }
  setInput(x: number, z: number) { this.input.x = x; this.input.z = z; if (x || z) { this.path = null } }
  walkTo(x: number, z: number) { const p = findPath(this.nav, { x: this.px, z: this.pz }, { x, z }); this.path = p; return !!p }
  cancelWalk() { this.path = null }
  get walking() { return !!this.path }
  onNear(cb: (n: Near) => void) { this.nearCb = cb }
  onSlow(cb: () => void) { this.slowCb = cb }
  onPosition(cb: (x: number, z: number, h: number) => void) { this.posCb = cb }

  pickGround(clientX: number, clientY: number): { x: number; z: number } | null {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const v = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(v, this.camera)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const out = new THREE.Vector3()
    return this.raycaster.ray.intersectPlane(plane, out) ? { x: out.x, z: out.z } : null
  }

  start() {
    this.last = performance.now()
    const loop = (now: number) => {
      if (this.disposed) return
      this.raf = requestAnimationFrame(loop)
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now
      this.step(dt)
      this.render(dt)
    }
    this.raf = requestAnimationFrame(loop)
  }

  private step(dt: number) {
    this.time += dt
    const speed = 5.6
    let dx = 0, dz = 0
    const mag = Math.hypot(this.input.x, this.input.z)
    if (mag > 0.05) { dx = (this.input.x / Math.max(1, mag)) * speed * dt; dz = (this.input.z / Math.max(1, mag)) * speed * dt }
    else if (this.path && this.path.length) {
      const t = this.path[0]
      const vx = t.x - this.px, vz = t.z - this.pz, d = Math.hypot(vx, vz)
      if (d < 0.35) { this.path.shift(); if (!this.path.length) { this.path = null } }
      else { dx = (vx / d) * speed * dt; dz = (vz / d) * speed * dt }
    }
    this.moving = dx !== 0 || dz !== 0
    if (this.moving) {
      const p = moveWithCollision(this.district.blockers, this.px, this.pz, dx, dz)
      if (Math.abs(p.x - this.px) < 1e-4 && Math.abs(p.z - this.pz) < 1e-4) { this.moving = false; if (this.path && !mag) { this.path = null } } else {
        this.heading = Math.atan2(dx, dz); this.px = p.x; this.pz = p.z
      }
    }
    this.player.group.position.set(this.px, 0, this.pz)
    this.player.group.rotation.y += (this.angleDiff(this.heading, this.player.group.rotation.y)) * Math.min(1, dt * 14)
    animateHuman(this.player, this.time, this.moving)
    // ambient wanderers
    for (const a of this.ambient) {
      a.timer -= dt
      if (a.timer <= 0) { a.heading += (Math.random() - 0.5) * 2.6; a.timer = 2 + Math.random() * 4; if (Math.random() < 0.25) a.speed = 0; else a.speed = 1.2 + Math.random() * 1.2 }
      const mx = Math.sin(a.heading) * a.speed * dt, mz = Math.cos(a.heading) * a.speed * dt
      const p = moveWithCollision(this.district.blockers, a.x, a.z, mx, mz)
      if (a.speed > 0 && Math.abs(p.x - a.x) < 1e-5 && Math.abs(p.z - a.z) < 1e-5) a.heading += Math.PI * (0.5 + Math.random() * 0.5)
      a.x = p.x; a.z = p.z
      a.parts.group.position.set(a.x, 0, a.z)
      a.parts.group.rotation.y += this.angleDiff(a.heading, a.parts.group.rotation.y) * Math.min(1, dt * 6)
      animateHuman(a.parts, this.time + a.x, a.speed > 0, 0.55)
      // speech bubbles when the player is near
      const near = Math.hypot(a.x - this.px, a.z - this.pz) < 13
      a.sayT -= dt
      if (a.bubble) { a.bubbleT -= dt; a.bubble.position.set(a.x, 3.2, a.z); if (a.bubbleT <= 0) { this.scene.remove(a.bubble); a.bubble = undefined } }
      else if (near && a.sayT <= 0) { a.sayT = 9 + Math.random() * 12; a.bubbleT = 3.6; a.bubble = this.textSprite(BUBBLES[Math.floor(Math.random() * BUBBLES.length)], { bg: 'rgba(255,255,255,0.94)', fg: '#1c1b22', size: 5.2 }); this.scene.add(a.bubble) }
    }
    // proximity
    this.posT += dt
    if (this.posT > 0.12) {
      this.posT = 0
      let place: PlaceId | null = null, bd = 1e9
      for (const p of this.district.places) { const d = Math.hypot(p.door.x - this.px, p.door.z - this.pz); if (d <= p.zoneR && d < bd) { bd = d; place = p.id } }
      let npc: string | null = null, nd = 3
      for (const [id, o] of this.npcs) { const d = Math.hypot(o.npc.x - this.px, o.npc.z - this.pz); if (d < nd) { nd = d; npc = id } }
      if (place !== this.lastNear.place || npc !== this.lastNear.npc) { this.lastNear = { place, npc }; this.nearCb?.({ place, npc }) }
      this.posCb?.(this.px, this.pz, this.heading)
    }
  }

  private angleDiff(target: number, current: number) {
    let d = (target - (current % (Math.PI * 2))) % (Math.PI * 2)
    if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2
    return d
  }

  private render(dt: number) {
    if (this.ctxLost) return
    const t0 = performance.now()
    // camera follow (fixed chase angle)
    this.followX += (this.px - this.followX) * Math.min(1, dt * 5); this.followZ += (this.pz - this.followZ) * Math.min(1, dt * 5)
    const aspect = this.camera.aspect
    const dist = (aspect < 0.8 ? 1.12 : 1) * this.zoom
    this.camera.position.set(this.followX, 24 * dist, this.followZ + 12 * dist)
    this.camera.lookAt(this.followX, 0, this.followZ - 1)
    // highlight
    const h = this.highlight
    if (h) {
      const pl = h.place ? this.district.places.find((p) => p.id === h.place) : null
      h.ring.visible = h.arrow.visible = !!pl
      if (pl) {
        h.ring.position.set(pl.door.x, 0.12, pl.door.z); h.ring.scale.setScalar(1 + Math.sin(this.time * 4) * 0.12)
        h.arrow.position.set(pl.door.x, 3.2 + Math.abs(Math.sin(this.time * 3)) * 0.7, pl.door.z)
      }
    }
    for (const o of this.npcs.values()) { o.parts.group.rotation.y += this.angleDiff(Math.atan2(this.px - o.npc.x, this.pz - o.npc.z), o.parts.group.rotation.y) * Math.min(1, dt * 3); animateHuman(o.parts, this.time, false) }
    this.renderer.render(this.scene, this.camera)
    const ms = performance.now() - t0
    this.frameMs = this.frameMs * 0.92 + Math.max(ms, dt * 500) * 0.08
    this.slowFor = this.frameMs > 24 ? this.slowFor + dt : Math.max(0, this.slowFor - dt)
    if (this.slowFor > 2 && this.quality < 2) { this.quality++; this.slowFor = 0; this.renderer.setPixelRatio(this.quality === 1 ? 1 : 0.75); this.resize(); if (this.quality === 2) this.slowCb?.() }
  }

  resize() {
    const w = this.container.clientWidth || 360, h = this.container.clientHeight || 640
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.fov = w / h < 0.8 ? 54 : 48
    this.camera.updateProjectionMatrix()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); const mt = m.material as THREE.Material | THREE.Material[] | undefined; if (Array.isArray(mt)) mt.forEach((x) => x.dispose()); else mt?.dispose() })
    this.textCache.forEach((m) => { m.map?.dispose(); m.dispose() })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

export type { Rect }
