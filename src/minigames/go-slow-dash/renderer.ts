// Three.js renderer for Go-Slow Dash. All geometry is procedural low-poly (no external assets).
import * as THREE from 'three'
import type { Appearance, Gender } from '@engine/core/types'
import { BUS_ROOF, LANE_W, OBSTACLE_RESPONSE, segmentAt, type DashObj, type DashState, type ObstacleKind, type RouteSegment } from './sim'
import { buildHuman } from '../../world/characters'
import type { Wear } from '@content/items'

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
  private hemi: THREE.HemisphereLight
  private sun: THREE.DirectionalLight

  private city: 'lagos' | 'abuja' = 'lagos'

  constructor(private container: HTMLElement, opts: { mode: 'foot' | 'danfo'; look: Appearance; gender: Gender; age: number; wear?: Wear[]; city?: 'lagos' | 'abuja' }) {
    this.city = opts.city ?? 'lagos'
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
    this.hemi = new THREE.HemisphereLight(0xffe2c4, 0x5a4a6a, 0.95); this.scene.add(this.hemi)
    this.sun = new THREE.DirectionalLight(0xfff0d0, 1.05); this.sun.position.set(-6, 14, 8); this.scene.add(this.sun)

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
  private buildPlayer(o: { mode: 'foot' | 'danfo'; look: Appearance; gender: Gender; age: number; wear?: Wear[] }) {
    if (o.mode === 'danfo') return this.buildBus(this.player, true)
    const parts = buildHuman({ look: o.look, age: o.age, gender: o.gender, wear: o.wear, uniform: o.age < 18, scale: 1.1 })
    parts.body.rotation.y = Math.PI // face away from camera (running toward -z)
    this.playerParts.legL = parts.legL; this.playerParts.legR = parts.legR; this.playerParts.armL = parts.armL; this.playerParts.armR = parts.armR
    const body = parts.group
    this.playerParts.body = body
    this.player.add(body)
  }

  private buildBus(g: THREE.Group, withHeads = false) {
    const abuja = this.city === 'abuja' // green and white taxi livery instead of the yellow danfo with a black stripe
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.9, 5.2), mat(abuja ? 0x1f9d55 : 0xffd23f)); body.position.y = 1.55; g.add(body)
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.34, 5.24), mat(abuja ? 0xffffff : 0x1c1b22)); stripe.position.y = 1.35; g.add(stripe)
    if (abuja) { const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.5), mat(0xffd23f)); sign.position.set(0, 2.62, 0.4); g.add(sign) }
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
      case 'car': {
        const col = [0xd62828, 0x2b6ad0, 0xf2efe6, 0x2a2a30, 0x1f9d55, 0xf5b91c][Math.floor(Math.random() * 6)]
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.8, 4), mat(col)); body.position.set(0, 0.8, -2); g.add(body)
        const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 2), mat(col)); cab.position.set(0, 1.5, -2.2); g.add(cab)
        for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 1.7), mat(0x9fd1ff)); w.position.set(sx * 0.81, 1.55, -2.2); g.add(w) }
        const ws = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.05), mat(0x9fd1ff)); ws.position.set(0, 1.5, -1.18); g.add(ws)
        for (const x of [-0.9, 0.9]) for (const z of [-0.8, -3.2]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 10), mat(0x1c1b22)); w.rotation.z = Math.PI / 2; w.position.set(x, 0.38, z); g.add(w) }
        const lt = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 0.05), mat(0xff3030)); lt.position.set(0, 0.95, -4.02); g.add(lt)
        break }
      case 'train': {
        const abuja = this.city === 'abuja'
        const body = abuja ? 0xf4f6f4 : 0x2b4fb8, stripe = abuja ? 0x1f9d55 : 0xf4f6f4
        for (let c = 0; c < 3; c++) {
          const z0 = -c * 6.8
          const car = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.9, 6.4), mat(body)); car.position.set(0, 1.95, z0 - 3.2); g.add(car)
          const st = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.4, 6.44), mat(stripe)); st.position.set(0, 1.2, z0 - 3.2); g.add(st)
          for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.9, 1.2), mat(0x9fd1ff)); w.position.set(sx * 1.2, 2.4, z0 - 1.2 - i * 2.0); g.add(w) }
          for (const z of [-1.2, -5.2]) { const wb = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.5, 1.4), mat(0x2a2a30)); wb.position.set(0, 0.35, z0 + z); g.add(wb) }
        }
        const nose = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.2, 0.5), mat(0xffd23f)); nose.position.set(0, 1.3, 0.1); g.add(nose)
        const hl = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.1), mat(0xfff3b0)); hl.position.set(0, 2.3, 0.02); g.add(hl)
        break }
      case 'plane': {
        // a small plane taxiing across the road: fuselage across all three lanes, wings low enough that you slide underneath
        const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 12, 10), mat(0xf4f6f8)); fus.rotation.z = Math.PI / 2; fus.position.set(0, 2.4, 0); g.add(fus)
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.6, 10), mat(0xd62828)); nose.rotation.z = -Math.PI / 2; nose.position.set(6.8, 2.4, 0); g.add(nose)
        const wing = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 7), mat(0xe6e9ec)); wing.position.set(1, 1.5, 0); g.add(wing)
        const tail = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.2), mat(0x2b3a8c)); tail.position.set(-5.4, 3.5, 0); g.add(tail)
        const tailW = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 3), mat(0xe6e9ec)); tailW.position.set(-5.4, 2.6, 0); g.add(tailW)
        for (let i = 0; i < 6; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 1.75), mat(0x4c6a8a)); w.position.set(-3.5 + i * 1.1, 2.7, 0); g.add(w) }
        for (const z of [-1.6, 1.6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 6), mat(0x555566)); p.position.set(1, 0.7, z); g.add(p); const wl = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 8), mat(0x1c1b22)); wl.rotation.x = Math.PI / 2; wl.position.set(1, 0.28, z); g.add(wl) }
        break }
      case 'bigBus': {
        const abuja = this.city === 'abuja'
        const L = 11, body = abuja ? 0x2b6ad0 : 0xd62828
        const b = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.45, L), mat(body)); b.position.set(0, 1.07, -L / 2); g.add(b)
        const lower = new THREE.Mesh(new THREE.BoxGeometry(2.54, 0.5, L + 0.04), mat(0xf4f6f4)); lower.position.set(0, 0.6, -L / 2); g.add(lower)
        const roof = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.1, L - 0.4), mat(0xcfd6dc)); roof.position.set(0, BUS_ROOF - 0.05, -L / 2); g.add(roof)
        for (let i = 0; i < 5; i++) { const ch = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.04, 0.3), mat(0xffd23f)); ch.position.set(0, BUS_ROOF + 0.01, -1.4 - i * 2.0); g.add(ch) }
        for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 1.4), mat(0x9fd1ff)); w.position.set(sx * 1.26, 1.25, -1.3 - i * 2.0); g.add(w) }
        const ws = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 0.05), mat(0x9fd1ff)); ws.position.set(0, 1.25, 0.03); g.add(ws)
        for (const sx of [-1, 1]) for (const z of [-2, -8.5]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10), mat(0x1c1b22)); w.rotation.z = Math.PI / 2; w.position.set(sx * 1.15, 0.42, z); g.add(w) }
        const lab = this.label(abuja ? 'AMAC' : 'BRT', 1.0); lab.position.set(0, 2.9, -1); g.add(lab)
        break }
      case 'walker': this.makePerson(g, [0x2b3a8c, 0xc4562a, 0x0f7a4a, 0xe0457b, 0x6a3b9a][Math.floor(Math.random() * 5)], 0); break
      case 'crowd': { const cols = [0x2b3a8c, 0xc4562a, 0x0f7a4a, 0xe0457b, 0xf5b91c]; for (let i = 0; i < 4; i++) this.makePerson(g, cols[(i + Math.floor(Math.random() * 5)) % 5], 0, [-0.8, 0.2, 0.9, -0.1][i], [0.2, -0.2, 0.3, 0.8][i]); const sign = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 0.06), mat(0xffffff)); sign.position.set(0.2, 2.4, 0.2); g.add(sign); const pole = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.4, 0.05), mat(0x6a4a2a)); pole.position.set(0.2, 1.7, 0.2); g.add(pole); break }
      case 'shack': {
        const wall = [0xe8c27a, 0xcf8a5a, 0xa8d0a0, 0xe0a0a0][Math.floor(Math.random() * 4)]
        const b = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.1, 2.4), mat(wall)); b.position.set(0, 1.05, 0); g.add(b)
        const roof = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.15, 2.9), mat(0x9a5a3a)); roof.position.set(0, 2.25, 0); roof.rotation.x = 0.12; g.add(roof)
        const win = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.06), mat(0x3a2a20)); win.position.set(0, 1.3, 1.22); g.add(win)
        const awn = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.7), mat([0xd62828, 0x2b3a8c, 0x1f9d55][Math.floor(Math.random() * 3)])); awn.position.set(0, 1.85, 1.5); g.add(awn)
        const lab = this.label('SHOP', 0.9); lab.position.set(0, 2.8, 1.2); g.add(lab)
        break }
      case 'barrier': { for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.3), mat(i % 2 ? 0xffffff : 0xd62828)); b.position.set(-0.9 + i * 0.6, 0.9, 0); g.add(b) } for (const x of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), mat(0x555566)); p.position.set(x, 0.55, 0); g.add(p) } break }
    }
    return g
  }

  private makePerson(g: THREE.Group, shirt: number, y = 0, x = 0, z = 0) {
    const skin = [0x5c3317, 0x7a4a2a, 0x3d2210][Math.floor(Math.random() * 3)]
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.7, 3, 6), mat(shirt)); body.position.set(x, y + 1.0, z); g.add(body)
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 0.25), mat(0x2a2a40)); legs.position.set(x, y + 0.3, z); g.add(legs)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat(skin)); head.position.set(x, y + 1.75, z); g.add(head)
  }

  private makeTunnel(len: number): THREE.Group {
    const g = new THREE.Group()
    const half = LANE_W * 1.5 + 1.6
    const concrete = mat(0x7a7a84)
    const roof = new THREE.Mesh(new THREE.BoxGeometry(half * 2 + 1.2, 0.8, len), concrete); roof.position.set(0, 8.2, -len / 2); g.add(roof)
    for (const sx of [-1, 1]) { const wall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.4, len), mat(0x6a6a74)); wall.position.set(sx * (half + 0.4), 4.2, -len / 2); g.add(wall) }
    for (let z = 0; z < len; z += 7) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(half * 2 + 1.2, 0.5, 0.5), mat(0x55555e)); rib.position.set(0, 7.65, -z - 1); g.add(rib)
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff0b0 })); lamp.position.set(0, 7.5, -z - 4); g.add(lamp)
      for (const sx of [-1, 1]) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 1.4), new THREE.MeshBasicMaterial({ color: 0xffa030 })); st.position.set(sx * (half - 0.1), 1.2, -z - 3); g.add(st) }
    }
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(half * 2 + 2.6, 2.2, 1.2), mat(0x4a4a54)); mouth.position.set(0, 9.4, -0.4); g.add(mouth)
    const lab = this.label('TUNNEL', 1.6); lab.position.set(0, 9.6, 0.4); g.add(lab)
    return g
  }

  private makeJunction(len: number): THREE.Group {
    const g = new THREE.Group()
    const w = LANE_W * 3
    for (let i = 0; i < 9; i++) { const z = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 4), mat(0xf4f1e6)); z.position.set(-w / 2 + 0.5 + i * (w / 9), 0.04, -len / 2); g.add(z) }
    const cross = new THREE.Mesh(new THREE.BoxGeometry(w + 8, 0.02, 3), mat(0x33333c)); cross.position.set(0, 0.03, -len / 2 - 4.5); void cross
    for (const sx of [-1, 1]) {
      const px = sx * (LANE_W * 1.5 + 1.1)
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.2, 0.16), mat(0x44444e)); pole.position.set(px, 2.1, -1); g.add(pole)
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 0.4), mat(0x1c1b22)); box.position.set(px, 4.4, -1); g.add(box)
      for (const [i, c] of [0xff3030, 0xffc928, 0x30e060].entries()) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 6), new THREE.MeshBasicMaterial({ color: c })); l.position.set(px - sx * 0.02, 4.8 - i * 0.4, -0.78); g.add(l) }
      for (let i = 0; i < 3; i++) this.makePerson(g, [0x2b3a8c, 0xc4562a, 0xe0457b][i], 0.3, px + sx * (0.6 + i * 0.5), -3 - i * 1.2)
    }
    return g
  }

  private rival?: { group: THREE.Group; parts: { legL?: THREE.Object3D; legR?: THREE.Object3D; armL?: THREE.Object3D; armR?: THREE.Object3D } }
  /** Add a second runner: a teal robot on foot, or a teal cab on the road. */
  setRival(name: string) {
    if (this.rival) return
    const g = new THREE.Group(), parts: { legL?: THREE.Object3D; legR?: THREE.Object3D; armL?: THREE.Object3D; armR?: THREE.Object3D } = {}
    const teal = 0x1ec8b4
    if (this.mode === 'danfo') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.9, 5.2), mat(teal)); body.position.y = 1.55; g.add(body)
      const st = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.34, 5.24), mat(0x1c1b22)); st.position.y = 1.35; g.add(st)
      const wind = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 0.06), mat(0x9fd1ff)); wind.position.set(0, 1.95, 2.62); g.add(wind)
      for (const x of [-1, 1]) for (const z of [-1.7, 1.7]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 10), mat(0x1c1b22)); w.rotation.z = Math.PI / 2; w.position.set(x * 1.0, 0.5, z); g.add(w) }
    } else {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.5), mat(teal)); body.position.y = 1.35; g.add(body)
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.5), mat(0xdfe8ec)); head.position.y = 2.1; g.add(head)
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.06), new THREE.MeshBasicMaterial({ color: 0x7affc8 })); visor.position.set(0, 2.12, -0.27); g.add(visor)
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), mat(0x555566)); ant.position.y = 2.55; g.add(ant)
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff4f6a })); ball.position.y = 2.8; g.add(ball)
      const limb = (x: number, y: number, h: number, col: number) => { const pv = new THREE.Group(); pv.position.set(x, y, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, h, 0.22), mat(col)); m.position.y = -h / 2; pv.add(m); g.add(pv); return pv }
      parts.legL = limb(-0.2, 0.9, 0.9, 0x2a3a44); parts.legR = limb(0.2, 0.9, 0.9, 0x2a3a44); parts.armL = limb(-0.55, 1.75, 0.8, 0xdfe8ec); parts.armR = limb(0.55, 1.75, 0.8, 0xdfe8ec)
    }
    g.traverse((o) => { const m = o as THREE.Mesh; const mt = m.material as THREE.Material | undefined; if (mt && 'opacity' in mt) { mt.transparent = true; (mt as THREE.MeshLambertMaterial).opacity = 0.85 } })
    const tag = this.label(name, 1.2); tag.position.y = this.mode === 'danfo' ? 4.4 : 3.5; g.add(tag)
    g.visible = false
    this.root.add(g); this.rival = { group: g, parts }
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

  private tunnelDim = 0
  private drawRival(st: DashState, rv: DashState | undefined, time: number) {
    const r = this.rival
    if (!r) return
    if (!rv) { r.group.visible = false; return }
    const rel = rv.dist - st.dist
    r.group.visible = rel > -6 && rel < 140
    r.group.position.set(rv.x * LANE_W + (Math.abs(rv.x - st.x) < 0.4 && Math.abs(rel) < 4 ? 0.7 : 0), rv.y, -rel)
    if (rv.over) r.group.rotation.z = Math.min(1.4, r.group.rotation.z + 0.1)
    const sw = Math.sin(time * (8 + rv.speed * 0.5)) * 0.9
    if (r.parts.legL) { r.parts.legL.rotation.x = sw; r.parts.legR!.rotation.x = -sw; r.parts.armL!.rotation.x = -sw; r.parts.armR!.rotation.x = sw }
  }

  render(st: DashState, dt: number, time: number, rival?: DashState) {
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
    this.drawRival(st, rival, time)
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
      if (rel + (o.length ?? 0) < -8 || rel > 160 || o.taken) { continue }
      if (o.type === 'coin') {
        if (ci >= 140) continue
        this.tmp.position.set(o.lane * LANE_W, (o.y ?? 0.9) + Math.sin(time * 3 + o.id) * 0.08, -rel); this.tmp.rotation.set(0, time * 3 + o.id, 0); this.tmp.updateMatrix()
        this.coins.setMatrixAt(ci, this.tmp.matrix); this.coins.setColorAt(ci, new THREE.Color(o.kind === 'gold' ? 0xfff07a : 0xffc928)); ci++
        continue
      }
      used.add(o.id)
      let a = this.active.get(o.id)
      if (!a) {
        const key = o.type === 'obstacle' ? o.kind : o.type === 'power' ? `power:${o.kind}` : o.type === 'tunnel' ? 'tunnel' : o.type === 'decor' ? 'junction' : 'stop'
        const free = this.pool.get(key)?.pop()
        const group = free ?? (o.type === 'obstacle' ? this.makeObstacle(o.kind as ObstacleKind) : o.type === 'power' ? this.makePower(o.kind) : o.type === 'tunnel' ? this.makeTunnel(o.length ?? 70) : o.type === 'decor' ? this.makeJunction(o.length ?? 12) : this.makeStop(o))
        this.root.add(group); a = { group, kind: key }; this.active.set(o.id, a)
      }
      a.group.position.set(o.type === 'stop' || o.type === 'tunnel' || o.type === 'decor' ? 0 : (o.x ?? o.lane) * LANE_W, 0, -rel)
      if (o.kind === 'walker') a.group.position.y = Math.abs(Math.sin(time * 9 + o.id)) * 0.12
      if (o.kind === 'plane') a.group.position.x = 0
      if (o.type === 'stop') a.group.position.x = o.lane * LANE_W
      if (o.type === 'power') a.group.rotation.y = time * 2
      if (o.type === 'obstacle' && o.passed && OBSTACLE_RESPONSE[o.kind as ObstacleKind] === 'jump' && o.kind !== 'walker') a.group.position.y = 0
    }
    this.coins.count = ci; this.coins.instanceMatrix.needsUpdate = true; if (this.coins.instanceColor) this.coins.instanceColor.needsUpdate = true
    for (const [id, a] of this.active) if (!used.has(id)) { this.root.remove(a.group); const arr = this.pool.get(a.kind) ?? []; arr.push(a.group); this.pool.set(a.kind, arr); this.active.delete(id) }
    for (const sp of this.spinners) sp.rotation.y = time * 2
    // inside a tunnel the light drops and the fog turns dark
    let inTun = 0
    for (const o of st.objs) if (o.type === 'tunnel') { const rel = o.dist - dist; if (rel < 6 && rel + (o.length ?? 70) > 0) { inTun = 1; break } }
    this.tunnelDim += (inTun - this.tunnelDim) * Math.min(1, dt * 5)
    this.hemi.intensity = 0.95 * (1 - 0.5 * this.tunnelDim); this.sun.intensity = 1.05 * (1 - 0.7 * this.tunnelDim)
    if (this.scene.fog) { (this.scene.fog as THREE.Fog).color.setHex(0xffb28a).lerp(new THREE.Color(0x1a1620), this.tunnelDim) }
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
