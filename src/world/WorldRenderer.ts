// Three.js renderer for the explorable district and building interiors.
// Static scenery is merged into a few draw calls; time of day drives lighting, windows and lamps.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Appearance, Gender } from '@engine/core/types'
import type { Wear } from '@content/items'
import { WORLD, type District, type PlaceId, type Rect } from './layout'
import { buildNav, findPath, moveWithCollision, walkable, type Nav } from './nav'
import { animateHuman, buildHuman, hashLook, type HumanParts } from './characters'
import { InteriorView, type InteriorState } from './InteriorView'
import { lightingAt } from './time'

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
  build(material?: THREE.Material): THREE.Mesh | null {
    if (!this.geos.length) return null
    const merged = mergeGeometries(this.geos, false)!
    this.geos.forEach((g) => g.dispose())
    return new THREE.Mesh(merged, material ?? new THREE.MeshLambertMaterial({ vertexColors: true }))
  }
}

const BUBBLES = [
  'Wetin dey happen?', 'This go-slow wan kill me!', 'Abeg, one chance!', 'NEPA don take light again.', 'Oya, enter! Enter!', 'Jollof wars never end.', 'How market?', 'Sunday rice loading…',
  'Omo, this sun!', 'Sapa is real.', 'Na so e be.', 'Fuel don cost again!', 'Wahala for who no get generator.', 'Boss, na ₦200 only!', 'Small chops dey?', 'I dey come.',
]

export interface WorldNpc { id: string; name: string; gender: Gender; x: number; z: number; role: string; wander?: { x: number; z: number; r: number } }
export interface Near { place: PlaceId | null; npc: string | null }
export interface NearInside { hotspot: string | null; person: string | null; exit: boolean }

export class WorldRenderer {
  readonly renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(52, 1, 0.5, 220)
  private hemi = new THREE.HemisphereLight(0xfff0dc, 0x6a5a7a, 1.05)
  private sun = new THREE.DirectionalLight(0xfff0d0, 0.95)
  private winLitMat = new THREE.MeshBasicMaterial({ color: 0xcdd9e6 })
  private lampMat = new THREE.MeshBasicMaterial({ color: 0x888888 })
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
  private npcs = new Map<string, { parts: HumanParts; npc: WorldNpc; label: THREE.Sprite; tx: number; tz: number; wt: number; moving: boolean }>()
  private ambient: { parts: HumanParts; x: number; z: number; heading: number; timer: number; speed: number; bubble?: THREE.Sprite; bubbleT: number; sayT: number }[] = []
  private labelSprites = new Map<PlaceId, THREE.Sprite>()
  private textCache = new Map<string, THREE.SpriteMaterial>()
  private highlight: { place: PlaceId | null; ring: THREE.Mesh; arrow: THREE.Mesh } | null = null
  private nearCb?: (n: Near) => void
  private nearInCb?: (n: NearInside) => void
  private slowCb?: () => void
  private posCb?: (x: number, z: number, heading: number) => void
  private lastNear: Near = { place: null, npc: null }
  private lastNearIn: NearInside = { hotspot: null, person: null, exit: false }
  private posT = 0
  private quality = 0
  private frameMs = 16
  private slowFor = 0
  private ctxLost = false
  private disposed = false
  private month = 0
  private hour = 9
  zoom = 1
  private followX = 0
  private followZ = 0
  // interior state
  private interior: InteriorView | null = null
  private outside = { x: 0, z: 0 }
  private sleeping = false
  private shadow: THREE.Mesh
  private camLook = new THREE.Vector3()
  // scene directing (used by in-world tasks: class, penalties, conversations)
  frozen = false
  speedMul = 1
  private sitting = false
  private camOverride: { pos: [number, number, number]; look: [number, number, number]; shift?: number } | null = null
  private viewShift = 0
  private actors = new Map<string, { parts: HumanParts; x: number; z: number; tx: number; tz: number; follow: boolean; moving: boolean; locked: boolean; scene: THREE.Scene }>()
  private bubbles: { sprite: THREE.Sprite; id: string; t: number; scene: THREE.Scene; text: string; tail: number }[] = []
  private ballMesh?: THREE.Mesh
  private stallGroup?: THREE.Group
  private marks = new Map<string, THREE.Sprite>()

  constructor(private container: HTMLElement, private district: District, opts: { look: Appearance; age: number; gender: Gender; wear: Wear[]; uniform: boolean; month: number; hour: number; spawn: { x: number; z: number } }) {
    const dpr = window.devicePixelRatio || 1
    this.renderer = new THREE.WebGLRenderer({ antialias: dpr <= 1.5, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(dpr, 1.5))
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block'
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.ctxLost = true })
    this.nav = buildNav(district)
    this.px = this.followX = opts.spawn.x; this.pz = this.followZ = opts.spawn.z
    this.month = opts.month; this.hour = opts.hour

