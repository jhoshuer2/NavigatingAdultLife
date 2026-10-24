// Chapter 1 levels 2 to 9: "First week in the city". Level 1 (the morning disaster at home) is the prologue; from here the player leaves the village,
// finds a flat, meets the neighbours, shops at the market, cooks a first dinner, hunts for a job, interviews and gets paid. Each level is a different place
// with a different mix of tasks (see tests/chapter1.test.ts: no two levels share the same ordered list of task kinds).
import type { Deco, Furn, Rect } from './schema'
import { L, T, R, F, say, sayAs, D, WOOD, DARK, STREET_BOUNDS, withStreet } from './chapter1b'

export const GREEN = '#2f5a3a', ORANGE = '#e07a1f', YELLOW = '#f5b91c', RUST = '#c4562a', BLUE = '#2b6ad0', CREAM = '#f3e7cf'
export const RING = (x: number, z: number, r = 1.6) => ({ x, z, r })
/** a building: a solid block (it blocks walking), windows on its front and a sign over the door */
export const B = (name: string, x0: number, x1: number, z0: number, z1: number, color: string, label: string, h = 3.4): { f: Furn; d: Deco[] } => {
  const cx = (x0 + x1) / 2, w = x1 - x0
  return { f: F(name, R(x0, x1, z0, z1), h, color), d: [{ kind: 'window', x: cx - w * 0.28, z: z1 + 0.06, w: Math.min(2.4, w * 0.25), h: 1.1 }, { kind: 'window', x: cx + w * 0.28, z: z1 + 0.06, w: Math.min(2.4, w * 0.25), h: 1.1 }, { kind: 'sign', x: cx, z: z1 + 0.5, label, w: Math.min(3, w * 0.4) }] }
}
export const TREES = (xs: [number, number][]): Deco[] => xs.map(([x, z]) => ({ kind: 'tree' as const, x, z }))
export const LAMPS = (xs: [number, number][]): Deco[] => xs.map(([x, z]) => ({ kind: 'lamp' as const, x, z }))
const BIG = R(-34, 30, -12, 12)

// ---------------------------------------------------------------------------------------------------------------- Level 2
const stationOffice = B('tickets', -6, 2, -9, -5.5, '#e8c9a0', 'TICKETS'), lostProp = B('lostprop', 6, 9.5, -9, -6.5, '#d9b98a', 'LOST PROPERTY', 2.4)
export const LEVEL_C1L2 = L({
  n: 2, title: 'The Journey', next: 'ch1.l3', bounds: R(-34, 30, -12, 12),
  intro: 'Mama and Baba wave you off at the village stop. The bus to the city is old, loud and full of other people\'s chickens. Your bag has everything you own in it.',
  theme: withStreet({ ground: '#c9b48a', floors: [{ x0: -12.4, x1: 30, z0: -9.5, z1: 8, color: '#d9cdb0' }], deco: [
    ...stationOffice.d, ...lostProp.d, { kind: 'wall', x: 8.8, z: -12.4, w: 70, d: 2, h: 3.2, color: CREAM }, { kind: 'sign', x: 28, z: 0, label: 'CITY CENTRE', w: 2.2 }, { kind: 'sign', x: 22, z: 6.2, label: 'TAXI', w: 1.4 },
    { kind: 'chair', x: 0, z: 5.5, color: WOOD }, ...TREES([[-8, -8], [16, -8], [26, 7]]), ...LAMPS([[4, 6.5], [-8, 4], [18, 0]]),
  ] }),
  furniture: [stationOffice.f, lostProp.f, F('bench', R(-2, 2, 6, 7), 0.6, DARK), F('kiosk', R(12, 15, 4, 6.5), 1.6, GREEN)],
  spawn: { x: -32, z: 0.4 }, resume: { x: -10, z: 0 },
  tasks: [
    T(2, 1, 'ride', 'Take the bus to the city', { purpose: 'Leave the village: wait at the stop, board the bus and ride into the city.', objective: 'Take the bus to the city', success: 'You get off at the city bus station.',
      intro: [say('folake', 'Go well, my child. Call us when you arrive. Do not give your bag to anyone. Not even a nice anyone.', 'worried'), say('tunde', 'The bus stop is just there. Go and make us proud.', 'proud')], done: [say('player', 'So this is the city. It is very tall. And very loud.', 'surprised')], hint: 'Walk to the BUS STOP sign, wait for the yellow bus and tap Board the bus.' }),
    T(2, 2, 'find', 'Find your lost bag', { purpose: 'Your bag was left on the bus. Look in the likely places.', objective: 'Find your lost bag', success: 'You find your bag at Lost Property.',
      intro: [say('player', 'My bag! It was right here. It was right... on the bus. The bus has left.', 'worried')], done: [say('helper', 'A good thing it was handed in. This city is not as bad as they say.', 'cheeky')], hint: 'Ask at the LOST PROPERTY window at the top of the station.' }),
    T(2, 3, 'talk', 'Meet Aunty Ngozi', { purpose: 'Your aunt is meeting you at the station: say hello, then sort out a ride to her place.', objective: 'Talk to your aunt and the taxi driver', success: 'You have said hello and agreed a ride.',
      intro: [say('player', 'Aunty said she would wait by the exit. In a green wrapper.', 'thinking')], done: [say('player', 'Taxi. Aunty. Bag. City. We are doing this.', 'happy')], hint: 'Aunty Ngozi is by the CITY CENTRE exit. The taxi driver is by the TAXI sign.' }),
    T(2, 4, 'goto', 'Get to the taxi', { purpose: 'Follow your aunt across the station to the car.', objective: 'Walk to the taxi', success: 'You reach the taxi.',
      intro: [sayAs('Aunty Ngozi', 'neighbour', 'Come, come. The car is at the end. Mind the bags, mind the pigeons.', 'happy')], done: [sayAs('Aunty Ngozi', 'neighbour', 'Tomorrow we find you a flat. Tonight, you eat.', 'happy')], hint: 'Follow the ring to the taxi on the right.' }),
  ],
  spots: [
    { id: 'bench', task: 1, x: 0, z: 4.6, label: 'Check the bench', wrong: say('player', 'A newspaper and some pigeon feathers. Not my bag.', 'tired') },
    { id: 'kiosk', task: 1, x: 13.6, z: 3.0, label: 'Ask at the kiosk', wrong: say('helper', 'The kiosk man says he sells snacks, not bags. He also sells opinions.', 'cheeky') },
    { id: 'lost', task: 1, x: 7.7, z: -5.2, label: 'Ask at Lost Property', right: true },
  ],
  rides: { 0: { stop: { x: -30, z: 1.8 }, busZ: 4.4, from: 'the village', to: 'the city' } },
  talks: { 2: [
    { id: 'ngozi', name: 'Aunty Ngozi', x: 23, z: -1.4, lines: [sayAs('Aunty Ngozi', 'neighbour', 'There you are! You have grown. You have also lost your bag, I hear.', 'happy')], rounds: [{ options: [
      { id: 'tired', label: '"I am tired but so happy to be here."', reply: sayAs('Aunty Ngozi', 'neighbour', 'Rest tonight. The city starts tomorrow.', 'calm') },
      { id: 'excited', label: '"I cannot wait to see everything!"', reply: sayAs('Aunty Ngozi', 'neighbour', 'Slowly, slowly. The city will still be here.', 'cheeky') },
      { id: 'lost', label: '"I almost got lost already."', reply: sayAs('Aunty Ngozi', 'neighbour', 'Everyone does. It is how you learn the road.', 'happy') },
    ] }] },
    { id: 'bello', name: 'Mr Bello', x: 22.5, z: 3.4, lines: [sayAs('Mr Bello', 'helper', 'Taxi? Taxi! Very cheap. Very very cheap. Only a little expensive.', 'cheeky')], rounds: [{ options: [
      { id: 'bargain', label: '"Let me bargain. Half the price."', reply: sayAs('Mr Bello', 'helper', 'Half?! You will kill me. Okay, a little less than full.', 'worried') },
      { id: 'accept', label: '"Fine. Please take us."', reply: sayAs('Mr Bello', 'helper', 'A polite customer! I will drive carefully. Mostly.', 'happy') },
    ] }] },
  ] },
  goto: [RING(-13.4, 0.8, 1.4), null, null, RING(27, -3.4, 1.5)],
  guide: [{ x: -30, z: 1.8, r: 2 }, { x: 7.5, z: -4, r: 3 }, { x: 22, z: 1, r: 5 }, RING(27, -3.4)],
  crowd: [{ x: -4, z: 1, rot: 1.2 }, { x: 10, z: 0.5, rot: -1.6 }, { x: 16, z: 6, rot: 3 }, { x: 4, z: -3.8, rot: 0 }, { x: -22, z: 0.4, rot: 1.6 }],
  npcs: { folake: { x: -31.5, z: 3, rot: -1.4 }, tunde: { x: -28.2, z: 3, rot: -1.8 } }, choiceLabel: 'ride',
  endBeat: { text: 'The taxi smells of air freshener and old roads. Out of the window the city goes by in a blur of colour, horns and sunshine.', line: 'Tomorrow you meet your landlord.' },
  starRules: ['Finish the level', 'Finish with no wrong places', 'Finish without a wrong place or a hint'],
})

