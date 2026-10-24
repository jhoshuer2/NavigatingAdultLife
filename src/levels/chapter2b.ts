// Chapter 2 "Trial Day", levels 4 to 9: after the match, the waiting, the fitness test, the kit trouble, the rival, a friendly and the verdict.
// Same helpers as chapter 1 (see chapter1b.ts). Several tasks read the choices made earlier in the chapter (boots in level 1, the decisive moment in level 3).
import type { Furn } from './schema'
import { withBus } from './bus'
import { L, T, R, F, say, D, NO_HAZ, WOOD, DARK } from './chapter1b'

const GREEN = '#2f5a3a', ORANGE = '#e07a1f', YELLOW = '#f5b91c', RUST = '#c4562a', BLUE = '#2b6ad0'
const RING = (x: number, z: number, r = 1.6) => ({ x, z, r })
const PITCH_THEME = { ground: '#5fae4f', floors: [], deco: [] }
const GOALS: Furn[] = [F('goalL', R(11.8, 12.2, -2.2, -1.9), 1.6, '#fbf8f0'), F('goalR', R(11.8, 12.2, 1.9, 2.2), 1.6, '#fbf8f0')]
const BOOTS = 'ch2.l1.item', DECISION = 'ch2.l3.item'

// ---------------------------------------------------------------------------------------------------------------- Level 4
export const LEVEL_C2L4 = withBus(L({
  ch: 'ch2', kit: true, n: 4, title: 'The Waiting Game', next: 'ch2.l5',
  intro: 'The match is over. Now comes the hardest part of any trial: waiting for someone else to decide your future.',
  theme: { ground: '#cfc4a8', floors: [{ x0: -11.4, x1: 11.4, z0: -5.4, z1: 5.4, color: '#e6dcc4' }], deco: [
    { kind: 'wall', x: 0, z: -6.6, w: 26, d: 1, h: 3.2, color: '#f3e7cf' }, { kind: 'window', x: -3, z: -6.1, w: 3, h: 1.2 },
    { kind: 'sign', x: -6, z: -4.6, label: 'KIT ROOM', w: 2 }, { kind: 'sign', x: 0, z: -4.6, label: 'PHYSIO', w: 2 }, { kind: 'sign', x: 6, z: -4.6, label: 'COACH', w: 2 },
    { kind: 'sign', x: 9.8, z: -4.6, label: 'RESULTS', w: 2 }, { kind: 'rug', x: -5, z: 1, w: 7, d: 4, color: '#6a8ab8' }, { kind: 'tree', x: -11, z: -5 },
  ] },
  furniture: [F('bench1', R(-9, -5.6, 2.2, 3.0), 0.6, DARK), F('bench2', R(-9, -5.6, -2.0, -1.2), 0.6, DARK), F('board', R(8.6, 11, -5.4, -4.6), 1.6, WOOD), F('table', R(2, 4.4, 2.0, 3.4), 0.8, WOOD)],
  spawn: { x: -10.6, z: 0 }, resume: { x: -2, z: 0 },
  tasks: [
    T('ch2.l4', 1, 'goto', 'Check the results board', { purpose: 'A short walk to the noticeboard, and a bad surprise.', objective: 'Walk to the results board', success: 'You reach the board.',
      intro: [say('helper', 'They put the list up! Or they did not. I forgot to look.', 'worried')], done: [say('player', 'It says "Results at five". It is two o\'clock.', 'tired')], hint: 'The board is on the right, by the RESULTS sign.' }),
    T('ch2.l4', 2, 'hold', 'Wait for the news', { purpose: 'Patience: sit with everyone else and wait.', objective: 'Wait on the bench', success: 'The wait is over.',
      intro: [say('neighbour', 'Eat something. Sit down. Do not look at the door.', 'worried'), say('helper', 'It is the door that looks at you.', 'cheeky')], done: [say('tunde', 'Number 14! Come to my office. Now. Not now. In a minute.', 'suspicious')], hint: 'Just stand inside the glowing ring by the benches.' }),
    T('ch2.l4', 3, 'find', "Find the coach's office", { purpose: 'Three doors, one is the coach.', objective: "Find the coach's door", success: 'You find the coach.',
      intro: [say('player', 'Kit room. Physio. Coach. Read the signs.', 'thinking')], done: [say('player', 'Deep breath.', 'calm')], hint: 'The sign on the right says COACH.' }),
    T('ch2.l4', 4, 'choose', 'Walk in or wait?', { purpose: 'A small nervous decision before the door.', objective: 'Decide how to go in', success: 'You choose.',
      intro: [say('folake', 'Knock, my child. Politely. Like I taught you.', 'calm')], done: [say('tunde', 'Interesting entrance.', 'cheeky')], hint: 'Knock, wait for the call, or peek. All are fine.' }),
  ],
  spots: [
    { id: 'kit', task: 2, x: -6, z: -3.4, label: 'Try the KIT ROOM door', wrong: say('player', 'Boots. So many boots. Wrong door.', 'tired') },
    { id: 'physio', task: 2, x: 0, z: -3.4, label: 'Try the PHYSIO door', wrong: say('player', 'A very large man is stretching. I will leave quietly.', 'worried') },
    { id: 'coach', task: 2, x: 6, z: -3.4, label: 'Try the COACH door', right: true },
  ],
  items: [
    { id: 'knock', task: 3, x: 4.6, z: -1.4, label: 'Knock and go in', color: GREEN, shape: 'sign', y: 0 },
    { id: 'waitcall', task: 3, x: 6.2, z: -1.4, label: 'Wait to be called', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'peek', task: 3, x: 7.8, z: -1.4, label: 'Peek through the door', color: ORANGE, shape: 'sign', y: 0 },
  ],
  holds: { 1: { x: -5, z: 0.4, r: 1.6, secs: 8 } },
  guide: [RING(9.6, -3.4), RING(-5, 0.4), { x: 0, z: -3, r: 6 }, { x: 6.2, z: -1.4, r: 3 }],
  goto: [RING(9.6, -3.2), null, null, null],
  crowd: [{ x: -7.4, z: 1.4, rot: 0.3 }, { x: -7.4, z: -2.6, rot: 3 }, { x: 2.6, z: 3.8, rot: 3.1 }],
  npcs: { folake: { x: 10.6, z: 3.6, rot: -2.2 }, tunde: { x: 6, z: -4.2, rot: 0 } }, choiceLabel: 'entrance',
  endBeat: { text: 'The door closes behind you. The coach has a clipboard and a face that gives nothing away.', line: 'A fitness test is next.' },
  starRules: ['Finish the level', 'Take your time: no timer here', 'Finish with two or fewer wrong doors'],
}), { vehicle: 'train', to: 'the club', title: 'Train to the club', purpose: 'The results are at the club office across town: wait at the stop, board the train and ride there.', objective: 'Take the train to the club', success: 'You get off at the club.', intro: [{ who: 'folake', text: 'They called. Come to the club office for the results. Take the train and breathe.', expr: 'worried' }], done: [{ who: 'helper', text: 'This is the building where dreams get decided. Or posted on a notice board.', expr: 'cheeky' }] })

