// The 3D scene of a level: a cut-away home (low walls so the camera can see in), the chosen character, a follow camera, items, search spots and the
// hazards of the last task. It owns no rules: TaskRunner decides what happens, this draws it and reports what the player is standing next to.
import * as THREE from 'three'
import { buildToon, type Expression, type ToonParts, type ToonSpec } from '../world/toon'
import { animateHuman } from '../world/characters'
import { applyPose, carryPoseFor, poseForItem, type Pose } from '../world/poses'
import { MAMA_FOLAKE, BABA_TUNDE, neighbour } from '../world/castData'
import { moveWithCollision } from '../world/nav'
import { SETS } from './street'
import type { Deco, LevelDef, Item, Spot, Hazard, Speaker, ServeGuest } from './schema'
import type { TaskRunner } from './TaskRunner'

const lam = (c: string | number) => new THREE.MeshLambertMaterial({ color: c })
export const REACH = 2.3

/** an action being played: the player walks up, then bends, digs or reaches, then the rule fires */
type ActKind = 'dig' | 'search' | 'take'
interface Act { pose?: Pose; kind: ActKind; x: number; z: number; id: string; label: string; t: number; dur: number; walk: number; done: () => void; beat: number; phone?: boolean }
const ACT_DUR: Record<ActKind, number> = { dig: 2.4, search: 1.3, take: 1.3 }
const POSE_DUR: Partial<Record<Pose, number>> = { write: 1.8, stamp: 1.5, pickLow: 1.5, lift: 1.6, handOver: 1.2, shakeHands: 1.5, point: 1.1, wave: 1.2 }
export const actLabel = (kind: ActKind, id: string) => kind === 'dig' ? 'Digging through the laundry…' : kind === 'search' ? (id === 'pillow' ? 'Lifting the pillow…' : id === 'drawer' ? 'Opening the drawer…' : 'Checking…') : 'Picking it up…'

export interface Nearby { kind: 'spot' | 'item'; id: string; label: string }

/** sliding clutter in the last task: position along z over time */
export const hazardZ = (h: Hazard, t: number) => { const span = h.z1 - h.z0; const u = ((t * h.speed / span + h.phase) % 2 + 2) % 2; return h.z0 + span * (u < 1 ? u : 2 - u) }

export class LevelRenderer {
  readonly input = { x: 0, z: 0 }
  px: number; pz: number
  private r: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private cam = new THREE.PerspectiveCamera(46, 1, 0.1, 120)
  private me: ToonParts
  private folake: ToonParts
  private tunde: ToonParts
  private facing = 0
  private t = 0
  private stumbleT = 0
  private itemMeshes = new Map<string, THREE.Object3D>()
  private spotMeshes = new Map<string, THREE.Object3D>()
  private hazardMeshes: THREE.Object3D[] = []
  private buzz: THREE.Mesh
  private ro?: ResizeObserver
  private raf = 0
  private last = 0
  runner?: TaskRunner
  paused = false
  private act: Act | null = null
  private furn = new Map<string, THREE.Mesh>()
  private pillow?: THREE.Mesh
  private ball?: THREE.Mesh
  private shotBall?: THREE.Mesh
  private keeper?: THREE.Group
  private crowdParts: ToonParts[] = []
  private kickAnim: { t: number; dur: number; success: boolean; side: number; done: () => void } | null = null
  private fx: { m: THREE.Mesh; v: THREE.Vector3; life: number }[] = []
  private phoneMesh!: THREE.Group
  private clothes = ['#c4562a', '#f5b91c', '#2f5a3a', '#fbf8f0', '#6a8ab8']
  private ring!: THREE.Mesh
  private strips: THREE.Mesh[] = []
  private target: { x: number; z: number } | null = null
  private ray = new THREE.Raycaster()
  onFirstMove?: () => void
  private moved = false
  onAction?: (label: string | null, dur: number) => void
  onFx?: (n: 'tap' | 'pop') => void
  get busy() { return !!this.act || !!this.kickAnim || this.busPhase === 'riding' }
  onNearby?: (n: Nearby | null) => void
  private lastNear = ''
  /** serve task: the guests (drawn as characters that walk, sit and eat), their order labels and plates */
  private guestObjs = new Map<string, { parts: ToonParts; label: THREE.Sprite; plate: THREE.Object3D; g: ServeGuest; task: number; from?: number }>()
  private carryMesh?: { id: string; o: THREE.Object3D; shape: string }
  /** ride task: the bus and where it is in its journey */
  private bus?: THREE.Group
  private busX = 0
  private busPhase: 'away' | 'arriving' | 'waiting' | 'riding' | 'dropped' = 'away'
  private busT = 0
  /** who is speaking now: they gesture while their line is on screen */
  private speaker: Speaker | null = null
  private vehicleKind: 'bus' | 'train' | 'helicopter' | 'ferry' = 'bus'

