// Chapter 2, "Trial Day": the player is a young footballer at an open trial. Only Level 1 exists so far (same rule as chapter 1: one level first, test it).
import type { LevelDef, TaskDef, Rect, Furn, Hazard, Line } from './schema'
import { STREET_BOUNDS } from './street'
import { withBus } from './bus'
const say = (who: Line['who'], text: string, expr?: Line['expr']): Line => ({ who, text, expr })

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
    id: 'ch2.l1.t0', kind: 'ride', title: 'Take the bus to the trial', purpose: 'The trial ground is across town: wait at the stop, board the bus and ride there.',
    objective: 'Take the bus to the trial ground', controls: 'Walk to the bus stop, wait for the bus and tap Board the bus.',
    success: 'You get off at the gate of the trial ground.', failure: 'None. Miss the bus and the next one comes.', recovery: 'Walking to the gate works too, only slower.',
    feedback: 'The bus pulls up, you board and the city rolls by.', reward: '1 point the first time.', persistence: 'Saved when you get off the bus.',
    intro: [{ who: 'folake', text: 'Trial day! The bus stop is just up the road. Do not miss it, and do not forget your boots. You have no boots. Take the bus!', expr: 'worried' }],
    done: [{ who: 'helper', text: 'Hundreds of hopefuls, and every one of them got the same bus as you.', expr: 'cheeky' }],
    hint: 'Walk to the BUS STOP sign, wait for the yellow bus and tap Board the bus.',
  },
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
  bounds: STREET_BOUNDS,
  blockers: FURNITURE.map((f) => f.rect),
  furniture: FURNITURE,
  rides: { 0: { stop: { x: -30, z: 1.8 }, busZ: 4.4, from: 'home', to: 'the trial ground' } },
  spawn: { x: -32, z: 0.4 },
  spawnAfterFirst: { x: -4.5, z: -1.5 },
  spots: [],
  items: [
    { id: 'bib', task: 2, x: -1.5, z: 4.1, label: 'Take the bib', color: '#f5b91c', shape: 'bib' },
    { id: 'shinpads', task: 2, x: 1.5, z: -4.4, label: 'Take the shin pads', color: '#fbf8f0', shape: 'shinpad' },
    { id: 'water', task: 2, x: 3.7, z: 4.1, label: 'Take the water', color: '#6a8ab8', shape: 'bottle' },
    { id: 'striker', task: 3, x: 5.6, z: 4.35, label: 'Take the Striker boots', color: '#f5b91c', shape: 'boots' },
    { id: 'winger', task: 3, x: 6.3, z: 4.35, label: 'Take the Winger boots', color: '#2b6ad0', shape: 'boots' },
    { id: 'defender', task: 3, x: 7.0, z: 4.35, label: 'Take the Defender boots', color: '#1c1b22', shape: 'boots' },
  ],
  guideAreas: [{ x: -30, z: 1.8, r: 2 }, { x: -5.5, z: -2.2, r: 1.8 }, { x: 0, z: 0, r: 4 }, { x: 6.3, z: 3.2, r: 1.8 }, { x: 11.2, z: 0, r: 1.6 }],
  gotoAreas: [{ x: -13.8, z: 0.8, r: 1.4 }, { x: -5.5, z: -2.4, r: 1.7 }, null, null, null],
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
    id: 'ch2.l2.t4', kind: 'reach', variant: true, title: 'Run the station', purpose: 'The timed run changes with your choice: short and fast, or long and steady.',
    objective: 'Run back to the circle in time', controls: 'Move with the stick, arrow keys or by tapping the pitch.',
    success: 'You reach the circle before the timer ends.', failure: 'Clipping a dummy costs 3 seconds.', recovery: 'A quick get-up, then you keep going. The level never restarts.',
    feedback: 'A timer on screen and a bump sound when you clip a dummy.', reward: '1 point the first time.', persistence: 'Saved when you reach the circle.',
    intro: [{ who: 'tunde', text: 'Back to the circle before I finish this sentence!', expr: 'angry' }],
    done: [{ who: 'tunde', text: 'Hm. Hm. Hm.', expr: 'thinking' }],
    hint: 'The dummies slide across. Cross behind them, then sprint to the ring.',
  },
]

const D = (x: number, z0: number, z1: number, speed: number, phase: number, color: string): Hazard => ({ x, z0, z1, speed, phase, name: 'dummy', color })
const RING = (x: number, z: number, r = 1.6) => ({ x, z, r })

export const LEVEL_C2L2: LevelDef = withBus({
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
  next: 'ch2.l3',
  starRules: ['Finish the level', 'Get back to the circle before the timer ends', 'Do it on time with 2 mistakes or fewer'],
}, { to: 'the training pitch', title: 'Afternoon session', purpose: 'The afternoon session is on the training pitch across town: wait at the stop, board the bus and ride there.', objective: 'Take the bus to the training pitch', success: 'You get off at the training pitch.', intro: [{ who: 'folake', text: 'The skills session is on the other pitch this afternoon. The bus stop is up the road, my champion!', expr: 'happy' }], done: [{ who: 'tunde', text: 'You are early. I do not trust early. Warm up.', expr: 'suspicious' }] })

