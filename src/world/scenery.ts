// Scenery that makes each district and city look like itself: drawing helpers for the flavour props, the group-trip place
// (hills in Abuja, beach in Lagos), the skyline, and the vehicles that drive around. Pure Three.js, no game state.
import * as THREE from 'three'
import type { District, Prop } from './layout'
import type { VehicleKind } from './flavour'

export interface BatchLike {
  box(cx: number, cy: number, cz: number, w: number, h: number, d: number, color: number, rotY?: number): void
  cone(cx: number, cy: number, cz: number, r: number, h: number, color: number, seg?: number): void
  cyl(cx: number, cy: number, cz: number, rt: number, rb: number, h: number, color: number, seg?: number): void
}

const mid = (r: { x0: number; x1: number; z0: number; z1: number }) => ({ x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, w: r.x1 - r.x0, d: r.z1 - r.z0 })

/** Draw a flavour prop (palm, flag, wall, gate, generator, billboard pole). Returns true when it knew the kind. */
export function drawFlavourProp(b: BatchLike, p: Prop): boolean {
  const { x, z, w, d } = mid(p.rect)
  switch (p.kind) {
    case 'palm':
      b.cyl(x, p.h * 0.5, z, 0.14, 0.26, p.h, 0x8a6a42, 6)
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; b.box(x + Math.cos(a) * 1.0, p.h + 0.15, z + Math.sin(a) * 1.0, 2.2, 0.12, 0.55, 0x2f9a3a, -a) }
      b.cyl(x, p.h - 0.05, z, 0.25, 0.25, 0.3, 0x6a4a2a, 6)
      return true
    case 'flag':
      b.cyl(x, p.h / 2, z, 0.06, 0.08, p.h, 0xcfcfd4, 6)
      b.box(x + 0.55, p.h - 0.55, z, 1.1, 0.35, 0.05, 0x1f9d55); b.box(x + 0.55, p.h - 0.9, z, 1.1, 0.35, 0.05, 0xffffff); b.box(x + 0.55, p.h - 1.25, z, 1.1, 0.35, 0.05, 0x1f9d55)
      return true
    case 'wall':
      b.box(x, p.h / 2, z, w, p.h, d, p.color); b.box(x, p.h + 0.08, z, w + 0.1, 0.16, d + 0.1, 0x9a8a78)
      return true
    case 'gate':
      b.box(x - w / 2 + 0.12, p.h / 2, z, 0.25, p.h, d + 0.1, 0x5a5a66); b.box(x + w / 2 - 0.12, p.h / 2, z, 0.25, p.h, d + 0.1, 0x5a5a66)
      b.box(x, p.h - 0.3, z, w - 0.2, 0.18, d * 0.6, p.color); b.box(x, p.h * 0.45, z, w - 0.5, p.h * 0.7, 0.08, p.color)
      return true
    case 'generator':
      b.box(x, 0.45, z, w, 0.9, d, 0xd9534f); b.box(x, 0.95, z, w * 0.7, 0.12, d * 0.7, 0x333339); b.cyl(x + w * 0.35, 1.5, z, 0.07, 0.07, 1.1, 0x555555, 6)
      return true
    case 'billboard':
      b.cyl(x - w / 2 + 0.3, 2.4, z, 0.1, 0.1, 4.8, 0x555560, 6); b.cyl(x + w / 2 - 0.3, 2.4, z, 0.1, 0.1, 4.8, 0x555560, 6)
      b.box(x, 5.0, z, w, 2.0, 0.15, p.color)
      return true
    default: return false
  }
}