// ---------------------------------------------------------------------------------------------------------------- Level 5
export const LEVEL_C2L5 = withBus(L({
  ch: 'ch2', kind: 'pitch', kit: true, n: 5, title: 'Fitness Test', next: 'ch2.l6',
  intro: 'The coach does not just want skill. He wants to know whether you can run, hold and remember, all while tired.',
  theme: PITCH_THEME, furniture: GOALS, spawn: { x: -10.8, z: 0 }, resume: { x: -8, z: 0 },
  tasks: [
    T('ch2.l5', 1, 'goto', 'Line up', { purpose: 'Get into line with the other hopefuls.', objective: 'Walk to the start line', success: 'You stand on the start line.',
      intro: [say('tunde', 'Fitness test. Line up. Yes, even you, number 14.', 'confident')], done: [say('helper', 'My legs feel like soup already.', 'tired')], hint: 'Follow the ring to the white line on the left.' }),
    T('ch2.l5', 2, 'reach', 'Sprint test', { purpose: 'One straight sprint against the clock.', objective: 'Sprint to the far ring', success: 'You cross the far ring before the timer ends.',
      intro: [say('tunde', 'Sprint! On my whistle! PHEEEW!', 'angry')], done: [say('tunde', 'Not bad. Not good. Not bad.', 'thinking')], hint: 'Just run straight to the glowing ring on the right.' }),
    T('ch2.l5', 3, 'hold', 'Hold the plank', { purpose: 'Stand still and endure.', objective: 'Hold the position', success: 'You hold the whole count.',
      intro: [say('tunde', 'Plank! Hold it! Do not look at me, look at the grass!', 'confident')], done: [say('helper', 'I am never doing this again.', 'tired')], hint: 'Stand inside the ring until the count is full.' }),
    T('ch2.l5', 4, 'sequence', 'Cone drill', { purpose: 'A memory drill: touch the cones in the order the coach shouts.', objective: 'Touch orange, green, then yellow', success: 'The drill is done in order.',
      intro: [say('tunde', 'Orange! Green! Yellow! In that order! Go!', 'angry')], done: [say('tunde', 'You listened. That is rare.', 'surprised')], hint: 'Order: orange, green, yellow.' }),
    T('ch2.l5', 5, 'choose', 'Rest or push on', { purpose: 'A choice after the hardest part.', objective: 'Rest a moment or push on', success: 'You choose.',
      intro: [say('folake', 'Drink some water, my child.', 'worried')], done: [say('tunde', 'Mmm.', 'suspicious')], hint: 'Rest and drink, or push on. Both are fine.' }),
  ],
  items: [
    { id: 'c1', task: 3, x: 5.8, z: -2.6, label: 'Touch the orange cone', color: ORANGE, shape: 'cones', y: 0.1 },
    { id: 'c2', task: 3, x: 2.8, z: 2.6, label: 'Touch the green cone', color: GREEN, shape: 'cones', y: 0.1 },
    { id: 'c3', task: 3, x: -0.4, z: -2.6, label: 'Touch the yellow cone', color: YELLOW, shape: 'cones', y: 0.1 },
    { id: 'rest', task: 4, x: -1, z: 1.4, label: 'Rest and drink water', color: BLUE, shape: 'sign', y: 0 },
    { id: 'push', task: 4, x: 1.4, z: 1.4, label: 'Push on without a break', color: RUST, shape: 'sign', y: 0 },
  ],
  sequences: { 3: ['c1', 'c2', 'c3'] }, holds: { 2: { x: 9.6, z: 2.6, r: 1.6, secs: 8 } },
  guide: [RING(-8, 0, 1.8), RING(9.6, 0), RING(9.6, 2.6), { x: 3, z: 0, r: 6 }, { x: 0, z: 1.4, r: 3 }],
  goto: [RING(-8, 0, 1.8), RING(9.6, 0), null, null, null],
  timeLimit: 9,
  crowd: [{ x: -9, z: -2.6, rot: 1.5 }, { x: -9, z: 2.6, rot: 1.5 }, { x: -9, z: 4.6, rot: 1.5 }],
  npcs: { folake: { x: -9.4, z: -4.8, rot: 0.7 }, tunde: { x: 1, z: -4.4, rot: 0 } }, choiceLabel: 'break',
  endBeat: { text: 'You are tired in places you did not know could be tired. The coach writes something and looks away.', line: 'Your kit needs sorting next.' },
  starRules: ['Finish the level', 'Sprint to the ring before the timer ends', 'Be on time with two or fewer wrong cones'],
}), { vehicle: 'train', to: 'the sports hall', title: 'Train to the fitness test', purpose: 'The fitness test is at the sports ground across town: wait at the stop, board the train and ride there.', objective: 'Take the train to the sports ground', success: 'You get off at the sports ground.', intro: [{ who: 'folake', text: 'Fitness test this morning. The station is up the road. Run for it if you have to. Practice!', expr: 'happy' }], done: [{ who: 'tunde', text: 'If you are tired already, we have a problem.', expr: 'cheeky' }] })

