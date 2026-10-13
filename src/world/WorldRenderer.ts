// Three.js renderer for the explorable district and building interiors.
// Static scenery is merged into a few draw calls; time of day drives lighting, windows and lamps.
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Appearance, Gender } from '@engine/core/types'
import type { Wear } from '@content/items'
import { drawFlavourProp, drawOuting, drawWorship, skylineObjects, vehicleMesh } from './scenery'
import type { VehicleKind, CrowdKind } from './flavour'
import { audio } from '@platform/audio'
import { WORLD, type District, type PlaceId, type Rect } from './layout'
import { buildNav, findPath, moveWithCollision, walkable, type Nav } from './nav'
import { animateHuman, buildHuman, exercisePose, hashLook, resetPose, type HumanParts, type Move } from './characters'
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

interface Veh { off?: boolean; g: THREE.Group; axis: 'x' | 'z'; dir: 1 | -1; lane: number; pos: number; speed: number; cur: number; kind: VehicleKind; pub: boolean; len: number; mode: 'drive' | 'approach' | 'dwell'; dwellT: number; served: boolean; honkT: number; wasBlocked: boolean; bub?: THREE.Sprite; bubT: number }
interface Commuter { parts: HumanParts; x: number; z: number; home: { x: number; z: number }; state: 'wait' | 'board' | 'aboard' | 'alightPending' | 'alight'; tx: number; tz: number; delay: number }
interface Critter { kind: 'owl' | 'rat' | 'roach' | 'bat' | 'cat'; g: THREE.Group; x: number; z: number; tx: number; tz: number; wait: number; phase: number; head?: THREE.Object3D; wings?: THREE.Object3D[]; say: number; bub?: THREE.Sprite; bubT: number; y: number; base: number; fled: boolean }
const PUBLIC: VehicleKind[] = ['danfo', 'brt', 'cab']
const VLEN: Record<VehicleKind, number> = { danfo: 5.2, brt: 7.4, keke: 2.4, okada: 1.8, cab: 4.1, suv: 4.6 }

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
  private ambient: { parts: HumanParts; x: number; z: number; heading: number; timer: number; speed: number; bubble?: THREE.Sprite; bubbleT: number; sayT: number; lines?: string[]; stay?: boolean; home?: { x: number; z: number; r: number }; away?: boolean; homing?: { x: number; z: number; t: number }; linger?: number; ex?: { mode: 'jog' | Move; dir: 1 | -1; axis: 'x' | 'z'; line: number; ph: number } }[] = []
  private faith: 'church' | 'mosque' = 'church'
  private traffic: Veh[] = []
  private commuters: Commuter[] = []
  private critters: Critter[] = []
  private rideActive = false
  private ride: { g: THREE.Group; leg: { from: [number, number]; to: [number, number]; dur: number; t: number; ease: 'in' | 'out'; face: number; res: () => void } | null; follow: boolean } | null = null
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

  constructor(private container: HTMLElement, private district: District, opts: { look: Appearance; age: number; gender: Gender; wear: Wear[]; faith?: 'church' | 'mosque'; uniform: boolean; month: number; hour: number; spawn: { x: number; z: number } }) {
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
    this.faith = opts.faith ?? 'church'
    this.buildStatic()
    for (const o of skylineObjects(district)) this.scene.add(o)
    this.player = buildHuman({ look: opts.look, age: opts.age, gender: opts.gender, wear: opts.wear, uniform: opts.uniform, scale: 1.1 })
    this.scene.add(this.player.group)
    this.player.group.position.set(this.px, 0, this.pz)
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.7, 12), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })); this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.04; this.player.group.add(this.shadow)
    this.makeAmbient()
    this.makeCrowd()
    this.makeTraffic()
    this.makeHighlight()
    this.applyLighting()
    this.resize()
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

  /** The family home, dressed the way houses really look in each city: Lagos has zinc roofs, a veranda of doors, water tanks and washing lines; Abuja has stepped tiled roofs, porch pillars, parapets, hedges and gate pillars. */
  private homeExterior(b: Batch, bl: { rect: Rect; h: number; color: number; roof: number }, id: string, city: string) {
    const r = bl.rect, h = bl.h, w = r.x1 - r.x0, dd = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, fz = r.z1
    if (city === 'lagos') {
      const modern = id === 'lekki' || id === 'yaba'
      if (!modern) {
        // corrugated zinc roof: a flat slab with ridges, rusty colour
        b.box(cx, h + 0.2, cz, w + 0.8, 0.35, dd + 0.8, 0x9a5a3a)
        for (let x = r.x0 - 0.3; x < r.x1 + 0.4; x += 0.7) b.box(x, h + 0.45, cz, 0.18, 0.16, dd + 0.8, 0xb56a44)
        // veranda in front: a covered corridor with a door for every family and a low wall
        b.box(cx, 2.9, fz + 1.0, w + 0.6, 0.18, 2.0, 0x7a4a2a)
        for (let x = r.x0 + 0.5; x <= r.x1 - 0.4; x += 3) b.box(x, 1.45, fz + 1.9, 0.18, 2.9, 0.18, 0x6a3b1d)
        b.box(cx, 0.5, fz + 1.95, w, 0.9, 0.14, bl.color)
        const doors = Math.max(2, Math.floor(w / 2.6))
        for (let i = 0; i < doors; i++) b.box(r.x0 + (i + 0.5) * (w / doors), 1.0, fz + 0.1, 0.9, 2.0, 0.1, [0x2b3a8c, 0x0f7a4a, 0xc4262e, 0x6a3b1d][i % 4])
        // laundry line across the veranda
        for (let i = 0; i < 4; i++) b.box(r.x0 + 1.2 + i * (w - 2.4) / 3, 2.4, fz + 1.7, 0.5, 0.7, 0.05, [0xf2efe6, 0xe0457b, 0x2b3a8c, 0xf5b91c][i])
        b.box(cx, 2.78, fz + 1.7, w - 1, 0.03, 0.03, 0x444444)
        if (bl.h > 5) { b.box(cx, 5.2, fz + 1.0, w + 0.6, 0.15, 1.6, 0x7a4a2a); for (let x = r.x0 + 0.3; x <= r.x1 - 0.2; x += 0.9) b.box(x, 5.7, fz + 1.75, 0.08, 1.0, 0.08, 0x3a3a44) }
        // black polytank on a stand and a rooftop aerial
        b.cyl(r.x0 + 1.6, h + 1.4, cz, 0.8, 0.8, 1.4, 0x1c1b22, 10); b.box(r.x0 + 1.6, h + 0.55, cz, 1.5, 0.4, 1.5, 0x6a6a74)
        b.box(r.x1 - 1.5, h + 1.6, cz + 1, 0.06, 2.4, 0.06, 0x444444); b.box(r.x1 - 1.5, h + 2.4, cz + 1, 1.2, 0.05, 0.05, 0x444444)
      } else {
        // modern Lagos duplex: flat roof with water tank, glass balcony, white walls
        b.box(cx, h + 0.2, cz, w + 0.6, 0.4, dd + 0.6, 0x5a6a7a)
        b.cyl(cx + w * 0.25, h + 1.4, cz, 0.9, 0.9, 1.7, 0x1c1b22, 10); b.box(cx + w * 0.25, h + 0.6, cz, 1.8, 0.5, 1.8, 0x8a8a92)
        for (let f = 1; f < Math.max(2, Math.round(h / 3.2)); f++) {
          b.box(cx, f * 3.1, fz + 0.9, w * 0.7, 0.18, 1.8, 0xe6e6e0)
          b.box(cx, f * 3.1 + 0.6, fz + 1.8, w * 0.7, 1.0, 0.06, 0x9fd1ff)
        }
        for (let x = r.x0 + 0.6; x <= r.x1 - 0.5; x += 3.4) b.box(x, 1.3, fz + 0.06, 1.6, 2.4, 0.08, 0x6aa0c8)
        b.box(cx, 0.4, fz + 3.2, 3, 0.1, 5, 0xc9c4b8) // driveway
      }
      return
    }
    // ---- Abuja ----
    const bung = id === 'kubwa', block = id === 'wuse', villa = id === 'maitama'
    if (block) {
      // apartment block: flat roof with parapet, glass balcony strips every floor, lift tower
      b.box(cx, h + 0.15, cz, w + 0.4, 0.3, dd + 0.4, 0x4f6272)
      for (const [px, pz, pw, pd] of [[cx, r.z1 + 0.15, w + 0.4, 0.3], [cx, r.z0 - 0.15, w + 0.4, 0.3], [r.x0 - 0.15, cz, 0.3, dd], [r.x1 + 0.15, cz, 0.3, dd]]) b.box(px, h + 0.7, pz, pw, 0.8, pd, 0xdfe6ec)
      b.box(r.x1 - 1.5, h + 1.4, r.z0 + 1.5, 2, 2, 2, 0xb9c4cd)
      for (let f = 0; f * 3 + 3 < h; f++) { b.box(cx, 3 + f * 3, fz + 0.5, w * 0.8, 0.14, 1.0, 0xffffff); b.box(cx, 3.5 + f * 3, fz + 1.0, w * 0.8, 0.9, 0.05, 0x9fd1ff) }
      b.box(cx, 1.2, fz + 0.1, w * 0.5, 2.4, 0.1, 0x6aa0c8)
      return
    }
    // stepped tiled roof (terracotta, or green zinc in Kubwa) so it reads as pitched rather than flat
    const tile = bung ? 0x7a8a6a : 0xb5532e
    const steps = bung ? 2 : 3
    for (let i = 0; i < steps; i++) {
      const k = i / steps
      b.box(cx, h + 0.2 + i * 0.55, cz, (w + 1.0) * (1 - k * 0.55), 0.55, (dd + 1.0) * (1 - k * 0.3), tile)
    }
    // porch with two pillars
    b.box(cx, 2.9, fz + 1.2, Math.min(w * 0.6, 5), 0.25, 2.4, 0xf4ecd8)
    for (const sx of [-1, 1]) b.cyl(cx + sx * Math.min(w * 0.28, 2.2), 1.45, fz + 2.2, 0.22, 0.22, 2.9, 0xfaf6ea, 10)
    b.box(cx, 0.12, fz + 1.4, Math.min(w * 0.6, 5), 0.24, 2.8, 0xd9d2c2)
    // low hedge and a lawn along the front
    for (const sx of [-1, 1]) b.box(cx + sx * (w / 2 + 1.6) / 1 * 0.5 + sx * 1.4, 0.35, fz + 4.6, w / 2 - 1, 0.7, 0.8, 0x2f7a3a)
    b.box(cx, 0.04, fz + 3.2, w + 2, 0.05, 3.4, 0x6fb55a)
    // gate pillars
    for (const sx of [-1, 1]) { b.box(cx + sx * 2.2, 1.3, fz + 4.8, 0.6, 2.6, 0.6, 0xf4ecd8); b.box(cx + sx * 2.2, 2.7, fz + 4.8, 0.8, 0.2, 0.8, villa ? 0xd4a017 : 0xb5532e) }
    if (villa) { // second storey balcony and a dish
      b.box(cx, 5.6, fz + 0.8, w * 0.5, 0.18, 1.6, 0xf4ecd8); b.cyl(r.x1 - 1.2, h + 1.8, cz, 0.7, 0.7, 0.12, 0xd0d0d8, 12)
    }
  }

  private gymGoers: { parts: HumanParts; move: Move; ph: number }[] = []
  /** The gym is glass on every side and on the roof, so you can see the treadmills and people working out from the street. */
  private gymBuilding(b: Batch, r: Rect, doorX: number) {
    const w = r.x1 - r.x0, dd = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, H = 4.2
    b.box(cx, 0.08, cz, w, 0.16, dd, 0x3a3a44); b.box(cx - 3, 0.17, r.z1 - 3.4, 6.5, 0.04, 4, 0x2f7a5a)
    for (const x of [r.x0, r.x1]) for (const z of [r.z0, r.z1]) b.box(x, H / 2, z, 0.35, H, 0.35, 0x6a6a74)
    for (let x = r.x0 + 3.25; x < r.x1 - 0.5; x += 3.25) { b.box(x, H / 2, r.z1, 0.14, H, 0.14, 0x6a6a74); b.box(x, H / 2, r.z0, 0.14, H, 0.14, 0x6a6a74) }
    for (let z = r.z0 + 3.2; z < r.z1 - 0.5; z += 3.2) { b.box(r.x0, H / 2, z, 0.14, H, 0.14, 0x6a6a74); b.box(r.x1, H / 2, z, 0.14, H, 0.14, 0x6a6a74) }
    for (const z of [r.z0, r.z1]) b.box(cx, H, z, w + 0.35, 0.3, 0.3, 0x6a6a74)
    for (const x of [r.x0, r.x1]) b.box(x, H, cz, 0.3, 0.3, dd + 0.35, 0x6a6a74)
    for (let x = r.x0 + 3.25; x < r.x1; x += 3.25) b.box(x, H + 0.1, cz, 0.18, 0.18, dd, 0x6a6a74)
    // the glass: see-through panels on the four walls and the roof
    const glass = new THREE.MeshLambertMaterial({ color: 0xa8e0ff, transparent: true, opacity: 0.2, depthWrite: false })
    const pane = (px: number, py: number, pz: number, pw: number, ph: number, pd: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, pd), glass); m.position.set(px, py, pz); this.scene.add(m) }
    pane(cx, H / 2, r.z1, w, H, 0.06); pane(cx, H / 2, r.z0, w, H, 0.06); pane(r.x0, H / 2, cz, 0.06, H, dd); pane(r.x1, H / 2, cz, 0.06, H, dd); pane(cx, H + 0.05, cz, w, 0.06, dd)
    // door and sign
    b.box(doorX, 1.1, r.z1 + 0.04, 2.4, 2.2, 0.12, 0x1c2a3a); b.box(cx, H + 0.9, r.z1 + 0.1, 7, 1.2, 0.3, 0x1ec8b4)
    // equipment you can see through the glass
    for (const x of [r.x0 + 2.5, r.x0 + 5.5, r.x0 + 8.5]) { b.box(x, 0.4, r.z0 + 2.2, 1.3, 0.5, 2.2, 0x24242c); b.box(x, 1.4, r.z0 + 1.2, 1.0, 0.7, 0.2, 0x1a2a3a); b.box(x - 0.5, 0.9, r.z0 + 1.2, 0.1, 1.0, 0.1, 0x888890); b.box(x + 0.5, 0.9, r.z0 + 1.2, 0.1, 1.0, 0.1, 0x888890) }
    b.box(r.x1 - 3, 0.3, cz - 1, 2.0, 0.5, 0.9, 0x2a2a30); b.box(r.x1 - 3, 0.75, cz - 1, 2.6, 0.06, 0.06, 0xbbbbc4); for (const sx of [-1.3, 1.3]) b.box(r.x1 - 3 + sx, 0.8, cz - 1, 0.2, 0.9, 0.5, 0x1c1b22)
    b.box(r.x1 - 1.2, 0.7, r.z0 + 1.0, 2.0, 1.4, 0.8, 0x55555e)
    b.box(cx, 2.0, r.z0 + 0.1, w - 1, 2.6, 0.08, 0xb8d8ee) // mirrors on the back wall
    // people working out inside
    const mk = (name: string, g: 'male' | 'female', x: number, z: number, move: Move, face: number) => {
      const parts = buildHuman({ look: hashLook(name, g), age: 28, gender: g, scale: 1.1 }); parts.group.position.set(x, 0.16, z); parts.group.rotation.y = face; this.scene.add(parts.group)
      this.gymGoers.push({ parts, move, ph: Math.random() * 6 })
    }
    mk('gymA', 'male', r.x0 + 2.5, r.z0 + 2.4, 'run', Math.PI); mk('gymB', 'female', r.x0 + 5.5, r.z0 + 2.4, 'run', Math.PI)
    mk('gymC', 'male', r.x1 - 3, cz + 0.2, 'lift', 0); mk('gymD', 'female', cx - 3, r.z1 - 3.0, 'jacks', 0); mk('gymE', 'male', cx - 1, r.z1 - 2.4, 'squat', 0)
  }
  private updateGym(dt: number) {
    if (!this.gymGoers.length) return
    const open = this.hour >= 5 && this.hour < 22 && !this.interior
    for (const gg of this.gymGoers) { gg.parts.group.visible = open; if (open) exercisePose(gg.parts, gg.move, this.time + gg.ph) }
    void dt
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
      if (bl.place === 'gym') { this.gymBuilding(b, bl.rect, d.places.find((p) => p.id === 'gym')!.door.x); continue }
      const { rect: r, h, color, roof } = bl
      const w = r.x1 - r.x0, dd = r.z1 - r.z0, cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2
      b.box(cx, h / 2, cz, w, h, dd, color)
      if (bl.place !== 'home') b.box(cx, h + 0.25, cz, w + 0.5, 0.5, dd + 0.5, roof)
      const rows = Math.max(1, Math.floor((h - 1.5) / 3)), cols = Math.max(1, Math.floor(w / 2.6))
      for (let rr = 0; rr < rows; rr++) for (let c = 0; c < cols; c++) {
        const isLit = (rr * 7 + c * 3 + Math.floor(cx)) % 3 === 0
        ;(isLit ? lit : b).box(r.x0 + (c + 0.5) * (w / cols), 2 + rr * 3, r.z1 + 0.04, 1.1, 1.4, 0.08, 0x4c6a8a)
      }
      const dc = Math.max(1, Math.floor(dd / 3.2))
      for (let rr = 0; rr < rows; rr++) for (let c = 0; c < dc; c++) ((rr + c) % 3 === 0 ? lit : b).box(r.x1 + 0.04, 2 + rr * 3, r.z0 + (c + 0.5) * (dd / dc), 0.08, 1.4, 1.1, 0x4c6a8a)
      if (bl.place === 'home') this.homeExterior(b, bl, d.theme.id, d.theme.city)
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
      if (p.kind === 'palm' || p.kind === 'flag' || p.kind === 'wall' || p.kind === 'gate' || p.kind === 'generator' || p.kind === 'billboard') {
        drawFlavourProp(b, p)
        if (p.kind === 'billboard' && p.text) { const sp = this.textSprite(p.text, { bg: p.color === 0x1f9d55 ? 'rgba(31,157,85,0.96)' : 'rgba(255,210,63,0.96)', fg: p.color === 0x1f9d55 ? '#ffffff' : '#1c1b22', size: 6.2 }); sp.position.set(cx, 5.0, cz + 0.35); this.scene.add(sp) }
      } else if (p.kind === 'tree') { b.cyl(cx, p.h * 0.3, cz, 0.18, 0.28, p.h * 0.6, 0x6a4a2a); b.cone(cx, p.h * 0.75, cz, 1.4, p.h * 0.9, p.color); b.cone(cx, p.h * 1.1, cz, 1.0, p.h * 0.7, 0x3a9a4a) }
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
    drawOuting(b, d)
    // your house of worship, and the other faith's landmark up the road
    for (const bl of d.buildings) {
      if (bl.place === 'worship') drawWorship(b, bl.rect, bl.h, this.faith, d.theme.city)
      else if (bl.landmark) drawWorship(b, bl.rect, bl.h, this.faith === 'mosque' ? 'church' : 'mosque', d.theme.city)
    }
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

  /** Vehicles that drive up and down the two main roads: danfos and touts in Lagos, green taxis and motorcades in Abuja. */
  private makeTraffic() {
    const fl = this.district.flavour
    const add = (kind: VehicleKind, axis: 'x' | 'z', dir: 1 | -1, pos: number, speed: number) => {
      const g = vehicleMesh(kind); this.scene.add(g)
      this.traffic.push({ g, axis, dir, lane: dir * 1.55, pos, speed, cur: speed, kind, pub: PUBLIC.includes(kind), len: VLEN[kind], mode: 'drive', dwellT: 0, served: false, honkT: Math.random() * 2, wasBlocked: false, bubT: 0 })
    }
    for (let i = 0; i < fl.traffic.count; i++) {
      const kind = fl.traffic.kinds[i % fl.traffic.kinds.length]
      add(kind, i % 2 === 0 ? 'x' : 'z', i % 3 === 0 ? -1 : 1, -55 + ((i * 41) % 110), kind === 'okada' || kind === 'suv' ? 8.5 : kind === 'brt' ? 5.5 : 5 + (i % 3))
    }
    if (fl.traffic.convoy) { for (let k = 0; k < 3; k++) add('suv', 'x', 1, -50 - k * 7.5, 9) } // a politician's convoy with its escorts
    // the buses that serve your stop: they run down the road beside it, halt there, honk, take people on and let people off
    const bus: VehicleKind = this.district.theme.city === 'abuja' ? 'cab' : 'danfo'
    add(bus, 'z', 1, -52, 5.4); add(bus, 'z', 1, -12, 5.4)
    this.makeCommuters()
    this.makeCritters()
  }

  private get stopZ() { return this.district.places.find((p) => p.id === 'busstop')!.door.z }
  /** People waiting at the bus stop. They board a bus when it halts and come back off the next one. */
  private makeCommuters() {
    const bs = this.district.places.find((p) => p.id === 'busstop')!
    const names = ['commuterA', 'commuterB', 'commuterC', 'commuterD']
    names.forEach((nm, i) => {
      const female = i % 2 === 1
      const parts = buildHuman({ look: hashLook(nm + this.district.theme.id, female ? 'female' : 'male'), age: 26 + i * 4, gender: female ? 'female' : 'male', scale: 1.1 })
      const x = bs.rect.x0 + 0.8 + (i % 2) * 1.3, z = bs.rect.z0 + 0.8 + i * 1.0
      parts.group.position.set(x, 0, z); parts.group.rotation.y = -Math.PI / 2
      this.scene.add(parts.group)
      this.commuters.push({ parts, x, z, home: { x, z }, state: 'wait', tx: x, tz: z, delay: 0 })
    })
  }
  /** How busy the streets are: full by day, thinning from 9pm, nobody at all after midnight until the early morning. */
  private streetLife(): number {
    const h = this.hour
    if (h >= 6.5 && h < 21) return 1
    if (h >= 21) return 1 - (0.9 * (h - 21)) / 3
    if (h < 5) return 0
    return (h - 5) / 1.5
  }
  /** Everyone on foot that a driver must not run over. */
  private folks(): { x: number; z: number }[] {
    const out: { x: number; z: number }[] = []
    if (!this.interior && !this.rideActive && this.player.group.visible && !this.sleeping) out.push({ x: this.px, z: this.pz })
    for (const a of this.ambient) if (a.parts.group.visible) out.push(a)
    for (const o of this.npcs.values()) out.push(o.npc)
    for (const c of this.commuters) if (c.state !== 'aboard' && c.state !== 'alightPending' && c.parts.group.visible) out.push(c)
    return out
  }
  private honk(v: Veh, text = 'Beep beep!') {
    if (Math.hypot(v.g.position.x - this.px, v.g.position.z - this.pz) > 26) return
    audio.sfx('horn')
    if (v.bub) { this.scene.remove(v.bub); v.bub = undefined }
    v.bub = this.textSprite(text, { bg: 'rgba(255,224,102,0.96)', fg: '#1c1b22', size: 5 }); v.bubT = 1.4; this.scene.add(v.bub)
  }
  private busDwell(v: Veh) {
    const doorX = v.lane + 1.45, z = this.stopZ
    let boarded = 0
    for (const c of this.commuters) if (c.state === 'wait' && boarded < 2) { c.state = 'board'; c.tx = doorX; c.tz = z + boarded * 0.7 - 0.3; boarded++ }
    let off = 0
    for (const c of this.commuters) if (c.state === 'aboard' && off < 2 && Math.random() < 0.85) { c.state = 'alightPending'; c.delay = 1.3 + off * 1.1; off++ }
  }
  private updateCommuters(dt: number) {
    const quiet = this.streetLife() < 0.05
    for (const c of this.commuters) {
      const P = c.parts
      if (quiet && c.state === 'wait' && Math.hypot(c.x - this.px, c.z - this.pz) > 12) { P.group.visible = false; continue }
      if (c.state === 'aboard' || c.state === 'alightPending') {
        P.group.visible = false
        if (c.state === 'alightPending') { c.delay -= dt; if (c.delay <= 0) { c.x = c.tx = 3.0 + 1.55 - 0.1; c.z = this.stopZ + Math.random() * 0.6; c.tx = c.home.x + (Math.random() - 0.5) * 0.8; c.tz = c.home.z + (Math.random() - 0.5) * 0.8; c.state = 'alight'; P.group.visible = true } }
        continue
      }
      P.group.visible = true
      if (c.state === 'board' || c.state === 'alight') {
        const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz)
        if (d < 0.35) { if (c.state === 'board') c.state = 'aboard'; else { c.state = 'wait'; c.home = { x: c.tx, z: c.tz } } }
        else { c.x += (dx / d) * 2.0 * dt; c.z += (dz / d) * 2.0 * dt; P.group.rotation.y += this.angleDiff(Math.atan2(dx, dz), P.group.rotation.y) * Math.min(1, dt * 8) }
        animateHuman(P, this.time + c.x, true, 0.7)
      } else { animateHuman(P, this.time, false); P.group.rotation.y += this.angleDiff(-Math.PI / 2, P.group.rotation.y) * Math.min(1, dt * 3) }
      P.group.position.set(c.x, 0, c.z)
    }
  }

  private updateTraffic(dt: number) {
    const folks = this.folks(), stopZ = this.stopZ, L = this.streetLife(), nv = this.traffic.length
    for (let vi = 0; vi < nv; vi++) {
      const v = this.traffic[vi]
      // at night the cars go home: they keep driving until they are well out of sight, then stay off the road
      const far = Math.hypot(v.g.position.x - this.px, v.g.position.z - this.pz) > 28
      if (vi / nv >= L) { if (far) { v.off = true; v.g.visible = false; if (v.bub) { this.scene.remove(v.bub); v.bub = undefined } } } else if (v.off && far) { v.off = false; v.g.visible = true }
      if (v.off) continue
      const al = (p: { x: number; z: number }) => (v.axis === 'x' ? p.x : p.z), la = (p: { x: number; z: number }) => (v.axis === 'x' ? p.z : p.x)
      const half = v.len / 2, stopDist = 2.6 + v.cur * 0.55
      // a person in front of the bumper, or beside the car on the road: wait
      let blockedByPerson = false
      for (const p of folks) {
        const rel = (al(p) - v.pos) * v.dir
        if (rel > -half && rel < half + stopDist && Math.abs(la(p) - v.lane) < 1.7 && Math.abs(la(p)) < 3.2) { blockedByPerson = true; break }
      }
      let cap = v.speed
      // slow down for a vehicle ahead in the same lane
      for (const o of this.traffic) {
        if (o === v || o.off || o.axis !== v.axis || o.dir !== v.dir || o.lane !== v.lane) continue
        const gap = (o.pos - v.pos) * v.dir - half - o.len / 2
        if (gap > -0.5 && gap < 4 + v.cur * 0.7) cap = Math.min(cap, gap < 1.4 ? 0 : o.cur)
      }
      // do not drive into the junction while something is crossing it
      if (v.pos * v.dir < 0 && Math.abs(v.pos) > 3.2 && Math.abs(v.pos) < half + 6) for (const w of this.traffic) if (!w.off && w.axis !== v.axis && Math.abs(w.pos) < 4.2 + w.len / 2) cap = 0
      // the buses that serve the stop
      if (v.pub && v.axis === 'z' && v.dir === 1) {
        const d = stopZ - v.pos
        if (v.mode === 'drive' && !v.served && d > 0 && d < 14) v.mode = 'approach'
        if (v.mode === 'approach') {
          cap = Math.min(cap, Math.max(1.2, d * 0.9))
          if (d < -0.5) { v.mode = 'drive'; v.served = true }
          else if (d < 0.4 || (d < 1.2 && v.cur < 0.3)) { v.mode = 'dwell'; v.dwellT = 6.5; this.honk(v, 'Oya enter!'); this.busDwell(v) }
        }
        if (v.mode === 'dwell') { cap = 0; v.dwellT -= dt; if (v.dwellT <= 0) { v.mode = 'drive'; v.served = true; this.honk(v, 'Beep beep!') } }
      }
      const target = blockedByPerson ? 0 : cap
      v.cur = v.cur > target ? Math.max(target, v.cur - 14 * dt) : Math.min(target, v.cur + 4 * dt)
      // honk when someone steps out in front, and again now and then while waiting for them
      v.honkT -= dt
      if (blockedByPerson) {
        if (!v.wasBlocked && v.cur > 1.5) { this.honk(v); v.honkT = 3 }
        else if (v.cur < 0.3 && v.honkT <= 0) { this.honk(v, v.kind === 'danfo' ? 'Oga, waka well!' : 'Beep beep!'); v.honkT = 3 + Math.random() * 2 }
      }
      v.wasBlocked = blockedByPerson
      v.pos += v.dir * v.cur * dt
      if (v.pos > 58) { v.pos = -58; v.served = false; v.mode = 'drive' } else if (v.pos < -58) v.pos = 58
      if (v.axis === 'x') { v.g.position.set(v.pos, 0, v.lane); v.g.rotation.y = v.dir > 0 ? 0 : Math.PI }
      else { v.g.position.set(v.lane, 0, v.pos); v.g.rotation.y = v.dir > 0 ? -Math.PI / 2 : Math.PI / 2 }
      if (v.bub) { v.bubT -= dt; v.bub.position.set(v.g.position.x, 4.2, v.g.position.z); if (v.bubT <= 0) { this.scene.remove(v.bub); v.bub = undefined } }
    }
    this.updateCommuters(dt)
    this.updateCritters(dt)
    this.updateGym(dt)
    this.stepRide(dt)
  }

  // ---------- night animals ----------
  /** 0 by day, 1 at night: owls, rats, cockroaches, bats and cats come out once it gets dark. */
  private nightLevel() {
    const h = this.hour
    if (h >= 20.5 || h < 5) return 1
    if (h >= 19.5) return h - 19.5
    if (h < 6) return 6 - h
    return 0
  }
  private makeCritters() {
    const M = (c: number) => new THREE.MeshLambertMaterial({ color: c }), B = (c: number) => new THREE.MeshBasicMaterial({ color: c })
    const bx = (g: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o }
    const add = (kind: Critter['kind'], g: THREE.Group, base: number, extra: Partial<Critter> = {}) => {
      g.scale.setScalar(base); g.visible = false; this.scene.add(g)
      this.critters.push({ kind, g, x: 999, z: 999, tx: 999, tz: 999, wait: Math.random() * 2, phase: Math.random() * 6, say: 4 + Math.random() * 6, bubT: 0, y: 0, base, fled: false, ...extra })
    }
    for (let i = 0; i < 3; i++) { // owls, perched on rooftops
      const g = new THREE.Group(), head = new THREE.Group()
      bx(g, 0.6, 0.85, 0.5, M(0x6a4a2a), 0, 0.45, 0); bx(g, 0.34, 0.5, 0.06, M(0xd9c29a), 0, 0.42, -0.26)
      bx(head, 0.7, 0.5, 0.5, M(0x7a5a3a), 0, 0, 0); bx(head, 0.12, 0.2, 0.12, M(0x5a3a1e), -0.28, 0.32, 0); bx(head, 0.12, 0.2, 0.12, M(0x5a3a1e), 0.28, 0.32, 0)
      for (const sx of [-0.17, 0.17]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), B(0xffe14a)); e.position.set(sx, 0.05, -0.24); head.add(e); const pu = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), B(0x111111)); pu.position.set(sx, 0.05, -0.37); head.add(pu) }
      bx(head, 0.1, 0.12, 0.1, M(0xe08a1e), 0, -0.07, -0.3)
      head.position.y = 1.15; g.add(head)
      add('owl', g, 1.4, { head })
    }
    for (let i = 0; i < 6; i++) { // rats
      const g = new THREE.Group(), m = M(0x5a5a62)
      bx(g, 0.28, 0.2, 0.55, m, 0, 0.12, 0); bx(g, 0.2, 0.17, 0.24, m, 0, 0.12, 0.38); bx(g, 0.05, 0.05, 0.5, M(0xe0a0a0), 0, 0.08, -0.5)
      for (const sx of [-0.1, 0.1]) { bx(g, 0.07, 0.07, 0.03, M(0xe0a0a0), sx, 0.24, 0.32); bx(g, 0.03, 0.03, 0.03, B(0xff3030), sx * 0.8, 0.16, 0.5) }
      add('rat', g, 1.5)
    }
    for (let i = 0; i < 10; i++) { // cockroaches
      const g = new THREE.Group(), m = M(0x4a2a14)
      bx(g, 0.2, 0.08, 0.34, m, 0, 0.06, 0); bx(g, 0.12, 0.07, 0.1, M(0x3a1f0e), 0, 0.06, 0.2)
      for (const sx of [-0.06, 0.06]) bx(g, 0.015, 0.015, 0.22, M(0x2a1608), sx, 0.1, 0.32)
      add('roach', g, 1.7)
    }
    for (let i = 0; i < 3; i++) { // bats flapping round the street lamps
      const g = new THREE.Group(), m = M(0x1c1a22)
      bx(g, 0.2, 0.16, 0.3, m, 0, 0, 0)
      const wl = new THREE.Group(), wr = new THREE.Group()
      bx(wl, 0.6, 0.04, 0.3, m, -0.3, 0, 0); bx(wr, 0.6, 0.04, 0.3, m, 0.3, 0, 0); g.add(wl, wr)
      add('bat', g, 1.4, { wings: [wl, wr] })
    }
    for (let i = 0; i < 2; i++) { // street cats with glowing eyes
      const g = new THREE.Group(), m = M(i ? 0xb8864f : 0x34343c)
      bx(g, 0.34, 0.34, 0.7, m, 0, 0.3, 0); bx(g, 0.3, 0.28, 0.3, m, 0, 0.46, 0.42); bx(g, 0.07, 0.4, 0.07, m, 0, 0.5, -0.4)
      for (const sx of [-0.08, 0.08]) { bx(g, 0.07, 0.1, 0.05, m, sx * 1.6, 0.66, 0.4); bx(g, 0.06, 0.06, 0.03, B(0x7affc8), sx, 0.5, 0.58) }
      add('cat', g, 1.3)
    }
  }
  private placeCritter(c: Critter) {
    const px = this.px, pz = this.pz
    if (c.kind === 'owl') {
      const cand = this.district.buildings.filter((b) => { const d = Math.hypot((b.rect.x0 + b.rect.x1) / 2 - px, (b.rect.z0 + b.rect.z1) / 2 - pz); return d > 5 && d < 18 })
      const b = cand.length ? cand[Math.floor(Math.random() * cand.length)] : null
      if (b) { c.x = b.rect.x0 + 0.8 + Math.random() * Math.max(0.1, b.rect.x1 - b.rect.x0 - 1.6); c.z = b.rect.z1 - 0.4; c.y = b.h + 0.55; c.g.position.set(c.x, c.y, c.z); c.g.rotation.y = Math.PI; return }
      c.x = c.z = 999; c.g.visible = false; return
    }
    for (let k = 0; k < 14; k++) {
      const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 11, x = px + Math.cos(a) * r, z = pz + Math.sin(a) * r
      if (this.free(x, z)) { c.x = x; c.z = z; c.tx = x; c.tz = z; c.y = c.kind === 'bat' ? 4.6 : 0; c.g.position.set(x, c.y, z); return }
    }
  }
  private updateCritters(dt: number) {
    const n = this.nightLevel(), show = n > 0.02 && !this.interior
    for (const c of this.critters) {
      if (!show) { c.g.visible = false; continue }
      const dp = Math.hypot(c.x - this.px, c.z - this.pz)
      if (dp > 24) this.placeCritter(c)
      if (c.x === 999) continue
      c.g.visible = true; c.g.scale.setScalar(c.base * (0.4 + 0.6 * n))
      c.phase += dt
      const t = this.time
      if (c.bub) { c.bubT -= dt; c.bub.position.set(c.x, c.y + 2.4, c.z); if (c.bubT <= 0) { this.scene.remove(c.bub); c.bub = undefined } }
      const say = (text: string) => { if (c.bub) return; c.bub = this.textSprite(text, { bg: 'rgba(255,255,255,0.95)', fg: '#1c1b22', size: 5 }); c.bubT = 2.6; this.scene.add(c.bub) }
      if (c.kind === 'owl') {
        c.head!.rotation.y = Math.sin(c.phase * 0.7) * 1.1; c.head!.scale.y = Math.sin(c.phase * 1.3) > 0.97 ? 0.8 : 1
        c.say -= dt
        if (dp < 10 && c.say <= 0) { c.say = 9 + Math.random() * 8; say(Math.random() < 0.75 ? 'I be witch o!' : 'Hoo! Hoo!'); audio.hoot() }
      } else if (c.kind === 'bat') {
        if (c.tx === c.x && c.tz === c.z) { c.tx = c.x; c.tz = c.z }
        const cx = c.tx, cz = c.tz, a = c.phase * 1.4
        c.x = cx + Math.cos(a) * 3; c.z = cz + Math.sin(a) * 3; c.y = 4.6 + Math.sin(c.phase * 2) * 0.5
        c.g.position.set(c.x, c.y, c.z); c.g.rotation.y = -a + Math.PI
        c.wings![0].rotation.z = Math.sin(t * 20) * 0.7; c.wings![1].rotation.z = -Math.sin(t * 20) * 0.7
      } else {
        const rat = c.kind === 'rat', roach = c.kind === 'roach', cat = c.kind === 'cat'
        let speed = rat ? 2.6 : roach ? 2.0 : 1.4
        if (!cat && dp < 3.4) { // scatter from the player
          if (!c.fled) { c.fled = true; if (rat) { audio.squeak(); say('Squeak!') } const a = Math.atan2(c.x - this.px, c.z - this.pz); c.tx = c.x + Math.sin(a) * 7; c.tz = c.z + Math.cos(a) * 7; c.wait = 0 }
          speed *= 1.8
        } else if (dp > 5) c.fled = false
        if (cat && dp < 6 && !c.bub && c.say <= 0) { c.say = 10 + Math.random() * 10; say('Meow'); }
        c.say -= dt
        if (c.wait > 0) { c.wait -= dt } else {
          const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz)
          if (d < 0.3) { const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 4; c.tx = c.x + Math.cos(a) * r; c.tz = c.z + Math.sin(a) * r; c.wait = cat ? 6 + Math.random() * 8 : roach ? 0.2 + Math.random() * 0.8 : 0.4 + Math.random() * 1.6 }
          else {
            const pm = moveWithCollision(this.district.blockers, c.x, c.z, (dx / d) * speed * dt, (dz / d) * speed * dt)
            if (Math.abs(pm.x - c.x) < 1e-5 && Math.abs(pm.z - c.z) < 1e-5) { c.tx = c.x; c.tz = c.z } else { c.x = pm.x; c.z = pm.z }
            c.g.rotation.y += this.angleDiff(Math.atan2(dx, dz), c.g.rotation.y) * Math.min(1, dt * 12)
          }
        }
        c.g.position.set(c.x, roach ? Math.abs(Math.sin(t * 30 + c.phase)) * 0.02 : 0, c.z)
      }
    }
  }
  debugCritters() { return this.critters.filter((c) => c.g.visible).map((c) => c.kind) }

  // ---------- riding a bus ----------
  private rideLeg(from: [number, number], to: [number, number], dur: number, ease: 'in' | 'out'): Promise<void> {
    const rd = this.ride!
    return new Promise((res) => { rd.leg = { from, to, dur, t: 0, ease, face: Math.atan2(-(to[1] - from[1]), to[0] - from[0]), res } })
  }
  private stepRide(dt: number) {
    const rd = this.ride; if (!rd) return
    const lg = rd.leg
    if (lg) {
      lg.t += dt
      const k = Math.min(1, lg.t / lg.dur), e = lg.ease === 'out' ? 1 - (1 - k) * (1 - k) : k * k
      const x = lg.from[0] + (lg.to[0] - lg.from[0]) * e, z = lg.from[1] + (lg.to[1] - lg.from[1]) * e
      rd.g.position.set(x, 0, z); rd.g.rotation.y = lg.face
      if (k >= 1) { rd.leg = null; lg.res() }
    }
    if (rd.follow) { const p = rd.g.position; this.camOverride = { pos: [p.x + 7, 8, p.z + 12], look: [p.x, 1, p.z] }; this.interior?.showIcons(false) }
  }
  private pause(sec: number) { return new Promise<void>((r) => setTimeout(r, sec * 1000)) }
  private spawnRide() {
    const g = vehicleMesh(this.district.theme.city === 'abuja' ? 'cab' : 'danfo'); this.scene.add(g)
    this.ride = { g, leg: null, follow: false }
  }
  private endRide() { if (this.ride) { this.scene.remove(this.ride.g); this.ride = null } }
  /** A bus pulls up at your stop, you walk to its door and climb in. */
  async rideBoard() {
    this.rideActive = true
    const z = this.stopZ, lane = 1.55
    this.spawnRide(); this.ride!.g.position.set(lane, 0, z - 26)
    const arrive = this.rideLeg([lane, z - 26], [lane, z], 3.4, 'out')
    await arrive
    const door = { x: lane + 1.5, z }
    this.walkTo(door.x + 0.6, door.z)
    const t0 = Date.now()
    while (Date.now() - t0 < 5500) { await this.pause(0.15); if (Math.hypot(this.px - (door.x + 0.6), this.pz - door.z) < 0.7) break }
    this.player.group.visible = false; this.setFrozen(true)
    await this.pause(0.4)
  }
  async rideDepart() { const rd = this.ride!; rd.follow = true; const z = this.stopZ; await this.rideLeg([1.55, z], [1.55, z + 45], 3.2, 'in') }
  /** The bus comes in beside your destination, you step off and walk to its door. */
  async rideArrive(door: { x: number; z: number }) {
    this.endRide(); this.spawnRide()
    const xRoad = Math.abs(door.z) <= Math.abs(door.x)
    const sgn = (n: number) => (n < 0 ? -1 : 1)
    let end: [number, number], start: [number, number], alight: { x: number; z: number }
    if (xRoad) { const lane = sgn(door.z) * 1.55, dir = sgn(door.z); end = [door.x, lane]; start = [Math.max(-56, Math.min(56, door.x - dir * 30)), lane]; alight = { x: door.x, z: sgn(door.z) * 3.9 } }
    else { const lane = sgn(door.x) * 1.55, dir = sgn(door.x); end = [lane, door.z]; start = [lane, Math.max(-56, Math.min(56, door.z - dir * 30))]; alight = { x: sgn(door.x) * 3.9, z: door.z } }
    const rd = this.ride!; rd.follow = true; rd.g.position.set(start[0], 0, start[1])
    await this.rideLeg(start, end, 3.2, 'out')
    audio.sfx('horn'); const bub = this.textSprite('Oya, we don reach!', { bg: 'rgba(255,224,102,0.96)', fg: '#1c1b22', size: 5 }); bub.position.set(rd.g.position.x, 4.2, rd.g.position.z); this.scene.add(bub); setTimeout(() => this.scene.remove(bub), 1800)
    await this.pause(0.5)
    const free = this.freeNear(alight.x, alight.z); this.placePlayer(free.x, free.z, 0); this.player.group.visible = true
    rd.follow = false; this.camOverride = null; this.interior?.showIcons(true)
    this.setFrozen(false); this.rideActive = false
    this.walkTo(door.x, door.z)
    // the bus drives off the way it was going
    const away: [number, number] = [end[0] + (xRoad ? (end[0] >= start[0] ? 1 : -1) * 50 : 0), end[1] + (xRoad ? 0 : (end[1] >= start[1] ? 1 : -1) * 50)]
    void this.rideLeg(end, away, 3.5, 'in').then(() => this.endRide())
  }
  debugStreet() { return { cars: this.traffic.filter((v) => v.g.visible && !v.off).length, people: this.ambient.filter((a) => a.parts.group.visible).length + this.commuters.filter((c) => c.parts.group.visible).length } }
  debugCommuters() { return this.commuters.map((c) => c.state) }
  debugTraffic() { return this.traffic.map((v) => ({ lane: v.lane, dir: v.dir, kind: v.kind, axis: v.axis, pos: +v.pos.toFixed(1), cur: +v.cur.toFixed(2), mode: v.mode })) }

  /** The street characters of this district: touts at the bus stop, politicians and their aides, hawkers on the road. */
  private makeCrowd() {
    const d = this.district
    const door = (id: PlaceId) => d.places.find((p) => p.id === id)!.door
    const SAY: Record<CrowdKind, string[]> = {
      tout: ['Oya! CMS CMS! Enter!', 'Oga, one chance!', 'Park well o! Pay me!', 'Madam, enter! Enter!', 'Conductor, vamoose!'],
      politician: ['Vote for progress!', 'We will fix the roads!', 'Jobs for our youth!', 'I am a servant of the people!', 'Stakeholders, welcome!'],
      hawker: ['Pure water! Cold!', 'Gala! Gala! Gala!', 'Plantain chips here!', 'Oranges, fresh fresh!', 'Buy bread, hot!'],
    }
    const names = { tout: ['Agba', 'Baba Ibeji', 'Chairman'], politician: ['Hon. Bello', 'Sen. Okafor', 'Chief Ade', 'Hon. Musa'], hawker: ['Iya Ngozi', 'Auntie Ify', 'Mama Bisi'] }
    let id = 0
    for (const c of d.flavour.crowd) {
      for (let i = 0; i < c.n; i++) {
        const female = c.kind === 'hawker'
        const look = hashLook(`${c.kind}${id}${d.theme.id}`, female ? 'female' : 'male')
        const parts = buildHuman({
          look: c.kind === 'tout' ? { ...look, hairStyle: 'lowcut', outfitType: 'casual', topColor: ['#d62828', '#e6a817', '#1c7ea6'][i % 3], bottomColor: '#222222' }
            : c.kind === 'politician' ? { ...look, hairStyle: 'bald', outfitType: 'traditional', fabric: i === 0 ? 'asoOke' : 'plain', topColor: i === 0 ? '#c4562a' : '#f2efe6', bottomColor: '#f2efe6' }
            : { ...look, hairStyle: 'gele', outfitType: 'traditional', fabric: 'ankara', topColor: ['#c4562a', '#1c7ea6', '#8a1c6a'][i % 3] },
          gender: female ? 'female' : 'male', age: c.kind === 'politician' ? 52 : 30, wear: c.kind === 'politician' ? ['fila'] : c.kind === 'tout' ? ['cap'] : [], scale: 1.1,
        })
        let x = 0, z = 0, r = 3
        if (c.kind === 'tout') { const bs = door('busstop'); x = bs.x + 2.5 + i * 1.6; z = bs.z - 3 + (i % 2) * 2; r = 0 }
        else if (c.kind === 'politician') { const o = door(i % 2 ? 'office' : 'worship'); x = o.x + 2 + i * 1.5; z = o.z + 2.5 + (i % 2); r = 5 }
        else { x = -20 + i * 18; z = 5.2; r = 14 }
        if (!this.free(x, z)) { const f = this.freeSpot(x, z); x = f.x; z = f.z }
        parts.group.position.set(x, 0, z); this.scene.add(parts.group)
        this.ambient.push({ parts, x, z, heading: Math.random() * Math.PI * 2, timer: 1, speed: 0, bubbleT: 0, sayT: 2 + i * 1.7, lines: SAY[c.kind], stay: c.kind === 'tout', home: { x, z, r } })
        void names; id++
      }
    }
  }
  private freeSpot(x: number, z: number): { x: number; z: number } {
    for (let rad = 0.8; rad < 8; rad += 0.8) for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2, px = x + Math.cos(a) * rad, pz = z + Math.sin(a) * rad; if (this.free(px, pz)) return { x: px, z: pz } }
    return { x, z }
  }

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
    try { view = new InteriorView(place, installed, place === 'home' ? this.district.flavour.homeInterior : place === 'worship' && this.faith === 'mosque' ? { wall: 0xf3efdf, floor: 0x2f7a5a } : undefined, this.district.theme.id) } catch { return false }
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

  // ---------- washing: brushing teeth, rinsing, showering ----------
  private wash: { pose: 'brush' | 'rinse' | 'shower' | 'soap' | Move; t: number } | null = null
  private washFx?: { brush: THREE.Group; foam: THREE.Mesh[] }
  washSpot(kind: 'sink' | 'shower') { return this.interior?.washSpot(kind) ?? null }
  setWater(kind: 'tap' | 'shower', on: boolean) { this.interior?.setWater(kind, on) }
  private ensureWashFx() {
    if (this.washFx) return this.washFx
    const brush = new THREE.Group()
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.7), new THREE.MeshLambertMaterial({ color: 0x2b8ad6 })); brush.add(handle)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.2), new THREE.MeshLambertMaterial({ color: 0xffffff })); head.position.z = -0.4; brush.add(head)
    brush.position.set(0.28, 2.27, 0.59); brush.rotation.y = 0.71; brush.visible = false
    const foam: THREE.Mesh[] = []
    const fm = new THREE.MeshBasicMaterial({ color: 0xffffff })
    for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.05 + (i % 3) * 0.03, 8, 6), fm); f.visible = false; foam.push(f) }
    this.player.body.add(brush); for (const f of foam) this.player.body.add(f)
    return (this.washFx = { brush, foam })
  }
  /** Pose the player for washing. null stands them back up. */
  washPose(p: 'brush' | 'rinse' | 'shower' | 'soap' | Move | null) {
    const fx = this.ensureWashFx()
    this.wash = p ? { pose: p, t: 0 } : null
    fx.brush.visible = p === 'brush'
    if (!p) { resetPose(this.player); this.player.body.rotation.x = 0; this.player.armL.rotation.set(0, 0, 0); this.player.armR.rotation.set(0, 0, 0); for (const f of fx.foam) f.visible = false }
  }
  /** Foam on the face (toothpaste) or all over (soap). */
  setFoam(mode: 'none' | 'mouth' | 'body') {
    const fx = this.ensureWashFx()
    fx.foam.forEach((f, i) => {
      f.visible = mode === 'body' || (mode === 'mouth' && i < 4)
      if (mode === 'mouth') f.position.set((i - 1.5) * 0.09, 2.17 + (i % 2) * 0.05, 0.36)
      else f.position.set([-0.5, 0.5, -0.3, 0.3, 0, -0.55, 0.55, 0.15, -0.15, 0, -0.35, 0.35][i], [2.6, 2.6, 2.1, 2.1, 2.75, 1.9, 1.9, 1.5, 1.2, 1.7, 1.1, 1.1][i], 0.3)
    })
  }
  private stepWash(dt: number) {
    const w = this.wash; if (!w) return
    w.t += dt
    const P = this.player, t = w.t
    if (w.pose === 'run' || w.pose === 'lift' || w.pose === 'stretch' || w.pose === 'jacks' || w.pose === 'squat') { exercisePose(P, w.pose, t); return }
    if (w.pose === 'brush') {
      P.body.rotation.x = 0.08; P.armL.rotation.x = 0
      P.armR.rotation.x = -2.0 + Math.sin(t * 17) * 0.14
      const b = this.washFx!.brush, k = Math.sin(t * 17) * 0.05; b.position.set(0.28 + 0.65 * k, 2.27 + Math.sin(t * 11) * 0.02, 0.59 + 0.76 * k)
    } else if (w.pose === 'rinse') {
      const lean = Math.max(0, Math.sin(t * 2.4))
      P.body.rotation.x = 0.1 + lean * 0.32; P.armL.rotation.x = P.armR.rotation.x = -1.3 - lean * 0.1; P.armL.rotation.z = 0.25; P.armR.rotation.z = -0.25
    } else if (w.pose === 'shower') {
      P.body.rotation.x = 0; P.armL.rotation.x = -2.5 + Math.sin(t * 9) * 0.25; P.armR.rotation.x = -2.5 - Math.sin(t * 9) * 0.25
    } else {
      P.armL.rotation.set(-1.0 + Math.sin(t * 8) * 0.3, 0, 0.5); P.armR.rotation.set(-1.0 - Math.sin(t * 8) * 0.3, 0, -0.5)
      this.washFx!.foam.forEach((f, i) => { if (f.visible) f.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.12) })
    }
  }
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
      this.stepWash(dt)
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
    this.updateTraffic(dt)
    const dawn = this.hour >= 5 && this.hour < 6.5
    const L = Math.max(this.streetLife(), dawn ? 0.6 : 0), nAmb = this.ambient.length, late = this.hour < 5
    for (let ai = 0; ai < nAmb; ai++) {
      const a = this.ambient[ai]
      // late at night nearly everyone is indoors: most people go home, a couple linger a little longer and then head home too
      if (!late) a.linger = 40 + Math.random() * 50; else if (a.linger === undefined) a.linger = 40 + Math.random() * 50
      if (late && ai < 2 && a.linger! > 0) a.linger! -= dt
      const want = ai / nAmb < L || (late && ai < 2 && a.linger! > 0)
      const far = Math.hypot(a.x - this.px, a.z - this.pz) > 16
      if (!want) {
        if (a.away) { a.parts.group.visible = false; continue }
        if (far) { a.away = true; a.parts.group.visible = false; if (a.bubble) { this.scene.remove(a.bubble); a.bubble = undefined } continue }
        if (!a.homing) { let best = this.district.places[0].door, bd = 1e9; for (const pl of this.district.places) { const d = Math.hypot(pl.door.x - a.x, pl.door.z - a.z); if (d < bd) { bd = d; best = pl.door } } a.homing = { x: best.x, z: best.z, t: 25 } }
        a.homing.t -= dt
        const dx = a.homing.x - a.x, dz = a.homing.z - a.z, d = Math.hypot(dx, dz)
        if (d < 1 || a.homing.t <= 0) { a.away = true; a.parts.group.visible = false; if (a.bubble) { this.scene.remove(a.bubble); a.bubble = undefined } continue }
        const sp = 1.7 * dt, pm = moveWithCollision(this.district.blockers, a.x, a.z, (dx / d) * sp, (dz / d) * sp)
        a.x = pm.x; a.z = pm.z; a.heading = Math.atan2(dx, dz)
        a.parts.group.position.set(a.x, 0, a.z); a.parts.group.rotation.y += this.angleDiff(a.heading, a.parts.group.rotation.y) * Math.min(1, dt * 6)
        animateHuman(a.parts, this.time + a.x, true, 0.7)
        continue
      }
      if (a.away) { if (!far) continue; a.away = false; a.homing = undefined; a.parts.group.visible = true }
      a.homing = undefined
      // 5am to 6:30am: people jog along the pavements and do their morning exercises (jumping jacks, stretches, squats)
      if (dawn && !a.stay) {
        if (!a.ex) { const modes = ['jog', 'jacks', 'stretch', 'jog', 'squat', 'jog'] as const; a.ex = { mode: modes[ai % 6], dir: ai % 2 ? 1 : -1, axis: ai % 4 < 2 ? 'x' : 'z', line: ai % 3 === 0 ? 3.9 : -3.9, ph: Math.random() * 6 } }
        const e = a.ex
        if (e.mode === 'jog') {
          const coord = e.axis === 'x' ? a.x : a.z, other = e.axis === 'x' ? a.z : a.x
          const od = e.line - other, on = Math.abs(od) < 0.1 ? 0 : Math.sign(od) * Math.min(Math.abs(od), 3 * dt)
          const nc = coord + e.dir * 3.4 * dt
          if (Math.abs(nc) > 40) e.dir = (e.dir === 1 ? -1 : 1)
          if (e.axis === 'x') { a.x = nc; a.z = other + on } else { a.z = nc; a.x = other + on }
          a.heading = e.axis === 'x' ? (e.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : e.dir > 0 ? 0 : Math.PI
          a.parts.group.position.set(a.x, 0, a.z); a.parts.group.rotation.y += this.angleDiff(a.heading, a.parts.group.rotation.y) * Math.min(1, dt * 8)
          animateHuman(a.parts, this.time + a.ex.ph, true, 1.9)
        } else {
          exercisePose(a.parts, e.mode, this.time + e.ph); a.parts.group.position.set(a.x, 0, a.z); a.parts.group.rotation.y += this.angleDiff(0, a.parts.group.rotation.y) * Math.min(1, dt * 4)
        }
        a.sayT -= dt
        if (a.bubble) { a.bubbleT -= dt; a.bubble.position.set(a.x, 3.2, a.z); if (a.bubbleT <= 0) { this.scene.remove(a.bubble); a.bubble = undefined } }
        else if (Math.hypot(a.x - this.px, a.z - this.pz) < 13 && a.sayT <= 0) { const L2 = ['Morning jog!', 'One, two, three, four!', 'Stay fit o!', 'Good morning!', 'Feel the burn!']; a.sayT = 6 + Math.random() * 8; a.bubbleT = 3; a.bubble = this.textSprite(L2[Math.floor(Math.random() * L2.length)], { bg: 'rgba(255,255,255,0.94)', fg: '#1c1b22', size: 5.2 }); this.scene.add(a.bubble) }
        continue
      }
      if (a.ex) { a.ex = undefined; resetPose(a.parts) }
      a.timer -= dt
      if (a.timer <= 0) {
        a.heading += (Math.random() - 0.5) * 2.6; a.timer = 2 + Math.random() * 4; a.speed = a.stay || Math.random() < 0.25 ? 0 : 1.2 + Math.random() * 1.2
        if (a.home && !a.stay && Math.hypot(a.x - a.home.x, a.z - a.home.z) > a.home.r) a.heading = Math.atan2(a.home.x - a.x, a.home.z - a.z) // stay near where you belong
      }
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
      else if (near && a.sayT <= 0) { a.sayT = (a.lines ? 5 : 9) + Math.random() * (a.lines ? 8 : 12); a.bubbleT = 3.6; a.bubble = this.textSprite((a.lines ?? BUBBLES)[Math.floor(Math.random() * (a.lines ?? BUBBLES).length)], { bg: 'rgba(255,255,255,0.94)', fg: '#1c1b22', size: 5.2 }); this.scene.add(a.bubble) }
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
