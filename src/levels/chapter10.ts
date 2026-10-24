// Chapter 10 "Family Weekend": the whole family descends on your flat for one loud, delicious weekend. The family car carries you between the
// airport, the flat, the market, the kitchen, the church hall and the farewell. Each level is a different scene with a different task mix.
import type { Deco } from './schema'
import { L, T, R, F, say, sayAs, D, WOOD, DARK } from './chapter1b'
import { B, TREES, LAMPS, RING, GREEN } from './chapter1c'
import { withBus, type BusOpts } from './bus'

const ORANGE = '#e07a1f', YELLOW = '#f5b91c', RUST = '#c4562a', BLUE = '#2b6ad0', CREAM = '#f3e7cf', TEAL = '#2a9d8f', RED = '#c9372c', GRASS = '#cfdcb0'
const ride = (to: string, title: string, why: string, intro: BusOpts['intro'], done: BusOpts['done']): BusOpts => ({ vehicle: 'car', to, title, purpose: `${why}: wait at the car park, board the family car and ride there.`, objective: `Take the family car to ${to}`, success: `You park at ${to}.`, intro, done })
const HOME = (floor: string, extra: Deco[] = []): { floors: { x0: number; x1: number; z0: number; z1: number; color: string }[]; deco: Deco[] } => ({
  floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: floor }],
  deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: CREAM }, ...TREES([[-10, 9], [39, 9]]), ...LAMPS([[8, 6], [28, 6]]), ...extra],
})
const base = { spawn: { x: -9, z: 0 }, resume: { x: -6, z: 2 } }
const BIGB = R(-12, 40, -12.4, 12.4)
const desk = (x: number, color: string, label: string): Deco => ({ kind: 'stall', x, z: 7.4, w: 3.4, d: 1.6, color, label })
const side = { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }
const walkers = (xs: number[], z0 = -2, z1 = 8): ReturnType<typeof D>[] => xs.map((x, i) => D('walker', x, z0, z1, 2.6 + (i % 3) * 0.2, i * 0.6, [GREEN, ORANGE, RUST, BLUE][i % 4]))

