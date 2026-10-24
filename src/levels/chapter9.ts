// Chapter 9 "Road Trip": a long weekend drive to Calabar with three friends in an orange camper van. Every level starts with a ride in the van
// and is a different stop on the way: packing, petrol, a wrong turn, a market, a flat tyre, a checkpoint, a lookout, a campsite and the arrival.
import type { Deco } from './schema'
import { L, T, R, F, say, sayAs, D, WOOD, DARK } from './chapter1b'
import { B, TREES, LAMPS, RING, GREEN } from './chapter1c'
import { withBus, type BusOpts } from './bus'

const ORANGE = '#e07a1f', YELLOW = '#f5b91c', RUST = '#c4562a', BLUE = '#2b6ad0', CREAM = '#f3e7cf', DUST = '#d8c9a0', TEAL = '#2a9d8f', RED = '#c9372c'
const ride = (to: string, title: string, why: string, intro: BusOpts['intro'], done: BusOpts['done']): BusOpts => ({ vehicle: 'van', to, title, purpose: `${why}: wait at the van park, board the orange van and ride there.`, objective: `Take the van to ${to}`, success: `You climb out at ${to}.`, intro, done })
const ROAD = (floor: string, extra: Deco[] = []): { floors: { x0: number; x1: number; z0: number; z1: number; color: string }[]; deco: Deco[] } => ({
  floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: floor }],
  deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: CREAM }, ...TREES([[-10, 9], [39, 9]]), ...LAMPS([[8, 6], [28, 6]]), ...extra],
})
const base = { spawn: { x: -9, z: 0 }, resume: { x: -6, z: 2 } }
const BIGB = R(-12, 40, -12.4, 12.4)
const desk = (x: number, color: string, label: string): Deco => ({ kind: 'stall', x, z: 7.4, w: 3.4, d: 1.6, color, label })
const side = { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }
const walkers = (xs: number[], z0 = -2, z1 = 8): ReturnType<typeof D>[] => xs.map((x, i) => D('walker', x, z0, z1, 2.6 + (i % 3) * 0.2, i * 0.6, [GREEN, ORANGE, RUST, BLUE][i % 4]))

