// Builds and animates one interior room as its own Three.js scene.
import { homeDecorFor, type HomeDecor } from './homeDecor'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Gender } from '@engine/core/types'
import { INTERIORS, interiorBlockers, type Anchor, type IObj, type Interior } from './interiors'
import type { Activity } from './residents'
import type { PlaceId, Rect } from './layout'
import { buildNavFor, findPath, type Nav } from './nav'
import { animateHuman, buildHuman, hashLook, type HumanParts } from './characters'
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
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: number) {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); this.paint(g, color)
  }
  cyl(cx: number, cy: number, cz: number, r: number, h: number, color: number, seg = 8) { const g = new THREE.CylinderGeometry(r, r, h, seg); g.translate(cx, cy, cz); this.paint(g, color) }
  mesh(): THREE.Mesh { const m = mergeGeometries(this.geos, false)!; this.geos.forEach((g) => g.dispose()); return new THREE.Mesh(m, new THREE.MeshLambertMaterial({ vertexColors: true })) }
}

const shade = (c: number, f: number) => { const r = Math.min(255, Math.round(((c >> 16) & 255) * f)), g = Math.min(255, Math.round(((c >> 8) & 255) * f)), b = Math.min(255, Math.round((c & 255) * f)); return (r << 16) | (g << 8) | b }

export interface InteriorState { light: boolean; tv: boolean; fan: boolean; hour: number }

export class InteriorView {
  readonly scene = new THREE.Scene()
  readonly def: Interior
  nav: Nav
  blockers: Rect[]
  private installed: Set<string>
  private applObjs = new Map<string, THREE.Object3D[]>()
  private hemi = new THREE.HemisphereLight(0xfff2d8, 0x4a3a4a, 1)
  private tvLight = new THREE.PointLight(0x7aa8ff, 0, 9)
  private tvScreen?: THREE.Mesh
  private tvMat = new THREE.MeshBasicMaterial({ color: 0x0b0b10 })
  private bulbMat = new THREE.MeshBasicMaterial({ color: 0x555555 })
  private windowMat = new THREE.MeshBasicMaterial({ color: 0x9ed3ff })
  private fanBlades?: THREE.Object3D
  private decor?: HomeDecor
  private water = { tap: false, shower: false }
  private drops?: THREE.InstancedMesh
  private dropSeed: { a: number; r: number; y: number; v: number }[] = []
  private stream?: THREE.Mesh
  private ripple?: THREE.Mesh
  private fanOn = false
  private people = new Map<string, { parts: HumanParts; sprite: THREE.Sprite; id: string; name: string; line: string; role: string; x: number; z: number; persistent?: string; prole?: string; act?: Activity | null; route: { x: number; z: number }[]; anchor?: Anchor; seat?: Anchor; leaving?: boolean; nextT: number; moving: boolean }>()
  private occupied = new Map<string, string>() // anchor id -> person id
  private clock = 0
  private marker: THREE.Mesh
  private arrow: THREE.Mesh
  private markTarget: string | null = null
  private time = 0
  private bedGroup?: THREE.Group
  private zzz?: THREE.Sprite
  private textCache = new Map<string, THREE.SpriteMaterial>()
  private boardCtx?: CanvasRenderingContext2D
  private icons: { s: THREE.Sprite; needs?: string }[] = []
  private boardTex?: THREE.CanvasTexture

