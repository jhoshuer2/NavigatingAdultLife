import { describe, expect, it } from 'vitest'
import { buildToon } from '../src/world/toon'
import { neighbour } from '../src/world/castData'
import { applyPose, POSES, poseForItem, carryPoseFor, type Pose } from '../src/world/poses'
import { animateHuman } from '../src/world/characters'

const make = () => buildToon({ ...neighbour(3, 'man'), accessories: [] as never[] })
const joints = (p: ReturnType<typeof make>) => [p.armL, p.armR, p.elbowL!, p.elbowR!, p.legL, p.legR, p.kneeL!, p.kneeR!, p.head!, p.body]

describe('poses', () => {
  it('the toon has bendable elbows, knees, hands and a head', () => {
    const p = make()
    for (const o of [p.elbowL, p.elbowR, p.kneeL, p.kneeR, p.handL, p.handR, p.head]) expect(o).toBeTruthy()
  })
  it('every pose gives finite angles at any time and blend', () => {
    for (const name of Object.keys(POSES) as Pose[]) for (const t of [0, 0.37, 2.9]) for (const k of [0, 0.5, 1]) {
      const p = make(); applyPose(p, name, t, k)
      for (const o of joints(p)) { expect(Number.isFinite(o.rotation.x), `${name} x`).toBe(true); expect(Number.isFinite(o.rotation.z)).toBe(true) }
      expect(Number.isFinite(p.body.position.y)).toBe(true)
    }
  })
  it('k = 0 is standing, whatever the pose', () => {
    const p = make(); applyPose(p, 'pickLow', 1, 0)
    for (const o of joints(p)) expect(Math.abs(o.rotation.x)).toBeLessThan(1e-9)
    expect(Math.abs(p.body.position.y)).toBeLessThan(1e-9)
  })
  it('sitting drops the hips and tucks the shins; picking up from the floor bends the knees and the back; carrying keeps the legs free', () => {
    const s = make(); applyPose(s, 'sit', 0, 1); expect(s.body.position.y).toBeLessThan(-0.3); expect(Math.abs(s.kneeL!.rotation.x)).toBeGreaterThan(1)
    const f = make(); applyPose(f, 'pickLow', 0, 1); expect(f.body.rotation.x).toBeGreaterThan(0.4); expect(Math.abs(f.kneeR!.rotation.x)).toBeGreaterThan(1)
    const w = make(); animateHuman(w, 1.1, true); const leg = w.legL.rotation.x; applyPose(w, 'carryTray', 0, 1, true); expect(w.legL.rotation.x).toBe(leg)
    expect(Math.abs(w.armL.rotation.x)).toBeGreaterThan(0.5)
  })
  it('a pose after another leaves nothing of the first behind, and walking resets the bend', () => {
    const p = make(); applyPose(p, 'write', 0.5, 1); applyPose(p, 'stand', 0.5, 1)
    expect(Math.abs(p.body.rotation.x)).toBeLessThan(1e-9); expect(Math.abs(p.head!.rotation.x)).toBeLessThan(1e-9)
    applyPose(p, 'wave', 1, 1); animateHuman(p, 0.2, false); expect(p.armR.rotation.z).toBe(0)
  })
  it('the pose for an item depends on where it is and what it is', () => {
    expect(poseForItem('plate', 1.1)).toBe('grab'); expect(poseForItem('produce', 0.2)).toBe('pickLow'); expect(poseForItem('crate', 0.4)).toBe('lift')
    expect(poseForItem('cup', 1.6)).toBe('reachHigh'); expect(poseForItem('stamp', 1)).toBe('stamp'); expect(poseForItem('paper', 1)).toBe('write')
    expect(carryPoseFor('crate')).toBe('carryBox'); expect(carryPoseFor('plate')).toBe('carryTray')
  })
})