// ---------------------------------------------------------------------------------------------------------------- Level 3
const FURNITURE3: Furn[] = [
  { name: 'dugout', rect: R(-3.2, 3.2, -5.6, -4.8), h: 0.7, color: '#6b3a1e' },
  { name: 'goalL', rect: R(11.8, 12.2, -2.2, -1.9), h: 1.6, color: '#fbf8f0' },
  { name: 'goalR', rect: R(11.8, 12.2, 1.9, 2.2), h: 1.6, color: '#fbf8f0' },
]
const ORANGE = '#e07a1f', GREEN = '#2f5a3a', YELLOW = '#f5b91c'
const BOOTS_FLAG = 'ch2.l1.item' // the boots chosen in level 1

const tasks3: TaskDef[] = [
  {
    id: 'ch2.l3.t1', kind: 'goto', title: 'Take your position', purpose: 'Your boots from Level 1 decide where you stand: striker up front, winger on the wing, defender at the back.',
    objective: 'Walk to your position', controls: 'Move with the stick, arrow keys or by tapping the pitch.', flag: BOOTS_FLAG, variant: true,
    success: 'You stand in the ring for your position.', failure: 'None.', recovery: 'The ring marks the spot.',
    feedback: 'The ring pulses where you should stand; the coach calls your position.', reward: '1 point the first time.', persistence: 'Saved when you reach the ring.',
    introByChoice: {
      striker: [say('tunde', 'Number 14, striker. Up front. Make me forget my last striker.', 'confident')],
      winger: [say('tunde', 'Number 14, winger. The wing is yours. Run like the bus is leaving.', 'cheeky')],
      defender: [say('tunde', 'Number 14, defender. Back there. Nobody scores past you.', 'calm')],
    },
    intro: [say('tunde', 'Number 14! Take your place.', 'confident')],
    done: [say('folake', 'That is my child! Number fourteen! Look at him!', 'proud')],
    hint: 'Follow the ring: forward for strikers, the north wing for wingers, the back for defenders.',
  },
  {
    id: 'ch2.l3.t2', kind: 'kick', title: 'Complete two passes', purpose: 'Reuse the timing needle from the penalties, now as a pass to a teammate.',
    objective: 'Complete 2 passes', controls: 'Walk onto the pass spot, then tap Pass when the needle is in the green.',
    success: 'Two passes reach your teammate.', failure: 'A miss is intercepted and widens the green zone a little.', recovery: 'Try again as often as you need.',
    feedback: 'The ball flies to the teammate, or an opponent cuts it out.', reward: '1 point the first time.', persistence: 'Saved when the second pass lands.',
    intro: [say('helper', 'Ball here! Ball here! No, HERE!', 'cheeky'), say('player', 'Eyes on the needle.', 'thinking')],
    done: [say('tunde', 'Good passing. Now run with it.', 'calm')],
    hint: 'Stand on the white spot and tap Pass with the needle inside the green bar.',
  },
  {
    id: 'ch2.l3.t3', kind: 'reach', title: 'Beat the defenders', purpose: 'A run through defenders; your position decides how hard and how long.',
    objective: 'Get past the defenders to the goal ring', controls: 'Move with the stick, arrow keys or by tapping the pitch.', flag: BOOTS_FLAG, variant: true,
    success: 'You reach the ring before the timer ends.', failure: 'Clipping a defender costs 3 seconds.', recovery: 'A quick get-up, then you keep going. The level never restarts.',
    feedback: 'A timer on screen and a bump sound when you clip a defender.', reward: '1 point the first time.', persistence: 'Saved when you reach the ring.',
    intro: [say('tunde', 'Now go through them! They will not move for you!', 'angry')],
    done: [say('player', 'I am through! I am actually through!', 'laughing')],
    hint: 'The defenders slide across. Cross behind them, then sprint.',
  },
  {
    id: 'ch2.l3.t4', kind: 'choose', title: 'The decisive moment', purpose: 'The match turns on one choice. All three are fair.',
    objective: 'Shoot, pass or hold the ball', controls: 'Walk to an option and tap it.',
    success: 'You choose.', failure: 'None.', recovery: 'There is no wrong answer; the coach just reacts differently.',
    feedback: 'The ball is played and the crowd reacts.', reward: '1 point the first time.', persistence: 'Saved as a flag for later levels.',
    intro: [say('player', 'Goal in front of me. A free teammate on my left. Or I just hold it...', 'thinking')],
    done: [say('tunde', 'Interesting.', 'suspicious')],
    hint: 'Three signs near the goal: shoot yourself, pass to the free teammate or hold the ball.',
  },
  {
    id: 'ch2.l3.t5', kind: 'goto', title: 'Face the coach', purpose: 'The coach has an opinion about what you just did.',
    objective: 'Walk to the coach', controls: 'Move with the stick, arrow keys or by tapping the pitch.',
    success: 'You reach the coach.', failure: 'None.', recovery: 'The ring marks the coach.',
    feedback: 'The coach reacts to your decision.', reward: '1 point the first time.', persistence: 'Saved when you reach the coach.',
    introByChoice: {
      shoot: [say('tunde', 'You shot. Brave. Greedy. Brave and greedy.', 'suspicious')],
      pass: [say('tunde', 'You passed. Team player. Or you were scared. I will decide.', 'thinking')],
      hold: [say('tunde', 'You held the ball. For a long time. A VERY long time.', 'tired')],
    },
    intro: [say('tunde', 'Come here.', 'calm')],
    done: [say('tunde', 'Wait there. I am writing something.', 'cheeky')],
    hint: 'The coach is by the dugout on the north touchline.',
  },
]