// ---------------------------------------------------------------------------------------------------------------- Level 3
const landlordOffice = B('lofice', -22, -12, -10.5, -4, '#d9b98a', 'LANDLORD', 3.4), flat = B('flat', 8, 24, -10.5, -5, '#f0d9a8', 'FLAT 4B', 3.6)
export const LEVEL_C1L3 = L({
  n: 3, title: 'The Flat', next: 'ch1.l4', bounds: R(-26, 26, -11, 11),
  intro: 'Aunty found you a flat. It has a door, a window and a landlord who says "no problem" about every problem. Time to sign, move in and sit down for the first time all week.',
  theme: { ground: '#c9b48a', floors: [{ x0: -26, x1: 8, z0: -10, z1: 10, color: '#d9cdb0' }, { x0: 8, x1: 26, z0: -10, z1: 10, color: '#d8b98a' }], deco: [
    ...landlordOffice.d, ...flat.d, { kind: 'wall', x: 0, z: -12.4, w: 56, d: 2, h: 3.2, color: CREAM }, { kind: 'rug', x: 16, z: 0.4, w: 6, d: 3.6, color: GREEN }, { kind: 'chair', x: 16, z: 0.4, color: GREEN },
    { kind: 'sign', x: 8, z: 3, label: 'FLAT 4B', w: 1.6 }, ...TREES([[-24, 8], [2, 8]]), ...LAMPS([[-6, 2], [4, -3]]),
  ] },
  furniture: [landlordOffice.f, flat.f, F('desk', R(-18, -14, -1.8, -0.4), 0.9, WOOD), F('van', R(-25, -19, 4, 7.5), 1.6, BLUE), F('sofa', R(14, 18.4, -3.4, -1.6), 0.7, GREEN), F('shelf', R(20, 23, -4.5, -3.2), 1.6, DARK)],
  spawn: { x: -24, z: -1 }, resume: { x: -10, z: 1 },
  tasks: [
    T(3, 1, 'talk', 'Meet the landlord', { purpose: 'The landlord shows you the lease and tells you the rent. Say what you think.', objective: 'Talk to the landlord', success: 'You have talked terms with the landlord.',
      intro: [say('helper', 'That is Mr Okafor. He has been a landlord for thirty years and a smiler for thirty-one.', 'cheeky')], done: [say('player', 'So that is the rent. Pens, please.', 'thinking')], hint: 'Walk to Mr Okafor in front of the LANDLORD office and tap Talk.' }),
    T(3, 2, 'sequence', 'Sign the lease', { purpose: 'Paperwork, in the right order: your name, your signature, the date.', objective: 'Name, signature, then date', success: 'The lease is signed.',
      intro: [sayAs('Mr Okafor', 'neighbour', 'Name first. Then signature. Then date. In that order, or we start again.', 'calm')], done: [sayAs('Mr Okafor', 'neighbour', 'Excellent handwriting. Here are your keys. Do not lose them.', 'happy')], hint: 'Order on the desk: name, signature, date.' }),
    T(3, 3, 'collect', 'Move in the boxes', { purpose: 'Your things are in the van: carry three boxes up to the flat, bending at the knees.', objective: 'Carry three boxes from the van', success: 'All three boxes are inside.',
      intro: [say('helper', 'Three boxes. Lift with your knees. Not your back. Not your opinions.', 'cheeky')], done: [say('player', 'Everything I own is in a corner of a room. It is perfect.', 'happy')], hint: 'The boxes are on the ground next to the blue van, bottom left.' }),
    T(3, 4, 'hold', 'Sit down', { purpose: 'The first sit-down in the new flat. Let it sink in.', objective: 'Sit on the sofa and rest', success: 'You have rested.',
      intro: [say('player', 'My own place. My own sofa. My own... cracked ceiling. I love it.', 'happy')], done: [say('folake', 'You rang? Aunty told me you moved in! I will send jollof by the next bus.', 'happy')], hint: 'Stand in the ring by the green sofa until you are rested.' }),
  ],
  talks: { 0: [{ id: 'okafor', name: 'Mr Okafor', x: -13.5, z: 1.6, lines: [sayAs('Mr Okafor', 'neighbour', 'Welcome, welcome! The flat is lovely. The rent is thirty thousand. No problem.', 'happy')], rounds: [{ options: [
    { id: 'bargain', label: '"Can you lower the rent a little?"', reply: sayAs('Mr Okafor', 'neighbour', 'A little? Hm. Twenty-eight. Because you have honest eyes.', 'cheeky') },
    { id: 'accept', label: '"That is fair. Thank you."', reply: sayAs('Mr Okafor', 'neighbour', 'A sensible tenant! There is a free bucket in it for you.', 'happy') },
    { id: 'water', label: '"Is the water supply steady?"', reply: sayAs('Mr Okafor', 'neighbour', 'Steady... ish. Tuesdays and Fridays. Mostly.', 'worried') },
  ] }] }] },
  items: [
    { id: 'f_name', task: 1, x: -17, z: -1.1, label: 'Write your name', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'write' },
    { id: 'f_sign', task: 1, x: -16, z: -1.1, label: 'Sign the lease', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'write' },
    { id: 'f_date', task: 1, x: -15, z: -1.1, label: 'Write the date', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'write' },
    { id: 'box1', task: 2, x: -17.2, z: 5.2, label: 'Lift a box', color: ORANGE, shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'box2', task: 2, x: -16.2, z: 6.8, label: 'Lift a box', color: RUST, shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'box3', task: 2, x: -14.6, z: 5.6, label: 'Lift a box', color: YELLOW, shape: 'crate', y: 0.3, act: 'lift' },
  ],
  sequences: { 1: ['f_name', 'f_sign', 'f_date'] },
  holds: { 3: { x: 16, z: 0.4, r: 1.0, secs: 6, pose: 'sit' } },
  guide: [{ x: -13.5, z: 1.6, r: 3 }, { x: -16, z: -1.1, r: 3 }, { x: -16, z: 5.5, r: 4 }, RING(16, 0.4, 1.2)],
  crowd: [{ x: -6, z: 2, rot: 1.6 }, { x: 2, z: -4, rot: 0.2 }],
  npcs: { folake: { x: 22, z: 6, rot: -2.4 }, tunde: { x: -22.5, z: 9, rot: 0.6 } }, choiceLabel: 'rent',
  endBeat: { text: 'You sit on your own sofa in your own flat. The fridge hums. Somewhere a neighbour is singing, badly and with great confidence.', line: 'The neighbours are waiting to meet you.' },
  starRules: ['Finish the level', 'Finish without a wrong signing order', 'Finish with no mistakes and no hints'],
})