// ---------------------------------------------------------------------------------------------------------------- Level 1
const arr = B('arrivals', -8, 6, -12, -7, '#dfeef0', 'ARRIVALS', 3.6)
export const LEVEL_C10L1 = withBus(L({
  ch: 'ch10', n: 1, title: 'Pick Up the Family', next: 'ch10.l2', bounds: BIGB,
  intro: 'Friday afternoon at the airport. Grandma, Uncle Chidi and Aunty Bisi are all landing within ten minutes of each other, with a combined luggage of nine bags and five opinions.',
  theme: { ground: '#bfb8a4', ...HOME('#e4e4dc', [...arr.d, desk(10, ORANGE, 'BELT 1'), desk(20, BLUE, 'BELT 2'), desk(30, TEAL, 'BELT 3'), { kind: 'rug', x: 18, z: 0, w: 28, d: 2, color: '#d6d2c4' }, { kind: 'sign', x: 37, z: 3, label: 'CAR PARK', w: 1.8 }]) },
  furniture: [arr.f, F('d1', R(8.3, 11.7, 6.6, 8.2), 1.0, WOOD), F('d2', R(18.3, 21.7, 6.6, 8.2), 1.0, WOOD), F('d3', R(28.3, 31.7, 6.6, 8.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch10.l1', 1, 'talk', 'Welcome the arrivals', { purpose: 'Grandma, Uncle Chidi and Aunty Bisi are through the doors. Greet all three.', objective: 'Talk to Grandma, Uncle Chidi and Aunty Bisi', success: 'You have greeted everyone.',
      intro: [sayAs('Mama Folake', 'folake', 'Greet them properly. Kneel for Grandma if you must. Do not hug Uncle Chidi too long. He pretends he dislikes it.', 'cheeky')], done: [say('player', 'Three hugs, three kisses and one comment about my weight. A perfect arrival.', 'laughing')], hint: 'Grandma, Uncle Chidi and Aunty Bisi stand on the path near the doors.' }),
    T('ch10.l1', 2, 'find', 'Find the right belt', { purpose: 'Their flight\'s bags are on one of three belts. The board has been wrong all day.', objective: 'Find the belt for flight 412', success: 'You find it.',
      intro: [sayAs('Uncle Chidi', 'helper', 'The board says belt one. The board lies. It has lied since 2009. Find the real belt.', 'cheeky')], done: [say('player', 'Belt two. Exactly where nobody said. Typical.', 'tired')], hint: 'Check the three belts along the bottom.' }),
    T('ch10.l1', 3, 'collect', 'Collect the bags', { purpose: 'Grandma\'s suitcase, Aunty Bisi\'s cooler and a huge bag of yams from Uncle Chidi.', objective: 'Collect the suitcase, the cooler and the yams', success: 'You have every bag.',
      intro: [sayAs('Aunty Bisi', 'neighbour', 'The suitcase is heavy. The cooler is heavier. The yams are a love language. Handle them gently.', 'cheeky')], done: [say('player', 'Suitcase, cooler, yams. I have never felt so much like a family donkey.', 'laughing')], hint: 'Take the three bags from the three belts.' }),
    T('ch10.l1', 4, 'goto', 'Walk to the car park', { purpose: 'The car is in the far corner. Lead the way.', objective: 'Walk to the car park', success: 'You reach the car.',
      intro: [sayAs('Grandma', 'helper', 'Slowly, my child. I am old. I am not dead. There is a difference.', 'cheeky')], done: [say('player', 'The car. The boot. A cooler that does not fit. Rearranging.', 'worried')], hint: 'Follow the ring to the CAR PARK sign.' }),
  ],
  talks: { 0: [
    { id: 'grandma', name: 'Grandma', x: 4, z: -3, lines: [sayAs('Grandma', 'helper', 'My child! You have gone thin. Or the city has swallowed you. Which one?', 'cheeky')], rounds: [{ options: [
      { id: 'fine', label: '"I am well, Grandma. I eat."', reply: sayAs('Grandma', 'helper', 'Hm. We will see this weekend. I brought stew. A lot of stew.', 'happy') },
      { id: 'miss', label: '"I missed you so much."', reply: sayAs('Grandma', 'helper', 'Good. A person who misses is a person who remembers. Come here.', 'happy') },
    ] }] },
    { id: 'chidi', name: 'Uncle Chidi', x: 16, z: -3, lines: [sayAs('Uncle Chidi', 'helper', 'You look well. Too well. Are you being paid enough? Are you being paid at all?', 'suspicious')] },
    { id: 'bisi', name: 'Aunty Bisi', x: 26, z: -3, lines: [sayAs('Aunty Bisi', 'neighbour', 'I have a list. Of things to check. In your flat. You will survive. Probably.', 'curious')] },
  ] },
  spots: [
    { id: 'b1', task: 1, x: 10, z: 5.2, label: 'Check belt 1', wrong: say('helper', 'A lot of trolleys and a man asleep on a suitcase. Not this one.', 'cheeky') },
    { id: 'b2', task: 1, x: 20, z: 5.2, label: 'Check belt 2', right: true },
    { id: 'b3', task: 1, x: 30, z: 5.2, label: 'Check belt 3', wrong: say('player', 'Luggage from a flight to Dubai. Not this one.', 'tired') },
  ],
  items: [
    { id: 'suitcase', task: 2, x: 10, z: 7.2, label: 'Take Grandma\'s suitcase', color: RUST, shape: 'box', y: 1.05, act: 'carryBox' },
    { id: 'cooler', task: 2, x: 20, z: 7.2, label: 'Take Aunty Bisi\'s cooler', color: BLUE, shape: 'crate', y: 1.05, act: 'carryBox' },
    { id: 'yams', task: 2, x: 30, z: 7.2, label: 'Take the yams', color: '#d9b878', shape: 'bag', y: 1.05, act: 'lift' },
  ],
  goto: [null, null, null, RING(36, 5, 1.6)],
  guide: [{ x: 16, z: -3, r: 14 }, { x: 20, z: 5, r: 12 }, { x: 20, z: 7, r: 14 }, RING(36, 5, 1.6)],
  crowd: [{ x: 14, z: 3, rot: 1 }, { x: 28, z: 3, rot: -2 }],
  npcs: side, choiceLabel: 'arrival',
  endBeat: { text: 'The boot closes on the third try. Grandma sits in front, Aunty Bisi gives directions from the back and Uncle Chidi says "we should have taken a taxi".', line: 'Home is next.' },
  starRules: ['Finish the level', 'Finish with no wrong belts', 'Finish with no mistakes and no hints'],
}), ride('the airport', 'Ride to the airport', 'The family is landing', [sayAs('Mama Folake', 'folake', 'The whole family is landing! Take the car, take a deep breath and take a photo when Grandma sees you. For me.', 'happy')], [say('helper', 'The car rolls up to Arrivals. A hundred people are holding signs. Half of them are holding cooler boxes.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 2
const flat = B('flat', 4, 26, -12, -7, '#e8c9a0', 'YOUR FLAT', 3.8)
export const LEVEL_C10L2 = withBus(L({
  ch: 'ch10', n: 2, title: 'Tidy the Flat', next: 'ch10.l3', bounds: BIGB,
  intro: 'Your flat has been "lived in" for eight months. Grandma will see it in twenty minutes. Things that have to disappear: the pizza boxes, the pile on the chair and the sock on the lamp.',
  theme: { ground: '#bfb393', floors: [{ x0: -12, x1: 6, z0: -12, z1: 12, color: GRASS }, { x0: 6, x1: 40, z0: -12, z1: 12, color: '#e0cfa8' }], deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: CREAM }, ...flat.d, desk(10, ORANGE, 'SHEETS'), desk(20, BLUE, 'PILLOWS'), desk(30, TEAL, 'TOWELS'), { kind: 'rug', x: 28, z: 2, w: 8, d: 4, color: BLUE }, { kind: 'chair', x: 28, z: 1, color: WOOD }, { kind: 'sign', x: 8, z: 3, label: 'YOUR FLAT', w: 1.6 }, ...TREES([[-10, 9], [39, 9]])] },
  furniture: [flat.f, F('d1', R(8.3, 11.7, 6.6, 8.2), 1.0, WOOD), F('d2', R(18.3, 21.7, 6.6, 8.2), 1.0, WOOD), F('d3', R(28.3, 31.7, 6.6, 8.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch10.l2', 1, 'sequence', 'Clear the mess', { purpose: 'Sweep the floor, wipe the table and fluff the cushions. Do it in that order or you will sweep dust back onto clean cushions.', objective: 'Sweep, wipe, then cushions', success: 'The living room is clean.',
      intro: [sayAs('Mama Folake', 'folake', 'Floor, table, cushions. Never cushions first. You will be sweeping all night. I know you.', 'worried')], done: [say('player', 'It looks like a home. A home with a mildly suspicious smell.', 'laughing')], hint: 'Order along the flat: floor, table, cushions.' }),
    T('ch10.l2', 2, 'hold', 'Catch your breath', { purpose: 'Sit on the sofa for a moment before the doorbell rings.', objective: 'Sit and catch your breath', success: 'You are ready.',
      intro: [say('player', 'Ten seconds. I am allowed ten seconds. Then I become a host.', 'tired')], done: [say('player', 'Breathing normally. Hosting calmly. Panicking quietly inside.', 'worried')], hint: 'Stand in the ring by the sofa until the count is full.' }),
    T('ch10.l2', 3, 'collect', 'Make up the beds', { purpose: 'Sheets, pillows and towels from the three shelves for tonight\'s guests.', objective: 'Collect sheets, pillows and towels', success: 'The beds are ready.',
      intro: [sayAs('Aunty Bisi', 'neighbour', 'Sheets, pillows, towels. Fresh. Not "fresh enough". Fresh.', 'suspicious')], done: [say('player', 'Sheets, pillows, towels. Three clean things in a house that is mostly dust.', 'proud')], hint: 'Take the three items from the shelves along the bottom.' }),
    T('ch10.l2', 4, 'choose', 'Who sleeps where', { purpose: 'Three beds, three guests. Grandma, the uncle and the aunty each want the best one.', objective: 'Choose where Grandma sleeps', success: 'You choose.',
      intro: [sayAs('Grandma', 'helper', 'I will take the room. Or the sofa. Or your bed. I am not fussy. I am only old.', 'cheeky')], done: [say('player', 'Decision made. May I never regret the sofa.', 'worried')], hint: 'Three signs on the path: your room, the guest room or the sofa.' }),
  ],
  items: [
    { id: 'sweep', task: 0, x: 12, z: -2.6, label: 'Sweep the floor', color: '#c8a050', shape: 'box', y: 0.3, act: 'sweep' },
    { id: 'wipe', task: 0, x: 17, z: -2.6, label: 'Wipe the table', color: '#9ecbe6', shape: 'paper', y: 0.9, act: 'wipe' },
    { id: 'cush', task: 0, x: 22, z: -2.6, label: 'Fluff the cushions', color: BLUE, shape: 'blanket', y: 0.6, act: 'pickLow' },
    { id: 'sheets', task: 2, x: 10, z: 7.2, label: 'Take the sheets', color: '#fbf8f0', shape: 'blanket', y: 1.05, act: 'grab' },
    { id: 'pillows', task: 2, x: 20, z: 7.2, label: 'Take the pillows', color: '#fbf8f0', shape: 'blanket', y: 1.05, act: 'grab' },
    { id: 'towels', task: 2, x: 30, z: 7.2, label: 'Take the towels', color: TEAL, shape: 'folder', y: 1.05, act: 'grab' },
    { id: 'room', task: 3, x: 8, z: 3.4, label: 'Give her your room', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'guest', task: 3, x: 18, z: 3.4, label: 'Give her the guest room', color: GREEN, shape: 'sign', y: 0 },
    { id: 'sofa', task: 3, x: 34, z: 3.4, label: 'Offer her the sofa', color: RED, shape: 'sign', y: 0 },
  ],
  sequences: { 0: ['sweep', 'wipe', 'cush'] },
  holds: { 1: { x: 28, z: 1, r: 1.2, secs: 5, pose: 'sit' } },
  guide: [{ x: 17, z: -2.6, r: 10 }, RING(28, 1, 1.2), { x: 20, z: 7, r: 14 }, { x: 20, z: 3.4, r: 14 }],
  crowd: [{ x: 4, z: 6, rot: 1 }],
  npcs: side, choiceLabel: 'bed',
  endBeat: { text: 'The flat is clean, the beds are made and the doorbell goes. For one second you wish you had lived in a tent all this time.', line: 'The market is next.' },
  starRules: ['Finish the level', 'Finish with no wrong order', 'Finish with no mistakes and no hints'],
}), ride('your flat', 'Ride home', 'The family is at the door in twenty minutes', [sayAs('Mama Folake', 'folake', 'Take the car home and tidy the flat. Do not tell Grandma I said the sock was on the lamp. It was on the lamp.', 'worried')], [say('helper', 'You park outside the flat and look up at the window. It looks smaller than you remember.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 3
export const LEVEL_C10L3 = withBus(L({
  ch: 'ch10', n: 3, title: 'Cooking for Everyone', next: 'ch10.l4', bounds: BIGB,
  intro: 'Seven people, one pot and a recipe that says "enough". Saturday dinner is jollof, and Aunty Bisi is already watching you from the kitchen door.',
  theme: { ground: '#bfb393', ...HOME('#e8d9b8', [{ kind: 'stall', x: 10, z: -9, w: 3.4, d: 1.6, color: ORANGE, label: 'RICE' }, { kind: 'stall', x: 18, z: -9, w: 3.4, d: 1.6, color: RED, label: 'CHICKEN' }, { kind: 'stall', x: 26, z: -9, w: 3.4, d: 1.6, color: GREEN, label: 'PEPPER' }, { kind: 'stall', x: 34, z: -9, w: 3.4, d: 1.6, color: YELLOW, label: 'OIL' }, { kind: 'awning', x: 20, z: 3, w: 16, d: 5, color: TEAL }, { kind: 'chair', x: 14, z: 4, color: WOOD }, { kind: 'chair', x: 20, z: 4, color: WOOD }, { kind: 'chair', x: 26, z: 4, color: WOOD }, { kind: 'rug', x: 20, z: 6, w: 16, d: 1.6, color: '#e0d6b8' }, { kind: 'sign', x: 37, z: 4, label: 'KITCHEN', w: 1.8 }]) },
  furniture: [F('c1', R(8.3, 11.7, -9.8, -8.2), 1.0, WOOD), F('c2', R(16.3, 19.7, -9.8, -8.2), 1.0, WOOD), F('c3', R(24.3, 27.7, -9.8, -8.2), 1.0, WOOD), F('c4', R(32.3, 35.7, -9.8, -8.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch10.l3', 1, 'collect', 'Shop for dinner', { purpose: 'Rice, chicken, pepper and oil. You have ₦2,000, and the chicken is the expensive one.', objective: 'Buy 3 things within ₦2,000', success: 'Your bag is full.',
      intro: [sayAs('Aunty Bisi', 'neighbour', 'Rice, chicken, pepper, oil. Buy three. I brought the fourth in my cooler. Do not ask what.', 'suspicious')], done: [say('player', 'Rice, chicken and pepper. Oil from the cooler. A clean plan with a dirty secret.', 'laughing')], hint: 'Pick the cheaper items. Start over if you overspend.' }),
    T('ch10.l3', 2, 'sequence', 'Cook the jollof', { purpose: 'Chop the pepper, stir the rice, then season. That order, or Aunty Bisi will know.', objective: 'Chop, stir, then season', success: 'The jollof is cooking.',
      intro: [sayAs('Aunty Bisi', 'neighbour', 'Chop first. Stir second. Season last. If you season first, the pepper will do things you cannot control.', 'cheeky')], done: [sayAs('Aunty Bisi', 'neighbour', 'Passable. I have seen worse. I have seen much worse. I have cooked much worse.', 'happy')], hint: 'Order at the stove: chop, stir, season.' }),
    T('ch10.l3', 3, 'serve', 'Seat and serve the table', { purpose: 'Seat Grandma, Uncle Chidi and Aunty Bisi and bring each a plate of jollof.', objective: 'Seat and serve three relatives', success: 'Everyone is eating.',
      intro: [sayAs('Grandma', 'helper', 'Where do I sit? Next to the window? Next to the fan? Next to the one who does not talk?', 'cheeky')], done: [sayAs('Uncle Chidi', 'helper', 'This is... good. Do not tell Bisi I said that. She will hold it over me forever.', 'happy')], hint: 'Seat each relative, take their plate from the counter and carry it over.' }),
    T('ch10.l3', 4, 'talk', 'Face the critic', { purpose: 'Aunty Bisi tastes the jollof. Be calm. Be humble. Do not mention the salt.', objective: 'Talk to Aunty Bisi', success: 'She has spoken.',
      intro: [say('player', 'Eight months of cooking for one. Three hours for seven. A bold career move.', 'worried')], done: [sayAs('Aunty Bisi', 'neighbour', 'It needs a little salt. But it is yours. And that is why it is perfect.', 'happy')], hint: 'Aunty Bisi stands at the end of the table.' }),
  ],
  items: [
    { id: 'rice', task: 0, price: 600, x: 10, z: -8.6, label: 'Buy rice (₦600)', color: '#fbf8f0', shape: 'bag', y: 1.05, act: 'grab' },
    { id: 'chicken', task: 0, price: 1200, x: 18, z: -8.6, label: 'Buy chicken (₦1,200)', color: '#d9a066', shape: 'produce', y: 1.05, act: 'grab' },
    { id: 'pepper', task: 0, price: 400, x: 26, z: -8.6, label: 'Buy pepper (₦400)', color: RED, shape: 'produce', y: 1.05, act: 'grab' },
    { id: 'oil', task: 0, price: 500, x: 34, z: -8.6, label: 'Buy oil (₦500)', color: YELLOW, shape: 'bottle', y: 1.05, act: 'grab' },
    { id: 'chop', task: 1, x: 14, z: 8.6, label: 'Chop the pepper', color: RED, shape: 'produce', y: 1.0, act: 'chop' },
    { id: 'stir', task: 1, x: 20, z: 8.6, label: 'Stir the rice', color: ORANGE, shape: 'plate', y: 1.0, act: 'stir' },
    { id: 'season', task: 1, x: 26, z: 8.6, label: 'Season the pot', color: '#fbf8f0', shape: 'bottle', y: 1.0, act: 'pour' },
    { id: 'pG', task: 2, x: 10.4, z: -7.8, label: 'Take Grandma\'s plate', color: ORANGE, shape: 'plate', y: 1.05 },
    { id: 'pC', task: 2, x: 12, z: -7.8, label: 'Take Uncle Chidi\'s plate', color: RUST, shape: 'plate', y: 1.05 },
    { id: 'pB', task: 2, x: 17.4, z: -7.8, label: 'Take Aunty Bisi\'s plate', color: GREEN, shape: 'plate', y: 1.05 },
  ],
  budgets: { 0: { budget: 2000, need: 3 } },
  sequences: { 1: ['chop', 'stir', 'season'] },
  serves: { 2: { eatSecs: 3, from: 2, guests: [
    { id: 'grandma', name: 'Grandma', order: 'Jollof, mild', dish: 'pG', x: 0, z: 4, seat: { x: 14, z: 4 }, table: { x: 14, z: 2.4 } },
    { id: 'chidi', name: 'Uncle Chidi', order: 'Jollof, extra pepper', dish: 'pC', x: 2, z: 7, seat: { x: 20, z: 4 }, table: { x: 20, z: 2.4 } },
    { id: 'bisi', name: 'Aunty Bisi', order: 'Jollof and chicken', dish: 'pB', x: -2, z: 8, seat: { x: 26, z: 4 }, table: { x: 26, z: 2.4 } },
  ] } },
  talks: { 3: [{ id: 'bisi2', name: 'Aunty Bisi', x: 34, z: 4, lines: [sayAs('Aunty Bisi', 'neighbour', 'Hmm. Interesting. Who taught you to cook? Was it me? It was not me.', 'suspicious')], rounds: [{ options: [
    { id: 'you', label: '"You did, Aunty. Every Christmas."', reply: sayAs('Aunty Bisi', 'neighbour', 'I did. I take full credit. And none of the blame.', 'happy') },
    { id: 'self', label: '"I taught myself. Mostly videos."', reply: sayAs('Aunty Bisi', 'neighbour', 'Videos? Hmm. Not bad. I have a bone to pick with the video woman.', 'cheeky') },
  ] }] }] },
  guide: [{ x: 22, z: -6, r: 16 }, { x: 20, z: 8, r: 10 }, { x: 14, z: 0, r: 12 }, { x: 34, z: 4, r: 4 }],
  crowd: [{ x: 30, z: 0, rot: 3 }],
  npcs: side, choiceLabel: 'recipe',
  endBeat: { text: 'The pots are empty, the plates are clean and three people are patting their stomachs in a way that has no words.', line: 'Grandma gets a proper welcome next.' },
  starRules: ['Finish the level', 'Finish with no overspending', 'Finish with no mistakes and no hints'],
}), ride('the market', 'Ride to the market', 'Saturday dinner for seven', [sayAs('Aunty Bisi', 'neighbour', 'Seven people! One pot! Take the car to the market and buy ingredients. And do not forget the pepper. I will know.', 'worried')], [say('helper', 'The market is loud, the sun is hot and somebody is shouting "fresh fish, fresh fish, very fresh".', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 4
export const LEVEL_C10L4 = withBus(L({
  ch: 'ch10', n: 4, title: 'Grandma\'s Welcome', next: 'ch10.l5', bounds: BIGB,
  intro: 'The family car squeaks up the drive. Grandma is already waving from the window. The little cousins burst out of the back like popcorn.',
  theme: { ground: '#bfb393', ...HOME(GRASS, [{ kind: 'awning', x: 28, z: 3, w: 12, d: 5, color: ORANGE }, { kind: 'rug', x: 28, z: 3, w: 10, d: 3, color: '#c4562a' }, { kind: 'chair', x: 24, z: 4, color: WOOD }, { kind: 'chair', x: 28, z: 4, color: WOOD }, { kind: 'chair', x: 32, z: 4, color: WOOD }, { kind: 'rug', x: 10, z: 0, w: 8, d: 3, color: BLUE }, { kind: 'sign', x: 37, z: -4, label: 'THE GATE', w: 1.8 }, { kind: 'stall', x: 14, z: -9, w: 8, d: 1.6, color: TEAL, label: 'TEA' }]) },
  furniture: [F('tea', R(10.3, 17.7, -9.8, -8.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch10.l4', 1, 'reach', 'Run to the gate', { purpose: 'The kids have flung the gate open. Dodge them and get to Grandma before she gets out.', objective: 'Run to the gate', success: 'You reach the gate in time.',
      intro: [sayAs('Mama Folake', 'folake', 'Grandma is getting out! Run! Carry her bag! Hold her arm! Do not drop her handbag, it has her glasses!', 'angry')], done: [say('player', 'Gate. Grandma. Handbag. All three intact. A small family miracle.', 'laughing')], hint: 'Dodge the children and run right to THE GATE sign.' }),
    T('ch10.l4', 2, 'talk', 'Talk with Grandma', { purpose: 'Grandma wants to know everything. Your job. Your health. Your love life. All of it.', objective: 'Talk to Grandma', success: 'Grandma has approved.',
      intro: [say('player', 'Eight months of news in eight minutes. Pick the good parts.', 'thinking')], done: [sayAs('Grandma', 'helper', 'You will do. You are a good child. Your grandfather would be proud. And a little worried.', 'happy')], hint: 'Grandma sits under the orange awning on the right.' }),
    T('ch10.l4', 3, 'serve', 'Tea and snacks', { purpose: 'Seat Grandma and the two cousins and bring each a hot drink and a biscuit.', objective: 'Seat and serve three relatives', success: 'Everyone is settled.',
      intro: [sayAs('Tobi', 'neighbour', 'Can I have the drink with lots of sugar? And the biscuit with lots of chocolate? And a second biscuit?', 'cheeky')], done: [sayAs('Grandma', 'helper', 'Hot tea. A comfortable chair. A child to fuss over. I am home.', 'happy')], hint: 'Seat each person, take their cup from the tea table and carry it over.' }),
    T('ch10.l4', 4, 'hold', 'The big hug', { purpose: 'Grandma wants a long hug. A proper one. Stand still and hug her until she lets go.', objective: 'Hug Grandma', success: 'She has let go. Eventually.',
      intro: [sayAs('Grandma', 'helper', 'Come here, my child. A proper hug. Not one of those polite ones. I will count to ten.', 'cheeky')], done: [sayAs('Grandma', 'helper', 'Ten! Good. Now I have energy for the whole weekend.', 'happy')], hint: 'Stand in the ring on the blue rug until the hug is over.' }),
  ],
  talks: { 1: [{ id: 'grandma', name: 'Grandma', x: 28, z: 1, lines: [sayAs('Grandma', 'helper', 'Now tell me. Are you eating? Are you sleeping? Are you married? No? Good. Not yet.', 'cheeky')], rounds: [{ options: [
    { id: 'work', label: '"Work is good, Grandma."', reply: sayAs('Grandma', 'helper', 'Work is good. Fine. But is work warm? Does work cook for you?', 'suspicious') },
    { id: 'happy', label: '"I am happy, Grandma. Really."', reply: sayAs('Grandma', 'helper', 'Happy is good. Happy is what I wanted. The rest is details.', 'happy') },
  ] }] }] },
  items: [
    { id: 'tG', task: 2, x: 11.4, z: -8, label: 'Take Grandma\'s tea', color: ORANGE, shape: 'cup', y: 1.1 },
    { id: 'tT', task: 2, x: 13.8, z: -8, label: 'Take Tobi\'s juice', color: GREEN, shape: 'cup', y: 1.1 },
    { id: 'tA', task: 2, x: 16.2, z: -8, label: 'Take Amara\'s biscuit', color: RUST, shape: 'snack', y: 1.1 },
  ],
  serves: { 2: { eatSecs: 3, from: 2, guests: [
    { id: 'grandma', name: 'Grandma', order: 'Hot tea', dish: 'tG', x: 28, z: 1, seat: { x: 24, z: 4 }, table: { x: 24, z: 2.4 } },
    { id: 'tobi', name: 'Tobi', order: 'Sweet juice', dish: 'tT', x: 30, z: 6, seat: { x: 28, z: 4 }, table: { x: 28, z: 2.4 } },
    { id: 'amara', name: 'Amara', order: 'Chocolate biscuit', dish: 'tA', x: 22, z: 7, seat: { x: 32, z: 4 }, table: { x: 32, z: 2.4 } },
  ] } },
  holds: { 3: { x: 10, z: 0, r: 1.2, secs: 6, pose: 'hug' } },
  goto: [RING(36, -2, 1.6), null, null, null],
  guide: [RING(36, -2, 1.6), { x: 28, z: 1, r: 6 }, { x: 14, z: -6, r: 14 }, RING(10, 0, 1.2)],
  hazards: walkers([8, 14, 22, 30], -2, 8),
  timeLimit: 16,
  crowd: [{ x: 4, z: 6, rot: 1 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 8, rot: -2.4 } }, choiceLabel: 'welcome',
  endBeat: { text: 'When she finally lets go you smell her perfume, the same one from your whole childhood, and it hits you more than you expected.', line: 'Game night is next.' },
  starRules: ['Finish the level', 'Reach the gate before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the front gate', 'Ride up the drive', 'Grandma has arrived', [sayAs('Mama Folake', 'folake', 'They are here! They are here! Do not stand there! Take the car to the front gate and greet them properly!', 'angry')], [say('helper', 'Doors open, voices shout and a small child runs straight into your knees.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 5
export const LEVEL_C10L5 = withBus(L({
  ch: 'ch10', n: 5, title: 'Game Night', next: 'ch10.l6', bounds: BIGB,
  intro: 'After dinner the table is cleared and the board games come out. In a family, games are not played for fun. They are played for honour.',
  theme: { ground: '#bfb393', ...HOME('#e0cfa8', [{ kind: 'rug', x: 20, z: 3, w: 14, d: 4, color: '#7a4a6a' }, { kind: 'chair', x: 18, z: 3, color: WOOD }, { kind: 'chair', x: 22, z: 3, color: WOOD }, { kind: 'sign', x: 8, z: -3, label: 'SHELF', w: 1.2 }, { kind: 'sign', x: 8, z: 6, label: 'SOFA', w: 1.2 }, { kind: 'sign', x: 32, z: -3, label: 'CURTAIN', w: 1.4 }]) },
  furniture: [F('table', R(15, 25, 1.4, 4.4), 0.8, WOOD), F('shelf', R(4, 12, -5, -3.6), 1.4, DARK), F('curtain', R(28, 36, -5, -3.6), 1.6, '#a05a7a'), F('sofa', R(4, 12, 7, 9), 0.8, '#6b3a1e')], ...base,
  tasks: [
    T('ch10.l5', 1, 'choose', 'Pick the game', { purpose: 'Ludo, whot or scrabble. Everybody wants a different one and everybody is stubborn.', objective: 'Choose a game', success: 'You choose.',
      intro: [sayAs('Uncle Chidi', 'helper', 'Ludo. Whot. Scrabble. I only play games I win. Pick wisely or pick something else.', 'cheeky')], done: [say('player', 'Decision made. May the dice be kind.', 'worried')], hint: 'Three signs on the rug: ludo, whot or scrabble.' }),
    T('ch10.l5', 2, 'hold', 'Play the game', { purpose: 'Sit at the table and play. Roll, move, groan and cheer.', objective: 'Sit and play the game', success: 'The game is over.',
      intro: [sayAs('Tobi', 'neighbour', 'I am going to win. I have already won. I won in my head. The game is only a formality.', 'cheeky')], done: [sayAs('Uncle Chidi', 'helper', 'A very good game. I lost. For the first time since 1998. Do not tell anyone.', 'worried')], hint: 'Stand in the ring at the table until the game ends.' }),
    T('ch10.l5', 3, 'talk', 'Argue about the rules', { purpose: 'Uncle Chidi says the rules are different in his house. Settle it peacefully.', objective: 'Talk to Uncle Chidi', success: 'The argument is settled.',
      intro: [say('player', 'This is how family wars start. A small rule. A tiny disagreement. A very large uncle.', 'worried')], done: [sayAs('Uncle Chidi', 'helper', 'Fine. Your house. Your rules. But I will remember this at Christmas.', 'cheeky')], hint: 'Uncle Chidi sits on the sofa on the left.' }),
    T('ch10.l5', 4, 'find', 'Hide and seek', { purpose: 'Tobi has hidden. He always hides in the same three spots and always claims it was a different one.', objective: 'Find Tobi', success: 'You find him.',
      intro: [sayAs('Amara', 'neighbour', 'Count to twenty! Slowly! Do not peek! Tobi is a very good hider. He is also a very bad hider.', 'cheeky')], done: [sayAs('Tobi', 'neighbour', 'You found me! How! I was invisible! I did a good job! You cheated!', 'angry')], hint: 'Check the shelf, the sofa and the curtain.' }),
  ],
  items: [
    { id: 'ludo', task: 0, x: 8, z: 2, label: 'Play ludo', color: RED, shape: 'sign', y: 0 },
    { id: 'whot', task: 0, x: 20, z: 7, label: 'Play whot', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'scrabble', task: 0, x: 32, z: 2, label: 'Play scrabble', color: BLUE, shape: 'sign', y: 0 },
  ],
  holds: { 1: { x: 20, z: 5.4, r: 1.2, secs: 6, pose: 'sit' } },
  talks: { 2: [{ id: 'chidi', name: 'Uncle Chidi', x: 10, z: 5.6, lines: [sayAs('Uncle Chidi', 'helper', 'In my house, a six gives you an extra turn. Everyone knows that. Everyone.', 'suspicious')], rounds: [{ options: [
    { id: 'house', label: '"Okay, your rules tonight."', reply: sayAs('Uncle Chidi', 'helper', 'A wise young person. Wiser than your cousin. Who is a chronic cheat.', 'happy') },
    { id: 'book', label: '"The rule book says no extra turn."', reply: sayAs('Uncle Chidi', 'helper', 'The book was written by a man who never won a game. Ignore the book.', 'cheeky') },
  ] }] }] },
  spots: [
    { id: 'shelf', task: 3, x: 8, z: -2.2, label: 'Check behind the shelf', wrong: say('helper', 'Dust and a very old sock. Not Tobi.', 'cheeky') },
    { id: 'sofa', task: 3, x: 8, z: 6.2, label: 'Check behind the sofa', wrong: say('player', 'A cushion with legs. Not Tobi. Just a cushion.', 'tired') },
    { id: 'curtain', task: 3, x: 32, z: -2.2, label: 'Check behind the curtain', right: true },
  ],
  guide: [{ x: 20, z: 5, r: 14 }, RING(20, 5.4, 1.2), { x: 10, z: 5.6, r: 4 }, { x: 20, z: 0, r: 18 }],
  crowd: [{ x: 30, z: 7, rot: -2 }],
  npcs: side, choiceLabel: 'game',
  endBeat: { text: 'The dice are scattered, the board is crooked and three generations are laughing at the same joke for different reasons.', line: 'Uncle Chidi has a problem next.' },
  starRules: ['Finish the level', 'Finish with no wrong hiding spots', 'Finish with no mistakes and no hints'],
}), ride('the living room', 'Ride to the living room', 'After dinner comes game night', [sayAs('Tobi', 'neighbour', 'Game night! Game night! Game night! Take me! I will win! Everyone else will lose!', 'happy')], [say('helper', 'The family car goes quiet and the front door opens. Inside, the lights are low and the cards are out.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 6
export const LEVEL_C10L6 = withBus(L({
  ch: 'ch10', n: 6, title: 'The Broken TV', next: 'ch10.l7', bounds: BIGB,
  intro: 'Sunday morning and the one thing that cannot go wrong has gone wrong. The TV is black, the football starts in twenty minutes and Uncle Chidi is staring at you like a doctor at an X-ray.',
  theme: { ground: '#bfb393', ...HOME('#e0cfa8', [{ kind: 'rug', x: 20, z: 2, w: 12, d: 3, color: '#3a5a6a' }, { kind: 'sign', x: 37, z: 2, label: 'SHOP', w: 1.4 }, { kind: 'sign', x: 8, z: -3, label: 'DRAWER', w: 1.4 }, { kind: 'sign', x: 20, z: -3, label: 'SHELF', w: 1.4 }, { kind: 'sign', x: 32, z: -3, label: 'BASKET', w: 1.4 }]) },
  furniture: [F('tv', R(16, 24, -8, -6.6), 1.4, DARK), F('d', R(6, 10, -4.4, -3.4), 0.9, WOOD), F('s', R(18, 22, -4.4, -3.4), 0.9, WOOD), F('b', R(30, 34, -4.4, -3.4), 0.9, WOOD)], ...base,
  tasks: [
    T('ch10.l6', 1, 'find', 'Find the remote', { purpose: 'The remote is in one of three places. It is never where you last left it.', objective: 'Find the remote', success: 'You find it.',
      intro: [sayAs('Uncle Chidi', 'helper', 'The remote! Where is the remote? I put it down. Somebody moved it. The family is full of thieves.', 'angry')], done: [say('player', 'In the basket. Between a sock and a banana. Of course.', 'tired')], hint: 'Check the drawer, the shelf and the basket.' }),
    T('ch10.l6', 2, 'sequence', 'Fix the TV', { purpose: 'Plug in the cable, raise the aerial and press the power button. Do it in this order or the picture goes funny.', objective: 'Plug, aerial, then power', success: 'The TV is on.',
      intro: [sayAs('Uncle Chidi', 'helper', 'Cable. Aerial. Power. In that order. I have been fixing TVs since before you were born.', 'cheeky')], done: [say('player', 'Picture. Sound. Football. A miracle in the front room.', 'proud')], hint: 'Order at the TV: cable, aerial, power.' }),
    T('ch10.l6', 3, 'talk', 'Take the credit', { purpose: 'Uncle Chidi insists it was his idea. Let him enjoy it. Gently.', objective: 'Talk to Uncle Chidi', success: 'He is happy.',
      intro: [say('player', 'Say nothing too clever. Let the man win. It is only a TV.', 'cheeky')], done: [sayAs('Uncle Chidi', 'helper', 'See? I told you. Years of experience. It is all in the wrist.', 'happy')], hint: 'Uncle Chidi stands next to the TV.' }),
    T('ch10.l6', 4, 'reach', 'Run for batteries', { purpose: 'The remote is dead. Run to the shop and bring batteries before kick-off.', objective: 'Run to the shop', success: 'You reach the shop in time.',
      intro: [sayAs('Uncle Chidi', 'helper', 'Batteries! The remote is dead! Go to the shop! Run! The match starts in ten minutes!', 'angry')], done: [say('player', 'Batteries. Two. The cheap ones. Hopefully they last until half-time.', 'laughing')], hint: 'Cross behind the shoppers and run right to the SHOP sign.' }),
  ],
  spots: [
    { id: 'drawer', task: 0, x: 8, z: -2.2, label: 'Check the drawer', wrong: say('helper', 'Cables, a tape measure and six single socks. Not this one.', 'cheeky') },
    { id: 'shelf', task: 0, x: 20, z: -2.2, label: 'Check the shelf', wrong: say('player', 'Old magazines and a photo of Uncle Chidi in the nineties. Not this one.', 'tired') },
    { id: 'basket', task: 0, x: 32, z: -2.2, label: 'Check the basket', right: true },
  ],
  items: [
    { id: 'cable', task: 1, x: 16, z: -5.6, label: 'Plug in the cable', color: '#1c1b22', shape: 'box', y: 0.3, act: 'pickLow' },
    { id: 'aerial', task: 1, x: 20, z: -5.6, label: 'Raise the aerial', color: '#8a8a92', shape: 'ladder', y: 1.6, act: 'reachHigh' },
    { id: 'power', task: 1, x: 24, z: -5.6, label: 'Press the power button', color: RED, shape: 'stamp', y: 1.0, act: 'stamp' },
  ],
  sequences: { 1: ['cable', 'aerial', 'power'] },
  talks: { 2: [{ id: 'chidi', name: 'Uncle Chidi', x: 20, z: -3.4, lines: [sayAs('Uncle Chidi', 'helper', 'It was a loose cable. I knew it. I said it. I said it the whole time.', 'cheeky')], rounds: [{ options: [
    { id: 'expert', label: '"You are the expert, Uncle."', reply: sayAs('Uncle Chidi', 'helper', 'Finally, somebody who sees it. The others have no respect.', 'happy') },
    { id: 'thanks', label: '"Thanks for the help."', reply: sayAs('Uncle Chidi', 'helper', 'Help? I did it all. But accepted. Sit down. The match is on.', 'cheeky') },
  ] }] }] },
  goto: [null, null, null, RING(36, 4, 1.6)],
  guide: [{ x: 20, z: -2.2, r: 14 }, { x: 20, z: -5.6, r: 8 }, { x: 20, z: -3.4, r: 4 }, RING(36, 4, 1.6)],
  hazards: walkers([8, 14, 22, 28], -2, 8),
  timeLimit: 16,
  crowd: [{ x: 6, z: 6, rot: 1 }],
  npcs: side, choiceLabel: 'fix',
  endBeat: { text: 'Green pitch, loud crowd and Uncle Chidi shouting at a referee two thousand kilometres away. The family has never been happier.', line: 'The cousins are next.' },
  starRules: ['Finish the level', 'Reach the shop before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the living room', 'Ride to the flat', 'The match starts at ten', [sayAs('Uncle Chidi', 'helper', 'Quickly! The match is in twenty minutes! The TV is broken! The remote is missing! The universe hates me!', 'angry')], [say('helper', 'The car pulls up. Through the window you can see a man glaring at a black screen like it owes him money.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 7
export const LEVEL_C10L7 = withBus(L({
  ch: 'ch10', n: 7, title: 'The Cousins', next: 'ch10.l8', bounds: BIGB,
  intro: 'Tobi and Amara have eaten four biscuits each, drunk a litre of juice and now run in circles. Your job is to catch them, calm them and put them to bed. Good luck.',
  theme: { ground: '#9aa88a', ...HOME(GRASS, [{ kind: 'awning', x: 20, z: 3, w: 14, d: 5, color: TEAL }, { kind: 'rug', x: 20, z: 3, w: 12, d: 3, color: '#2a7d72' }, { kind: 'chair', x: 15, z: 4, color: WOOD }, { kind: 'chair', x: 20, z: 4, color: WOOD }, { kind: 'chair', x: 25, z: 4, color: WOOD }, { kind: 'stall', x: 20, z: -9, w: 8, d: 1.6, color: YELLOW, label: 'JUICE' }, { kind: 'sign', x: 37, z: 6, label: 'BEDROOM', w: 1.8 }, { kind: 'sign', x: 8, z: 6, label: 'STORY', w: 1.4 }]) },
  furniture: [F('juice', R(16.3, 23.7, -9.8, -8.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch10.l7', 1, 'reach', 'Catch the runaway', { purpose: 'Tobi has grabbed your phone and is running across the garden. Dodge the toys and get to the fence.', objective: 'Run to the fence', success: 'You catch him.',
      intro: [sayAs('Amara', 'neighbour', 'Tobi took your phone! He is running! He is very fast! He is also very sticky!', 'worried')], done: [say('player', 'Phone recovered. Child recovered. Sanity still missing.', 'laughing')], hint: 'Cross behind the toys and run right to the fence at the right.' }),
    T('ch10.l7', 2, 'collect', 'Pick up the toys', { purpose: 'A trail of toys leads across the garden. Pick up the ball, the doll and the little truck.', objective: 'Collect a ball, a doll and a truck', success: 'The garden is clear.',
      intro: [sayAs('Aunty Bisi', 'neighbour', 'Ball, doll, truck. Do not step on the truck. Last year somebody stepped on the truck. We do not talk about it.', 'cheeky')], done: [say('player', 'Ball, doll, truck. A very good haul. And no casualties.', 'proud')], hint: 'Pick up the three toys scattered around the garden.' }),
    T('ch10.l7', 3, 'serve', 'Juice time', { purpose: 'Seat the cousins and a little neighbour and bring each a cup of juice.', objective: 'Seat and serve three kids', success: 'Everyone is sitting.',
      intro: [sayAs('Tobi', 'neighbour', 'Orange juice! Orange! Not mango! Not apple! Not water! Orange!', 'angry')], done: [sayAs('Amara', 'neighbour', 'Perfect. A sitting child is a calm child. Do not ever let us stand again.', 'cheeky')], hint: 'Seat each child, take their cup from the stall and carry it over.' }),
    T('ch10.l7', 4, 'choose', 'Bedtime story', { purpose: 'Three stories. A tortoise, a lion or a spider. The children will not agree. Pick one.', objective: 'Choose a story', success: 'You choose.',
      intro: [sayAs('Amara', 'neighbour', 'Tortoise! No, lion! No, spider! Pick one and we will pretend we chose it.', 'cheeky')], done: [say('player', 'Decision made. May they sleep before I do.', 'tired')], hint: 'Three signs on the rug: tortoise, lion or spider.' }),
  ],
  items: [
    { id: 'ball', task: 1, x: 6, z: 8, label: 'Pick up the ball', color: RED, shape: 'box', y: 0.2, act: 'pickLow' },
    { id: 'doll', task: 1, x: 18, z: 9, label: 'Pick up the doll', color: '#e0a8b8', shape: 'bag', y: 0.2, act: 'pickLow' },
    { id: 'truck', task: 1, x: 32, z: 8, label: 'Pick up the truck', color: YELLOW, shape: 'box', y: 0.2, act: 'pickLow' },
    { id: 'jT', task: 2, x: 17.4, z: -8, label: 'Take Tobi\'s juice', color: ORANGE, shape: 'cup', y: 1.1 },
    { id: 'jA', task: 2, x: 20, z: -8, label: 'Take Amara\'s juice', color: ORANGE, shape: 'cup', y: 1.1 },
    { id: 'jN', task: 2, x: 22.6, z: -8, label: 'Take the neighbour\'s juice', color: GREEN, shape: 'cup', y: 1.1 },
    { id: 'tort', task: 3, x: 8, z: 7.6, label: 'Tell the tortoise story', color: GREEN, shape: 'sign', y: 0 },
    { id: 'lion', task: 3, x: 20, z: 7.6, label: 'Tell the lion story', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'spider', task: 3, x: 32, z: 7.6, label: 'Tell the spider story', color: BLUE, shape: 'sign', y: 0 },
  ],
  serves: { 2: { eatSecs: 3, from: 2, guests: [
    { id: 'tobi', name: 'Tobi', order: 'Orange juice', dish: 'jT', x: 6, z: 4, seat: { x: 15, z: 4 }, table: { x: 15, z: 2.4 } },
    { id: 'amara', name: 'Amara', order: 'Orange juice', dish: 'jA', x: 8, z: 8, seat: { x: 20, z: 4 }, table: { x: 20, z: 2.4 } },
    { id: 'neigh', name: 'Little Zainab', order: 'Apple juice', dish: 'jN', x: 4, z: 8, seat: { x: 25, z: 4 }, table: { x: 25, z: 2.4 } },
  ] } },
  goto: [RING(36, 2, 1.6), null, null, null],
  guide: [RING(36, 2, 1.6), { x: 18, z: 8, r: 18 }, { x: 20, z: -6, r: 14 }, { x: 20, z: 7.6, r: 14 }],
  hazards: walkers([8, 14, 22, 28], -3, 7),
  timeLimit: 16,
  crowd: [{ x: 30, z: 6, rot: -2 }],
  npcs: side, choiceLabel: 'story',
  endBeat: { text: 'By the third paragraph both cousins are asleep, one with his mouth open and the other with her fist around your thumb.', line: 'Sunday morning is next.' },
  starRules: ['Finish the level', 'Reach the fence before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the garden', 'Ride to the garden', 'The cousins are loose', [sayAs('Aunty Bisi', 'neighbour', 'The children are in the garden. Both of them. And a stolen phone. Hurry!', 'worried')], [say('helper', 'The car stops in the drive. A football flies over the fence and hits the bonnet with a polite thud.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 8
const hall = B('hall', 8, 32, -12, -7, '#f0e4c8', 'CHURCH HALL', 3.8)
export const LEVEL_C10L8 = withBus(L({
  ch: 'ch10', n: 8, title: 'Sunday Service', next: 'ch10.l9', bounds: BIGB,
  intro: 'Sunday morning. Everyone in their best clothes, Grandma in her good wrapper and a service that is three hours long and shorter than it feels.',
  theme: { ground: '#bfb393', ...HOME('#e8dcc0', [...hall.d, { kind: 'rug', x: 20, z: 3, w: 12, d: 3, color: '#7a4a6a' }, { kind: 'chair', x: 20, z: 3, color: DARK }, { kind: 'rug', x: 28, z: 7, w: 10, d: 2, color: '#d6c8a0' }, { kind: 'sign', x: 37, z: 2, label: 'HALL', w: 1.4 }]) },
  furniture: [hall.f, F('pews', R(10, 30, 7.2, 8.6), 0.8, WOOD)], ...base,
  tasks: [
    T('ch10.l8', 1, 'talk', 'Greet the neighbours', { purpose: 'Three neighbours want to see the family. Say hello to Mama Efe, Mr Kalu and Deaconess Ayo.', objective: 'Talk to Mama Efe, Mr Kalu and Deaconess Ayo', success: 'You have greeted everyone.',
      intro: [sayAs('Grandma', 'helper', 'Greet properly. Smile. And do not say "fine" when they ask how you are. Say "by God\'s grace".', 'cheeky')], done: [say('player', 'Three neighbours, three handshakes and one prophecy about my wedding. Efficient.', 'laughing')], hint: 'Mama Efe, Mr Kalu and Deaconess Ayo stand on the path near the hall.' }),
    T('ch10.l8', 2, 'hold', 'Sit through the sermon', { purpose: 'Sit in the pew and listen. Do not fidget, do not yawn and do not look at your phone.', objective: 'Sit and listen to the sermon', success: 'The sermon is over.',
      intro: [sayAs('Pastor Dele', 'helper', 'Brethren, today we speak about family. I will be brief. I have a lot to say.', 'calm')], done: [sayAs('Pastor Dele', 'helper', 'And so, in conclusion. Which I have been approaching for some time. Amen.', 'cheeky')], hint: 'Stand in the ring on the purple rug until the sermon ends.' }),
    T('ch10.l8', 3, 'sequence', 'The family photo', { purpose: 'Elders in the middle, kids in front, you at the back. Place everyone in that order or Grandma will make you start again.', objective: 'Elders, kids, then yourself', success: 'The photo is taken.',
      intro: [sayAs('Aunty Bisi', 'neighbour', 'Elders first. Children second. You last. If you go first, Grandma will take the camera and the day will be over.', 'cheeky')], done: [say('player', 'Click. Seventeen people, one frame. Somebody blinked. Everybody blamed Tobi.', 'laughing')], hint: 'Order on the rug: elders, kids, then you.' }),
    T('ch10.l8', 4, 'goto', 'Walk to the hall', { purpose: 'After the service the whole family walks to the church hall for the lunch.', objective: 'Walk to the hall', success: 'You reach the hall.',
      intro: [sayAs('Grandma', 'helper', 'Let us walk. Slowly. Together. As a family. With nobody running ahead. TOBI.', 'angry')], done: [say('player', 'The hall. The rice. The silence that follows a very full sermon. Perfect.', 'happy')], hint: 'Follow the ring to the HALL sign.' }),
  ],
  talks: { 0: [
    { id: 'efe', name: 'Mama Efe', x: 6, z: 2, lines: [sayAs('Mama Efe', 'neighbour', 'My dear! Look at you! You have grown taller. Or I have shrunk. Either way, God is good.', 'happy')], rounds: [{ options: [
      { id: 'grace', label: '"By God\'s grace, Mama."', reply: sayAs('Mama Efe', 'neighbour', 'That is the answer! A good child. You may eat at my house any Sunday.', 'happy') },
      { id: 'fine', label: '"I am fine, thank you."', reply: sayAs('Mama Efe', 'neighbour', 'Fine? Only fine? Say it with joy next time. God is listening.', 'cheeky') },
    ] }] },
    { id: 'kalu', name: 'Mr Kalu', x: 14, z: 2, lines: [sayAs('Mr Kalu', 'helper', 'Your grandmother is a legend. She prayed for my tomatoes in 1996. They are still alive.', 'cheeky')] },
    { id: 'ayo', name: 'Deaconess Ayo', x: 22, z: 2, lines: [sayAs('Deaconess Ayo', 'neighbour', 'You have not been to church in three months. I counted. I count everyone.', 'suspicious')] },
  ] },
  items: [
    { id: 'elders', task: 2, x: 16, z: 7, label: 'Place the elders in the middle', color: ORANGE, shape: 'sign', y: 0, act: 'lean' },
    { id: 'kids', task: 2, x: 21, z: 7, label: 'Place the kids in front', color: GREEN, shape: 'sign', y: 0, act: 'lean' },
    { id: 'you', task: 2, x: 26, z: 7, label: 'Stand at the back yourself', color: BLUE, shape: 'sign', y: 0, act: 'lean' },
  ],
  sequences: { 2: ['elders', 'kids', 'you'] },
  holds: { 1: { x: 20, z: 3, r: 1.0, secs: 7, pose: 'sit' } },
  goto: [null, null, null, RING(36, 2, 1.6)],
  guide: [{ x: 14, z: 2, r: 14 }, RING(20, 3, 1.0), { x: 21, z: 7, r: 8 }, RING(36, 2, 1.6)],
  crowd: [{ x: 8, z: 6, rot: 1 }, { x: 30, z: 4, rot: -2 }],
  npcs: side, choiceLabel: 'service',
  endBeat: { text: 'The choir hits the final note, the doors open and a hundred people file out into the sun holding hands and hymnals.', line: 'One last dinner is waiting.' },
  starRules: ['Finish the level', 'Finish with no wrong order', 'Finish with no mistakes and no hints'],
}), ride('the church', 'Ride to church', 'Service starts at nine', [sayAs('Grandma', 'helper', 'Church! Nine o\'clock! Not nine-fifteen! Not "I am on my way". Nine. Take the car and drive carefully.', 'angry')], [say('helper', 'The car joins a long line of other cars, all carrying people in their best clothes and worst moods.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 9
export const LEVEL_C10L9 = withBus(L({
  ch: 'ch10', n: 9, title: 'The Last Dinner', next: null, badge: 'Family Weekend', bounds: BIGB,
  intro: 'Sunday evening. The bags are packed, the cooler is full and everybody is pretending the weekend is not over. One more dinner. One more table. One more speech.',
  theme: { ground: '#bfb393', ...HOME('#e8dcc0', [{ kind: 'awning', x: 14, z: 3, w: 12, d: 5, color: ORANGE }, { kind: 'rug', x: 14, z: 3, w: 10, d: 3, color: '#c4562a' }, { kind: 'chair', x: 10, z: 4, color: WOOD }, { kind: 'chair', x: 14, z: 4, color: WOOD }, { kind: 'chair', x: 18, z: 4, color: WOOD }, { kind: 'rug', x: 30, z: 0, w: 8, d: 3, color: BLUE }, { kind: 'sign', x: 37, z: -4, label: 'THE GATE', w: 1.8 }]) },
  furniture: [F('buffet', R(8, 20, -8.6, -7.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch10.l9', 1, 'serve', 'Serve the last dinner', { purpose: 'Seat Grandma, Uncle Chidi and Aunty Bisi under the awning and bring each their favourite.', objective: 'Seat and serve three relatives', success: 'The last dinner is on.',
      intro: [sayAs('Mama Folake', 'folake', 'One more dinner. Serve everyone. Sit last. A good host sits last. I will tell you why when you are older.', 'happy')], done: [sayAs('Uncle Chidi', 'helper', 'This was a very good weekend. I will say so exactly once. Now. Done.', 'cheeky')], hint: 'Seat each relative, take their plate from the buffet and carry it over.' }),
    T('ch10.l9', 2, 'talk', 'The speeches', { purpose: 'Everybody wants to say a few words. Listen to Grandma, Uncle Chidi and Aunty Bisi.', objective: 'Talk to Grandma, Uncle Chidi and Aunty Bisi', success: 'Everyone has spoken.',
      intro: [say('player', 'Three speeches. One of them will be thirty minutes long. I will not say which.', 'worried')], done: [say('player', 'Grandma cried, Uncle Chidi sniffed and Aunty Bisi said it was the pepper. We all knew.', 'laughing')], hint: 'Grandma, Uncle Chidi and Aunty Bisi stand near the awning.' }),
    T('ch10.l9', 3, 'hold', 'One last dance', { purpose: 'Somebody puts on the old song. Everyone gets up. You dance with Grandma until the music stops.', objective: 'Dance until the song ends', success: 'The song is over.',
      intro: [sayAs('Grandma', 'helper', 'This is the song from your grandfather\'s wedding. Get up. Everyone. Even the grumpy one.', 'happy')], done: [sayAs('Grandma', 'helper', 'I am out of breath. And in love with all of you. Do not spoil it.', 'happy')], hint: 'Stand in the ring on the blue rug until the song ends.' }),
    T('ch10.l9', 4, 'goto', 'Wave them off', { purpose: 'The car is loaded, the engine is on and they are waiting at the gate. Walk them out.', objective: 'Walk to the gate', success: 'You are at the gate.',
      intro: [sayAs('Mama Folake', 'folake', 'Walk them to the gate. Wave until you cannot see them. Cry later. In the kitchen. Where nobody sees.', 'happy')], done: [say('player', 'Goodbye. See you at Christmas. Or earlier. Or whenever the pot is empty.', 'happy')], hint: 'The gate is at the top right.' }),
  ],
  items: [
    { id: 'dG', task: 0, x: 9.4, z: -7.8, label: 'Take Grandma\'s stew', color: RUST, shape: 'plate', y: 1.1 },
    { id: 'dC', task: 0, x: 13.6, z: -7.8, label: 'Take Uncle Chidi\'s rice', color: ORANGE, shape: 'plate', y: 1.1 },
    { id: 'dB', task: 0, x: 17.8, z: -7.8, label: 'Take Aunty Bisi\'s cake', color: '#e0457b', shape: 'cake', y: 1.1 },
  ],
  serves: { 0: { eatSecs: 3, from: 0, guests: [
    { id: 'grandma', name: 'Grandma', order: 'Stew, mild', dish: 'dG', x: 4, z: 6, seat: { x: 10, z: 4 }, table: { x: 10, z: 2.4 } },
    { id: 'chidi', name: 'Uncle Chidi', order: 'Rice, extra pepper', dish: 'dC', x: 8, z: 8, seat: { x: 14, z: 4 }, table: { x: 14, z: 2.4 } },
    { id: 'bisi', name: 'Aunty Bisi', order: 'Cake, a small slice', dish: 'dB', x: 2, z: 8, seat: { x: 18, z: 4 }, table: { x: 18, z: 2.4 } },
  ] } },
  talks: { 1: [
    { id: 'grandma', name: 'Grandma', x: 4, z: -2, lines: [sayAs('Grandma', 'helper', 'I came to see if you were all right. You are. You are very all right. Now come here.', 'happy')], rounds: [{ options: [
      { id: 'thank', label: '"Thank you for everything, Grandma."', reply: sayAs('Grandma', 'helper', 'Do not thank me. Cook for me at Christmas. That is the thanks.', 'happy') },
      { id: 'visit', label: '"I will visit you soon, I promise."', reply: sayAs('Grandma', 'helper', 'Soon is a word that is stretched. But I will hold you to it. With a stick.', 'cheeky') },
    ] }] },
    { id: 'chidi', name: 'Uncle Chidi', x: 12, z: -2, lines: [sayAs('Uncle Chidi', 'helper', 'You are a good one. A stubborn one. But a good one. I will not say it twice.', 'calm')] },
    { id: 'bisi', name: 'Aunty Bisi', x: 20, z: -2, lines: [sayAs('Aunty Bisi', 'neighbour', 'Your cooking has improved. Do not tell your mother I said so. She will gloat.', 'cheeky')] },
  ] },
  holds: { 2: { x: 30, z: 0, r: 1.2, secs: 7, pose: 'dance' } },
  goto: [null, null, null, RING(36, -2, 1.6)],
  guide: [{ x: 14, z: 2, r: 10 }, { x: 12, z: -2, r: 14 }, RING(30, 0, 1.2), RING(36, -2, 1.6)],
  crowd: [{ x: 26, z: 5, rot: -2 }, { x: 34, z: 4, rot: -2 }],
  npcs: { folake: { x: 38, z: 8, rot: -2.4 }, tunde: { x: 34, z: 9, rot: -2.4 } }, choiceLabel: 'farewell',
  endBeat: { text: 'The car pulls away, brake lights glowing, three hands waving from the windows. Then it turns the corner and the street is quiet. You are not sad. You are full.', line: 'Chapter 10 is done. That is the whole story.' },
  starRules: ['Finish the level', 'Finish with no wrong plate', 'Finish with no mistakes and no hints'],
}), ride('home', 'Ride home', 'The last dinner of the weekend', [sayAs('Mama Folake', 'folake', 'Last dinner. Everyone is coming. Everyone is hungry. Everyone is sad. Cook with love.', 'happy')], [say('helper', 'The family car rolls home through streets that smell of woodsmoke and frying plantain.', 'happy')]))
void RED; void TEAL; void YELLOW; void BLUE; void RUST; void ORANGE; void DARK; void CREAM
