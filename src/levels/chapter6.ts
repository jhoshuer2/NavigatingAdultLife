// Chapter 6 "Move-Out Day": the lease ends and a week of boxes, keys and one stubborn sofa begins. A small pickup truck carries you between the old flat, the
// truck yard, the highway and the new place. Each level is a different place with a different mix of tasks.
import type { Deco } from './schema'
import { L, T, R, F, say, sayAs, D, WOOD, DARK } from './chapter1b'
import { B, TREES, LAMPS, RING, GREEN } from './chapter1c'
import { withBus, type BusOpts } from './bus'

const ORANGE = '#e07a1f', YELLOW = '#f5b91c', RUST = '#c4562a', BLUE = '#2b6ad0', CREAM = '#f3e7cf'
const haul = (to: string, title: string, why: string, intro: BusOpts['intro'], done: BusOpts['done']): BusOpts => ({ vehicle: 'truck', to, title, purpose: `${why}: wait at the yard, board the truck and ride there.`, objective: `Take the truck to ${to}`, success: `You climb down at ${to}.`, intro, done })
const PLACE = (floor: string, extra: Deco[] = [], wall = true): { floors: { x0: number; x1: number; z0: number; z1: number; color: string }[]; deco: Deco[] } => ({
  floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: floor }],
  deco: [...(wall ? [{ kind: 'wall' as const, x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: CREAM }] : []), ...TREES([[-10, 9], [39, 9]]), ...LAMPS([[8, 6], [28, 6]]), ...extra],
})
const base = { spawn: { x: -9, z: 0 }, resume: { x: -6, z: 2 } }
const BIGB = R(-12, 40, -12.4, 12.4)