// ---------------------------------------------------------------------------------------------------------------- Level 4
const hChidi = B('chidi', -18, -9, -10.5, -5, '#f0d9a8', 'MAMA CHIDI'), hFemi = B('femi', -4, 5, -10.5, -5, '#d9e0b0', 'MR FEMI'), hTobi = B('tobi', 10, 19, -10.5, -5, '#e8c9a0', 'TOBI'), shop = B('shop', -19, -12, 7.5, 11, '#c9d9e8', 'SHOP', 2.6)
export const LEVEL_C1L4 = L({
  n: 4, title: 'The Neighbours', next: 'ch1.l5', bounds: R(-21, 21, -11.5, 11.5),
  intro: 'The compound has three houses, one tap and a lot of opinions. Everyone wants to meet the new tenant. Everyone also wants a small favour.',
  theme: { ground: '#b8c9a0', floors: [{ x0: -20, x1: 20, z0: -10, z1: 11, color: '#e0d6b8' }], deco: [
    ...hChidi.d, ...hFemi.d, ...hTobi.d, ...shop.d, { kind: 'wall', x: 0, z: -12.6, w: 44, d: 2, h: 3.2, color: CREAM }, { kind: 'sign', x: 14, z: 3.6, label: 'TAP', w: 1.2 }, { kind: 'sign', x: 0.5, z: 7, label: 'SHED', w: 1.4 },
    { kind: 'rug', x: 0, z: 1, w: 12, d: 3, color: '#c4562a' }, ...TREES([[-20, -2], [20, 0], [8, 9]]), ...LAMPS([[-6, 3], [6, 3]]),
  ] },
  furniture: [hChidi.f, hFemi.f, hTobi.f, shop.f, F('tap', R(13, 15, 4.4, 6), 0.9, '#6a8ab8'), F('shed', R(-2, 3, 7.4, 10.4), 1.8, '#8b6b4a')],
  spawn: { x: -19, z: 0 }, resume: { x: -6, z: 0 },
  tasks: [
    T(4, 1, 'talk', 'Meet the neighbours', { purpose: 'Walk round the compound and say hello to all three neighbours. Each one wants something.', objective: 'Say hello to all three neighbours', success: 'You have met everyone.',
      intro: [say('helper', 'Three doors, three neighbours, three favours. This is how the compound welcomes people.', 'cheeky')], done: [say('player', 'Sugar. A ladder. A football. Easy. I think.', 'thinking')], hint: 'Mama Chidi is at the left house, Mr Femi in the middle and Tobi at the right.' }),
    T(4, 2, 'collect', 'Run the errands', { purpose: 'Bring back what each neighbour asked for, from three different corners of the compound.', objective: 'Fetch the sugar, the ladder and the ball', success: 'You have all three things.',
      intro: [say('player', 'Shop for the sugar, shed for the ladder, and Tobi\'s ball is somewhere in the grass.', 'thinking')], done: [say('player', 'Sugar, ladder, ball. Delivery service, open for business.', 'happy')], hint: 'Sugar at the SHOP, ladder at the SHED, ball on the grass by the tap.' }),
    T(4, 3, 'reach', 'Fetch the water', { purpose: 'Mr Femi needs a bucket of water from the tap, and the children are playing in the yard.', objective: 'Get to the tap through the playing children', success: 'You reach the tap before the timer ends.',
      intro: [sayAs('Mr Femi', 'helper', 'Water! Fast! My tomatoes are thirsty! Mind the children, they are faster than they look!', 'worried')], done: [sayAs('Mr Femi', 'helper', 'You are a lifesaver. The tomatoes thank you.', 'happy')], hint: 'Cross behind the children as they run, then go right to the tap.' }),
    T(4, 4, 'choose', 'Compound meeting', { purpose: 'The neighbours want to welcome you with a dinner: say what you will do.', objective: 'Decide about the welcome dinner', success: 'You choose.',
      intro: [sayAs('Mama Chidi', 'neighbour', 'We should welcome the new tenant properly. With food. Who is cooking?', 'happy')], done: [sayAs('Mama Chidi', 'neighbour', 'Then we come on Friday. Bring plates!', 'happy')], hint: 'Three signs in the middle: host, share the cooking, or later.' }),
  ],
  talks: { 0: [
    { id: 'chidi', name: 'Mama Chidi', x: -13.5, z: -3, lines: [sayAs('Mama Chidi', 'neighbour', 'Ah, the new girl! Welcome. Could you bring me sugar from the shop? My tea is crying.', 'happy')], rounds: [{ options: [
      { id: 'help', label: '"Of course, I will fetch it."', reply: sayAs('Mama Chidi', 'neighbour', 'May your own tea always be sweet.', 'happy') },
      { id: 'busy', label: '"I am a bit busy, but I will try."', reply: sayAs('Mama Chidi', 'neighbour', 'Busy? In this compound? Everyone is busy. Try anyway.', 'cheeky') },
    ] }] },
    { id: 'femi', name: 'Mr Femi', x: 0.5, z: -3, lines: [sayAs('Mr Femi', 'helper', 'Young one! The ladder in the shed, please. The mango will not pick itself.', 'calm')] },
    { id: 'tobi', name: 'Tobi', x: 14.5, z: -3, lines: [sayAs('Tobi', 'helper', 'Hi! My ball went into the grass near the tap. Can you find it? It is red. Mostly.', 'cheeky')] },
  ] },
  items: [
    { id: 'sugar', task: 1, x: -15.6, z: 8.4, label: 'Take the sugar', color: '#fbf8f0', shape: 'produce', y: 1.1 },
    { id: 'ladder', task: 1, x: 0.5, z: 6.6, label: 'Take the ladder', color: YELLOW, shape: 'ladder', y: 0.15 },
    { id: 'ball', task: 1, x: 10, z: 4.5, label: 'Pick up the ball', color: RUST, shape: 'produce', y: 0.2 },
    { id: 'host', task: 3, x: -5, z: 1.4, label: 'Offer to host the dinner', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'potluck', task: 3, x: 0, z: 1.4, label: 'Suggest everyone brings a dish', color: GREEN, shape: 'sign', y: 0 },
    { id: 'later', task: 3, x: 5, z: 1.4, label: 'Say maybe next week', color: YELLOW, shape: 'sign', y: 0 },
  ],
  goto: [null, null, RING(14.2, 3.2, 1.5), null],
  guide: [{ x: 0, z: -2, r: 11 }, { x: 0, z: 6, r: 12 }, RING(14.2, 3.2), { x: 0, z: 1.4, r: 6 }],
  hazards: [D('walker', 3.5, -2, 6, 2.6, 0), D('walker', 6.5, -2, 6, 2.9, 1.2, GREEN), D('walker', 9.5, -2, 6, 2.4, 0.6, ORANGE)],
  timeLimit: 20,
  crowd: [{ x: 4, z: 5.5, rot: 1 }, { x: -8, z: 4, rot: 2 }],
  npcs: { folake: { x: 19, z: 9.5, rot: -2.4 }, tunde: { x: -19, z: 9.5, rot: 0.8 } }, choiceLabel: 'dinner',
  endBeat: { text: 'By evening you know three names, two secrets and which neighbour to avoid if you want a quiet Saturday.', line: 'Time to shop for Friday.' },
  starRules: ['Finish the level', 'Reach the tap before the timer ends', 'Be on time with two or fewer slips'],
})

