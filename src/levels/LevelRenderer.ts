// The 3D scene of a level: a cut-away home (low walls so the camera can see in), the chosen character, a follow camera, items, search spots and the
// hazards of the last task. It owns no rules: TaskRunner decides what happens, this draws it and reports what the player is standing next to.
import * as THREE from 'three'
import { buildToon, type Expression, type ToonParts, type ToonSpec } from '../world/toon'
import { animateHuman } from '../world/characters'
import { MAMA_FOLAKE, BABA_TUNDE } from '../world/castData'
import { moveWithCollision } from '../world/nav'
import type { LevelDef, Item, Spot } from './schema'
import type { TaskRunner } from './TaskRunner'

const lam = (c: string | number) => new THREE.MeshLambertMaterial({ color: c })
export const REACH = 2.3

/** an action being played: the player walks up, then bends, digs or reaches, then the rule fires */
type ActKind = 'dig' | 'search' | 'take'
interface Act { kind: ActKind; x: number; z: number; id: string; label: string; t: number; dur: number; walk: number; done: () => void; beat: number; phone?: boolean }
const ACT_DUR: Record<ActKind, number> = { dig: 2.4, search: 1.3, take: 1.0 }
export const actLabel = (kind: ActKind, id: string) => kind === 'dig' ? 'Digging through the laundry…' : kind === 'search' ? (id === 'pillow' ? 'Lifting the pillow…' : id === 'drawer' ? 'Opening the drawer…' : 'Checking…') : 'Picking it up…'

export interface Nearby { kind: 'spot' | 'item'; id: string; label: string }

