// Procedural low-poly humans shared by the world. Matches the 2D avatar's AvatarConfig.
import * as THREE from 'three'
import type { Appearance } from '@engine/core/types'
import { SKIN_TONES } from '../ui/Avatar'
import type { Wear } from '@content/items'

export interface HumanParts { group: THREE.Group; body: THREE.Group; legL: THREE.Object3D; legR: THREE.Object3D; armL: THREE.Object3D; armR: THREE.Object3D }

const lam = (c: number | THREE.Color | string) => new THREE.MeshLambertMaterial({ color: c as THREE.ColorRepresentation })


// Cloth patterns drawn once and shared, so ankara, adire and aso-oke show on the 3D body the way they do on the portrait.
const fabricCache = new Map<string, THREE.Material>()
function fabricMat(fabric: string, top: string, bottom: string): THREE.Material {
  if (fabric === 'plain' || typeof document === 'undefined') return lam(top)
  const key = `${fabric}|${top}|${bottom}`
  let m = fabricCache.get(key)
  if (m) return m
  const c = document.createElement('canvas'); c.width = c.height = 64
  const g = c.getContext('2d')
  if (!g) return lam(top)
  if (fabric === 'ankara') {
    g.fillStyle = top; g.fillRect(0, 0, 64, 64)
    g.fillStyle = '#f5b91c'; for (const [x, y] of [[14, 14], [46, 46]]) { g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill() }
    g.fillStyle = bottom; for (const [x, y] of [[14, 14], [46, 46]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill() }
    g.fillStyle = '#fff8ea'; g.beginPath(); g.moveTo(34, 8); g.lineTo(58, 8); g.lineTo(46, 28); g.fill()
    g.fillStyle = '#c4562a'; g.fillRect(6, 38, 16, 16)
  } else if (fabric === 'adire') {
    g.fillStyle = '#1d2f6f'; g.fillRect(0, 0, 64, 64)
    g.strokeStyle = '#dfe7ff'; g.lineWidth = 3
    for (const [x, y] of [[16, 16], [48, 48], [48, 16], [16, 48]]) { g.beginPath(); g.arc(x, y, 12, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y, 5, 0, 7); g.stroke() }
  } else {
    g.fillStyle = top; g.fillRect(0, 0, 64, 64)
    g.fillStyle = '#f5b91c'; g.fillRect(0, 8, 64, 9); g.fillStyle = '#fff8ea'; g.fillRect(0, 28, 64, 5); g.fillStyle = '#c4562a'; g.fillRect(0, 44, 64, 9)
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(1.2, 1.2)
  m = new THREE.MeshLambertMaterial({ map: t })
  fabricCache.set(key, m)
  return m
}

export function buildHuman(opts: { look: Appearance; age: number; gender?: 'male' | 'female'; wear?: Wear[]; uniform?: boolean; scale?: number }): HumanParts {
  const { look, age } = opts
  const female = opts.gender === 'female'
  const wear = opts.wear ?? []
  const outfit = opts.uniform ? 'uniform' : look.outfitType
  const skin = new THREE.Color(SKIN_TONES[look.skinTone] ?? SKIN_TONES[4])
  const topHex = opts.uniform ? '#ffffff' : look.topColor
  const botHex = opts.uniform ? '#1f3a7a' : look.bottomColor
  const top = new THREE.Color(topHex)
  const bot = new THREE.Color(botHex)
  const hairHex = age >= 60 ? '#cccccc' : look.hairColor
  const hair = new THREE.Color(hairHex)
  const cloth = opts.uniform ? lam(top) : fabricMat(look.fabric, topHex, botHex)
  const group = new THREE.Group()
  const body = new THREE.Group()
  const kid = age < 12
  const s = (opts.scale ?? 1) * (kid ? 0.72 : age < 18 ? 0.9 : 1)
  const add = (w: number, h: number, d: number, mat: THREE.Material | THREE.Color | string | number, x: number, y: number, z: number, parent: THREE.Object3D = body) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat instanceof THREE.Material ? mat : lam(mat)); m.position.set(x, y, z); parent.add(m); return m
  }
  // front of the body is local -z (the whole body is turned round at the end)
  const bw = female ? 0.76 : 0.9
  const longRobe = outfit === 'traditional' || (outfit === 'owambe' && !female)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(longRobe ? bw + 0.14 : bw, longRobe ? 1.5 : 1.0, longRobe ? 0.62 : female ? 0.44 : 0.5), cloth)
  torso.position.y = longRobe ? 1.3 : 1.55; body.add(torso)
  const head = new THREE.Mesh(new THREE.SphereGeometry(female ? 0.32 : 0.34, 10, 8), lam(skin)); head.position.y = 2.35; body.add(head)
  // face
  for (const x of [-0.12, 0.12]) add(0.07, 0.08, 0.04, 0x1a0f08, x, 2.4, -0.31)
  add(0.14, 0.03, 0.04, 0x7a2a22, 0, 2.2, -0.31)
  if (female && !kid) for (const x of [-0.34, 0.34]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), lam(0xf5b91c)); e.position.set(x, 2.28, 0); body.add(e) }
  const hs = look.hairStyle
  const capOn = wear.includes('cap') || outfit === 'siteWork' || (outfit === 'traditional' && !female)
  if (!capOn) {
    if (hs === 'afro') { const h = new THREE.Mesh(new THREE.SphereGeometry(0.46, 10, 8), lam(hair)); h.position.set(0, 2.5, 0.15); body.add(h) }
    else if (hs !== 'bald') {
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.37, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), lam(hair)); h.position.y = 2.38; body.add(h)
      if (hs === 'braids') for (const x of [-0.3, -0.1, 0.1, 0.3]) add(0.09, female ? 0.95 : 0.6, 0.09, hair, x, female ? 1.95 : 2.1, 0.12)
      if (hs === 'locs') for (const x of [-0.32, -0.16, 0.16, 0.32]) add(0.1, 0.75, 0.1, hair, x, 2.0, 0.1)
      if (hs === 'cornrows') for (const x of [-0.18, 0, 0.18]) add(0.05, 0.04, 0.62, new THREE.Color(hairHex).multiplyScalar(0.55), x, 2.69, 0)
      if (hs === 'bun') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), lam(hair)); b.position.set(0, 2.78, 0); body.add(b) }
      if (hs === 'ponytail') { add(0.14, 0.7, 0.14, hair, 0, 2.15, 0.36).rotation.x = -0.35 }
      if (hs === 'gele') {
        const w = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.36, 0.66), cloth); w.position.set(0, 2.72, 0); body.add(w)
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.4), cloth); tail.position.set(0.3, 2.98, -0.05); tail.rotation.z = -0.4; body.add(tail)
      }
    }
  }
  // outfits
  if (outfit === 'hoodie') { const hood = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.5), lam(top)); hood.position.set(0, 2.1, 0.12); body.add(hood); add(0.5, 0.26, 0.06, new THREE.Color(topHex).multiplyScalar(0.8), 0, 1.25, -0.27) }
  if (outfit === 'office') { add(0.9 + (female ? -0.14 : 0), 1.0, 0.54, '#25283a', 0, 1.55, 0).scale.set(1.02, 1, 1.02); add(0.3, 0.55, 0.05, '#ffffff', 0, 1.78, -0.275); if (!female) add(0.09, 0.6, 0.05, 0xc4562a, 0, 1.64, -0.29); else add(0.5, 0.1, 0.06, 0xf5b91c, 0, 1.2, -0.28) }
  if (outfit === 'siteWork') { add(bw + 0.06, 1.0, 0.54, '#e6a817', 0, 1.55, 0); add(bw + 0.08, 0.12, 0.56, '#e8e8e8', 0, 1.35, 0); const hat = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), lam(0xffd23f)); hat.position.y = 2.46; body.add(hat); add(0.7, 0.05, 0.28, 0xffd23f, 0, 2.5, -0.32) }
  if (outfit === 'traditional' && !female) add(0.5, 0.22, 0.46, topHex, 0, 2.7, 0).scale.set(1.1, 1, 1.1) // fila cap
  if (outfit === 'owambe' && !female) add(1.5, 1.0, 0.5, cloth, 0, 1.35, 0) // wide agbada sleeves
  if (opts.uniform) add(0.3, 0.45, 0.05, 0x1f3a7a, 0, 1.8, -0.27)
  // facial hair
  if (!female && look.facialHair === 'beard') add(0.4, 0.26, 0.1, hair, 0, 2.18, -0.27)
  if (!female && look.facialHair === 'stubble') { const m = lam(hair); m.transparent = true; m.opacity = 0.4; add(0.38, 0.24, 0.08, m, 0, 2.18, -0.28) }
  // heirloom
  if (wear.includes('chain')) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 6, 14), lam(0xf5c518)); c.rotation.x = Math.PI / 2; c.position.y = 2.03; body.add(c); const pend = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), lam(0xf5c518)); pend.position.set(0, 1.78, -0.3); body.add(pend) }
  if (wear.includes('badge')) { add(0.07, 0.62, 0.04, 0x1c7ea6, 0, 1.75, -0.29); add(0.22, 0.28, 0.04, 0xffffff, 0, 1.38, -0.3); add(0.22, 0.07, 0.05, 0x0f7a4a, 0, 1.5, -0.3) }
  if (wear.includes('pouch')) { add(0.28, 0.3, 0.2, 0x7a4a2a, 0.5, 1.15, -0.1); add(0.3, 0.06, 0.22, 0xe6a817, 0.5, 1.3, -0.1) }
  if (wear.includes('scarf')) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.34, 0.16, 10), fabricMat('ankara', '#c4562a', '#1d2f6f')); sc.position.y = 2.06; body.add(sc); add(0.16, 0.5, 0.05, '#c4562a', -0.15, 1.8, -0.3) }
  if (wear.includes('glasses')) { for (const x of [-0.13, 0.13]) add(0.17, 0.13, 0.03, 0x111111, x, 2.4, -0.33); add(0.1, 0.03, 0.03, 0x111111, 0, 2.42, -0.33) }
  if (wear.includes('backpack')) { add(0.7, 0.9, 0.3, 0x1c7ea6, 0, 1.6, 0.4); add(0.5, 0.35, 0.06, 0x14587a, 0, 1.45, 0.57) }
  if (wear.includes('cap')) { const cp = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.5), lam(0xc4262e)); cp.position.y = 2.4; body.add(cp); add(0.5, 0.05, 0.3, 0xc4262e, 0, 2.43, -0.38) }
  const limb = (x: number, w: number, c: THREE.Color, y: number, h: number) => { const p = new THREE.Group(); p.position.set(x, y, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), lam(c)); m.position.y = -h / 2; p.add(m); body.add(p); return p }
  const lw = female ? 0.26 : 0.3
  const legL = limb(female ? -0.17 : -0.2, lw, bot, 1.05, 1.0), legR = limb(female ? 0.17 : 0.2, lw, bot, 1.05, 1.0)
  // wrappers and skirts (women's owambe, traditional and office wear)
  if (female && (outfit === 'owambe' || outfit === 'traditional')) { const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.66, 1.05, 12), fabricMat(look.fabric, botHex === topHex ? '#c4562a' : botHex, topHex)); sk.position.y = 0.62; body.add(sk) }
  if (female && outfit === 'office') { const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.8, 10), lam('#25283a')); sk.position.y = 0.85; body.add(sk) }
  const sleeve = outfit === 'office' || outfit === 'hoodie' || outfit === 'siteWork' || outfit === 'traditional' || outfit === 'owambe'
  const armC = sleeve ? top : skin
  const armL = limb(-(bw / 2 + 0.13), 0.22, armC, 1.95, 0.9), armR = limb(bw / 2 + 0.13, 0.22, armC, 1.95, 0.9)
  body.rotation.y = Math.PI
  group.add(body)
  group.scale.setScalar(s * 0.9)
  return { group, body, legL, legR, armL, armR }
}