// ---------------------------------------------------------------------------------------------------------------- Level 5
const stall = (_n: string, x: number, c: string, label: string): Deco => ({ kind: 'stall', x, z: -8.4, w: 3.4, d: 1.6, color: c, label })
export const LEVEL_C1L5 = L({
  n: 5, title: 'The Market', next: 'ch1.l6', bounds: R(-27, 27, -11.5, 11.5),
  intro: 'A big market on a Thursday: rows of stalls, shouting sellers and a shopping list for Friday\'s dinner. Your budget is not as big as the market.',
  theme: { ground: '#c9b48a', floors: [{ x0: -27, x1: 27, z0: -10, z1: 11, color: '#e0d2b2' }], deco: [
    stall('s1', -16, GREEN, 'VEGETABLES'), stall('s2', -5, RUST, 'GRAINS'), stall('s3', 6, ORANGE, 'MEAT'), stall('s4', 17, YELLOW, 'OIL AND SPICES'),
    { kind: 'wall', x: 0, z: -12.6, w: 58, d: 2, h: 3.2, color: CREAM }, { kind: 'stall', x: -14, z: 8.6, w: 3.4, d: 1.6, color: BLUE, label: 'FABRIC' }, { kind: 'stall', x: 8, z: 8.6, w: 3.4, d: 1.6, color: '#2b8aa0', label: 'FISH' },
    { kind: 'sign', x: 25, z: 0, label: 'EXIT', w: 1.4 }, ...TREES([[-26, -8], [26, -8]]), ...LAMPS([[-10, 2], [0, 2], [10, 2]]),
  ] },
  furniture: [F('c1', R(-17.7, -14.3, -9.4, -7.4), 1.0, WOOD), F('c2', R(-6.7, -3.3, -9.4, -7.4), 1.0, WOOD), F('c3', R(4.3, 7.7, -9.4, -7.4), 1.0, WOOD), F('c4', R(15.3, 18.7, -9.4, -7.4), 1.0, WOOD), F('c5', R(-15.7, -12.3, 7.8, 9.4), 1.0, WOOD), F('c6', R(6.3, 9.7, 7.8, 9.4), 1.0, WOOD)],
  spawn: { x: -25, z: 0 }, resume: { x: -12, z: 0 },
  tasks: [
    T(5, 1, 'find', 'Find the vegetable stall', { purpose: 'Every stall shouts at you. Only one sells what is on the list.', objective: 'Find the vegetable stall', success: 'You find the vegetable stall.',
      intro: [say('helper', 'Tomatoes, rice, chicken, oil. Start with the vegetables. Look for the green roof.', 'calm')], done: [say('player', 'Green roof, tomatoes. This part I understand.', 'happy')], hint: 'The stall with the green roof is the VEGETABLES one, top left.' }),
    T(5, 2, 'collect', 'Shop on a budget', { purpose: 'You have ₦4200 and four things to buy. Some stalls are cheap, some are expensive. Choose well.', objective: 'Buy 4 things on your list within the budget', success: 'Your basket has all four.',
      intro: [say('helper', 'Tomatoes, rice, chicken, oil. The imported rice and the goat meat look nice. They are not on the list.', 'cheeky')], done: [say('player', 'Four things. Under budget. Aunty will cry.', 'proud')], hint: 'Cheaper is fine: local rice, chicken, tomatoes and oil. If you overspend, tap Start over.' }),
    T(5, 3, 'talk', 'Haggle for the oil', { purpose: 'The oil seller says one price. You can say another. All three answers are fair.', objective: 'Haggle with the oil seller', success: 'You settle the price.',
      intro: [say('player', 'Last item. Last chance to practise my serious face.', 'thinking')], done: [sayAs('Mama Oil', 'neighbour', 'You drive a hard bargain. Come again, my friend.', 'happy')], hint: 'The oil seller is by the OIL AND SPICES stall on the right.' }),
    T(5, 4, 'reach', 'Carry the bags home', { purpose: 'Heavy bags, crowded lanes and carts that do not stop.', objective: 'Carry the bags to the market exit', success: 'You reach the exit before the timer ends.',
      intro: [say('helper', 'Carts! People! Keep the bags up! Keep the chicken up!', 'worried')], done: [say('player', 'Still in one piece. The chicken too.', 'laughing')], hint: 'Cross behind the carts and go right to the EXIT sign.' }),
  ],
  spots: [
    { id: 'veg', task: 0, x: -15, z: -5.8, label: 'Check the green stall', right: true },
    { id: 'fabric', task: 0, x: -14, z: 5.8, label: 'Check this stall', wrong: say('helper', 'Lovely cloth. I cannot cook cloth.', 'cheeky') },
    { id: 'fish', task: 0, x: 8, z: 5.8, label: 'Check this stall', wrong: say('player', 'Fresh fish. Very fresh. Too fresh for my nose.', 'tired') },
  ],
  items: [
    { id: 'tomato', task: 1, price: 600, x: -16, z: -7.8, label: 'Buy tomatoes (₦600)', color: '#d62828', shape: 'produce', y: 1.05 },
    { id: 'rice', task: 1, price: 1200, x: -5, z: -7.8, label: 'Buy local rice (₦1200)', color: '#fbf8f0', shape: 'bag', y: 1.05 },
    { id: 'rice_imp', task: 1, price: 1800, x: -3.6, z: -7.8, label: 'Buy imported rice (₦1800)', color: '#e0d6b8', shape: 'bag', y: 1.05 },
    { id: 'chicken', task: 1, price: 1500, x: 5.6, z: -7.8, label: 'Buy chicken (₦1500)', color: '#a85a1f', shape: 'plate', y: 1.05 },
    { id: 'goat', task: 1, price: 2200, x: 7, z: -7.8, label: 'Buy goat meat (₦2200)', color: '#6b3a1e', shape: 'plate', y: 1.05 },
    { id: 'oil', task: 1, price: 700, x: 17, z: -7.8, label: 'Buy cooking oil (₦700)', color: YELLOW, shape: 'bottle', y: 1.05 },
  ],
  budgets: { 1: { budget: 4200, need: 4 } },
  talks: { 2: [{ id: 'oil', name: 'Mama Oil', x: 17, z: -5.2, lines: [sayAs('Mama Oil', 'neighbour', 'For you, my friend, special price. Seven hundred. Special. Only special.', 'cheeky')], rounds: [{ options: [
    { id: 'low', label: '"Four hundred? It is a small bottle."', reply: sayAs('Mama Oil', 'neighbour', 'Four?! Five-fifty. And I am crying inside.', 'worried') },
    { id: 'fair', label: '"Six hundred, and I buy again next week."', reply: sayAs('Mama Oil', 'neighbour', 'A customer with a plan! Six hundred. Next week, same.', 'happy') },
    { id: 'walk', label: '"Too much. I will try the next stall."', reply: sayAs('Mama Oil', 'neighbour', 'Wait, wait! Six-fifty. Do not go.', 'worried') },
  ] }] }] },
  goto: [null, null, null, RING(24.4, 0, 1.5)],
  guide: [{ x: -15, z: -5, r: 3 }, { x: 0, z: -5, r: 20 }, { x: 17, z: -4.5, r: 3 }, RING(24.4, 0)],
  hazards: [D('cart', -8, -6, 6, 2.8, 0), D('walker', -1, -6, 6, 2.5, 1.3, GREEN), D('cart', 6, -6, 6, 3.0, 0.7, RUST), D('walker', 12.5, -6, 6, 2.4, 0.2, ORANGE)],
  timeLimit: 22,
  crowd: [{ x: -12, z: 1, rot: 1.6 }, { x: 4, z: -3.8, rot: 3 }, { x: 14, z: 3, rot: -2 }, { x: -20, z: 4, rot: 0.5 }],
  npcs: { folake: { x: 25.5, z: 8.5, rot: -2.5 }, tunde: { x: -25.5, z: 8.5, rot: 0.8 } }, choiceLabel: 'haggle',
  endBeat: { text: 'You come home with four bags, a sore shoulder and a new respect for anyone who has ever bargained for a living.', line: 'Friday\'s dinner is tomorrow.' },
  starRules: ['Finish the level', 'Reach the exit before the timer ends', 'Be on time with two or fewer slips'],
})