/** The group-trip place: green hills with a trail and a flag in Abuja, a beach with a sea, umbrellas and a boat in Lagos. */
export function drawOuting(b: BatchLike, d: District) {
  const o = d.places.find((p) => p.id === 'outing'); if (!o) return
  const { x, z, w, d: dd } = mid(o.rect)
  const x0 = o.rect.x0, x1 = o.rect.x1, z0 = o.rect.z0, z1 = o.rect.z1
  if (d.theme.city === 'abuja') {
    b.box(x, 0.04, z, w, 0.06, dd, 0x6fa84a)
    b.cone(x, 3.2, z0 + 3, 11, 6.4, 0x5a9a3e, 12); b.cone(x + 6, 2.4, z0 + 4, 7, 4.8, 0x4f8a38, 10); b.cone(x - 8, 2.0, z0 + 5, 6, 4, 0x679f45, 9)
    b.cone(x, 6.6, z0 + 3, 4, 3.2, 0x7ab356, 10)
    // zigzag trail from the door up to the top
    const trail: [number, number][] = [[x, z1 - 1], [x - 5, z1 - 3.5], [x + 5, z1 - 6], [x - 5, z0 + 7], [x + 4, z0 + 5], [x, z0 + 3.4]]
    for (let i = 0; i < trail.length - 1; i++) { const [ax, az] = trail[i], [bx, bz] = trail[i + 1]; const n = 6; for (let k = 0; k <= n; k++) b.box(ax + ((bx - ax) * k) / n, 0.1 + (i + k / n) * 0.45, az + ((bz - az) * k) / n, 1.3, 0.1, 1.3, 0xb89a6a) }
    for (const [rx, rz, s] of [[x - 9, z1 - 6, 1.4], [x + 9, z1 - 4, 1.0], [x + 8, z0 + 9, 1.6], [x - 3, z0 + 9, 1.2]] as const) b.box(rx, s / 2, rz, s * 1.6, s, s * 1.3, 0x8c7d6c, 0.4)
    b.cyl(x, 8.6, z0 + 3, 0.07, 0.07, 3, 0xcfcfd4, 6); b.box(x + 0.6, 9.5, z0 + 3, 1.2, 0.4, 0.05, 0x1f9d55); b.box(x + 0.6, 9.1, z0 + 3, 1.2, 0.4, 0.05, 0xffffff)
  } else {
    b.box(x, 0.04, z, w, 0.06, dd, 0xe8d29a)                      // sand
    b.box(x, 0.06, z0 + 3.5, w, 0.08, 7, 0x2fa8d8)                  // sea
    for (let i = 0; i < 6; i++) b.box(x0 + 2 + i * 3.7, 0.14, z0 + 7.2 + (i % 2) * 0.3, 2.4, 0.06, 0.35, 0xe6f6ff) // foam
    for (const [ux, uz, col] of [[x - 7, z1 - 4, 0xe0457b], [x - 1, z1 - 7, 0xf5b91c], [x + 6, z1 - 5, 0x2bb3a6], [x + 8, z0 + 10, 0xc4562a]] as const) {
      b.cyl(ux, 1.2, uz, 0.05, 0.05, 2.4, 0xcfcfd4, 6); b.cone(ux, 2.6, uz, 1.7, 0.7, col, 8); b.box(ux + 1.4, 0.2, uz, 1.4, 0.15, 0.7, 0xffffff)
    }
    b.box(x + 9, 0.35, z0 + 4, 3.4, 0.5, 1.2, 0xc4262e); b.box(x + 9, 0.8, z0 + 4, 0.1, 1.2, 0.1, 0x6a4a2a) // a little boat
    for (const [px, pz] of [[x0 + 1.5, z1 - 2], [x1 - 1.5, z1 - 3], [x0 + 3, z0 + 11], [x1 - 2, z0 + 12]] as const) drawFlavourProp(b, { kind: 'palm', rect: { x0: px - 0.4, x1: px + 0.4, z0: pz - 0.4, z1: pz + 0.4 }, color: 0x2f8a3a, h: 6, blocks: false })
    // goal posts for the beach football
    b.box(x - 3, 1.2, z1 - 9.5, 0.12, 2.4, 0.12, 0xffffff); b.box(x - 3, 1.2, z1 - 6.5, 0.12, 2.4, 0.12, 0xffffff); b.box(x - 3, 2.4, z1 - 8, 0.12, 0.12, 3.1, 0xffffff)
  }
}