// ---------------------------------------------------------------------------------------------------------------- Level 6
export const LEVEL_C2L6 = withBus(L({
  ch: 'ch2', kit: true, n: 6, title: 'Kit Trouble', next: 'ch2.l7',
  intro: 'Ten minutes to the next round and one of your boots is nowhere to be found. Welcome to the changing room.',
  theme: { ground: '#cfc4a8', floors: [{ x0: -11.4, x1: 11.4, z0: -5.4, z1: 5.4, color: '#c8d0c0' }], deco: [
    { kind: 'wall', x: 0, z: -6.6, w: 26, d: 1, h: 3.2, color: '#e6dcc4' }, { kind: 'sign', x: 8.8, z: 4.4, label: 'KIT SHOP', w: 2 }, { kind: 'sign', x: 10.6, z: -3.2, label: 'PITCH', w: 1.6 },
    { kind: 'rug', x: -1, z: 0.4, w: 7, d: 3, color: '#2f5a3a' }, { kind: 'tree', x: 11, z: -5.2 },
  ] },
  furniture: [F('lockerA', R(-9.6, -7.8, -5.4, -4.4), 1.7, '#6a8ab8'), F('lockerB', R(-6.8, -5, -5.4, -4.4), 1.7, '#6a8ab8'), F('lockerC', R(-4, -2.2, -5.4, -4.4), 1.7, '#6a8ab8'), F('lockerD', R(-1.2, 0.6, -5.4, -4.4), 1.7, '#6a8ab8'),
    F('bench', R(-3, 3, -0.4, 0.8), 0.6, DARK), F('rack', R(4.4, 7.4, -5.4, -4.4), 1.0, DARK), F('shop', R(7.6, 10.4, 3.8, 5), 1.0, WOOD)],
  spawn: { x: -10.6, z: 1 }, resume: { x: -4, z: 1.5 },
  tasks: [
    T('ch2.l6', 1, 'find', 'Find your missing boot', { purpose: 'Search the lockers: only one has it.', objective: 'Find your missing boot', success: 'You find the boot.',
      intro: [say('helper', 'Check the lockers! I once found a whole sandwich in mine.', 'cheeky')], done: [say('player', 'Found it. Under a sock that is not mine.', 'tired')], hint: 'Try each locker; it is in the third one.' }),
    T('ch2.l6', 2, 'sequence', 'Get dressed in order', { purpose: 'Socks, shin pads, boots, shirt: in that order or it all goes wrong.', objective: 'Socks, shin pads, boots, then shirt', success: 'You are dressed correctly.',
      intro: [say('tunde', 'Socks. Shin pads. Boots. Shirt. In that order. I have seen what happens otherwise.', 'angry')], done: [say('tunde', 'Dressed. Remarkable.', 'surprised')], hint: 'Order: socks, shin pads, boots, shirt.' }),
    T('ch2.l6', 3, 'collect', 'Fix the broken lace', { purpose: 'A little budgeting at the kit shop: ₦500, two things.', objective: 'Buy 2 things within your budget', success: 'Two things are in the basket.',
      intro: [say('neighbour', 'You have ₦500. A whistle is ₦450. Think about it.', 'suspicious')], done: [say('neighbour', 'Smart shopping.', 'happy')], hint: 'Laces ₦150 and tape ₦100 fit easily. The whistle is too much.' }),
    T('ch2.l6', 4, 'reach', 'Hurry to the pitch', { purpose: 'Cross a corridor full of players on the way out.', objective: 'Get to the pitch door in time', success: 'You reach the door before the timer ends.',
      intro: [say('tunde', 'Two minutes! The whistle will not wait for your laces!', 'angry')], done: [say('player', 'Made it. Laces and all.', 'happy')], hint: 'Cross behind the walking players, then run for the door.' }),
  ],
  spots: [
    { id: 'la', task: 0, x: -8.7, z: -3.4, label: 'Check this locker', wrong: say('player', 'Somebody\'s socks. Somebody who needs help.', 'tired') },
    { id: 'lb', task: 0, x: -5.9, z: -3.4, label: 'Check this locker', wrong: say('player', 'One very shiny trophy. Not mine.', 'curious') },
    { id: 'lc', task: 0, x: -3.1, z: -3.4, label: 'Check this locker', right: true },
    { id: 'ld', task: 0, x: -0.3, z: -3.4, label: 'Check this locker', wrong: say('player', 'A single glove. Of a different sport.', 'suspicious') },
  ],
  items: [
    { id: 'socks', task: 1, x: -2.0, z: 0.2, label: 'Put on the socks', color: '#fbf8f0', shape: 'paper', y: 0.8 },
    { id: 'pads', task: 1, x: -0.4, z: 0.2, label: 'Put on the shin pads', color: '#e07a1f', shape: 'shinpad', y: 0.85 },
    { id: 'boots', task: 1, x: 1.2, z: 0.2, label: 'Put on the boots', color: '#f5b91c', shape: 'boots', y: 0.8 },
    { id: 'shirt', task: 1, x: 2.8, z: 0.2, label: 'Put on the shirt', color: '#2f5a3a', shape: 'blanket', y: 0.8 },
    { id: 'lace', task: 2, x: 8.2, z: 4.4, label: 'Take the laces (₦150)', color: '#fbf8f0', shape: 'cup', y: 1.1, price: 150 },
    { id: 'tape', task: 2, x: 8.9, z: 4.4, label: 'Take the tape (₦100)', color: '#6a8ab8', shape: 'cup', y: 1.1, price: 100 },
    { id: 'polish', task: 2, x: 9.6, z: 4.4, label: 'Take the boot polish (₦200)', color: '#1c1b22', shape: 'cup', y: 1.1, price: 200 },
    { id: 'whistle', task: 2, x: 10.2, z: 4.4, label: 'Take the whistle (₦450)', color: '#f5b91c', shape: 'cup', y: 1.1, price: 450 },
  ],
  sequences: { 1: ['socks', 'pads', 'boots', 'shirt'] }, budgets: { 2: { budget: 500, need: 2 } },
  guide: [{ x: -5, z: -3.4, r: 5 }, { x: 0, z: 0.2, r: 3 }, { x: 9, z: 4, r: 2 }, RING(10.4, 0)],
  goto: [null, null, null, RING(10.4, 0.4, 1.5)],
  hazards: [D('walker', -3.4, -3.2, 3.6, 2.4, 0), D('walker', 0.4, -3.2, 3.6, 2.8, 1.2, GREEN), D('walker', 4.2, -3.2, 3.6, 2.2, 0.6)],
  timeLimit: 22,
  crowd: [{ x: -6, z: 3.4, rot: 0.3 }, { x: 5.8, z: 2.2, rot: -2.4 }],
  npcs: { folake: { x: -10.8, z: -4.8, rot: 0.7 }, tunde: { x: 10.8, z: -4.6, rot: -2 } }, choiceLabel: 'choice',
  endBeat: { text: 'You run onto the pitch with one new lace and a very old problem: the rival is already there.', line: 'Meet him in Level 7.' },
  starRules: ['Finish the level', 'Reach the door before the timer ends', 'Be on time with two or fewer slips'],
}), { vehicle: 'train', to: 'the changing rooms', title: 'Train to the ground', purpose: 'You are running late: wait at the stop, board the train and ride to the ground.', objective: 'Take the train to the ground', success: 'You get off at the ground.', intro: [{ who: 'folake', text: 'You are late and your boot is missing. I can solve one of those. Take the train!', expr: 'worried' }], done: [{ who: 'helper', text: 'Late and shoeless. Classic.', expr: 'cheeky' }] })