// ---------------------------------------------------------------------------------------------------------------- Level 6
export const LEVEL_C1L6 = L({
  n: 6, title: 'First Dinner', next: 'ch1.l7', bounds: R(-14, 14, -9, 9),
  intro: 'Friday. The neighbours are coming at seven and the kitchen has never seen a party. Fetch what you need, cook the jollof, seat everyone and serve.',
  theme: { ground: '#cfc4a8', floors: [{ x0: -14, x1: -2, z0: -9, z1: 9, color: '#e6e0d0' }, { x0: -2, x1: 14, z0: -9, z1: 9, color: '#d8b98a' }], deco: [
    { kind: 'wall', x: 0, z: -10.6, w: 30, d: 2, h: 3.2, color: CREAM }, { kind: 'window', x: -4, z: -9.6, w: 3, h: 1.2 }, { kind: 'window', x: 6, z: -9.6, w: 3, h: 1.2 }, { kind: 'sign', x: 13.2, z: -0.6, label: 'DOOR', w: 1.4 },
    { kind: 'rug', x: 7, z: 0, w: 7, d: 5, color: GREEN }, { kind: 'chair', x: 6, z: -2.4, color: WOOD }, { kind: 'chair', x: 8, z: -2.4, color: WOOD }, { kind: 'chair', x: 7, z: 2.4, color: WOOD }, ...LAMPS([[-1, 7]]),
  ] },
  furniture: [F('fridge', R(-13.6, -11.6, -8.4, -6.8), 2.0, '#e8ecef'), F('shelf', R(-9, -5.4, -8.6, -7.6), 1.9, DARK), F('stove', R(-10, -5.8, -5, -3.8), 1.0, '#9aa3a8'), F('pass', R(-3, 0.2, -1.5, 1.5), 1.0, DARK), F('dtable', R(5, 9, -1.2, 1.2), 0.8, WOOD)],
  spawn: { x: 12, z: 5 }, resume: { x: -4, z: 4 },
  tasks: [
    T(6, 1, 'collect', 'Fetch the ingredients', { purpose: 'Rice from a sack on the floor, pepper from a basket, tomatoes from the fridge and oil from the top shelf.', objective: 'Fetch rice, pepper, tomatoes and oil', success: 'Everything is on the counter.',
      intro: [say('folake', 'I am calling from the village to say: do not burn the rice. Do not. Please. I can feel it from here.', 'worried')], done: [say('player', 'Rice, pepper, tomatoes, oil. Ready to cook.', 'happy')], hint: 'Fridge on the far left, high shelf at the top, a sack and a basket on the floor.' }),
    T(6, 2, 'sequence', 'Cook the jollof', { purpose: 'Chop the onion, fry the sauce, stir in the rice, then season. In that order.', objective: 'Chop, fry, add rice, then season', success: 'The jollof is cooked.',
      intro: [say('helper', 'Onion first. Then the sauce. Then the rice. Then the seasoning. This is jollof law.', 'calm')], done: [say('player', 'It smells like home. Which means it is either perfect or on fire.', 'laughing')], hint: 'Order on the stove: onion, sauce, rice, seasoning.' }),
    T(6, 3, 'serve', 'Serve your guests', { purpose: 'Show each neighbour to a chair, bring their plate and let them eat.', objective: 'Seat and serve all three neighbours', success: 'Everyone is eating.',
      intro: [sayAs('Mama Chidi', 'neighbour', 'We are here! Where do we sit? What smells so good?', 'happy')], done: [sayAs('Mr Femi', 'helper', 'This is better than my wife\'s. Do not tell her I said so.', 'cheeky')], hint: 'Walk to a guest to seat them, take their plate from the counter and carry it to their chair.' }),
    T(6, 4, 'choose', 'After dinner', { purpose: 'Over dessert the neighbours ask what you will do now you are settled. Pick a plan.', objective: 'Decide what to do next', success: 'You choose.',
      intro: [sayAs('Mama Chidi', 'neighbour', 'So, my dear. A girl cannot live on jollof alone. What is the plan?', 'curious')], done: [sayAs('Mr Femi', 'helper', 'Then Monday you start. Wear your best shirt.', 'proud')], hint: 'Three signs on the rug: offices, a shop job, or learn a trade.' }),
  ],
  items: [
    { id: 'tomato', task: 0, x: -12.6, z: -5.6, label: 'Take tomatoes from the fridge', color: '#d62828', shape: 'produce', y: 1.1 },
    { id: 'oil', task: 0, x: -7.2, z: -6.6, label: 'Take the oil from the shelf', color: YELLOW, shape: 'bottle', y: 1.9 },
    { id: 'pepper', task: 0, x: -5, z: 5.5, label: 'Take pepper from the basket', color: ORANGE, shape: 'produce', y: 0.25 },
    { id: 'rice', task: 0, x: -11, z: 6, label: 'Lift the rice sack', color: '#fbf8f0', shape: 'bag', y: 0.35 },
    { id: 'onion', task: 1, x: -9.4, z: -4.4, label: 'Chop the onion', color: '#a25ab0', shape: 'produce', y: 1.1, act: 'chop' },
    { id: 'sauce', task: 1, x: -8.2, z: -4.4, label: 'Fry the sauce', color: '#d62828', shape: 'plate', y: 1.1, act: 'stir' },
    { id: 'rice_pot', task: 1, x: -7.0, z: -4.4, label: 'Stir in the rice', color: '#fbf8f0', shape: 'plate', y: 1.1, act: 'stir' },
    { id: 'season', task: 1, x: -6.2, z: -4.4, label: 'Season it', color: '#e07a1f', shape: 'bottle', y: 1.1, act: 'pour' },
    { id: 'plateChidi', task: 2, x: -2.2, z: -0.8, label: 'Take Mama Chidi\'s plate', color: RUST, shape: 'plate', y: 1.1 },
    { id: 'plateFemi', task: 2, x: -1.4, z: 0.0, label: 'Take Mr Femi\'s plate', color: '#a85a1f', shape: 'plate', y: 1.1 },
    { id: 'plateTobi', task: 2, x: -0.6, z: 0.8, label: 'Take Tobi\'s plate', color: YELLOW, shape: 'plate', y: 1.1 },
    { id: 'office', task: 3, x: 4, z: 5.4, label: 'Try the offices downtown', color: BLUE, shape: 'sign', y: 0 },
    { id: 'shopjob', task: 3, x: 7, z: 5.4, label: 'Look for a shop job', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'trade', task: 3, x: 10, z: 5.4, label: 'Learn a trade', color: GREEN, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['onion', 'sauce', 'rice_pot', 'season'] },
  serves: { 2: { eatSecs: 3, from: 2, guests: [
    { id: 'chidi', name: 'Mama Chidi', order: 'Jollof', dish: 'plateChidi', x: 12, z: -4.4, seat: { x: 6, z: -2.4 }, table: { x: 6, z: -0.7 } },
    { id: 'femi', name: 'Mr Femi', order: 'Jollof and plantain', dish: 'plateFemi', x: 12, z: -2.6, seat: { x: 8, z: -2.4 }, table: { x: 8, z: -0.7 } },
    { id: 'tobi', name: 'Tobi', order: 'A small plate', dish: 'plateTobi', x: 12, z: 3.6, seat: { x: 7, z: 2.4 }, table: { x: 7, z: 0.7 } },
  ] } },
  guide: [{ x: -8, z: 0, r: 8 }, { x: -8, z: -3.4, r: 3 }, { x: 4, z: 0, r: 7 }, { x: 7, z: 5.4, r: 4 }],
  crowd: [],
  npcs: { folake: { x: -12.5, z: 7.5, rot: 0.8 }, tunde: { x: 12.5, z: 7.5, rot: -2.4 } }, choiceLabel: 'plan',
  endBeat: { text: 'The last plate is empty. Mama Chidi has asked for the recipe, Mr Femi for seconds and Tobi has fallen asleep on the rug.', line: 'Monday means job hunting.' },
  starRules: ['Finish the level', 'Finish with no wrong order and no wrong plate', 'Finish with no mistakes and no hints'],
})

// ---------------------------------------------------------------------------------------------------------------- Level 7
const bright = B('bright', -25, -14, -11, -5, '#c9d9e8', 'BRIGHT LOGISTICS', 3.8), bank = B('bank', -4, 6, -11, -5, '#e8d9c9', 'SUNRISE BANK', 3.8), printer = B('print', 14, 23, -11, -6, '#f0d9a8', 'PRINT SHOP', 2.8)
export const LEVEL_C1L7 = L({
  n: 7, title: 'Job Hunt', next: 'ch1.l8', bounds: R(-28, 28, -12, 12),
  intro: 'Monday morning, a neat shirt and a plan. Find the jobs board, print some CVs and get them in the right hands before the offices close for lunch.',
  theme: { ground: '#bfb393', floors: [{ x0: -28, x1: 28, z0: -10.5, z1: 12, color: '#d9cdb0' }], deco: [
    ...bright.d, ...bank.d, ...printer.d, { kind: 'road', x: 0, z: 5.5, w: 56, d: 3.2 }, { kind: 'wall', x: 0, z: -12.6, w: 60, d: 2, h: 3.4, color: CREAM },
    { kind: 'sign', x: -22, z: 1.4, label: 'NOTICES', w: 1.5 }, { kind: 'sign', x: -8, z: 1.4, label: 'NOTICES', w: 1.5 }, { kind: 'sign', x: 8, z: 1.4, label: 'NOTICES', w: 1.5 }, ...TREES([[-27, -9], [27, -9]]), ...LAMPS([[-12, 2], [2, 2], [12, 2]]),
  ] },
  furniture: [bright.f, bank.f, printer.f, F('board1', R(-23, -21, 2, 2.6), 1.6, WOOD), F('board2', R(-9, -7, 2, 2.6), 1.6, WOOD), F('board3', R(7, 9, 2, 2.6), 1.6, WOOD), F('counter', R(15, 22, -7, -6.2), 1.0, DARK)],
  spawn: { x: 26, z: 0 }, resume: { x: 10, z: 0 },
  tasks: [
    T(7, 1, 'find', 'Find the jobs board', { purpose: 'Three noticeboards on the street: lost pets, lost keys and jobs. Which is which?', objective: 'Find the board with job adverts', success: 'You find the jobs.',
      intro: [say('helper', 'Noticeboards! One of them has jobs. The others have cats, chairs and a very confident preacher.', 'cheeky')], done: [say('player', 'Bright Logistics wants a clerk. Sunrise Bank wants a cashier. Both close at one.', 'thinking')], hint: 'Read the notices: the right one lists JOBS.' }),
    T(7, 2, 'collect', 'Print your CVs', { purpose: 'At the print shop, take three copies of your CV from the counter.', objective: 'Take three copies of your CV', success: 'Three CVs are in your folder.',
      intro: [sayAs('Print Shop', 'helper', 'Three copies? Fifty naira each. Take, take. Do not crease.', 'calm')], done: [say('player', 'Three clean copies. A new beginning, on paper.', 'proud')], hint: 'The CV copies are on the print shop counter, top right.' }),
    T(7, 3, 'reach', 'Run for the offices', { purpose: 'The offices close for lunch soon: cross the busy road and get to Bright Logistics in time.', objective: 'Cross the road to Bright Logistics', success: 'You reach the office before the timer ends.',
      intro: [say('helper', 'It is five to one! Cross now! The traffic is not going to stop for sentiment!', 'worried')], done: [say('player', 'Out of breath. In time.', 'laughing')], hint: 'Wait for a gap between the vehicles, then cross to the left.' }),
    T(7, 4, 'talk', 'Hand in your CVs', { purpose: 'Greet the guard and the receptionist, and say who you are.', objective: 'Talk to the guard and the receptionist', success: 'Your CV is in.',
      intro: [say('player', 'Deep breath. Smile. Do not say "um".', 'worried')], done: [sayAs('Ms Bola', 'neighbour', 'We will call you. Actually, you are in luck: an interview tomorrow at nine.', 'happy')], hint: 'The guard stands by the door; Ms Bola is at the reception on the right.' }),
  ],
  spots: [
    { id: 'b1', task: 0, x: -22, z: 4.4, label: 'Read this board', wrong: say('player', 'Missing: one cat. Last seen near a very smug dog.', 'tired') },
    { id: 'b2', task: 0, x: -8, z: 4.4, label: 'Read this board', wrong: say('helper', 'A confident preacher is selling sofas. That is not a job.', 'cheeky') },
    { id: 'b3', task: 0, x: 8, z: 4.4, label: 'Read this board', right: true },
  ],
  items: [
    { id: 'cv1', task: 1, x: 16.4, z: -6.6, label: 'Take a CV copy', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'grab' },
    { id: 'cv2', task: 1, x: 18.5, z: -6.6, label: 'Take a CV copy', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'grab' },
    { id: 'cv3', task: 1, x: 20.6, z: -6.6, label: 'Take a CV copy', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'grab' },
  ],
  talks: { 3: [
    { id: 'guard', name: 'Mr Sule', x: -22.5, z: -3, lines: [sayAs('Mr Sule', 'helper', 'Stop. Name? Business? Shirt looks good. Go ahead. Quickly.', 'calm')] },
    { id: 'bola', name: 'Ms Bola', x: -16.5, z: -3, lines: [sayAs('Ms Bola', 'neighbour', 'Good afternoon. You are here about the clerk job? Tell me about yourself in one sentence.', 'curious')], rounds: [{ options: [
      { id: 'confident', label: '"I am reliable, quick and I learn fast."', reply: sayAs('Ms Bola', 'neighbour', 'Confident. I like that. A little.', 'happy') },
      { id: 'honest', label: '"I am new in the city but I work hard."', reply: sayAs('Ms Bola', 'neighbour', 'Honest. Rare. I like that a lot.', 'happy') },
      { id: 'shy', label: '"Um... I... hello. My name is..."', reply: sayAs('Ms Bola', 'neighbour', 'Take a breath. It is only a sentence. Better.', 'calm') },
    ] }] },
  ] },
  goto: [null, null, RING(-19.6, -2.6, 1.5), null],
  guide: [{ x: -8, z: 4, r: 18 }, { x: 18.5, z: -5, r: 4 }, RING(-19.6, -2.6), { x: -19.5, z: -3, r: 4 }],
  hazards: [D('cart', 12, -1, 11, 3.4, 0, RUST), D('walker', 4, -1, 11, 3.0, 1.1, GREEN), D('cart', -4, -1, 11, 3.6, 0.5, ORANGE), D('walker', -12, -1, 11, 3.0, 0.2)],
  timeLimit: 22,
  crowd: [{ x: 18, z: 0, rot: 3 }, { x: 0, z: 9, rot: 0.5 }, { x: -14, z: 9, rot: 1.2 }],
  npcs: { folake: { x: 26.5, z: 9, rot: -2.4 }, tunde: { x: -26.5, z: 9, rot: 0.8 } }, choiceLabel: 'first impression',
  endBeat: { text: 'You walk out with an interview card in your hand and a feeling you have not had since you left the village: that the city might say yes.', line: 'The interview is at nine tomorrow.' },
  starRules: ['Finish the level', 'Reach the office before the timer ends', 'Be on time with two or fewer slips'],
})

// ---------------------------------------------------------------------------------------------------------------- Level 8
const tower = B('tower', -8, 24, -11, -7, '#c9d9e8', 'ADEYEMI AND CO', 4.2)
export const LEVEL_C1L8 = L({
  n: 8, title: 'The Interview', next: 'ch1.l9', bounds: R(-34, 26, -11, 11),
  intro: 'Nine o\'clock, a bus across town and a lobby that smells of floor polish. Everything you have done this week led to the next half hour.',
  theme: withStreet({ ground: '#bfb393', floors: [{ x0: -12.4, x1: 26, z0: -9, z1: 8, color: '#e8e0cf' }], deco: [
    ...tower.d, { kind: 'wall', x: 0, z: -12.6, w: 64, d: 2, h: 3.4, color: CREAM }, { kind: 'rug', x: 14, z: 2.4, w: 7, d: 3, color: BLUE }, { kind: 'chair', x: 12, z: 2.4, color: DARK }, { kind: 'chair', x: 14, z: 2.4, color: DARK }, { kind: 'chair', x: 16, z: 2.4, color: DARK },
    { kind: 'sign', x: 3, z: -2, label: 'RECEPTION', w: 1.6 }, ...TREES([[-10, -8], [24, 7]]), ...LAMPS([[-8, 2], [8, 6]]),
  ] }),
  furniture: [tower.f, F('desk', R(1, 7, -5, -3.4), 1.0, DARK), F('plant', R(22, 23.4, 3, 4.4), 1.0, GREEN)],
  spawn: { x: -32, z: 0.4 }, resume: { x: -10, z: 0 },
  tasks: [
    T(8, 1, 'ride', 'Take the bus to the office', { purpose: 'The company is across town: wait at the stop, board the bus and ride to the office district.', objective: 'Take the bus to the office district', success: 'You get off at the office district.',
      intro: [say('folake', 'Phone call from the village: wear the white shirt, do not slouch, and take the early bus. I am praying so loudly the whole village can hear.', 'worried')], done: [say('player', 'Glass buildings. A lot of them. Everyone looks like they know where they are going.', 'surprised')], hint: 'Walk to the BUS STOP sign, wait for the yellow bus and tap Board the bus.' }),
    T(8, 2, 'hold', 'Wait in the lobby', { purpose: 'Sit quietly in the lobby until you are called. Do not fidget.', objective: 'Sit in the lobby and wait', success: 'You are called in.',
      intro: [sayAs('Receptionist', 'neighbour', 'Please take a seat. Ms Adeyemi will see you shortly. Do you want water?', 'calm')], done: [sayAs('Receptionist', 'neighbour', 'Ms Adeyemi is ready for you. Last door on the right.', 'calm')], hint: 'Stand in the ring by the blue chairs and wait.' }),
    T(8, 3, 'talk', 'The interview', { purpose: 'Ms Adeyemi asks you three questions. There is no perfect answer, only your answer.', objective: 'Answer all three of Ms Adeyemi\'s questions', success: 'The interview is done.',
      intro: [say('player', 'Deep breath. Shoulders back. This is just a conversation. A very important one.', 'worried')], done: [sayAs('Ms Adeyemi', 'neighbour', 'Thank you. That was honest. Give me a moment.', 'calm')], hint: 'Walk up to Ms Adeyemi on the right and answer each question.' }),
    T(8, 4, 'choose', 'The offer', { purpose: 'She offers you the job. You decide how to answer.', objective: 'Decide how to answer the offer', success: 'You choose.',
      intro: [sayAs('Ms Adeyemi', 'neighbour', 'We would like to offer you the position. Starting salary is forty-five thousand. What do you say?', 'happy')], done: [sayAs('Ms Adeyemi', 'neighbour', 'Welcome to the team. Monday, eight sharp.', 'happy')], hint: 'Accept, ask for a little more, or ask for a day to think.' }),
  ],
  rides: { 0: { stop: { x: -30, z: 1.8 }, busZ: 4.4, from: 'home', to: 'the office district' } },
  holds: { 1: { x: 14, z: 2.4, r: 1.0, secs: 6, pose: 'sit' } },
  talks: { 2: [{ id: 'adeyemi', name: 'Ms Adeyemi', x: 20, z: -1, lines: [sayAs('Ms Adeyemi', 'neighbour', 'Good morning. Sit, sit. I have read your CV. Let us talk. First: tell me about yourself.', 'calm')], rounds: [
    { options: [
      { id: 'story', label: '"I grew up in a village and I work hard."', reply: sayAs('Ms Adeyemi', 'neighbour', 'Hard work travels well. Next: what is your biggest weakness?', 'curious') },
      { id: 'skills', label: '"I learn fast and I am reliable."', reply: sayAs('Ms Adeyemi', 'neighbour', 'Good. Specific is better. Next: what is your biggest weakness?', 'curious') },
      { id: 'jollof', label: '"I once cooked for thirty people."', reply: sayAs('Ms Adeyemi', 'neighbour', 'Memorable! Next: what is your biggest weakness?', 'happy') },
    ] },
    { options: [
      { id: 'honest', label: '"I get nervous, but I do the work anyway."', reply: sayAs('Ms Adeyemi', 'neighbour', 'Honest. Last question: why this company?', 'calm') },
      { id: 'dodge', label: '"I work too hard."', reply: sayAs('Ms Adeyemi', 'neighbour', 'Everyone says that. Last question: why this company?', 'cheeky') },
      { id: 'fix', label: '"I am slow at first. So I ask questions."', reply: sayAs('Ms Adeyemi', 'neighbour', 'A good answer. Last question: why this company?', 'happy') },
    ] },
    { options: [
      { id: 'grow', label: '"I want to learn and grow with you."', reply: sayAs('Ms Adeyemi', 'neighbour', 'Mm. Good.', 'happy') },
      { id: 'need', label: '"I need a job and I will not waste it."', reply: sayAs('Ms Adeyemi', 'neighbour', 'Direct. I like direct.', 'happy') },
      { id: 'city', label: '"This city gave me a chance. I want to repay it."', reply: sayAs('Ms Adeyemi', 'neighbour', 'That is a lovely answer.', 'happy') },
    ] },
  ] }] },
  items: [
    { id: 'accept', task: 3, x: 18, z: 3.4, label: 'Accept the offer', color: GREEN, shape: 'sign', y: 0 },
    { id: 'ask', task: 3, x: 20.4, z: 3.4, label: 'Ask for a little more', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'time', task: 3, x: 22.8, z: 3.4, label: 'Ask for a day to think', color: ORANGE, shape: 'sign', y: 0 },
  ],
  goto: [RING(-13.4, 0.8, 1.4), null, null, null],
  guide: [{ x: -30, z: 1.8, r: 2 }, RING(14, 2.4, 1.2), { x: 20, z: -1, r: 4 }, { x: 20.4, z: 3.4, r: 4 }],
  crowd: [{ x: 4, z: 1, rot: 1.6 }, { x: -22, z: 0.4, rot: 1.6 }, { x: 8, z: 5.5, rot: -2 }],
  npcs: { folake: { x: -31.5, z: 3, rot: -1.4 }, tunde: { x: 24.5, z: 7, rot: -2.4 } }, choiceLabel: 'offer',
  endBeat: { text: 'You walk out into the sunshine with a job. A real one, with a desk and a name tag. You call home and nobody can understand a word you are saying because you are crying and laughing together.', line: 'Your first payday is coming.' },
  starRules: ['Finish the level', 'Answer all three questions', 'Finish without any hints'],
})

// ---------------------------------------------------------------------------------------------------------------- Level 9
export const LEVEL_C1L9 = L({
  n: 9, title: 'Payday', next: null, badge: 'Somehow, You Made It', bounds: R(-26, 26, -11.5, 11.5),
  intro: 'A month later. The shirt is no longer new, the bus knows your face and today the company pays you. Work first, rent second, party third.',
  theme: { ground: '#bfb393', floors: [{ x0: -26, x1: -2, z0: -10.5, z1: 11, color: '#cfc8b8' }, { x0: -2, x1: 26, z0: -10.5, z1: 11, color: '#d8b98a' }], deco: [
    { kind: 'wall', x: 0, z: -12.6, w: 56, d: 2, h: 3.4, color: CREAM }, { kind: 'sign', x: -20, z: 0, label: 'WAREHOUSE', w: 2 }, { kind: 'sign', x: 6, z: 1, label: 'OFFICE', w: 1.6 }, { kind: 'sign', x: 18, z: -9.3, label: 'YOUR FLAT', w: 2 },
    { kind: 'rug', x: 17, z: 3.5, w: 8, d: 4.4, color: GREEN }, { kind: 'chair', x: 15, z: 1.6, color: WOOD }, { kind: 'chair', x: 17, z: 1.6, color: WOOD }, { kind: 'chair', x: 19, z: 1.6, color: WOOD },
    { kind: 'sign', x: 23.5, z: -6.5, label: 'BALCONY', w: 1.6 }, ...TREES([[-25, 9]]), ...LAMPS([[-12, 4], [4, 6]]),
  ] },
  furniture: [F('shelf', R(-12, -7, -9.6, -8), 1.8, DARK), F('desk', R(4, 8, -2, -0.5), 0.9, WOOD), F('ptable', R(14, 20, 2.4, 4.4), 0.8, WOOD), F('buffet', R(10, 15.5, -8.6, -7.2), 1.0, WOOD)],
  spawn: { x: -24, z: 0 }, resume: { x: -8, z: 0 },
  tasks: [
    T(9, 1, 'collect', 'Stack the stock', { purpose: 'The warehouse day: lift four crates off the floor and stack them on the shelf.', objective: 'Lift and stack four crates', success: 'The shelf is full.',
      intro: [sayAs('Mr Danjuma', 'helper', 'Four crates from the floor to the shelf. Knees bent, back straight. We do not do hospital visits here.', 'calm')], done: [sayAs('Mr Danjuma', 'helper', 'Neat stacking. Come to the office, it is payday.', 'proud')], hint: 'The crates are on the floor on the left. Lift each one.' }),
    T(9, 2, 'talk', 'Payday at the office', { purpose: 'Thank your boss and your co-worker, then collect your first envelope.', objective: 'Talk to your boss and your co-worker', success: 'You have your pay.',
      intro: [say('player', 'First month. First envelope. Please let it be thicker than it looks.', 'worried')], done: [say('player', 'It is real. It is mine. I earned it.', 'happy')], hint: 'Mr Danjuma is by the desk; Kayode is on the right.' }),
    T(9, 3, 'sequence', 'Count it and pay the rent', { purpose: 'Count the money, set the rent aside and sign the receipt for Mr Okafor.', objective: 'Count, set aside the rent, sign the receipt', success: 'The rent is paid.',
      intro: [say('helper', 'Count it. Rent first, spending later. That is how adults do it.', 'calm')], done: [sayAs('Mr Okafor', 'neighbour', 'On time! Do you want a medal? I have none. Take a biscuit.', 'happy')], hint: 'Order on the desk: count, rent, receipt.' }),
    T(9, 4, 'serve', 'The party', { purpose: 'You invited everyone who helped: seat them, bring their food and let them celebrate.', objective: 'Seat and serve the three guests', success: 'Everyone is feasting.',
      intro: [sayAs('Mama Chidi', 'neighbour', 'We came! What do we eat? Where do we sit? Tell me everything!', 'happy')], done: [sayAs('Tobi', 'helper', 'Best. Party. Ever. Is there a second cake?', 'cheeky')], hint: 'Seat each guest, take what they ordered from the buffet and bring it over.' }),
    T(9, 5, 'goto', 'Look out at the city', { purpose: 'The week that started on a loud bus ends on a quiet balcony.', objective: 'Walk out onto the balcony', success: 'You stand on the balcony.',
      intro: [say('tunde', 'Go and look. You earned the view.', 'proud')], done: [say('folake', 'Somehow, you made it.', 'proud')], hint: 'The balcony is at the top right.' }),
  ],
  items: [
    { id: 'crA', task: 0, x: -20, z: 3, label: 'Lift a crate', color: ORANGE, shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'crB', task: 0, x: -18.4, z: 5, label: 'Lift a crate', color: RUST, shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'crC', task: 0, x: -21.6, z: 5.4, label: 'Lift a crate', color: YELLOW, shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'crD', task: 0, x: -16.6, z: 2.6, label: 'Lift a crate', color: GREEN, shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'count', task: 2, x: 5, z: -1.2, label: 'Count the money', color: GREEN, shape: 'bank', y: 1.0, act: 'countMoney' },
    { id: 'rent', task: 2, x: 6, z: -1.2, label: 'Set aside the rent', color: DARK, shape: 'wallet', y: 1.0, act: 'countMoney' },
    { id: 'receipt', task: 2, x: 7, z: -1.2, label: 'Sign the receipt', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'write' },
    { id: 'pJollof', task: 3, x: 11.4, z: -7.9, label: 'Take the jollof', color: RUST, shape: 'plate', y: 1.1 },
    { id: 'pCake', task: 3, x: 13, z: -7.9, label: 'Take the cake', color: '#e0457b', shape: 'cake', y: 1.1 },
    { id: 'pDrink', task: 3, x: 14.6, z: -7.9, label: 'Take the drink', color: BLUE, shape: 'cup', y: 1.1 },
  ],
  sequences: { 2: ['count', 'rent', 'receipt'] },
  talks: { 1: [
    { id: 'danjuma', name: 'Mr Danjuma', x: 2.4, z: 1.4, lines: [sayAs('Mr Danjuma', 'helper', 'Four weeks, no sick days, only two wrong deliveries. Here is your envelope.', 'happy')], rounds: [{ options: [
      { id: 'thanks', label: '"Thank you for giving me the chance."', reply: sayAs('Mr Danjuma', 'helper', 'You earned it. We will talk about a raise at three months.', 'proud') },
      { id: 'proud', label: '"I am proud of my first month."', reply: sayAs('Mr Danjuma', 'helper', 'You should be. Keep it up.', 'happy') },
    ] }] },
    { id: 'kayode', name: 'Kayode', x: 10, z: 1.4, lines: [sayAs('Kayode', 'neighbour', 'First payday! The best day. And the shortest. Enjoy it before the rent eats it.', 'cheeky')] },
  ] },
  serves: { 3: { eatSecs: 3, from: 3, guests: [
    { id: 'chidi', name: 'Mama Chidi', order: 'Jollof', dish: 'pJollof', x: 22, z: -1.6, seat: { x: 15, z: 1.6 }, table: { x: 15, z: 3.0 } },
    { id: 'femi', name: 'Mr Femi', order: 'Cake', dish: 'pCake', x: 22.8, z: 0.6, seat: { x: 17, z: 1.6 }, table: { x: 17, z: 3.0 } },
    { id: 'tobi', name: 'Tobi', order: 'A cold drink', dish: 'pDrink', x: 22, z: 2.8, seat: { x: 19, z: 1.6 }, table: { x: 19, z: 3.0 } },
  ] } },
  goto: [null, null, null, null, RING(23.5, -5, 1.5)],
  guide: [{ x: -19, z: 4, r: 5 }, { x: 6, z: 0.4, r: 5 }, { x: 6, z: -1.2, r: 3 }, { x: 15, z: 0, r: 8 }, RING(23.5, -5)],
  crowd: [],
  npcs: { folake: { x: 24, z: -9, rot: -2.4 }, tunde: { x: 21, z: -9, rot: -2.4 } }, choiceLabel: 'ending',
  endBeat: { text: 'From the balcony the city glows. Somewhere down there is a bus, a market, a lobby and a compound that all know your name now.', line: 'Chapter 1 is done.' },
  starRules: ['Finish the level', 'Finish without a wrong plate or wrong order', 'Finish with no mistakes and no hints'],
})
void YELLOW; void STREET_BOUNDS; void BIG; void ({} as Rect); void sayAs
