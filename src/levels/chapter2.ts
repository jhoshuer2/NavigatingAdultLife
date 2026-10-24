// Chapter 2, "Trial Day": the player is a young footballer at an open trial. Only Level 1 exists so far (same rule as chapter 1: one level first, test it).
import type { LevelDef, TaskDef, Rect, Furn, Hazard } from './schema'

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
  id: 'ch2.l1',  sceneKind: 'pitch', kit: true, chapter: 'ch2', title: 'Arrival at the Pitch', subtitle: 'Level 1',
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
  next: 'ch2.l2',
  starRules: ['Finish the level', 'Reach the goal before the timer ends', 'Reach it on time with 2 mistakes or fewer'],
}

const FURNITURE2: Furn[] = [
  { name: 'drillTable', rect: R(5.0, 7.4, -5.0, -4.0), h: 0.9, color: '#a87a50' },
  { name: 'bench', rect: R(-3.2, 3.2, 4.7, 5.6), h: 0.6, color: '#6b3a1e' },
  { name: 'goalL', rect: R(11.8, 12.2, -2.2, -1.9), h: 1.6, color: '#fbf8f0' },
  { name: 'goalR', rect: R(11.8, 12.2, 1.9, 2.2), h: 1.6, color: '#fbf8f0' },
]

const tasks2: TaskDef[] = [
  {
    id: 'ch2.l2.t1', kind: 'goto', title: 'Gather at the whistle', purpose: 'A calm start: move through a crowd of other hopefuls to the coach.',
    objective: 'Join the group at the centre circle', controls: 'Move with the stick, arrow keys or by tapping the pitch.',
    success: 'You stand inside the centre circle.', failure: 'None.', recovery: 'The ring on the pitch marks the circle.',
    feedback: 'The ring pulses at the circle; the coach nods when you arrive.', reward: '1 point the first time.', persistence: 'Saved when you reach the circle.',
    intro: [{ who: 'tunde', text: 'Everybody to the circle! Yes, you too, number 14.', expr: 'confident' }],
    done: [{ who: 'tunde', text: 'Welcome. Today we find out who actually plays football.', expr: 'cheeky' }],
    hint: 'Follow the glowing ring to the white circle in the middle of the pitch.',
  },
  {
    id: 'ch2.l2.t2', kind: 'kick', title: 'Penalty practice', purpose: 'Teach the one new input of this level: timing a kick.',
    objective: 'Score 3 goals', controls: 'Walk onto the penalty spot, then tap Kick when the needle is in the green.',
    success: 'Three penalties go in.', failure: 'A miss only costs a little time and widens the green zone.', recovery: 'Try again as often as you like.',
    feedback: 'The ball flies, the keeper dives, the counter goes up with GOAL.', reward: '1 point the first time.', persistence: 'Saved when the third goal goes in.',
    intro: [{ who: 'tunde', text: 'Penalties. Three goals. The keeper is Daniel. He is tired.', expr: 'calm' }, { who: 'player', text: 'Steady. Eyes on the needle.', expr: 'thinking' }],
    done: [{ who: 'folake', text: 'GOAL! That is my child! Somebody record this!', expr: 'laughing' }],
    hint: 'Stand on the white spot by the goal and tap Kick when the needle is inside the green bar.',
  },
  {
    id: 'ch2.l2.t3', kind: 'choose', title: 'Choose your next station', purpose: 'A real choice with a visible consequence: a faster, harder run or a safer, slower one. Both are fair.',
    objective: 'Pick the next drill', controls: 'Walk to the table and tap one drill.',
    success: 'You pick the Sprint ladder or the Passing circle.', failure: 'None.', recovery: 'Both drills can be finished; the choice only changes the run.',
    feedback: 'The drill goes on your clipboard and the other stays on the table.', reward: '1 point the first time.', persistence: 'Saved as a flag for later levels.',
    intro: [{ who: 'tunde', text: 'Sprint ladder is quick and fierce. Passing circle is calm and long. Choose. I will judge.', expr: 'suspicious' }],
    done: [{ who: 'player', text: 'Okay. No turning back now.', expr: 'worried' }],
    hint: 'The two drills are on the table by the north fence, bottom right.',
  },
  {
    id: 'ch2.l2.t4', kind: 'reach', title: 'Run the station', purpose: 'The timed run changes with your choice: short and fast, or long and steady.',
    objective: 'Run back to the circle in time', controls: 'Move with the stick, arrow keys or by tapping the pitch.',
    success: 'You reach the circle before the timer ends.', failure: 'Clipping a dummy costs 3 seconds.', recovery: 'A quick get-up, then you keep going. The level never restarts.',
    feedback: 'A timer on screen and a bump sound when you clip a dummy.', reward: '1 point the first time.', persistence: 'Saved when you reach the circle.',
    intro: [{ who: 'tunde', text: 'Back to the circle before I finish this sentence!', expr: 'angry' }],
    done: [{ who: 'tunde', text: 'Hm. Hm. Hm.', expr: 'thinking' }],
    hint: 'The dummies slide across. Cross behind them, then sprint to the ring.',
  },
]

