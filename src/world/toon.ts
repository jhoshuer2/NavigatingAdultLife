// The V2 cast: chunky, expressive cartoon people built in code to match the character sheets (big head and eyes, bold simple shapes, cream tee and
// cargo trousers, sneakers, backpacks, headwraps and beards). Returns the same HumanParts as buildHuman, so animateHuman, exercisePose and every
// scene keep working, plus a face that changes expression.
import * as THREE from 'three'
import type { HumanParts } from './characters'

export type BodyType = 'boy' | 'girl' | 'man' | 'woman'
export type HairStyle = 'curlyTop' | 'lowcut' | 'twists' | 'bun' | 'headwrap' | 'afro' | 'bald' | 'braids'
export type TopStyle = 'tee' | 'overshirt' | 'hoodie' | 'apron' | 'tunic' | 'blouse' | 'polo'
export type BottomStyle = 'cargo' | 'shorts' | 'jeans' | 'wrap' | 'trousers'
export type Accessory = 'backpack' | 'crossbag' | 'cap' | 'headphones' | 'towel' | 'watch' | 'glasses' | 'earrings' | 'smileyChain' | 'smileyKey' | 'tote' | 'bag'
export type Expression = 'neutral' | 'happy' | 'laughing' | 'confident' | 'thinking' | 'curious' | 'suspicious' | 'angry' | 'surprised' | 'tired' | 'worried' | 'disappointed' | 'cheeky' | 'proud' | 'calm'
export const EXPRESSIONS: Expression[] = ['neutral', 'happy', 'laughing', 'confident', 'thinking', 'curious', 'suspicious', 'angry', 'surprised', 'tired', 'worried', 'disappointed', 'cheeky', 'proud', 'calm']

export interface ToonSpec {
  id: string
  name: string
  body: BodyType
  skin: string
  hair: HairStyle
  hairColor: string
  beard?: 'full' | 'grey'
  top: TopStyle
  topColor: string
  /** the colour of the tee under an overshirt, or of an apron's tee */
  innerColor?: string
  bottom: BottomStyle
  bottomColor: string
  shoes: 'sneaker' | 'sandal'
  /** wax-print wrapper (skirt) and head wrap colours */
  printA?: string
  printB?: string
  accessories: Accessory[]
  /** overall size multiplier, chibi proportions are already built in */
  size?: number
}

export interface ToonParts extends HumanParts {
  setExpression: (e: Expression) => void
  expression: Expression
}

const lam = (c: THREE.ColorRepresentation) => new THREE.MeshLambertMaterial({ color: c })
const basic = (c: THREE.ColorRepresentation) => new THREE.MeshBasicMaterial({ color: c })

