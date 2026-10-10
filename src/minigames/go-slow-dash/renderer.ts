// Three.js renderer for Go-Slow Dash. All geometry is procedural low-poly (no external assets).
import * as THREE from 'three'
import type { Appearance, Gender } from '@engine/core/types'
import { LANE_W, OBSTACLE_RESPONSE, segmentAt, type DashObj, type DashState, type ObstacleKind, type RouteSegment } from './sim'
import { SKIN_TONES } from '../../ui/Avatar'

const THEMES: Record<RouteSegment['theme'], { wall: number[]; roof: number; ground: number }> = {
  market: { wall: [0xd9a05b, 0xc4562a, 0xe8c27a, 0xb5763a, 0xe2a27f], roof: 0x7a3b1d, ground: 0xb8864f },
  flyover: { wall: [0xb7a58a, 0x9a8f7a, 0xc7b79a, 0x8a7d68], roof: 0x5a4a38, ground: 0x8b7a60 },
  brt: { wall: [0xc9d3dd, 0xe6c58a, 0x9fb7c9, 0xd8a7a0, 0xf0d9a8], roof: 0x44505a, ground: 0x88a063 },
  estate: { wall: [0xf0d9a8, 0xe8c9a0, 0xdcae92, 0xc9d9b4, 0xf7e2b8], roof: 0xa8452a, ground: 0x7fa653 },
  bridge: { wall: [0x8aa0b8, 0xa7b9c9, 0x6f8aa5], roof: 0x3a4a5a, ground: 0x4f7aa0 },
}
const UMBRELLAS = [0xf5b91c, 0xc4562a, 0x0f7a4a, 0x2b3a8c, 0xe0457b, 0x2bb3a6]

const mat = (color: number, extra: Partial<THREE.MeshLambertMaterialParameters> = {}) => new THREE.MeshLambertMaterial({ color, ...extra })

export class DashRenderer {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  private root = new THREE.Group()
  private player = new THREE.Group()
  private playerParts: { legL?: THREE.Object3D; legR?: THREE.Object3D; armL?: THREE.Object3D; armR?: THREE.Object3D; body: THREE.Object3D } = { body: new THREE.Group() }
  private shadow: THREE.Mesh
  private lines: THREE.InstancedMesh
  private kerbs: THREE.InstancedMesh
  private coins: THREE.InstancedMesh
  private slots: { group: THREE.Group; slotDist: number; side: -1 | 1 }[] = []
  private pool = new Map<string, THREE.Group[]>()
  private active = new Map<number, { group: THREE.Group; kind: string }>()
  private spinners: THREE.Object3D[] = []
  private labels = new Map<string, THREE.Sprite>()
  private shake = 0
  private quality = 0
  private frameMs = 16
  private slowFor = 0
  private roadMat: THREE.MeshLambertMaterial
  private groundMat: THREE.MeshLambertMaterial
  private mode: 'foot' | 'danfo'
  private tmp = new THREE.Object3D()
  private busHeads: THREE.Mesh[] = []
  private speedStreaks: THREE.InstancedMesh
  private ctxLost = false