export const LEVEL_C2L3: LevelDef = withBus({
  id: 'ch2.l3', sceneKind: 'pitch', kit: true, chapter: 'ch2', title: 'The Trial Match', subtitle: 'Level 3',
  intro: 'Whistle. Bibs. A real match, and your boots from this morning have an opinion about where you play.',
  tasks: tasks3,
  bounds: R(-12.4, 12.4, -6, 6),
  blockers: FURNITURE3.map((f) => f.rect),
  furniture: FURNITURE3,
  spawn: { x: -10.8, z: 0 },
  spawnAfterFirst: { x: -2.2, z: 1.5 },
  spots: [],
  items: [
    { id: 'shoot', task: 3, x: 7.4, z: -2.4, label: 'Shoot it yourself', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'pass', task: 3, x: 7.4, z: 0, label: 'Pass to the free teammate', color: GREEN, shape: 'sign', y: 0 },
    { id: 'hold', task: 3, x: 7.4, z: 2.4, label: 'Hold the ball and wait', color: YELLOW, shape: 'sign', y: 0 },
  ],
  guideAreas: [RING(3, -3.8), { x: -2.2, z: 2.4, r: 1 }, RING(9.5, 0), { x: 7.4, z: 0, r: 3 }, RING(0, -4)],
  // default ring (no boots on record): the wing. The real ring comes from the boots chosen in level 1.
  gotoAreas: [RING(3, -3.8), null, RING(9.6, 0), null, RING(0, -3.8, 1.8)],
  kick: { x: -2.2, z: 2.4, goals: 2, goal: { x: 4.6, z: 2.6 }, pass: true },
  hazards: [D(2.6, -4.4, 4.4, 2.6, 0, '#2b6ad0'), D(5.4, -4.4, 4.4, 2.8, 1.2, '#2b6ad0'), D(8.0, -4.4, 4.4, 2.4, 0.6, '#2b6ad0')],
  variants: {
    striker: { label: 'Striker', timeLimit: 14, goals: { 0: RING(8.2, 0) }, hazards: [D(3.2, -4.4, 4.4, 3.6, 0, '#2b6ad0'), D(6.6, -4.4, 4.4, 4.0, 1.3, '#2b6ad0')] },
    winger: { label: 'Winger', timeLimit: 18, goals: { 0: RING(3, -3.8) }, hazards: [D(2.6, -4.4, 4.4, 2.8, 0, '#2b6ad0'), D(5.4, -4.4, 4.4, 3.0, 1.2, '#2b6ad0'), D(8.0, -4.4, 4.4, 2.6, 0.6, '#2b6ad0')] },
    defender: { label: 'Defender', timeLimit: 24, goals: { 0: RING(-8, 0) }, hazards: [D(2.6, -4.4, 4.4, 2.2, 0, '#2b6ad0'), D(5.4, -4.4, 4.4, 2.4, 1.2, '#2b6ad0'), D(8.0, -4.4, 4.4, 2.0, 0.6, '#2b6ad0')] },
  },
  crowd: [{ x: -6.5, z: -3.6, rot: 0.6 }, { x: -6.5, z: 3.8, rot: -0.6 }, { x: 0.4, z: 4.4, rot: 3.1 }, { x: 4.4, z: -5.0, rot: 0 }, { x: 10.4, z: 4.2, rot: -2.2 }, { x: -9.4, z: 1.0, rot: 1.4 }],
  npcs: { folake: { x: -9.4, z: -4.8, rot: 0.7 }, tunde: { x: 0, z: -4.2, rot: 0.1 } },
  endBeat: { text: 'The coach writes a number next to your name. You are not allowed to see it.', line: 'Your position will matter in Level 4.' }, choiceLabel: 'decision',
  exitX: 0,
  timeLimit: 18,
  next: 'ch2.l4',
  starRules: ['Finish the level', 'Get through the defenders before the timer ends', 'Do it on time with 2 mistakes or fewer'],
}, { to: 'the stadium', title: 'Bus to the stadium', purpose: 'The trial match is at the stadium across town: wait at the stop, board the bus and ride there.', objective: 'Take the bus to the stadium', success: 'You get off at the stadium.', intro: [{ who: 'folake', text: 'The trial match is at the stadium. Take the bus, eat something and do not be shy.', expr: 'calm' }], done: [{ who: 'helper', text: 'Real stadium. Real grass. Real nerves.', expr: 'worried' }] })
