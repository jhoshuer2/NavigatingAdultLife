// Chapter 2 "Trial Day", levels 2 to 9 (Level 1 is the spec's own, in chapter2.ts). A footballer's trial across a football complex and the town: coaches to
// talk to, a canteen to serve in, a physio to sit for, matches, a rival and a verdict. Every level starts with the train ride, then mixes tasks differently.
import type { Deco } from './schema'
import { L, T, R, F, say, sayAs, D, WOOD, DARK } from './chapter1b'
import { B, TREES, LAMPS, RING, GREEN } from './chapter1c'
import { withBus, type BusOpts } from './bus'

const ORANGE = '#e07a1f', YELLOW = '#f5b91c', RUST = '#c4562a', BLUE = '#2b6ad0', CREAM = '#f3e7cf'
const BOOTS = 'ch2.l1.item', DECISION = 'ch2.l3.item'
const ride = (to: string, title: string, why: string, intro: BusOpts['intro'], done: BusOpts['done']): BusOpts => ({ vehicle: 'train', to, title, purpose: `${why}: wait at the station, board the train and ride there.`, objective: `Take the train to ${to}`, success: `You get off at ${to}.`, intro, done })
const FOOT = (extra: Deco[] = []): Deco[] => [{ kind: 'wall', x: 10, z: -13.4, w: 70, d: 2, h: 3.2, color: CREAM }, ...extra]
const DUMMIES = '#e07a1f'

// ---------------------------------------------------------------------------------------------------------------- Level 2
export const LEVEL_C2L2 = withBus(L({
  ch: 'ch2', kit: true, n: 2, title: 'Skills Stations', next: 'ch2.l3', bounds: R(-12, 34, -12.4, 12.4),
  intro: 'Afternoon session at the training ground. Cones, dummies, a drill table and a coach who rates people with one eyebrow.',
  theme: { ground: '#9a8a6a', floors: [{ x0: -12, x1: 34, z0: -12, z1: 12, color: '#d9cdb0' }], deco: FOOT([
    { kind: 'pitch', x: 17, z: 0, w: 28, d: 18 }, { kind: 'goal', x: 31.4, z: 0, d: 4.3 }, { kind: 'stall', x: -6, z: -8.6, w: 3.4, d: 1.6, color: ORANGE, label: 'COACH TENT' }, { kind: 'sign', x: 5, z: 6.2, label: 'DRILLS', w: 1.6 },
    ...TREES([[-10, 9], [33, -11]]), ...LAMPS([[-4, 4], [6, -4]]),
  ]) },
  furniture: [F('table', R(3, 7.4, 8, 9.4), 0.9, WOOD), F('tent', R(-7.8, -4.2, -9.4, -7.6), 1.0, DARK)],
  spawn: { x: -9, z: 0 }, resume: { x: -8, z: 0 }, kick: { x: 22, z: 0, goals: 3, goal: { x: 30.2, z: 0 } },
  tasks: [
    T('ch2.l2', 1, 'talk', 'Meet the coach', { purpose: 'Coach Dele wants to know how you like to start a session. Any answer is a fair answer.', objective: 'Talk to Coach Dele', success: 'The coach has sized you up.',
      intro: [say('tunde', 'That is Coach Dele. He has coached three champions and fired four assistants.', 'cheeky')], done: [sayAs('Coach Dele', 'helper', 'Good. Penalties first. The keeper is Daniel. He is tired.', 'calm')], hint: 'Coach Dele stands by the orange COACH TENT.' }),
    T('ch2.l2', 2, 'kick', 'Penalty practice', { purpose: 'Time the needle: tap Kick when it is in the green.', objective: 'Score 3 penalties', success: 'Three penalties go in.',
      intro: [say('player', 'Steady. Eyes on the needle.', 'thinking')], done: [say('folake', 'GOAL! That is my child! Somebody record this!', 'laughing')], hint: 'Stand on the white spot by the goal and tap Kick with the needle inside the green bar.' }),
    T('ch2.l2', 3, 'choose', 'Choose your next drill', { purpose: 'A fast, hard sprint ladder or a slow, long passing circle. Both are fair.', objective: 'Pick the next drill', success: 'You pick a drill.',
      intro: [sayAs('Coach Dele', 'helper', 'Sprint ladder is quick and fierce. Passing circle is calm and long. Choose. I will judge.', 'suspicious')], done: [say('player', 'Okay. No turning back now.', 'worried')], hint: 'Two drills on the table at the bottom: sprint or passing.' }),
    T('ch2.l2', 4, 'reach', 'Run the drill', { purpose: 'The timed run depends on your drill: short and fast, or long and steady.', objective: 'Run back to the centre circle in time', variant: true, success: 'You reach the circle before the timer ends.',
      intro: [sayAs('Coach Dele', 'helper', 'Back to the circle before I finish this sentence!', 'angry')], done: [sayAs('Coach Dele', 'helper', 'Hm. Hm. Hm.', 'thinking')], hint: 'The dummies slide across. Cross behind them, then sprint to the ring.' }),
  ],
  talks: { 0: [{ id: 'dele', name: 'Coach Dele', x: -2.5, z: -5.6, lines: [sayAs('Coach Dele', 'helper', 'Number 14. How do you like to start a session?', 'curious')], rounds: [{ options: [
    { id: 'warm', label: '"A proper warm-up, coach."', reply: sayAs('Coach Dele', 'helper', 'Sensible. Injuries love people who skip warm-ups.', 'happy') },
    { id: 'ball', label: '"Straight to the ball."', reply: sayAs('Coach Dele', 'helper', 'Eager! Eager breaks hamstrings. Careful.', 'cheeky') },
    { id: 'ask', label: '"Whatever you think is best."', reply: sayAs('Coach Dele', 'helper', 'A humble one. Rare. I like it. A little.', 'happy') },
  ] }] }] },
  items: [
    { id: 'sprint', task: 2, x: 4.4, z: 8.7, label: 'Pick the Sprint ladder', color: ORANGE, shape: 'ladder', y: 0.95, act: 'grab' },
    { id: 'passing', task: 2, x: 6.2, z: 8.7, label: 'Pick the Passing circle', color: GREEN, shape: 'cones', y: 0.95, act: 'grab' },
  ],
  goto: [null, null, null, RING(17, 0, 1.8)],
  guide: [{ x: -2.5, z: -5, r: 3 }, { x: 21, z: 0, r: 2 }, { x: 5.4, z: 7, r: 3 }, RING(17, 0, 1.8)],
  hazards: [D('dummy', 9, -7, 7, 2.6, 0, DUMMIES), D('dummy', 12, -7, 7, 2.9, 1.2, GREEN), D('dummy', 14.6, -7, 7, 2.4, 0.6, DUMMIES)],
  variants: {
    sprint: { label: 'Sprint ladder', timeLimit: 14, hazards: [D('dummy', 10, -7, 7, 3.4, 0, DUMMIES), D('dummy', 13.4, -7, 7, 3.8, 1.3, GREEN)] },
    passing: { label: 'Passing circle', timeLimit: 24, hazards: [D('dummy', 9, -7, 7, 2.2, 0, DUMMIES), D('dummy', 11.8, -7, 7, 2.4, 1.2, GREEN), D('dummy', 14.6, -7, 7, 2.0, 0.6, DUMMIES)] },
  },
  timeLimit: 18,
  crowd: [{ x: 10, z: 9, rot: 3 }, { x: 14, z: -9.4, rot: 0 }, { x: 26, z: 8, rot: -2 }],
  npcs: { folake: { x: -10, z: -9, rot: 0.8 }, tunde: { x: 22, z: -9.4, rot: -0.5 } }, choiceLabel: 'drill',
  endBeat: { text: 'Whistle. The coach writes something. His eyebrow goes up, then down. You decide that is a good sign.', line: 'The trial match is next.' },
  starRules: ['Finish the level', 'Get back to the circle before the timer ends', 'Do it on time with 2 mistakes or fewer'],
}), ride('the training pitch', 'Train to the training pitch', 'The afternoon session is on the training pitch across town', [sayAs('Mama Folake', 'folake', 'Skills session on the other pitch this afternoon. The station is up the road, my champion!', 'happy')], [sayAs('Baba Tunde', 'tunde', 'You are early. I do not trust early. Warm up.', 'suspicious')]))