  constructor(private container: HTMLElement, opts: { mode: 'foot' | 'danfo'; look: Appearance; gender: Gender; age: number }) {
    this.mode = opts.mode
    const dpr = window.devicePixelRatio || 1
    this.renderer = new THREE.WebGLRenderer({ antialias: dpr <= 1.5, powerPreference: 'high-performance', alpha: false })
    this.renderer.setPixelRatio(Math.min(dpr, 1.5))
    this.renderer.setClearColor(0xffb28a)
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block'
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.ctxLost = true })
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.3, 190)
    this.scene.add(this.root)
    this.scene.fog = new THREE.Fog(0xffb28a, 40, 150)
    this.scene.background = this.makeSky()
    this.scene.add(new THREE.HemisphereLight(0xffe2c4, 0x5a4a6a, 0.95))
    const sun = new THREE.DirectionalLight(0xfff0d0, 1.05); sun.position.set(-6, 14, 8); this.scene.add(sun)

    // road
    this.roadMat = mat(0x3d3d46)
    const road = new THREE.Mesh(new THREE.BoxGeometry(LANE_W * 3 + 0.2, 0.2, 260), this.roadMat); road.position.set(0, -0.1, -100); this.root.add(road)
    this.groundMat = mat(0x9b7b4f)
    const ground = new THREE.Mesh(new THREE.BoxGeometry(80, 0.2, 260), this.groundMat); ground.position.set(0, -0.3, -100); this.root.add(ground)
    for (const s of [-1, 1]) { const walk = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 260), mat(0xd8cfc0)); walk.position.set(s * (LANE_W * 1.5 + 1.5), 0.0, -100); this.root.add(walk) }
    // lane lines + kerbs (instanced, scrolled)
    this.lines = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.02, 3), mat(0xf4f1e6), 2 * 28); this.root.add(this.lines)
    this.kerbs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.34, 2), mat(0xffffff), 2 * 70)
    this.kerbs.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(2 * 70 * 3), 3); this.root.add(this.kerbs)
    // coins
    const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 14); coinGeo.rotateX(Math.PI / 2)
    this.coins = new THREE.InstancedMesh(coinGeo, mat(0xffc928, { emissive: new THREE.Color(0x6a4a00) }), 140)
    this.coins.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(140 * 3), 3); this.coins.frustumCulled = false; this.root.add(this.coins)
    // speed streaks
    this.speedStreaks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.04, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }), 24); this.speedStreaks.frustumCulled = false; this.root.add(this.speedStreaks)
    // buildings / roadside
    for (const side of [-1, 1] as const) for (let i = 0; i < 12; i++) { const g = new THREE.Group(); this.root.add(g); this.slots.push({ group: g, slotDist: i * 16 - 20, side }) }
    for (const s of this.slots) this.dressSlot(s, 0)
    // player + shadow
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 14), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 })); this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.03; this.root.add(this.shadow)
    this.buildPlayer(opts)
    this.root.add(this.player)
    this.resize()
  }

  private makeSky(): THREE.Texture {
    const c = document.createElement('canvas'); c.width = 4; c.height = 256
    const g = c.getContext('2d')!; const gr = g.createLinearGradient(0, 0, 0, 256)
    gr.addColorStop(0, '#6c6fc9'); gr.addColorStop(0.45, '#f29a8f'); gr.addColorStop(0.75, '#ffb878'); gr.addColorStop(1, '#ffd9a0')
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
  }

  // ---------- characters ----------
  private buildPlayer(o: { mode: 'foot' | 'danfo'; look: Appearance; gender: Gender; age: number }) {
    if (o.mode === 'danfo') return this.buildBus(this.player, true)
    const skin = new THREE.Color(SKIN_TONES[o.look.skinTone] ?? SKIN_TONES[4])
    const top = new THREE.Color(o.age < 18 ? '#ffffff' : o.look.topColor); const bot = new THREE.Color(o.age < 18 ? '#1f3a7a' : o.look.bottomColor)
    const hair = new THREE.Color(o.age >= 60 ? '#cccccc' : o.look.hairColor)
    const body = new THREE.Group()
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.5), mat(top.getHex())); torso.position.y = 1.55; body.add(torso)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), mat(skin.getHex())); head.position.y = 2.35; body.add(head)
    const hs = o.look.hairStyle
    if (hs === 'afro') { const h = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), mat(hair.getHex())); h.position.set(0, 2.45, -0.02); body.add(h) }
    else if (hs !== 'bald') { const h = new THREE.Mesh(new THREE.SphereGeometry(0.37, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(hair.getHex())); h.position.y = 2.38; body.add(h)
      if (hs === 'braids' || hs === 'locs') for (const x of [-0.3, 0.3]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), mat(hair.getHex())); b.position.set(x, 2.05, 0.05); body.add(b) }
      if (hs === 'bun') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(hair.getHex())); b.position.set(0, 2.78, 0); body.add(b) }
      if (hs === 'gele') { const w = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.6), mat(new THREE.Color(o.look.topColor).getHex())); w.position.set(0, 2.72, 0); body.add(w) } }
    const mk = (x: number, w: number, c: THREE.Color, y: number, h: number) => { const p = new THREE.Group(); p.position.set(x, y, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat(c.getHex())); m.position.y = -h / 2; p.add(m); body.add(p); return p }
    this.playerParts.legL = mk(-0.2, 0.3, bot, 1.05, 1.0); this.playerParts.legR = mk(0.2, 0.3, bot, 1.05, 1.0)
    this.playerParts.armL = mk(-0.58, 0.22, skin, 1.95, 0.9); this.playerParts.armR = mk(0.58, 0.22, skin, 1.95, 0.9)
    body.rotation.y = Math.PI // face away from camera (running toward -z)
    this.playerParts.body = body
    this.player.add(body)
  }

  private buildBus(g: THREE.Group, withHeads = false) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.9, 5.2), mat(0xffd23f)); body.position.y = 1.55; g.add(body)
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.34, 5.24), mat(0x1c1b22)); stripe.position.y = 1.35; g.add(stripe)
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 1.1), mat(0x9fd1ff)); w.position.set(s * 1.12, 1.95, -1.6 + i * 1.5); g.add(w) }
    const wind = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 0.06), mat(0x9fd1ff)); wind.position.set(0, 1.95, 2.62); g.add(wind)
    const rear = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 0.06), mat(0x9fd1ff)); rear.position.set(0, 1.95, -2.62); g.add(rear)
    for (const x of [-1, 1]) for (const z of [-1.7, 1.7]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 10), mat(0x1c1b22)); w.rotation.z = Math.PI / 2; w.position.set(x * 1.0, 0.5, z); g.add(w) }
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 4.2), mat(0x3a3a44)); rack.position.y = 2.55; g.add(rack)
    const cols = [0x2b3a8c, 0xc4562a, 0x0f7a4a]
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8 + (i % 2) * 0.5), mat(cols[i])); b.position.set((i - 1) * 0.5, 2.9, -1 + i * 1.1); g.add(b) }
    if (withHeads) for (let i = 0; i < 3; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat(0x5c3317)); h.position.set(-0.7 + i * 0.7, 2.0, 1.5); h.visible = false; g.add(h); this.busHeads.push(h) }
    g.rotation.y = 0
    this.playerParts.body = g
  }

  // ---------- obstacles ----------
  private makeObstacle(kind: ObstacleKind): THREE.Group {
    const g = new THREE.Group()
    switch (kind) {
      case 'pothole': { const m = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.05, 0.05, 12), mat(0x1a1a1f)); m.position.y = 0.04; g.add(m); const r = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 4, 12), mat(0x6e6a60)); r.rotation.x = Math.PI / 2; r.position.y = 0.06; g.add(r); break }
      case 'cone': for (const dx of [-0.5, 0.5]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.9, 8), mat(0xff7a1a)); c.position.set(dx, 0.45, 0); g.add(c); const s = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.14, 8), mat(0xffffff)); s.position.set(dx, 0.5, 0); g.add(s) } break
      case 'goat': { const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 1.2), mat(0xf2efe6)); b.position.y = 0.85; g.add(b); const h = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.5), mat(0xf2efe6)); h.position.set(0, 1.25, 0.7); g.add(h)
        for (const dx of [-0.12, 0.12]) { const hn = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.3, 5), mat(0x6a5a40)); hn.position.set(dx, 1.55, 0.7); g.add(hn) }
        for (const [x, z] of [[-0.25, -0.45], [0.25, -0.45], [-0.25, 0.45], [0.25, 0.45]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), mat(0x8a7a60)); l.position.set(x, 0.3, z); g.add(l) } break }
      case 'wheelbarrow': { const t = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 1.4), mat(0xc4562a)); t.position.y = 0.75; g.add(t); const w = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.18, 10), mat(0x1c1b22)); w.rotation.z = Math.PI / 2; w.position.set(0, 0.35, 0.8); g.add(w); const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.2), mat(0x7a4a2a)); l.position.set(0.3, 0.9, -1); g.add(l); break }
      case 'signboard': { for (const x of [-1.05, 1.05]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.9, 0.14), mat(0x555566)); p.position.set(x, 1.45, 0); g.add(p) }
        const b = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.14), mat(0x2b3a8c)); b.position.y = 2.55; g.add(b); const st = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.16, 0.16), mat(0xffd23f)); st.position.y = 2.2; g.add(st); break }
      case 'stalledDanfo': this.buildBus(g); this.playerParts.body = this.player.children[0] ?? this.playerParts.body; g.scale.set(0.95, 0.95, 0.95); break
      case 'okada': { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.6), mat(0xc4262e)); b.position.y = 0.75; g.add(b); for (const z of [-0.7, 0.7]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.14, 10), mat(0x1c1b22)); w.rotation.z = Math.PI / 2; w.position.set(0, 0.4, z); g.add(w) }
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.4), mat(0x2bb3a6)); r.position.set(0, 1.45, 0); g.add(r); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat(0xffd23f)); hd.position.set(0, 2.0, 0); g.add(hd); break }
      case 'barrier': { for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.3), mat(i % 2 ? 0xffffff : 0xd62828)); b.position.set(-0.9 + i * 0.6, 0.9, 0); g.add(b) } for (const x of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), mat(0x555566)); p.position.set(x, 0.55, 0); g.add(p) } break }
    }
    return g
  }

  private makePower(kind: string): THREE.Group {
    const g = new THREE.Group()
    const col = kind === 'magnet' ? 0xe0324a : kind === 'hop' ? 0x2fd27b : 0xff9a1a
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), mat(col, { emissive: new THREE.Color(col).multiplyScalar(0.35) })); orb.position.y = 1.5; g.add(orb)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.06, 6, 16), new THREE.MeshBasicMaterial({ color: 0xffffff })); ring.position.y = 1.5; g.add(ring)
    const label = this.label(kind === 'magnet' ? '🧲' : kind === 'hop' ? '🦘' : '🍢', 1.1); label.position.y = 2.6; g.add(label)
    this.spinners.push(orb)
    return g
  }

  private label(text: string, scale = 3): THREE.Sprite {
    const key = `${text}|${scale}`
    const cached = this.labels.get(key)
    if (cached) return cached.clone()
    const c = document.createElement('canvas'); c.width = 256; c.height = 128
    const g = c.getContext('2d')!; g.font = text.length <= 2 ? '90px serif' : '800 40px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
    if (text.length > 2) { g.fillStyle = '#1c1b22'; g.fillRect(8, 20, 240, 88); g.fillStyle = '#ffd23f'; g.fillRect(14, 26, 228, 76); g.fillStyle = '#1c1b22' } else g.fillStyle = '#fff'
    g.fillText(text, 128, 66)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(scale * 2, scale, 1)
    this.labels.set(key, s)
    return s.clone()
  }

  private makeStop(o: DashObj): THREE.Group {
    const g = new THREE.Group()
    const pad = new THREE.Mesh(new THREE.BoxGeometry(LANE_W * 0.96, 0.04, o.length ?? 40), mat(0xffd23f)); pad.position.set(0, 0.03, -(o.length ?? 40) / 2); g.add(pad)
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 3), mat(0x1c1b22)); m.position.set(0, 0.05, -2 - i * 7); m.rotation.y = 0.5; g.add(m) }
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.15, 3.4, 0.15), mat(0x444455)); pole.position.set(LANE_W * 0.9, 1.7, -1); g.add(pole)
    const sign = this.label('BUS STOP', 2.2); sign.position.set(LANE_W * 0.9, 3.6, -1); g.add(sign)
    for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.8, 3, 6), mat([0x2b3a8c, 0xc4562a, 0x0f7a4a][i])); p.position.set(LANE_W * 1.6 + i * 0.4, 0.8, -3 - i * 0.6); g.add(p) }
    return g
  }

  // ---------- scenery ----------
  private dressSlot(slot: { group: THREE.Group; slotDist: number; side: -1 | 1 }, dist: number) {
    const g = slot.group
    while (g.children.length) { const c = g.children.pop()!; this.disposeObject(c) }
    const seg = segmentAt(Math.max(0, slot.slotDist))
    const th = THEMES[seg.seg.theme]
    const rnd = (a: number, b: number) => a + Math.random() * (b - a)
    const x = slot.side * (LANE_W * 1.5 + 3 + rnd(0, 1.5))
    if (seg.seg.theme === 'bridge') {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.1, 16), mat(0xcfd8df)); rail.position.set(slot.side * (LANE_W * 1.5 + 0.5), 0.7, -8); g.add(rail)
      if (Math.random() < 0.5) { const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.15, 5, 0.15), mat(0x555566)); lamp.position.set(slot.side * (LANE_W * 1.5 + 0.5), 2.7, -8); g.add(lamp) }
      return
    }
    const w = rnd(5, 9), h = rnd(6, 16), d = rnd(9, 14)
    const wallColor = th.wall[Math.floor(Math.random() * th.wall.length)]
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(wallColor)); b.position.set(x + slot.side * w / 2, h / 2, -d / 2 - 1); g.add(b)
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4), mat(th.roof)); roof.position.set(b.position.x, h + 0.25, b.position.z); g.add(roof)
    const rows = Math.floor(h / 3)
    for (let r = 0; r < rows; r++) { const win = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, d * 0.7), mat(Math.random() < 0.3 ? 0xffe9a6 : 0x4c6a8a)); win.position.set(x - slot.side * 0.02, 2 + r * 3, b.position.z); g.add(win) }
    if (Math.random() < 0.35) { const sign = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.4, 4), mat([0x2b3a8c, 0xc4262e, 0x0f7a4a, 0xf5b91c][Math.floor(Math.random() * 4)])); sign.position.set(x - slot.side * 0.15, 3.4, -5); g.add(sign) }
    // street lamp
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 5.4, 0.14), mat(0x44444e)); lamp.position.set(slot.side * (LANE_W * 1.5 + 0.9), 2.7, -8); g.add(lamp)
    const lh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.3), mat(0xffe9a6)); lh.position.set(slot.side * (LANE_W * 1.5 + 0.6), 5.4, -8); g.add(lh)
    if (seg.seg.theme === 'market') for (let i = 0; i < 2; i++) {
      const sx = slot.side * (LANE_W * 1.5 + 1.2 + i * 0.8), sz = -3 - i * 6
      const u = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.7, 8), mat(UMBRELLAS[Math.floor(Math.random() * UMBRELLAS.length)])); u.position.set(sx, 2.3, sz); g.add(u)
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.1, 0.08), mat(0x4a3320)); p.position.set(sx, 1.1, sz); g.add(p)
      const tb = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.8), mat(0x6a3b1d)); tb.position.set(sx, 0.35, sz); g.add(tb)
    }
    if (seg.seg.theme === 'flyover') { const slab = new THREE.Mesh(new THREE.BoxGeometry(LANE_W * 3 + 9, 0.8, 8), mat(0x6b6b74)); slab.position.set(0, 6.6, -5); g.add(slab); for (const sx of [-1, 1]) { const pil = new THREE.Mesh(new THREE.BoxGeometry(0.9, 6.4, 0.9), mat(0x8a8a92)); pil.position.set(sx * (LANE_W * 1.5 + 0.8), 3.2, -5); g.add(pil) } }
    if (Math.random() < 0.5) { const ped = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.8, 3, 6), mat([0x2b3a8c, 0xc4562a, 0x0f7a4a, 0xe0457b][Math.floor(Math.random() * 4)])); ped.position.set(slot.side * (LANE_W * 1.5 + 1.8), 0.9, -2); g.add(ped) }
    g.position.set(0, 0, 0)
    void dist
  }

  private disposeObject(o: THREE.Object3D) {
    o.traverse((c) => { const m = c as THREE.Mesh; if (m.geometry) m.geometry.dispose(); const mt = m.material as THREE.Material | THREE.Material[] | undefined; if (Array.isArray(mt)) mt.forEach((x) => x.dispose()); else mt?.dispose() })
  }

  // ---------- frame ----------
  hit() { this.shake = 0.5 }

  render(st: DashState, dt: number, time: number) {
    if (this.ctxLost) return
    const t0 = performance.now()
    const dist = st.dist
    const seg = segmentAt(dist)
    const th = THEMES[seg.seg.theme]
    this.groundMat.color.lerp(new THREE.Color(th.ground), 0.04)
    // player
    this.player.position.set(st.x * LANE_W, st.y, 0)
    const p = this.playerParts
    if (this.mode === 'foot') {
      const sw = Math.sin(time * (8 + st.speed * 0.5)) * (st.y > 0.05 ? 0.3 : 0.9)
      if (p.legL) p.legL.rotation.x = sw; if (p.legR) p.legR.rotation.x = -sw
      if (p.armL) p.armL.rotation.x = -sw * 0.9; if (p.armR) p.armR.rotation.x = sw * 0.9
      p.body.scale.y = st.slide > 0 ? 0.55 : 1; p.body.position.y = st.slide > 0 ? 0 : Math.abs(Math.sin(time * (8 + st.speed * 0.5))) * 0.08
      p.body.rotation.x = st.slide > 0 ? 0.5 : 0
    } else {
      p.body.position.y = Math.sin(time * 18) * 0.025 + (st.y > 0.05 ? 0 : 0)
      p.body.rotation.z = (st.lane - st.x) * 0.06
      this.busHeads.forEach((h, i) => { h.visible = i < st.aboard })
    }
    this.player.visible = st.invuln <= 0 || Math.floor(time * 14) % 2 === 0 || st.powers.suya > 0
    this.shadow.position.set(st.x * LANE_W, 0.04, 0); this.shadow.scale.setScalar(this.mode === 'danfo' ? 2 : 1 - Math.min(0.5, st.y * 0.15))
    // camera
    this.shake = Math.max(0, this.shake - dt * 2)
    const sx = (Math.random() - 0.5) * this.shake, sy = (Math.random() - 0.5) * this.shake
    const camBack = this.mode === 'danfo' ? 12.5 : 8.4, camUp = this.mode === 'danfo' ? 6.4 : 4.2
    this.camera.position.set(st.x * LANE_W * 0.45 + sx, camUp + st.y * 0.3 + sy, camBack)
    this.camera.lookAt(st.x * LANE_W * 0.25, 1.1, -11)
    this.camera.fov = 60 + Math.min(10, (st.speed - 13) * 0.6) + (st.powers.suya > 0 ? 6 : 0); this.camera.updateProjectionMatrix()
    // lane lines & kerbs
    let li = 0
    const off = dist % 8
    for (const lx of [-LANE_W / 2, LANE_W / 2]) for (let k = 0; k < 28; k++) { this.tmp.position.set(lx, 0.02, -(k * 8) + off + 6); this.tmp.rotation.set(0, 0, 0); this.tmp.scale.set(1, 1, 1); this.tmp.updateMatrix(); this.lines.setMatrixAt(li++, this.tmp.matrix) }
    this.lines.instanceMatrix.needsUpdate = true
    let ki = 0
    const koff = dist % 4
    for (const s of [-1, 1]) for (let k = 0; k < 70; k++) { this.tmp.position.set(s * (LANE_W * 1.5 + 0.1), 0.05, -(k * 4) + koff + 4); this.tmp.updateMatrix(); this.kerbs.setMatrixAt(ki, this.tmp.matrix); const idx = (Math.floor((dist - koff) / 4) + k) % 2; this.kerbs.setColorAt(ki, new THREE.Color(idx ? 0x1c1b22 : 0xffffff)); ki++ }
    this.kerbs.instanceMatrix.needsUpdate = true; if (this.kerbs.instanceColor) this.kerbs.instanceColor.needsUpdate = true
    // BRT hint: tint left kerb zone via road material by theme
    this.roadMat.color.setHex(seg.seg.theme === 'bridge' ? 0x4a4f58 : 0x3d3d46)
    // scenery slots
    for (const s of this.slots) {
      if (s.slotDist < dist - 24) { s.slotDist += 12 * 16; this.dressSlot(s, dist) }
      s.group.position.z = -(s.slotDist - dist)
    }
    // objects
    const used = new Set<number>()
    let ci = 0
    for (const o of st.objs) {
      const rel = o.dist - dist
      if (rel < -8 || rel > 140 || o.taken) { continue }
      if (o.type === 'coin') {
        if (ci >= 140) continue
        this.tmp.position.set(o.lane * LANE_W, (o.y ?? 0.9) + Math.sin(time * 3 + o.id) * 0.08, -rel); this.tmp.rotation.set(0, time * 3 + o.id, 0); this.tmp.updateMatrix()
        this.coins.setMatrixAt(ci, this.tmp.matrix); this.coins.setColorAt(ci, new THREE.Color(o.kind === 'gold' ? 0xfff07a : 0xffc928)); ci++
        continue
      }
      used.add(o.id)
      let a = this.active.get(o.id)
      if (!a) {
        const key = o.type === 'obstacle' ? o.kind : o.type === 'power' ? `power:${o.kind}` : 'stop'
        const free = this.pool.get(key)?.pop()
        const group = free ?? (o.type === 'obstacle' ? this.makeObstacle(o.kind as ObstacleKind) : o.type === 'power' ? this.makePower(o.kind) : this.makeStop(o))
        this.root.add(group); a = { group, kind: key }; this.active.set(o.id, a)
      }
      a.group.position.set(o.type === 'stop' ? 0 : o.lane * LANE_W, 0, -rel)
      if (o.type === 'stop') a.group.position.x = o.lane * LANE_W
      if (o.type === 'power') a.group.rotation.y = time * 2
      if (o.type === 'obstacle' && o.passed && OBSTACLE_RESPONSE[o.kind as ObstacleKind] !== 'dodge') a.group.position.y = 0
    }
    this.coins.count = ci; this.coins.instanceMatrix.needsUpdate = true; if (this.coins.instanceColor) this.coins.instanceColor.needsUpdate = true
    for (const [id, a] of this.active) if (!used.has(id)) { this.root.remove(a.group); const arr = this.pool.get(a.kind) ?? []; arr.push(a.group); this.pool.set(a.kind, arr); this.active.delete(id) }
    for (const sp of this.spinners) sp.rotation.y = time * 2
    // speed streaks
    const sv = Math.max(0, (st.speed - 16) / 12)
    for (let i = 0; i < 24; i++) { const side = i % 2 ? 1 : -1; const z = -((i * 9 + dist * 2.2) % 70); this.tmp.position.set(side * (4 + (i * 7) % 9), 0.4 + (i * 5) % 6, z); this.tmp.scale.set(1, 1, 0.3 + sv * 1.6); this.tmp.updateMatrix(); this.speedStreaks.setMatrixAt(i, this.tmp.matrix) }
    this.speedStreaks.instanceMatrix.needsUpdate = true; this.speedStreaks.visible = sv > 0.1
    this.tmp.scale.set(1, 1, 1)
    this.renderer.render(this.scene, this.camera)
    // quality governor
    const ms = performance.now() - t0
    this.frameMs = this.frameMs * 0.92 + Math.max(ms, dt * 1000 * 0.5) * 0.08
    this.slowFor = this.frameMs > 24 ? this.slowFor + dt : Math.max(0, this.slowFor - dt)
    if (this.slowFor > 2 && this.quality < 2) { this.quality++; this.slowFor = 0; this.renderer.setPixelRatio(this.quality === 1 ? 1 : 0.75); this.resize(); if (this.quality === 2) this.scene.fog = null }
  }

  resize() {
    const w = this.container.clientWidth || 360, h = this.container.clientHeight || 640
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix()
  }

  dispose() {
    for (const s of this.slots) this.disposeObject(s.group)
    for (const a of this.active.values()) this.disposeObject(a.group)
    for (const arr of this.pool.values()) arr.forEach((g) => this.disposeObject(g))
    this.disposeObject(this.root)
    this.labels.forEach((l) => { (l.material as THREE.SpriteMaterial).map?.dispose(); l.material.dispose() })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
