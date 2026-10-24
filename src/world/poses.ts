// Body poses for the sheet-style toon: carrying a tray or a box, reaching a shelf, bending to the floor, handing something over, sitting, eating, talking,
// writing, chopping and so on. A pose is a function of time that returns target angles for each joint; applyPose blends from standing to the target by `k`
// (0..1), so every pose resets what the one before it touched. `upper: false` leaves the legs alone (carrying while walking).
import type { HumanParts } from './characters'

export type Pose =
  | 'stand' | 'carryTray' | 'carryBox' | 'reachHigh' | 'pickLow' | 'grab' | 'handOver' | 'sit' | 'sitEat' | 'eat' | 'drink' | 'wave' | 'talk' | 'point'
  | 'shakeHands' | 'knock' | 'write' | 'stamp' | 'chop' | 'stir' | 'pour' | 'sweep' | 'wipe' | 'countMoney' | 'phone' | 'lift' | 'dig' | 'digPhone' | 'search' | 'plank' | 'stretch' | 'cheer' | 'dribble' | 'kneelTie' | 'lean' | 'push' | 'tapeBox' | 'raiseHand' | 'typing'

/** target angles, in radians (and `hy` for how far the hips drop). Missing means 0. Authored so that a negative arm, thigh or elbow x lifts it forward and a
 *  positive knee x tucks the shin back, and a positive body or head x leans forward and down; applyPose flips the signs for the limbs and head, whose axes
 *  point the other way because the toon body is turned round. */
interface J { bx?: number; bz?: number; hy?: number; nx?: number; ny?: number; aLx?: number; aLz?: number; aRx?: number; aRz?: number; eLx?: number; eRx?: number; lLx?: number; lRx?: number; kLx?: number; kRx?: number }