export function animateHuman(p: HumanParts, t: number, moving: boolean, speed = 1) {
  if (!moving) { p.legL.rotation.x = p.legR.rotation.x = p.armL.rotation.x = p.armR.rotation.x = 0; p.body.position.y = 0; return }
  const sw = Math.sin(t * 9 * speed) * 0.8
  p.legL.rotation.x = sw; p.legR.rotation.x = -sw; p.armL.rotation.x = -sw * 0.8; p.armR.rotation.x = sw * 0.8
  p.body.position.y = Math.abs(Math.sin(t * 9 * speed)) * 0.07
}

export function hashLook(name: string, gender: 'male' | 'female'): Appearance {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  const tops = ['#2b3a8c', '#0f7a4a', '#c4562a', '#e6a817', '#8a1c6a', '#1c7ea6', '#d62828', '#6d2a8f']
  const hairs = gender === 'male' ? ['afro', 'lowcut', 'lowcut', 'bald'] : ['braids', 'afro', 'bun', 'gele', 'ponytail']
  return { skinTone: 2 + (h % 8), faceShape: h % 4, hairStyle: hairs[h % hairs.length], hairColor: '#141414', outfitType: 'casual', fabric: 'plain', topColor: tops[(h >> 3) % tops.length], bottomColor: ['#222222', '#2b3a8c', '#4a3320'][(h >> 5) % 3] }
}