// ---------------------------------------------------------------------------------------------------------------- Level 1
const house = B('house', -8, 6, -12, -7, '#f0d9a8', 'HOME', 3.6)
export const LEVEL_C9L1 = withBus(L({
  ch: 'ch9', n: 1, title: 'Packing the Van', next: 'ch9.l2', bounds: BIGB,
  intro: 'Friday, six in the morning. Calabar is nine hours away, the van has no air conditioning and everybody has packed three times too much.',
  theme: { ground: '#bfb393', ...ROAD(DUST, [...house.d, desk(10, ORANGE, 'SNACKS'), desk(20, BLUE, 'MAPS'), desk(30, TEAL, 'WATER'), { kind: 'rug', x: 18, z: 0, w: 28, d: 2, color: '#e0d6b8' }]) },
  furniture: [house.f, F('d1', R(8.3, 11.7, 6.6, 8.2), 1.0, WOOD), F('d2', R(18.3, 21.7, 6.6, 8.2), 1.0, WOOD), F('d3', R(28.3, 31.7, 6.6, 8.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch9.l1', 1, 'collect', 'Collect the supplies', { purpose: 'Snacks, a road map and a crate of water from the three tables.', objective: 'Collect snacks, a map and water', success: 'The supplies are ready.',
      intro: [sayAs('Mama Folake', 'folake', 'Snacks, map, water. In that order. A road trip without water is only a long argument.', 'worried')], done: [say('player', 'Snacks, map, water. I am one sensible person away from a good trip.', 'proud')], hint: 'Follow the three tables along the bottom: SNACKS, MAPS and WATER.' }),
    T('ch9.l1', 2, 'sequence', 'Load the van', { purpose: 'Heavy bag first, then the cooler, then the soft bags on top. Otherwise the bread goes flat.', objective: 'Bag, cooler, then soft bags', success: 'The van is loaded.',
      intro: [sayAs('Uncle Emeka', 'helper', 'Heavy at the bottom, soft on top. I have been loading vans since before you could walk.', 'cheeky')], done: [sayAs('Uncle Emeka', 'helper', 'Good. Not perfect. But the door closes. That is all we ask.', 'happy')], hint: 'Order at the van: heavy bag, cooler, soft bags.' }),
    T('ch9.l1', 3, 'talk', 'Meet your crew', { purpose: 'Three friends are coming along. Say hello to Dayo, Kemi and Ife.', objective: 'Talk to Dayo, Kemi and Ife', success: 'The crew is ready.',
      intro: [say('helper', 'Four people, one van, nine hours. Somebody will sing. Somebody will sleep. Somebody will ask "are we there yet".', 'cheeky')], done: [say('player', 'Dayo has the playlist, Kemi has the snacks and Ife has the opinions. We are set.', 'laughing')], hint: 'Dayo, Kemi and Ife wait along the path near the house.' }),
    T('ch9.l1', 4, 'choose', 'Pick the first playlist', { purpose: 'The first song sets the whole mood. Highlife, afrobeats or gospel?', objective: 'Choose the first playlist', success: 'You choose.',
      intro: [sayAs('Dayo', 'helper', 'The first song matters. It is the national anthem of the van. Choose carefully.', 'cheeky')], done: [say('player', 'Decision made. May the speakers survive.', 'laughing')], hint: 'Three signs on the path: highlife, afrobeats or gospel.' }),
  ],
  items: [
    { id: 'snacks', task: 0, x: 10, z: 7.2, label: 'Take the snacks', color: ORANGE, shape: 'bag', y: 1.05, act: 'grab' },
    { id: 'map', task: 0, x: 20, z: 7.2, label: 'Take the road map', color: '#9ecbe6', shape: 'paper', y: 1.05, act: 'grab' },
    { id: 'water', task: 0, x: 30, z: 7.2, label: 'Take the water', color: BLUE, shape: 'crate', y: 1.05, act: 'carryBox' },
    { id: 'heavy', task: 1, x: 14, z: -2.8, label: 'Load the heavy bag', color: RUST, shape: 'box', y: 0.4, act: 'lift' },
    { id: 'cooler', task: 1, x: 19, z: -2.8, label: 'Load the cooler', color: BLUE, shape: 'box', y: 0.4, act: 'lift' },
    { id: 'soft', task: 1, x: 24, z: -2.8, label: 'Load the soft bags', color: YELLOW, shape: 'bag', y: 0.4, act: 'lift' },
    { id: 'highlife', task: 3, x: 6, z: 2, label: 'Play highlife', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'afro', task: 3, x: 18, z: 2.4, label: 'Play afrobeats', color: GREEN, shape: 'sign', y: 0 },
    { id: 'gospel', task: 3, x: 30, z: 2, label: 'Play gospel', color: BLUE, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['heavy', 'cooler', 'soft'] },
  talks: { 2: [
    { id: 'dayo', name: 'Dayo', x: 4, z: -3, lines: [sayAs('Dayo', 'helper', 'I made a playlist. Forty hours long. We will hear about a third of it.', 'cheeky')], rounds: [{ options: [
      { id: 'great', label: '"Forty hours? Brilliant."', reply: sayAs('Dayo', 'helper', 'See? A person of taste. Ife said it was too long.', 'happy') },
      { id: 'short', label: '"Maybe trim it a little."', reply: sayAs('Dayo', 'helper', 'Trim? I will think about trimming. For a week.', 'suspicious') },
    ] }] },
    { id: 'kemi', name: 'Kemi', x: 16, z: -3, lines: [sayAs('Kemi', 'neighbour', 'I brought snacks for the road. And snacks for the snacks. Do not tell Dayo.', 'cheeky')] },
    { id: 'ife', name: 'Ife', x: 26, z: -3, lines: [sayAs('Ife', 'neighbour', 'I have the map. And a phone with signal. For now. Let us enjoy that.', 'happy')] },
  ] },
  guide: [{ x: 20, z: 7, r: 14 }, { x: 19, z: -2.8, r: 8 }, { x: 16, z: -3, r: 14 }, { x: 18, z: 2, r: 12 }],
  crowd: [{ x: 10, z: 4, rot: 1 }, { x: 24, z: 4, rot: -2 }],
  npcs: side, choiceLabel: 'playlist',
  endBeat: { text: 'The doors slam, the engine coughs and the first song starts. Somewhere behind you Mama Folake is waving a wooden spoon like a flag.', line: 'The first stop is petrol.' },
  starRules: ['Finish the level', 'Finish with no wrong order', 'Finish with no mistakes and no hints'],
}), ride('the driveway', 'Ride to the driveway', 'The trip begins today', [sayAs('Mama Folake', 'folake', 'A road trip! With three friends and one van! Call me when you arrive. And when you stop. And when you start again.', 'worried')], [sayAs('Uncle Emeka', 'helper', 'Welcome to the van. Do not touch the radio. Do not touch the horn. Do not touch my seat.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 2
const station = B('station', 4, 20, -12, -7, '#e8d9c9', 'PETROL STATION', 3.4)
export const LEVEL_C9L2 = withBus(L({
  ch: 'ch9', n: 2, title: 'Petrol Station', next: 'ch9.l3', bounds: BIGB,
  intro: 'The needle is on E and the next station is eighty kilometres away. A queue of cars, a very busy attendant and a pump that shouts numbers.',
  theme: { ground: '#bfb393', ...ROAD('#cfc8b8', [...station.d, desk(12, ORANGE, 'FUEL'), desk(18, BLUE, 'WATER'), desk(24, YELLOW, 'SNACKS'), desk(30, TEAL, 'DRINKS'), { kind: 'sign', x: 8, z: 2, label: 'PUMP 3', w: 1.4 }, { kind: 'rug', x: 26, z: 1, w: 8, d: 3, color: '#a87a50' }]) },
  furniture: [station.f, F('f1', R(10.3, 13.7, 6.6, 8.2), 1.0, WOOD), F('f2', R(16.3, 19.7, 6.6, 8.2), 1.0, WOOD), F('f3', R(22.3, 25.7, 6.6, 8.2), 1.0, WOOD), F('f4', R(28.3, 31.7, 6.6, 8.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch9.l2', 1, 'goto', 'Roll up to the pump', { purpose: 'Park at pump 3 behind the white car.', objective: 'Walk to pump 3', success: 'You are at the pump.',
      intro: [sayAs('Uncle Emeka', 'helper', 'Pump three. Not pump four. Pump four has been broken since the last election.', 'cheeky')], done: [sayAs('Mr Gbenga', 'helper', 'Welcome, welcome! How many litres? How many hours of sleep? Both are low.', 'happy')], hint: 'Follow the ring to PUMP 3.' }),
    T('ch9.l2', 2, 'collect', 'Buy road supplies', { purpose: 'Fuel money, water, snacks and a drink from the shop. You have ₦1,300. You cannot afford everything.', objective: 'Buy 3 things within ₦1,300', success: 'Your bag has three things.',
      intro: [sayAs('Kemi', 'neighbour', 'Fuel, water, snacks, drinks. We need three of the four. Which three? That is the whole road trip.', 'worried')], done: [say('player', 'Fuel, water and a drink. We will beg for snacks.', 'laughing')], hint: 'Pick the cheaper items. Start over if you overspend.' }),
    T('ch9.l2', 3, 'talk', 'Chat to the attendant', { purpose: 'Mr Gbenga knows every road in the south. Ask him which way is fastest.', objective: 'Talk to Mr Gbenga', success: 'You have directions.',
      intro: [say('player', 'Ask politely. Ask twice. Never argue with a man who has a fuel pump.', 'calm')], done: [sayAs('Mr Gbenga', 'helper', 'Take the left at the big mango tree. If the tree is gone, take the left at where it used to be.', 'cheeky')], hint: 'Mr Gbenga stands next to the pumps on the left.' }),
    T('ch9.l2', 4, 'hold', 'Wait while it fills', { purpose: 'The pump is slow. Lean on the van and wait for the tank to fill.', objective: 'Wait for the tank to fill', success: 'The tank is full.',
      intro: [sayAs('Ife', 'neighbour', 'It is filling. Slowly. Like a very polite elephant drinking tea.', 'cheeky')], done: [sayAs('Mr Gbenga', 'helper', 'Full! Safe journey! Do not drive like my cousin! He is a legend. In the wrong way.', 'happy')], hint: 'Stand in the ring by the pump until the count is full.' }),
  ],
  items: [
    { id: 'fuel', task: 1, price: 800, x: 12, z: 7.2, label: 'Buy a fuel can (₦800)', color: RED, shape: 'crate', y: 1.05, act: 'grab' },
    { id: 'water', task: 1, price: 300, x: 18, z: 7.2, label: 'Buy water (₦300)', color: BLUE, shape: 'bottle', y: 1.05, act: 'grab' },
    { id: 'snack', task: 1, price: 400, x: 24, z: 7.2, label: 'Buy snacks (₦400)', color: YELLOW, shape: 'snack', y: 1.05, act: 'grab' },
    { id: 'drink', task: 1, price: 200, x: 30, z: 7.2, label: 'Buy a drink (₦200)', color: GREEN, shape: 'cup', y: 1.05, act: 'grab' },
  ],
  budgets: { 1: { budget: 1300, need: 3 } },
  talks: { 2: [{ id: 'gbenga', name: 'Mr Gbenga', x: 6, z: -2, lines: [sayAs('Mr Gbenga', 'helper', 'Calabar? Far! Very far! The road is bad in two places and worse in three.', 'cheeky')], rounds: [{ options: [
    { id: 'fastest', label: '"Which road is fastest?"', reply: sayAs('Mr Gbenga', 'helper', 'The main one is fastest. Except at the market. At the market you will wait a week.', 'cheeky') },
    { id: 'safest', label: '"Which road is safest?"', reply: sayAs('Mr Gbenga', 'helper', 'The hill road. Slow, but safe. And the view is free.', 'calm') },
  ] }] }] },
  holds: { 3: { x: 26, z: 1, r: 1.2, secs: 6, pose: 'lean' } },
  goto: [RING(8, 4, 1.5), null, null, null],
  guide: [RING(8, 4, 1.5), { x: 21, z: 7, r: 14 }, { x: 6, z: -2, r: 4 }, RING(26, 1, 1.2)],
  crowd: [{ x: 4, z: 6, rot: 1 }, { x: 34, z: 3, rot: -2 }],
  npcs: side, choiceLabel: 'stop',
  endBeat: { text: 'The needle swings to F and Dayo cheers. Mr Gbenga waves you off with a rag the colour of old engine oil.', line: 'A wrong turn is next.' },
  starRules: ['Finish the level', 'Finish with no overspending', 'Finish with no mistakes and no hints'],
}), ride('the petrol station', 'Ride to the petrol station', 'The tank is almost empty', [sayAs('Uncle Emeka', 'helper', 'We are running on prayers and fumes. Mostly fumes. Take the van to the station.', 'worried')], [say('helper', 'The van coughs twice and stops. Right at pump three. Almost as if it planned it.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 3
export const LEVEL_C9L3 = withBus(L({
  ch: 'ch9', n: 3, title: 'Wrong Turn', next: 'ch9.l4', bounds: BIGB,
  intro: 'The phone says go straight. The sign says go left. The goat standing in the middle of the road says nothing, but looks very confident.',
  theme: { ground: '#c4b78a', ...ROAD('#d9c9a0', [{ kind: 'rug', x: 20, z: 3, w: 14, d: 3, color: '#a87a50' }, { kind: 'sign', x: 8, z: -3, label: 'LAGOS', w: 1.2 }, { kind: 'sign', x: 20, z: -3, label: 'IBADAN', w: 1.2 }, { kind: 'sign', x: 32, z: -3, label: 'BENIN', w: 1.2 }, { kind: 'sign', x: 37, z: 2, label: 'VILLAGE', w: 1.8 }]) },
  furniture: [F('b1', R(6, 10, -4.4, -3.4), 1.0, DARK), F('b2', R(18, 22, -4.4, -3.4), 1.0, DARK), F('b3', R(30, 34, -4.4, -3.4), 1.0, DARK)], ...base,
  tasks: [
    T('ch9.l3', 1, 'find', 'Find the right road', { purpose: 'Three roads, three signs. The map says Benin, the signs say otherwise.', objective: 'Find the road to Benin', success: 'You find it.',
      intro: [sayAs('Ife', 'neighbour', 'The map says Benin. The sign says Benin. The phone says "recalculating". I trust the sign.', 'curious')], done: [say('player', 'Benin. Right where the sign said. Funny how that works.', 'happy')], hint: 'Check the three signposts: Lagos, Ibadan and Benin.' }),
    T('ch9.l3', 2, 'choose', 'Ask or guess', { purpose: 'Nobody agrees. Ask a villager, trust the phone or keep driving.', objective: 'Choose how to get unstuck', success: 'You choose.',
      intro: [sayAs('Dayo', 'helper', 'Ask a villager? Trust the phone? Or keep driving until the road forgives us?', 'cheeky')], done: [say('player', 'Decision made. May we not end up in a river.', 'worried')], hint: 'Three signs on the rug: ask, phone or keep driving.' }),
    T('ch9.l3', 3, 'reach', 'Dodge the goats', { purpose: 'A herd of goats is crossing. Slip between them and get to the village sign.', objective: 'Run to the village sign', success: 'You reach the village in time.',
      intro: [sayAs('Kemi', 'neighbour', 'Goats! Everywhere! Goats! They do not care about the road! They own the road!', 'worried')], done: [say('player', 'Through. Not a scratch. A goat looked at me in a very disappointed way.', 'laughing')], hint: 'Cross behind the goats and run right to the VILLAGE sign.' }),
    T('ch9.l3', 4, 'talk', 'Ask the elder', { purpose: 'The village elder has seen every car go the wrong way. Ask him for the real route.', objective: 'Talk to Chief Audu', success: 'You have the real directions.',
      intro: [say('player', 'Be respectful. Be quick. Do not say "recalculating" in front of an elder.', 'worried')], done: [sayAs('Chief Audu', 'helper', 'Go back, take the left and do not trust the machine. The machine does not know my village.', 'cheeky')], hint: 'Chief Audu sits under the tree near the village sign.' }),
  ],
  spots: [
    { id: 'lagos', task: 0, x: 8, z: -2, label: 'Check the Lagos road', wrong: say('player', 'Back to Lagos. A long way round. Not this one.', 'tired') },
    { id: 'ibadan', task: 0, x: 20, z: -2, label: 'Check the Ibadan road', wrong: say('helper', 'Ibadan. A nice city. Nowhere near Benin. Not this one.', 'cheeky') },
    { id: 'benin', task: 0, x: 32, z: -2, label: 'Check the Benin road', right: true },
  ],
  items: [
    { id: 'ask', task: 1, x: 8, z: 3, label: 'Ask a villager', color: GREEN, shape: 'sign', y: 0 },
    { id: 'phone', task: 1, x: 20, z: 3, label: 'Trust the phone', color: BLUE, shape: 'sign', y: 0 },
    { id: 'keep', task: 1, x: 32, z: 3, label: 'Keep driving', color: RED, shape: 'sign', y: 0 },
  ],
  talks: { 3: [{ id: 'audu', name: 'Chief Audu', x: 36, z: -2, lines: [sayAs('Chief Audu', 'helper', 'Calabar? Ha! You are a long way from it, my children. But not too long.', 'cheeky')], rounds: [{ options: [
    { id: 'thanks', label: '"Thank you, Chief. We are grateful."', reply: sayAs('Chief Audu', 'helper', 'Gratitude is free. Do not forget to pay it.', 'calm') },
    { id: 'rush', label: '"How long to the main road?"', reply: sayAs('Chief Audu', 'helper', 'Twenty minutes. For you, thirty. For the goat, never.', 'cheeky') },
  ] }] }] },
  goto: [null, null, RING(36, 4, 1.6), null],
  guide: [{ x: 20, z: -2, r: 14 }, { x: 20, z: 3, r: 14 }, RING(36, 4, 1.6), { x: 36, z: -2, r: 4 }],
  hazards: walkers([10, 16, 22, 28], -2, 8),
  timeLimit: 16,
  crowd: [{ x: 6, z: 6, rot: 1 }],
  npcs: side, choiceLabel: 'way',
  endBeat: { text: 'You turn the van round in a cloud of dust while a goat watches, unimpressed, from the roof of a shed.', line: 'The market is next.' },
  starRules: ['Finish the level', 'Reach the village before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the crossroads', 'Ride to the crossroads', 'The road splits in three', [sayAs('Uncle Emeka', 'helper', 'Which way? I do not know which way. The road has ideas of its own.', 'worried')], [say('helper', 'The van stops at a fork. Three signs, one goat and an ominous silence.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 4
export const LEVEL_C9L4 = withBus(L({
  ch: 'ch9', n: 4, title: 'Roadside Market', next: 'ch9.l5', bounds: BIGB,
  intro: 'Roasted corn, ripe plantain, fresh pineapple and a dozen sellers who all say "my friend, come and see".',
  theme: { ground: '#c4b78a', ...ROAD('#d9c9a0', [{ kind: 'stall', x: 10, z: -9, w: 3.4, d: 1.6, color: ORANGE, label: 'CORN' }, { kind: 'stall', x: 18, z: -9, w: 3.4, d: 1.6, color: YELLOW, label: 'PLANTAIN' }, { kind: 'stall', x: 26, z: -9, w: 3.4, d: 1.6, color: GREEN, label: 'PINEAPPLE' }, { kind: 'stall', x: 34, z: -9, w: 3.4, d: 1.6, color: BLUE, label: 'DRINKS' }, { kind: 'awning', x: 20, z: 3, w: 16, d: 5, color: RUST }, { kind: 'chair', x: 14, z: 4, color: WOOD }, { kind: 'chair', x: 20, z: 4, color: WOOD }, { kind: 'chair', x: 26, z: 4, color: WOOD }, { kind: 'rug', x: 20, z: 5.8, w: 16, d: 2, color: '#e0d6b8' }, { kind: 'sign', x: 37, z: 6, label: 'THE VAN', w: 1.4 }]) },
  furniture: [F('c1', R(8.3, 11.7, -9.8, -8.2), 1.0, WOOD), F('c2', R(16.3, 19.7, -9.8, -8.2), 1.0, WOOD), F('c3', R(24.3, 27.7, -9.8, -8.2), 1.0, WOOD), F('c4', R(32.3, 35.7, -9.8, -8.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch9.l4', 1, 'collect', 'Shop for the road', { purpose: 'Corn, plantain, pineapple and a drink. You have ₦1,100.', objective: 'Buy 3 things within ₦1,100', success: 'You have three things.',
      intro: [sayAs('Mama Nkechi', 'neighbour', 'My friend! Corn! Plantain! Pineapple! Ice-cold drinks! Come and see, come and taste, come and pay!', 'cheeky')], done: [say('player', 'Corn, plantain and a drink. The pineapple winked at me but I was strong.', 'laughing')], hint: 'Pick the cheaper items. Start over if you overspend.' }),
    T('ch9.l4', 2, 'serve', 'Snack time', { purpose: 'Seat your friends under the awning and bring each their snack.', objective: 'Seat and serve three friends', success: 'Everyone is eating.',
      intro: [sayAs('Kemi', 'neighbour', 'Hungry. Starving. Famished. Words cannot explain how hungry I am. Feed me.', 'cheeky')], done: [sayAs('Dayo', 'helper', 'Best corn in Nigeria. I will be telling people about this corn for years.', 'happy')], hint: 'Seat each friend, take their snack from the stall and carry it over.' }),
    T('ch9.l4', 3, 'choose', 'Choose a souvenir', { purpose: 'Mama Nkechi shows you three souvenirs. A bead bracelet, a carved bird or a woven bag.', objective: 'Choose a souvenir', success: 'You choose.',
      intro: [sayAs('Mama Nkechi', 'neighbour', 'A bracelet for your sister. A bird for your mother. A bag for yourself. You may have one.', 'cheeky')], done: [say('player', 'Decision made. May the wallet forgive me.', 'worried')], hint: 'Three signs on the rug: bracelet, bird or bag.' }),
    T('ch9.l4', 4, 'goto', 'Walk back to the van', { purpose: 'The market is long and the van is parked somewhere near the end.', objective: 'Walk to the van', success: 'You reach the van.',
      intro: [say('player', 'Full stomach, full hands. Somewhere out there is a van. Hopefully it is still there.', 'tired')], done: [sayAs('Uncle Emeka', 'helper', 'There you are. I was about to go and find you. With a very big stick.', 'cheeky')], hint: 'Follow the ring to the THE VAN sign.' }),
  ],
  items: [
    { id: 'corn', task: 0, price: 300, x: 10, z: -8.6, label: 'Buy corn (₦300)', color: YELLOW, shape: 'snack', y: 1.05, act: 'grab' },
    { id: 'plantain', task: 0, price: 400, x: 18, z: -8.6, label: 'Buy plantain (₦400)', color: ORANGE, shape: 'plate', y: 1.05, act: 'grab' },
    { id: 'pineapple', task: 0, price: 700, x: 26, z: -8.6, label: 'Buy pineapple (₦700)', color: '#f5d442', shape: 'produce', y: 1.05, act: 'grab' },
    { id: 'drink', task: 0, price: 200, x: 34, z: -8.6, label: 'Buy a drink (₦200)', color: BLUE, shape: 'cup', y: 1.05, act: 'grab' },
    { id: 'sK', task: 1, x: 10.4, z: -7.8, label: 'Take Kemi\'s corn', color: YELLOW, shape: 'snack', y: 1.05 },
    { id: 'sD', task: 1, x: 12, z: -7.8, label: 'Take Dayo\'s plantain', color: ORANGE, shape: 'plate', y: 1.05 },
    { id: 'sI', task: 1, x: 17.4, z: -7.8, label: 'Take Ife\'s pineapple', color: '#f5d442', shape: 'produce', y: 1.05 },
    { id: 'bracelet', task: 2, x: 8, z: 7.6, label: 'Choose the bracelet', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'bird', task: 2, x: 18, z: 7.6, label: 'Choose the carved bird', color: GREEN, shape: 'sign', y: 0 },
    { id: 'bag', task: 2, x: 28, z: 7.6, label: 'Choose the woven bag', color: BLUE, shape: 'sign', y: 0 },
  ],
  budgets: { 0: { budget: 1100, need: 3 } },
  serves: { 1: { eatSecs: 3, from: 1, guests: [
    { id: 'kemi', name: 'Kemi', order: 'Roasted corn', dish: 'sK', x: 0, z: 4, seat: { x: 14, z: 4 }, table: { x: 14, z: 2.4 } },
    { id: 'dayo', name: 'Dayo', order: 'Fried plantain', dish: 'sD', x: 2, z: 7, seat: { x: 20, z: 4 }, table: { x: 20, z: 2.4 } },
    { id: 'ife', name: 'Ife', order: 'Pineapple slices', dish: 'sI', x: -2, z: 8, seat: { x: 26, z: 4 }, table: { x: 26, z: 2.4 } },
  ] } },
  goto: [null, null, null, RING(36, 6, 1.6)],
  guide: [{ x: 22, z: -6, r: 16 }, { x: 14, z: 0, r: 12 }, { x: 18, z: 7.6, r: 12 }, RING(36, 6, 1.6)],
  crowd: [{ x: 30, z: 0, rot: 3 }],
  npcs: side, choiceLabel: 'souvenir',
  endBeat: { text: 'You drive out of the market with a bag of corn, a bracelet and a seller waving a pineapple at you like a flag.', line: 'The road gets bumpy.' },
  starRules: ['Finish the level', 'Finish with no overspending', 'Finish with no mistakes and no hints'],
}), ride('the roadside market', 'Ride to the market', 'Everybody is hungry', [sayAs('Kemi', 'neighbour', 'I smell corn. Real corn. Roasted corn. Pull over. Pull over! PULL OVER!', 'angry')], [sayAs('Mama Nkechi', 'neighbour', 'Welcome, my friends! Welcome! Come and see! Come and taste! Come and buy!', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 5
export const LEVEL_C9L5 = withBus(L({
  ch: 'ch9', n: 5, title: 'Flat Tyre', next: 'ch9.l6', bounds: BIGB,
  intro: 'Thump, thump, thump. The van limps to a stop on a dusty stretch of road. The spare is somewhere in the back. Under everything.',
  theme: { ground: '#c4b78a', ...ROAD('#d9c9a0', [{ kind: 'sign', x: 37, z: 2, label: 'GARAGE', w: 1.8 }, { kind: 'crate', x: 8, z: -3, w: 1.4, d: 1.4, h: 1.0, color: '#a87a50' }, { kind: 'crate', x: 20, z: -3, w: 1.4, d: 1.4, h: 1.0, color: RUST }, { kind: 'crate', x: 32, z: -3, w: 1.4, d: 1.4, h: 1.0, color: BLUE }, { kind: 'rug', x: 18, z: 4, w: 10, d: 3, color: '#a87a50' }]) },
  furniture: [F('van', R(14, 22, -8, -5.6), 1.7, ORANGE), F('c1', R(7.3, 8.7, -3.7, -2.3), 1.0, WOOD), F('c2', R(19.3, 20.7, -3.7, -2.3), 1.0, WOOD), F('c3', R(31.3, 32.7, -3.7, -2.3), 1.0, WOOD)], ...base,
  tasks: [
    T('ch9.l5', 1, 'sequence', 'Change the wheel', { purpose: 'Loosen the nuts, jack up the van, then swap the wheel. Do it in this order or it rolls away.', objective: 'Loosen, jack, then swap', success: 'The wheel is changed.',
      intro: [sayAs('Uncle Emeka', 'helper', 'Loosen first. Jack second. Swap third. If you jack first, the van will teach you a lesson.', 'cheeky')], done: [sayAs('Uncle Emeka', 'helper', 'Not bad. Next time, do not name the wheel. It is only a wheel.', 'happy')], hint: 'Order at the van: nuts, jack, then spare wheel.' }),
    T('ch9.l5', 2, 'hold', 'Tighten the nuts', { purpose: 'Crouch and hold the wrench steady while Uncle Emeka lowers the jack.', objective: 'Hold the wrench steady', success: 'The wheel is tight.',
      intro: [sayAs('Uncle Emeka', 'helper', 'Hold it. Hold it! Do not let go. Do not even breathe. Okay, breathe.', 'angry')], done: [sayAs('Uncle Emeka', 'helper', 'Done! The van is whole again. You may now worship the wrench.', 'happy')], hint: 'Stand in the ring by the wheel until the count is full.' }),
    T('ch9.l5', 3, 'find', 'Find the lost nut', { purpose: 'One wheel nut rolled into the dust. Check the three crates for it.', objective: 'Find the lost nut', success: 'You find it.',
      intro: [say('player', 'It was here a second ago. It cannot have gone far. It is a nut. Nuts do not travel.', 'worried')], done: [say('player', 'Under the crate. Naturally. Where else would a nut hide?', 'laughing')], hint: 'Check the three crates along the top.' }),
    T('ch9.l5', 4, 'reach', 'Run for help', { purpose: 'The jack is stuck. Run to the garage down the road and fetch the mechanic.', objective: 'Run to the garage', success: 'You reach the garage in time.',
      intro: [sayAs('Dayo', 'helper', 'The garage! It is just down there! Go! Go! I will keep the van company!', 'worried')], done: [say('player', 'Here. Out of breath. Covered in dust. Please help us.', 'tired')], hint: 'Cross behind the cars and run right to the GARAGE sign.' }),
  ],
  items: [
    { id: 'nuts', task: 0, x: 15, z: -4.6, label: 'Loosen the nuts', color: '#8a8a92', shape: 'box', y: 0.3, act: 'crank' },
    { id: 'jack', task: 0, x: 18, z: -4.6, label: 'Jack up the van', color: ORANGE, shape: 'box', y: 0.3, act: 'crank' },
    { id: 'spare', task: 0, x: 21, z: -4.6, label: 'Swap in the spare', color: '#1c1b22', shape: 'box', y: 0.4, act: 'lift' },
  ],
  spots: [
    { id: 'c1', task: 2, x: 8, z: -1.8, label: 'Check the left crate', wrong: say('helper', 'Empty bottles and a very old sandwich. Not this one.', 'cheeky') },
    { id: 'c2', task: 2, x: 20, z: -1.8, label: 'Check the middle crate', right: true },
    { id: 'c3', task: 2, x: 32, z: -1.8, label: 'Check the right crate', wrong: say('player', 'A tin of paint and a frog. The frog is not happy. Not this one.', 'tired') },
  ],
  sequences: { 0: ['nuts', 'jack', 'spare'] },
  holds: { 1: { x: 18, z: 4, r: 1.2, secs: 6, pose: 'crank' } },
  goto: [null, null, null, RING(36, 4, 1.6)],
  guide: [{ x: 18, z: -4, r: 8 }, RING(18, 4, 1.2), { x: 20, z: -2, r: 14 }, RING(36, 4, 1.6)],
  hazards: walkers([8, 14, 22, 28], -2, 8),
  timeLimit: 16,
  crowd: [{ x: 6, z: 6, rot: 1 }],
  npcs: side, choiceLabel: 'fix',
  endBeat: { text: 'The wheel is on, the jack is back in its bag and Uncle Emeka is wiping his hands on a rag older than you.', line: 'The checkpoint is next.' },
  starRules: ['Finish the level', 'Reach the garage before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the roadside', 'Ride to the roadside', 'The van is limping', [sayAs('Uncle Emeka', 'helper', 'That thump is not a pothole. That thump is a flat. I can feel it in my bones.', 'worried')], [say('helper', 'The van lurches onto the verge and stops. The engine sighs. Everyone gets out slowly.', 'tired')]))

// ---------------------------------------------------------------------------------------------------------------- Level 6
const gate = B('gate', 10, 30, -12, -7, '#e8d9c9', 'CHECKPOINT', 3.4)
export const LEVEL_C9L6 = withBus(L({
  ch: 'ch9', n: 6, title: 'Border Checkpoint', next: 'ch9.l7', bounds: BIGB,
  intro: 'A rope across the road, a man in uniform and a queue that smells of hot engines. The rule is simple: be polite, have your papers and do not make jokes.',
  theme: { ground: '#bfb393', ...ROAD('#d4cdb8', [...gate.d, { kind: 'rug', x: 20, z: 3, w: 12, d: 3, color: '#6a6258' }, { kind: 'sign', x: 37, z: 2, label: 'EXIT', w: 1.2 }]) },
  furniture: [gate.f, F('desk', R(10, 30, -3.4, -2), 0.9, WOOD), F('rope', R(14, 26, 7.4, 8.0), 0.6, '#c9372c')], ...base,
  tasks: [
    T('ch9.l6', 1, 'talk', 'Meet the officer', { purpose: 'Officer Bako checks every vehicle. Say good morning to him and two other travellers.', objective: 'Talk to Officer Bako and two travellers', success: 'You are in the queue.',
      intro: [say('helper', 'Good manners cost nothing. Bad manners cost an hour at the checkpoint.', 'cheeky')], done: [say('player', 'Polite, calm, no jokes. We are a very boring van. Perfect.', 'laughing')], hint: 'Officer Bako and two travellers wait along the path near the gate.' }),
    T('ch9.l6', 2, 'find', 'Find your papers', { purpose: 'Where are the vehicle papers? One of the three folders on the table is yours.', objective: 'Find the vehicle papers', success: 'You find them.',
      intro: [sayAs('Uncle Emeka', 'helper', 'The papers! Where are the papers? They were here a moment ago. Did somebody sit on them?', 'worried')], done: [sayAs('Uncle Emeka', 'helper', 'Found them. Slightly crumpled. Completely legal.', 'happy')], hint: 'Check the three folders on the desk.' }),
    T('ch9.l6', 3, 'sequence', 'Clear the check', { purpose: 'Show the papers, open the boot, then sign the register. In that order.', objective: 'Papers, boot, then sign', success: 'You clear the check.',
      intro: [sayAs('Officer Bako', 'helper', 'Papers first. Boot second. Signature last. Do not argue with the order. It is a good order.', 'calm')], done: [sayAs('Officer Bako', 'helper', 'Good. Clean papers, clean boot, clean pen. Safe travels.', 'happy')], hint: 'Order at the desk: papers, boot, register.' }),
    T('ch9.l6', 4, 'choose', 'What to declare', { purpose: 'The officer asks if you carry anything to declare. Be honest.', objective: 'Choose what to say', success: 'You choose.',
      intro: [sayAs('Officer Bako', 'helper', 'Anything to declare? Food? Drink? A very large goat?', 'cheeky')], done: [say('player', 'Decision made. May the officer be in a good mood.', 'worried')], hint: 'Three signs on the rug: snacks, souvenirs or nothing.' }),
  ],
  talks: { 0: [
    { id: 'bako', name: 'Officer Bako', x: 8, z: 2, lines: [sayAs('Officer Bako', 'helper', 'Good morning. Where are you going? Where are you from? Where is your smile?', 'calm')], rounds: [{ options: [
      { id: 'calabar', label: '"Calabar, sir. For a holiday."', reply: sayAs('Officer Bako', 'helper', 'A holiday! Good. Enjoy it. Do not forget to come back.', 'happy') },
      { id: 'friends', label: '"We are four friends on a road trip."', reply: sayAs('Officer Bako', 'helper', 'Four friends. One van. Best way to find out who is a real friend.', 'cheeky') },
    ] }] },
    { id: 't1', name: 'Mr Okon', x: 18, z: 2, lines: [sayAs('Mr Okon', 'neighbour', 'Forty minutes I have been here. Forty! The man in front has a dispute with the officer about a chicken.', 'worried')] },
    { id: 't2', name: 'Mrs Eze', x: 28, z: 2, lines: [sayAs('Mrs Eze', 'neighbour', 'Please do not look at the officer too long. He gets suspicious. He gets suspicious of everybody.', 'cheeky')] },
  ] },
  spots: [
    { id: 'f1', task: 1, x: 14, z: -1.4, label: 'Check the left folder', wrong: say('helper', 'Insurance papers for a motorbike. Not this one.', 'cheeky') },
    { id: 'f2', task: 1, x: 20, z: -1.4, label: 'Check the middle folder', wrong: say('player', 'Receipts from three different mechanics. Not this one.', 'tired') },
    { id: 'f3', task: 1, x: 26, z: -1.4, label: 'Check the right folder', right: true },
  ],
  items: [
    { id: 'papers', task: 2, x: 13, z: -2.6, label: 'Show the papers', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'handOver' },
    { id: 'boot', task: 2, x: 20, z: -2.6, label: 'Open the boot', color: ORANGE, shape: 'box', y: 1.0, act: 'lift' },
    { id: 'sign', task: 2, x: 27, z: -2.6, label: 'Sign the register', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'write' },
    { id: 'snacks', task: 3, x: 8, z: 7.6, label: 'Declare the snacks', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'souv', task: 3, x: 18, z: 7.6, label: 'Declare the souvenirs', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'none', task: 3, x: 28, z: 7.6, label: 'Declare nothing', color: GREEN, shape: 'sign', y: 0 },
  ],
  sequences: { 2: ['papers', 'boot', 'sign'] },
  guide: [{ x: 18, z: 2, r: 14 }, { x: 20, z: -1.4, r: 10 }, { x: 20, z: -2.6, r: 8 }, { x: 18, z: 7.6, r: 12 }],
  crowd: [{ x: 34, z: 6, rot: -2 }],
  npcs: side, choiceLabel: 'declaration',
  endBeat: { text: 'The rope drops, the officer waves and the van rolls across a line that is only visible on a map.', line: 'The mountain is next.' },
  starRules: ['Finish the level', 'Finish with no wrong folders', 'Finish with no mistakes and no hints'],
}), ride('the checkpoint', 'Ride to the checkpoint', 'The queue is two kilometres long', [sayAs('Uncle Emeka', 'helper', 'Checkpoint. Sit up. Smile. Take your hands out of your pockets. Do not make jokes.', 'worried')], [say('helper', 'A rope across the road. A man with a clipboard. A very long silence.', 'calm')]))

// ---------------------------------------------------------------------------------------------------------------- Level 7
export const LEVEL_C9L7 = withBus(L({
  ch: 'ch9', n: 7, title: 'Mountain Lookout', next: 'ch9.l8', bounds: BIGB,
  intro: 'The road climbs, the engine groans and then, round a bend, the whole valley opens like a green blanket. Even Dayo stops talking.',
  theme: { ground: '#9aa88a', ...ROAD('#c8d0b0', [{ kind: 'rug', x: 18, z: 4, w: 10, d: 3, color: '#b0a078' }, { kind: 'sign', x: 37, z: 4, label: 'LOOKOUT', w: 1.6 }, { kind: 'tree', x: 4, z: -4 }, { kind: 'tree', x: 30, z: -5 }]) },
  furniture: [F('rock1', R(10, 14, -4, -2.6), 1.0, '#8a8a82'), F('rock2', R(18, 22, -4, -2.6), 1.0, '#8a8a82'), F('rock3', R(26, 30, -4, -2.6), 1.0, '#8a8a82')], ...base,
  tasks: [
    T('ch9.l7', 1, 'reach', 'Climb to the lookout', { purpose: 'The trail is steep and crowded with walkers. Weave through them and reach the lookout.', objective: 'Run to the lookout', success: 'You reach the top in time.',
      intro: [sayAs('Ife', 'neighbour', 'Hurry! The sun is about to hit the valley! Do not miss it! I would never forgive you!', 'happy')], done: [say('player', 'Top. Out of breath. Heart pounding. The view is still catching up.', 'laughing')], hint: 'Cross behind the walkers and run right to the LOOKOUT sign.' }),
    T('ch9.l7', 2, 'hold', 'Take the photo', { purpose: 'Hold the camera steady while the sun climbs over the valley.', objective: 'Hold the camera steady', success: 'You get the photo.',
      intro: [sayAs('Kemi', 'neighbour', 'Steady... steady... do not shake! If you shake it, it becomes a painting. A bad one.', 'cheeky')], done: [say('player', 'Click. A perfect photo. Slightly crooked. Still the best of the trip.', 'proud')], hint: 'Stand in the ring at the edge until the count is full.' }),
    T('ch9.l7', 3, 'talk', 'Ask the guide', { purpose: 'A local guide knows the secret spots. Ask him about the waterfall.', objective: 'Talk to the guide', success: 'You know where it is.',
      intro: [say('player', 'Guides always know a secret. They never say it for free. Smile.', 'cheeky')], done: [sayAs('Guide Edet', 'helper', 'Follow the sound of water. Water does not lie. Even to tourists.', 'calm')], hint: 'Guide Edet stands near the rocks at the top.' }),
    T('ch9.l7', 4, 'find', 'Find the waterfall', { purpose: 'Three paths lead off the lookout. Only one ends at the waterfall.', objective: 'Find the waterfall path', success: 'You find it.',
      intro: [sayAs('Guide Edet', 'helper', 'Left is the cliff. Right is the goat. The middle is the waterfall. Or is it the other way round?', 'cheeky')], done: [say('player', 'Water. Cold. Loud. Perfect. Nobody say anything. Just listen.', 'happy')], hint: 'Check the three rocks: left, middle and right.' }),
  ],
  spots: [
    { id: 'l', task: 3, x: 12, z: -1.8, label: 'Check the left path', wrong: say('player', 'A cliff. A very big cliff. Not this one.', 'worried') },
    { id: 'm', task: 3, x: 20, z: -1.8, label: 'Check the middle path', right: true },
    { id: 'r', task: 3, x: 28, z: -1.8, label: 'Check the right path', wrong: say('helper', 'A goat. A very smug goat. Not this one.', 'cheeky') },
  ],
  talks: { 2: [{ id: 'edet', name: 'Guide Edet', x: 8, z: 3, lines: [sayAs('Guide Edet', 'helper', 'Welcome! The valley is yours. The waterfall is mine. I will tell you where it is for a small fee.', 'cheeky')], rounds: [{ options: [
    { id: 'pay', label: '"How small is the fee?"', reply: sayAs('Guide Edet', 'helper', 'A smile and a promise to say nice things. Cheap, is it not?', 'happy') },
    { id: 'ask', label: '"Is it far from here?"', reply: sayAs('Guide Edet', 'helper', 'Ten minutes for me. Twenty for you. Thirty for your friend with the playlist.', 'cheeky') },
  ] }] }] },
  holds: { 1: { x: 18, z: 4, r: 1.2, secs: 6, pose: 'photo' } },
  goto: [RING(36, 4, 1.6), null, null, null],
  guide: [RING(36, 4, 1.6), RING(18, 4, 1.2), { x: 8, z: 3, r: 4 }, { x: 20, z: -1.8, r: 14 }],
  hazards: walkers([8, 14, 20, 28], -2, 8),
  timeLimit: 16,
  crowd: [{ x: 6, z: 6, rot: 1 }, { x: 32, z: 7, rot: -2 }],
  npcs: side, choiceLabel: 'view',
  endBeat: { text: 'Someone says "wow" and nobody laughs. The valley is quiet, the sun is warm and the van can wait.', line: 'Camp is next.' },
  starRules: ['Finish the level', 'Reach the lookout before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the mountain road', 'Ride to the mountain', 'The view is calling', [sayAs('Ife', 'neighbour', 'Look at that road! It goes up and up and up! This is the best part of the whole trip!', 'happy')], [say('helper', 'The van wheezes to the top. Somewhere in the valley a cloud sits like a tired sheep.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 8
export const LEVEL_C9L8 = withBus(L({
  ch: 'ch9', n: 8, title: 'The Campsite', next: 'ch9.l9', bounds: BIGB,
  intro: 'Dusk. A flat field, a river nearby and a sky turning purple. Everyone has an opinion on where the tent should go.',
  theme: { ground: '#8a9a6a', ...ROAD('#b8c490', [{ kind: 'rug', x: 18, z: 4, w: 10, d: 3, color: '#6a5a3a' }, { kind: 'chair', x: 14, z: 4, color: WOOD }, { kind: 'chair', x: 18, z: 4, color: WOOD }, { kind: 'chair', x: 22, z: 4, color: WOOD }, { kind: 'rug', x: 32, z: 0, w: 8, d: 3, color: '#3a5a6a' }, { kind: 'chair', x: 32, z: 0, color: DARK }, { kind: 'tree', x: 4, z: -6 }, { kind: 'tree', x: 36, z: -6 }]) },
  furniture: [F('pile', R(8, 12, -3, -1.6), 0.8, '#8a6a3a'), F('tent', R(18, 26, -6, -3), 1.2, '#d95c3a'), F('pot', R(10, 24, 7.4, 8.4), 0.9, WOOD)], ...base,
  tasks: [
    T('ch9.l8', 1, 'collect', 'Gather firewood', { purpose: 'Sticks, a log and some dry leaves from around the field.', objective: 'Collect sticks, a log and leaves', success: 'You have enough for a fire.',
      intro: [sayAs('Uncle Emeka', 'helper', 'Dry sticks, a thick log and dry leaves. Wet wood only makes smoke. And arguments.', 'cheeky')], done: [say('player', 'Sticks, log and leaves. A small mountain of fire in the making.', 'proud')], hint: 'Take the three items from around the edge of the field.' }),
    T('ch9.l8', 2, 'sequence', 'Pitch the tent', { purpose: 'Lay the groundsheet, then put up the poles, then hammer the pegs.', objective: 'Sheet, poles, then pegs', success: 'The tent is up.',
      intro: [sayAs('Kemi', 'neighbour', 'Sheet. Poles. Pegs. I read the instructions. They are in a language I do not speak.', 'worried')], done: [sayAs('Dayo', 'helper', 'It looks like a tent. It stands like a tent. I will not sit in it. Not yet.', 'cheeky')], hint: 'Order at the tent: sheet, poles, pegs.' }),
    T('ch9.l8', 3, 'serve', 'Dinner by the fire', { purpose: 'Seat your friends around the fire and bring each a bowl of stew.', objective: 'Seat and serve three friends', success: 'Everyone is eating.',
      intro: [sayAs('Ife', 'neighbour', 'Stew by the fire, under the stars. If this is not heaven, it is a very good rental.', 'happy')], done: [sayAs('Kemi', 'neighbour', 'The best meal of the whole trip. And I have eaten at three restaurants.', 'happy')], hint: 'Seat each friend, take their bowl from the pot and carry it over.' }),
    T('ch9.l8', 4, 'hold', 'Watch the stars', { purpose: 'Lie back and look at the sky. There are more stars than you ever see in the city.', objective: 'Sit and watch the stars', success: 'You have watched them.',
      intro: [say('player', 'So many stars. So many. I did not know the sky was this crowded.', 'happy')], done: [say('player', 'I could stay here forever. Or until the mosquitoes find me. Whichever comes first.', 'laughing')], hint: 'Stand in the ring on the blue rug until the count is full.' }),
  ],
  items: [
    { id: 'sticks', task: 0, x: 6, z: 8, label: 'Pick up sticks', color: '#8a6a3a', shape: 'box', y: 0.2, act: 'pickLow' },
    { id: 'log', task: 0, x: 18, z: -9, label: 'Carry the log', color: '#6a4a2a', shape: 'box', y: 0.3, act: 'carryBox' },
    { id: 'leaves', task: 0, x: 34, z: 8, label: 'Gather dry leaves', color: '#c8a050', shape: 'bag', y: 0.2, act: 'pickLow' },
    { id: 'sheet', task: 1, x: 18, z: -2.4, label: 'Lay the groundsheet', color: BLUE, shape: 'blanket', y: 0.3, act: 'wipe' },
    { id: 'poles', task: 1, x: 22, z: -2.4, label: 'Raise the poles', color: '#8a8a92', shape: 'ladder', y: 0.5, act: 'reachHigh' },
    { id: 'pegs', task: 1, x: 26, z: -2.4, label: 'Hammer the pegs', color: RUST, shape: 'box', y: 0.2, act: 'pickLow' },
    { id: 'bK', task: 2, x: 12, z: 6.4, label: 'Take Kemi\'s bowl', color: RUST, shape: 'plate', y: 1.0 },
    { id: 'bD', task: 2, x: 17, z: 6.4, label: 'Take Dayo\'s bowl', color: ORANGE, shape: 'plate', y: 1.0 },
    { id: 'bI', task: 2, x: 22, z: 6.4, label: 'Take Ife\'s bowl', color: GREEN, shape: 'plate', y: 1.0 },
  ],
  sequences: { 1: ['sheet', 'poles', 'pegs'] },
  serves: { 2: { eatSecs: 3, from: 2, guests: [
    { id: 'kemi', name: 'Kemi', order: 'Pepper stew', dish: 'bK', x: 4, z: 6, seat: { x: 14, z: 4 }, table: { x: 14, z: 2.4 } },
    { id: 'dayo', name: 'Dayo', order: 'Stew and bread', dish: 'bD', x: 8, z: 8, seat: { x: 18, z: 4 }, table: { x: 18, z: 2.4 } },
    { id: 'ife', name: 'Ife', order: 'Mild stew', dish: 'bI', x: 2, z: 8, seat: { x: 22, z: 4 }, table: { x: 22, z: 2.4 } },
  ] } },
  holds: { 3: { x: 32, z: 0, r: 1.0, secs: 7, pose: 'sit' } },
  guide: [{ x: 18, z: 0, r: 20 }, { x: 22, z: -2.4, r: 8 }, { x: 18, z: 5, r: 10 }, RING(32, 0, 1.0)],
  crowd: [{ x: 30, z: 6, rot: -2 }],
  npcs: side, choiceLabel: 'camp',
  endBeat: { text: 'The fire pops, the river whispers and the stars come out one by one like somebody is switching on very distant lights.', line: 'The last stretch is next.' },
  starRules: ['Finish the level', 'Finish with no wrong order', 'Finish with no mistakes and no hints'],
}), ride('the campsite', 'Ride to the campsite', 'The sun is setting', [sayAs('Uncle Emeka', 'helper', 'Sun is going down. Find a flat field, find a river and find your patience. In that order.', 'calm')], [say('helper', 'The van rolls onto soft grass. The engine stops. For the first time all day it is quiet.', 'calm')]))

// ---------------------------------------------------------------------------------------------------------------- Level 9
export const LEVEL_C9L9 = withBus(L({
  ch: 'ch9', n: 9, title: 'Arrival in Calabar', next: null, badge: 'Road Trip', bounds: BIGB,
  intro: 'Nine hours, two wrong turns, one flat tyre and a thousand songs later, a sign says CALABAR. Nobody in the van says anything. Everybody is smiling.',
  theme: { ground: '#bfb393', ...ROAD('#e0d8b8', [{ kind: 'awning', x: 14, z: 3, w: 12, d: 5, color: ORANGE }, { kind: 'rug', x: 14, z: 3, w: 10, d: 3, color: '#c4562a' }, { kind: 'rug', x: 30, z: 0, w: 8, d: 3, color: BLUE }, { kind: 'sign', x: 37, z: -4, label: 'THE BEACH', w: 1.8 }, { kind: 'tree', x: 26, z: -5 }]) },
  furniture: [F('buffet', R(8, 20, -8.6, -7.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch9.l9', 1, 'talk', 'Greet your hosts', { purpose: 'Aunty Efe and her two kids are waiting at the gate. Say hello to everyone.', objective: 'Talk to Aunty Efe and the kids', success: 'You are welcome.',
      intro: [say('player', 'We are here. We are actually here. Somebody pinch me. Not hard.', 'happy')], done: [say('player', 'Aunty Efe, Bassey and Ita. Hugged, kissed and fed. All in four minutes.', 'laughing')], hint: 'Aunty Efe, Bassey and Ita stand along the path.' }),
    T('ch9.l9', 2, 'hold', 'Group photo', { purpose: 'Everybody squeezes in for a picture in front of the sign. Hold still and smile.', objective: 'Hold the pose for the photo', success: 'The photo is taken.',
      intro: [sayAs('Aunty Efe', 'neighbour', 'Closer! Closer! Everybody! Dayo, smile with your mouth, not your eyebrows!', 'cheeky')], done: [sayAs('Aunty Efe', 'neighbour', 'Perfect! Terrible, but perfect. It will go on the fridge forever.', 'happy')], hint: 'Stand in the ring on the blue rug until the photo is taken.' }),
    T('ch9.l9', 3, 'choose', 'Where to eat first', { purpose: 'Calabar has the best food in the country. Afang soup, fisherman\'s soup or edikang ikong?', objective: 'Choose the first meal', success: 'You choose.',
      intro: [sayAs('Bassey', 'helper', 'Afang! Fisherman! Edikang! Pick one! Hunger is the worst travel companion!', 'cheeky')], done: [say('player', 'Decision made. May the plate be big.', 'happy')], hint: 'Three signs on the rug: afang, fisherman\'s soup or edikang ikong.' }),
    T('ch9.l9', 4, 'goto', 'Walk to the beach', { purpose: 'The last walk of the trip: down the sandy path to the water.', objective: 'Walk to the beach', success: 'You are at the beach.',
      intro: [sayAs('Ita', 'neighbour', 'Come! The sea is this way! It will not wait! The tide is very impatient!', 'happy')], done: [say('player', 'Sea. Sand. Friends. A van behind us that deserves a medal.', 'proud')], hint: 'The beach is at the top right.' }),
  ],
  talks: { 0: [
    { id: 'efe', name: 'Aunty Efe', x: 4, z: -2, lines: [sayAs('Aunty Efe', 'neighbour', 'You are thin! Too thin! Sit down! Eat! Sleep! Then eat again!', 'cheeky')], rounds: [{ options: [
      { id: 'thanks', label: '"Thank you for having us, Aunty."', reply: sayAs('Aunty Efe', 'neighbour', 'Having you? You are family! Family does not say thank you. Family eats.', 'happy') },
      { id: 'tired', label: '"We have been driving for nine hours."', reply: sayAs('Aunty Efe', 'neighbour', 'Nine hours! Mercy! Food first. Then a bath. Then more food.', 'worried') },
    ] }] },
    { id: 'bassey', name: 'Bassey', x: 12, z: -2, lines: [sayAs('Bassey', 'helper', 'Did you bring music? Games? Gifts? Anything? I am very easily bribed.', 'cheeky')] },
    { id: 'ita', name: 'Ita', x: 20, z: -2, lines: [sayAs('Ita', 'neighbour', 'Mama said you would be late. She said the van was too old. She did not say "too slow".', 'curious')] },
  ] },
  items: [
    { id: 'afang', task: 2, x: 8, z: 7.6, label: 'Choose afang soup', color: GREEN, shape: 'sign', y: 0 },
    { id: 'fisher', task: 2, x: 18, z: 7.6, label: 'Choose fisherman\'s soup', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'edikang', task: 2, x: 28, z: 7.6, label: 'Choose edikang ikong', color: BLUE, shape: 'sign', y: 0 },
  ],
  holds: { 1: { x: 30, z: 0, r: 1.2, secs: 6, pose: 'cheer' } },
  goto: [null, null, null, RING(36, -2, 1.6)],
  guide: [{ x: 12, z: -2, r: 14 }, RING(30, 0, 1.2), { x: 18, z: 7.6, r: 12 }, RING(36, -2, 1.6)],
  crowd: [{ x: 26, z: 5, rot: -2 }, { x: 34, z: 4, rot: -2 }],
  npcs: { folake: { x: 38, z: 8, rot: -2.4 }, tunde: { x: 34, z: 9, rot: -2.4 } }, choiceLabel: 'feast',
  endBeat: { text: 'The sea rolls in, the sun rolls out and four friends sit on warm sand with their shoes in their hands. The van waits at the top of the path, dusty and proud.', line: 'Chapter 9 is done.' },
  starRules: ['Finish the level', 'Finish with no wrong turn', 'Finish with no mistakes and no hints'],
}), ride('Calabar', 'Ride into Calabar', 'The last stretch', [sayAs('Uncle Emeka', 'helper', 'Calabar. I can smell the sea. Or the fish market. Either way, we are close.', 'happy')], [say('helper', 'The van rolls through the gates and stops. Uncle Emeka pats the dashboard like a tired horse.', 'happy')]))
void RED; void TEAL; void YELLOW; void BLUE; void RUST; void ORANGE; void DUST; void DARK; void CREAM