/** Scenery out beyond the edge of the district: what you would see on the horizon. */
export function skylineObjects(d: District): THREE.Object3D[] {
  const out: THREE.Object3D[] = []
  const sk = d.flavour.skyline
  const grey = new THREE.MeshLambertMaterial({ color: 0x8c7d6c, flatShading: true })
  const green = new THREE.MeshLambertMaterial({ color: 0x5a8a45, flatShading: true })
  const hill = (x: number, z: number, sx: number, sy: number, sz: number, mat: THREE.Material) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat); m.scale.set(sx, sy, sz); m.position.set(x, sy * 0.35, z); m.rotation.y = x; out.push(m) }
  const near = d.flavour.extras.includes('hillsNear')
  if (d.theme.city === 'abuja') {
    // Abuja is ringed by granite hills (Aso Rock, Zuma Rock) and green ridges
    for (const [x, z, sx, sy, sz] of [[-62, -118, 46, 26, 30], [10, -135, 62, 38, 40], [78, -112, 34, 18, 26], [-110, 40, 30, 20, 34]] as const) hill(x, z, sx, sy, sz, grey)
    if (near) for (const [x, z, sx, sy, sz] of [[-75, 70, 40, 14, 22], [70, 75, 46, 16, 24], [100, -20, 22, 18, 36], [-100, -30, 20, 14, 30], [0, 95, 56, 12, 20], [-70, -75, 36, 15, 20], [72, -72, 32, 17, 20]] as const) hill(x, z, sx, sy, sz, green)
    if (sk === 'hills') hill(30, -150, 80, 48, 50, grey) // the big rock on the skyline
  }
  const tower = (x: number, z: number, w: number, h: number, c: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshLambertMaterial({ color: c })); m.position.set(x, h / 2, z); out.push(m) }
  if (sk === 'highrise') for (let i = 0; i < 12; i++) tower(-90 + i * 16, -78 - ((i * 7) % 5) * 5, 8 + (i % 3) * 2, 20 + ((i * 13) % 5) * 9, i % 2 ? 0x8aa0b8 : 0xb0bcc8)
  if (sk === 'flat') for (let i = 0; i < 8; i++) tower(-84 + i * 24, -80, 9, 10 + ((i * 11) % 4) * 4, 0xc4a98a)
  if (sk === 'lagoon' || sk === 'ocean') {
    const water = new THREE.Mesh(new THREE.PlaneGeometry(260, 70), new THREE.MeshLambertMaterial({ color: sk === 'ocean' ? 0x2a8fc4 : 0x3a9ab4 }))
    water.rotation.x = -Math.PI / 2; water.position.set(0, 0.01, 86); out.push(water)
    for (let i = 0; i < 6; i++) tower(-60 + i * 24, 128, 9, 18 + ((i * 7) % 4) * 6, 0xdde4ea)
  }
  return out
}

/** A small vehicle for the traffic. Faces +x (it is rotated when it drives the other way). */
export function vehicleMesh(kind: VehicleKind): THREE.Group {
  const g = new THREE.Group()
  const box = (w: number, h: number, d: number, c: number, x: number, y: number, z: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color: c })); m.position.set(x, y, z); g.add(m); return m }
  const wheels = (len: number, wid: number, r = 0.42) => { for (const sx of [-len / 2 + 0.7, len / 2 - 0.7]) for (const sz of [-wid / 2, wid / 2]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 10), new THREE.MeshLambertMaterial({ color: 0x1c1b22 })); m.rotation.x = Math.PI / 2; m.position.set(sx, r, sz); g.add(m) } }
  switch (kind) {
    case 'danfo': box(5.2, 1.7, 2.1, 0xffd23f, 0, 1.45, 0); box(5.24, 0.3, 2.14, 0x1c1b22, 0, 1.2, 0); box(4.2, 0.55, 2.16, 0x9fd1ff, -0.1, 1.95, 0); wheels(5.2, 2.0, 0.5); break
    case 'brt': box(7.4, 2.1, 2.3, 0xc4262e, 0, 1.6, 0); box(7.44, 0.3, 2.34, 0xffffff, 0, 1.2, 0); box(6.4, 0.7, 2.36, 0x9fd1ff, 0, 2.15, 0); wheels(7.4, 2.2, 0.5); break
    case 'keke': box(2.4, 1.2, 1.5, 0xf2c230, 0, 0.95, 0); box(2.0, 0.7, 1.52, 0x2f8a4a, -0.1, 1.7, 0); wheels(2.4, 1.4, 0.32); break
    case 'okada': box(1.8, 0.45, 0.5, 0xc4262e, 0, 0.7, 0); box(0.5, 0.9, 0.4, 0x2bb3a6, -0.2, 1.3, 0); box(0.3, 0.3, 0.3, 0x6a3a20, -0.2, 1.9, 0); wheels(1.8, 0.1, 0.3); break
    case 'cab': box(4.1, 0.9, 1.8, 0x1f9d55, 0, 0.8, 0); box(4.12, 0.2, 1.82, 0xffffff, 0, 1.1, 0); box(2.2, 0.8, 1.6, 0x1f9d55, -0.2, 1.55, 0); box(2.0, 0.5, 1.62, 0x9fd1ff, -0.2, 1.6, 0); box(0.7, 0.22, 0.4, 0xffd23f, -0.2, 2.05, 0); wheels(4.1, 1.7, 0.36); break
    case 'suv': box(4.6, 1.2, 1.95, 0x14141a, 0, 1.0, 0); box(3.0, 0.8, 1.9, 0x14141a, -0.3, 1.9, 0); box(2.8, 0.5, 1.92, 0x2a3a4a, -0.3, 1.95, 0); wheels(4.6, 1.85, 0.42); break
  }
  return g
}