// ---------------------------------------------------------------------------------------------------------------- Level 3
const RB = { striker: RING(24, 0), winger: RING(14, -8), defender: RING(4, 0) }
export const LEVEL_C2L3 = withBus(L({
  ch: 'ch2', kit: true, n: 3, title: 'The Trial Match', next: 'ch2.l4', bounds: R(-12, 34, -12.4, 12.4),
  intro: 'Whistle. Bibs. A real match at a real stadium, and your boots from this morning have an opinion about where you play.',
  theme: { ground: '#9a8a6a', floors: [{ x0: -12, x1: 34, z0: -12, z1: 12, color: '#cfc4a8' }], deco: FOOT([
    { kind: 'pitch', x: 15, z: 0, w: 38, d: 22 }, { kind: 'goal', x: 33.4, z: 0, d: 4.3 }, { kind: 'sign', x: 14, z: -11.4, label: 'DUGOUT', w: 1.6 }, ...TREES([[-10, 10], [-10, -10]]), ...LAMPS([[-6, 4]]),
  ]) },
  furniture: [F('dugout', R(8, 20, -12, -10.8), 0.8, DARK)],
  spawn: { x: -9, z: 0 }, resume: { x: -8, z: 2 }, kick: { x: 6, z: 5, goals: 2, goal: { x: 14, z: 7 }, pass: true },
  tasks: [
    T('ch2.l3', 1, 'goto', 'Take your position', { purpose: 'Your boots from Level 1 decide where you stand: striker up front, winger on the wing, defender at the back.', objective: 'Walk to your position', flag: BOOTS, variant: true, success: 'You stand in the ring for your position.',
      introByChoice: { striker: [say('tunde', 'Number 14, striker. Up front. Make me forget my last striker.', 'confident')], winger: [say('tunde', 'Number 14, winger. The wing is yours. Run like the train is leaving.', 'cheeky')], defender: [say('tunde', 'Number 14, defender. Back there. Nobody scores past you.', 'calm')] },
      intro: [say('tunde', 'Number 14! Take your place.', 'confident')], done: [say('folake', 'That is my child! Number fourteen! Look at him!', 'proud')], hint: 'Follow the ring: forward for strikers, the north wing for wingers, the back for defenders.' }),
    T('ch2.l3', 2, 'kick', 'Complete two passes', { purpose: 'The timing needle from the penalties, now as a pass to a teammate.', objective: 'Complete 2 passes', success: 'Two passes reach your teammate.',
      intro: [say('helper', 'Ball here! Ball here! No, HERE!', 'cheeky'), say('player', 'Eyes on the needle.', 'thinking')], done: [say('tunde', 'Good passing. Now run with it.', 'calm')], hint: 'Stand on the white spot and tap Pass with the needle inside the green bar.' }),
    T('ch2.l3', 3, 'reach', 'Beat the defenders', { purpose: 'A run through defenders; your position decides how hard and how long.', objective: 'Get past the defenders to the goal ring', flag: BOOTS, variant: true, success: 'You reach the ring before the timer ends.',
      intro: [say('tunde', 'Now go through them! They will not move for you!', 'angry')], done: [say('player', 'I am through! I am actually through!', 'laughing')], hint: 'The defenders slide across. Cross behind them, then sprint.' }),
    T('ch2.l3', 4, 'choose', 'The decisive moment', { purpose: 'The match turns on one choice. All three are fair.', objective: 'Shoot, pass or hold the ball', success: 'You choose.',
      intro: [say('player', 'Goal in front of me. A free teammate on my left. Or I just hold it...', 'thinking')], done: [say('tunde', 'Interesting.', 'suspicious')], hint: 'Three signs near the goal: shoot yourself, pass to the free teammate or hold the ball.' }),
    T('ch2.l3', 5, 'goto', 'Face the coach', { purpose: 'The coach has an opinion about what you just did.', objective: 'Walk to the coach', success: 'You reach the coach.',
      introByChoice: { shoot: [say('tunde', 'You shot. Brave. Greedy. Brave and greedy.', 'suspicious')], pass: [say('tunde', 'You passed. Team player. Or you were scared. I will decide.', 'thinking')], hold: [say('tunde', 'You held the ball. For a long time. A VERY long time.', 'tired')] },
      intro: [say('tunde', 'Come here.', 'calm')], done: [say('tunde', 'Wait there. I am writing something.', 'cheeky')], hint: 'The coach is by the dugout on the north touchline.' }),
  ],
  items: [
    { id: 'shoot', task: 3, x: 28, z: -4, label: 'Shoot it yourself', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'pass', task: 3, x: 28, z: 0, label: 'Pass to the free teammate', color: GREEN, shape: 'sign', y: 0 },
    { id: 'hold', task: 3, x: 28, z: 4, label: 'Hold the ball and wait', color: YELLOW, shape: 'sign', y: 0 },
  ],
  goto: [RING(14, -8), null, RING(30, 0, 1.8), null, RING(14, -9.4, 1.8)],
  guide: [RING(14, -8), { x: 6, z: 5, r: 1.5 }, RING(30, 0), { x: 28, z: 0, r: 5 }, RING(14, -9.4)],
  hazards: [D('dummy', 12, -8, 8, 2.6, 0, BLUE), D('dummy', 18, -8, 8, 2.8, 1.2, BLUE), D('dummy', 24, -8, 8, 2.4, 0.6, BLUE)],
  variants: {
    striker: { label: 'Striker', timeLimit: 14, goals: { 0: RB.striker }, hazards: [D('dummy', 27.4, -8, 8, 3.6, 0, BLUE), D('dummy', 29.2, -8, 8, 4.0, 1.3, BLUE)] },
    winger: { label: 'Winger', timeLimit: 18, goals: { 0: RB.winger }, hazards: [D('dummy', 20, -8, 8, 2.8, 0, BLUE), D('dummy', 24, -8, 8, 3.0, 1.2, BLUE), D('dummy', 27.4, -8, 8, 2.6, 0.6, BLUE)] },
    defender: { label: 'Defender', timeLimit: 24, goals: { 0: RB.defender }, hazards: [D('dummy', 12, -8, 8, 2.2, 0, BLUE), D('dummy', 18, -8, 8, 2.4, 1.2, BLUE), D('dummy', 24, -8, 8, 2.0, 0.6, BLUE)] },
  },
  timeLimit: 18,
  crowd: [{ x: 8, z: 8, rot: 3 }, { x: 22, z: -6, rot: 1 }, { x: 18, z: 9, rot: 3.1 }, { x: 30, z: 7, rot: -2 }],
  npcs: { folake: { x: -10, z: -9.4, rot: 0.7 }, tunde: { x: 14, z: -9.6, rot: 0.1 } }, choiceLabel: 'decision',
  endBeat: { text: 'The coach writes a number next to your name. You are not allowed to see it.', line: 'Next, a break and some strange offers.' },
  starRules: ['Finish the level', 'Get through the defenders before the timer ends', 'Do it on time with 2 mistakes or fewer'],
}), ride('the stadium', 'Train to the stadium', 'The trial match is at the stadium across town', [sayAs('Mama Folake', 'folake', 'The match is at the stadium. Take the train, eat something and do not be shy.', 'calm')], [say('helper', 'Real stadium. Real grass. Real nerves.', 'worried')]))