// ---------------------------------------------------------------------------------------------------------------- Level 7
export const LEVEL_C2L7 = withBus(L({
  ch: 'ch2', kind: 'pitch', kit: true, n: 7, title: 'The Rival', next: 'ch2.l8',
  intro: 'Every trial has one. He has better boots, a louder voice and a very confident handshake.',
  theme: PITCH_THEME, furniture: GOALS, spawn: { x: -10.8, z: 0 }, resume: { x: -2, z: 0 },
  kick: { x: 7.6, z: 0, goals: 3, goal: { x: 12.2, z: 0 } },
  tasks: [
    T('ch2.l7', 1, 'goto', 'Meet the rival', { purpose: 'Walk across and meet the player everyone is talking about.', objective: 'Walk up to the rival', success: 'You reach the rival.',
      intro: [say('helper', 'That is Kunle. He has a hundred goals. He has told me about all of them.', 'cheeky')], done: [say('helper', 'So you are number 14? Cute number.', 'cheeky')], hint: 'Follow the ring to the player in the middle.' }),
    T('ch2.l7', 2, 'choose', 'Answer his taunt', { purpose: 'No answer is wrong: calm, cheeky or ignore him.', objective: 'Pick how you answer', success: 'You answer.',
      intro: [say('player', 'He is waiting. Everyone is waiting.', 'worried')], done: [say('tunde', 'Interesting. Now settle it on the pitch.', 'cheeky')], hint: 'Calm, cheeky or ignore: three signs.' }),
    T('ch2.l7', 3, 'kick', 'Penalty shootout', { purpose: 'A duel: three penalties against the keeper.', objective: 'Score 3 goals', success: 'Three penalties go in.',
      introByChoice: { calm: [say('helper', 'Calm? We will see how calm you are.', 'suspicious')], cheeky: [say('helper', 'Cheeky! I like it. Now prove it.', 'angry')], ignore: [say('helper', 'Ignoring me? Look at me when I score!', 'angry')] },
      intro: [say('helper', 'Three penalties each. First to flinch loses.', 'confident')], done: [say('helper', 'Hm. Not bad. Not bad at all.', 'surprised')], hint: 'Stand on the white spot and tap Kick with the needle in the green.' }),
    T('ch2.l7', 4, 'choose', 'Shake hands?', { purpose: 'How the rivalry ends: a handshake, a nod or a walk away.', objective: 'Decide how to end it', success: 'You choose.',
      intro: [say('helper', 'So. Hand? Nod? Walk away dramatically?', 'cheeky')], done: [say('tunde', 'Football is also about manners. Somewhere.', 'cheeky')], hint: 'Three options near the penalty spot.' }),
  ],
  items: [
    { id: 'calm', task: 1, x: -1.6, z: -2.2, label: 'Say: "Good luck, may the best player win"', color: GREEN, shape: 'sign', y: 0 },
    { id: 'cheeky', task: 1, x: -1.6, z: 0, label: 'Say: "Nice boots. Shame about the feet"', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'ignore', task: 1, x: -1.6, z: 2.2, label: 'Say nothing, tie your laces', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'shake', task: 3, x: 6.2, z: -2.6, label: 'Shake his hand', color: GREEN, shape: 'sign', y: 0 },
    { id: 'nod', task: 3, x: 6.2, z: 0, label: 'Give a small nod', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'walk', task: 3, x: 6.2, z: 2.6, label: 'Walk away dramatically', color: RUST, shape: 'sign', y: 0 },
  ],
  guide: [RING(3, 0), { x: -1.6, z: 0, r: 3 }, { x: 7.6, z: 0, r: 1 }, { x: 6.2, z: 0, r: 3 }],
  goto: [RING(2.6, 0, 1.6), null, null, null],
  crowd: [{ x: 4.4, z: 0, rot: 1.6 }, { x: -8, z: 3.2, rot: 0.4 }, { x: -8, z: -3.2, rot: -0.4 }],
  npcs: { folake: { x: -9.4, z: -4.8, rot: 0.7 }, tunde: { x: 0, z: -4.4, rot: 0 } }, choiceLabel: 'ending',
  endBeat: { text: 'Kunle walks off, looking back once. Whatever he was going to say, he decided against it.', line: 'A friendly match is next.' },
  starRules: ['Finish the level', 'Take your time: no timer here', 'Finish with two or fewer missed penalties'],
}), { vehicle: 'train', to: 'the rival\'s ground', title: 'Train to the rival\'s ground', purpose: 'The rival match is at his school\'s ground across town: wait at the stop, board the train and ride there.', objective: 'Take the train to the rival\'s ground', success: 'You get off at the rival\'s ground.', intro: [{ who: 'folake', text: 'His school is across town. Be polite, win politely and take the train.', expr: 'calm' }], done: [{ who: 'helper', text: 'He has been telling everyone he will win.', expr: 'suspicious' }] })

