// Chapter 2, "Trial Day": the player is a young footballer at an open trial. Only Level 1 exists so far (same rule as chapter 1: one level first, test it).
import type { LevelDef, TaskDef, Rect, Furn } from './schema'

const R = (x0: number, x1: number, z0: number, z1: number): Rect => ({ x0, x1, z0, z1 })

const FURNITURE: Furn[] = [
  { name: 'desk', rect: R(-6.6, -4.4, -4.8, -3.4), h: 1.0, color: '#a87a50' },
  { name: 'bench1', rect: R(-2.6, -0.4, 3.6, 4.6), h: 0.6, color: '#6b3a1e' },
  { name: 'bench2', rect: R(0.4, 2.6, -4.9, -3.9), h: 0.6, color: '#6b3a1e' },
  { name: 'bench3', rect: R(2.9, 4.5, 3.6, 4.6), h: 0.6, color: '#6b3a1e' },
  { name: 'rack', rect: R(5.0, 7.6, 3.7, 4.8), h: 1.0, color: '#2f5a3a' },
  { name: 'goalL', rect: R(11.8, 12.2, -2.2, -1.9), h: 1.6, color: '#fbf8f0' },
  { name: 'goalR', rect: R(11.8, 12.2, 1.9, 2.2), h: 1.6, color: '#fbf8f0' },
]

const tasks: TaskDef[] = [
  {
    id: 'ch2.l1.t1', kind: 'goto', title: 'Find the registration', purpose: 'Teach walking through a busy place toward a marked goal.',
    objective: 'Walk to the registration desk', controls: 'Move with the stick, arrow keys or by tapping the pitch.',
    success: 'You reach the desk and get your number.', failure: 'None.', recovery: 'The marker ring on the ground shows the desk.',
    feedback: 'The ring pulses at the desk; the coach calls out when you arrive.', reward: '1 point the first time.', persistence: 'Saved when you reach the desk.',
    intro: [{ who: 'tunde', text: 'Trial day! Registration is the orange tent. Go and get your number.', expr: 'confident' }],
    done: [{ who: 'tunde', text: 'Number 14. Lucky, or very unlucky. We will see.', expr: 'cheeky' }],
    hint: 'Follow the glowing ring to the orange tent on the left.',
  },
  {
    id: 'ch2.l1.t2', kind: 'collect', title: 'Collect your kit', purpose: 'Three pickups in a bigger space: bib, shin pads and water.',
    objective: 'Get your bib, shin pads and water', controls: 'Walk close to an item and tap Take.',
    success: 'Bib, shin pads and water are with you.', failure: 'None.', recovery: 'The counter shows what is still missing.',
    feedback: 'Each pickup pops and the counter goes up.', reward: '1 point the first time.', persistence: 'Saved when the last item is taken.',
    intro: [{ who: 'player', text: 'Bib, shin pads, water. Do not be the one who forgets something.', expr: 'thinking' }],
    done: [{ who: 'folake', text: 'That is my champion! Drink the water!', expr: 'proud' }],
    hint: 'The benches have your kit: one by the tent, one on the far side, one near the rack.',
  },
  {
    id: 'ch2.l1.t3', kind: 'choose', title: 'Choose your boots', purpose: 'A small choice that is remembered: it sets how you play in the trial.',
    objective: 'Pick one pair of boots', controls: 'Walk to the rack and tap a pair of boots.',
    success: 'You pick Striker, Winger or Defender boots.', failure: 'None.', recovery: 'All three are good; the choice only changes your style.',
    feedback: 'The boots go in your bag and the others stay on the rack.', reward: '1 point the first time.', persistence: 'Saved as a flag for later levels.',
    intro: [{ who: 'tunde', text: 'Boots. Gold for strikers, blue for wingers, black for defenders. Choose how you want to be seen.', expr: 'calm' }],
    done: [{ who: 'player', text: 'Right. Warm-up time.', expr: 'confident' }],
    hint: 'The boots are on the green rack, bottom right.',
  },
  {
    id: 'ch2.l1.t4', kind: 'reach', title: 'Warm-up drill', purpose: 'A short dribble through moving training dummies.',
    objective: 'Dribble to the far goal in time', controls: 'Move with the stick, arrow keys or by tapping the pitch.',
    success: 'You reach the far goal line before the timer ends.', failure: 'Clipping a dummy costs 3 seconds.', recovery: 'A quick get-up, then you keep going. The level never restarts.',
    feedback: 'A timer on screen and a bump sound when you clip a dummy.', reward: '1 point the first time.', persistence: 'Saved when you reach the goal line.',
    intro: [{ who: 'tunde', text: 'Warm-up! Dribble through the dummies. They do not move for you.', expr: 'confident' }],
    done: [{ who: 'tunde', text: 'Not bad. The real trial starts now...', expr: 'surprised' }],
    hint: 'The dummies slide across. Cross behind them, then sprint.',
  },
]

export const LEVEL_C2L1: LevelDef = {
  id: 'ch2.l1', sceneKind: 'pitch', kit: true, chapter: 'ch2', title: 'Arrival at the Pitch', subtitle: 'Level 1',
  intro: 'Today is your trial. Hundreds of hopefuls, one coach with a whistle, and your number is not even on your shirt yet.',
  tasks,
  bounds: R(-12.4, 12.4, -6, 6),
  blockers: FURNITURE.map((f) => f.rect),
  furniture: FURNITURE,
  spawn: { x: -10.8, z: 1 },
  spawnAfterFirst: { x: -4.5, z: -1.5 },
  spots: [],
  items: [
    { id: 'bib', task: 1, x: -1.5, z: 4.1, label: 'Take the bib', color: '#f5b91c', shape: 'bib' },
    { id: 'shinpads', task: 1, x: 1.5, z: -4.4, label: 'Take the shin pads', color: '#fbf8f0', shape: 'shinpad' },
    { id: 'water', task: 1, x: 3.7, z: 4.1, label: 'Take the water', color: '#6a8ab8', shape: 'bottle' },
    { id: 'striker', task: 2, x: 5.6, z: 4.35, label: 'Take the Striker boots', color: '#f5b91c', shape: 'boots' },
    { id: 'winger', task: 2, x: 6.3, z: 4.35, label: 'Take the Winger boots', color: '#2b6ad0', shape: 'boots' },
    { id: 'defender', task: 2, x: 7.0, z: 4.35, label: 'Take the Defender boots', color: '#1c1b22', shape: 'boots' },
  ],
  guideAreas: [{ x: -5.5, z: -2.2, r: 1.8 }, { x: 0, z: 0, r: 4 }, { x: 6.3, z: 3.2, r: 1.8 }, { x: 11.2, z: 0, r: 1.6 }],
  gotoAreas: [{ x: -5.5, z: -2.4, r: 1.7 }, null, null, null],
  hazards: [
    { x: 8.4, z0: -4.2, z1: 3.0, speed: 2.5, phase: 0, name: 'dummy', color: '#e07a1f' },
    { x: 10.0, z0: -4.2, z1: 2.4, speed: 3.0, phase: 1.5, name: 'dummy', color: '#2f5a3a' },
  ],
  npcs: { folake: { x: -8.5, z: -4.8, rot: 0.6 }, tunde: { x: 4.5, z: -1.2, rot: Math.PI * 0.75 } },
  endBeat: { text: 'Whistle! The coach points at you. The real trial starts now.', line: 'Your boots will matter in Level 2.' }, choiceLabel: 'boots',
  exitX: 11.2,
  timeLimit: 20,
  next: null,
  starRules: ['Finish the level', 'Reach the goal before the timer ends', 'Reach it on time with 2 mistakes or fewer'],
}