// ---------------------------------------------------------------------------------------------------------------- Level 4
const canteen = B('canteen', -8, 6, -12, -6.5, '#f0d9a8', 'CANTEEN', 3.4), physio = B('physio', 10, 19, -12, -6.5, '#c9d9e8', 'PHYSIO', 3.2), office = B('scoutoffice', 23, 32, -12, -6.5, '#e8d9c9', 'SCOUTS', 3.2)
export const LEVEL_C2L4 = withBus(L({
  ch: 'ch2', kit: true, n: 4, title: 'Between Sessions', next: 'ch2.l5', bounds: R(-12, 34, -12.4, 12.4),
  intro: 'Lunch break. The canteen is full of hungry hopefuls, the physio has a queue and somebody in a good jacket is watching from the shade.',
  theme: { ground: '#bfb393', floors: [{ x0: -12, x1: 34, z0: -12, z1: 12, color: '#d9cdb0' }], deco: FOOT([
    ...canteen.d, ...physio.d, ...office.d, { kind: 'rug', x: 14.5, z: 0.8, w: 7, d: 3, color: BLUE }, { kind: 'chair', x: 12, z: 0.8, color: DARK }, { kind: 'chair', x: 14.5, z: 0.8, color: DARK }, { kind: 'chair', x: 17, z: 0.8, color: DARK },
    { kind: 'chair', x: -2, z: 3, color: WOOD }, { kind: 'chair', x: 1, z: 3, color: WOOD }, { kind: 'chair', x: 4, z: 3, color: WOOD }, ...TREES([[-10, 9], [33, 9]]), ...LAMPS([[8, 3], [22, 3]]),
  ]) },
  furniture: [canteen.f, physio.f, office.f, F('counter', R(-6, 3, -6.2, -4.9), 1.0, DARK), F('ctable', R(-3, 5, 4.4, 5.6), 0.8, WOOD)],
  spawn: { x: -9, z: 0 }, resume: { x: -8, z: 0 },
  tasks: [
    T('ch2.l4', 1, 'serve', 'Serve the team', { purpose: 'Hand out the lunch: seat three hungry teammates and bring each what they asked for.', objective: 'Seat and serve three teammates', success: 'Everyone is eating.',
      intro: [sayAs('Canteen Lady', 'neighbour', 'Hands! I need hands! Three hungry boys. Orange for one, water for one, a bar for one. Do not mix them up!', 'worried')], done: [sayAs('Canteen Lady', 'neighbour', 'You have kind hands. You can come again tomorrow.', 'happy')], hint: 'Seat each teammate, take what he asked for from the counter and carry it to his chair.' }),
    T('ch2.l4', 2, 'hold', 'Physio break', { purpose: 'Your leg got a knock in the last drill: sit on the physio bench while it is checked.', objective: 'Sit for the physio', success: 'You are checked.',
      intro: [sayAs('Physio', 'helper', 'Sit. Breathe. This will hurt a little. Then it will hurt less. Then you will not notice.', 'calm')], done: [sayAs('Physio', 'helper', 'Nothing broken. Except your pride.', 'cheeky')], hint: 'Stand in the ring by the blue chairs outside the PHYSIO room.' }),
    T('ch2.l4', 3, 'talk', 'The man in the jacket', { purpose: 'A scout has been watching. Say hello and answer his question.', objective: 'Talk to the scout', success: 'The scout has what he needs.',
      intro: [say('player', 'He is watching me. Do not trip. Do not trip. Do not trip.', 'worried')], done: [sayAs('Mr Eze', 'neighbour', 'Good. Go and find your coach. He wants a word.', 'calm')], hint: 'The scout, Mr Eze, waits outside the SCOUTS building on the right.' }),
    T('ch2.l4', 4, 'find', 'Find the coach\'s office', { purpose: 'Three doors: kit room, physio and the coach.', objective: 'Find the coach\'s door', success: 'You find the coach.',
      intro: [say('player', 'Kit room. Physio. Coach. Read the signs.', 'thinking')], done: [say('player', 'Deep breath.', 'calm')], hint: 'The coach\'s door is the one marked COACH on the building row.' }),
  ],
  items: [
    { id: 'orange', task: 0, x: -4.8, z: -5.4, label: 'Take the orange', color: ORANGE, shape: 'produce', y: 1.1 },
    { id: 'water', task: 0, x: -2.2, z: -5.4, label: 'Take the water', color: '#6a8ab8', shape: 'bottle', y: 1.1 },
    { id: 'bar', task: 0, x: 0.4, z: -5.4, label: 'Take the energy bar', color: YELLOW, shape: 'snack', y: 1.1 },
  ],
  serves: { 0: { eatSecs: 3, from: 0, guests: [
    { id: 'kola', name: 'Kola', order: 'An orange', dish: 'orange', x: 8, z: -1, seat: { x: -2, z: 3 }, table: { x: -2, z: 4.9 } },
    { id: 'zaki', name: 'Zaki', order: 'Water', dish: 'water', x: 8, z: 1, seat: { x: 1, z: 3 }, table: { x: 1, z: 4.9 } },
    { id: 'ife', name: 'Ife', order: 'An energy bar', dish: 'bar', x: 8, z: 3, seat: { x: 4, z: 3 }, table: { x: 4, z: 4.9 } },
  ] } },
  holds: { 1: { x: 14.5, z: 0.8, r: 1.0, secs: 6, pose: 'sit' } },
  talks: { 2: [{ id: 'eze', name: 'Mr Eze', x: 27.5, z: -3.4, lines: [sayAs('Mr Eze', 'neighbour', 'You are fourteen. I have watched you run, pass and lose your shoe. Tell me why you play.', 'curious')], rounds: [{ options: [
    { id: 'love', label: '"Because I love it."', reply: sayAs('Mr Eze', 'neighbour', 'Love is a good start. It is a poor contract. But a good start.', 'happy') },
    { id: 'family', label: '"For my family."', reply: sayAs('Mr Eze', 'neighbour', 'Heavy reason. Carry it lightly.', 'calm') },
    { id: 'win', label: '"To win things."', reply: sayAs('Mr Eze', 'neighbour', 'Honest. Winners eat well. Losers learn.', 'cheeky') },
  ] }] }] },
  spots: [
    { id: 'kit', task: 3, x: 0, z: -2.8, label: 'Try the KIT ROOM door', wrong: say('player', 'Boots. So many boots. Wrong door.', 'tired') },
    { id: 'physio', task: 3, x: 14.5, z: -5, label: 'Try the PHYSIO door', wrong: say('player', 'A very large man is stretching. I will leave quietly.', 'worried') },
    { id: 'coach', task: 3, x: 27.5, z: -5, label: 'Try the COACH door', right: true },
  ],
  guide: [{ x: 0, z: 0, r: 6 }, RING(14.5, 0.8, 1.2), { x: 27.5, z: -3, r: 4 }, { x: 14, z: -4, r: 14 }],
  crowd: [{ x: 6, z: 6, rot: 3 }, { x: 22, z: 2, rot: -2 }, { x: 11, z: 7, rot: 1 }],
  npcs: { folake: { x: -10, z: 8.4, rot: 0.8 }, tunde: { x: 20, z: 9.6, rot: -2 } }, choiceLabel: 'answer',
  endBeat: { text: 'The coach is waiting behind the door with a clipboard and a face that gives nothing away.', line: 'A fitness test is next.' },
  starRules: ['Finish the level', 'Finish with no wrong doors', 'Finish without a wrong door or a hint'],
}), ride('the club', 'Train to the club', 'The break is at the club ground across town', [sayAs('Mama Folake', 'folake', 'They called you back to the club for lunch and a talk. Take the train and breathe.', 'worried')], [say('helper', 'This is the building where dreams get decided. Or posted on a notice board.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 5
export const LEVEL_C2L5 = withBus(L({
  ch: 'ch2', kit: true, n: 5, title: 'Fitness Test', next: 'ch2.l6', bounds: R(-12, 34, -12.4, 12.4),
  intro: 'A long line, a stopwatch and a coach who says "again" more than any other word. The fitness test is the part of the trial nobody practises for.',
  theme: { ground: '#9a8a6a', floors: [{ x0: -12, x1: 34, z0: -12, z1: 12, color: '#d9cdb0' }], deco: FOOT([
    { kind: 'pitch', x: 15, z: 0, w: 36, d: 20 }, { kind: 'rug', x: 10, z: 7.4, w: 4, d: 2.4, color: BLUE }, { kind: 'sign', x: -6, z: 4, label: 'START LINE', w: 1.8 }, { kind: 'sign', x: 32, z: 3, label: 'FINISH', w: 1.4 },
    { kind: 'sign', x: 10, z: 9.4, label: 'MATS', w: 1.2 }, ...TREES([[-10, 9], [33, -11]]), ...LAMPS([[0, 9]]),
  ]) },
  furniture: [],
  spawn: { x: -9, z: 0 }, resume: { x: -8, z: 0 },
  tasks: [
    T('ch2.l5', 1, 'reach', 'Sprint test', { purpose: 'A flat-out sprint down the track to the finish line, against the clock.', objective: 'Sprint to the finish line', success: 'You cross the line before the timer ends.',
      intro: [sayAs('Coach Dele', 'helper', 'Forty metres. As fast as you can. If you are not out of breath, you were not fast.', 'angry')], done: [sayAs('Coach Dele', 'helper', 'Not bad. Not good. Not bad.', 'cheeky')], hint: 'Run straight right along the track to the FINISH sign.' }),
    T('ch2.l5', 2, 'hold', 'Hold the plank', { purpose: 'Core strength: hold a plank on the blue mat until the coach says stop.', objective: 'Hold the plank on the mat', success: 'You held it.',
      intro: [sayAs('Coach Dele', 'helper', 'Plank. Eight seconds. Do not shake. If you shake, shake quietly.', 'calm')], done: [sayAs('Coach Dele', 'helper', 'Eight seconds. It felt like eight minutes to you. Good.', 'happy')], hint: 'Stand on the blue mat and hold on.' }),
    T('ch2.l5', 3, 'sequence', 'Cone drill', { purpose: 'Weave round the cones in order: first, second, third, fourth.', objective: 'Weave round all four cones in order', success: 'The cone drill is done.',
      intro: [sayAs('Coach Dele', 'helper', 'Cones. In order. One, two, three, four. Not one, four, two, three. I will know.', 'suspicious')], done: [sayAs('Coach Dele', 'helper', 'Neat feet.', 'happy')], hint: 'Cones one to four go down the pitch, left to right.' }),
    T('ch2.l5', 4, 'choose', 'Rest or push on', { purpose: 'The last set. Rest and finish fresh, or push on and finish tired but proud.', objective: 'Decide: rest or push on', success: 'You choose.',
      intro: [say('player', 'My legs have left. My heart has not.', 'tired')], done: [sayAs('Coach Dele', 'helper', 'Interesting. Write it in the book.', 'thinking')], hint: 'Two signs in the middle: rest, or push on.' }),
  ],
  items: [
    { id: 'c1', task: 2, x: 4, z: -4, label: 'Weave round cone 1', color: ORANGE, shape: 'cones', y: 0.1, act: 'dribble' },
    { id: 'c2', task: 2, x: 10, z: 4, label: 'Weave round cone 2', color: ORANGE, shape: 'cones', y: 0.1, act: 'dribble' },
    { id: 'c3', task: 2, x: 16, z: -4, label: 'Weave round cone 3', color: ORANGE, shape: 'cones', y: 0.1, act: 'dribble' },
    { id: 'c4', task: 2, x: 22, z: 4, label: 'Weave round cone 4', color: ORANGE, shape: 'cones', y: 0.1, act: 'dribble' },
    { id: 'rest', task: 3, x: 18, z: -1.6, label: 'Rest and finish fresh', color: GREEN, shape: 'sign', y: 0 },
    { id: 'push', task: 3, x: 22, z: -1.6, label: 'Push on, finish proud', color: RUST, shape: 'sign', y: 0 },
  ],
  sequences: { 2: ['c1', 'c2', 'c3', 'c4'] },
  holds: { 1: { x: 10, z: 7.4, r: 1.1, secs: 8, pose: 'plank' } },
  goto: [RING(31, 0, 1.6), null, null, null],
  guide: [RING(31, 0), RING(10, 7.4, 1.2), { x: 13, z: 0, r: 10 }, { x: 20, z: -1.6, r: 4 }],
  hazards: [],
  timeLimit: 11,
  crowd: [{ x: -4, z: 2, rot: 1.6 }, { x: -4, z: -2, rot: 1.6 }, { x: 14, z: -9, rot: 0 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 28, z: -9, rot: -1 } }, choiceLabel: 'last set',
  endBeat: { text: 'Everyone lies on the grass in a heap. Someone laughs. Someone cries. Both of them are fine.', line: 'Somebody lost a boot.' },
  starRules: ['Finish the level', 'Sprint across the line before the timer ends', 'Be on time with no mistakes'],
}), ride('the sports ground', 'Train to the sports ground', 'The fitness test is at the sports ground across town', [sayAs('Mama Folake', 'folake', 'Fitness test this morning. Take the train and do not run for it. Save the legs!', 'happy')], [sayAs('Baba Tunde', 'tunde', 'If you are tired already, we have a problem.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 6
const shop6 = B('sportshop', 14, 24, -12, -6.5, '#c9d9e8', 'SPORTS SHOP', 3.4), gate6 = B('lockers', -6, 2, -12, -6.5, '#d9e0b0', 'LOCKERS', 3.0)
export const LEVEL_C2L6 = withBus(L({
  ch: 'ch2', kit: true, n: 6, title: 'Kit Trouble', next: 'ch2.l7', bounds: R(-12, 34, -12.4, 12.4),
  intro: 'Match morning, ten minutes before kick-off: one boot is missing, a lace has snapped and the shop opens right when you need it.',
  theme: { ground: '#bfb393', floors: [{ x0: -12, x1: 34, z0: -12, z1: 12, color: '#d9cdb0' }], deco: FOOT([
    ...shop6.d, ...gate6.d, { kind: 'stall', x: 6, z: 8.6, w: 3.4, d: 1.6, color: GREEN, label: 'TAPE AND SPRAY' }, { kind: 'pitch', x: 28, z: 5, w: 10, d: 10 }, { kind: 'chair', x: 10, z: 2, color: WOOD },
    { kind: 'sign', x: 33, z: 0, label: 'PITCH', w: 1.4 }, ...TREES([[-10, 9], [-10, -10]]), ...LAMPS([[4, 3], [20, 3]]),
  ]) },
  furniture: [shop6.f, gate6.f, F('bench', R(8, 12, 2.6, 3.4), 0.6, DARK), F('stall', R(4.3, 7.7, 7.8, 9.4), 1.0, WOOD)],
  spawn: { x: -9, z: 0 }, resume: { x: -8, z: 0 },
  tasks: [
    T('ch2.l6', 1, 'find', 'Find your missing boot', { purpose: 'One boot has walked off. Look in the likely places.', objective: 'Find your missing boot', success: 'You find the boot.',
      intro: [say('player', 'One boot. ONE boot. I had two this morning. I definitely had two.', 'worried')], done: [say('helper', 'In the lockers. Of course it was in the lockers.', 'tired')], hint: 'Try the bench, the stall and the LOCKERS building.' }),
    T('ch2.l6', 2, 'collect', 'Fix the broken lace', { purpose: 'A lace, tape and spray from three different places before kick-off.', objective: 'Fetch a lace, tape and spray', success: 'Everything is in your hands.',
      intro: [say('helper', 'Lace from the shop. Tape and spray from the stall. Go go go!', 'worried')], done: [say('player', 'Lace, tape, spray. I look like a walking emergency kit.', 'laughing')], hint: 'The lace is at the SPORTS SHOP; tape and spray are on the green stall.' }),
    T('ch2.l6', 3, 'sequence', 'Get dressed in order', { purpose: 'Socks first, then shin pads, then boots. The other way round feels wrong.', objective: 'Socks, shin pads, then boots', success: 'You are dressed.',
      intro: [say('tunde', 'Socks, then pads, then boots. In that order. Do not argue with the bench.', 'calm')], done: [say('tunde', 'You look like a footballer. I will tell you when you play like one.', 'cheeky')], hint: 'Order on the bench: socks, shin pads, boots.' }),
    T('ch2.l6', 4, 'reach', 'Hurry to the pitch', { purpose: 'The whistle has gone: cross the car park to the pitch.', objective: 'Run to the pitch gate in time', success: 'You reach the pitch before the timer ends.',
      intro: [say('tunde', 'Kick-off in one minute! Move move move!', 'angry')], done: [say('folake', 'You made it! Run on the pitch! Do not trip!', 'happy')], hint: 'Cross behind the carts, then go right to the PITCH sign.' }),
  ],
  spots: [
    { id: 'bench', task: 0, x: 10, z: 4.6, label: 'Look under the bench', wrong: say('player', 'A water bottle and a very old sock. Not my boot.', 'tired') },
    { id: 'stall', task: 0, x: 6, z: 6, label: 'Ask at the stall', wrong: say('helper', 'The seller says he sells tape and spray, not mysteries.', 'cheeky') },
    { id: 'locker', task: 0, x: -2, z: -5.2, label: 'Check the lockers', right: true },
  ],
  items: [
    { id: 'lace', task: 1, x: 18, z: -5.6, label: 'Buy a lace', color: '#fbf8f0', shape: 'produce', y: 1.1, act: 'grab' },
    { id: 'tape', task: 1, x: 5, z: 8.2, label: 'Take the tape', color: '#6a8ab8', shape: 'bank', y: 1.05, act: 'grab' },
    { id: 'spray', task: 1, x: 6.8, z: 8.2, label: 'Take the spray', color: ORANGE, shape: 'bottle', y: 1.05, act: 'grab' },
    { id: 'socks', task: 2, x: 8.6, z: 3.0, label: 'Pull on the socks', color: '#fbf8f0', shape: 'blanket', y: 0.65, act: 'kneelTie' },
    { id: 'pads', task: 2, x: 10, z: 3.0, label: 'Strap on the shin pads', color: '#fbf8f0', shape: 'shinpad', y: 0.65, act: 'kneelTie' },
    { id: 'boots', task: 2, x: 11.4, z: 3.0, label: 'Lace up the boots', color: YELLOW, shape: 'boots', y: 0.65, act: 'kneelTie' },
  ],
  sequences: { 2: ['socks', 'pads', 'boots'] },
  goto: [null, null, null, RING(31.4, 0, 1.6)],
  guide: [{ x: 3, z: 0, r: 12 }, { x: 11, z: 0, r: 14 }, { x: 10, z: 3, r: 3 }, RING(31.4, 0)],
  hazards: [D('cart', 14, -8, 8, 3.0, 0, RUST), D('walker', 19, -8, 8, 2.8, 1.3, GREEN), D('cart', 24, -8, 8, 3.2, 0.7, ORANGE)],
  timeLimit: 18,
  crowd: [{ x: 14, z: 5, rot: 3 }, { x: 22, z: 8, rot: 2 }, { x: 30, z: -4, rot: -2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 32, z: -8, rot: -1 } }, choiceLabel: 'kit',
  endBeat: { text: 'Boots on, laces tight, tape in your pocket. For the first time today your feet feel like yours.', line: 'The rival is waiting.' },
  starRules: ['Finish the level', 'Reach the pitch before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the ground', 'Train to the ground', 'You are running late', [sayAs('Mama Folake', 'folake', 'You are late and your boot is missing. I can solve one of those. Take the train!', 'worried')], [say('helper', 'Late and shoeless. Classic.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 7
export const LEVEL_C2L7 = withBus(L({
  ch: 'ch2', kit: true, n: 7, title: 'The Rival', next: 'ch2.l8', bounds: R(-12, 34, -12.4, 12.4),
  intro: 'Another team, another ground and a boy called Chuka who has been telling everyone he will take your place.',
  theme: { ground: '#9a8a6a', floors: [{ x0: -12, x1: 34, z0: -12, z1: 12, color: '#d9cdb0' }], deco: FOOT([
    { kind: 'pitch', x: 17, z: 0, w: 30, d: 20 }, { kind: 'goal', x: 31.4, z: 0, d: 4.3 }, { kind: 'sign', x: -2, z: -8, label: 'VISITORS', w: 1.6 }, ...TREES([[-10, 9], [-10, -9]]), ...LAMPS([[0, 5]]),
  ]) },
  furniture: [F('bench', R(-6, 0, -10, -9), 0.6, DARK)],
  spawn: { x: -9, z: 0 }, resume: { x: -8, z: 0 }, kick: { x: 22, z: 0, goals: 3, goal: { x: 30.2, z: 0 } },
  tasks: [
    T('ch2.l7', 1, 'talk', 'Meet the rival', { purpose: 'Chuka wants to get under your skin. Answer him however you like.', objective: 'Talk to Chuka and the referee', success: 'The taunts are done.',
      intro: [say('helper', 'That is Chuka. He tells everybody he is the best. Everybody is tired of it.', 'suspicious')], done: [sayAs('Mr Yusuf', 'neighbour', 'Penalties. Three each. Shake hands after. No tricks.', 'calm')], hint: 'Chuka is on the left of the pitch; the referee, Mr Yusuf, is by the bench.' }),
    T('ch2.l7', 2, 'kick', 'Penalty shoot-out', { purpose: 'Time the needle: tap Kick when it is in the green.', objective: 'Score 3 penalties', success: 'Three penalties go in.',
      intro: [sayAs('Chuka', 'helper', 'I never miss. I never ever miss.', 'cheeky')], done: [say('player', 'Three. Three out of three. He missed one. I am not smiling. I am smiling.', 'laughing')], hint: 'Stand on the white spot and tap Kick with the needle in the green.' }),
    T('ch2.l7', 3, 'goto', 'Walk to the centre', { purpose: 'The teams gather in the centre circle for the handshake.', objective: 'Walk to the centre circle', success: 'You reach the centre.',
      intro: [sayAs('Mr Yusuf', 'neighbour', 'Centre circle, everyone. Do not look at the scoreboard.', 'calm')], done: [sayAs('Chuka', 'helper', 'Well played. Do not tell anyone I said that.', 'angry')], hint: 'Follow the ring to the white circle in the middle.' }),
    T('ch2.l7', 4, 'choose', 'Shake hands?', { purpose: 'He puts out his hand. You choose how to answer.', objective: 'Decide how to answer him', success: 'You choose.',
      intro: [sayAs('Chuka', 'helper', 'Well. Hand? Or are you afraid of me?', 'cheeky')], done: [sayAs('Mr Yusuf', 'neighbour', 'Good sportsmanship. Or a good attempt at it.', 'happy')], hint: 'Three signs in the circle: shake hands, a nod or walk away.' }),
  ],
  talks: { 0: [
    { id: 'chuka', name: 'Chuka', x: 6, z: -3, lines: [sayAs('Chuka', 'helper', 'You are the new boy? Number 14? I will take your spot by Friday.', 'cheeky')], rounds: [{ options: [
      { id: 'calm', label: '"May the better player win."', reply: sayAs('Chuka', 'helper', 'Calm? We will see how calm you are.', 'suspicious') },
      { id: 'cheeky', label: '"Bring your own ball. You will need it."', reply: sayAs('Chuka', 'helper', 'Cheeky! I like it. Now prove it.', 'angry') },
      { id: 'ignore', label: '(Say nothing and tie your lace.)', reply: sayAs('Chuka', 'helper', 'Ignoring me? Look at me when I score!', 'angry') },
    ] }] },
    { id: 'yusuf', name: 'Mr Yusuf', x: -2, z: -6.6, lines: [sayAs('Mr Yusuf', 'neighbour', 'I am the referee. I have seen everything. Behave, and we will both enjoy this.', 'calm')] },
  ] },
  items: [
    { id: 'shake', task: 3, x: 15, z: -2.4, label: 'Shake his hand', color: GREEN, shape: 'sign', y: 0 },
    { id: 'nod', task: 3, x: 17.4, z: 0, label: 'Give a polite nod', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'leave', task: 3, x: 15, z: 2.4, label: 'Walk away', color: RUST, shape: 'sign', y: 0 },
  ],
  goto: [null, null, RING(17, 0, 1.8), null],
  guide: [{ x: 3, z: -4, r: 8 }, { x: 22, z: 0, r: 1.5 }, RING(17, 0, 1.8), { x: 16, z: 0, r: 4 }],
  crowd: [{ x: 10, z: 8, rot: 3 }, { x: 28, z: 8, rot: -2 }, { x: 22, z: -9, rot: 0 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 14, z: -10, rot: 0 } }, choiceLabel: 'handshake',
  endBeat: { text: 'He walks off muttering. You walk off grinning. The coach says nothing, which from a coach is a speech.', line: 'The friendly match is next.' },
  starRules: ['Finish the level', 'Finish with no hints', 'Finish without a hint'],
}), ride('the rival\'s ground', 'Train to the rival\'s ground', 'The match is at his school\'s ground across town', [sayAs('Mama Folake', 'folake', 'His school is across town. Be polite, win politely and take the train.', 'calm')], [say('helper', 'He has been telling everyone he will win.', 'suspicious')]))

// ---------------------------------------------------------------------------------------------------------------- Level 8
export const LEVEL_C2L8 = withBus(L({
  ch: 'ch2', kit: true, n: 8, title: 'The Friendly Match', next: 'ch2.l9', bounds: R(-12, 34, -12.4, 12.4),
  intro: 'The big stadium, a proper crowd and a friendly match that nobody calls a trial. Your position, your earlier choices and your nerves all play.',
  theme: { ground: '#9a8a6a', floors: [{ x0: -12, x1: 34, z0: -12, z1: 12, color: '#cfc4a8' }], deco: FOOT([
    { kind: 'pitch', x: 15, z: 0, w: 38, d: 22 }, { kind: 'goal', x: 33.4, z: 0, d: 4.3 }, ...TREES([[-10, 10], [-10, -10]]), ...LAMPS([[-6, 4]]),
  ]) },
  furniture: [],
  spawn: { x: -9, z: 0 }, resume: { x: -8, z: 0 }, kick: { x: 24, z: 0, goals: 3, goal: { x: 32.4, z: 0 } },
  tasks: [
    T('ch2.l8', 1, 'goto', 'Take your position', { purpose: 'Your boots decide where you play, as in the trial match.', objective: 'Walk to your position', flag: BOOTS, variant: true, success: 'You stand in your ring.',
      intro: [say('tunde', 'Same position as before. Do not improvise. Improvising is for jazz.', 'cheeky')], done: [say('folake', 'Look at the crowd! Look at my child!', 'proud')], hint: 'Follow the ring to your position.' }),
    T('ch2.l8', 2, 'reach', 'Counter-attack', { purpose: 'A timed run. How you played the decisive moment earlier shapes it.', objective: 'Run the counter-attack to the goal ring', flag: DECISION, variant: true, success: 'You reach the ring before the timer ends.',
      intro: [say('tunde', 'Turnover! GO! Go go go!', 'angry')], done: [say('player', 'I am through! Again! Same as before! Not the same!', 'laughing')], hint: 'Cross behind the defenders and sprint to the ring.' }),
    T('ch2.l8', 3, 'kick', 'Take the penalty', { purpose: 'A penalty to win it: time the needle.', objective: 'Score 3 penalties', success: 'Three penalties go in.',
      intro: [say('player', 'Everybody is watching. Everybody. Even the pigeons.', 'worried')], done: [say('folake', 'GOAL! That is my child!', 'laughing')], hint: 'Stand on the white spot and tap Kick with the needle in the green.' }),
    T('ch2.l8', 4, 'hold', 'Defend the lead', { purpose: 'Stay in your zone and protect the lead until the whistle.', objective: 'Hold your zone until the whistle', success: 'The whistle goes.',
      intro: [say('tunde', 'Hold the line! Do not chase the ball! Hold!', 'angry')], done: [say('tunde', 'Fulltime! We won! I am not crying! Dust!', 'happy')], hint: 'Stay in the ring and do not wander.' }),
    T('ch2.l8', 5, 'choose', 'Celebrate', { purpose: 'The final whistle. Pick how you celebrate.', objective: 'Pick your celebration', success: 'You celebrate.',
      intro: [say('helper', 'Run to the corner! Slide on your knees! Or hug someone! Or cry! All allowed!', 'cheeky')], done: [say('folake', 'That is MY child! Everyone! My child!', 'laughing')], hint: 'Three signs near the corner: slide, hug the team or a quiet thank-you.' }),
  ],
  holds: { 3: { x: 4, z: 0, r: 2.2, secs: 8, pose: 'lean' } },
  items: [
    { id: 'slide', task: 4, x: 27, z: -4, label: 'Slide on your knees', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'hug', task: 4, x: 27, z: 0, label: 'Hug the whole team', color: GREEN, shape: 'sign', y: 0 },
    { id: 'thanks', task: 4, x: 27, z: 4, label: 'Quiet thank-you to the sky', color: YELLOW, shape: 'sign', y: 0 },
  ],
  goto: [RING(14, -8), RING(30, 0, 1.8), null, null, null],
  guide: [RING(14, -8), RING(30, 0), { x: 24, z: 0, r: 1.5 }, RING(4, 0, 2.2), { x: 27, z: 0, r: 5 }],
  hazards: [D('dummy', 12, -8, 8, 2.6, 0, BLUE), D('dummy', 18, -8, 8, 2.8, 1.2, BLUE), D('dummy', 24, -8, 8, 2.4, 0.6, BLUE)],
  variants: {
    striker: { label: 'Striker', ...{ timeLimit: 20, hazards: [] as never[] }, goals: { 0: RB.striker } }, winger: { label: 'Winger', timeLimit: 20, hazards: [], goals: { 0: RB.winger } }, defender: { label: 'Defender', timeLimit: 20, hazards: [], goals: { 0: RB.defender } },
    shoot: { label: 'Shot', timeLimit: 14, hazards: [D('dummy', 14, -8, 8, 3.4, 0, BLUE), D('dummy', 20, -8, 8, 3.8, 1.2, BLUE), D('dummy', 26, -8, 8, 3.2, 0.6, BLUE)] },
    pass: { label: 'Pass', timeLimit: 18, hazards: [D('dummy', 16, -8, 8, 2.8, 0, BLUE), D('dummy', 23, -8, 8, 3.0, 1.2, BLUE)] },
    hold: { label: 'Hold', timeLimit: 24, hazards: [D('dummy', 14, -8, 8, 2.2, 0, BLUE), D('dummy', 20, -8, 8, 2.4, 1.2, BLUE), D('dummy', 26, -8, 8, 2.0, 0.6, BLUE)] },
  },
  timeLimit: 18,
  crowd: [{ x: 8, z: 8, rot: 3 }, { x: 22, z: -6, rot: 1 }, { x: 18, z: 9, rot: 3.1 }, { x: 30, z: 7, rot: -2 }],
  npcs: { folake: { x: -10, z: -9.4, rot: 0.7 }, tunde: { x: 14, z: -10, rot: 0.1 } }, choiceLabel: 'celebration',
  endBeat: { text: 'The crowd chants a number. It is yours. You pretend you do not hear it. You hear it.', line: 'The verdict is next.' },
  starRules: ['Finish the level', 'Finish with the clock on your side', 'Finish on time with no mistakes'],
}), ride('the stadium', 'Train to the match', 'The friendly is at the big stadium', [sayAs('Mama Folake', 'folake', 'The friendly match! Everyone is coming to see you. Take the train and hold your head high.', 'happy')], [sayAs('Baba Tunde', 'tunde', 'Big crowd today. Do not look at it. Look at the ball.', 'confident')]))

// ---------------------------------------------------------------------------------------------------------------- Level 9
const clubBld = B('club', -6, 32, -12, -7, '#c9d9e8', 'CLUB OFFICE', 4.0)
export const LEVEL_C2L9 = withBus(L({
  ch: 'ch2', kit: true, n: 9, title: 'The Verdict', next: null, badge: 'Trial Day', bounds: R(-12, 34, -12.4, 12.4),
  intro: 'A week of drills, matches and nerves comes down to a lobby, a clipboard and one conversation with a man who never smiles on purpose.',
  theme: { ground: '#bfb393', floors: [{ x0: -12, x1: 34, z0: -12, z1: 12, color: '#e8e0cf' }], deco: FOOT([
    ...clubBld.d, { kind: 'rug', x: 6, z: 2, w: 8, d: 3, color: BLUE }, { kind: 'chair', x: 3, z: 2, color: DARK }, { kind: 'chair', x: 6, z: 2, color: DARK }, { kind: 'chair', x: 9, z: 2, color: DARK },
    { kind: 'pitch', x: 28, z: 4, w: 10, d: 12 }, { kind: 'sign', x: 33, z: 4, label: 'PITCH', w: 1.4 }, ...TREES([[-10, 9], [30, -5]]), ...LAMPS([[12, 3]]),
  ]) },
  furniture: [clubBld.f, F('desk', R(16, 22, -5, -3.6), 1.0, DARK)],
  spawn: { x: -9, z: 0 }, resume: { x: -8, z: 0 },
  tasks: [
    T('ch2.l9', 1, 'hold', 'Wait to be called', { purpose: 'Sit in the lobby with the other hopefuls and wait for your name.', objective: 'Sit and wait for your name', success: 'Your name is called.',
      intro: [sayAs('Receptionist', 'neighbour', 'Please sit. Names are called in the order the coach feels like it.', 'calm')], done: [sayAs('Receptionist', 'neighbour', 'Number fourteen. He will see you now.', 'calm')], hint: 'Stand in the ring on the blue rug by the chairs.' }),
    T('ch2.l9', 2, 'talk', 'The coach\'s verdict', { purpose: 'Coach Tunde gives you his verdict and an offer. Say what you honestly think.', objective: 'Talk to Coach Tunde and Mama Folake', success: 'You know where you stand.',
      intro: [say('player', 'He looked at me. He looked away. He looked at me again. I cannot read him.', 'worried')], done: [say('folake', 'Whatever he said, my child, you are already a champion to me.', 'proud')], hint: 'Coach Tunde is at the desk on the right; Mama Folake is by the lobby chairs.' }),
    T('ch2.l9', 3, 'sequence', 'Sign the forms', { purpose: 'Paperwork, in the right order: name, number, guardian.', objective: 'Sign name, number, then guardian', success: 'The forms are signed in order.',
      intro: [sayAs('Receptionist', 'neighbour', 'Name first, then your number, then the guardian line. Your mother signs the last one.', 'calm')], done: [sayAs('Receptionist', 'neighbour', 'Welcome to the academy. Or to the waiting list. I am not allowed to say which.', 'cheeky')], hint: 'Order on the desk: name, number, guardian.' }),
    T('ch2.l9', 4, 'goto', 'Walk onto the pitch', { purpose: 'The first walk onto the pitch as a player.', objective: 'Walk onto the pitch', success: 'You stand on the pitch.',
      intro: [say('tunde', 'Go on. Walk out there. First one on the pitch is always the bravest.', 'proud')], done: [say('tunde', 'Number fourteen. Welcome to the club.', 'proud')], hint: 'The pitch is on the right.' }),
  ],
  holds: { 0: { x: 6, z: 2, r: 1.0, secs: 6, pose: 'sit' } },
  talks: { 1: [
    { id: 'coachT', name: 'Coach Tunde', x: 19, z: -1.8, lines: [sayAs('Coach Tunde', 'tunde', 'Number fourteen. We watched all of it. The penalties, the passing, the boot you lost. We would like to offer you a place.', 'calm')], rounds: [{ options: [
      { id: 'accept', label: '"Yes. Thank you, coach."', reply: sayAs('Coach Tunde', 'tunde', 'Good. Monday, seven sharp. Do not be late. Or do, once.', 'happy') },
      { id: 'time', label: '"May I think about it?"', reply: sayAs('Coach Tunde', 'tunde', 'You have until tonight. Think quickly.', 'suspicious') },
      { id: 'decline', label: '"Thank you, but I have other plans."', reply: sayAs('Coach Tunde', 'tunde', 'Brave. Wrong, maybe. Brave.', 'surprised') },
    ] }] },
    { id: 'mama', name: 'Mama Folake', x: 8, z: 5.4, lines: [sayAs('Mama Folake', 'folake', 'I cried at the match. I cried on the train. I am saving some crying for the car.', 'happy')] },
  ] },
  items: [
    { id: 'f_name', task: 2, x: 17, z: -3.9, label: 'Sign your name', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'write' },
    { id: 'f_num', task: 2, x: 19, z: -3.9, label: 'Write your number', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'write' },
    { id: 'f_guard', task: 2, x: 21, z: -3.9, label: 'Guardian signature', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'write' },
  ],
  sequences: { 2: ['f_name', 'f_num', 'f_guard'] },
  goto: [null, null, null, RING(29, 4, 1.8)],
  guide: [RING(6, 2, 1.2), { x: 14, z: 0, r: 8 }, { x: 19, z: -3.5, r: 3 }, RING(29, 4)],
  crowd: [{ x: 3, z: 4, rot: 0.2 }, { x: 11, z: 6, rot: -1.5 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 24, z: 7, rot: -2.4 } }, choiceLabel: 'answer',
  endBeat: { text: 'You step onto the grass in a club tracksuit. The coach does not smile. The grass does. Mama Folake does for both of you.', line: 'Chapter 2 is done.' },
  starRules: ['Finish the level', 'Finish with no hints', 'Finish without a hint'],
}), ride('the club office', 'Train to the club office', 'The verdict is at the club office across town', [sayAs('Mama Folake', 'folake', 'Today they tell you. Whatever they say, I am proud. Now take the train before I cry.', 'worried')], [sayAs('Baba Tunde', 'tunde', 'Deep breath. Same train, different day.', 'calm')]))
void YELLOW; void RUST