// ---------------------------------------------------------------------------------------------------------------- Level 8
const RINGS_BY_BOOTS = { striker: RING(8.2, 0), winger: RING(3, -3.8), defender: RING(-8, 0) }
export const LEVEL_C2L8 = withBus(L({
  ch: 'ch2', kind: 'pitch', kit: true, n: 8, title: 'The Friendly Match', next: 'ch2.l9',
  intro: 'A proper match with real stakes and a very loud crowd. Your boots and your earlier choices decide how it plays.',
  theme: PITCH_THEME, furniture: GOALS, spawn: { x: -10.8, z: 0 }, resume: { x: -2.2, z: 1.5 },
  kick: { x: 7.6, z: 0, goals: 2, goal: { x: 12.2, z: 0 } },
  tasks: [
    T('ch2.l8', 1, 'goto', 'Take your position', { purpose: 'Your boots decide where you play, as in the trial match.', objective: 'Walk to your position', flag: BOOTS, variant: true, success: 'You stand in your ring.',
      intro: [say('tunde', 'Positions! You know where you stand.', 'confident')], done: [say('folake', 'Look at him! Look at that child!', 'proud')], hint: 'Forward for strikers, the wing for wingers, the back for defenders.' }),
    T('ch2.l8', 2, 'reach', 'Counter-attack', { purpose: 'A timed run. How you played the decisive moment earlier shapes it.', objective: 'Run the counter-attack to the ring', flag: DECISION, variant: true, success: 'You reach the ring before the timer ends.',
      intro: [say('tunde', 'Ball won! Go, go, go!', 'angry')], done: [say('player', 'Clear! Shoot!', 'laughing')], hint: 'Cross behind the defenders, then sprint.' }),
    T('ch2.l8', 3, 'kick', 'Take the penalty', { purpose: 'A penalty to win it: score twice.', objective: 'Score 2 goals', success: 'Two penalties go in.',
      intro: [say('helper', 'Penalty! Everybody is looking at you. No pressure.', 'cheeky')], done: [say('folake', 'GOAL! Somebody write that down!', 'laughing')], hint: 'Stand on the white spot and tap Kick with the needle in the green.' }),
    T('ch2.l8', 4, 'hold', 'Defend the lead', { purpose: 'Get back and hold the line until the final whistle.', objective: 'Hold the line', success: 'You hold the whole count.',
      intro: [say('tunde', 'Get back! Hold the line! Do not let them in!', 'angry')], done: [say('tunde', 'PHEEEEW! That is the final whistle!', 'happy')], hint: 'Stand inside the ring near your own goal.' }),
    T('ch2.l8', 5, 'choose', 'Celebrate', { purpose: 'The match is won. How do you celebrate?', objective: 'Pick your celebration', success: 'You choose.',
      intro: [say('folake', 'Celebrate, my child! Not too much. A little. A lot!', 'laughing')], done: [say('tunde', 'Save some energy for the verdict.', 'calm')], hint: 'Slide, point to the sky or hug your team.' }),
  ],
  items: [
    { id: 'slide', task: 4, x: -4.6, z: -1.8, label: 'Knee slide', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'point', task: 4, x: -4.6, z: 0, label: 'Point to the sky', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'hug', task: 4, x: -4.6, z: 1.8, label: 'Hug the team', color: GREEN, shape: 'sign', y: 0 },
  ],
  holds: { 3: { x: -8, z: 0, r: 1.8, secs: 9 } },
  guide: [RING(3, -3.8), RING(9.6, 0), { x: 7.6, z: 0, r: 1 }, RING(-8, 0, 1.8), { x: -4.6, z: 0, r: 3 }],
  goto: [RING(3, -3.8), RING(9.6, 0), null, null, null],
  hazards: [D('dummy', 2.6, -4.4, 4.4, 2.6, 0, BLUE), D('dummy', 5.4, -4.4, 4.4, 2.8, 1.2, BLUE), D('dummy', 8.0, -4.4, 4.4, 2.4, 0.6, BLUE)],
  variants: {
    striker: { label: 'Striker', ...NO_HAZ, goals: { 0: RINGS_BY_BOOTS.striker } }, winger: { label: 'Winger', ...NO_HAZ, goals: { 0: RINGS_BY_BOOTS.winger } }, defender: { label: 'Defender', ...NO_HAZ, goals: { 0: RINGS_BY_BOOTS.defender } },
    shoot: { label: 'Shot-taker', timeLimit: 14, hazards: [D('dummy', 3.2, -4.4, 4.4, 3.6, 0, BLUE), D('dummy', 6.6, -4.4, 4.4, 4.0, 1.3, BLUE)] },
    pass: { label: 'Playmaker', timeLimit: 18, hazards: [D('dummy', 2.6, -4.4, 4.4, 2.8, 0, BLUE), D('dummy', 5.4, -4.4, 4.4, 3.0, 1.2, BLUE), D('dummy', 8.0, -4.4, 4.4, 2.6, 0.6, BLUE)] },
    hold: { label: 'Patient player', timeLimit: 24, hazards: [D('dummy', 2.6, -4.4, 4.4, 2.2, 0, BLUE), D('dummy', 5.4, -4.4, 4.4, 2.4, 1.2, BLUE), D('dummy', 8.0, -4.4, 4.4, 2.0, 0.6, BLUE)] },
  },
  timeLimit: 18,
  crowd: [{ x: -6.5, z: -3.6, rot: 0.6 }, { x: -6.5, z: 3.8, rot: -0.6 }, { x: 1.4, z: 4.8, rot: 3.1 }, { x: 10.4, z: 4.2, rot: -2.2 }],
  npcs: { folake: { x: -9.4, z: -4.8, rot: 0.7 }, tunde: { x: 0, z: -4.4, rot: 0 } }, choiceLabel: 'celebration',
  endBeat: { text: 'The crowd is on its feet. For a moment you forget there is a verdict coming.', line: 'The coach wants to see you.' },
  starRules: ['Finish the level', 'Run the counter-attack before the timer ends', 'Be on time with two or fewer missed penalties'],
}), { vehicle: 'train', to: 'the stadium', title: 'Train to the match', purpose: 'The friendly is at the big stadium: wait at the stop, board the train and ride there.', objective: 'Take the train to the stadium', success: 'You get off at the stadium.', intro: [{ who: 'folake', text: 'The friendly match! Everyone is coming to see you. Take the train and hold your head high.', expr: 'happy' }], done: [{ who: 'tunde', text: 'Big crowd today. Do not look at it. Look at the ball.', expr: 'confident' }] })