    this.scene.add(this.hemi, this.sun)
    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.half * 2 + 60, WORLD.half * 2 + 60), new THREE.MeshLambertMaterial({ color: district.theme.ground }))
    this.ground.rotation.x = -Math.PI / 2; this.ground.position.y = -0.02; this.scene.add(this.ground)
    this.buildStatic()
    if (district.theme.city === 'abuja') this.addRocks()
    this.player = buildHuman({ look: opts.look, age: opts.age, gender: opts.gender, wear: opts.wear, uniform: opts.uniform, scale: 1.1 })
    this.scene.add(this.player.group)
    this.player.group.position.set(this.px, 0, this.pz)
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.7, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })); this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.04; this.player.group.add(this.shadow)
    this.makeAmbient()
    this.makeHighlight()
    this.applyLighting()
    this.resize()
  }

  /** Abuja's skyline: big granite inselbergs (think Aso Rock and Zuma Rock) standing behind the district. */
  private addRocks() {
    const mat = new THREE.MeshLambertMaterial({ color: 0x8c7d6c, flatShading: true })
    for (const [x, z, sx, sy, sz] of [[-62, -118, 46, 26, 30], [10, -135, 62, 38, 40], [78, -112, 34, 18, 26], [-110, 40, 30, 20, 34]] as const) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat); m.scale.set(sx, sy, sz); m.position.set(x, sy * 0.35, z); m.rotation.y = x; this.scene.add(m)
    }
  }

  // ---------- lighting ----------
  setMonth(m: number) { this.month = m; this.applyLighting() }
  setHour(h: number) { this.hour = h; this.applyLighting(); if (this.interior) this.interior.setState({ ...this.istate, hour: h }) }
  private istate: InteriorState = { light: true, tv: false, fan: false, hour: 9 }

  private applyLighting() {
    const L = lightingAt(this.hour)
    const m = this.month
    const harm = m === 11 || m <= 1, rain = m >= 4 && m <= 8
    const tint = (c: number, haze: number, mix: number) => new THREE.Color(c).lerp(new THREE.Color(haze), mix * (1 - L.dark))
    const sky = tint(L.sky, harm ? 0xe6d3b2 : rain ? 0xa9bccb : L.sky, harm ? 0.55 : rain ? 0.45 : 0)
    this.scene.background = sky
    this.scene.fog = new THREE.Fog(sky.getHex(), harm ? 60 : rain ? 70 : 90, harm ? 150 : 180)
    this.hemi.color.setHex(L.hemiSky); this.hemi.groundColor.setHex(L.hemiGround); this.hemi.intensity = L.hemiI * (rain ? 0.9 : 1)
    this.sun.color.setHex(L.sun); this.sun.intensity = L.sunI; this.sun.position.set(...L.sunPos)
    this.winLitMat.color.setHex(L.dark > 0.5 ? 0xffe08a : L.dark > 0.15 ? 0xffd27a : 0xc9d6e4)
    this.lampMat.color.setHex(L.dark > 0.5 ? 0xfff0a0 : L.dark > 0.15 ? 0xffe9a6 : 0x8a8a92)
  }

  private buildStatic() {
    const d = this.district, t = d.theme
    const b = new Batch(), lit = new Batch(), lamps = new Batch()
    for (const r of d.roads) b.box((r.x0 + r.x1) / 2, 0.02, (r.z0 + r.z1) / 2, r.x1 - r.x0, 0.06, r.z1 - r.z0, t.roadColor)
    for (const r of d.sidewalks) b.box((r.x0 + r.x1) / 2, 0.07, (r.z0 + r.z1) / 2, r.x1 - r.x0, 0.12, r.z1 - r.z0, t.sidewalk)
    for (let x = -48; x < 48; x += 4) if (Math.abs(x) > 3.5) b.box(x + 1, 0.06, 0, 2, 0.02, 0.18, 0xf4f1e6)
    for (let z = -48; z < 48; z += 4) if (Math.abs(z) > 3.5) b.box(0, 0.06, z + 1, 0.18, 0.02, 2, 0xf4f1e6)
    for (let x = -48; x < 48; x += 2) for (const z of [-3.1, 3.1]) b.box(x + 0.5, 0.1, z, 1, 0.12, 0.25, (x / 2) % 2 ? 0x1c1b22 : 0xffffff)
    const pitch = d.places.find((p) => p.id === 'pitch')!
    b.box((pitch.rect.x0 + pitch.rect.x1) / 2, 0.03, (pitch.rect.z0 + pitch.rect.z1) / 2, pitch.rect.x1 - pitch.rect.x0, 0.05, pitch.rect.z1 - pitch.rect.z0, 0x2f9a4a)
    for (const gx of [pitch.rect.x0 + 0.5, pitch.rect.x1 - 0.5]) { b.box(gx, 1.2, (pitch.rect.z0 + pitch.rect.z1) / 2 - 1.6, 0.15, 2.4, 0.15, 0xffffff); b.box(gx, 1.2, (pitch.rect.z0 + pitch.rect.z1) / 2 + 1.6, 0.15, 2.4, 0.15, 0xffffff); b.box(gx, 2.4, (pitch.rect.z0 + pitch.rect.z1) / 2, 0.15, 0.15, 3.3, 0xffffff) }
    b.box((pitch.rect.x0 + pitch.rect.x1) / 2, 0.06, (pitch.rect.z0 + pitch.rect.z1) / 2, 0.15, 0.02, pitch.rect.z1 - pitch.rect.z0, 0xffffff)
    const mk = d.places.find((p) => p.id === 'market')!
    b.box((mk.rect.x0 + mk.rect.x1) / 2, 0.04, (mk.rect.z0 + mk.rect.z1) / 2, mk.rect.x1 - mk.rect.x0, 0.05, mk.rect.z1 - mk.rect.z0, 0xb98d57)
    for (const bl of d.buildings) {
      const { rect: r, h, color, roof } = bl
      const w = r.x1 - r.x0, dd = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2
      b.box(cx, h / 2, cz, w, h, dd, color)
      b.box(cx, h + 0.25, cz, w + 0.5, 0.5, dd + 0.5, roof)
      const rows = Math.max(1, Math.floor((h - 1.5) / 3)), cols = Math.max(1, Math.floor(w / 2.6))
      for (let rr = 0; rr < rows; rr++) for (let c = 0; c < cols; c++) {
        const isLit = (rr * 7 + c * 3 + Math.floor(cx)) % 3 === 0
        ;(isLit ? lit : b).box(r.x0 + (c + 0.5) * (w / cols), 2 + rr * 3, r.z1 + 0.04, 1.1, 1.4, 0.08, 0x4c6a8a)
      }
      const dc = Math.max(1, Math.floor(dd / 3.2))
      for (let rr = 0; rr < rows; rr++) for (let c = 0; c < dc; c++) ((rr + c) % 3 === 0 ? lit : b).box(r.x1 + 0.04, 2 + rr * 3, r.z0 + (c + 0.5) * (dd / dc), 0.08, 1.4, 1.1, 0x4c6a8a)
      if (bl.place) {
        const pl = d.places.find((p) => p.id === bl.place)!
        b.box(pl.door.x, 1.1, r.z1 + 0.05, 1.6, 2.2, 0.12, 0x6a3b1d)
        b.box(cx, h + 1.3, cz, Math.min(w - 2, 6), 1.6, 0.3, pl.color)
      }
    }
    const home = d.places.find((p) => p.id === 'home')!
    b.box(home.door.x, 0.05, home.door.z + 1, 3, 0.05, 3, 0xfff1a8)
    for (const p of d.props) {
      const cx = (p.rect.x0 + p.rect.x1) / 2, cz = (p.rect.z0 + p.rect.z1) / 2, w = p.rect.x1 - p.rect.x0, dd = p.rect.z1 - p.rect.z0
      if (p.kind === 'tree') { b.cyl(cx, p.h * 0.3, cz, 0.18, 0.28, p.h * 0.6, 0x6a4a2a); b.cone(cx, p.h * 0.75, cz, 1.4, p.h * 0.9, p.color); b.cone(cx, p.h * 1.1, cz, 1.0, p.h * 0.7, 0x3a9a4a) }
      else if (p.kind === 'lamp') { b.box(cx, 2.7, cz, 0.14, 5.4, 0.14, p.color); lamps.box(cx, 5.4, cz + (cz < 0 ? 0.4 : -0.4), 0.5, 0.2, 1.0, 0xffffff) }
      else if (p.kind === 'stall') { b.box(cx, 0.55, cz, w, 1.1, dd, 0x6a3b1d); b.cyl(cx, 1.6, cz, 0.04, 0.04, 2.1, 0x4a3320); b.cone(cx, 2.55, cz, 2.0, 0.7, p.color, 8); b.box(cx, 1.2, cz, w * 0.7, 0.18, dd * 0.7, [0xd9534f, 0xf0ad4e, 0x5cb85c][Math.floor(cx + cz) % 3]) }
      else if (p.kind === 'kiosk') { b.box(cx, 1.2, cz, w, 2.4, dd, p.color); b.box(cx, 2.55, cz, w + 0.4, 0.3, dd + 0.4, 0xffd23f) }
      else if (p.kind === 'bus' && d.theme.city === 'abuja') {
        // Abuja: green and white taxis (two parked nose to tail)
        for (const oz of [-dd / 4, dd / 4]) {
          const z0 = cz + oz
          b.box(cx, 0.75, z0, w * 0.82, 0.8, dd * 0.46, 0x1f9d55); b.box(cx, 1.05, z0, w * 0.84, 0.2, dd * 0.47, 0xffffff)
          b.box(cx, 1.45, z0 - 0.1, w * 0.66, 0.7, dd * 0.24, 0x1f9d55); b.box(cx, 1.5, z0 - 0.1, w * 0.68, 0.45, dd * 0.2, 0x9fd1ff)
          b.box(cx, 1.92, z0 - 0.1, w * 0.3, 0.16, 0.5, 0xffffff)
          for (const sx of [-0.4, 0.4]) for (const sz of [-0.28, 0.28]) b.cyl(cx + sx * w, 0.3, z0 + sz * dd * 0.46, 0.3, 0.3, 0.22, 0x1c1b22, 10)
        }
      }
      else if (p.kind === 'bus') {
        b.box(cx, 1.4, cz, w, 1.8, dd, 0xffd23f); b.box(cx, 1.15, cz, w + 0.04, 0.34, dd + 0.04, 0x1c1b22); b.box(cx, 2.35, cz, w - 0.2, 0.12, dd - 0.6, 0x3a3a44)
        for (let i = 0; i < 3; i++) b.box(cx, 1.85, cz - dd / 2 + 1 + i * (dd / 3.3), w + 0.06, 0.5, 1.0, 0x9fd1ff)
        for (const sx of [-0.9, 0.9]) for (const sz of [-1.6, 1.6]) b.cyl(cx + sx, 0.45, cz + sz, 0.45, 0.45, 0.3, 0x1c1b22, 10)
      }
    }
    const bs = d.places.find((p) => p.id === 'busstop')!
    b.box((bs.rect.x0 + bs.rect.x1) / 2, 3.0, (bs.rect.z0 + bs.rect.z1) / 2, 4, 0.3, 5, d.theme.city === 'abuja' ? 0x1f9d55 : 0xffd23f)
    for (const [sx, sz] of [[bs.rect.x0 + 0.3, bs.rect.z0 + 0.3], [bs.rect.x1 - 0.3, bs.rect.z0 + 0.3], [bs.rect.x0 + 0.3, bs.rect.z1 - 0.3], [bs.rect.x1 - 0.3, bs.rect.z1 - 0.3]]) b.box(sx, 1.5, sz, 0.2, 3, 0.2, 0x555566)
    for (const bl of d.buildings.slice(0, 18)) if (!bl.place) b.box(bl.rect.x1 + 0.7, 0.45, bl.rect.z1 - 1, 0.9, 0.9, 0.9, 0xc4262e)
    const mesh = b.build(); if (mesh) this.scene.add(mesh)
    const litMesh = lit.build(this.winLitMat); if (litMesh) this.scene.add(litMesh)
    const lampMesh = lamps.build(this.lampMat); if (lampMesh) this.scene.add(lampMesh)
  }

  private textSprite(text: string, opts: { icon?: string; bg?: string; fg?: string; size?: number } = {}): THREE.Sprite {
    const key = `${opts.icon ?? ''}|${text}|${opts.bg ?? ''}|${opts.fg ?? ''}`
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

  setPlaceLabels(state: Partial<Record<PlaceId, 'open' | 'closed' | 'inactive'>>) {
    for (const s of this.labelSprites.values()) this.scene.remove(s)
    this.labelSprites.clear()
    for (const p of this.district.places) {
      const st = state[p.id] ?? 'open'
      const s = this.textSprite(p.name, { icon: st === 'closed' ? '🔒' : p.icon, bg: st === 'open' ? 'rgba(20,18,31,0.88)' : 'rgba(60,60,70,0.78)', fg: st === 'open' ? '#fff8ea' : '#bbb', size: Math.min(10, 4.4 + p.name.length * 0.32) })
      const bl = this.district.buildings.find((x) => x.place === p.id)
      s.position.set(p.door.x, bl ? bl.h + 3.4 : 5.2, p.open ? p.door.z : (p.rect.z0 + p.rect.z1) / 2)
      this.scene.add(s); this.labelSprites.set(p.id, s)
    }
  }

  private makeHighlight() {
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.9, 24), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.12; ring.visible = false
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 4), new THREE.MeshBasicMaterial({ color: 0xffd23f })); arrow.rotation.x = Math.PI; arrow.visible = false
    this.scene.add(ring, arrow)
    this.highlight = { place: null, ring, arrow }
  }
  setLabelsVisible(v: boolean) { for (const l of this.labelSprites.values()) l.visible = v }
  setHighlight(place: PlaceId | null) { if (this.highlight) this.highlight.place = place }
  setInteriorMarker(id: string | null) { this.interior?.setMarker(id) }

  private makeAmbient() {
    const rng = (a: number, b: number) => a + Math.random() * (b - a)
    const names = ['Tola', 'Emeka', 'Aisha', 'Bayo', 'Chioma', 'Musa', 'Kemi', 'Obi', 'Zainab']
    for (let i = 0; i < 9; i++) {
      const g: Gender = i % 2 ? 'male' : 'female'
      const parts = buildHuman({ look: hashLook(names[i] + i, g), gender: g, age: 20 + (i % 5) * 8, scale: 1.1 })
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
      if (ex) { const keep = n.wander && ex.npc.wander; ex.npc = { ...n, x: keep ? ex.npc.x : n.x, z: keep ? ex.npc.z : n.z }; if (!keep) { ex.parts.group.position.set(n.x, 0, n.z); ex.label.position.set(n.x, 3.7, n.z); ex.tx = n.x; ex.tz = n.z } continue }
      const parts = buildHuman({ look: hashLook(n.name, n.gender), gender: n.gender, age: n.role === 'child' ? 6 : 22, scale: 1.15 })
      parts.group.position.set(n.x, 0, n.z); this.scene.add(parts.group)
      const label = this.textSprite(n.name, { bg: 'rgba(255,210,63,0.92)', fg: '#1c1b22', size: 3.4 }); label.position.set(n.x, 3.7, n.z); this.scene.add(label)
      this.npcs.set(n.id, { parts, npc: n, label, tx: n.x, tz: n.z, wt: 1 + Math.random() * 3, moving: false })
    }
  }

  // ---------- interiors ----------
  get inside(): PlaceId | null { return this.interior?.def.id ?? null }
  enterInterior(place: PlaceId, people: { id: string; name: string; gender: Gender; role: string }[], state: InteriorState, outsideAt?: { x: number; z: number }, installed?: Set<string>): boolean {
    let view: InteriorView
    try { view = new InteriorView(place, installed) } catch { return false }
    this.installedSet = installed ?? null
    this.interior?.dispose()
    this.outside = outsideAt ?? { x: this.px, z: this.pz }
    this.interior = view
    this.istate = state
    view.setPeople(people); view.setState(state)
    view.scene.add(this.player.group)
    this.px = this.followX = view.def.spawn.x; this.pz = this.followZ = view.def.spawn.z
    this.player.group.position.set(this.px, 0, this.pz); this.player.group.rotation.set(0, 0, 0)
    this.path = null; this.input = { x: 0, z: 0 }; this.heading = Math.PI
    this.lastNearIn = { hotspot: null, person: null, exit: false }
    return true
  }
  exitInterior() {
    if (!this.interior) return
    this.setSleeping(false)
    this.scene.add(this.player.group)
    this.interior.dispose(); this.interior = null
    this.px = this.followX = this.outside.x; this.pz = this.followZ = this.outside.z + 1.8
    this.player.group.position.set(this.px, 0, this.pz); this.path = null; this.input = { x: 0, z: 0 }
    this.lastNear = { place: null, npc: null }
  }
  setInteriorState(s: InteriorState) { this.istate = s; this.interior?.setState(s) }
  private installedSet: Set<string> | null = null
  setInstalled(set: Set<string>) { this.installedSet = set; this.interior?.setInstalled(set); this.interior?.setState(this.istate) }
  applianceSpot(a: string) { return this.interior?.applianceSpot(a) ?? null }
  claimSeat(kind: 'sofa' | 'table' | 'rug' | 'chair') { return this.interior?.claimSeat(kind, 'player') ?? null }
  releaseSeat() { this.interior?.releaseSeat('player') }
  setSleeping(on: boolean, zzz = true) {
    if (!this.interior) return
    this.sleeping = on
    this.interior.setSleeping(this.player, on, zzz)
    if (!on) { const st = this.interior.bedStand(); this.px = st.x; this.pz = st.z; this.player.group.position.set(this.px, 0, this.pz) }
  }
  setResidents(map: Record<string, import('./residents').Activity | null>, instant = false) { this.interior?.setActivities(map, instant) }
  debugPeople() { return this.interior?.debugPeople() ?? [] }
  onNearInside(cb: (n: NearInside) => void) { this.nearInCb = cb }
  personAt(id: string) { return this.interior?.personInfo(id) ?? null }
  hotspotPos(id: string) { const h = this.interior?.def.hotspots.find((x) => x.id === id); return h ? { x: h.x, z: h.z } : null }

  // ---------- scene directing ----------
  private root(): THREE.Scene { return this.interior ? this.interior.scene : this.scene }
  setFrozen(v: boolean) { this.frozen = v; if (v) { this.input = { x: 0, z: 0 }; this.path = null } }
  setSitting(v: boolean) { this.sitting = v }
  setCameraOverride(o: { pos: [number, number, number]; look: [number, number, number]; shift?: number } | null) { this.camOverride = o; this.interior?.showIcons(!o); for (const l of this.labelSprites.values()) l.visible = !o; for (const n of this.npcs.values()) n.label.visible = !o; if (o) { this.camLook.set(this.px, 1, this.pz) } }
  /** The nearest open floor to a point (not inside furniture or a wall), searching outward in rings. */
  freeNear(x: number, z: number): { x: number; z: number } {
    const nav = this.interior ? this.interior.nav : this.nav
    if (walkable(nav, x, z)) return { x, z }
    for (let rad = 0.5; rad <= 8; rad += 0.5) for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, px = x + Math.cos(a) * rad, pz = z + Math.sin(a) * rad
      if (walkable(nav, px, pz)) return { x: px, z: pz }
    }
    return { x, z }
  }
  /** After a scene moved the player: if they ended up inside something solid, step them out so they can always walk away. */
  snapToFree() { const p = this.freeNear(this.px, this.pz); if (p.x !== this.px || p.z !== this.pz) this.placePlayer(p.x, p.z) }
  placePlayer(x: number, z: number, heading?: number) {
    const h = heading ?? this.heading
    this.px = this.followX = x; this.pz = this.followZ = z; this.heading = h
    this.player.group.position.set(x, this.player.group.position.y, z); this.player.group.rotation.set(0, h, 0); this.path = null
  }
  get facing() { return this.heading }
  facePlayer(x: number, z: number) { this.heading = Math.atan2(x - this.px, z - this.pz); this.player.group.rotation.y = this.heading }
  addActor(id: string, spec: { name: string; gender: Gender; age?: number; x: number; z: number; heading?: number; label?: boolean; top?: string }) {
    this.removeActor(id)
    const look = hashLook(spec.name, spec.gender)
    const parts = buildHuman({ look: spec.top ? { ...look, topColor: spec.top } : look, gender: spec.gender, age: spec.age ?? 22, scale: 1.12 })
    parts.group.position.set(spec.x, 0, spec.z); parts.group.rotation.y = spec.heading ?? 0
    const sc = this.root(); sc.add(parts.group)
    this.actors.set(id, { parts, x: spec.x, z: spec.z, tx: spec.x, tz: spec.z, follow: false, moving: false, locked: false, scene: sc })
  }
  moveActor(id: string, x: number, z: number) { const a = this.actors.get(id); if (a) { a.tx = x; a.tz = z; a.follow = false } }
  lockActor(id: string, on: boolean) { const a = this.actors.get(id); if (a) a.locked = on }
  followPlayer(id: string, on: boolean) { const a = this.actors.get(id); if (a) a.follow = on }
  actorGroup(id: string) { return this.actors.get(id)?.parts.group ?? null }
  actorPos(id: string) { const a = this.actors.get(id); return a ? { x: a.x, z: a.z } : null }
  actorArrived(id: string) { const a = this.actors.get(id); return !a || (!a.moving && Math.hypot(a.tx - a.x, a.tz - a.z) < 0.4) }
  removeActor(id: string) { const a = this.actors.get(id); if (a) { a.scene.remove(a.parts.group); this.actors.delete(id) } }
  hideNpc(id: string, hidden: boolean) { const o = this.npcs.get(id); if (o) { o.parts.group.visible = !hidden; o.label.visible = !hidden } }
  hidePerson(id: string, hidden: boolean) { this.interior?.hidePerson(id, hidden) }
  setBoard(lines: string[] | null) { this.interior?.setBoard(lines) }
  npcPos(id: string): { x: number; z: number } | null { const o = this.npcs.get(id); if (o) return { x: o.npc.x, z: o.npc.z }; const p = this.interior?.personInfo(id); return p ? { x: p.x, z: p.z } : null }
  addMark(id: string, x: number, z: number, emoji: string) {
    this.removeMark(id)
    const c = document.createElement('canvas'); c.width = c.height = 128
    const g = c.getContext('2d')!; g.fillStyle = 'rgba(255,210,63,0.95)'; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#1c1b22'; g.lineWidth = 6; g.stroke()
    g.font = '70px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(emoji, 64, 70)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); sp.renderOrder = 9
    sp.scale.set(1.7, 1.7, 1); sp.position.set(x, 1.5, z); this.root().add(sp); this.marks.set(id, sp)
  }
  moveMark(id: string, x: number, z: number) { const s = this.marks.get(id); if (s) { s.position.x = x; s.position.z = z } }
  removeMark(id: string) { const s = this.marks.get(id); if (s) { s.parent?.remove(s); s.material.map?.dispose(); s.material.dispose(); this.marks.delete(id) } }
  clearMarks() { for (const id of [...this.marks.keys()]) this.removeMark(id) }
  setStall(p: { x: number; z: number } | null) {
    if (this.stallGroup) { this.stallGroup.parent?.remove(this.stallGroup); this.stallGroup = undefined }
    if (!p) return
    const g = new THREE.Group(); const lam = (c: number) => new THREE.MeshLambertMaterial({ color: c })
    const box = (w: number, h: number, d: number, c: number, x: number, y: number, z: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(c)); m.position.set(x, y, z); g.add(m); return m }
    box(4.4, 0.9, 1.5, 0x8a5a32, 0, 0.45, 0); box(4.5, 0.1, 1.6, 0xf5b91c, 0, 0.95, 0)
    ;[[-1.5, 0xd9382e], [-0.5, 0xb06ab3], [0.5, 0x8fb8d9], [1.5, 0xe6c84a]].forEach(([x, c]) => { box(0.85, 0.34, 0.7, 0x6a3b1d, x as number, 1.17, 0); box(0.75, 0.22, 0.6, c as number, x as number, 1.4, 0) })
    for (const sx of [-2.2, 2.2]) box(0.12, 3.2, 0.12, 0x4a3320, sx, 1.6, -0.7)
    box(4.6, 0.7, 0.12, 0xc4262e, 0, 2.6, -0.75)
    g.position.set(p.x, 0, p.z); this.root().add(g); this.stallGroup = g
  }
  setBall(p: { x: number; y: number; z: number } | null) {
    if (!p) { if (this.ballMesh) { this.ballMesh.parent?.remove(this.ballMesh) }; this.ballMesh = undefined; return }
    if (!this.ballMesh) { this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), new THREE.MeshLambertMaterial({ color: 0xffffff })); this.root().add(this.ballMesh) }
    this.ballMesh.position.set(p.x, p.y + 0.32, p.z)
  }
  private bubbleTexture(text: string, tail: number): THREE.CanvasTexture {
    const c = document.createElement('canvas'); c.width = 512; c.height = 256
    const g = c.getContext('2d')!
    g.font = '800 38px system-ui, "Nunito", sans-serif'
    const words = text.split(' '); const lines: string[] = []; let cur = ''
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > 440 && cur) { lines.push(cur); cur = w } else cur = t }
    if (cur) lines.push(cur)
    const L = lines.slice(0, 4), lh = 46, h = L.length * lh + 36, y0 = 230 - h
    g.fillStyle = 'rgba(255,255,255,0.97)'; g.strokeStyle = '#1c1b22'; g.lineWidth = 6
    ;(g as CanvasRenderingContext2D & { roundRect: (...a: number[]) => void }).roundRect(14, y0, 484, h, 28); g.fill(); g.stroke()
    const tx = 14 + 484 * tail
    g.beginPath(); g.moveTo(tx - 20, y0 + h - 2); g.lineTo(tx, y0 + h + 22); g.lineTo(tx + 20, y0 + h - 2); g.closePath(); g.fillStyle = 'rgba(255,255,255,0.97)'; g.fill()
    g.fillStyle = '#1c1b22'; g.textAlign = 'center'; g.textBaseline = 'middle'
    L.forEach((l, i) => g.fillText(l, 256, y0 + 18 + lh / 2 + i * lh, 450))
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  private bubbleSprite(text: string, tail = 0.5): THREE.Sprite {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.bubbleTexture(text, tail), transparent: true, depthWrite: false, depthTest: false })); sp.renderOrder = 10
    sp.center.set(tail, 0.03); sp.scale.set(4.4, 2.2, 1); return sp
  }
  /** Show a speech bubble over the player, an actor, an NPC or an interior person. */
  say(id: string, text: string, ttl = 3.2) {
    for (const b of this.bubbles.filter((x) => x.id === id)) { b.scene.remove(b.sprite); b.sprite.material.map?.dispose(); b.sprite.material.dispose() }
    this.bubbles = this.bubbles.filter((x) => x.id !== id)
    const sc = this.root(); const sp = this.bubbleSprite(text); sc.add(sp)
    this.bubbles.push({ sprite: sp, id, t: ttl, scene: sc, text, tail: 0.5 })
  }
  private whereIs(id: string): { x: number; z: number } | null {
    if (id === 'player') return { x: this.px, z: this.pz }
    const a = this.actors.get(id); if (a) return { x: a.x, z: a.z }
    return this.npcPos(id)
  }
  clearDirected() {
    for (const a of this.actors.values()) a.scene.remove(a.parts.group)
    this.actors.clear()
    for (const b of this.bubbles) { b.scene.remove(b.sprite); b.sprite.material.map?.dispose(); b.sprite.material.dispose() }
    this.bubbles = []
    this.setBall(null); this.setStall(null); this.clearMarks(); this.speedMul = 1; this.camOverride = null; this.frozen = false; this.sitting = false
    for (const o of this.npcs.values()) { o.parts.group.visible = true; o.label.visible = true }
    this.player.group.position.y = 0; this.player.legL.rotation.x = this.player.legR.rotation.x = 0
  }
  private stepDirected(dt: number) {
    for (const m of this.marks.values()) m.position.y = 1.6 + Math.sin(this.time * 4 + m.position.x) * 0.15
    const blockers = this.interior ? this.interior.blockers : this.district.blockers
    const bounds: Rect = this.interior ? this.interior.def.bounds : { x0: -WORLD.half, x1: WORLD.half, z0: -WORLD.half, z1: WORLD.half }
    for (const a of this.actors.values()) {
      if (a.locked) { const gp = a.parts.group.position; const mv = Math.hypot(gp.x - a.x, gp.z - a.z) > 0.004; a.x = gp.x; a.z = gp.z; animateHuman(a.parts, this.time + a.x, mv, 0.9); continue }
      if (a.follow) { const bx = Math.sin(this.heading), bz = Math.cos(this.heading); a.tx = this.px - bx * 1.9 + bz * 1.1; a.tz = this.pz - bz * 1.9 - bx * 1.1 }
      const vx = a.tx - a.x, vz = a.tz - a.z, d = Math.hypot(vx, vz)
      a.moving = d > 0.45
      if (a.moving) {
        const sp = Math.min(6.4, 2.2 + d * 1.6) * dt
        const p = moveWithCollision(blockers, a.x, a.z, (vx / d) * sp, (vz / d) * sp, bounds); a.x = p.x; a.z = p.z
        a.parts.group.rotation.y += this.angleDiff(Math.atan2(vx, vz), a.parts.group.rotation.y) * Math.min(1, dt * 10)
      } else if (a.follow || !this.moving) a.parts.group.rotation.y += this.angleDiff(Math.atan2(this.px - a.x, this.pz - a.z), a.parts.group.rotation.y) * Math.min(1, dt * 4)
      a.parts.group.position.set(a.x, a.parts.group.position.y, a.z)
      animateHuman(a.parts, this.time + a.x, a.moving, 0.9)
    }
    for (const b of [...this.bubbles]) {
      b.t -= dt
      const w = this.whereIs(b.id)
      if (w) {
        // each bubble sits right above its speaker, with its tail on the head. When two people talk the bubbles
        // extend away from each other (left speaker's to the left, right speaker's to the right) so they never overlap.
        const pos = new THREE.Vector3(w.x, 3.1, w.z + 0.1)
        const d = this.camera.position.distanceTo(pos)
        const f = Math.max(0.35, Math.min(1.0, d / 24))
        const two = this.bubbles.length > 1
        let tail = 0.5
        if (two) {
          const me = pos.clone().project(this.camera).x
          const other = this.bubbles.find((o) => o !== b)!; const ow = this.whereIs(other.id)
          const ox = ow ? new THREE.Vector3(ow.x, 3.1, ow.z + 0.1).project(this.camera).x : me + 1
          tail = me <= ox ? 0.8 : 0.2
        }
        if (Math.abs(tail - b.tail) > 0.01) { b.tail = tail; b.sprite.material.map?.dispose(); b.sprite.material.map = this.bubbleTexture(b.text, tail); b.sprite.material.needsUpdate = true }
        b.sprite.center.set(tail, 0.03)
        const sw = 4.4 * f
        b.sprite.scale.set(sw, 2.2 * f, 1)
        b.sprite.position.copy(pos)
        // keep the bubble on screen: shift sideways along the camera's right axis if it would be clipped
        const ndc = pos.clone().project(this.camera).x
        const half = sw / (2 * d * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.aspect)
        const left = ndc - tail * 2 * half, right = ndc + (1 - tail) * 2 * half
        let shiftN = 0
        if (left < -0.96) shiftN = -0.96 - left; else if (right > 0.96) shiftN = 0.96 - right
        if (shiftN) { const r = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion); const k = (shiftN * d * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.aspect); b.sprite.position.addScaledVector(r, k) }
      }
      if (b.t <= 0) { b.scene.remove(b.sprite); b.sprite.material.map?.dispose(); b.sprite.material.dispose(); this.bubbles = this.bubbles.filter((x) => x !== b) }
    }
  }

  // ---------- control ----------
  get position() { return { x: this.px, z: this.pz } }
  /** Where a world point is on screen, in CSS pixels of the canvas (used for the guide compass). */
  screenOf(x: number, z: number): { x: number; y: number } {
    const v = new THREE.Vector3(x, 0.5, z).project(this.camera)
    const w = this.container.clientWidth || 360, h = this.container.clientHeight || 640
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h }
  }
  setInput(x: number, z: number) { if (this.sleeping || this.frozen) return; this.input.x = x; this.input.z = z; if (x || z) { this.path = null } }
  walkTo(x: number, z: number) { if (this.sleeping || this.frozen) return false; const nav = this.interior ? this.interior.nav : this.nav; const p = findPath(nav, { x: this.px, z: this.pz }, { x, z }); this.path = p; return !!p }
  cancelWalk() { this.path = null }
  get walking() { return !!this.path }
  onNear(cb: (n: Near) => void) { this.nearCb = cb }
  onSlow(cb: () => void) { this.slowCb = cb }
  onPosition(cb: (x: number, z: number, h: number) => void) { this.posCb = cb }

  pickGround(clientX: number, clientY: number): { x: number; z: number } | null {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const v = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(v, this.camera)
    const out = new THREE.Vector3()
    return this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), out) ? { x: out.x, z: out.z } : null
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
    const speed = 5.6 * this.speedMul
    const iv = this.interior
    const blockers = iv ? iv.blockers : this.district.blockers
    const bounds: Rect = iv ? iv.def.bounds : { x0: -WORLD.half, x1: WORLD.half, z0: -WORLD.half, z1: WORLD.half }
    let dx = 0, dz = 0
    const mag = Math.hypot(this.input.x, this.input.z)
    if (this.sleeping || this.frozen) { /* no movement */ }
    else if (mag > 0.05) { dx = (this.input.x / Math.max(1, mag)) * speed * dt; dz = (this.input.z / Math.max(1, mag)) * speed * dt }
    else if (this.path && this.path.length) {
      const t = this.path[0]
      const vx = t.x - this.px, vz = t.z - this.pz, d = Math.hypot(vx, vz)
      if (d < 0.35) { this.path.shift(); if (!this.path.length) this.path = null }
      else { dx = (vx / d) * speed * dt; dz = (vz / d) * speed * dt }
    }
    this.moving = dx !== 0 || dz !== 0
    if (this.moving) {
      const p = moveWithCollision(blockers, this.px, this.pz, dx, dz, bounds)
      if (Math.abs(p.x - this.px) < 1e-4 && Math.abs(p.z - this.pz) < 1e-4) { this.moving = false; if (this.path && !mag) this.path = null } else { this.heading = Math.atan2(dx, dz); this.px = p.x; this.pz = p.z }
    }
    if (!this.sleeping) {
      this.player.group.position.set(this.px, 0, this.pz)
      this.player.group.rotation.y += this.angleDiff(this.heading, this.player.group.rotation.y) * Math.min(1, dt * 14)
      animateHuman(this.player, this.time, this.moving)
      if (this.sitting) { this.player.legL.rotation.x = this.player.legR.rotation.x = -1.45; this.player.group.position.y = -0.45 } else if (this.player.group.position.y < 0) this.player.group.position.y = 0
    }
    this.stepDirected(dt)
    if (iv) {
      iv.update(dt)
      this.posT += dt
      if (this.posT > 0.1) {
        this.posT = 0
        let hot: string | null = null, bd = 1e9
        for (const h of iv.def.hotspots) { if (h.needs && this.installedSet && !this.installedSet.has(h.needs)) continue; const d = Math.hypot(h.x - this.px, h.z - this.pz); if (d <= h.r && d < bd) { bd = d; hot = h.id } }
        let person: string | null = null, pd = 2.3
        for (const p of iv.allPeople()) { const d = Math.hypot(p.x - this.px, p.z - this.pz); if (d < pd) { pd = d; person = p.id } }
        const exit = Math.hypot(iv.def.door.x - this.px, iv.def.door.z - this.pz) < 1.9
        const n = { hotspot: hot, person, exit }
        if (n.hotspot !== this.lastNearIn.hotspot || n.person !== this.lastNearIn.person || n.exit !== this.lastNearIn.exit) { this.lastNearIn = n; this.nearInCb?.(n) }
        this.posCb?.(this.px, this.pz, this.heading)
      }
      return
    }
    // people with their own lives wander about near where they hang out
    for (const o of this.npcs.values()) {
      const w = o.npc.wander
      if (w) {
        o.wt -= dt
        if (o.wt <= 0) {
          o.wt = 3 + Math.random() * 7
          if (Math.random() < 0.65) { const a = Math.random() * Math.PI * 2, d = Math.random() * w.r; o.tx = w.x + Math.cos(a) * d; o.tz = w.z + Math.sin(a) * d } else { o.tx = o.npc.x; o.tz = o.npc.z }
        }
        const vx = o.tx - o.npc.x, vz = o.tz - o.npc.z, d = Math.hypot(vx, vz)
        o.moving = d > 0.4
        if (o.moving) {
          const sp = 1.7 * dt; const p = moveWithCollision(this.district.blockers, o.npc.x, o.npc.z, (vx / d) * sp, (vz / d) * sp)
          if (Math.abs(p.x - o.npc.x) < 1e-5 && Math.abs(p.z - o.npc.z) < 1e-5) { o.tx = o.npc.x; o.tz = o.npc.z } else { o.npc.x = p.x; o.npc.z = p.z }
          o.parts.group.position.set(o.npc.x, 0, o.npc.z); o.label.position.set(o.npc.x, 3.7, o.npc.z)
          o.parts.group.rotation.y += this.angleDiff(Math.atan2(vx, vz), o.parts.group.rotation.y) * Math.min(1, dt * 6)
        }
      }
    }
    // ambient wanderers (outdoors only)
    for (const a of this.ambient) {
      a.timer -= dt
      if (a.timer <= 0) { a.heading += (Math.random() - 0.5) * 2.6; a.timer = 2 + Math.random() * 4; a.speed = Math.random() < 0.25 ? 0 : 1.2 + Math.random() * 1.2 }
      const mx = Math.sin(a.heading) * a.speed * dt, mz = Math.cos(a.heading) * a.speed * dt
      const p = moveWithCollision(this.district.blockers, a.x, a.z, mx, mz)
      if (a.speed > 0 && Math.abs(p.x - a.x) < 1e-5 && Math.abs(p.z - a.z) < 1e-5) a.heading += Math.PI * (0.5 + Math.random() * 0.5)
      a.x = p.x; a.z = p.z
      a.parts.group.position.set(a.x, 0, a.z)
      a.parts.group.rotation.y += this.angleDiff(a.heading, a.parts.group.rotation.y) * Math.min(1, dt * 6)
      animateHuman(a.parts, this.time + a.x, a.speed > 0, 0.55)
      const near = Math.hypot(a.x - this.px, a.z - this.pz) < 13
      a.sayT -= dt
      if (a.bubble) { a.bubbleT -= dt; a.bubble.position.set(a.x, 3.2, a.z); if (a.bubbleT <= 0) { this.scene.remove(a.bubble); a.bubble = undefined } }
      else if (near && a.sayT <= 0) { a.sayT = 9 + Math.random() * 12; a.bubbleT = 3.6; a.bubble = this.textSprite(BUBBLES[Math.floor(Math.random() * BUBBLES.length)], { bg: 'rgba(255,255,255,0.94)', fg: '#1c1b22', size: 5.2 }); this.scene.add(a.bubble) }
    }
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
    const iv = this.interior
    this.followX += (this.px - this.followX) * Math.min(1, dt * 5); this.followZ += (this.pz - this.followZ) * Math.min(1, dt * 5)
    const aspect = this.camera.aspect
    const dist = (aspect < 0.8 ? 1.12 : 1) * this.zoom
    if (this.camOverride) {
      const o = this.camOverride
      this.camera.position.x += (o.pos[0] - this.camera.position.x) * Math.min(1, dt * 4); this.camera.position.y += (o.pos[1] - this.camera.position.y) * Math.min(1, dt * 4); this.camera.position.z += (o.pos[2] - this.camera.position.z) * Math.min(1, dt * 4)
      this.camLook.x += (o.look[0] - this.camLook.x) * Math.min(1, dt * 4); this.camLook.y += (o.look[1] - this.camLook.y) * Math.min(1, dt * 4); this.camLook.z += (o.look[2] - this.camLook.z) * Math.min(1, dt * 4)
      this.camera.lookAt(this.camLook)
      if (!iv) for (const o2 of this.npcs.values()) { animateHuman(o2.parts, this.time, false) }
    } else if (iv) {
      const cx = Math.max(iv.def.bounds.x0 + 4, Math.min(iv.def.bounds.x1 - 4, this.followX)), cz = Math.max(iv.def.bounds.z0 + 2, Math.min(iv.def.bounds.z1 - 3, this.followZ))
      this.camera.position.set(cx, 17 * dist, cz + 9.5 * dist); this.camera.lookAt(cx, 0, cz - 0.5)
    } else {
      this.camera.position.set(this.followX, 24 * dist, this.followZ + 12 * dist); this.camera.lookAt(this.followX, 0, this.followZ - 1)
      const h = this.highlight
      if (h) {
        const pl = h.place ? this.district.places.find((p) => p.id === h.place) : null
        h.ring.visible = h.arrow.visible = !!pl
        if (pl) { h.ring.position.set(pl.door.x, 0.12, pl.door.z); h.ring.scale.setScalar(1 + Math.sin(this.time * 4) * 0.12); h.arrow.position.set(pl.door.x, 3.2 + Math.abs(Math.sin(this.time * 3)) * 0.7, pl.door.z) }
      }
      for (const o of this.npcs.values()) { if (!o.moving) o.parts.group.rotation.y += this.angleDiff(Math.atan2(this.px - o.npc.x, this.pz - o.npc.z), o.parts.group.rotation.y) * Math.min(1, dt * 3); animateHuman(o.parts, this.time + o.npc.x, o.moving, 0.6) }
    }
    const shift = this.camOverride?.shift ?? 0
    if (shift !== this.viewShift) {
      this.viewShift = shift
      const w = this.container.clientWidth || 360, h = this.container.clientHeight || 640
      if (shift) this.camera.setViewOffset(w, h, 0, h * shift, w, h); else this.camera.clearViewOffset()
      this.camera.updateProjectionMatrix()
    }
    this.renderer.render(iv ? iv.scene : this.scene, this.camera)
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
    this.interior?.dispose()
    this.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); const mt = m.material as THREE.Material | THREE.Material[] | undefined; if (Array.isArray(mt)) mt.forEach((x) => x.dispose()); else mt?.dispose() })
    this.textCache.forEach((m) => { m.map?.dispose(); m.dispose() })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}

export type { Rect }