const D = (x: number, z0: number, z1: number, speed: number, phase: number, color: string): Hazard => ({ x, z0, z1, speed, phase, name: 'dummy', color })

export const LEVEL_C2L2: LevelDef = {
  id: 'ch2.l2', sceneKind: 'pitch', kit: true, chapter: 'ch2', title: 'Skills Stations', subtitle: 'Level 2',
  intro: 'A loud whistle, three stations to survive, and a coach who somehow only watches you.',
  tasks: tasks2,
  bounds: R(-12.4, 12.4, -6, 6),
  blockers: FURNITURE2.map((f) => f.rect),
  furniture: FURNITURE2,
  spawn: { x: -10.8, z: 3.5 },
  spawnAfterFirst: { x: -1.5, z: 0 },
  spots: [],
  items: [
    { id: 'sprint', task: 2, x: 5.7, z: -4.5, label: 'Take the Sprint ladder', color: '#f5b91c', shape: 'ladder' },
    { id: 'passing', task: 2, x: 6.7, z: -4.5, label: 'Take the Passing circle', color: '#2f5a3a', shape: 'cones' },
  ],
  guideAreas: [{ x: 0, z: 0, r: 2.4 }, { x: 7.2, z: 0, r: 1.5 }, { x: 6.2, z: -3.5, r: 1.6 }, { x: 0, z: 0, r: 2.4 }],
  gotoAreas: [{ x: 0, z: 0, r: 1.6 }, null, null, { x: 0, z: 0, r: 1.6 }],
  kick: { x: 7.6, z: 0, goals: 3, goal: { x: 12.2, z: 0 } },
  // the timed run: three dummies on the way back to the circle; the choice before it changes how many and how fast
  hazards: [D(4.0, -4.2, 3.6, 2.4, 0, '#e07a1f'), D(-1.0, -4.2, 3.6, 2.8, 1.3, '#2f5a3a'), D(-4.8, -4.2, 3.6, 2.2, 0.6, '#e07a1f')],
  variants: {
    sprint: { timeLimit: 14, label: 'Sprint ladder', hazards: [D(3.4, -4.2, 3.6, 3.6, 0, '#e07a1f'), D(-1.8, -4.2, 3.6, 4.0, 1.3, '#2f5a3a')] },
    passing: { timeLimit: 24, label: 'Passing circle', hazards: [D(4.4, -4.2, 3.6, 2.2, 0, '#e07a1f'), D(0.8, -4.2, 3.6, 2.4, 1.3, '#2f5a3a'), D(-3.2, -4.2, 3.6, 2.0, 0.6, '#e07a1f')] },
  },
  crowd: [{ x: -2.4, z: -2.6, rot: 0.8 }, { x: -1.4, z: 3.0, rot: -0.9 }, { x: 2.4, z: -2.8, rot: 2.2 }, { x: 2.6, z: 2.6, rot: -2.2 }, { x: -3.4, z: 0.4, rot: 1.5 }, { x: 3.4, z: 0.2, rot: -1.5 }, { x: 0.2, z: -3.4, rot: 3.1 }, { x: -6.5, z: 4.2, rot: 0.3 }, { x: -8.8, z: -3.6, rot: 0.9 }, { x: -10.2, z: -0.8, rot: 0.3 }],
  npcs: { folake: { x: -9.6, z: -4.8, rot: 0.7 }, tunde: { x: 0, z: -0.9, rot: 0.2 } },
  endBeat: { text: 'The coach writes something on his clipboard. He looks at you. He looks at the clipboard again.', line: 'Your drill will matter in Level 3.' }, choiceLabel: 'drill',
  exitX: 0,
  timeLimit: 20,
  next: null,
  starRules: ['Finish the level', 'Get back to the circle before the timer ends', 'Do it on time with 2 mistakes or fewer'],
}