/** sliding clutter in the last task: position along z over time */
const HAZARDS = [
  { x: 2.6, z0: -3.4, z1: 3.2, speed: 2.4, phase: 0, name: 'slippers', color: '#e07a1f' },
  { x: 6.8, z0: -3.2, z1: 1.2, speed: 2.9, phase: 1.7, name: 'mop', color: '#8aa58a' },
]
export const hazardZ = (h: typeof HAZARDS[number], t: number) => { const span = h.z1 - h.z0; const u = ((t * h.speed / span + h.phase) % 2 + 2) % 2; return h.z0 + span * (u < 1 ? u : 2 - u) }

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
  private pillow!: THREE.Mesh
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
  get busy() { return !!this.act }
  onNearby?: (n: Nearby | null) => void
  private lastNear = ''

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
    this.folake = buildToon(MAMA_FOLAKE); this.folake.group.position.set(7.5, 0, -3.2); this.folake.group.rotation.y = -0.5; this.scene.add(this.folake.group)
    this.tunde = buildToon(BABA_TUNDE); this.tunde.group.position.set(10.2, 0, 0.4); this.tunde.group.rotation.y = -Math.PI / 2; this.scene.add(this.tunde.group)

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
    for (const f of L.furniture) {
      const r = f.rect
      this.furn.set(f.name, this.box(r.x1 - r.x0, f.h, r.z1 - r.z0, f.color, (r.x0 + r.x1) / 2, f.h / 2, (r.z0 + r.z1) / 2))
    }
    // pillow, rug, window, plant, clock: a little life
    this.pillow = this.box(1.2, 0.18, 0.8, '#fbf8f0', -7.6, 0.8, -3)
    this.box(3, 0.03, 2.2, '#2f5a3a', -3.2, 0.01, 0.3)
    this.box(1.6, 0.9, 0.12, '#9ecbe6', -3, 1.6, -5.05)
    this.box(1.6, 0.9, 0.12, '#9ecbe6', 2, 1.6, -5.05)
    this.box(0.5, 0.9, 0.5, '#6b3a1e', 8.4, 0.45, 4.2); this.box(0.8, 0.7, 0.8, '#2f5a3a', 8.4, 1.2, 4.2)
    // spots keep an invisible anchor so the scene can wobble them when the player gets close
    for (const s of L.spots) { const g = new THREE.Group(); g.position.set(s.x, 0, s.z); this.scene.add(g); this.spotMeshes.set(s.id, g) }
    for (const it of L.items) { const o = this.itemMesh(it); o.position.set(it.x, this.itemY(it), it.z); this.scene.add(o); this.itemMeshes.set(it.id, o) }
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40), new THREE.MeshBasicMaterial({ color: '#f5b91c', transparent: true, opacity: 0.7, side: THREE.DoubleSide }))
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 0.05; this.ring.visible = false; this.scene.add(this.ring)
    for (const h of HAZARDS) { // faint path of each sliding hazard, so the last task is fair on the first try
      const st = new THREE.Mesh(new THREE.PlaneGeometry(0.9, h.z1 - h.z0), new THREE.MeshBasicMaterial({ color: '#e07a1f', transparent: true, opacity: 0.22 }))
      st.rotation.x = -Math.PI / 2; st.position.set(h.x, 0.03, (h.z0 + h.z1) / 2); st.visible = false; this.scene.add(st); this.strips.push(st)
    }
    this.phoneMesh = new THREE.Group()
    const scr = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.045), new THREE.MeshBasicMaterial({ color: '#9ecbe6' })); scr.position.z = 0.005
    this.phoneMesh.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.38, 0.04), lam('#1c1b22')), scr)
    this.phoneMesh.visible = false; this.scene.add(this.phoneMesh)
    for (const h of HAZARDS) {
      const g = new THREE.Group()
      if (h.name === 'mop') { const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), lam('#a87a50')); stick.rotation.z = 1.2; stick.position.y = 0.5; g.add(stick); const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.35), lam(h.color)); head.position.set(-0.7, 0.1, 0); g.add(head) }
      else { for (const dz of [-0.28, 0.28]) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.28), lam(h.color)); s.position.set(0, 0.07, dz); g.add(s) } }
      g.visible = false; this.scene.add(g); this.hazardMeshes.push(g)
    }
  }

  private itemY(it: Item) { return it.shape === 'bag' ? 1.05 : it.id === 'wallet' ? 1.0 : it.id === 'keys' ? 1.5 : it.task === 2 ? 0.95 : 1 }

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

  setExpression(who: 'folake' | 'tunde' | 'player', e: Expression) { (who === 'folake' ? this.folake : who === 'tunde' ? this.tunde : this.me).setExpression(e) }
  hazardPos(i: number, t = this.t) { return { x: HAZARDS[i].x, z: hazardZ(HAZARDS[i], t) } }

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
    const moving = !stumbling && !this.act && m > 0.12 && !(run?.finished)
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
    if (stumbling) { this.me.body.rotation.x = -1.2 * Math.min(1, (1.1 - this.stumbleT) * 8) * (this.stumbleT > 0.35 ? 1 : this.stumbleT / 0.35); this.me.body.position.y = 0; this.me.armL.rotation.x = this.me.armR.rotation.x = -2.4 }
    else { this.me.body.rotation.x = 0; animateHuman(this.me, this.t, moving || actState === 'walking', 1.15); if (this.act && actState === 'acting') this.actPose(this.act) }
    for (let i = this.fx.length - 1; i >= 0; i--) { const f = this.fx[i]; f.life -= dt; f.v.y -= 9 * dt; f.m.position.addScaledVector(f.v, dt); f.m.rotation.x += dt * 6; if (f.life <= 0 || f.m.position.y < 0.05) { this.scene.remove(f.m); this.fx.splice(i, 1) } }
    // the others breathe, Folake waves her arms when she is cross
    this.folake.group.position.y = Math.sin(this.t * 2) * 0.02
    this.tunde.armR.rotation.x = Math.sin(this.t * 3) * 0.12

    if (run) {
      run.update(dt, this.px, this.pz)
      const idx = run.idx
      for (const it of L.items) {
        const o = this.itemMeshes.get(it.id)!
        const here = it.task === idx && !run.finished && !run.collected.includes(it.id) && !(it.task === 2 && run.choice)
        o.visible = here
        if (here && !(this.act && this.act.id === it.id)) { o.position.y = this.itemY(it) + Math.sin(this.t * 3 + it.x) * 0.06; o.rotation.y = this.t * 1.5 }
      }
      const reach = run.task.kind === 'reach' && !run.finished
      for (let i = 0; i < HAZARDS.length; i++) {
        const g = this.hazardMeshes[i]; g.visible = reach
        if (reach) {
          const z = hazardZ(HAZARDS[i], this.t); g.position.set(HAZARDS[i].x, 0, z)
          if (!stumbling && Math.hypot(this.px - HAZARDS[i].x, this.pz - z) < 0.85) {
            this.stumbleT = 1.1; run.stumble()
            const n = moveWithCollision(L.blockers, this.px, this.pz, -0.7, 0, L.bounds); this.px = n.x; this.pz = n.z
          }
        }
      }
      for (const st of this.strips) st.visible = reach
      // soft guide ring on the area of the next step after 15 s without progress
      this.ring.visible = run.guideOn
      if (run.guideOn) {
        const ga = L.guideAreas[idx]; let gx = ga.x, gz = ga.z, gr = ga.r
        if (run.task.kind === 'collect') { const nx = L.items.find((i) => i.task === idx && !run.collected.includes(i.id)); if (nx) { gx = nx.x; gz = nx.z; gr = 1.1 } }
        const k = (this.t * 1.2) % 1; this.ring.position.set(gx, 0.05, gz); this.ring.scale.setScalar(gr * (0.9 + k * 0.15)); (this.ring.material as THREE.MeshBasicMaterial).opacity = 0.75 - k * 0.5
      }
      this.buzz.visible = run.buzzing && idx === 0 && !run.found
      if (this.buzz.visible) { const k = (this.t * 1.6) % 1; this.buzz.scale.setScalar(1 + k * 1.6); (this.buzz.material as THREE.MeshBasicMaterial).opacity = 0.9 - k * 0.9 }
      this.reportNearby(run)
    }
    // camera behind and above, a little ahead of where the player is heading
    const tx = this.px, tz = this.pz
    const wide = this.cam.aspect < 0.8
    const off = wide ? { y: 10.5, z: 12.5 } : { y: 7.5, z: 9.5 }
    this.cam.position.x += (tx - this.cam.position.x) * Math.min(1, dt * 4)
    this.cam.position.y = off.y
    this.cam.position.z += (tz + off.z - this.cam.position.z) * Math.min(1, dt * 4)
    this.cam.lookAt(this.cam.position.x, 0.6, this.cam.position.z - off.z * 0.9)
  }

  /** Play the action for what the player is next to; `done` runs when the animation ends (that is when the task rule is applied). */
  perform(n: Nearby, done: () => void): void {
    if (this.act) return
    const src = n.kind === 'spot' ? this.level.spots.find((x) => x.id === n.id) : this.level.items.find((x) => x.id === n.id)
    if (!src) { done(); return }
    const kind: ActKind = n.kind === 'item' ? 'take' : n.id === 'laundry' ? 'dig' : 'search'
    this.act = { kind, x: src.x, z: src.z, id: n.id, label: actLabel(kind, n.id), t: 0, dur: ACT_DUR[kind], walk: 0, done, beat: 0 }
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
      if (a.id === 'pillow') { this.pillow.position.y = 0.8 + Math.sin(k * Math.PI) * 0.7; this.pillow.rotation.z = Math.sin(k * Math.PI) * 0.7 }
      else { const f = this.furn.get(a.id === 'drawer' ? 'drawers' : 'bedside'); if (f) f.position.x += Math.sin(a.t * 30) * 0.004 }
    } else {
      const o = this.itemMeshes.get(a.id)
      if (o && k > 0.35) { const u = Math.min(1, (k - 0.35) / 0.55); o.position.set(a.x + (this.px - a.x) * u, this.itemY(this.level.items.find((i) => i.id === a.id)!) * (1 - u) + 0.9 * u, a.z + (this.pz - a.z) * u); o.scale.setScalar(1 - 0.75 * u) }
    }
    if (a.t >= a.dur) this.finishAct()
    return 'acting'
  }

  private finishAct() {
    const a = this.act!; this.act = null
    this.phoneMesh.visible = false
    const lm = this.furn.get('laundry'); if (lm) { lm.scale.y = 1; lm.position.x = (this.level.furniture.find((f) => f.name === 'laundry')!.rect.x0 + this.level.furniture.find((f) => f.name === 'laundry')!.rect.x1) / 2 }
    this.pillow.position.y = 0.8; this.pillow.rotation.z = 0
    for (const [name, f] of this.furn) { const fd = this.level.furniture.find((x) => x.name === name); if (fd) f.position.x = (fd.rect.x0 + fd.rect.x1) / 2 }
    const o = this.itemMeshes.get(a.id); if (o) o.scale.setScalar(1)
    this.onAction?.(null, 0)
    a.done()
  }

  /** the pose while acting: leaning over, arms busy */
  private actPose(a: Act) {
    const me = this.me, t = a.t
    const ease = Math.min(1, t / 0.35) // lean in smoothly instead of snapping
    if (a.kind === 'dig') { me.body.rotation.x = 0.85 * ease; me.armL.rotation.x = (-1.6 + Math.sin(t * 22) * 0.7) * ease; me.armR.rotation.x = (-1.6 - Math.sin(t * 22) * 0.7) * ease; if (a.phone) { me.body.rotation.x = 0.1; me.armR.rotation.x = -2.8; me.armL.rotation.x = 0 } }
    else if (a.kind === 'search') { me.body.rotation.x = 0.6 * ease; me.armL.rotation.x = (-1.3 + Math.sin(t * 18) * 0.4) * ease; me.armR.rotation.x = -1.3 * ease }
    else { const k = Math.min(1, t / a.dur); me.body.rotation.x = 0.7 * Math.sin(Math.min(1, k * 2) * Math.PI / 2) * (k > 0.6 ? 1 - (k - 0.6) / 0.4 * 0.8 : 1); me.armR.rotation.x = -1.9 * (k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4 * 0.7); me.armL.rotation.x = -0.4 }
  }

  private reportNearby(run: TaskRunner) {
    const L = this.level, idx = run.idx
    let best: Nearby | null = null, bd = REACH
    const consider = (o: Spot | Item, kind: Nearby['kind']) => { const d = Math.hypot(o.x - this.px, o.z - this.pz); if (d < bd) { bd = d; best = { kind, id: o.id, label: o.label } } }
    if (!run.finished) {
      if (run.task.kind === 'find' && !run.found) for (const s of L.spots) if (s.task === idx) consider(s, 'spot')
      if (run.task.kind === 'collect') for (const it of L.items) if (it.task === idx && !run.collected.includes(it.id)) consider(it, 'item')
      if (run.task.kind === 'choose' && !run.choice) for (const it of L.items) if (it.task === idx) consider(it, 'item')
    }
    if (this.act) best = null
    const key = best ? `${(best as Nearby).kind}:${(best as Nearby).id}` : ''
    if (key !== this.lastNear) { this.lastNear = key; this.onNearby?.(best) }
  }

  dispose() {
    cancelAnimationFrame(this.raf); this.ro?.disconnect()
    this.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose() })
    this.r.dispose()
  }
}
