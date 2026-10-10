// Procedural low-poly humans shared by the world. Matches the 2D avatar's AvatarConfig.
import * as THREE from 'three'
import type { Appearance } from '@engine/core/types'
import { SKIN_TONES } from '../ui/Avatar'

export interface HumanParts { group: THREE.Group; body: THREE.Group; legL: THREE.Object3D; legR: THREE.Object3D; armL: THREE.Object3D; armR: THREE.Object3D }

const lam = (c: number | THREE.Color) => new THREE.MeshLambertMaterial({ color: c })

export function buildHuman(opts: { look: Appearance; age: number; uniform?: boolean; scale?: number }): HumanParts {
  const { look, age } = opts
  const skin = new THREE.Color(SKIN_TONES[look.skinTone] ?? SKIN_TONES[4])
  const top = new THREE.Color(opts.uniform ? '#ffffff' : look.topColor)
  const bot = new THREE.Color(opts.uniform ? '#1f3a7a' : look.bottomColor)
  const hair = new THREE.Color(age >= 60 ? '#cccccc' : look.hairColor)
  const group = new THREE.Group()
  const body = new THREE.Group()
  const kid = age < 12
  const s = (opts.scale ?? 1) * (kid ? 0.72 : age < 18 ? 0.9 : 1)
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.5), lam(top)); torso.position.y = 1.55; body.add(torso)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), lam(skin)); head.position.y = 2.35; body.add(head)
  const hs = look.hairStyle
  if (hs === 'afro') { const h = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), lam(hair)); h.position.set(0, 2.45, -0.02); body.add(h) }
  else if (hs !== 'bald') {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.37, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), lam(hair)); h.position.y = 2.38; body.add(h)
    if (hs === 'braids' || hs === 'locs') for (const x of [-0.3, 0.3]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), lam(hair)); b.position.set(x, 2.05, 0.05); body.add(b) }
    if (hs === 'bun') { const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), lam(hair)); b.position.set(0, 2.78, 0); body.add(b) }
    if (hs === 'gele') { const w = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.6), lam(new THREE.Color(look.topColor))); w.position.set(0, 2.72, 0); body.add(w) }
  }
  const limb = (x: number, w: number, c: THREE.Color, y: number, h: number) => { const p = new THREE.Group(); p.position.set(x, y, 0); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), lam(c)); m.position.y = -h / 2; p.add(m); body.add(p); return p }
  const legL = limb(-0.2, 0.3, bot, 1.05, 1.0), legR = limb(0.2, 0.3, bot, 1.05, 1.0)
  const armL = limb(-0.58, 0.22, skin, 1.95, 0.9), armR = limb(0.58, 0.22, skin, 1.95, 0.9)
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