  constructor(id: PlaceId, installed?: Set<string>, tint?: { wall: number; floor: number }, districtId?: string) {
    const base = INTERIORS[id]
    if (!base) throw new Error(`no interior for ${id}`)
    if (id === 'home' && districtId) this.decor = homeDecorFor(districtId)
    // the inside of your home takes on the look of your district (paint and flooring)
    let def = tint ? { ...base, wallColor: tint.wall, floors: base.floors.map((f, i) => (i === 0 || i === 1 ? { ...f, color: tint.floor } : f)) } : base
    const dc = this.decor
    if (dc) def = { ...def, objs: def.objs.map((o) => (o.kind === 'rug' ? { ...o, color: dc.rug } : o.kind === 'sofa' ? { ...o, color: dc.sofa } : o.kind === 'bed' ? { ...o, color: dc.bed } : o)) }
    this.def = def
    this.installed = installed ?? new Set(def.objs.map((o) => o.appl).filter(Boolean) as string[])
    this.blockers = interiorBlockers(def, this.installed)
    this.nav = buildNavFor(this.blockers, def.bounds, 0.5)
    this.scene.background = new THREE.Color(0x1b1830)
    this.scene.add(this.hemi, this.tvLight)
    const sun = new THREE.DirectionalLight(0xffffff, 0.35); sun.position.set(-4, 14, 10); this.scene.add(sun)
    this.build()
    this.marker = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.25, 20), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, side: THREE.DoubleSide })); this.marker.rotation.x = -Math.PI / 2; this.marker.position.y = 0.1; this.marker.visible = false
    this.arrow = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.9, 4), new THREE.MeshBasicMaterial({ color: 0xffd23f })); this.arrow.rotation.x = Math.PI; this.arrow.visible = false
    this.scene.add(this.marker, this.arrow)
  }

  private build() {
    const d = this.def, b = d.bounds, W = new Batch()
    for (const f of d.floors) W.box(f.rect.x0, f.rect.x1, -0.1, 0.02, f.rect.z0, f.rect.z1, f.color)
    // tile grid lines for a bit of texture
    for (let x = b.x0 + 2; x < b.x1; x += 2) W.box(x - 0.02, x + 0.02, 0.02, 0.025, b.z0, b.z1, 0x00000018)
    // outer walls: north and west tall, south and east low so the room stays visible
    const T = 0.35, H = 3.4
    W.box(b.x0 - T, b.x1 + T, 0, H, b.z0 - T, b.z0, d.wallColor)
    W.box(b.x0 - T, b.x0, 0, H, b.z0 - T, b.z1, shade(d.wallColor, 0.9))
    W.box(b.x1, b.x1 + T, 0, 0.6, b.z0 - T, b.z1, shade(d.wallColor, 0.8))
    // south wall with a door gap
    const gap = 1.3
    W.box(b.x0 - T, d.door.x - gap, 0, 0.6, b.z1, b.z1 + T, shade(d.wallColor, 0.8)); W.box(d.door.x + gap, b.x1 + T, 0, 0.6, b.z1, b.z1 + T, shade(d.wallColor, 0.8))
    W.box(d.door.x - gap, d.door.x + gap, 0, 0.04, b.z1, b.z1 + 0.5, 0x6a3b1d) // threshold / doormat
    W.box(d.door.x - 0.8, d.door.x + 0.8, 0.02, 0.06, b.z1 - 1.2, b.z1 - 0.3, 0xc4562a)
    // partitions (half walls so the camera can see over them)
    for (const w of d.walls) W.box(w.x0, w.x1, 0, 1.4, w.z0, w.z1, shade(d.wallColor, 0.95)), W.box(w.x0 - 0.04, w.x1 + 0.04, 1.4, 1.5, w.z0 - 0.04, w.z1 + 0.04, shade(d.wallColor, 0.7))
    for (const o of d.objs) {
      if (!o.appl) { this.obj(W, o); continue }
      // appliances are separate meshes so they can appear when delivered
      const A = new Batch(); const before = this.scene.children.length
      this.obj(A, o)
      const mesh = A.mesh(); this.scene.add(mesh)
      const extras = [mesh, ...this.scene.children.slice(before).filter((c) => c !== mesh)]
      this.applObjs.set(o.appl, [...(this.applObjs.get(o.appl) ?? []), ...extras])
    }
    this.applyInstalled()
    if (this.decor) {
      const dc = this.decor
      for (const x of dc.boxes) W.box(x.b[0], x.b[1], x.b[2], x.b[3], x.b[4], x.b[5], x.c)
      for (const c of dc.cyls) W.cyl(c.cx, c.cy, c.cz, c.r, c.h, c.c)
      const rug = d.objs.find((o) => o.kind === 'rug')
      if (rug) { const r = rug.rect, t = 0.22, y0 = 0.045, y1 = 0.058; W.box(r.x0 + t, r.x1 - t, y0, y1, r.z0 + t, r.z0 + t + 0.1, dc.rugTrim); W.box(r.x0 + t, r.x1 - t, y0, y1, r.z1 - t - 0.1, r.z1 - t, dc.rugTrim); W.box(r.x0 + t, r.x0 + t + 0.1, y0, y1, r.z0 + t, r.z1 - t, dc.rugTrim); W.box(r.x1 - t - 0.1, r.x1 - t, y0, y1, r.z0 + t, r.z1 - t, dc.rugTrim) }
    }
    this.scene.add(W.mesh())
    // north-wall windows (colour follows the time of day)
    for (const w of d.windowsAt) { const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), this.windowMat); win.position.set(w.x, 2.1, d.bounds.z0 + 0.03); this.scene.add(win); const fr = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.9, 0.06), new THREE.MeshLambertMaterial({ color: 0xffffff })); fr.position.set(w.x, 2.1, d.bounds.z0 + 0.0); this.scene.add(fr) }
    // ceiling bulbs hint (visual only): small glowing disc near the middle
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), this.bulbMat); bulb.position.set((b.x0 + b.x1) / 2, 3.0, (b.z0 + b.z1) / 2); this.scene.add(bulb)
    // chalkboard surface (school): text is set by setBoard()
    const bo = d.objs.find((o) => o.kind === 'board')
    if (bo && d.id === 'school') {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 256
      const ctx = c.getContext('2d')!; this.boardCtx = ctx
      this.boardTex = new THREE.CanvasTexture(c); this.boardTex.colorSpace = THREE.SRGBColorSpace
      const w = bo.rect.x1 - bo.rect.x0, hh = bo.h * 0.7
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.3, hh - 0.2), new THREE.MeshBasicMaterial({ map: this.boardTex }))
      pl.position.set((bo.rect.x0 + bo.rect.x1) / 2, 0.9 + hh / 2, bo.rect.z1 + 0.115); this.scene.add(pl)
      this.setBoard(['Class is in session', 'Sit down and open your books'])
    }
    // hotspot icons
    for (const h of d.hotspots) { const s = this.emoji(h.icon, 1.5); s.position.set(h.x, 2.6, h.z); this.scene.add(s); this.icons.push({ s, needs: h.needs }) }
  }

  private iconsOn = true
  private applyInstalled() {
    for (const i of this.icons) i.s.visible = this.iconsOn && (!i.needs || this.installed.has(i.needs))
    for (const [k, list] of this.applObjs) for (const o of list) o.visible = this.installed.has(k)
    if (!this.installed.has('tv')) { this.tvMat.color.setHex(0x0b0b10); this.tvLight.intensity = 0 }
  }
  /** Appliances that have been delivered appear (and start blocking movement). */
  setInstalled(set: Set<string>) {
    this.installed = set
    this.applyInstalled()
    this.blockers = interiorBlockers(this.def, set)
    this.nav = buildNavFor(this.blockers, this.def.bounds, 0.5)
  }
  applianceSpot(appl: string): { x: number; z: number } | null {
    const o = this.def.objs.find((x) => x.appl === appl); if (!o) return null
    return { x: (o.rect.x0 + o.rect.x1) / 2, z: (o.rect.z0 + o.rect.z1) / 2 }
  }
  private emoji(text: string, size: number): THREE.Sprite {
    let m = this.textCache.get(text)
    if (!m) {
      const c = document.createElement('canvas'); c.width = c.height = 128
      const g = c.getContext('2d')!; g.font = '88px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'
      g.fillStyle = 'rgba(20,18,31,0.55)'; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff'; g.fillText(text, 64, 70)
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
      m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }); this.textCache.set(text, m)
    }
    const s = new THREE.Sprite(m); s.scale.set(size, size, 1); return s
  }
  private label(text: string, bg = 'rgba(255,210,63,0.95)'): THREE.Sprite {
    const key = `L|${text}|${bg}`
    let m = this.textCache.get(key)
    if (!m) {
      const c = document.createElement('canvas'); c.width = 512; c.height = 128
      const g = c.getContext('2d')!; g.font = '800 44px system-ui, sans-serif'
      const w = Math.min(496, g.measureText(text).width + 40)
      g.fillStyle = bg; g.beginPath(); (g as CanvasRenderingContext2D & { roundRect: (...a: number[]) => void }).roundRect((512 - w) / 2, 22, w, 84, 30); g.fill()
      g.fillStyle = '#1c1b22'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 66, 480)
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
      m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }); this.textCache.set(key, m)
    }
    const s = new THREE.Sprite(m); s.scale.set(4.2, 1.05, 1); return s
  }

  private obj(W: Batch, o: IObj) {
    const r = o.rect, h = o.h, c = o.color
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2
    switch (o.kind) {
      case 'bed': {
        W.box(r.x0, r.x1, 0, 0.45, r.z0, r.z1, 0x6a4a2a); W.box(r.x0 + 0.1, r.x1 - 0.1, 0.45, h, r.z0 + 0.1, r.z1 - 0.1, c)
        W.box(r.x0 + 0.2, r.x1 - 0.2, h, h + 0.22, r.z0 + 0.2, r.z0 + 1.0, 0xffffff); W.box(r.x0, r.x1, 0, 1.5, r.z0 - 0.02, r.z0 + 0.15, 0x5a3a1a)
        break
      }
      case 'wardrobe': W.box(r.x0, r.x1, 0, h, r.z0, r.z1, c); W.box(cx - 0.04, cx + 0.04, 0.3, h - 0.3, r.z1, r.z1 + 0.03, 0x2a1a0a); break
      case 'desk': W.box(r.x0, r.x1, h - 0.1, h, r.z0, r.z1, c); for (const [x, z] of [[r.x0 + 0.1, r.z0 + 0.1], [r.x1 - 0.1, r.z0 + 0.1], [r.x0 + 0.1, r.z1 - 0.1], [r.x1 - 0.1, r.z1 - 0.1]]) W.box(x - 0.05, x + 0.05, 0, h - 0.1, z - 0.05, z + 0.05, shade(c, 0.7)); W.box(cx - 0.3, cx + 0.3, h, h + 0.35, cz - 0.1, cz + 0.1, 0x222233); break
      case 'chair': W.box(r.x0, r.x1, 0, 0.4, r.z0, r.z1, c); W.box(r.x0, r.x1, 0.4, 1.1, r.z1 - 0.1, r.z1, c); break
      case 'stool': W.cyl(cx, h / 2, cz, 0.28, h, c); break
      case 'sofa': W.box(r.x0, r.x1, 0, 0.5, r.z0, r.z1, c); W.box(r.x0, r.x1, 0.5, h + 0.3, r.z1 - 0.3, r.z1, shade(c, 0.85)); W.box(r.x0, r.x0 + 0.3, 0.5, h, r.z0, r.z1, shade(c, 0.8)); W.box(r.x1 - 0.3, r.x1, 0.5, h, r.z0, r.z1, shade(c, 0.8)); break
      case 'tvunit': {
        W.box(r.x0, r.x1, 0, h, r.z0, r.z1, c)
        if (o.id === 'tv') { W.box(cx - 0.9, cx + 0.9, h, h + 1.2, cz - 0.1, cz + 0.1, 0x111118); const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05), this.tvMat); sc.position.set(cx, h + 0.62, cz + 0.12); this.scene.add(sc); this.tvScreen = sc; this.tvLight.position.set(cx, h + 0.8, cz + 1.2) }
        else { W.box(cx - 0.9, cx + 0.9, h, h + 1.0, cz - 0.1, cz + 0.1, 0x111118) }
        break
      }
      case 'fan': { W.cyl(cx, 0.05, cz, 0.28, 0.1, 0x333333); W.cyl(cx, 0.8, cz, 0.04, 1.6, c); const bl = new THREE.Group(); for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.16), new THREE.MeshLambertMaterial({ color: 0xcfd8e6 })); b.position.x = 0.35; b.rotation.y = (i * Math.PI * 2) / 3; const g = new THREE.Group(); g.add(b); g.rotation.y = (i * Math.PI * 2) / 3; bl.add(g) } bl.position.set(cx, 1.7, cz); this.fanBlades = bl; this.scene.add(bl); break }
      case 'counter': case 'cooker': W.box(r.x0, r.x1, 0, h, r.z0, r.z1, c); W.box(r.x0 - 0.04, r.x1 + 0.04, h, h + 0.08, r.z0 - 0.04, r.z1 + 0.04, shade(c, 1.25)); if (o.kind === 'cooker') { W.cyl(r.x0 + 0.4, h + 0.14, cz, 0.18, 0.1, 0x222222); W.cyl(r.x1 - 0.4, h + 0.14, cz, 0.18, 0.1, 0x222222) } break
      case 'fridge': W.box(r.x0, r.x1, 0, h, r.z0, r.z1, c); W.box(r.x0, r.x1, h * 0.58, h * 0.6, r.z0 - 0.02, r.z1 + 0.02, 0x999999); break
      case 'table': W.box(r.x0, r.x1, h - 0.1, h, r.z0, r.z1, c); for (const [x, z] of [[r.x0 + 0.12, r.z0 + 0.12], [r.x1 - 0.12, r.z0 + 0.12], [r.x0 + 0.12, r.z1 - 0.12], [r.x1 - 0.12, r.z1 - 0.12]]) W.box(x - 0.06, x + 0.06, 0, h - 0.1, z - 0.06, z + 0.06, shade(c, 0.7)); W.cyl(cx, h + 0.12, cz, 0.22, 0.24, 0xffffff); break
      case 'shower': W.box(r.x0, r.x1, 0, 0.06, r.z0, r.z1, c); W.cyl(r.x0 + 0.2, 1.6, r.z0 + 0.2, 0.05, 3, 0x888899); W.cyl(r.x0 + 0.5, 3.0, r.z0 + 0.3, 0.3, 0.08, 0xaaaaaa); break
      case 'toilet': W.box(r.x0, r.x1, 0, 0.5, r.z0 + 0.3, r.z1, c); W.box(r.x0, r.x1, 0.5, 1.0, r.z0, r.z0 + 0.35, c); break
      case 'sink': W.box(r.x0, r.x1, 0.7, 0.85, r.z0, r.z1, c); W.box(cx - 0.04, cx + 0.04, 1.1, 1.18, cz - 0.04, cz + 0.2, 0xaaaaaa); W.box(r.x0 + 0.1, r.x1 - 0.1, 0, 0.7, r.z0 + 0.1, r.z1 - 0.1, 0xd8d8e0); W.cyl(cx, 1.0, cz, 0.04, 0.3, 0xaaaaaa); break
      case 'pew': W.box(r.x0, r.x1, 0, 0.5, r.z0, r.z1, c); W.box(r.x0, r.x1, 0.5, h + 0.2, r.z0, r.z0 + 0.12, c); break
      case 'pulpit': W.box(r.x0, r.x1, 0, h, r.z0, r.z1, c); W.box(cx - 0.9, cx + 0.9, h, h + 1.6, r.z0, r.z0 + 0.1, shade(c, 1.3)); break
      case 'board': W.box(r.x0, r.x1, 0.9, 0.9 + h * 0.7, r.z0, r.z1 + 0.1, c); W.box(r.x0 - 0.1, r.x1 + 0.1, 0.85, 0.9, r.z0, r.z1 + 0.12, 0x8a5a32); break
      case 'cubicle': W.box(r.x0, r.x1, 0, h, r.z0, r.z0 + 0.12, c); W.box(r.x0, r.x0 + 0.12, 0, h, r.z0, r.z1, c); W.box(r.x1 - 0.12, r.x1, 0, h, r.z0, r.z1, c); break
      case 'plant': W.cyl(cx, 0.25, cz, 0.28, 0.5, 0x8a5a32); W.cyl(cx, 0.9, cz, 0.38, 0.9, 0x2f9a4a, 6); break
      case 'rug': W.box(r.x0, r.x1, 0.02, 0.06, r.z0, r.z1, c); break
      case 'ac': W.box(r.x0, r.x1, 2.3, 2.85, r.z0, r.z1, c); W.box(r.x0 + 0.1, r.x1 - 0.1, 2.38, 2.45, r.z1 - 0.02, r.z1 + 0.02, 0x9fb4c8); break
      case 'shelf': W.box(r.x0, r.x1, 0, h, r.z0, r.z1, c); for (let y = 0.5; y < h; y += 0.6) W.box(r.x0 - 0.02, r.x1 + 0.02, y, y + 0.05, r.z0, r.z1, shade(c, 0.6)); break
      case 'cooler': W.box(r.x0, r.x1, 0, h * 0.7, r.z0, r.z1, 0xe8e8ee); W.box(r.x0 + 0.1, r.x1 - 0.1, h * 0.7, h, r.z0 + 0.1, r.z1 - 0.1, c); break
      default: W.box(r.x0, r.x1, 0, h, r.z0, r.z1, c)
    }
  }

  // ---------- state ----------
  setState(s: InteriorState) {
    const on = s.light
    const day = s.hour >= 7 && s.hour < 17
    const L = lightingAt(s.hour)
    this.hemi.intensity = on ? 1.25 : day ? 0.95 : 0.3
    this.hemi.color.setHex(on ? 0xfff2d8 : day ? 0xdfe9ff : 0x5a6aa8)
    this.hemi.groundColor.setHex(on ? 0x6a5a5a : day ? 0x6a6a7a : 0x14142e)
    this.bulbMat.color.setHex(on ? 0xfff2a8 : 0x444444)
    this.windowMat.color.setHex(L.sky)
    const tvOk = this.installed.has('tv')
    this.tvMat.color.setHex(s.tv && tvOk ? 0x6fa4ff : 0x0b0b10)
    this.tvLight.intensity = s.tv && tvOk ? 1.1 : 0
    this.fanOn = s.fan && this.installed.has('fan')
    ;(this.scene.background as THREE.Color).setHex(on ? 0x2a2540 : 0x15122a)
  }

  setPeople(list: { id: string; name: string; gender: Gender; role: string }[]) {
    const wanted = new Map<string, { id: string; name: string; gender: Gender; role: string }>()
    for (const p of list) wanted.set(p.role, p)
    for (const [k, o] of this.people) { this.scene.remove(o.parts.group, o.sprite); this.people.delete(k) }
    this.occupied.clear()
    for (const p of this.def.people) {
      const persistent = p.persistent ? wanted.get(p.persistent) : undefined
      if (p.persistent && !persistent) continue
      const name = persistent?.name ?? p.name
      const gender: Gender = persistent?.gender ?? (p.role === 'cook' || p.role === 'clerk' || ['s2', 's4', 'm1', 'm3', 'm5'].includes(p.id) ? 'female' : 'male')
      const parts = buildHuman({ look: hashLook(name, gender), gender, age: p.role === 'child' ? 6 : p.role === 'teacher' || p.role === 'boss' || p.role === 'elder' || p.role === 'mother' || p.role === 'father' ? 45 : 24, scale: 1.1 })
      parts.group.position.set(p.x, 0, p.z); parts.group.rotation.y = Math.PI
      this.scene.add(parts.group)
      const sprite = this.label(name); sprite.position.set(p.x, 3.5, p.z); this.scene.add(sprite)
      this.people.set(p.id, { parts, sprite, id: p.id, name, line: p.line, role: p.role, x: p.x, z: p.z, persistent: persistent?.id, prole: p.persistent, act: undefined, route: [], nextT: 0, moving: false })
    }
  }
  setBoard(lines: string[] | null) {
    const g = this.boardCtx, t = this.boardTex; if (!g || !t) return
    g.fillStyle = '#24402f'; g.fillRect(0, 0, 1024, 256)
    g.strokeStyle = '#ffffff22'; g.lineWidth = 6; g.strokeRect(6, 6, 1012, 244)
    g.fillStyle = '#f4f1e6'; g.textAlign = 'center'; g.textBaseline = 'middle'
    const ls = lines ?? []
    const fs = ls.length > 3 ? 40 : 52
    g.font = `700 ${fs}px "Comic Sans MS", "Chalkboard SE", cursive, sans-serif`
    ls.forEach((l, i) => g.fillText(l, 512, 128 + (i - (ls.length - 1) / 2) * (fs + 14), 980))
    t.needsUpdate = true
  }
  showIcons(v: boolean) { this.iconsOn = v; for (const i of this.icons) i.s.visible = v && (!i.needs || this.installed.has(i.needs)); for (const p of this.people.values()) p.sprite.visible = v && p.parts.group.visible }
  hidePerson(id: string, hidden: boolean) { const p = this.people.get(id); if (p) { p.parts.group.visible = !hidden; p.sprite.visible = !hidden } }
  personInfo(id: string) { const p = this.people.get(id); return p ? { id: p.id, name: p.name, line: p.line, role: p.role, persistent: p.persistent, npcId: p.persistent, prole: p.prole, x: p.x, z: p.z } : null }
  debugPeople() { return [...this.people.values()].map((p) => ({ id: p.id, act: p.act, vis: p.parts.group.visible, x: +p.x.toFixed(1), z: +p.z.toFixed(1), seat: p.seat?.id ?? null, moving: p.moving })) }
  allPeople() { return [...this.people.values()].filter((p) => p.parts.group.visible).map((p) => ({ id: p.id, x: p.x, z: p.z })) }

  setMarker(hotspotId: string | null) { this.markTarget = hotspotId }

  /** Lay the player down in the bed (or stand up again). */
  claimSeat(kind: Anchor['kind'], who: string): Anchor | null {
    const a = (this.def.anchors ?? []).find((x) => x.kind === kind && !this.occupied.has(x.id))
    if (!a) return null
    this.occupied.set(a.id, who); return a
  }
  releaseSeat(who: string) { for (const [k, v] of [...this.occupied]) if (v === who) this.occupied.delete(k) }
  setSleeping(player: HumanParts, on: boolean, zzzOn = true) {
    const bed = this.def.objs.find((o) => o.kind === 'bed')
    if (!bed) return
    const cx = (bed.rect.x0 + bed.rect.x1) / 2, cz = (bed.rect.z0 + bed.rect.z1) / 2
    if (on) {
      player.group.position.set(cx, 0.9, cz + 0.3); player.group.rotation.set(-Math.PI / 2, 0, 0)
      if (!this.bedGroup) { const g = new THREE.Group(); const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.25, 2.6), new THREE.MeshLambertMaterial({ color: 0x2b8a6a })); blanket.position.set(cx, 1.35, cz + 0.9); g.add(blanket); this.bedGroup = g; this.scene.add(g) }
      this.bedGroup.visible = true
      if (!this.zzz) { this.zzz = this.label('😴 Zzz…', 'rgba(255,255,255,0.9)'); this.scene.add(this.zzz) }
      this.zzz.visible = zzzOn; this.zzz.position.set(cx, 3.2, cz)
    } else {
      player.group.rotation.set(0, 0, 0)
      if (this.bedGroup) this.bedGroup.visible = false
      if (this.zzz) this.zzz.visible = false
    }
  }
  bedStand(): { x: number; z: number } { const h = this.def.hotspots.find((x) => x.id === 'bed'); return h ? { x: h.x, z: h.z } : this.def.spawn }


  // ---------- residents with their own routines ----------
  private anchorFor(p: { id: string }, act: Activity, avoid?: string): Anchor | undefined {
    const all = this.def.anchors; if (!all) return undefined
    const want: Anchor['kind'][] = act === 'cook' ? ['cook'] : act === 'eat' ? ['table'] : act === 'tv' ? ['sofa'] : act === 'play' ? ['rug', 'stand'] : ['stand']
    const free = all.filter((a) => want.includes(a.kind) && a.id !== avoid && (!this.occupied.has(a.id) || this.occupied.get(a.id) === p.id))
    if (!free.length) { const st = all.filter((a) => a.kind === 'stand' && a.id !== avoid); return st[Math.floor(Math.random() * st.length)] }
    return free[Math.floor(Math.random() * free.length)]
  }
  private release(p: { id: string; seat?: Anchor }) { if (p.seat) { this.occupied.delete(p.seat.id); p.seat = undefined } }
  private stand(p: { parts: HumanParts }) { p.parts.group.position.y = 0; p.parts.legL.rotation.x = p.parts.legR.rotation.x = 0 }
  private goTo(p: NonNullable<ReturnType<InteriorView['people']['get']>>, a: Anchor, instant: boolean) {
    this.release(p); this.occupied.set(a.id, p.id); p.anchor = a; p.nextT = this.clock + 14 + Math.random() * 22
    if (instant) { this.sitOrStand(p, a); return }
    this.stand(p)
    const path = findPath(this.nav, { x: p.x, z: p.z }, { x: a.ax, z: a.az })
    p.route = path ?? []
    if (!path) this.sitOrStand(p, a)
  }
  private sitOrStand(p: NonNullable<ReturnType<InteriorView['people']['get']>>, a: Anchor) {
    p.x = a.x; p.z = a.z; p.route = []; p.seat = a
    p.parts.group.position.set(a.x, 0, a.z); p.parts.group.rotation.y = a.face; p.sprite.position.set(a.x, 3.5, a.z)
    if (a.pose === 'sit') { p.parts.legL.rotation.x = p.parts.legR.rotation.x = -1.45; p.parts.group.position.y = a.floor ? -0.9 : -0.45 }
    else this.stand(p)
  }
  /** Tell each resident what they are doing now (null = not at home). New arrivals walk in through the door. */
  setActivities(map: Record<string, Activity | null>, instant = false) {
    if (!this.def.anchors) { for (const p of this.people.values()) if (p.prole && p.prole in map) { const on = map[p.prole] != null; p.parts.group.visible = on; p.sprite.visible = on } return }
    for (const p of this.people.values()) {
      if (!p.prole || !(p.prole in map)) continue
      const act = map[p.prole]
      if (act === p.act) continue
      p.act = act
      if (act == null) {
        if (!p.parts.group.visible) continue
        if (instant) { this.release(p); p.parts.group.visible = false; p.sprite.visible = false; continue }
        this.stand(p); this.release(p); p.leaving = true
        p.route = findPath(this.nav, { x: p.x, z: p.z }, this.def.door) ?? []
        if (!p.route.length) { p.parts.group.visible = false; p.sprite.visible = false }
        continue
      }
      const a = this.anchorFor(p, act); if (!a) continue
      p.leaving = false
      if (!p.parts.group.visible) {
        p.parts.group.visible = true; p.sprite.visible = true
        const from = instant ? { x: a.x, z: a.z } : this.def.door
        p.x = from.x; p.z = from.z; p.parts.group.position.set(from.x, 0, from.z)
      }
      this.goTo(p, a, instant)
    }
  }
  private stepResidents(dt: number) {
    this.clock += dt
    for (const p of this.people.values()) {
      if (!p.prole || !p.parts.group.visible) continue
      // wander a little within the same activity so people keep moving about
      if (p.act && !p.leaving && !p.route.length && this.clock > p.nextT && (p.act === 'idle' || p.act === 'play' || p.act === 'chat')) {
        const a = this.anchorFor(p, p.act, p.anchor?.id); if (a && Math.random() < 0.6) this.goTo(p, a, false); else p.nextT = this.clock + 10 + Math.random() * 15
      }
      if (p.route.length) {
        const t = p.route[0]; const vx = t.x - p.x, vz = t.z - p.z, d = Math.hypot(vx, vz)
        if (d < 0.25) { p.route.shift(); if (!p.route.length) { if (p.leaving) { p.parts.group.visible = false; p.sprite.visible = false } else if (p.anchor) this.sitOrStand(p, p.anchor) } }
        else { const sp = 2.3 * dt; p.x += (vx / d) * sp; p.z += (vz / d) * sp; p.parts.group.position.set(p.x, 0, p.z); p.parts.group.rotation.y = Math.atan2(vx, vz); p.sprite.position.set(p.x, 3.5, p.z) }
        p.moving = true
      } else p.moving = false
      animateHuman(p.parts, this.time + p.x, p.moving, 0.7)
      if (p.seat?.pose === 'sit' && !p.moving) { p.parts.legL.rotation.x = p.parts.legR.rotation.x = -1.45 }
    }
  }

  /** Where to stand for the sink and the shower, and the camera that shows it. */
  washSpot(kind: 'sink' | 'shower') {
    const o = this.def.objs.find((x) => x.kind === kind)
    if (!o) return null
    const cx = (o.rect.x0 + o.rect.x1) / 2
    return kind === 'sink'
      ? { x: cx, z: o.rect.z1 + 0.6, face: 0, cam: { pos: [cx - 3.4, 3.4, o.rect.z1 + 3.4] as [number, number, number], look: [cx, 1.7, o.rect.z1 + 0.2] as [number, number, number] } }
      : { x: o.rect.x0 + 0.5, z: o.rect.z0 + 0.95, face: Math.PI, cam: { pos: [o.rect.x0 + 3.2, 3.6, o.rect.z0 + 5.6] as [number, number, number], look: [o.rect.x0 + 0.5, 1.6, o.rect.z0 + 0.9] as [number, number, number] } }
  }

  /** Turn the tap or the shower on or off: a falling spray over the shower, a stream and ripples at the sink. */
  setWater(kind: 'tap' | 'shower', on: boolean) {
    this.water[kind] = on
    if (!this.drops) {
      const g = new THREE.BoxGeometry(0.03, 0.3, 0.03)
      this.drops = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.8 }), 90); this.drops.frustumCulled = false; this.scene.add(this.drops)
      for (let i = 0; i < 90; i++) this.dropSeed.push({ a: Math.random() * Math.PI * 2, r: Math.random(), y: Math.random() * 3, v: 4.5 + Math.random() * 2 })
      this.stream = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.06), new THREE.MeshBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.85 })); this.scene.add(this.stream)
      this.ripple = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 14), new THREE.MeshBasicMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.7 })); this.scene.add(this.ripple)
    }
    const sink = this.def.objs.find((x) => x.kind === 'sink')
    if (sink) { const cx = (sink.rect.x0 + sink.rect.x1) / 2, cz = (sink.rect.z0 + sink.rect.z1) / 2; this.stream!.position.set(cx, 1.0, cz + 0.2); this.ripple!.position.set(cx, 0.86, cz + 0.2) }
  }

  private stepWater() {
    if (!this.drops) return
    const sh = this.def.objs.find((x) => x.kind === 'shower')
    const on = this.water.shower && !!sh
    this.drops.visible = on
    if (on && sh) {
      const hx = sh.rect.x0 + 0.5, hz = sh.rect.z0 + 0.3, m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3()
      for (let i = 0; i < this.dropSeed.length; i++) {
        const d = this.dropSeed[i]
        d.y -= d.v * (1 / 60); if (d.y < 0) { d.y = 2.9; d.a = Math.random() * Math.PI * 2; d.r = Math.random() }
        const spread = 0.12 + (1 - d.y / 2.9) * 0.4 * d.r
        p.set(hx + Math.cos(d.a) * spread, d.y + 0.1, hz + 0.45 + Math.sin(d.a) * spread * 0.9)
        m.compose(p, q, s); this.drops.setMatrixAt(i, m)
      }
      this.drops.instanceMatrix.needsUpdate = true
    }
    const tap = this.water.tap
    if (this.stream && this.ripple) {
      this.stream.visible = tap; this.ripple.visible = tap
      if (tap) { this.stream.scale.y = 0.85 + Math.sin(this.time * 40) * 0.15; this.ripple.scale.setScalar(1 + Math.sin(this.time * 9) * 0.12) }
    }
  }

  update(dt: number) {
    this.time += dt
    this.stepWater()
    if (this.fanOn && this.fanBlades) this.fanBlades.rotation.y += dt * 14
    if (this.tvScreen && this.tvMat.color.getHex() !== 0x0b0b10) this.tvMat.color.setHex(Math.floor(this.time * 3) % 2 ? 0x6fa4ff : 0x8fb6ff)
    const h = this.markTarget === '__exit' ? this.def.door : this.markTarget ? this.def.hotspots.find((x) => x.id === this.markTarget) : null
    this.marker.visible = this.arrow.visible = !!h
    if (h) { this.marker.position.set(h.x, 0.1, h.z); this.marker.scale.setScalar(1 + Math.sin(this.time * 4) * 0.1); this.arrow.position.set(h.x, 3.5 + Math.abs(Math.sin(this.time * 3)) * 0.5, h.z) }
    this.stepResidents(dt)
    for (const p of this.people.values()) if (!p.prole) animateHuman(p.parts, this.time, false)
  }

  dispose() {
    this.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); const mt = m.material as THREE.Material | THREE.Material[] | undefined; if (Array.isArray(mt)) mt.forEach((x) => x.dispose()); else mt?.dispose() })
    this.textCache.forEach((m) => { m.map?.dispose(); m.dispose() })
  }
}