// ---------------------------------------------------------------------------------------------------------------- Level 1
const office = B('office', -6, 6, -12, -7, '#d9b98a', 'LANDLORD', 3.4)
export const LEVEL_C6L1 = withBus(L({
  ch: 'ch6', n: 1, title: 'The Notice', next: 'ch6.l2', bounds: BIGB,
  intro: 'The lease is up at the end of the month. Mr Okafor has a folder, a pen and a smile that has not changed in years. Time to give notice and leave in good order.',
  theme: { ground: '#bfb393', ...PLACE('#d9cdb0', [...office.d, { kind: 'rug', x: 21, z: 5, w: 11, d: 3, color: BLUE }, { kind: 'sign', x: 16, z: -6.2, label: 'ARCHIVE', w: 1.6 }]) },
  furniture: [office.f, F('desk', R(16, 26, -4, -2.6), 0.9, WOOD), F('cab1', R(14, 17, -10, -8.8), 1.8, DARK), F('cab2', R(22, 25, -10, -8.8), 1.8, DARK), F('cab3', R(30, 33, -10, -8.8), 1.8, DARK)], ...base,
  tasks: [
    T('ch6.l1', 1, 'talk', 'Tell the landlord', { purpose: 'Give Mr Okafor the news. Be polite, be clear and be ready for his reaction.', objective: 'Talk to Mr Okafor', success: 'He knows you are leaving.',
      intro: [say('helper', 'He has had a lot of tenants. He remembers none of them. Except you. He remembers you.', 'cheeky')], done: [sayAs('Mr Okafor', 'neighbour', 'Sad. Very sad. I will need the lease folder. Go to the archive.', 'worried')], hint: 'Mr Okafor stands outside the LANDLORD office at the top left.' }),
    T('ch6.l1', 2, 'find', 'Find your lease folder', { purpose: 'The archive has three cabinets. One has your folder.', objective: 'Find your lease folder', success: 'You find the folder.',
      intro: [say('player', 'Three cabinets. Three hundred folders. One of them says my name.', 'thinking')], done: [say('player', 'Found it. The one with the coffee ring.', 'tired')], hint: 'Try each cabinet along the ARCHIVE wall.' }),
    T('ch6.l1', 3, 'sequence', 'Sign the notice', { purpose: 'Notice forms, in the right order: name, date, signature.', objective: 'Name, date, then signature', success: 'The notice is signed.',
      intro: [sayAs('Mr Okafor', 'neighbour', 'Name first. Then the date. Then your signature. Slowly. This is a legal document.', 'calm')], done: [sayAs('Mr Okafor', 'neighbour', 'Done. Thirty days. Do not take the sink.', 'cheeky')], hint: 'Order on the desk: name, date, signature.' }),
    T('ch6.l1', 4, 'choose', 'Pick your move-out date', { purpose: 'Early, on time or a little late. All three have a cost and a charm.', objective: 'Choose your move-out date', success: 'You choose.',
      intro: [say('player', 'Early is stressful. Late is expensive. On time is a fantasy.', 'thinking')], done: [sayAs('Mr Okafor', 'neighbour', 'Noted. And remembered.', 'calm')], hint: 'Three signs on the rug: early, on time or late.' }),
  ],
  talks: { 0: [{ id: 'okafor', name: 'Mr Okafor', x: 0, z: -4.6, lines: [sayAs('Mr Okafor', 'neighbour', 'Ah, my favourite tenant. What can I do for you? Is it the tap? It is always the tap.', 'happy')], rounds: [{ options: [
    { id: 'leaving', label: '"I am moving out, Mr Okafor."', reply: sayAs('Mr Okafor', 'neighbour', 'Moving? But the tap! And the neighbours! And the free bucket!', 'surprised') },
    { id: 'thanks', label: '"Thank you for everything. I am moving on."', reply: sayAs('Mr Okafor', 'neighbour', 'Kind words. Rare words. I will frame them.', 'happy') },
  ] }] }] },
  spots: [
    { id: 'c1', task: 1, x: 15.5, z: -7.6, label: 'Check cabinet one', wrong: say('player', 'Receipts from 1998. Not me.', 'tired') },
    { id: 'c2', task: 1, x: 23.5, z: -7.6, label: 'Check cabinet two', right: true },
    { id: 'c3', task: 1, x: 31.5, z: -7.6, label: 'Check cabinet three', wrong: say('helper', 'A stuffed owl. Why? Nobody knows.', 'cheeky') },
  ],
  items: [
    { id: 'nm', task: 2, x: 18, z: -3.3, label: 'Write your name', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'write' },
    { id: 'dt', task: 2, x: 21, z: -3.3, label: 'Write the date', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'write' },
    { id: 'sg', task: 2, x: 24, z: -3.3, label: 'Sign the notice', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'write' },
    { id: 'early', task: 3, x: 15, z: 3.6, label: 'Move out early', color: GREEN, shape: 'sign', y: 0 },
    { id: 'ontime', task: 3, x: 21, z: 3.6, label: 'Move out on the last day', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'late', task: 3, x: 27, z: 3.6, label: 'Ask for a few extra days', color: RUST, shape: 'sign', y: 0 },
  ],
  sequences: { 2: ['nm', 'dt', 'sg'] },
  guide: [{ x: 0, z: -4.6, r: 3 }, { x: 23, z: -6, r: 14 }, { x: 21, z: -2, r: 5 }, { x: 21, z: 3.6, r: 8 }],
  crowd: [{ x: 10, z: 4, rot: 1 }, { x: 34, z: 4, rot: -2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 8, rot: -2.4 } }, choiceLabel: 'date',
  endBeat: { text: 'Thirty days. A signed paper. And a feeling you do not have words for: leaving always makes the old place look better than it ever did.', line: 'Boxes next.' },
  starRules: ['Finish the level', 'Finish with no wrong cabinets', 'Finish with no mistakes and no hints'],
}), haul('the landlord\'s office', 'Truck to the office', 'The landlord wants to see you in person', [sayAs('Mama Folake', 'folake', 'So you are leaving that flat. I cried once, quietly. Take the truck to the landlord and give your notice properly.', 'worried')], [say('helper', 'The truck smells of cardboard and old promises.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 2
export const LEVEL_C6L2 = withBus(L({
  ch: 'ch6', n: 2, title: 'Boxes Everywhere', next: 'ch6.l3', bounds: BIGB,
  intro: 'Four years of life, spread across three rooms, and not one box. The kitchen has a hundred plates, the bedroom has a hundred books and the living room has the sofa.',
  theme: { ground: '#cfc4a8', floors: [{ x0: -12, x1: 6, z0: -12, z1: 12, color: '#e6e0d0' }, { x0: 6, x1: 20, z0: -12, z1: 12, color: '#d8b98a' }, { x0: 20, x1: 40, z0: -12, z1: 12, color: '#cfc4a8' }], deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: CREAM }, { kind: 'sign', x: -3, z: -6.2, label: 'KITCHEN', w: 1.8 }, { kind: 'sign', x: 13, z: -6.2, label: 'BEDROOM', w: 1.8 }, { kind: 'sign', x: 30, z: -6.2, label: 'LIVING ROOM', w: 2.2 }, { kind: 'rug', x: 28, z: 3, w: 12, d: 5, color: GREEN }, ...TREES([[39, 9]])] },
  furniture: [F('kcounter', R(-6, 2, -10, -8.8), 0.95, WOOD), F('bed', R(10, 16, -9, -6), 0.6, '#6b3a1e'), F('sofa', R(26, 32, -4, -1.8), 0.8, '#6b3a1e'), F('bookcase', R(36, 38.4, -2, 4), 1.8, DARK)], ...base,
  tasks: [
    T('ch6.l2', 1, 'collect', 'Find three boxes', { purpose: 'Boxes are hiding in three different rooms: the kitchen, the bedroom and the living room.', objective: 'Bring three empty boxes', success: 'You have all three.',
      intro: [say('helper', 'Boxes. Empty ones. In a house full of full ones. This is the first challenge.', 'cheeky')], done: [say('player', 'Three boxes. I need three hundred. But I have three.', 'laughing')], hint: 'One in the kitchen corner, one in the bedroom and one by the bookcase.' }),
    T('ch6.l2', 2, 'sequence', 'Pack the kitchen', { purpose: 'Wrap the plates, pack the glasses, then tape the box: in that order, or it all breaks.', objective: 'Wrap plates, pack glasses, then tape the box', success: 'The kitchen box is sealed.',
      intro: [sayAs('Mama Chidi', 'neighbour', 'Plates first. Wrapped. Glasses next. Then tape. Never the other way. I have seen what happens.', 'worried')], done: [sayAs('Mama Chidi', 'neighbour', 'Beautiful. Now do the other forty.', 'cheeky')], hint: 'Order on the counter: plates, glasses, tape.' }),
    T('ch6.l2', 3, 'choose', 'Keep, donate or bin?', { purpose: 'A heap of things you have not touched in two years. Decide what happens to them.', objective: 'Decide what to do with the old things', success: 'You choose.',
      intro: [say('player', 'Why do I own six umbrellas? And a single glove? And a nine-year-old phone?', 'thinking')], done: [say('player', 'Decision made. Brutal. Lighter already.', 'proud')], hint: 'Three signs on the rug: keep, donate or bin.' }),
  ],
  items: [
    { id: 'bx1', task: 0, x: -9, z: 6, label: 'Take a box', color: '#c9a074', shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'bx2', task: 0, x: 8, z: 6, label: 'Take a box', color: '#c9a074', shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'bx3', task: 0, x: 34, z: 6.4, label: 'Take a box', color: '#c9a074', shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'plates', task: 1, x: -4, z: -9.4, label: 'Wrap the plates', color: '#fbf8f0', shape: 'plate', y: 1.05, act: 'wipe' },
    { id: 'glasses', task: 1, x: -1.6, z: -9.4, label: 'Pack the glasses', color: '#9ecbe6', shape: 'cup', y: 1.05, act: 'grab' },
    { id: 'tape', task: 1, x: 0.8, z: -9.4, label: 'Tape the box shut', color: '#c4562a', shape: 'bank', y: 1.05, act: 'tapeBox' },
    { id: 'keep', task: 2, x: 24, z: 4, label: 'Keep it all', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'donate', task: 2, x: 28, z: 4, label: 'Donate most of it', color: GREEN, shape: 'sign', y: 0 },
    { id: 'bin', task: 2, x: 32, z: 4, label: 'Bin the lot', color: RUST, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['plates', 'glasses', 'tape'] },
  guide: [{ x: 14, z: 6, r: 24 }, { x: -1.6, z: -8, r: 4 }, { x: 28, z: 4, r: 8 }],
  crowd: [{ x: 4, z: 3, rot: 1 }, { x: 18, z: 4, rot: 2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 8, rot: -2.4 } }, choiceLabel: 'clear-out',
  endBeat: { text: 'You count seventeen boxes. You own twelve things you swear you have never seen before. The sofa watches you from the corner with an expression you will remember.', line: 'The neighbours want to say goodbye.' },
  starRules: ['Finish the level', 'Finish with no wrong order', 'Finish with no mistakes and no hints'],
}), haul('the flat', 'Truck to the flat', 'The packing starts early', [sayAs('Mama Folake', 'folake', 'Packing! The thing everybody thinks takes an hour. Take the truck, buy tape on the way and start in the kitchen.', 'worried')], [sayAs('Baba Tunde', 'tunde', 'Rule of moving: whatever you think you own, you own twice as much.', 'confident')]))

// ---------------------------------------------------------------------------------------------------------------- Level 3
const hC = B('chidi', -8, 2, -12, -7, '#f0d9a8', 'MAMA CHIDI', 3.4), hF = B('femi', 12, 22, -12, -7, '#d9e0b0', 'MR FEMI', 3.4), hT = B('tobi', 30, 38, -12, -7, '#e8c9a0', 'TOBI', 3.2)
export const LEVEL_C6L3 = withBus(L({
  ch: 'ch6', n: 3, title: 'Goodbye, Neighbours', next: 'ch6.l4', bounds: BIGB,
  intro: 'Four years of borrowed sugar, loud football and compound gossip. Leaving a compound is mostly saying goodbye to people who say they will not miss you and then cry.',
  theme: { ground: '#b8c9a0', ...PLACE('#e0d6b8', [...hC.d, ...hF.d, ...hT.d, { kind: 'rug', x: 18, z: 2, w: 12, d: 3, color: RUST }, { kind: 'chair', x: 12, z: 2.4, color: WOOD }, { kind: 'chair', x: 18, z: 2.4, color: WOOD }, { kind: 'chair', x: 24, z: 2.4, color: WOOD }, { kind: 'sign', x: 37, z: 4, label: 'TRUCK', w: 1.4 }]) },
  furniture: [hC.f, hF.f, hT.f, F('teatable', R(10, 26, 3.6, 4.8), 0.8, WOOD)], ...base,
  tasks: [
    T('ch6.l3', 1, 'talk', 'Say your goodbyes', { purpose: 'Three neighbours, three goodbyes. Each one has something to say.', objective: 'Say goodbye to Mama Chidi, Mr Femi and Tobi', success: 'You have said goodbye to everyone.',
      intro: [say('helper', 'Goodbyes in this compound take an hour each. Plan for a long day.', 'cheeky')], done: [say('player', 'Mama Chidi cried. Mr Femi cried. Tobi asked if he could have my football.', 'laughing')], hint: 'Mama Chidi is at the left house, Mr Femi in the middle, Tobi at the right.' }),
    T('ch6.l3', 2, 'serve', 'One last cup of tea', { purpose: 'Sit your neighbours down and bring each their tea, as they did for you on day one.', objective: 'Seat and serve the three neighbours', success: 'Everyone has tea.',
      intro: [sayAs('Mama Chidi', 'neighbour', 'You made me tea on your first day. Now it is your turn. One last cup. Do not spill.', 'happy')], done: [sayAs('Mr Femi', 'helper', 'The tea is too hot. And too sweet. And perfect.', 'cheeky')], hint: 'Seat each neighbour, take their cup from the tea table and carry it over.' }),
    T('ch6.l3', 3, 'reach', 'Race the warden', { purpose: 'The parking warden is writing a ticket for the truck. Get across the compound before he finishes.', objective: 'Get to the truck before the warden', success: 'You reach the truck in time.',
      intro: [sayAs('Tobi', 'helper', 'The warden! He has a ticket book! He is writing! He writes fast!', 'worried')], done: [say('player', 'Just in time. He gave me a very disappointed look instead.', 'laughing')], hint: 'Cross behind the children and run right to the TRUCK sign.' }),
  ],
  talks: { 0: [
    { id: 'chidi', name: 'Mama Chidi', x: -3, z: -4.6, lines: [sayAs('Mama Chidi', 'neighbour', 'You are really going? Who will borrow my sugar? Who will bring me gossip?', 'worried')], rounds: [{ options: [
      { id: 'visit', label: '"I will visit every month."', reply: sayAs('Mama Chidi', 'neighbour', 'Every month? Every week. I will tell you off if not.', 'cheeky') },
      { id: 'thanks', label: '"Thank you for everything, Mama."', reply: sayAs('Mama Chidi', 'neighbour', 'Stop. You are making my eyes behave badly.', 'happy') },
    ] }] },
    { id: 'femi', name: 'Mr Femi', x: 17, z: -4.6, lines: [sayAs('Mr Femi', 'helper', 'I will miss your music. I will not tell you that. I am telling the tomatoes.', 'cheeky')] },
    { id: 'tobi', name: 'Tobi', x: 34, z: -4.6, lines: [sayAs('Tobi', 'helper', 'Can I have your football? Please? You are leaving. It is practically mine.', 'cheeky')] },
  ] },
  items: [
    { id: 'tChidi', task: 1, x: 12, z: 4.2, label: 'Take Mama Chidi\'s tea', color: ORANGE, shape: 'cup', y: 0.95 },
    { id: 'tFemi', task: 1, x: 13.4, z: 4.2, label: 'Take Mr Femi\'s tea', color: GREEN, shape: 'cup', y: 0.95 },
    { id: 'tTobi', task: 1, x: 14.8, z: 4.2, label: 'Take Tobi\'s juice', color: YELLOW, shape: 'cup', y: 0.95 },
  ],
  serves: { 1: { eatSecs: 3, from: 1, guests: [
    { id: 'chidi', name: 'Mama Chidi', order: 'Tea with milk', dish: 'tChidi', x: 2, z: 6, seat: { x: 12, z: 2.4 }, table: { x: 12, z: 4.0 } },
    { id: 'femi', name: 'Mr Femi', order: 'Strong tea', dish: 'tFemi', x: 5, z: 8, seat: { x: 18, z: 2.4 }, table: { x: 18, z: 4.0 } },
    { id: 'tobi', name: 'Tobi', order: 'Juice', dish: 'tTobi', x: 0, z: 8.4, seat: { x: 24, z: 2.4 }, table: { x: 24, z: 4.0 } },
  ] } },
  goto: [null, null, RING(36, 6, 1.5)],
  guide: [{ x: 17, z: -4, r: 22 }, { x: 18, z: 3, r: 10 }, RING(36, 6, 1.5)],
  hazards: [D('walker', 18, -2, 8, 2.6, 0, GREEN), D('walker', 24, -2, 8, 2.9, 1.2, ORANGE), D('walker', 30, -2, 8, 2.4, 0.6, RUST)],
  timeLimit: 18,
  crowd: [{ x: 28, z: 6, rot: -2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }, choiceLabel: 'goodbye',
  endBeat: { text: 'The truck pulls away. Mama Chidi waves with a handkerchief. Tobi runs after it with a football he should not be carrying.', line: 'Next, a truck of your own.' },
  starRules: ['Finish the level', 'Reach the truck before the timer ends', 'Be on time with two or fewer slips'],
}), haul('the compound', 'Truck to the compound', 'The neighbours want to say goodbye', [sayAs('Mama Folake', 'folake', 'Go and say goodbye properly. The compound will not forgive you if you sneak out.', 'calm')], [sayAs('Tobi', 'helper', 'The truck! The truck! Can I ride in the back? Please?', 'happy')]))

// ---------------------------------------------------------------------------------------------------------------- Level 4
const yard = B('yardoffice', -6, 4, -12, -7, '#c9d9e8', 'TRUCK HIRE', 3.4), supplies = (x: number, color: string, label: string): Deco => ({ kind: 'stall', x, z: -9, w: 3.4, d: 1.6, color, label })
export const LEVEL_C6L4 = withBus(L({
  ch: 'ch6', n: 4, title: 'Hire the Truck', next: 'ch6.l5', bounds: BIGB,
  intro: 'A yard full of trucks, vans and one very optimistic salesman. You need a truck, some rope, tape and blankets, and a price that does not make you cry.',
  theme: { ground: '#bfb393', ...PLACE('#cfc8b8', [...yard.d, supplies(14, ORANGE, 'TAPE'), supplies(22, GREEN, 'ROPE'), supplies(30, BLUE, 'BLANKETS'), { kind: 'rug', x: 22, z: 4, w: 12, d: 3, color: BLUE }, { kind: 'sign', x: 37, z: 3, label: 'YOUR TRUCK', w: 1.8 }]) },
  furniture: [yard.f, F('c1', R(12.3, 15.7, -9.8, -8.2), 1.0, WOOD), F('c2', R(20.3, 23.7, -9.8, -8.2), 1.0, WOOD), F('c3', R(28.3, 31.7, -9.8, -8.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch6.l4', 1, 'talk', 'Talk price', { purpose: 'Two dealers, two prices. Be polite, be firm and ask for the best.', objective: 'Talk to both truck dealers', success: 'You know the prices.',
      intro: [say('folake', 'Never accept the first price. Never accept the second price. Accept the third price with a sigh.', 'calm')], done: [say('player', 'Garba says six thousand. The other man says five. Both are lying a little.', 'thinking')], hint: 'Mr Garba stands in front of TRUCK HIRE; the other dealer is by the trucks on the right.' }),
    T('ch6.l4', 2, 'collect', 'Buy the supplies', { purpose: 'Tape, rope and blankets from three stalls, with ₦1600 to spend and a pricey set of straps nobody needs.', objective: 'Buy 3 supplies within ₦1600', success: 'The supplies are in your bag.',
      intro: [sayAs('Mr Garba', 'helper', 'Tape, rope, blankets, straps. The straps are special. The straps are expensive. The straps are not on your list.', 'cheeky')], done: [say('player', 'Tape, rope, blankets. Under budget. Mama will faint.', 'proud')], hint: 'Pick tape, rope and blankets. The straps cost too much. Start over if you overspend.' }),
    T('ch6.l4', 3, 'reach', 'Cross the yard', { purpose: 'Forklifts and reversing trucks everywhere: get to your truck before the dealer changes his mind.', objective: 'Get to your truck through the yard', success: 'You reach the truck before the timer ends.',
      intro: [sayAs('Mr Garba', 'helper', 'Quickly! The truck is yours until six! Mind the forklift! The forklift has no brakes! The forklift has opinions!', 'worried')], done: [say('player', 'Alive. Mostly. And the truck is mine.', 'laughing')], hint: 'Cross behind the forklifts and run right to YOUR TRUCK.' }),
    T('ch6.l4', 4, 'choose', 'Pick the size', { purpose: 'A small truck is cheap and needs two trips. A big truck is dear and needs one. A medium one is a gamble.', objective: 'Choose the truck size', success: 'You choose.',
      intro: [sayAs('Mr Garba', 'helper', 'Small, medium or large? You know your furniture. I know my truck. We will see who is right.', 'cheeky')], done: [sayAs('Mr Garba', 'helper', 'Sign here. Bring it back. Without dents. Or with small dents.', 'calm')], hint: 'Three signs on the rug: small, medium or large.' }),
  ],
  talks: { 0: [
    { id: 'garba', name: 'Mr Garba', x: -1, z: -4.6, lines: [sayAs('Mr Garba', 'helper', 'Truck? I have trucks. Beautiful trucks. Six thousand for the day. A bargain. A gift.', 'cheeky')], rounds: [{ options: [
      { id: 'low', label: '"Four thousand and I bring it back clean."', reply: sayAs('Mr Garba', 'helper', 'Four?! Five-five. And a clean truck. And a handshake.', 'surprised') },
      { id: 'fair', label: '"Five thousand and I fill the tank."', reply: sayAs('Mr Garba', 'helper', 'Fill the tank. Hm. I like a tank that is full.', 'happy') },
      { id: 'walk', label: '"Too much. I will ask the other man."', reply: sayAs('Mr Garba', 'helper', 'Wait, wait. Five-five. Do not go. He is a thief.', 'worried') },
    ] }] },
    { id: 'other', name: 'Mr Sani', x: 34, z: 0, lines: [sayAs('Mr Sani', 'neighbour', 'Truck? I have a truck. Five thousand. It has character. It has seven scratches. Each one has a story.', 'cheeky')] },
  ] },
  items: [
    { id: 'tape', task: 1, price: 300, x: 14, z: -8.6, label: 'Buy tape (₦300)', color: ORANGE, shape: 'bank', y: 1.05, act: 'grab' },
    { id: 'rope', task: 1, price: 500, x: 22, z: -8.6, label: 'Buy rope (₦500)', color: '#a87a50', shape: 'cones', y: 1.05, act: 'grab' },
    { id: 'blankets', task: 1, price: 700, x: 30, z: -8.6, label: 'Buy blankets (₦700)', color: BLUE, shape: 'blanket', y: 1.05, act: 'grab' },
    { id: 'straps', task: 1, price: 900, x: 31.4, z: -8.6, label: 'Buy straps (₦900)', color: YELLOW, shape: 'bank', y: 1.05, act: 'grab' },
    { id: 'small', task: 3, x: 14, z: 3.6, label: 'Take the small truck', color: GREEN, shape: 'sign', y: 0 },
    { id: 'medium', task: 3, x: 22, z: 3.6, label: 'Take the medium truck', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'large', task: 3, x: 30, z: 3.6, label: 'Take the large truck', color: RUST, shape: 'sign', y: 0 },
  ],
  budgets: { 1: { budget: 1600, need: 3 } },
  goto: [null, null, RING(36, 0, 1.6), null],
  guide: [{ x: 15, z: -4, r: 22 }, { x: 22, z: -7, r: 10 }, RING(36, 0, 1.6), { x: 22, z: 3.6, r: 8 }],
  hazards: [D('cart', 12, -7, 6, 3.0, 0, ORANGE), D('cart', 20, -7, 6, 3.2, 1.2, RUST), D('walker', 27, -7, 6, 2.6, 0.6, GREEN)],
  timeLimit: 20,
  crowd: [{ x: 18, z: 0, rot: 2 }, { x: 8, z: 6, rot: 1 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }, choiceLabel: 'truck',
  endBeat: { text: 'You sign a form you do not read, take a key with a rubber duck on it and drive away. The duck stares at you for the first ten minutes.', line: 'Loading day.' },
  starRules: ['Finish the level', 'Reach the truck before the timer ends', 'Be on time with two or fewer slips'],
}), haul('the truck yard', 'Truck to the yard', 'You need to hire a bigger truck', [sayAs('Mama Folake', 'folake', 'A moving truck needs a moving budget. Take the truck to the yard and do not buy anything shiny.', 'worried')], [sayAs('Mr Garba', 'helper', 'Welcome to the yard! Everything here is a bargain. Nothing here is cheap!', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 5
export const LEVEL_C6L5 = withBus(L({
  ch: 'ch6', n: 5, title: 'Loading Day', next: 'ch6.l6', bounds: BIGB,
  intro: 'The truck is outside. The boxes are inside. Between them is a driveway, a set of stairs and a traffic warden who has already noticed you.',
  theme: { ground: '#bfb393', ...PLACE('#d9cdb0', [{ kind: 'sign', x: 37, z: 3, label: 'LOAD HERE', w: 1.8 }, { kind: 'rug', x: 22, z: 5, w: 12, d: 3, color: RUST }]) },
  furniture: [F('stack', R(2, 8, -9, -7), 0.9, '#c9a074'), F('wardenbox', R(30, 32, 7, 8.4), 1.2, '#44444e')], ...base,
  tasks: [
    T('ch6.l5', 1, 'collect', 'Carry the boxes out', { purpose: 'Four boxes from the pile in the hallway to the truck. Bend your knees.', objective: 'Lift and carry four boxes', success: 'Four boxes are out.',
      intro: [sayAs('Kayode', 'helper', 'I am Kayode. I carry things. You carry things. The things do not carry themselves.', 'calm')], done: [sayAs('Kayode', 'helper', 'Good form. You will not hurt your back. Your pride maybe.', 'cheeky')], hint: 'The boxes are on the ground near the stack on the left.' }),
    T('ch6.l5', 2, 'sequence', 'Load in order', { purpose: 'Heavy things at the bottom, then medium, then light on top. Otherwise it all falls.', objective: 'Fridge, bed, then lamp', success: 'The truck is loaded in order.',
      intro: [sayAs('Kayode', 'helper', 'Fridge first. Bed next. Lamp last. A lamp on a fridge is a lamp on a floor in ten minutes.', 'worried')], done: [sayAs('Kayode', 'helper', 'It is tight. It is straight. It is nearly beautiful.', 'proud')], hint: 'Order near the truck: fridge, bed, lamp.' }),
    T('ch6.l5', 3, 'reach', 'Beat the warden', { purpose: 'The traffic warden is walking along the street. Move the truck before he writes a ticket.', objective: 'Get to the driver\'s door before the warden', success: 'You reach the cab in time.',
      intro: [sayAs('Warden', 'neighbour', 'You are blocking the road. I am writing. I am writing very slowly. But I am writing.', 'angry')], done: [say('player', 'In the cab. Key in. Duck smiling. We are free.', 'laughing')], hint: 'Cross behind the walkers and run right to the cab.' }),
  ],
  items: [
    { id: 'b1', task: 0, x: 4, z: -5.4, label: 'Lift a box', color: '#c9a074', shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'b2', task: 0, x: 6.4, z: -5, label: 'Lift a box', color: '#c9a074', shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'b3', task: 0, x: 3, z: -3.4, label: 'Lift a box', color: '#c9a074', shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'b4', task: 0, x: 7.4, z: -3, label: 'Lift a box', color: '#c9a074', shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'fridge', task: 1, x: 20, z: 4.4, label: 'Push the fridge on', color: '#e8ecef', shape: 'crate', y: 0.6, act: 'push' },
    { id: 'bed', task: 1, x: 24, z: 4.4, label: 'Lift the bed frame', color: '#6b3a1e', shape: 'crate', y: 0.5, act: 'lift' },
    { id: 'lamp', task: 1, x: 28, z: 4.4, label: 'Carry the lamp', color: YELLOW, shape: 'bottle', y: 0.9, act: 'grab' },
  ],
  sequences: { 1: ['fridge', 'bed', 'lamp'] },
  goto: [null, null, RING(36, 5, 1.5)],
  guide: [{ x: 5, z: -4, r: 6 }, { x: 24, z: 4.4, r: 8 }, RING(36, 5, 1.5)],
  hazards: [D('walker', 16, -3, 8, 2.8, 0, ORANGE), D('walker', 22, -3, 8, 2.6, 1.2, GREEN), D('walker', 28, -3, 8, 3.0, 0.6, RUST)],
  timeLimit: 16,
  crowd: [{ x: 12, z: 8, rot: 1 }, { x: 34, z: -4, rot: -2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }, choiceLabel: 'loading',
  endBeat: { text: 'The truck is full to the roof. Kayode ties the last rope and pats the load like a nervous horse. The sofa is still in the flat. The sofa has not agreed to anything.', line: 'The sofa.' },
  starRules: ['Finish the level', 'Reach the cab before the timer ends', 'Be on time with two or fewer slips'],
}), haul('the flat', 'Truck to the flat', 'Loading starts at eight', [sayAs('Mama Folake', 'folake', 'Eight o\'clock. Take the truck, do not be late and do not drop the fridge.', 'worried')], [sayAs('Kayode', 'helper', 'You are the driver? Interesting. We will see.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 6
export const LEVEL_C6L6 = withBus(L({
  ch: 'ch6', n: 6, title: 'The Stubborn Sofa', next: 'ch6.l7', bounds: BIGB,
  intro: 'The sofa is nine feet long. The door is three. The corridor has a corner. The stairwell has a wall. The sofa has no intention of leaving.',
  theme: { ground: '#bfb393', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#cfc4a8' }], deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: CREAM }, { kind: 'sign', x: 4, z: -6.2, label: 'LIVING ROOM', w: 1.8 }, { kind: 'sign', x: 20, z: -6.2, label: 'CORRIDOR', w: 1.8 }, { kind: 'sign', x: 36, z: -6.2, label: 'STAIRWELL', w: 1.8 }, { kind: 'rug', x: 30, z: 3, w: 8, d: 3, color: BLUE }, ...TREES([[39, 9]])] },
  furniture: [F('sofa', R(0, 6.4, -4, -1.6), 0.9, '#c4562a'), F('wallA', R(8, 10, -12, -2), 3, '#e8e0cf'), F('wallB', R(8, 10, 2, 12), 3, '#e8e0cf'), F('bikes', R(24, 27, 5, 6.4), 0.9, DARK), F('toolbox', R(14, 17, 8, 9.4), 0.7, '#6a8ab8')], ...base,
  tasks: [
    T('ch6.l6', 1, 'find', 'Find the tape measure', { purpose: 'Will the sofa fit through the door? Somebody must measure. The tape measure is somewhere.', objective: 'Find the tape measure', success: 'You find it.',
      intro: [sayAs('Kayode', 'helper', 'We need the tape measure. Everybody who owns a tape measure has also lost one.', 'cheeky')], done: [say('player', 'Under the toolbox. Of course. It was in the last place I would look.', 'tired')], hint: 'Try the bikes, the toolbox and under the rug.' }),
    T('ch6.l6', 2, 'sequence', 'Tilt, push and turn', { purpose: 'The sofa has to be tipped on its end, pushed through the doorway and turned round the corner. In that order.', objective: 'Tilt it, push it, then turn it', success: 'The sofa is through the door.',
      intro: [sayAs('Kayode', 'helper', 'On its end first. Then through. Then turn. Not the other way. I have seen the other way. There is a hole in my uncle\'s wall.', 'worried')], done: [sayAs('Kayode', 'helper', 'It is through! It is actually through! I did not believe in sofas until now.', 'laughing')], hint: 'Order at the sofa: tilt, push, turn.' }),
    T('ch6.l6', 3, 'reach', 'Squeeze the corridor', { purpose: 'The corridor is full of bikes, trolleys and a neighbour who has chosen today to move his own furniture.', objective: 'Get through the corridor to the stairwell', success: 'You reach the stairwell before the timer ends.',
      intro: [say('tunde', 'Mind the bikes! Mind the walls! Mind the neighbour! He has a very large wardrobe!', 'worried')], done: [say('player', 'We are alive. The sofa is alive. The wall is a little less alive.', 'laughing')], hint: 'Cross behind the moving things and run right to the stairwell.' }),
    T('ch6.l6', 4, 'hold', 'Take a breather', { purpose: 'Everyone leans on a wall and wishes they had never bought the sofa.', objective: 'Lean on the wall and rest', success: 'You are rested.',
      intro: [sayAs('Kayode', 'helper', 'Rest. Five minutes. Water. Do not look at the sofa. It is looking at you.', 'tired')], done: [sayAs('Kayode', 'helper', 'Right. The stairs. The stairs have a corner. The corner has a plan.', 'angry')], hint: 'Stand in the ring by the stairwell until you are rested.' }),
  ],
  spots: [
    { id: 'bikes', task: 0, x: 25.4, z: 4.2, label: 'Check by the bikes', wrong: say('helper', 'Three bikes and a very proud spider.', 'cheeky') },
    { id: 'rug', task: 0, x: 30, z: 2.4, label: 'Look under the rug', wrong: say('player', 'A coin. A button. A very old sock. No tape measure.', 'tired') },
    { id: 'tool', task: 0, x: 15.6, z: 7, label: 'Check the toolbox', right: true },
  ],
  items: [
    { id: 'tilt', task: 1, x: 1.4, z: -0.6, label: 'Tilt the sofa on its end', color: '#c4562a', shape: 'crate', y: 0.5, act: 'lift' },
    { id: 'push', task: 1, x: 3.2, z: -0.6, label: 'Push it through the door', color: '#c4562a', shape: 'crate', y: 0.5, act: 'push' },
    { id: 'turn', task: 1, x: 5, z: -0.6, label: 'Turn it round the corner', color: '#c4562a', shape: 'crate', y: 0.5, act: 'push' },
  ],
  sequences: { 1: ['tilt', 'push', 'turn'] },
  holds: { 3: { x: 36, z: 3, r: 1.5, secs: 5, pose: 'lean' } },
  goto: [null, null, RING(36, 0, 1.6), null],
  guide: [{ x: 20, z: 6, r: 14 }, { x: 3.2, z: -0.6, r: 4 }, RING(36, 0, 1.6), RING(36, 3, 1.5)],
  hazards: [D('cart', 14, -3, 3, 2.8, 0, DARK), D('chair', 19, -3, 3, 2.6, 1.2, RUST), D('cart', 25, -3, 3, 3.0, 0.6, ORANGE), D('chair', 30, -3, 3, 2.4, 0.2, GREEN)],
  timeLimit: 18,
  crowd: [{ x: 22, z: 6, rot: 2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: -9, rot: -2.4 } }, choiceLabel: 'sofa',
  endBeat: { text: 'The sofa sits in the truck like a tired cat. You and Kayode sit on it. Nobody says a word. It is the most comfortable it has ever been.', line: 'The long road.' },
  starRules: ['Finish the level', 'Reach the stairwell before the timer ends', 'Be on time with two or fewer slips'],
}), haul('the flat', 'Truck to the flat', 'The sofa is waiting', [sayAs('Mama Folake', 'folake', 'Take the truck back to the flat and deal with the sofa. Bring a measuring tape. And a prayer.', 'worried')], [sayAs('Kayode', 'helper', 'There it is. Nine feet of regret. We will win.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 7
export const LEVEL_C6L7 = withBus(L({
  ch: 'ch6', n: 7, title: 'The Long Road', next: 'ch6.l8', bounds: BIGB,
  intro: 'A detour sign, a fuel gauge pointing at E and a rubber duck that stares at the road with unblinking confidence. The highway to the new place is longer than it looked on the map.',
  theme: { ground: '#bfb393', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#bfb8a4' }], deco: [{ kind: 'road', x: 14, z: 0, w: 70, d: 6, color: '#3d3d46' }, { kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: '#d9b98a' }, { kind: 'stall', x: 28, z: -8.4, w: 3.4, d: 1.6, color: ORANGE, label: 'FUEL' }, { kind: 'sign', x: 8, z: -5, label: 'DETOUR', w: 1.6 }, { kind: 'sign', x: 37, z: 6, label: 'NEXT TOWN', w: 1.8 }, ...TREES([[-10, 9], [39, -9]])] },
  furniture: [F('pump', R(26, 30, -9.6, -8), 1.2, '#2f5a3a'), F('truckpark', R(14, 18, 6, 8), 1.4, '#2b6ad0'), F('kiosk', R(3, 6, 7, 9), 1.4, DARK)], ...base,
  tasks: [
    T('ch6.l7', 1, 'reach', 'Cross the highway', { purpose: 'The truck broke down on the far side. Run across the highway between the cars.', objective: 'Cross the highway to the fuel station', success: 'You reach the other side before the timer ends.',
      intro: [sayAs('Kayode', 'helper', 'We stopped on the wrong side! Cross! Do not look at the cars! Look at the gaps!', 'worried')], done: [say('player', 'Across. Alive. And the cars are still honking.', 'laughing')], hint: 'Cross behind the vehicles and run to the FUEL stall at the top.' }),
    T('ch6.l7', 2, 'find', 'Find the lost keys', { purpose: 'The keys with the rubber duck are gone. They fell out somewhere.', objective: 'Find the truck keys', success: 'You find the keys.',
      intro: [say('player', 'The duck is on the keys. The keys are on the... somewhere. The duck is smiling about it.', 'worried')], done: [say('player', 'In the kiosk. The attendant kept them for me. The duck looked guilty.', 'tired')], hint: 'Check the broken-down truck, the kiosk and the pump.' }),
    T('ch6.l7', 3, 'collect', 'Fuel and supplies', { purpose: 'A can of fuel, water and a road map. Three things from three places along the highway.', objective: 'Fetch fuel, water and a map', success: 'You have all three.',
      intro: [sayAs('Attendant', 'neighbour', 'Fuel at the pump. Water at the kiosk. A map at the stand. We have no signal. We have nothing. We have maps.', 'cheeky')], done: [say('player', 'Fuel, water, map. We might actually reach civilisation.', 'happy')], hint: 'Fuel at the pump, water at the kiosk, the map at the stand.' }),
    T('ch6.l7', 4, 'talk', 'Ask about the road', { purpose: 'The attendant knows the detour. Ask him how long it really is.', objective: 'Talk to the attendant', success: 'You know the way.',
      intro: [say('player', 'He looks like a man who has given directions to a hundred lost drivers.', 'thinking')], done: [say('player', 'Left at the baobab. Right at the dead cow. Straight until the sign that says "straight". Easy.', 'laughing')], hint: 'The attendant stands by the FUEL stall.' }),
  ],
  spots: [
    { id: 'truck', task: 1, x: 16, z: 4.6, label: 'Check the old truck', wrong: say('player', 'Crumbs, a hat and a very flat tomato. Not the keys.', 'tired') },
    { id: 'kiosk', task: 1, x: 4.4, z: 5.6, label: 'Ask at the kiosk', right: true },
    { id: 'pump', task: 1, x: 28, z: -6.2, label: 'Check by the pump', wrong: say('helper', 'A glove, a coin and a spotted cat. No keys.', 'cheeky') },
  ],
  items: [
    { id: 'fuel', task: 2, price: 0, x: 28, z: -8.8, label: 'Take the fuel can', color: RUST, shape: 'crate', y: 0.9, act: 'lift' },
    { id: 'water', task: 2, price: 0, x: 4.4, z: 8, label: 'Take the water', color: '#6a8ab8', shape: 'bottle', y: 1.1, act: 'grab' },
    { id: 'map', task: 2, price: 0, x: 37, z: 4.4, label: 'Take the map', color: '#fbf8f0', shape: 'paper', y: 0.95, act: 'grab' },
  ],
  talks: { 3: [{ id: 'att', name: 'The Attendant', x: 24, z: -6, lines: [sayAs('Attendant', 'neighbour', 'The detour? Long. Very long. Two hours if you are lucky. Four if you are honest.', 'calm')], rounds: [{ options: [
    { id: 'thanks', label: '"Thank you. We will take the long way."', reply: sayAs('Attendant', 'neighbour', 'A wise driver. The short way has a river in it.', 'happy') },
    { id: 'shortcut', label: '"Is there a shortcut?"', reply: sayAs('Attendant', 'neighbour', 'A shortcut? Yes. It ends in a swamp. Take the detour.', 'cheeky') },
  ] }] }] },
  goto: [RING(28, -6, 1.6), null, null, null],
  guide: [RING(28, -6, 1.6), { x: 8, z: 5, r: 14 }, { x: 22, z: 2, r: 20 }, { x: 24, z: -6, r: 4 }],
  hazards: [D('cart', 6, -3, 3, 3.6, 0, RUST), D('cart', 12, -3, 3, 4.0, 1.3, BLUE), D('cart', 18, -3, 3, 3.4, 0.7, ORANGE), D('cart', 24, -3, 3, 3.8, 0.2, GREEN)],
  timeLimit: 18,
  crowd: [{ x: 32, z: 6, rot: -2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: -9, rot: -2.4 } }, choiceLabel: 'road',
  endBeat: { text: 'The detour takes four hours, three sandwiches and one argument about whose turn it is to hold the map. At the end you see a sign that says "Welcome". You cry a little.', line: 'The new place at last.' },
  starRules: ['Finish the level', 'Cross before the timer ends', 'Be on time with two or fewer slips'],
}), haul('the highway', 'Truck onto the highway', 'The new flat is two towns away', [sayAs('Mama Folake', 'folake', 'The new flat is far. Fill the tank, pack water and do not trust the map. The map has been wrong since 1998.', 'worried')], [sayAs('Kayode', 'helper', 'We are on the highway. The duck is driving. I am just here for the snacks.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 8
const newBld = B('newflat', 8, 28, -12, -7, '#f0d9a8', 'NEW FLAT 12', 3.8)
export const LEVEL_C6L8 = withBus(L({
  ch: 'ch6', n: 8, title: 'The New Place', next: 'ch6.l9', bounds: BIGB,
  intro: 'Fresh paint, an echoing hallway and a key that fits the door on the third try. Aunty Ngozi is waiting with a broom and a list. Everything has to come off the truck.',
  theme: { ground: '#bfb393', ...PLACE('#e0d6b8', [...newBld.d, { kind: 'rug', x: 18, z: 4, w: 12, d: 3, color: GREEN }, { kind: 'chair', x: 14, z: 3, color: WOOD }, { kind: 'chair', x: 20, z: 3, color: WOOD }, { kind: 'sign', x: 36, z: 2, label: 'TRUCK', w: 1.4 }]) },
  furniture: [newBld.f, F('ctable', R(11, 23, 4.2, 5.4), 0.8, WOOD)], ...base,
  tasks: [
    T('ch6.l8', 1, 'goto', 'Open the door', { purpose: 'The new key, the new door and a new hallway that smells of paint.', objective: 'Walk to the new front door', success: 'You are at the door.',
      intro: [say('folake', 'It is a good door. It has a good lock. Try the key. No, the other way. No, the other other way.', 'calm')], done: [sayAs('Aunty Ngozi', 'neighbour', 'It stuck for me too. Lift and push. Like everything in this city.', 'happy')], hint: 'Follow the ring to the door of NEW FLAT 12.' }),
    T('ch6.l8', 2, 'sequence', 'Unload in order', { purpose: 'The sofa first (it is the big one), then the bed, then the boxes.', objective: 'Sofa, bed, then boxes', success: 'The truck is empty.',
      intro: [sayAs('Kayode', 'helper', 'Sofa out first. Then the bed. Then the boxes. Sofa out last was a mistake I made once.', 'worried')], done: [sayAs('Kayode', 'helper', 'Empty! The truck is empty! The truck is lighter! And I am heavier. With feelings.', 'laughing')], hint: 'Order near the truck: sofa, bed, boxes.' }),
    T('ch6.l8', 3, 'talk', 'Meet Aunty Ngozi', { purpose: 'Your aunt lives next door and has strong opinions about where things should go.', objective: 'Talk to Aunty Ngozi and Kayode', success: 'You know where everything goes.',
      intro: [sayAs('Aunty Ngozi', 'neighbour', 'Welcome to the building! Sofa by the window. Bed by the wall. Plants anywhere, I am not fussy. Except there.', 'happy')], done: [say('player', 'Sofa by the window. Bed by the wall. Plants everywhere. Got it.', 'happy')], hint: 'Aunty Ngozi is by the front door; Kayode is near the truck.' }),
    T('ch6.l8', 4, 'serve', 'Water for the helpers', { purpose: 'Seat your tired helpers and bring each a cold drink.', objective: 'Seat and serve the helpers', success: 'Everyone has a drink.',
      intro: [sayAs('Kayode', 'helper', 'If someone does not hand me water in the next minute I will drink from the hose.', 'tired')], done: [sayAs('Kayode', 'helper', 'You are a good person. Do not tell anyone I said that.', 'happy')], hint: 'Seat each helper, take a drink from the table and carry it over.' }),
  ],
  talks: { 2: [
    { id: 'ngozi', name: 'Aunty Ngozi', x: 18, z: -4.6, lines: [sayAs('Aunty Ngozi', 'neighbour', 'There you are! The sofa goes by the window, the bed by the wall. Tell me you did not bring the nine-foot sofa up the stairs.', 'worried')], rounds: [{ options: [
      { id: 'yes', label: '"I brought the sofa up the stairs."', reply: sayAs('Aunty Ngozi', 'neighbour', 'You are either very brave or very stubborn. I like both.', 'cheeky') },
      { id: 'no', label: '"Kayode brought it. I supervised."', reply: sayAs('Aunty Ngozi', 'neighbour', 'A manager already. I am proud and slightly worried.', 'cheeky') },
    ] }] },
    { id: 'kayode', name: 'Kayode', x: 33, z: 1.4, lines: [sayAs('Kayode', 'helper', 'Nine feet. Three stairs. One corner. Do not ask me about the corner.', 'tired')] },
  ] },
  items: [
    { id: 'sofaU', task: 1, x: 31, z: 4, label: 'Carry the sofa off', color: '#c4562a', shape: 'crate', y: 0.5, act: 'lift' },
    { id: 'bedU', task: 1, x: 33, z: 4, label: 'Lift the bed frame down', color: '#6b3a1e', shape: 'crate', y: 0.5, act: 'lift' },
    { id: 'boxU', task: 1, x: 35, z: 4, label: 'Carry the boxes', color: '#c9a074', shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'wKayode', task: 3, x: 13, z: 4.8, label: 'Take Kayode\'s water', color: '#6a8ab8', shape: 'bottle', y: 0.95 },
    { id: 'wGarba', task: 3, x: 15, z: 4.8, label: 'Take the driver\'s juice', color: YELLOW, shape: 'cup', y: 0.95 },
  ],
  sequences: { 1: ['sofaU', 'bedU', 'boxU'] },
  serves: { 3: { eatSecs: 3, from: 3, guests: [
    { id: 'kayode', name: 'Kayode', order: 'Cold water', dish: 'wKayode', x: 6, z: 6, seat: { x: 14, z: 3 }, table: { x: 14, z: 4.6 } },
    { id: 'garba', name: 'The Driver', order: 'Juice', dish: 'wGarba', x: 4, z: 8, seat: { x: 20, z: 3 }, table: { x: 20, z: 4.6 } },
  ] } },
  goto: [RING(18, -5.4, 1.6), null, null, null],
  guide: [RING(18, -5.4, 1.6), { x: 33, z: 4, r: 5 }, { x: 24, z: -2, r: 14 }, { x: 17, z: 4, r: 8 }],
  crowd: [{ x: 4, z: 3, rot: 1 }, { x: 28, z: 8, rot: -2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }, choiceLabel: 'layout',
  endBeat: { text: 'The sofa is by the window. The bed is by the wall. The plants are anywhere. The flat looks like a place that might become yours.', line: 'The first night.' },
  starRules: ['Finish the level', 'Finish with no wrong order', 'Finish with no mistakes and no hints'],
}), haul('the new place', 'Truck to the new place', 'Two towns away', [sayAs('Mama Folake', 'folake', 'The new flat is just there. The key is a good key. The door is a bad door. Take the truck and open it gently.', 'calm')], [sayAs('Aunty Ngozi', 'neighbour', 'Here! Here! You are here! The tea is almost ready and the sofa is almost somewhere!', 'happy')]))

// ---------------------------------------------------------------------------------------------------------------- Level 9
export const LEVEL_C6L9 = withBus(L({
  ch: 'ch6', n: 9, title: 'First Night', next: null, badge: 'Move-Out Day', bounds: BIGB,
  intro: 'The boxes are stacked, the lights are on and nothing is where it should be. The first night in a new place is always a picnic on the floor.',
  theme: { ground: '#bfb393', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#e0cfa0' }], deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: CREAM }, { kind: 'window', x: 8, z: -12.3, w: 4, h: 1.6 }, { kind: 'window', x: 26, z: -12.3, w: 4, h: 1.6 }, { kind: 'rug', x: 20, z: 2, w: 12, d: 6, color: '#c4562a' }, { kind: 'chair', x: 16, z: 2, color: '#c4562a' }, { kind: 'chair', x: 20, z: 2, color: '#c4562a' }, { kind: 'chair', x: 24, z: 2, color: '#c4562a' }, { kind: 'sign', x: 36, z: -4, label: 'BALCONY', w: 1.6 }, ...TREES([[39, 9]]), ...LAMPS([[8, 6]])] },
  furniture: [F('boxtable', R(14, 26, 3.4, 4.6), 0.7, '#a87a50'), F('pizzabox', R(8, 12, -9, -7.8), 0.7, '#c9a074'), F('boxes', R(30, 34, 6, 8), 1.2, '#c9a074')], ...base,
  tasks: [
    T('ch6.l9', 1, 'serve', 'Pizza on a box', { purpose: 'No table yet. Seat your helpers on the floor cushions and bring each a slice.', objective: 'Seat and serve three people', success: 'Everyone is eating.',
      intro: [sayAs('Aunty Ngozi', 'neighbour', 'No plates. No table. Pizza on a box. This is how every great home begins.', 'happy')], done: [sayAs('Kayode', 'helper', 'Best pizza of my life. It is also the only pizza of my day.', 'cheeky')], hint: 'Seat each guest, take their slice from the pizza box and carry it over.' }),
    T('ch6.l9', 2, 'hold', 'Sit on the floor', { purpose: 'Sit down on the empty floor in the middle of the room and look at all of it.', objective: 'Sit on the floor and look around', success: 'You are home.',
      intro: [say('player', 'It is empty. It is loud. It is mine.', 'happy')], done: [say('player', 'I could stay here forever. Or until I need the bathroom.', 'laughing')], hint: 'Stand in the ring in the middle of the rug until you are rested.' }),
    T('ch6.l9', 3, 'talk', 'Call home', { purpose: 'Mama Folake and Baba Tunde have been waiting by the phone all day.', objective: 'Talk to Mama and Baba on the phone', success: 'They know you arrived.',
      intro: [say('folake', 'It rang! It rang! Baba, it rang! Hello? Hello? Is the sofa in? Is it all right?', 'happy')], done: [say('folake', 'You are home, my child. Wherever it is, you are home.', 'proud')], hint: 'Mama and Baba are on the phone at the left.' }),
    T('ch6.l9', 4, 'goto', 'Step onto the balcony', { purpose: 'The first look at the view from your new place.', objective: 'Walk out onto the balcony', success: 'You are on the balcony.',
      intro: [sayAs('Aunty Ngozi', 'neighbour', 'Go on. Look. The view is the best thing in the whole building. Better than the lifts. The lifts do not work.', 'happy')], done: [say('tunde', 'Somewhere out there, there is a new bus, a new market and a new neighbour. Go and meet them.', 'proud')], hint: 'The balcony is at the top right.' }),
  ],
  items: [
    { id: 'sK', task: 0, x: 9, z: -8.4, label: 'Take Kayode\'s slice', color: '#e0a040', shape: 'plate', y: 0.9 },
    { id: 'sN', task: 0, x: 10, z: -8.4, label: 'Take Aunty Ngozi\'s slice', color: '#e0a040', shape: 'plate', y: 0.9 },
    { id: 'sT', task: 0, x: 11, z: -8.4, label: 'Take Tobi\'s slice', color: '#e0a040', shape: 'plate', y: 0.9 },
  ],
  serves: { 0: { eatSecs: 3, from: 0, guests: [
    { id: 'kayode', name: 'Kayode', order: 'Pepperoni', dish: 'sK', x: 6, z: 4, seat: { x: 16, z: 2 }, table: { x: 16, z: 3.8 } },
    { id: 'ngozi', name: 'Aunty Ngozi', order: 'Vegetable', dish: 'sN', x: 8, z: 7, seat: { x: 20, z: 2 }, table: { x: 20, z: 3.8 } },
    { id: 'tobi', name: 'Tobi', order: 'Extra cheese', dish: 'sT', x: 4, z: 7, seat: { x: 24, z: 2 }, table: { x: 24, z: 3.8 } },
  ] } },
  holds: { 1: { x: 20, z: 0, r: 1.2, secs: 7, pose: 'sit' } },
  talks: { 2: [
    { id: 'mama', name: 'Mama Folake', x: 4, z: -2, lines: [sayAs('Mama Folake', 'folake', 'Are you there? Is the flat nice? Is the sofa in one piece? Is there food? Eat something!', 'happy')], rounds: [{ options: [
      { id: 'nice', label: '"It is lovely, Mama. And the sofa made it."', reply: sayAs('Mama Folake', 'folake', 'The sofa! I knew you would win. I told your father.', 'proud') },
      { id: 'tired', label: '"I am very tired, Mama. But very happy."', reply: sayAs('Mama Folake', 'folake', 'Tired and happy. That is the best kind of tired.', 'happy') },
    ] }] },
    { id: 'baba', name: 'Baba Tunde', x: 4, z: 2, lines: [sayAs('Baba Tunde', 'tunde', 'Good. A moved child is a grown child. I will visit with a drill. And a speech.', 'proud')] },
  ] },
  goto: [null, null, null, RING(36, -2, 1.6)],
  guide: [{ x: 12, z: 3, r: 14 }, RING(20, 0, 1.2), { x: 4, z: 0, r: 4 }, RING(36, -2, 1.6)],
  crowd: [],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }, choiceLabel: 'home',
  endBeat: { text: 'From the balcony the new neighbourhood is a field of rooftops and light. Somewhere below, a keke hoots. You are home. You have been for a while. You just did not know.', line: 'Chapter 6 is done.' },
  starRules: ['Finish the level', 'Finish with no wrong plate', 'Finish with no mistakes and no hints'],
}), haul('the new flat', 'Truck to the new flat', 'The first night in the new place', [sayAs('Mama Folake', 'folake', 'The first night! Take the truck, bring pizza and sit on the floor. I will call. Pick up.', 'happy')], [sayAs('Aunty Ngozi', 'neighbour', 'Welcome home. Mind the boxes. Mind the cat. We do not have a cat. Mind it anyway.', 'cheeky')]))
void ORANGE; void YELLOW; void RUST; void BLUE; void WOOD; void DARK