// ---------------------------------------------------------------------------------------------------------------- Level 9
export const LEVEL_C2L9 = withBus(L({
  ch: 'ch2', kit: true, n: 9, title: 'The Verdict', next: null, badge: 'Trial Day',
  intro: 'The whole day comes down to a single conversation. The coach has your name, your number and a very long pause.',
  theme: { ground: '#7aa05a', floors: [{ x0: -11.4, x1: 4, z0: -5.4, z1: 5.4, color: '#e6dcc4' }, { x0: 4, x1: 11.4, z0: -5.4, z1: 5.4, color: '#6bb95a' }], deco: [
    { kind: 'wall', x: -3.7, z: -6.6, w: 15, d: 1, h: 3.2, color: '#f3e7cf' }, { kind: 'window', x: -6, z: -6.1, w: 3, h: 1.2 }, { kind: 'sign', x: 9.8, z: -3.6, label: 'PITCH', w: 1.8 },
    { kind: 'awning', x: 8, z: 4.6, w: 4, d: 1.8, color: ORANGE }, { kind: 'tree', x: 11, z: -5 }, { kind: 'rug', x: -4, z: 0, w: 6, d: 3, color: '#2f5a3a' },
  ] },
  furniture: [F('desk', R(-5.4, -2.6, -3.4, -2.2), 0.95, WOOD), F('chairs', R(-8, -6.4, 1.4, 2.4), 0.6, DARK)],
  spawn: { x: -10.6, z: 1 }, resume: { x: -4, z: 1 },
  tasks: [
    T('ch2.l9', 1, 'goto', 'Meet the coach', { purpose: 'The conversation you have been waiting for.', objective: 'Walk to the coach', success: 'You reach the coach.',
      intro: [say('tunde', 'Sit. No, stand. No, sit. Come here.', 'suspicious')], done: [say('tunde', 'Number 14. I have thought about this all day.', 'thinking')], hint: 'Follow the ring to the desk.' }),
    T('ch2.l9', 2, 'sequence', 'Sign the forms', { purpose: 'Paperwork, in the right order: name, number, guardian.', objective: 'Sign name, number, then guardian', success: 'The forms are signed in order.',
      intro: [say('tunde', 'Forms. Name first. Then your number. Then your guardian. In that order.', 'calm')], done: [say('tunde', 'Tidy. I like tidy.', 'happy')], hint: 'Order: name, number, guardian.' }),
    T('ch2.l9', 3, 'choose', 'Give your answer', { purpose: 'The final decision of the chapter: accept, ask for time or thank him and decline.', objective: 'Choose your answer', success: 'You choose.',
      intro: [say('tunde', 'We would like you in the academy. What do you say?', 'confident')], done: [say('tunde', 'I see.', 'calm')], hint: 'Accept, ask for time or thank him and decline. All three are fine.' }),
    T('ch2.l9', 4, 'goto', 'Tell Mama Folake', { purpose: 'Share the news with the person who has been shouting your number all day.', objective: 'Walk to Mama Folake', success: 'You reach Mama Folake.',
      introByChoice: { accept: [say('player', 'I have to tell her. She will scream.', 'laughing')], time: [say('player', 'I said I needed time. She will scream anyway.', 'worried')], decline: [say('player', 'I said thank you and no. She will scream. Differently.', 'worried')] },
      intro: [say('player', 'I should tell Mama.', 'happy')], done: [say('folake', 'WHAT?! WHAT?! TELL ME AGAIN!', 'laughing')], hint: 'Mama Folake is at the right, under the orange awning.' }),
    T('ch2.l9', 5, 'goto', 'Walk onto the pitch', { purpose: 'A last walk onto the grass where the day began.', objective: 'Walk onto the pitch', success: 'You stand on the pitch.',
      intro: [say('tunde', 'Go and stand there. Let the grass say what it needs to say.', 'calm')], done: [say('tunde', 'Trial day. Done.', 'proud')], hint: 'The pitch is the green area on the right.' }),
  ],
  items: [
    { id: 'name', task: 1, x: -4.8, z: -2.8, label: 'Sign your name', color: '#1c1b22', shape: 'paper', y: 1.05 },
    { id: 'number', task: 1, x: -4.0, z: -2.8, label: 'Write your number', color: '#d62828', shape: 'paper', y: 1.05 },
    { id: 'guardian', task: 1, x: -3.2, z: -2.8, label: 'Get your guardian to sign', color: '#2b6ad0', shape: 'paper', y: 1.05 },
    { id: 'accept', task: 2, x: -2.4, z: 1.4, label: 'Say yes to the academy', color: GREEN, shape: 'sign', y: 0 },
    { id: 'time', task: 2, x: -0.8, z: 1.4, label: 'Ask for a little time', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'decline', task: 2, x: 0.8, z: 1.4, label: 'Thank him and decline', color: RUST, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['name', 'number', 'guardian'] },
  guide: [RING(-4, -0.8), { x: -4, z: -2.8, r: 2.5 }, { x: -0.8, z: 1.4, r: 3 }, RING(8, 3), RING(9.4, 0)],
  goto: [RING(-4, -0.8, 1.5), null, null, RING(8, 3, 1.6), RING(9.4, -0.2, 1.8)],
  crowd: [{ x: -7.6, z: -2.8, rot: 0.9 }, { x: 1.6, z: -3.6, rot: 3 }, { x: 6, z: 2.6, rot: -2 }, { x: 9, z: -3.8, rot: -1 }],
  npcs: { folake: { x: 8.4, z: 4.0, rot: -2.4 }, tunde: { x: -4, z: -4.2, rot: 0 } }, choiceLabel: 'answer',
  endBeat: { text: 'Whatever you said, you said it yourself. That is the part that counts.', line: 'Chapter 2 is done. A new chapter is open.' },
  starRules: ['Finish the level', 'Take your time: no timer here', 'Finish with two or fewer wrong forms'],
}), { vehicle: 'train', to: 'the club office', title: 'Train to the verdict', purpose: 'The verdict is at the club office across town: wait at the stop, board the train and ride there.', objective: 'Take the train to the club office', success: 'You get off at the club office.', intro: [{ who: 'folake', text: 'Today they tell you. Whatever they say, I am proud. Now take the train before I cry.', expr: 'worried' }], done: [{ who: 'tunde', text: 'Deep breath. Same train, different day.', expr: 'calm' }] })