const printCache = new Map<string, THREE.Material>()
/** Orange, green and yellow wax-print flowers like Mama Folake's wrapper and headwrap. */
function printMat(a: string, b: string): THREE.Material {
  if (typeof document === 'undefined') return lam(a)
  const key = a + b
  const hit = printCache.get(key); if (hit) return hit
  const c = document.createElement('canvas'); c.width = c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = '#1f2a22'; g.fillRect(0, 0, 64, 64)
  for (const [x, y, r] of [[16, 16, 14], [48, 44, 14], [50, 10, 7], [10, 50, 7]] as const) {
    g.fillStyle = a; g.beginPath(); for (let k = 0; k < 6; k++) { const an = (k / 6) * Math.PI * 2; g.moveTo(x, y); g.arc(x + Math.cos(an) * r * 0.55, y + Math.sin(an) * r * 0.55, r * 0.55, 0, 7) } g.fill()
    g.fillStyle = b; g.beginPath(); g.arc(x, y, r * 0.3, 0, 7); g.fill()
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(1.4, 1.4)
  const m = new THREE.MeshLambertMaterial({ map: t }); printCache.set(key, m); return m
}

/** Mouth shapes: a smile or frown arc, an open oval, a flat line. */
type Mouth = 'smile' | 'grin' | 'open' | 'flat' | 'frown' | 'smirk' | 'o'
const FACE: Record<Expression, { brow: [number, number]; browY: number; eye: number; look: [number, number]; mouth: Mouth; blush?: boolean }> = {
  neutral: { brow: [0, 0], browY: 0, eye: 1, look: [0, 0], mouth: 'flat' },
  happy: { brow: [0.1, -0.1], browY: 0.02, eye: 1, look: [0, 0], mouth: 'smile' },
  laughing: { brow: [0.2, -0.2], browY: 0.05, eye: 0.55, look: [0, 0], mouth: 'grin' },
  confident: { brow: [0.0, -0.25], browY: 0.03, eye: 0.85, look: [0, 0], mouth: 'smirk' },
  thinking: { brow: [0.0, 0.3], browY: 0.05, eye: 0.9, look: [0.5, 0.5], mouth: 'flat' },
  curious: { brow: [0.1, -0.1], browY: 0.08, eye: 1.1, look: [0.4, 0.3], mouth: 'o' },
  suspicious: { brow: [-0.3, 0.3], browY: -0.02, eye: 0.6, look: [0.6, 0], mouth: 'flat' },
  angry: { brow: [-0.5, 0.5], browY: -0.05, eye: 0.8, look: [0, 0], mouth: 'frown' },
  surprised: { brow: [0, 0], browY: 0.14, eye: 1.3, look: [0, 0], mouth: 'o' },
  tired: { brow: [0.15, -0.15], browY: -0.04, eye: 0.4, look: [0, -0.4], mouth: 'flat' },
  worried: { brow: [0.4, -0.4], browY: 0.06, eye: 1, look: [0, -0.2], mouth: 'frown' },
  disappointed: { brow: [0.3, -0.3], browY: 0, eye: 0.7, look: [0, -0.5], mouth: 'frown' },
  cheeky: { brow: [0.1, -0.35], browY: 0.04, eye: 0.9, look: [0.4, 0], mouth: 'smirk', blush: true },
  proud: { brow: [0.05, -0.2], browY: 0.05, eye: 0.75, look: [0, 0.3], mouth: 'smile' },
  calm: { brow: [0.05, -0.05], browY: 0, eye: 0.5, look: [0, 0], mouth: 'smile' },
}

export function buildToon(spec: ToonSpec): ToonParts {
  const group = new THREE.Group(), body = new THREE.Group()
  const kid = spec.body === 'boy' || spec.body === 'girl'
  const female = spec.body === 'girl' || spec.body === 'woman'
  const heavy = spec.body === 'woman'
  const skin = lam(spec.skin), skinC = new THREE.Color(spec.skin)
  const hairC = new THREE.Color(spec.hairColor), hairM = lam(hairC)
  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m }
  const box = (parent: THREE.Object3D, w: number, h: number, d: number, mat: THREE.Material | string, x: number, y: number, z: number) => add(parent, new THREE.BoxGeometry(w, h, d), typeof mat === 'string' ? lam(mat) : mat, x, y, z)
  const ball = (parent: THREE.Object3D, r: number, mat: THREE.Material | string, x: number, y: number, z: number, seg = 10) => add(parent, new THREE.SphereGeometry(r, seg, Math.max(6, seg - 2)), typeof mat === 'string' ? lam(mat) : mat, x, y, z)

  // proportions: a big head on a short sturdy body, heavier build for the woman, a taller frame for the man
  const bw = heavy ? 1.0 : spec.body === 'man' ? 0.98 : female ? 0.82 : 0.84
  const bh = kid ? 0.92 : 1.0
  const legH = kid ? 0.9 : 1.0
  const hipY = legH + 0.12
  const torsoY = hipY + bh / 2
  const headY = hipY + bh + 0.62
  const topMat = lam(spec.topColor)
  const innerMat = lam(spec.innerColor ?? '#f3e7cf')

  // torso and top
  if (spec.top === 'overshirt') {
    box(body, bw, bh, 0.56, innerMat, 0, torsoY, 0)
    for (const s of [-1, 1]) box(body, bw * 0.32, bh + 0.02, 0.6, topMat, s * bw * 0.36, torsoY, 0)
  } else if (spec.top === 'apron') {
    box(body, bw, bh, heavy ? 0.7 : 0.56, innerMat, 0, torsoY, 0)
    box(body, bw * 0.78, bh + 0.15, heavy ? 0.74 : 0.6, topMat, 0, torsoY - 0.08, -0.02)
    box(body, 0.1, bh * 0.7, 0.05, topMat, -bw * 0.32, torsoY + 0.35, -0.3)
  } else if (spec.top === 'tunic') {
    box(body, bw + 0.14, bh + 0.5, 0.62, topMat, 0, torsoY - 0.2, 0)
  } else if (spec.top === 'hoodie') {
    box(body, bw + 0.04, bh, 0.6, topMat, 0, torsoY, 0)
    box(body, 0.55, 0.28, 0.08, new THREE.Color(spec.topColor).multiplyScalar(0.8).getStyle(), 0, torsoY - 0.25, -0.34)
    ball(body, 0.46, topMat, 0, headY - 0.78, 0.2, 9).scale.set(1.1, 0.5, 0.9)
  } else {
    box(body, bw, bh, heavy ? 0.66 : 0.54, topMat, 0, torsoY, 0)
    if (spec.top === 'blouse') box(body, bw * 0.4, 0.1, 0.06, '#f5b91c', 0, torsoY + bh / 2 - 0.1, -0.3)
  }
  // neck
  box(body, 0.32, 0.18, 0.3, skin, 0, hipY + bh + 0.06, 0)

  // head, ears, face
  const head = new THREE.Group(); head.position.set(0, headY, 0); body.add(head)
  const hr = kid ? 0.62 : 0.58
  ball(head, hr, skin, 0, 0, 0, 14).scale.set(1.05, 0.98, 0.95)
  for (const s of [-1, 1]) { const e = ball(head, 0.14, skin, s * (hr + 0.03), -0.02, 0, 8); e.scale.set(0.7, 1, 0.8) }
  const face = new THREE.Group(); face.position.set(0, 0, -hr * 0.93); head.add(face)
  const eyeW: THREE.Mesh[] = [], pupils: THREE.Mesh[] = [], brows: THREE.Mesh[] = []
  const browMat = lam(spec.hairColor === '#d8d8d8' ? '#3a3a3a' : new THREE.Color(spec.hairColor).multiplyScalar(0.8).getStyle())
  for (const s of [-1, 1]) {
    const w = ball(face, 0.17, basic('#ffffff'), s * 0.23, 0.06, 0, 10); w.scale.set(1, 1.15, 0.5); eyeW.push(w)
    const p = ball(face, 0.085, basic('#16100c'), s * 0.23, 0.05, -0.05, 8); p.scale.set(1, 1.1, 0.6); pupils.push(p)
    ball(face, 0.03, basic('#ffffff'), s * 0.23 - 0.02, 0.1, -0.09, 6)
    const b = box(face, 0.24, 0.06, 0.06, browMat, s * 0.23, 0.3, -0.02); brows.push(b)
  }
  box(face, 0.1, 0.12, 0.08, new THREE.Color(spec.skin).multiplyScalar(0.92).getStyle(), 0, -0.07, -0.07).scale.set(1, 1, 0.8) // nose
  const mouthRoot = new THREE.Group(); mouthRoot.position.set(0, -0.26, -0.02); face.add(mouthRoot)
  const arc = (rot: number) => { const m = add(mouthRoot, new THREE.TorusGeometry(0.15, 0.03, 6, 14, Math.PI), basic('#3a0f0c'), 0, 0, 0); m.rotation.z = rot; return m }
  const mSmile = arc(Math.PI), mFrown = arc(0); mFrown.position.y = -0.06
  const mOpen = ball(mouthRoot, 0.13, basic('#2a0806'), 0, -0.02, 0, 8); mOpen.scale.set(1.1, 0.8, 0.4)
  const mTongue = ball(mouthRoot, 0.07, basic('#e0607a'), 0, -0.07, -0.02, 6); mTongue.scale.set(1.2, 0.6, 0.4)
  const mFlat = box(mouthRoot, 0.22, 0.04, 0.04, '#3a0f0c', 0, 0, 0)
  const mO = ball(mouthRoot, 0.07, basic('#2a0806'), 0, -0.02, 0, 8); mO.scale.set(1, 1.2, 0.4)
  const blush = [-1, 1].map((s) => { const b = ball(face, 0.1, basic('#e0705a'), s * 0.36, -0.12, 0.02, 6); b.scale.set(1, 0.6, 0.2); b.visible = false; return b })

  // hair
  const curl = (n: number, radius: number, r0: number, y0: number, spread = 1) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, ring = i % 2 ? 0.55 : 0.95
      ball(head, r0 * (0.8 + (i % 3) * 0.1), hairM, Math.cos(a) * radius * ring * spread, y0 + (i % 2 ? 0.14 : 0), Math.sin(a) * radius * ring * 0.9 + 0.04, 7)
    }
  }
  if (spec.hair === 'curlyTop') { curl(14, 0.4, 0.2, hr * 0.62); ball(head, 0.38, hairM, 0, hr * 0.72, 0.04, 9) }
  else if (spec.hair === 'lowcut') { const h = add(head, new THREE.SphereGeometry(hr * 1.04, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.46), hairM, 0, 0.03, 0.02); h.scale.set(1.05, 1, 1) }
  else if (spec.hair === 'twists') { curl(16, 0.42, 0.17, hr * 0.7); for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; add(head, new THREE.CylinderGeometry(0.06, 0.08, 0.28, 6), hairM, Math.cos(a) * 0.36, hr * 0.78, Math.sin(a) * 0.34) } }
  else if (spec.hair === 'afro') ball(head, hr * 1.2, hairM, 0, hr * 0.32, 0.12, 10)
  else if (spec.hair === 'bun') {
    const cap = add(head, new THREE.SphereGeometry(hr * 1.04, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), hairM, 0, 0.03, 0.02); cap.scale.set(1.05, 1, 1)
    curl(8, 0.45, 0.2, hr * 0.62); ball(head, 0.36, hairM, 0, hr * 1.0, 0.12, 9)
    for (let i = 0; i < 7; i++) ball(head, 0.14, hairM, Math.cos(i * 0.9) * 0.38, hr * 1.08 + Math.sin(i * 1.7) * 0.12, 0.1 + Math.sin(i * 0.9) * 0.28, 6)
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) ball(head, 0.1, hairM, s * (hr * 0.98), -0.1 - k * 0.14, -0.1 - k * 0.04, 6)
  } else if (spec.hair === 'braids') {
    const cap = add(head, new THREE.SphereGeometry(hr * 1.04, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), hairM, 0, 0.03, 0.02); cap.scale.set(1.05, 1, 1)
    for (const x of [-0.42, -0.22, 0.22, 0.42]) box(head, 0.1, 0.9, 0.1, hairM, x, -0.5, 0.3)
  } else if (spec.hair === 'headwrap') {
    const wm = printMat(spec.printA ?? '#e07a1f', spec.printB ?? '#f5b91c')
    ball(head, hr * 1.12, wm, 0, hr * 0.36, 0.04, 12).scale.set(1.06, 0.85, 1.05)
    ball(head, 0.34, wm, 0.14, hr * 1.0, 0.02, 8)
    ball(head, 0.22, wm, -0.26, hr * 0.92, 0.04, 8)
  }
  // beard
  if (spec.beard) {
    const bm = lam(spec.beard === 'grey' ? '#2a2a2a' : hairC)
    const jaw = add(head, new THREE.SphereGeometry(hr * 0.98, 12, 8, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.42), bm, 0, -0.02, -0.04); jaw.scale.set(1.03, 1, 0.98)
    if (spec.beard === 'grey') for (let i = 0; i < 9; i++) ball(head, 0.05, lam('#bdbdbd'), -0.34 + i * 0.085, -0.38 - Math.abs(i - 4) * 0.02, -hr * 0.8, 5)
    box(head, 0.28, 0.07, 0.06, bm, 0, -0.18, -hr * 0.9) // moustache
  }
  // earrings
  if (spec.accessories.includes('earrings') || spec.body === 'girl' || spec.body === 'woman') for (const s of [-1, 1]) { const r = add(head, new THREE.TorusGeometry(0.07, 0.016, 6, 12), lam('#f5b91c'), s * (hr + 0.06), -0.2, 0); r.rotation.y = Math.PI / 2 }

  // arms: short sleeve on top, skin below, with a hand
  const sleeveMat = spec.top === 'hoodie' || spec.top === 'tunic' ? topMat : spec.top === 'overshirt' ? topMat : spec.top === 'apron' ? innerMat : topMat
  const armLen = kid ? 0.78 : 0.9
  const armX = bw / 2 + 0.13
  const eh = armLen * 0.5 // the elbow: the arm is two pieces so it can bend
  const limb = (x: number, y: number, w: number, h: number, sleeveFrac: number, skinMat: THREE.Material, sMat: THREE.Material) => {
    const p = new THREE.Group(); p.position.set(x, y, 0)
    const lo = new THREE.Group(); lo.position.y = -eh; p.add(lo)
    const piece = (y0: number, y1: number, pw: number, mat: THREE.Material) => { // y0 above y1, both measured down from the shoulder
      if (y1 <= eh) box(p, pw, y1 - y0, pw, mat, 0, -(y0 + y1) / 2, 0)
      else if (y0 >= eh) box(lo, pw, y1 - y0, pw, mat, 0, -(y0 + y1) / 2 + eh, 0)
      else { box(p, pw, eh - y0, pw, mat, 0, -(y0 + eh) / 2, 0); box(lo, pw, y1 - eh, pw, mat, 0, -(eh + y1) / 2 + eh, 0) }
    }
    const sh = h * sleeveFrac
    piece(0, sh, w, sMat); piece(sh, h, w * 0.82, skinMat)
    ball(lo, w * 0.5, skinMat, 0, -h + eh - 0.02, 0, 6)
    const hand = new THREE.Object3D(); hand.position.set(0, -h + eh - 0.02, 0); lo.add(hand)
    body.add(p); return { p, lo, hand }
  }
  const longSleeve = spec.top === 'hoodie' || spec.top === 'tunic'
  const aL = limb(-armX, hipY + bh - 0.1, 0.28, armLen, longSleeve ? 0.95 : 0.42, skin, sleeveMat), aR = limb(armX, hipY + bh - 0.1, 0.28, armLen, longSleeve ? 0.95 : 0.42, skin, sleeveMat)
  const armL = aL.p, armR = aR.p

  // legs, bottoms and shoes (two pieces each, so knees bend)
  const botMat = lam(spec.bottomColor)
  const lw = spec.bottom === 'cargo' || spec.bottom === 'jeans' ? 0.42 : 0.34
  const kh = legH * 0.5
  const legGroup = (x: number) => {
    const p = new THREE.Group(); p.position.set(x, hipY, 0)
    const lo = new THREE.Group(); lo.position.y = -kh; p.add(lo)
    const piece = (y0: number, y1: number, pw: number, pd: number, mat: THREE.Material | string) => {
      if (y1 <= kh) box(p, pw, y1 - y0, pd, mat, 0, -(y0 + y1) / 2, 0)
      else if (y0 >= kh) box(lo, pw, y1 - y0, pd, mat, 0, -(y0 + y1) / 2 + kh, 0)
      else { box(p, pw, kh - y0, pd, mat, 0, -(y0 + kh) / 2, 0); box(lo, pw, y1 - kh, pd, mat, 0, -(kh + y1) / 2 + kh, 0) }
    }
    const short = spec.bottom === 'shorts'
    const wrap = spec.bottom === 'wrap'
    const upper = short ? legH * 0.5 : legH * 0.86
    if (!wrap) {
      piece(0, upper, lw, lw + 0.04, botMat)
      if (short) piece(upper, upper + legH * 0.4, lw * 0.76, lw * 0.76, skin)
      if (spec.bottom === 'cargo') { box(lo, lw + 0.06, 0.06, lw + 0.1, botMat, 0, -legH * 0.82 + kh, 0); box(p, 0.05, 0.3, 0.28, new THREE.Color(spec.bottomColor).multiplyScalar(0.85).getStyle(), x < 0 ? -lw / 2 - 0.03 : lw / 2 + 0.03, -0.38, 0) }
    } else piece(0, legH * 0.9, 0.26, 0.26, skin)
    const sh = spec.shoes === 'sandal' ? lam('#1c1b22') : lam('#f2ead8')
    const sole = box(lo, lw + 0.08, 0.14, 0.62, sh, 0, -legH - 0.02 + kh, -0.1)
    if (spec.shoes === 'sneaker') { box(lo, lw + 0.1, 0.08, 0.5, '#1c1b22', 0, -legH + 0.05 + kh, -0.14); box(lo, 0.04, 0.14, 0.34, '#1c1b22', x < 0 ? -(lw + 0.08) / 2 : (lw + 0.08) / 2, -legH + kh, -0.1) } else sole.scale.set(1, 0.6, 1)
    body.add(p); return { p, lo }
  }
  const gL = legGroup(-0.24), gR = legGroup(0.24)
  const legL = gL.p, legR = gR.p
  if (spec.bottom === 'wrap') { // wax-print wrapper skirt
    const sk = add(body, new THREE.CylinderGeometry(bw * 0.58, bw * 0.95, legH * 1.05, 14), printMat(spec.printA ?? '#e07a1f', spec.printB ?? '#f5b91c'), 0, hipY - legH * 0.5 + 0.08, 0)
    sk.scale.set(1, 1, 0.82)
  }

  // accessories
  const acc = spec.accessories
  if (acc.includes('backpack')) { box(body, bw * 0.78, bh * 0.95, 0.34, '#1c1b22', 0, torsoY + 0.02, 0.5); box(body, bw * 0.5, 0.32, 0.08, '#2a2a30', 0, torsoY - 0.2, 0.7); for (const s of [-1, 1]) box(body, 0.1, bh * 0.95, 0.06, '#1c1b22', s * bw * 0.3, torsoY, -0.3) }
  if (acc.includes('crossbag')) { const strap = box(body, 0.09, bh * 1.35, 0.06, '#1c1b22', -0.05, torsoY, -0.32); strap.rotation.z = -0.62; box(body, 0.4, 0.42, 0.22, '#1c1b22', bw / 2 + 0.2, hipY + 0.08, -0.05); box(body, 0.42, 0.1, 0.24, '#2a2a30', bw / 2 + 0.2, hipY + 0.26, -0.05) }
  if (acc.includes('tote')) { box(body, 0.46, 0.5, 0.2, '#e07a1f', bw / 2 + 0.28, hipY - 0.2, -0.1); box(body, 0.4, 0.05, 0.05, '#1f4a2e', bw / 2 + 0.28, hipY + 0.14, -0.1) }
  if (acc.includes('bag')) { box(body, 0.5, 0.42, 0.26, '#1c1b22', -bw / 2 - 0.3, hipY - 0.1, -0.1); box(body, 0.36, 0.06, 0.06, '#f5b91c', -bw / 2 - 0.3, hipY + 0.14, -0.1) }
  if (acc.includes('towel')) { box(body, 0.34, 0.12, 0.7, '#f4efe4', -bw / 2 - 0.02, hipY + bh + 0.06, -0.02); box(body, 0.35, 0.03, 0.7, '#2f8a5a', -bw / 2 - 0.02, hipY + bh + 0.13, -0.02); box(body, 0.2, 0.62, 0.12, '#f4efe4', -bw / 2 + 0.04, hipY + bh - 0.28, -0.32); box(body, 0.2, 0.05, 0.13, '#2f8a5a', -bw / 2 + 0.04, hipY + bh - 0.38, -0.32) }
  if (acc.includes('watch')) { const w = box(aL.lo, 0.3, 0.12, 0.3, '#2a2a30', 0, -armLen + 0.12 + eh, 0); w.scale.set(1, 1, 1); box(aL.lo, 0.1, 0.08, 0.08, '#cfcfcf', 0, -armLen + 0.12 + eh, -0.17) }
  if (acc.includes('glasses')) { for (const s of [-1, 1]) { const r = add(face, new THREE.TorusGeometry(0.17, 0.025, 6, 14), basic('#14110e'), s * 0.23, 0.06, -0.06); r.scale.set(1, 1.1, 1) } box(face, 0.1, 0.03, 0.03, '#14110e', 0, 0.08, -0.06) }
  if (acc.includes('cap')) { const cp = add(head, new THREE.SphereGeometry(hr * 1.06, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), lam('#1c1b22'), 0, 0.06, 0.02); cp.scale.set(1.05, 1.02, 1); box(head, 0.7, 0.07, 0.4, '#1c1b22', 0, 0.12, -hr * 0.9); box(head, 0.2, 0.12, 0.04, '#f5b91c', 0, 0.3, -hr * 0.98) }
  if (acc.includes('headphones')) { const band = add(head, new THREE.TorusGeometry(hr * 1.02, 0.05, 6, 16, Math.PI), lam('#1c1b22'), 0, 0, 0); band.rotation.z = 0; for (const s of [-1, 1]) box(head, 0.16, 0.34, 0.3, '#1c1b22', s * (hr + 0.1), -0.04, 0) }
  if (acc.includes('smileyChain') || acc.includes('smileyKey')) { const sm = ball(body, 0.12, basic('#f5c518'), -bw / 2 - 0.06, hipY - 0.1, -0.3, 8); sm.scale.set(1, 1, 0.4); ball(sm, 0.02, basic('#14110e'), -0.04, 0.03, -0.1, 4); ball(sm, 0.02, basic('#14110e'), 0.04, 0.03, -0.1, 4) }

  body.rotation.y = Math.PI
  group.add(body)
  group.scale.setScalar((spec.size ?? 1) * (kid ? 0.78 : 0.86))

  const parts = { group, body, legL, legR, armL, armR, elbowL: aL.lo, elbowR: aR.lo, handL: aL.hand, handR: aR.hand, kneeL: gL.lo, kneeR: gR.lo, head, expression: 'neutral' as Expression, setExpression: (_e: Expression) => {} } as ToonParts
  parts.setExpression = (e: Expression) => {
    const f = FACE[e]
    parts.expression = e
    brows[0].rotation.z = -f.brow[0]; brows[1].rotation.z = -f.brow[1]
    brows.forEach((b) => { b.position.y = 0.3 + f.browY })
    eyeW.forEach((w, i) => { w.scale.y = 1.15 * f.eye; pupils[i].scale.y = 1.1 * Math.min(1, f.eye + 0.2); pupils[i].position.x = (i ? 1 : -1) * 0.23 + f.look[0] * 0.04; pupils[i].position.y = 0.05 + f.look[1] * 0.04 })
    mSmile.visible = f.mouth === 'smile' || f.mouth === 'smirk'; mSmile.rotation.z = Math.PI; mSmile.scale.set(f.mouth === 'smirk' ? 0.8 : 1, f.mouth === 'smirk' ? 0.7 : 1, 1); mSmile.position.x = f.mouth === 'smirk' ? 0.05 : 0
    mFrown.visible = f.mouth === 'frown'
    mOpen.visible = f.mouth === 'grin'; mTongue.visible = f.mouth === 'grin'
    mFlat.visible = f.mouth === 'flat'
    mO.visible = f.mouth === 'o'
    blush.forEach((b) => { b.visible = !!f.blush })
  }
  parts.setExpression('neutral')
  void skinC
  return parts
}