const S = Math.sin, C = Math.cos
export const POSES: Record<Pose, (t: number) => J> = {
  stand: (t) => ({ hy: S(t * 2) * 0.01 }),
  carryTray: () => ({ aLx: -0.85, aRx: -0.85, eLx: -1.25, eRx: -1.25, bx: -0.04 }),
  carryBox: () => ({ aLx: -0.8, aRx: -0.8, eLx: -0.95, eRx: -0.95, bx: -0.14, nx: 0.1 }),
  lift: (t) => ({ aLx: -1.1 - S(t * 3) * 0.2, aRx: -1.1 - S(t * 3) * 0.2, eLx: -0.7, eRx: -0.7, bx: 0.35, lLx: -0.55, lRx: -0.55, kLx: 0.9, kRx: 0.9, hy: -0.25 }),
  reachHigh: () => ({ aRx: -2.9, eRx: -0.15, aLx: 0.15, bx: -0.12, nx: -0.3 }),
  pickLow: () => ({ bx: 0.62, lLx: -1.05, lRx: -0.85, kLx: 1.8, kRx: 1.6, hy: -0.6, aRx: -1.35, eRx: -0.25, aLx: -0.4, nx: 0.2 }),
  grab: () => ({ aRx: -1.45, eRx: -0.5, bx: 0.2, aLx: 0.1 }),
  handOver: (t) => ({ aRx: -1.55 + S(t * 4) * 0.04, eRx: -0.12, aLx: -0.15, bx: 0.14, nx: -0.05 }),
  sit: () => ({ hy: -0.5, lLx: -1.5, lRx: -1.5, kLx: 1.5, kRx: 1.5, aLx: -0.35, aRx: -0.35, eLx: -0.9, eRx: -0.9, bx: 0.03 }),
  sitEat: (t) => ({ hy: -0.5, lLx: -1.5, lRx: -1.5, kLx: 1.5, kRx: 1.5, aLx: -0.3, eLx: -0.7, aRx: -1.0 - Math.max(0, S(t * 5)) * 0.35, eRx: -1.45 - Math.max(0, S(t * 5)) * 0.5, bx: 0.1, nx: 0.12 }),
  eat: (t) => ({ aRx: -1.0 - Math.max(0, S(t * 5)) * 0.35, eRx: -1.45 - Math.max(0, S(t * 5)) * 0.5, aLx: -0.3, eLx: -0.7, bx: 0.08, nx: 0.12 }),
  drink: () => ({ aRx: -1.2, eRx: -2.0, nx: -0.28, bx: -0.04 }),
  wave: (t) => ({ aRx: -2.7, eRx: -0.2, aRz: S(t * 8) * 0.45, ny: S(t * 3) * 0.12 }),
  talk: (t) => ({ aLx: -0.7 + S(t * 3.1) * 0.25, eLx: -1.0 + S(t * 2.4) * 0.3, aRx: -0.55 + S(t * 2.3) * 0.3, eRx: -1.15 + S(t * 3.7) * 0.25, ny: S(t * 1.7) * 0.16, nx: S(t * 5) * 0.07 }),
  point: () => ({ aRx: -1.5, eRx: -0.05, bx: 0.08, ny: 0.1 }),
  shakeHands: (t) => ({ aRx: -1.3, eRx: -0.45 + S(t * 9) * 0.15, bx: 0.1, nx: 0.05 }),
  knock: (t) => ({ aRx: -1.55, eRx: -1.15 + S(t * 14) * 0.5, bx: 0.1 }),
  write: (t) => ({ bx: 0.3, aRx: -0.95, eRx: -1.2 + S(t * 10) * 0.1, aLx: -0.65, eLx: -0.85, nx: 0.45 }),
  stamp: (t) => ({ bx: 0.3, aRx: -1.15 + Math.max(0, S(t * 6)) * 0.55, eRx: -0.7, aLx: -0.65, eLx: -0.8, nx: 0.4 }),
  chop: (t) => ({ bx: 0.25, aRx: -1.0, eRx: -0.5 - Math.abs(S(t * 9)) * 1.0, aLx: -0.9, eLx: -0.55, nx: 0.35 }),
  stir: (t) => ({ bx: 0.2, aRx: -1.1 + C(t * 6) * 0.2, aRz: S(t * 6) * 0.25, eRx: -0.85, aLx: -0.4, nx: 0.3 }),
  pour: () => ({ bx: 0.15, aRx: -1.4, eRx: -0.8, aLx: -0.9, eLx: -0.9, nx: 0.3 }),
  sweep: (t) => ({ bx: 0.35, bz: S(t * 4) * 0.12, aLx: -1.0, aRx: -1.0, eLx: -0.4, eRx: -0.4, nx: 0.3 }),
  wipe: (t) => ({ bx: 0.4, aRx: -1.2 + S(t * 8) * 0.3, eRx: -0.3, aLx: -0.4, nx: 0.35 }),
  countMoney: (t) => ({ aLx: -1.0, aRx: -1.0, eLx: -1.5, eRx: -1.5 + S(t * 9) * 0.2, nx: 0.4 }),
  phone: () => ({ aRx: -1.2, eRx: -1.75, nx: 0.35 }),
  dig: (t) => ({ bx: 0.85, aLx: -1.6 + S(t * 22) * 0.7, aRx: -1.6 - S(t * 22) * 0.7, nx: 0.2 }),
  digPhone: () => ({ bx: 0.1, aRx: -2.8, eRx: -0.3 }),
  plank: (t) => ({ bx: 1.25, hy: 0, aLx: 1.2, aRx: 1.2, eLx: 0, eRx: 0, nx: -0.6 + S(t * 1.5) * 0.02, lLx: 0, lRx: 0 }),
  stretch: (t) => ({ aLx: -2.9, aRx: -2.9, bz: S(t * 1.6) * 0.18, nx: -0.15 }),
  cheer: (t) => ({ aLx: -2.7 + S(t * 9) * 0.2, aRx: -2.7 - S(t * 9) * 0.2, hy: Math.abs(S(t * 7)) * 0.25, nx: -0.2, ny: S(t * 3) * 0.2 }),
  dribble: (t) => ({ bx: 0.22, aLx: -0.5 + S(t * 8) * 0.3, aRx: -0.5 - S(t * 8) * 0.3, eLx: -0.5, eRx: -0.5, nx: 0.25 }),
  kneelTie: (t) => ({ hy: -0.75, lLx: -1.25, lRx: 0.4, kLx: 1.9, kRx: 1.6, bx: 0.7, aRx: -1.3, aLx: -1.3, eRx: -1.1 + S(t * 8) * 0.2, eLx: -1.0, nx: 0.5 }),
  push: (t) => ({ bx: 0.5, aLx: -1.5, aRx: -1.5, eLx: -0.1, eRx: -0.1, lLx: 0.5 + S(t * 5) * 0.2, lRx: -0.4 - S(t * 5) * 0.2, kLx: 0.2, kRx: 0.2, nx: 0.1 }),
  tapeBox: (t) => ({ hy: -0.7, bx: 0.8, lLx: -1.2, lRx: -1.0, kLx: 1.8, kRx: 1.7, aLx: -1.2, aRx: -1.1 + S(t * 6) * 0.2, eRx: -0.5, nx: 0.5 }),
  raiseHand: (t) => ({ aRx: -2.9 + S(t * 3) * 0.1, eRx: -0.1, aLx: -0.4, eLx: -1.2, nx: -0.15, bx: -0.04 }),
  typing: (t) => ({ aLx: -1.0, aRx: -1.0, eLx: -1.1 + S(t * 14) * 0.1, eRx: -1.1 - S(t * 14) * 0.1, bx: 0.15, nx: 0.45 }),
  lean: (t) => ({ bz: 0.06, aLx: 0.15, aRx: -0.35, eRx: -1.0, hy: S(t * 1.2) * 0.01, ny: 0.15 }),
  search: (t) => ({ bx: 0.6, aLx: -1.3 + S(t * 18) * 0.4, aRx: -1.3, nx: 0.2 }),
}

/** the pose that suits picking something up, by where it is and what it is */
export function poseForItem(shape: string, y: number): Pose {
  if (shape === 'stamp') return 'stamp'
  if (shape === 'paper' || shape === 'folder') return 'write'
  if (y > 1.35) return 'reachHigh'
  if (y < 0.7) return shape === 'crate' ? 'lift' : 'pickLow'
  if (shape === 'crate') return 'carryBox'
  return 'grab'
}
/** the pose while carrying something */
export const carryPoseFor = (shape: string): Pose => (shape === 'crate' || shape === 'bag' ? 'carryBox' : 'carryTray')

export function applyPose(p: HumanParts, pose: Pose, t: number, k = 1, upper = false): void {
  const j = POSES[pose](t), v = (x: number | undefined) => (x ?? 0) * k
  p.body.rotation.x = v(j.bx); p.body.rotation.z = v(j.bz)
  p.body.position.y = v(j.hy)
  if (p.head) p.head.rotation.set(-v(j.nx), v(j.ny), 0)
  p.armL.rotation.x = -v(j.aLx); p.armL.rotation.z = v(j.aLz); p.armR.rotation.x = -v(j.aRx); p.armR.rotation.z = v(j.aRz)
  if (p.elbowL) p.elbowL.rotation.x = -v(j.eLx)
  if (p.elbowR) p.elbowR.rotation.x = -v(j.eRx)
  if (upper) return // keep the walking legs
  p.legL.rotation.x = -v(j.lLx); p.legR.rotation.x = -v(j.lRx)
  if (p.kneeL) p.kneeL.rotation.x = -v(j.kLx)
  if (p.kneeR) p.kneeR.rotation.x = -v(j.kRx)
}