  constructor(private canvas: HTMLCanvasElement, private level: LevelDef, spec: ToonSpec, startTask = 0) {
    this.r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    this.r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    this.scene.background = new THREE.Color('#f1d9a8')
    this.scene.fog = new THREE.Fog('#f1d9a8', 24, 48)
    this.scene.add(new THREE.HemisphereLight(0xfff1d6, 0x7a6a58, 1.1))
    const sun = new THREE.DirectionalLight(0xffe2b0, 0.95); sun.position.set(-6, 12, 5); this.scene.add(sun)
    this.build()

    this.me = buildToon(spec); this.scene.add(this.me.group)
    const s = startTask > 0 ? level.spawnAfterFirst : level.spawn
    this.px = s.x; this.pz = s.z; this.facing = Math.PI * 0.5
    this.folake = buildToon(MAMA_FOLAKE); this.folake.group.position.set(level.npcs.folake.x, 0, level.npcs.folake.z); this.folake.group.rotation.y = level.npcs.folake.rot; this.scene.add(this.folake.group)
    this.tunde = buildToon(BABA_TUNDE); this.tunde.group.position.set(level.npcs.tunde.x, 0, level.npcs.tunde.z); this.tunde.group.rotation.y = level.npcs.tunde.rot; this.scene.add(this.tunde.group)

    this.buzz = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.5, 24), new THREE.MeshBasicMaterial({ color: '#f5b91c', transparent: true, opacity: 0.8, side: THREE.DoubleSide }))
    this.buzz.rotation.x = -Math.PI / 2; this.buzz.position.set(-4.2, 0.6, 3.6); this.buzz.visible = false; this.scene.add(this.buzz)

    this.resize()
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(canvas.parentElement ?? canvas)
    this.last = performance.now(); this.raf = requestAnimationFrame(this.frame)
  }

  private box(w: number, h: number, d: number, c: string, x: number, y: number, z: number): THREE.Mesh {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(c)); m.position.set(x, y, z); this.scene.add(m); return m
  }

  private build() {
    const L = this.level
    if (L.sceneKind === 'home') this.buildHomeShell(); else if (L.sceneKind === 'pitch') this.buildPitchShell(); else this.buildSceneShell()
    for (const f of L.furniture) {
      const r = f.rect
      this.furn.set(f.name, this.box(r.x1 - r.x0, f.h, r.z1 - r.z0, f.color, (r.x0 + r.x1) / 2, f.h / 2, (r.z0 + r.z1) / 2))
    }
    if (L.sceneKind === 'home') this.buildHomeDeco(); else if (L.sceneKind === 'pitch') { this.buildPitchDeco(); if (L.rides) this.buildPitchStreet() } else this.buildSceneDeco()
    for (const c of L.crowd ?? []) { if (L.sceneKind === 'scene') { const i = this.crowdParts.length; const sp = { ...neighbour(i + 5), accessories: [] as never[] }; const t = buildToon(sp); t.group.position.set(c.x, 0, c.z); t.group.rotation.y = c.rot; this.scene.add(t.group); this.crowdParts.push(t) } }
    for (const [ti, sv] of Object.entries(L.serves ?? {})) for (const g of sv.guests) {
      const i = this.guestObjs.size, sp = { ...neighbour(i + 9), accessories: [] as never[] }, parts = buildToon(sp)
      parts.group.position.set(g.x, 0, g.z); parts.group.visible = false; this.scene.add(parts.group)
      const label = this.label(g.order, 1.7); label.position.set(g.x, 2.7, g.z); label.visible = false; this.scene.add(label)
      const plate = new THREE.Group(); const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 14), lam('#fbf8f0')); const fd = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 6), lam(L.items.find((x) => x.id === g.dish)?.color ?? '#c4562a')); fd.position.y = 0.1; plate.add(pl, fd)
      plate.position.set(g.table.x, 0.86, g.table.z); plate.visible = false; this.scene.add(plate)
      this.guestObjs.set(g.id, { parts, label, plate, g, task: Number(ti), from: sv.from })
    }
    if (L.rides) this.buildBus()
    // spots keep an invisible anchor so the scene can wobble them when the player gets close
    for (const s of L.spots) { const g = new THREE.Group(); g.position.set(s.x, 0, s.z); this.scene.add(g); this.spotMeshes.set(s.id, g) }
    for (const it of L.items) { const o = this.itemMesh(it); o.position.set(it.x, this.itemY(it), it.z); this.scene.add(o); this.itemMeshes.set(it.id, o) }
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40), new THREE.MeshBasicMaterial({ color: '#f5b91c', transparent: true, opacity: 0.7, side: THREE.DoubleSide }))
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.05; this.ring.visible = false; this.scene.add(this.ring)
    for (const h of this.level.hazards) { // faint path of each sliding hazard, so the last task is fair on the first try
      const st = new THREE.Mesh(new THREE.PlaneGeometry(0.9, h.z1 - h.z0), new THREE.MeshBasicMaterial({ color: '#e07a1f', transparent: true, opacity: 0.22 }))
      st.rotation.x = -Math.PI / 2; st.position.set(h.x, 0.03, (h.z0 + h.z1) / 2); st.visible = false; this.scene.add(st); this.strips.push(st)
    }
    this.phoneMesh = new THREE.Group()
    const scr = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.045), new THREE.MeshBasicMaterial({ color: '#9ecbe6' })); scr.position.z = 0.005
    this.phoneMesh.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 0.04), lam('#1c1b22')), scr)
    this.phoneMesh.visible = false; this.scene.add(this.phoneMesh)
    for (const h of this.level.hazards) {
      const g = new THREE.Group()
      if (h.name === 'walker') { const col = ['#2b3a8c', '#c4562a', '#2f5a3a', '#e0457b', '#6a8ab8'][this.hazardMeshes.length % 5]; const bd = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.8, 3, 8), lam(col)); bd.position.y = 1.0; g.add(bd); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), lam('#7a4a2a')); hd.position.y = 1.85; g.add(hd) }
      else if (h.name === 'cart') { const bx = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.9), lam(h.color)); bx.position.y = 0.75; g.add(bx); for (const [x, z] of [[-0.45, -0.35], [0.45, -0.35], [-0.45, 0.35], [0.45, 0.35]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 8), lam('#1c1b22')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.2, z); g.add(w) }; const hn = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.0), lam('#555566')); hn.position.set(-0.7, 1.2, 0); g.add(hn) }
      else if (h.name === 'chair') { const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 12), lam(h.color)); seat.position.y = 0.7; g.add(seat); const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.1), lam(h.color)); back.position.set(0, 1.15, -0.35); g.add(back); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), lam('#555566')); pole.position.y = 0.35; g.add(pole); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 6), lam('#1c1b22')); base.position.y = 0.05; g.add(base) }
      else if (h.name === 'dummy') { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 1.5, 10), lam(h.color)); post.position.y = 0.8; g.add(post); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), lam('#f3e7cf')); hd.position.y = 1.75; g.add(hd); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 12), lam('#1c1b22')); base.position.y = 0.05; g.add(base) }
      else if (h.name === 'mop') { const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), lam('#a87a50')); stick.rotation.z = 1.2; stick.position.y = 0.5; g.add(stick); const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.35), lam(h.color)); head.position.set(-0.7, 0.1, 0); g.add(head) }
      else { for (const dz of [-0.28, 0.28]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.28), lam(h.color)); s.position.set(0, 0.07, dz); g.add(s) } }
      g.visible = false; this.scene.add(g); this.hazardMeshes.push(g)
    }
  }

  private buildHomeShell() {
    const L = this.level, b = L.bounds
    // floors: warm wood in the bedroom, tiles in the living room, grass and a road outside
    this.box(9, 0.1, b.z1 - b.z0, '#c9a074', -4.5, -0.05, 0)
    this.box(9, 0.1, b.z1 - b.z0, '#e6dcc4', 4.5, -0.05, 0)
    this.box(60, 0.1, 40, '#7aa05a', 0, -0.2, 0)
    this.box(6, 0.12, 40, '#4a4a52', 13, -0.12, 0)
    // low outer walls and the doorway frame
    const wc = '#f3e7cf'
    this.box(b.x1 - b.x0, 0.9, 0.3, wc, 0, 0.45, b.z0 - 0.15)
    this.box(b.x1 - b.x0, 0.9, 0.3, wc, 0, 0.45, b.z1 + 0.15)
    this.box(0.3, 0.9, b.z1 - b.z0, wc, b.x0 - 0.15, 0.45, 0)
    this.box(0.3, 0.9, 4, wc, b.x1 + 0.15, 0.45, -3); this.box(0.3, 0.9, 4, wc, b.x1 + 0.15, 0.45, 3)
    this.box(0.3, 0.9, 4, wc, 0, 0.45, -3); this.box(0.3, 0.9, 4, wc, 0, 0.45, 3)
    this.box(0.4, 2.2, 0.3, '#6b3a1e', b.x1 + 0.1, 1.1, -1.1); this.box(0.4, 2.2, 0.3, '#6b3a1e', b.x1 + 0.1, 1.1, 1.1); this.box(0.4, 0.3, 2.5, '#6b3a1e', b.x1 + 0.1, 2.25, 0)
    this.box(1.8, 0.04, 2.4, '#e07a1f', 8.2, 0.01, 0) // doormat
  }

  private buildHomeDeco() {
    // pillow, rug, window, plant, clock: a little life
    this.pillow = this.box(1.2, 0.18, 0.8, '#fbf8f0', -7.6, 0.8, -3)
    this.box(3, 0.03, 2.2, '#2f5a3a', -3.2, 0.01, 0.3)
    this.box(1.6, 0.9, 0.12, '#9ecbe6', -3, 1.6, -5.05)
    this.box(1.6, 0.9, 0.12, '#9ecbe6', 2, 1.6, -5.05)
    this.box(0.5, 0.9, 0.5, '#6b3a1e', 8.4, 0.45, 4.2); this.box(0.8, 0.7, 0.8, '#2f5a3a', 8.4, 1.2, 4.2)
  }

  private buildPitchShell() {
    const b = this.level.rides ? { x0: -12.4, x1: 12.4, z0: -6, z1: 6 } : this.level.bounds // a bus ride adds a street beyond the gate; the pitch itself stays the same size
    this.box(60, 0.1, 40, '#9a8a6a', 0, -0.25, 0) // dusty ground around the pitch
    this.box(b.x1 - b.x0 + 4, 0.1, b.z1 - b.z0 + 3, '#5fae4f', 0, -0.05, 0) // grass
    for (let i = 0; i < 8; i++) this.box((b.x1 - b.x0 + 4) / 8, 0.02, b.z1 - b.z0 + 3, i % 2 ? '#6bb95a' : '#5fae4f', b.x0 - 2 + ((b.x1 - b.x0 + 4) / 8) * (i + 0.5), 0.0, 0) // mowing stripes
    const line = (w: number, d: number, x: number, z: number) => this.box(w, 0.02, d, '#fbf8f0', x, 0.02, z)
    line(b.x1 - b.x0, 0.12, 0, b.z0 + 0.3); line(b.x1 - b.x0, 0.12, 0, b.z1 - 0.3); line(0.12, b.z1 - b.z0 - 0.6, 0, 0)
    line(0.12, b.z1 - b.z0 - 0.6, b.x0 + 0.3, 0); line(0.12, b.z1 - b.z0 - 0.6, b.x1 - 0.3, 0)
    const circle = new THREE.Mesh(new THREE.RingGeometry(2.4, 2.52, 40), new THREE.MeshBasicMaterial({ color: '#fbf8f0', side: THREE.DoubleSide })); circle.rotation.x = -Math.PI / 2; circle.position.y = 0.03; this.scene.add(circle)
    line(3, 0.12, b.x1 - 1.8, -3.5); line(3, 0.12, b.x1 - 1.8, 3.5); line(0.12, 7, b.x1 - 3.3, 0)
    // low fence rails, and an arch at the gate on the left
    const fc = '#f3e7cf'
    this.box(b.x1 - b.x0 + 1, 0.8, 0.2, fc, 0, 0.4, b.z0 - 0.1); this.box(b.x1 - b.x0 + 1, 0.8, 0.2, fc, 0, 0.4, b.z1 + 0.1); this.box(0.2, 0.8, 5, fc, b.x1 + 0.1, 0.4, -3.6); this.box(0.2, 0.8, 5, fc, b.x1 + 0.1, 0.4, 3.6)
    this.box(0.2, 0.8, 4.4, fc, b.x0 - 0.1, 0.4, -3.8); this.box(0.2, 0.8, 4.4, fc, b.x0 - 0.1, 0.4, 3.8)
    this.box(0.3, 2.6, 0.3, '#2f5a3a', b.x0 - 0.1, 1.3, -1.6); this.box(0.3, 2.6, 0.3, '#2f5a3a', b.x0 - 0.1, 1.3, 1.6); this.box(0.3, 0.5, 3.5, '#e07a1f', b.x0 - 0.1, 2.65, 0)
  }

  private buildPitchDeco() {
    // registration tent (orange canopy over the desk), kit benches with their kit laid out, boots rack, goal frames with nets, a few cones, a stand of spectators
    const tent = this.box(3.4, 0.15, 2.4, '#e07a1f', -5.5, 2.6, -4.1)
    for (const [x, z] of [[-7.1, -5.2], [-3.9, -5.2], [-7.1, -3.0], [-3.9, -3.0]]) this.box(0.12, 2.6, 0.12, '#1c1b22', x, 1.3, z)
    void tent
    this.box(1.8, 0.45, 0.06, '#fbf8f0', -5.5, 1.25, -3.3); this.box(1.5, 0.12, 0.5, '#2f5a3a', -5.5, 1.1, -4.1) // sign board and a clipboard on the desk
    for (const [x, z] of [[-1.5, 4.1], [1.5, -4.4], [3.7, 4.1]]) this.box(1.6, 0.05, 0.7, '#e07a1f', x, 0.62, z)
    for (const z of [-2.05, 2.05]) this.box(0.1, 1.6, 0.1, '#fbf8f0', 12.0, 0.8, z)
    this.box(0.1, 0.1, 4.3, '#fbf8f0', 12.0, 1.6, 0); const net = this.box(0.8, 1.5, 4.1, '#ffffff', 12.5, 0.8, 0); (net.material as THREE.MeshLambertMaterial).transparent = true; (net.material as THREE.MeshLambertMaterial).opacity = 0.25
    for (const [x, z] of [[-9, 3], [-8.2, -1.2], [-6.8, 4.6], [-3, -1.5], [5, -4.4], [9.4, 4.8]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 8), lam('#e07a1f')); c.position.set(x, 0.22, z); this.scene.add(c) }
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), lam('#fbf8f0')); this.ball.visible = false; this.scene.add(this.ball)
    const K = this.level.kick
    if (K) {
      const spot = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), new THREE.MeshBasicMaterial({ color: '#fbf8f0' })); spot.rotation.x = -Math.PI / 2; spot.position.set(K.x + 0.9, 0.035, K.z); this.scene.add(spot)
      this.shotBall = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), lam('#fbf8f0')); this.shotBall.position.set(K.x + 0.9, 0.24, K.z); this.shotBall.visible = false; this.scene.add(this.shotBall)
      const kg = new THREE.Group()
      const kb = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 1.5, 10), lam('#e07a1f')); kb.position.y = 0.8; kg.add(kb)
      const kh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), lam('#f3e7cf')); kh.position.y = 1.75; kg.add(kh)
      for (const sx of [-1, 1]) { const gl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.2), lam('#fbf8f0')); gl.position.set(0, 1.0, sx * 0.5); kg.add(gl) } // gloves
      if (!K.pass) { kg.position.set(K.goal.x - 0.4, 0, 0); this.scene.add(kg); this.keeper = kg }
      else { const tm = buildToon({ ...neighbour(40), top: 'tee', topColor: '#2f5a3a', bottom: 'shorts', bottomColor: '#fbf8f0', accessories: [] }); tm.group.position.set(K.goal.x, 0, K.goal.z); tm.group.rotation.y = Math.atan2(K.x - K.goal.x, K.z - K.goal.z); this.scene.add(tm.group); this.crowdParts.push(tm) }
    }
    for (const c of this.level.crowd ?? []) { // other hopefuls in kits, standing about
      const i = this.crowdParts.length
      const sp = { ...neighbour(i + 5), top: 'tee' as const, topColor: ['#2b3a8c', '#c4562a', '#f5b91c', '#6a8ab8', '#e0457b'][i % 5], innerColor: undefined, bottom: 'shorts' as const, bottomColor: '#fbf8f0', accessories: [] }
      const t = buildToon(sp); t.group.position.set(c.x, 0, c.z); t.group.rotation.y = c.rot; this.scene.add(t.group); this.crowdParts.push(t)
    }
    // spectators and other hopefuls standing about outside the north fence
    const cols = ['#2b3a8c', '#c4562a', '#2f5a3a', '#e0457b', '#f5b91c', '#6a8ab8']
    for (let i = 0; i < 16; i++) { const g = new THREE.Group(); const col = cols[i % cols.length]
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.7, 3, 6), lam(col)); body.position.y = 0.95; g.add(body)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), lam(['#5c3317', '#7a4a2a', '#3d2210'][i % 3])); head.position.y = 1.72; g.add(head)
      g.position.set(-11 + i * 1.5, 0, -6.9 - (i % 2) * 0.8); this.scene.add(g) }
  }

  private buildBus() {
    const train = Object.values(this.level.rides ?? {})[0]?.vehicle === 'train'
    const g = new THREE.Group(), add = (w: number, h: number, d: number, c: string, x: number, y: number, z: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(c)); m.position.set(x, y, z); g.add(m) }
    const kind = Object.values(this.level.rides ?? {})[0]?.vehicle ?? 'bus'
    this.vehicleKind = kind
    if (kind === 'helicopter') {
      const body = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), lam('#c4562a')); body.scale.set(1.7, 0.95, 1.0); body.position.y = 1.5; g.add(body)
      const glass = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 8), lam('#9ecbe6')); glass.scale.set(1, 0.8, 1.02); glass.position.set(1.0, 1.65, 0); g.add(glass)
      add(2.6, 0.22, 0.22, '#c4562a', -2.6, 1.7, 0); add(0.14, 0.9, 0.1, '#1c1b22', -3.8, 1.9, 0)
      const rotor = new THREE.Group(); rotor.position.set(0, 2.65, 0); rotor.name = 'rotor'; const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 6), lam('#1c1b22')); mast.position.y = -0.1; rotor.add(mast); for (const a of [0, Math.PI / 2]) { const bl = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.05, 0.18), lam('#2b2b33')); bl.rotation.y = a; rotor.add(bl) } g.add(rotor)
      for (const z of [-0.7, 0.7]) { add(3.0, 0.08, 0.1, '#1c1b22', 0, 0.35, z); add(0.08, 0.7, 0.08, '#1c1b22', -0.8, 0.7, z); add(0.08, 0.7, 0.08, '#1c1b22', 0.8, 0.7, z) }
      const l = this.label('HELI', 1.4); l.position.set(0, 3.4, 0); g.add(l)
    } else if (kind === 'ferry') {
      add(6.4, 0.9, 2.3, '#fbf8f0', 0, 0.55, 0); add(6.42, 0.3, 2.32, '#2b6ad0', 0, 0.2, 0); add(3.2, 1.0, 1.8, '#fbf8f0', -0.4, 1.5, 0); add(3.0, 0.4, 1.84, '#9ecbe6', -0.4, 1.6, 0); add(0.5, 0.9, 0.5, '#e07a1f', -1.4, 2.4, 0); add(0.52, 0.2, 0.52, '#1c1b22', -1.4, 2.9, 0)
      const l = this.label('FERRY', 1.5); l.position.set(0, 3.5, 0); g.add(l)
    } else if (train) { // three carriages behind the engine, which is at the origin
      for (const [i, c] of ['#2f5a3a', '#e07a1f', '#e07a1f'].entries()) { const x = -i * 5; add(4.8, 1.7, 1.9, c, x, 1.25, 0); add(4.82, 0.2, 1.92, '#1c1b22', x, 0.55, 0); add(4.4, 0.55, 1.94, '#9ecbe6', x, 1.65, 0); add(4.9, 0.12, 2.0, '#fbf8f0', x, 2.15, 0); for (const wx of [-1.6, 1.6]) for (const wz of [-0.8, 0.8]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 10), lam('#1c1b22')); w.rotation.x = Math.PI / 2; w.position.set(x + wx, 0.3, wz); g.add(w) } }
      add(0.2, 0.5, 1.5, '#fbf8f0', 2.4, 1.2, 0)
      const l = this.label('TRAIN', 1.5); l.position.set(0, 2.9, 0); g.add(l)
    } else {
      add(4.6, 1.5, 1.8, '#f5b91c', 0, 1.15, 0); add(4.62, 0.25, 1.82, '#1c1b22', 0, 0.7, 0); add(4.4, 0.55, 1.84, '#9ecbe6', 0, 1.55, 0); add(0.12, 0.55, 1.5, '#9ecbe6', 2.3, 1.5, 0)
      for (const x of [-1.5, 1.5]) for (const z of [-0.9, 0.9]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.2, 10), lam('#1c1b22')); w.rotation.x = Math.PI / 2; w.position.set(x, 0.36, z); g.add(w) }
      const l = this.label('BUS', 1.4); l.position.set(0, 2.5, 0); g.add(l)
    }
    g.visible = false; this.scene.add(g); this.bus = g
  }

  private label(text: string, w = 2.2): THREE.Sprite {
    const c = document.createElement('canvas'); c.width = 256; c.height = 96
    const g = c.getContext('2d')!; g.fillStyle = '#1c1b22'; g.fillRect(4, 8, 248, 80); g.fillStyle = '#f5b91c'; g.fillRect(10, 14, 236, 68); g.fillStyle = '#1c1b22'
    g.font = '800 34px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text.toUpperCase().slice(0, 14), 128, 50)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); sp.scale.set(w, w * 0.375, 1); return sp
  }

  /** a data-driven scene (street, market, plaza, stall, office, flat, hall): ground, floor patches, low fence */
  private buildSceneShell() {
    const T = this.level.theme!, b = this.level.bounds
    this.box(70, 0.1, 50, T.ground2 ?? T.ground, 0, -0.25, 0)
    this.box(b.x1 - b.x0 + 4, 0.1, b.z1 - b.z0 + 3, T.ground, 0, -0.1, 0)
    for (const f of T.floors) this.box(f.x1 - f.x0, 0.1, f.z1 - f.z0, f.color, (f.x0 + f.x1) / 2, -0.05, (f.z0 + f.z1) / 2)
    if (T.fence) { const fc = '#f3e7cf'; this.box(b.x1 - b.x0 + 1, 0.8, 0.2, fc, 0, 0.4, b.z0 - 0.1); this.box(b.x1 - b.x0 + 1, 0.8, 0.2, fc, 0, 0.4, b.z1 + 0.1); this.box(0.2, 0.8, b.z1 - b.z0, fc, b.x0 - 0.1, 0.4, 0); this.box(0.2, 0.8, b.z1 - b.z0, fc, b.x1 + 0.1, 0.4, 0) }
  }

  /** the street a bus ride starts on, west of the fenced pitch */
  private buildPitchStreet() {
    const set = SETS[Object.values(this.level.rides ?? {})[0]?.vehicle ?? 'bus'], f = set.floor
    this.box(-12.6 - f.x0, 0.1, f.z1 - f.z0, f.color, (f.x0 - 12.6) / 2, -0.03, (f.z0 + f.z1) / 2)
    this.buildDeco(set.deco.map((d) => d.kind === 'road' || d.kind === 'rail' || d.kind === 'water' ? { ...d, x: -23.7, w: 21.4 } : d.kind === 'wall' ? { ...d, x: -23.5, w: 21 } : d))
  }

  private buildSceneDeco() { this.buildDeco(this.level.theme!.deco) }

  private buildDeco(list: Deco[]) {
    for (const d of list) {
      const w = d.w ?? 2, dd = d.d ?? 2, h = d.h ?? 1, col = d.color ?? '#a87a50'
      switch (d.kind) {
        case 'awning': { const roof = this.box(w, 0.1, dd, col, d.x, 2.6, d.z); const rm = roof.material as THREE.MeshStandardMaterial; rm.transparent = true; rm.opacity = 0.28; rm.depthWrite = false; for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.box(0.1, 2.6, 0.1, '#1c1b22', d.x + sx * (w / 2 - 0.1), 1.3, d.z + sz * (dd / 2 - 0.1)); break }
        case 'stall': { this.box(w, 0.9, dd, '#a87a50', d.x, 0.45, d.z); this.box(w + 0.3, 0.15, dd + 0.5, col, d.x, 2.6, d.z); for (const sx of [-1, 1]) this.box(0.1, 2.6, 0.1, '#1c1b22', d.x + sx * (w / 2), 1.3, d.z - dd / 2); if (d.label) { const l = this.label(d.label, 2.0); l.position.set(d.x, 3.2, d.z); this.scene.add(l) } break }
        case 'tree': { const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 2, 8), lam('#6b3a1e')); tr.position.set(d.x, 1, d.z); this.scene.add(tr); const cr = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 8), lam(col === '#a87a50' ? '#2f5a3a' : col)); cr.position.set(d.x, 2.8, d.z); this.scene.add(cr); break }
        case 'lamp': { this.box(0.14, 4, 0.14, '#44444e', d.x, 2, d.z); this.box(0.7, 0.14, 0.3, '#ffe9a6', d.x, 4, d.z); break }
        case 'sign': { this.box(0.12, 2.2, 0.12, '#555566', d.x, 1.1, d.z); const l = this.label(d.label ?? '', w); l.position.set(d.x, 2.6, d.z); this.scene.add(l); break }
        case 'wall': this.box(w, h, dd, col, d.x, h / 2, d.z); break
        case 'window': this.box(w, h, 0.1, '#9ecbe6', d.x, 1.7, d.z); break
        case 'road': { this.box(w, 0.04, dd, col === '#a87a50' ? '#3d3d46' : col, d.x, 0.0, d.z); for (let x = d.x - w / 2 + 1; x < d.x + w / 2 - 1; x += 3) this.box(1.4, 0.02, 0.14, '#f4f1e6', x, 0.04, d.z); break }
        case 'rug': this.box(w, 0.03, dd, col, d.x, 0.02, d.z); break
        case 'crate': this.box(w, h, dd, col, d.x, h / 2, d.z); break
        case 'water': { const wt = this.box(w, 0.05, dd, '#4a90c2', d.x, -0.02, d.z); const wm = wt.material as THREE.MeshLambertMaterial; wm.transparent = true; wm.opacity = 0.85; for (let x = d.x - w / 2 + 1; x < d.x + w / 2 - 1; x += 2.6) this.box(1.1, 0.02, 0.07, '#d9f0fb', x, 0.03, d.z + ((x * 7) % 1.2) - 0.6); break }
        case 'pad': { this.box(w, 0.06, w, '#6f6f78', d.x, 0.02, d.z); const rim = new THREE.Mesh(new THREE.RingGeometry(w * 0.4, w * 0.44, 32), new THREE.MeshBasicMaterial({ color: '#f5b91c', side: THREE.DoubleSide })); rim.rotation.x = -Math.PI / 2; rim.position.set(d.x, 0.07, d.z); this.scene.add(rim); for (const dx of [-0.4, 0.4]) this.box(0.2, 0.02, 1.4, '#f5b91c', d.x + dx, 0.07, d.z); this.box(0.8, 0.02, 0.2, '#f5b91c', d.x, 0.07, d.z); break }
        case 'rail': { this.box(w, 0.06, dd, '#6f6a60', d.x, 0.0, d.z); for (const dz of [-0.55, 0.55]) this.box(w, 0.1, 0.1, '#b9bdc2', d.x, 0.1, d.z + dz); for (let x = d.x - w / 2 + 0.5; x < d.x + w / 2; x += 1.1) this.box(0.28, 0.06, dd, '#5b4636', x, 0.04, d.z); break }
        case 'chair': { this.box(0.7, 0.1, 0.7, col, d.x, 0.5, d.z); this.box(0.7, 0.8, 0.1, col, d.x, 0.95, d.z - 0.3); for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.box(0.08, 0.5, 0.08, '#44444e', d.x + sx * 0.3, 0.25, d.z + sz * 0.3); break }
      }
    }
  }

  private itemY(it: Item) { if (it.y !== undefined) return it.y; return it.shape === 'bag' ? 1.05 : it.id === 'wallet' ? 1.0 : it.id === 'keys' ? 1.5 : it.task === 2 ? 0.95 : 1 }

  private itemMesh(it: Item): THREE.Object3D {
    const g = new THREE.Group()
    const add = (geo: THREE.BufferGeometry, c: string, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, lam(c)); m.position.set(x, y, z); g.add(m); return m }
    switch (it.shape) {
      case 'bag': add(new THREE.BoxGeometry(0.7, 0.55, 0.3), it.color); add(new THREE.BoxGeometry(0.5, 0.2, 0.32), '#f5b91c', 0, -0.05, 0); break
      case 'wallet': add(new THREE.BoxGeometry(0.4, 0.07, 0.28), it.color); break
      case 'keys': add(new THREE.TorusGeometry(0.1, 0.03, 6, 12), '#cfcfcf'); add(new THREE.BoxGeometry(0.04, 0.2, 0.03), '#cfcfcf', 0.12, -0.12, 0); add(new THREE.BoxGeometry(0.16, 0.1, 0.04), it.color, -0.05, -0.2, 0); break
      case 'umbrella': add(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6), it.color, 0, 0, 0).rotation.z = 1.4; add(new THREE.ConeGeometry(0.2, 0.3, 8), it.color, -0.45, 0, 0).rotation.z = 1.57; break
      case 'snack': add(new THREE.BoxGeometry(0.3, 0.35, 0.1), it.color); add(new THREE.BoxGeometry(0.22, 0.12, 0.12), '#f5b91c', 0, 0.05, 0); break
      case 'bank': add(new THREE.BoxGeometry(0.4, 0.12, 0.24), it.color); add(new THREE.BoxGeometry(0.08, 0.05, 0.26), '#55f09b', 0.12, 0.08, 0); break
      case 'boots': for (const dz of [-0.14, 0.14]) { add(new THREE.BoxGeometry(0.2, 0.14, 0.5), it.color, 0, 0, dz); add(new THREE.BoxGeometry(0.2, 0.06, 0.1), '#fbf8f0', 0, -0.08, dz + 0.18) } break
      case 'shinpad': add(new THREE.BoxGeometry(0.22, 0.46, 0.06), it.color); add(new THREE.BoxGeometry(0.16, 0.34, 0.07), '#e07a1f', 0, 0, 0); break
      case 'bib': add(new THREE.BoxGeometry(0.5, 0.55, 0.05), it.color); add(new THREE.BoxGeometry(0.2, 0.2, 0.06), '#1c1b22', 0, 0, 0); break
      case 'bottle': add(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 10), it.color); add(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 10), '#fbf8f0', 0, 0.25, 0); break
      case 'ladder': for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.5, 0.04, 0.07), it.color, 0, 0, -0.4 + i * 0.2); for (const dx of [-0.25, 0.25]) add(new THREE.BoxGeometry(0.05, 0.04, 0.9), '#1c1b22', dx, 0, 0); break
      case 'cones': for (const [x, z] of [[-0.22, -0.2], [0.22, -0.2], [0, 0.22]]) add(new THREE.ConeGeometry(0.12, 0.3, 8), it.color, x, 0.12, z); break
      case 'plate': add(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 14), '#fbf8f0'); add(new THREE.SphereGeometry(0.2, 10, 6), it.color, 0, 0.1, 0); break
      case 'cup': add(new THREE.CylinderGeometry(0.1, 0.08, 0.22, 10), it.color); add(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 10), '#fbf8f0', 0, 0.12, 0); break
      case 'folder': add(new THREE.BoxGeometry(0.5, 0.05, 0.38), it.color); add(new THREE.BoxGeometry(0.4, 0.06, 0.06), '#fbf8f0', 0, 0.02, 0.1); break
      case 'paper': add(new THREE.BoxGeometry(0.4, 0.03, 0.3), '#fbf8f0'); add(new THREE.BoxGeometry(0.3, 0.035, 0.04), it.color, 0, 0.01, 0); break
      case 'stamp': add(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 10), it.color); add(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), '#1c1b22', 0, 0.14, 0); break
      case 'crate': add(new THREE.BoxGeometry(0.55, 0.35, 0.4), '#a87a50'); add(new THREE.BoxGeometry(0.5, 0.06, 0.35), it.color, 0, 0.2, 0); break
      case 'produce': for (const [x, z] of [[-0.14, -0.08], [0.14, -0.08], [0, 0.14]]) add(new THREE.SphereGeometry(0.13, 10, 8), it.color, x, 0.1, z); break
      case 'sign': add(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6), '#555566', 0, 0.2, 0); add(new THREE.BoxGeometry(0.9, 0.4, 0.06), it.color, 0, 0.9, 0); add(new THREE.ConeGeometry(0.2, 0.35, 3), it.color, 0.6, 0.9, 0).rotation.z = -Math.PI / 2; break
      case 'blanket': add(new THREE.BoxGeometry(0.6, 0.12, 0.45), it.color); add(new THREE.BoxGeometry(0.6, 0.02, 0.1), '#fbf8f0', 0, 0.07, 0); break
      case 'cake': add(new THREE.CylinderGeometry(0.3, 0.3, 0.18, 14), '#fbf8f0'); add(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 14), it.color, 0, 0.16, 0); add(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 6), '#f5b91c', 0, 0.3, 0); break
      default: add(new THREE.BoxGeometry(0.3, 0.3, 0.3), it.color)
    }
    return g
  }

  private resize() {
    const p = this.canvas.parentElement ?? this.canvas
    const w = Math.max(2, p.clientWidth), h = Math.max(2, p.clientHeight)
    this.r.setSize(w, h, false); this.cam.aspect = w / h
    // on a tall phone screen pull the camera back so the width of the home still fits
    this.cam.fov = w / h < 0.8 ? 62 : 46
    this.cam.updateProjectionMatrix()
  }

  /** a tap on the scene: walk there (the stick and keys take over again as soon as they are used) */
  moveTo(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect()
    this.ray.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), this.cam)
    const o = this.ray.ray.origin, d = this.ray.ray.direction
    if (d.y >= -0.01) return
    const k = -o.y / d.y
    this.target = { x: Math.max(this.level.bounds.x0, Math.min(this.level.bounds.x1, o.x + d.x * k)), z: Math.max(this.level.bounds.z0, Math.min(this.level.bounds.z1, o.z + d.z * k)) }
  }

  setSpeaker(who: Speaker | null) { this.speaker = who }
  setExpression(who: Speaker, e: Expression) { if (who === 'neighbour' || who === 'helper') return; (who === 'folake' ? this.folake : who === 'tunde' ? this.tunde : this.me).setExpression(e) }
  hazardPos(i: number, t = this.t) { return { x: this.level.hazards[i].x, z: hazardZ(this.level.hazards[i], t) } }

  private frame = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.t += dt
    if (!this.paused) this.update(dt)
    this.r.render(this.scene, this.cam)
    this.raf = requestAnimationFrame(this.frame)
  }

  private update(dt: number) {
    const run = this.runner, L = this.level
    const stumbling = this.stumbleT > 0
    if (stumbling) this.stumbleT -= dt
    let mx = this.input.x, mz = this.input.z
    if (Math.hypot(mx, mz) > 0.12) this.target = null
    else if (this.target && !this.act) {
      const tx = this.target.x - this.px, tz = this.target.z - this.pz, td = Math.hypot(tx, tz)
      if (td < 0.25) this.target = null; else { mx = tx / td; mz = tz / td }
    }
    const m = Math.hypot(mx, mz); if (m > 1) { mx /= m; mz /= m }
    const actState = this.act ? this.stepAct(dt) : null
    if (this.kickAnim) this.stepKick(dt)
    const moving = !stumbling && !this.act && !this.kickAnim && this.busPhase !== 'riding' && m > 0.12 && !(run?.finished)
    if (moving) {
      const sp = 4.6 * dt
      const n = moveWithCollision(L.blockers, this.px, this.pz, mx * sp, mz * sp, L.bounds)
      if (this.target && Math.hypot(n.x - this.px, n.z - this.pz) < sp * 0.15) this.target = null // blocked by furniture: stop
      this.px = n.x; this.pz = n.z
      this.facing = Math.atan2(mx, mz)
      if (!this.moved) { this.moved = true; this.onFirstMove?.() }
    }
    const dr = ((this.facing - this.me.group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI
    this.me.group.rotation.y += dr * Math.min(1, dt * 14)
    this.me.group.position.set(this.px, 0, this.pz)
    if (stumbling) { this.me.body.rotation.x = -1.2 * Math.min(1, (1.1 - this.stumbleT) * 8) * (this.stumbleT > 0.35 ? 1 : this.stumbleT / 0.35); this.me.body.position.y = 0; this.me.armL.rotation.x = this.me.armR.rotation.x = 2.4 }
    else { this.me.body.rotation.x = 0; animateHuman(this.me, this.t, moving || actState === 'walking', 1.15); if (this.act && actState === 'acting') this.actPose(this.act); else if (this.speaker === 'player' && !moving && !this.act) applyPose(this.me, 'talk', this.t, 1, true) }
    for (let i = this.fx.length - 1; i >= 0; i--) { const f = this.fx[i]; f.life -= dt; f.v.y -= 9 * dt; f.m.position.addScaledVector(f.v, dt); f.m.rotation.x += dt * 6; if (f.life <= 0 || f.m.position.y < 0.05) { this.scene.remove(f.m); this.fx.splice(i, 1) } }
    // the others breathe, Folake waves her arms when she is cross
    this.folake.group.position.y = Math.sin(this.t * 2) * 0.02
    applyPose(this.folake, this.speaker === 'folake' ? 'talk' : 'stand', this.t, 1)
    applyPose(this.tunde, this.speaker === 'tunde' ? 'talk' : 'stand', this.t + 1, 1)

    if (run) {
      run.update(dt, this.px, this.pz)
      const idx = run.idx
      for (const it of L.items) {
        const o = this.itemMeshes.get(it.id)!
        const gd = run.serve?.guests.find((x) => x.dish === it.id)
        const here = it.task === idx && !run.finished && !run.collected.includes(it.id) && !(run.task.kind === 'choose' && run.choice) && (!gd || (run.guests[gd.id] < 2 && run.carry !== it.id))
        o.visible = here
        if (here && !(this.act && this.act.id === it.id)) { o.position.y = this.itemY(it) + Math.sin(this.t * 3 + it.x) * 0.06; o.rotation.y = this.t * 1.5 }
      }
      const reach = run.task.kind === 'reach' && !run.finished
      const hz = run.hazards // the choice before the timed task can change how many dummies there are and how fast they slide
      for (let i = 0; i < this.hazardMeshes.length; i++) {
        const g = this.hazardMeshes[i], on = reach && i < hz.length
        g.visible = on
        if (this.strips[i]) { this.strips[i].visible = on; if (on) this.strips[i].position.x = hz[i].x }
        if (on) {
          const z = hazardZ(hz[i], this.t); g.position.set(hz[i].x, 0, z)
          if (!stumbling && Math.hypot(this.px - hz[i].x, this.pz - z) < 0.85) {
            this.stumbleT = 1.1; run.stumble()
            const n = moveWithCollision(L.blockers, this.px, this.pz, -0.7, 0, L.bounds); this.px = n.x; this.pz = n.z
          }
        }
      }
      if (this.ball) { this.ball.visible = reach; if (reach) { this.ball.position.set(this.px + Math.sin(this.facing) * 0.85, 0.24 + Math.abs(Math.sin(this.t * 9)) * 0.06, this.pz + Math.cos(this.facing) * 0.85); this.ball.rotation.x += dt * 10 } }
      // the marker ring: always on a goal area (walk-to and run-to tasks) and on the penalty spot; after 15 s without progress on the area of the next step
      const area = run.task.kind === 'hold' ? L.holds?.[idx] ?? null : run.goalArea
      const nx = run.task.kind === 'serve' ? run.serveNext() : null
      const rideMark = run.task.kind === 'ride' && L.rides?.[idx] && this.busPhase !== 'riding' ? { x: L.rides[idx].stop.x, z: L.rides[idx].stop.z, r: 1.5 } : null
      const kickMark = run.task.kind === 'kick' && L.kick ? { x: L.kick.x, z: L.kick.z, r: 0.9 } : null
      const mark = !run.finished ? (rideMark ?? (nx ? { x: nx.x, z: nx.z, r: 1.2 } : null) ?? ((run.task.kind === 'goto' || run.task.kind === 'reach' || run.task.kind === 'hold' || run.task.kind === 'ride') && area ? area : kickMark)) : null
      this.ring.visible = !!mark || run.guideOn
      if (mark || run.guideOn) {
        const ga = mark ?? L.guideAreas[idx]; let gx = ga.x, gz = ga.z, gr = ga.r
        if (!mark && run.task.kind === 'collect') { const nx = L.items.find((i) => i.task === idx && !run.collected.includes(i.id)); if (nx) { gx = nx.x; gz = nx.z; gr = 1.1 } }
        const k = (this.t * 1.2) % 1; this.ring.position.set(gx, 0.05, gz); this.ring.scale.setScalar(gr * (0.9 + k * 0.15)); (this.ring.material as THREE.MeshBasicMaterial).opacity = 0.75 - k * 0.5
      }
      this.buzz.visible = run.buzzing && idx === 0 && !run.found
      if (this.buzz.visible) { const k = (this.t * 1.6) % 1; this.buzz.scale.setScalar(1 + k * 1.6); (this.buzz.material as THREE.MeshBasicMaterial).opacity = 0.9 - k * 0.9 }
      this.reportNearby(run)
    }
    this.stepGuests(dt)
    this.stepCarry()
    this.stepBus(dt)
    // camera behind and above, a little ahead of where the player is heading
    const tx = this.px, tz = this.pz
    const wide = this.cam.aspect < 0.8
    const off = wide ? { y: 10.5, z: 12.5 } : { y: 7.5, z: 9.5 }
    this.cam.position.x += (tx - this.cam.position.x) * Math.min(1, dt * 4)
    this.cam.position.y = off.y
    this.cam.position.z += (tz + off.z - this.cam.position.z) * Math.min(1, dt * 4)
    this.cam.lookAt(this.cam.position.x, 0.6, this.cam.position.z - off.z * 0.9)
  }

  /** One penalty: the player swings, the ball flies to the left or right of the goal (a goal if the timing was good, wide if not), the keeper dives. `done` runs when it ends. */
  kickBall(success: boolean, needle: number, done: () => void): void {
    const K = this.level.kick; if (!K || this.kickAnim || !this.shotBall) return
    const side = needle < 0.5 ? -1 : 1 // where the needle was decides which side
    this.kickAnim = { t: 0, dur: 1.1, success, side, done }
    this.shotBall.visible = true; this.shotBall.position.set(K.x + 0.9, 0.24, K.z)
    this.facing = Math.atan2(K.goal.x - this.px, K.goal.z - this.pz); this.onFx?.('tap')
  }

  private stepKick(dt: number) {
    const a = this.kickAnim!, K = this.level.kick!, ball = this.shotBall!
    a.t += dt; const u = Math.min(1, a.t / a.dur)
    const from = { x: K.x + 0.9, z: K.z }
    const tz = K.pass ? (a.success ? K.goal.z : K.goal.z + a.side * 3.4) : (a.success ? a.side * 1.1 : a.side * 3.2) // goals go inside the posts, passes land at the teammate, misses go wide
    const tx = K.pass ? K.goal.x : K.goal.x + 0.4
    const e = u < 0.25 ? 0 : (u - 0.25) / 0.75 // a short wind-up, then the ball flies
    ball.position.set(from.x + (tx - from.x) * e, 0.24 + Math.sin(e * Math.PI) * 0.9, from.z + (tz - from.z) * e)
    // leg swing
    this.me.legR.rotation.x = u < 0.25 ? -0.9 * (u / 0.25) : 1.4 * (1 - Math.min(1, (u - 0.25) / 0.2)) - 0.2
    if (this.keeper) this.keeper.position.z += (((a.success ? -a.side * 1.0 : a.side * 0.9) * (u > 0.3 ? 1 : 0)) - this.keeper.position.z) * Math.min(1, dt * 6)
    if (u >= 1) { const cb = a.done; this.kickAnim = null; ball.visible = false; this.me.legR.rotation.x = 0; if (this.keeper) this.keeper.position.z = 0; cb() }
  }

  /** Play the action for what the player is next to; `done` runs when the animation ends (that is when the task rule is applied). */
  perform(n: Nearby, done: () => void): void {
    if (this.act) return
    const go = n.id.startsWith('g:') ? this.guestObjs.get(n.id.slice(2)) : undefined
    const gp = go ? { x: go.parts.group.position.x, z: go.parts.group.position.z } : null
    const src = gp ?? (n.kind === 'spot' ? this.level.spots.find((x) => x.id === n.id) : this.level.items.find((x) => x.id === n.id))
    if (!src) { done(); return }
    const kind: ActKind = n.kind === 'item' || go ? 'take' : n.id === 'laundry' ? 'dig' : 'search'
    const item = n.kind === 'item' ? this.level.items.find((x) => x.id === n.id) : undefined
    const pose: Pose | undefined = go ? (n.label.startsWith('Seat') ? 'point' : n.label.startsWith('Greet') ? 'shakeHands' : 'handOver') : item ? (item.act ?? poseForItem(item.shape, this.itemY(item))) : undefined
    this.act = { pose, kind, x: src.x, z: src.z, id: n.id, label: go ? (n.label.startsWith('Seat') ? 'Showing them to a seat…' : n.label.startsWith('Greet') ? 'Greeting…' : 'Serving the plate…') : actLabel(kind, n.id), t: 0, dur: (pose && POSE_DUR[pose]) || ACT_DUR[kind], walk: 0, done, beat: 0 }
    this.onAction?.(this.act.label, this.act.dur)
  }

  private spawnCloth(x: number, z: number) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.22), lam(this.clothes[Math.floor(Math.random() * this.clothes.length)]))
    m.position.set(x, 0.7, z); this.scene.add(m)
    this.fx.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 3, 3 + Math.random() * 2, (Math.random() - 0.5) * 3), life: 1.1 })
  }

  private stepAct(dt: number): 'walking' | 'acting' {
    const a = this.act!, L = this.level
    const dx = a.x - this.px, dz = a.z - this.pz, d = Math.hypot(dx, dz)
    this.facing = Math.atan2(dx, dz)
    if (a.t === 0 && d > 1.45 && a.walk < 1.0) {
      a.walk += dt
      const sp = 4.2 * dt, n = moveWithCollision(L.blockers, this.px, this.pz, (dx / d) * sp, (dz / d) * sp, L.bounds); this.px = n.x; this.pz = n.z
      return 'walking'
    }
    a.t += dt; a.beat += dt
    if (a.beat > 0.28 && a.kind !== 'take') { a.beat = 0; this.onFx?.('tap') }
    const k = Math.min(1, a.t / a.dur)
    if (a.kind === 'take' && k > 0.35 && !a.phone) { a.phone = true; this.onFx?.('pop') }
    if (a.kind === 'dig') {
      if (Math.random() < dt * 14) this.spawnCloth(a.x + (Math.random() - 0.5) * 1.2, a.z + (Math.random() - 0.5) * 1.0)
      const lm = this.furn.get('laundry'); if (lm) { lm.position.x = a.x + Math.sin(a.t * 38) * 0.05; lm.scale.y = 1 - 0.35 * Math.sin(Math.min(1, k * 1.4) * Math.PI / 2) }
      if (k > 0.72 && !a.phone) { a.phone = true; this.onFx?.('pop') }
      if (a.phone) { this.phoneMesh.visible = true; this.phoneMesh.position.set(this.px + Math.sin(this.facing) * 0.3, 1.65 + Math.sin(a.t * 30) * 0.03, this.pz + Math.cos(this.facing) * 0.3); this.phoneMesh.rotation.z = Math.sin(a.t * 40) * 0.12 }
    } else if (a.kind === 'search') {
      if (a.id === 'pillow' && this.pillow) { this.pillow.position.y = 0.8 + Math.sin(k * Math.PI) * 0.7; this.pillow.rotation.z = Math.sin(k * Math.PI) * 0.7 }
      else { const f = this.furn.get(a.id === 'drawer' ? 'drawers' : 'bedside'); if (f) f.position.x += Math.sin(a.t * 30) * 0.004 }
    } else {
      const o = this.itemMeshes.get(a.id)
      if (o && k > 0.35 && !this.runner?.serve) { const u = Math.min(1, (k - 0.35) / 0.55); o.position.set(a.x + (this.px - a.x) * u, this.itemY(this.level.items.find((i) => i.id === a.id)!) * (1 - u) + 0.9 * u, a.z + (this.pz - a.z) * u); o.scale.setScalar(1 - 0.75 * u) }
    }
    if (a.t >= a.dur) this.finishAct()
    return 'acting'
  }

  private finishAct() {
    const a = this.act!; this.act = null
    this.phoneMesh.visible = false
    const lf = this.level.furniture.find((f) => f.name === 'laundry'); const lm = this.furn.get('laundry'); if (lm && lf) { lm.scale.y = 1; lm.position.x = (lf.rect.x0 + lf.rect.x1) / 2 }
    if (this.pillow) { this.pillow.position.y = 0.8; this.pillow.rotation.z = 0 }
    for (const [name, f] of this.furn) { const fd = this.level.furniture.find((x) => x.name === name); if (fd) f.position.x = (fd.rect.x0 + fd.rect.x1) / 2 }
    const o = this.itemMeshes.get(a.id); if (o) o.scale.setScalar(1)
    this.onAction?.(null, 0)
    a.done()
  }

  /** the pose while acting: leaning over, arms busy */
  private actPose(a: Act) {
    const me = this.me, t = a.t
    const ease = Math.min(1, t / 0.35) // lean in smoothly instead of snapping
    if (a.kind === 'dig') applyPose(me, a.phone ? 'digPhone' : 'dig', t, ease)
    else if (a.kind === 'search') applyPose(me, 'search', t, ease)
    else if (a.pose) { const k = Math.min(1, t / 0.28) * (t > a.dur - 0.22 ? Math.max(0, (a.dur - t) / 0.22) : 1); applyPose(me, a.pose, t, k) }
  }

  private reportNearby(run: TaskRunner) {
    const L = this.level, idx = run.idx
    let best: Nearby | null = null, bd = REACH
    const consider = (o: Spot | Item, kind: Nearby['kind']) => { const d = Math.hypot(o.x - this.px, o.z - this.pz); if (d < bd) { bd = d; best = { kind, id: o.id, label: o.label } } }
    if (!run.finished) {
      if (run.task.kind === 'find' && !run.found) for (const s of L.spots) if (s.task === idx) consider(s, 'spot')
      if (run.task.kind === 'collect' || run.task.kind === 'sequence') for (const it of L.items) if (it.task === idx && !run.collected.includes(it.id)) consider(it, 'item')
      if (run.task.kind === 'choose' && !run.choice) for (const it of L.items) if (it.task === idx) consider(it, 'item')
      if (run.task.kind === 'serve') {
        for (const g of run.serve?.guests ?? []) { const st = run.guests[g.id]; const o = this.guestObjs.get(g.id)!; const at = o.parts.group.position
          if (st === 0) consider({ id: `g:${g.id}`, x: at.x, z: at.z, label: `${run.serve?.verb === 'greet' ? 'Greet' : 'Seat'} ${g.name}` } as unknown as Spot, 'spot')
          else if (st === 1 && run.carry) consider({ id: `g:${g.id}`, x: at.x, z: at.z, label: run.carry === g.dish ? `Serve ${g.name}` : `Give to ${g.name}` } as unknown as Spot, 'spot') }
        if (!run.carry) for (const it of L.items) if (it.task === idx) { const g = run.serve?.guests.find((x) => x.dish === it.id); if (g && run.guests[g.id] === 1) consider(it, 'item') }
      }
      if (run.task.kind === 'ride' && this.busPhase === 'waiting') { const r = L.rides?.[idx]; if (r && Math.hypot(this.px - r.stop.x, this.pz - r.stop.z) < 3.4) best = { kind: 'spot', id: 'bus', label: `Board the ${r.vehicle ?? 'bus'} to ${r.to}` } }
      if (run.task.kind === 'kick' && L.kick && !this.kickAnim && Math.hypot(L.kick.x - this.px, L.kick.z - this.pz) < 1.3) best = { kind: 'spot', id: 'kick', label: L.kick.pass ? 'Pass!' : 'Kick!' }
    }
    if (this.act) best = null
    const key = best ? `${(best as Nearby).kind}:${(best as Nearby).id}` : ''
    if (key !== this.lastNear) { this.lastNear = key; this.onNearby?.(best) }
  }

  /** guests walk to their chair, sit, eat, and keep their seat afterwards; the order label hovers until they are served */
  private stepGuests(dt: number) {
    const run = this.runner; if (!run) return
    for (const o of this.guestObjs.values()) {
      const { g, parts } = o
      const active = run.idx === o.task, after = run.idx > o.task || (run.finished && run.idx === o.task)
      const st = active ? run.guests[g.id] ?? 0 : after ? 3 : o.from !== undefined && run.idx >= o.from && run.idx < o.task ? 0 : -1
      parts.group.visible = st >= 0
      if (st < 0) { o.label.visible = false; o.plate.visible = false; continue }
      const to = st >= 1 ? g.seat : g, p = parts.group.position
      const dx = to.x - p.x, dz = to.z - p.z, d = Math.hypot(dx, dz)
      const walking = d > 0.08
      if (walking) { const sp = Math.min(d, 3.2 * dt); p.x += (dx / d) * sp; p.z += (dz / d) * sp; parts.group.rotation.y = Math.atan2(dx, dz); parts.body.rotation.x = 0; animateHuman(parts, this.t + g.x, true, 0.9) }
      else if (st >= 1) { // seated, facing the table; eating when the plate is down
        parts.group.rotation.y = Math.atan2(g.table.x - p.x, g.table.z - p.z)
        applyPose(parts, st === 2 ? 'sitEat' : 'sit', this.t + g.x, 1)
      } else { animateHuman(parts, this.t, false); applyPose(parts, 'wave', this.t + g.z, 1, true) } // waiting: waves at you
      o.label.visible = st === 1 || st === 0; o.label.position.set(p.x, 2.7, p.z)
      o.plate.visible = st === 2
    }
  }

  /** what you are carrying rides in your hands: both hands for a tray or a box, one hand while you hand it over */
  private stepCarry() {
    const run = this.runner; if (!run) return
    const c = run.carry
    if (this.carryMesh && this.carryMesh.id !== c) { this.scene.remove(this.carryMesh.o); this.carryMesh = undefined }
    if (c && !this.carryMesh) { const it = this.level.items.find((x) => x.id === c); if (it) { const o = this.itemMesh(it); this.scene.add(o); this.carryMesh = { id: c, o, shape: it.shape } } }
    const cm = this.carryMesh; if (!cm) return
    const o = cm.o; o.visible = true; o.scale.setScalar(1); o.rotation.set(0, this.facing, 0)
    if (!this.act) applyPose(this.me, carryPoseFor(cm.shape), this.t, 1, true)
    const hl = this.me.handL, hr = this.me.handR
    if (hl && hr) { const a = new THREE.Vector3(), b = new THREE.Vector3(); hl.getWorldPosition(a); hr.getWorldPosition(b); if (this.act) a.copy(b); o.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 + 0.12, (a.z + b.z) / 2) }
    else o.position.set(this.px + Math.sin(this.facing) * 0.55, 1.15, this.pz + Math.cos(this.facing) * 0.55)
  }

  /** the bus pulls up when you get near the stop, waits, carries you across town and drives off */
  private stepBus(dt: number) {
    const run = this.runner, bus = this.bus; if (!bus || !run) return
    const r = this.level.rides?.[run.idx], on = !!r && run.task.kind === 'ride' && !run.finished
    if (!on) { if (this.busPhase === 'dropped') { this.busX += 11 * dt; bus.position.x = this.busX; this.busT += dt; const rot = bus.getObjectByName('rotor'); if (rot) rot.rotation.y += 0.9; if (this.vehicleKind === 'helicopter') bus.position.y = this.busT * 2.5; if (this.busT > 4) { bus.visible = false; this.busPhase = 'away' } } else { bus.visible = false; this.busPhase = 'away'; this.me.group.visible = true } return }
    const stopX = r.stop.x + 1.4
    if (this.busPhase === 'dropped') { this.busPhase = 'away' }
    bus.visible = true; bus.position.set(this.busX, this.vehicleY(r.stop.x + 1.4, run.goalArea ? run.goalArea.x - 1.2 : this.busX), r.busZ)
    if (this.busPhase === 'away') {
      if (!bus.userData.started) { this.busX = r.stop.x - 34; bus.userData.started = true }
      if (Math.hypot(this.px - r.stop.x, this.pz - r.stop.z) < 9) { this.busPhase = 'arriving'; this.onFx?.('pop') }
    } else if (this.busPhase === 'arriving') {
      const rem = stopX - this.busX; this.busX += Math.min(rem, Math.max(1.2, rem * 1.6) * dt) * (rem > 0 ? 1 : 0)
      if (rem < 0.08) { this.busX = stopX; this.busPhase = 'waiting'; this.onFx?.('pop') }
    } else if (this.busPhase === 'riding') {
      const dest = run.goalArea; const tx = dest ? dest.x - 1.2 : this.busX
      this.busX += Math.min(Math.max(0, tx - this.busX), 9 * dt); this.px = this.busX; this.pz = r.busZ; this.me.group.visible = false
      if (this.busX >= tx - 0.01 && dest) { this.me.group.visible = true; this.px = dest.x; this.pz = dest.z; this.busPhase = 'dropped'; this.busT = 0; bus.userData.started = false; this.onFx?.('pop') }
    }
  }

  /** helicopters descend to land and climb while flying; ferries bob on the water; the rotor never stops */
  private vehicleY(stopX: number, destX: number): number {
    const bus = this.bus!, rotor = bus.getObjectByName('rotor'); if (rotor) rotor.rotation.y += 0.9
    if (this.vehicleKind === 'ferry') return Math.sin(this.t * 2) * 0.05 - 0.15
    if (this.vehicleKind !== 'helicopter') return 0
    if (this.busPhase === 'away') return 7
    if (this.busPhase === 'arriving') return Math.min(7, Math.max(0, (stopX - this.busX) * 0.7))
    if (this.busPhase === 'riding') return Math.max(0, Math.min(3.5, (this.busX - stopX) * 0.9, (destX - this.busX) * 0.9))
    return 0
  }

  /** the Board button: you climb on and the camera rides along */
  boardBus() { if (this.busPhase === 'waiting') { this.busPhase = 'riding'; this.target = null; this.onFx?.('pop') } }

  dispose() {
    cancelAnimationFrame(this.raf); this.ro?.disconnect()
    this.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose() })
    this.r.dispose()
  }
}
