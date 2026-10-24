// Chapter 4 "Kitchen Rush": a new cook's week in Mama Folake's restaurant. A ferry takes you to work each day. The kitchen is on the left, the dining room on the
// right, and a shop beyond. Every level is a different day with a different mix of tasks.
import type { Deco, Furn } from './schema'
import { L, T, R, F, say, sayAs, D, WOOD, DARK } from './chapter1b'
import { TREES, LAMPS, RING, GREEN } from './chapter1c'
import { withBus, type BusOpts } from './bus'

const ORANGE = '#e07a1f', YELLOW = '#f5b91c', RUST = '#c4562a', BLUE = '#2b6ad0', STEEL = '#9aa3a8', CREAM = '#f3e7cf'
const sail = (to: string, title: string, why: string, intro: BusOpts['intro'], done: BusOpts['done']): BusOpts => ({ vehicle: 'ferry', to, title, purpose: `${why}: wait at the dock, board the ferry and sail there.`, objective: `Take the ferry to ${to}`, success: `You step off at ${to}.`, intro, done })
const REST = (extra: Deco[] = []): { floors: { x0: number; x1: number; z0: number; z1: number; color: string }[]; deco: Deco[] } => ({
  floors: [{ x0: -12, x1: 14, z0: -12, z1: 12, color: '#e6e0d0' }, { x0: 14, x1: 40, z0: -12, z1: 12, color: '#d8b98a' }],
  deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: CREAM }, { kind: 'sign', x: 0, z: -6.2, label: 'KITCHEN', w: 2.2 }, { kind: 'sign', x: 27, z: -6.2, label: 'DINING', w: 2 }, ...TREES([[39, 10]]), ...LAMPS([[14, 8]]), ...extra],
})
const stove = (): Furn => F('stove', R(-6, -1.8, -10, -8.8), 1.0, STEEL)
const prep = (): Furn => F('prep', R(2, 6, -10, -8.8), 0.95, WOOD)
const pass = (): Furn => F('pass', R(8, 13, -10, -8.8), 1.0, DARK)
const sink = (): Furn => F('sink', R(-10, -7.8, 6, 7.4), 0.95, '#6a8ab8')
const base = { spawn: { x: -9, z: 0 }, resume: { x: -6, z: 2 } }

// ---------------------------------------------------------------------------------------------------------------- Level 1
export const LEVEL_C4L1 = withBus(L({
  ch: 'ch4', n: 1, title: 'Opening the Kitchen', next: 'ch4.l2', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'Mama Folake has a restaurant. Today you are the new hand in her kitchen, and the dinner rush is six hours away.',
  theme: { ground: '#cfc4a8', ...REST([{ kind: 'sign', x: 37, z: 0, label: 'DELIVERY', w: 1.8 }]) },
  furniture: [stove(), prep(), sink()], ...base,
  tasks: [
    T('ch4.l1', 1, 'sequence', 'Get ready', { purpose: 'Apron, hand wash, light the stove: in that order, in three different corners of the kitchen.', objective: 'Apron, wash your hands, light the stove', success: 'You are ready to cook.',
      intro: [say('tunde', 'Apron. Hands. Stove. In that order. A dirty hand starts a bad day.', 'angry')], done: [say('tunde', 'Clean. Dressed. Almost a cook.', 'happy')], hint: 'Order: apron on the prep counter, the sink, then the stove.' }),
    T('ch4.l1', 2, 'choose', 'Pick your station', { purpose: 'The first choice of the day: grill, soup or fryer. The choice shapes your first order.', objective: 'Pick your station', success: 'You pick a station.',
      intro: [say('helper', 'Grill is hot. Soup is slow. Fryer is loud. Pick your poison.', 'cheeky')], done: [say('player', 'Station chosen. Do not make me regret it.', 'worried')], hint: 'Three stations on the floor: grill, soup or fryer.' }),
    T('ch4.l1', 3, 'reach', 'Fetch the delivery', { purpose: 'The delivery truck is at the back door: cross the busy dining room.', objective: 'Get to the delivery door in time', success: 'You reach the door before the timer ends.',
      intro: [say('tunde', 'The truck is leaving! Get the delivery!', 'angry')], done: [say('helper', 'You are fast. For a beginner.', 'proud')], hint: 'Cross behind the trolleys and run right.' }),
  ],
  items: [
    { id: 'apron', task: 0, x: 3, z: -9.4, label: 'Put on the apron', color: '#fbf8f0', shape: 'blanket', y: 1.0, act: 'grab' },
    { id: 'wash', task: 0, x: -9, z: 6.7, label: 'Wash your hands', color: '#6a8ab8', shape: 'cup', y: 1.0, act: 'wipe' },
    { id: 'stoveOn', task: 0, x: -4, z: -9.4, label: 'Light the stove', color: RUST, shape: 'stamp', y: 1.1, act: 'grab' },
    { id: 'grill', task: 1, x: 2, z: 1.4, label: 'Take the grill station', color: RUST, shape: 'sign', y: 0 },
    { id: 'soup', task: 1, x: 7, z: 1.4, label: 'Take the soup station', color: GREEN, shape: 'sign', y: 0 },
    { id: 'fryer', task: 1, x: 12, z: 1.4, label: 'Take the fryer station', color: YELLOW, shape: 'sign', y: 0 },
  ],
  sequences: { 0: ['apron', 'wash', 'stoveOn'] },
  goto: [null, null, RING(36, 0, 1.5)],
  guide: [{ x: 3, z: -7, r: 12 }, { x: 7, z: 1.4, r: 7 }, RING(36, 0)],
  hazards: [D('cart', 18, -7, 7, 2.6, 0, RUST), D('cart', 24, -7, 7, 2.9, 1.2, GREEN), D('chair', 30, -7, 7, 2.4, 0.6, ORANGE)],
  timeLimit: 20,
  crowd: [{ x: 8, z: 5, rot: 3.1 }, { x: 22, z: 6, rot: -2.4 }],
  npcs: { folake: { x: -10.5, z: -9, rot: 0.8 }, tunde: { x: 10, z: -6.4, rot: 0.2 } }, choiceLabel: 'station',
  endBeat: { text: 'The delivery is in. Somebody shouts a table number. The kitchen has officially started pretending to be calm.', line: 'Prep time is next.' },
  starRules: ['Finish the level', 'Reach the delivery door before the timer ends', 'Be on time with two or fewer slips'],
}), sail('work', 'Ferry to work', 'Your first day starts across the water', [sayAs('Mama Folake', 'folake', 'First day! The ferry dock is up the road. Be at the kitchen back door in ten minutes. Do not touch anything until I say.', 'calm')], [sayAs('Baba Tunde', 'tunde', 'Chef Tunde. Rule one: never run with a knife. Rule two: never be late.', 'confident')]))

// ---------------------------------------------------------------------------------------------------------------- Level 2
export const LEVEL_C4L2 = withBus(L({
  ch: 'ch4', n: 2, title: 'Prep Time', next: 'ch4.l3', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'Before a single plate goes out there are sacks of onions to cut, a pantry to check and a stew that insists on being watched.',
  theme: { ground: '#cfc4a8', ...REST([{ kind: 'sign', x: 32, z: -6.2, label: 'PANTRY', w: 1.8 }]) },
  furniture: [stove(), prep(), sink(), F('pantry', R(28, 36, -10, -8.8), 1.1, DARK), F('shelf', R(16, 20, -10, -9), 1.6, DARK), F('fridge', R(-11.6, -9.6, -10, -8.4), 2.0, '#e8ecef'), F('sack', R(7, 9, 5, 6.6), 0.7, '#c9a074')], ...base,
  tasks: [
    T('ch4.l2', 1, 'sequence', 'Chop in order', { purpose: 'Onion first, then pepper, then tomato: the order the stew needs.', objective: 'Chop onion, pepper, then tomato', success: 'Everything is chopped in order.',
      intro: [say('tunde', 'Onion, pepper, tomato. In that order. The onion goes in first and cries last.', 'calm')], done: [say('tunde', 'Neat cuts. Very neat. Slightly too neat.', 'cheeky')], hint: 'Order on the board: onion, pepper, tomato.' }),
    T('ch4.l2', 2, 'find', 'Find the missing spice', { purpose: 'The stew needs thyme, and it is not where it should be.', objective: 'Find the thyme', success: 'You find the thyme.',
      intro: [say('folake', 'Where is my thyme?! I left it right here! It was RIGHT HERE!', 'angry')], done: [say('helper', 'Behind the rice sack. Obviously.', 'tired')], hint: 'Try the shelf, the fridge and the rice sack at the bottom.' }),
    T('ch4.l2', 3, 'collect', 'Stock the pantry', { purpose: 'A pantry budget of ₦1200: three things for the shelf.', objective: 'Buy 3 things within ₦1200', success: 'Three things are on the shelf.',
      intro: [say('folake', 'Twelve hundred naira. Three things. If you bring me caviar, you are the one eating it.', 'worried')], done: [say('player', 'Three things, under budget. Mama will be suspicious.', 'proud')], hint: 'Rice is too dear with the rest: pick beans, oil and the pepper. Start over if you overspend.' }),
    T('ch4.l2', 4, 'hold', 'Let the stew simmer', { purpose: 'Stand at the stove and stir until the stew is ready.', objective: 'Stir the stew at the stove', success: 'The stew is ready.',
      intro: [say('tunde', 'Stir. Do not walk away. A stew left alone is a stew with ideas.', 'suspicious')], done: [say('tunde', 'It smells right. Do not tell it I said so.', 'happy')], hint: 'Stand in the ring at the stove until the count is full.' }),
  ],
  spots: [
    { id: 'shelf', task: 1, x: 18, z: -7.6, label: 'Check the shelf', wrong: say('player', 'Cinnamon. Pepper. Not thyme.', 'tired') },
    { id: 'fridge', task: 1, x: -10.6, z: -6.8, label: 'Check the fridge', wrong: say('helper', 'It is cold in there. It is also not there.', 'cheeky') },
    { id: 'sack', task: 1, x: 8, z: 4, label: 'Look behind the rice sack', right: true },
  ],
  items: [
    { id: 'onion', task: 0, x: 3, z: -9.4, label: 'Chop the onion', color: '#a25ab0', shape: 'produce', y: 1.05, act: 'chop' },
    { id: 'pepper', task: 0, x: 4, z: -9.4, label: 'Chop the pepper', color: ORANGE, shape: 'produce', y: 1.05, act: 'chop' },
    { id: 'tomato', task: 0, x: 5, z: -9.4, label: 'Chop the tomato', color: '#d62828', shape: 'produce', y: 1.05, act: 'chop' },
    { id: 'rice', task: 2, price: 800, x: 29.4, z: -9.4, label: 'Buy rice (₦800)', color: '#fbf8f0', shape: 'bag', y: 1.1 },
    { id: 'beans', task: 2, price: 500, x: 31.4, z: -9.4, label: 'Buy beans (₦500)', color: '#8a5a2a', shape: 'bag', y: 1.1 },
    { id: 'oil', task: 2, price: 400, x: 33.2, z: -9.4, label: 'Buy oil (₦400)', color: YELLOW, shape: 'bottle', y: 1.1 },
    { id: 'spice', task: 2, price: 300, x: 35, z: -9.4, label: 'Buy pepper (₦300)', color: RUST, shape: 'produce', y: 1.1 },
  ],
  sequences: { 0: ['onion', 'pepper', 'tomato'] }, budgets: { 2: { budget: 1200, need: 3 } },
  holds: { 3: { x: -4, z: -6.8, r: 1.3, secs: 6, pose: 'stir' } },
  guide: [{ x: 4, z: -7, r: 3 }, { x: 8, z: 3, r: 14 }, { x: 32, z: -7, r: 5 }, RING(-4, -6.8, 1.3)],
  crowd: [{ x: 14, z: 4, rot: 3.1 }],
  npcs: { folake: { x: -10.5, z: -9, rot: 0.8 }, tunde: { x: 12, z: -6.4, rot: 0.2 } }, choiceLabel: 'prep',
  endBeat: { text: 'The stew bubbles. The prep station smells of thyme and quiet triumph. Somebody says "ticket!" and the calm ends.', line: 'The first orders arrive.' },
  starRules: ['Finish the level', 'Finish with no wrong places or orders', 'Finish with no mistakes and no hints'],
}), sail('work', 'Ferry to work', 'Prep starts early', [sayAs('Mama Folake', 'folake', 'Prep time! Take the early ferry. The onions will not cut themselves, though they will make you cry.', 'calm')], [sayAs('Baba Tunde', 'tunde', 'Early ferry, early cook. Sit down and wake up.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 3
export const LEVEL_C4L3 = withBus(L({
  ch: 'ch4', n: 3, title: 'First Orders', next: 'ch4.l4', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'The first lunch tickets print. The pass is a counter where food becomes money and mistakes become shouting.',
  theme: { ground: '#cfc4a8', ...REST([{ kind: 'sign', x: 34, z: 6, label: 'TABLE FOUR', w: 1.6 }]) },
  furniture: [stove(), prep(), pass(), F('t4', R(32.4, 36, 3.4, 5), 0.8, WOOD)], ...base,
  tasks: [
    T('ch4.l3', 1, 'goto', 'Collect the ticket', { purpose: 'The ticket printer is at the pass. Go and read what table four wants.', objective: 'Walk to the pass', success: 'You reach the pass.',
      intro: [say('folake', 'Ticket for table four! At the pass! Now now now!', 'worried')], done: [say('tunde', 'Fry the fish. Plate it. Garnish. In that order. Do not argue with the ticket.', 'calm')], hint: 'Follow the ring to the pass counter.' }),
    T('ch4.l3', 2, 'sequence', 'Cook the order', { purpose: 'Fry, plate, garnish: the three steps of any good order.', objective: 'Fry it, plate it, then garnish it', success: 'The order is ready.',
      intro: [say('tunde', 'Fry. Plate. Garnish. In that order, at that speed, with that face.', 'angry')], done: [say('tunde', 'Beautiful. It looks like the picture.', 'proud')], hint: 'Order: fry at the stove, then plate and garnish at the pass.' }),
    T('ch4.l3', 3, 'choose', 'Fast or fancy?', { purpose: 'The next ticket: send it out fast and plain, or slow and pretty. Both are fair.', objective: 'Choose fast or fancy', success: 'You choose.',
      intro: [say('helper', 'Fast and simple, or slow and beautiful? The customer will not know either way.', 'cheeky')], done: [say('player', 'Okay. Here we go.', 'confident')], hint: 'Two signs on the floor.' }),
    T('ch4.l3', 4, 'reach', 'Deliver it hot', { purpose: 'Carry it through the dining room before it cools.', objective: 'Deliver the plate to table four', variant: true, success: 'You reach the table before the timer ends.',
      intro: [say('folake', 'Table four is waiting! Walk fast but do not spill!', 'worried')], done: [sayAs('Mr Dike', 'neighbour', 'This looks amazing. Thank you!', 'happy')], hint: 'Cross behind the walkers and go right to the ring by TABLE FOUR.' }),
  ],
  items: [
    { id: 'fry', task: 1, x: -4, z: -9.4, label: 'Fry it', color: '#a85a1f', shape: 'plate', y: 1.1, act: 'stir' },
    { id: 'plate', task: 1, x: 9, z: -9.4, label: 'Plate it', color: '#fbf8f0', shape: 'plate', y: 1.05, act: 'grab' },
    { id: 'garnish', task: 1, x: 11.5, z: -9.4, label: 'Garnish it', color: GREEN, shape: 'produce', y: 1.05, act: 'pour' },
    { id: 'fast', task: 2, x: 17, z: 1.6, label: 'Send it out fast and plain', color: RUST, shape: 'sign', y: 0 },
    { id: 'fancy', task: 2, x: 23, z: 1.6, label: 'Take your time and make it fancy', color: YELLOW, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['fry', 'plate', 'garnish'] },
  goto: [RING(10.5, -6.8, 1.5), null, null, RING(34, 7, 1.5)],
  guide: [RING(10.5, -6.8, 1.5), { x: 4, z: -8, r: 8 }, { x: 20, z: 1.6, r: 6 }, RING(34, 7, 1.5)],
  hazards: [D('walker', 18, -7, 8, 2.4, 0, GREEN), D('walker', 24, -7, 8, 2.7, 1.2, ORANGE)],
  variants: {
    fast: { label: 'Fast', timeLimit: 12, hazards: [D('walker', 18, -7, 8, 3.4, 0, GREEN), D('walker', 24, -7, 8, 3.8, 1.2, ORANGE)] },
    fancy: { label: 'Fancy', timeLimit: 20, hazards: [D('walker', 17, -7, 8, 2.2, 0, GREEN), D('walker', 22, -7, 8, 2.4, 1.2, ORANGE), D('walker', 27, -7, 8, 2.0, 0.6, RUST)] },
  },
  timeLimit: 16,
  crowd: [{ x: 28, z: 6, rot: -2.4 }, { x: 22, z: -4, rot: -1 }],
  npcs: { folake: { x: -10.5, z: -9, rot: 0.8 }, tunde: { x: 0, z: -6.4, rot: 0.1 } }, choiceLabel: 'style',
  endBeat: { text: 'Table four sends a compliment to the chef. The chef claims he did everything. The chef did not.', line: 'The dining room fills up next.' },
  starRules: ['Finish the level', 'Deliver the plate before the timer ends', 'Be on time with two or fewer slips'],
}), sail('work', 'Ferry to work', 'The lunch tickets start soon', [sayAs('Mama Folake', 'folake', 'First orders today. Take the ferry and be at the pass before the first ticket prints.', 'worried')], [say('helper', 'The ferry was late. The tickets will not be.', 'tired')]))

// ---------------------------------------------------------------------------------------------------------------- Level 4
export const LEVEL_C4L4 = withBus(L({
  ch: 'ch4', n: 4, title: 'Rush Hour', next: 'ch4.l5', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'Every table is full and every ticket is urgent. Seat the guests, bring their food and keep the dining room from falling apart.',
  theme: { ground: '#cfc4a8', ...REST([{ kind: 'sign', x: 33, z: 6.2, label: 'TABLE 7', w: 1.6 }, { kind: 'chair', x: 25.2, z: -1.2, color: WOOD }, { kind: 'chair', x: 21.2, z: 1.2, color: WOOD }, { kind: 'chair', x: 33.2, z: 1.2, color: WOOD }]) },
  furniture: [stove(), pass(), F('tA', R(24, 26.4, -3.4, -2), 0.8, WOOD), F('tB', R(20, 22.4, 2.2, 3.6), 0.8, WOOD), F('t7', R(32, 34.4, 2.4, 3.8), 0.8, WOOD)], ...base,
  tasks: [
    T('ch4.l4', 1, 'serve', 'Seat and serve the guests', { purpose: 'Real waiting: show each guest to a chair, bring the dish they ordered and let them eat.', objective: 'Seat and serve all three guests', success: 'All three guests are fed.',
      intro: [say('tunde', 'Three guests at the door. Seat them, read what they want, fetch it from the pass and bring it over. Wrong plate, wrong day.', 'calm')], done: [sayAs('Mr Ade', 'neighbour', 'That was wonderful. Is the chef single?', 'happy')], hint: 'Walk to a guest to seat them. Take their dish from the pass. Carry it to them.' }),
    T('ch4.l4', 2, 'reach', 'Dash back to the kitchen', { purpose: 'The dining room is busy and does not part for you.', objective: 'Get back to the kitchen door through the busy room', success: 'You reach the door before the timer ends.',
      intro: [say('folake', 'The next ticket is up! Mind the customers! Mind the customers!', 'worried')], done: [say('player', 'Sorry! Hot plate! Sorry!', 'laughing')], hint: 'Cross behind the walkers and go left to the kitchen door.' }),
    T('ch4.l4', 3, 'choose', 'Which table first?', { purpose: 'Two tables want you at once. Both are fair.', objective: 'Choose who to serve first', success: 'You choose.',
      intro: [sayAs('Mr Ade', 'neighbour', 'My food is cold!', 'angry'), say('helper', 'We have been here an hour!', 'angry')], done: [say('tunde', 'You can not do everything. Do the best you can.', 'calm')], hint: 'Serve the cold-food table or the long-wait table first.' }),
  ],
  items: [
    { id: 'jollof', task: 0, x: 9, z: -9.4, label: 'Take the jollof', color: RUST, shape: 'plate', y: 1.1 },
    { id: 'soup', task: 0, x: 10.5, z: -9.4, label: 'Take the soup', color: GREEN, shape: 'plate', y: 1.1 },
    { id: 'rice', task: 0, x: 12, z: -9.4, label: 'Take the fried rice', color: YELLOW, shape: 'plate', y: 1.1 },
    { id: 'cold', task: 2, x: 19, z: 0.2, label: 'Serve the cold-food table first', color: BLUE, shape: 'sign', y: 0 },
    { id: 'long', task: 2, x: 28, z: 0.2, label: 'Serve the long-wait table first', color: YELLOW, shape: 'sign', y: 0 },
  ],
  serves: { 0: { eatSecs: 3, guests: [
    { id: 'ade', name: 'Mr Ade', order: 'Jollof', dish: 'jollof', x: 16, z: -2.2, seat: { x: 25.2, z: -1.2 }, table: { x: 25.2, z: -2.7 } },
    { id: 'bisi', name: 'Auntie Bisi', order: 'Soup', dish: 'soup', x: 16, z: -0.2, seat: { x: 21.2, z: 1.2 }, table: { x: 21.2, z: 2.8 } },
    { id: 'kemi', name: 'Kemi', order: 'Fried rice', dish: 'rice', x: 16, z: 1.8, seat: { x: 33.2, z: 1.2 }, table: { x: 33.2, z: 3.0 } },
  ] } },
  goto: [null, RING(14.6, 0.4, 1.5), null],
  guide: [{ x: 22, z: 0, r: 10 }, RING(14.6, 0.4, 1.5), { x: 24, z: 0.2, r: 8 }],
  hazards: [D('walker', 19, -7, 6, 2.6, 0, GREEN), D('walker', 24, -7, 6, 2.9, 1.2, ORANGE), D('walker', 29, -7, 6, 2.4, 0.6, RUST)],
  timeLimit: 22,
  crowd: [{ x: 30, z: -5, rot: 0.2 }, { x: 36, z: -3, rot: 3.1 }],
  npcs: { folake: { x: -10.5, z: -9, rot: 0.8 }, tunde: { x: 7, z: -6.4, rot: 0.2 } }, choiceLabel: 'priority',
  endBeat: { text: 'Both tables are fed, eventually, and one of them even tips. The other leaves a very sarcastic compliment.', line: 'Someone is coming to complain.' },
  starRules: ['Finish the level', 'Get back to the kitchen before the timer ends', 'Be on time with two or fewer slips'],
}), sail('the restaurant', 'Ferry to the restaurant', 'The lunch rush is minutes away', [sayAs('Mama Folake', 'folake', 'Lunch rush starts in ten minutes! Catch the ferry across and run when you land!', 'worried')], [sayAs('Baba Tunde', 'tunde', 'You are here. That is half of cooking.', 'calm')]))

// ---------------------------------------------------------------------------------------------------------------- Level 5
export const LEVEL_C4L5 = withBus(L({
  ch: 'ch4', n: 5, title: 'The Picky Customer', next: 'ch4.l6', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'Table five is not happy. The jollof is "not like his mother\'s". Nobody has met his mother.',
  theme: { ground: '#cfc4a8', ...REST([{ kind: 'chair', x: 30, z: -1.2, color: WOOD }]) },
  furniture: [stove(), prep(), pass(), F('t5', R(28.4, 31.8, -0.2, 1.2), 0.8, WOOD)], ...base,
  tasks: [
    T('ch4.l5', 1, 'talk', 'Take the complaint', { purpose: 'The customer says the jollof is wrong. No answer is wrong: apologise, explain or offer a swap.', objective: 'Talk to the picky customer', success: 'He has been heard.',
      intro: [say('folake', 'He is complaining about the jollof. Go. Be kind. Be firm. Be kind and firm.', 'worried')], done: [say('tunde', 'Remake it. Rice, sauce, chicken.', 'calm')], hint: 'Mr Picky stands in the dining room by the door.' }),
    T('ch4.l5', 2, 'sequence', 'Remake the dish', { purpose: 'Start again: rice, sauce, chicken, in that order.', objective: 'Rice, sauce, then chicken', success: 'The dish is remade in order.',
      intro: [say('tunde', 'Remake it. Rice, sauce, chicken.', 'calm')], done: [say('tunde', 'That looks better than the first one.', 'surprised')], hint: 'Order at the stove: rice, sauce, chicken.' }),
    T('ch4.l5', 3, 'serve', 'Serve the remade dish', { purpose: 'Show him to a clean table, bring the remade dish and let him taste it.', objective: 'Seat him and serve the new dish', success: 'He finishes tasting.',
      intro: [sayAs('Mr Picky', 'neighbour', 'Do not look at me while I eat.', 'suspicious')], done: [sayAs('Mr Picky', 'neighbour', 'It is... acceptable. Tell your mother I said hello.', 'happy')], hint: 'Seat him at the table, take the remade jollof from the pass and bring it over.' }),
  ],
  talks: { 0: [{ id: 'picky', name: 'Mr Picky', x: 20, z: -1.6, lines: [sayAs('Mr Picky', 'neighbour', 'This jollof is not my mother\'s jollof. My mother\'s jollof was better. My mother is not here to defend it.', 'suspicious')], rounds: [{ options: [
    { id: 'apologise', label: '"I am sorry, sir. Let me make it right."', reply: sayAs('Mr Picky', 'neighbour', 'Hm. Better. A sorry costs nothing, but it is worth something.', 'curious') },
    { id: 'explain', label: '"Chef Tunde uses a family recipe, sir."', reply: sayAs('Mr Picky', 'neighbour', 'A family recipe? Whose family?', 'suspicious') },
    { id: 'remake', label: '"May I remake it for you right now?"', reply: sayAs('Mr Picky', 'neighbour', 'Yes. Quickly. And do not use that look.', 'angry') },
  ] }] }] },
  items: [
    { id: 'rice', task: 1, x: -5.4, z: -9.4, label: 'Add the rice', color: '#fbf8f0', shape: 'plate', y: 1.05, act: 'stir' },
    { id: 'sauce', task: 1, x: -3.8, z: -9.4, label: 'Add the sauce', color: '#d62828', shape: 'plate', y: 1.05, act: 'stir' },
    { id: 'chicken', task: 1, x: -2.4, z: -9.4, label: 'Add the chicken', color: '#a85a1f', shape: 'plate', y: 1.05, act: 'grab' },
    { id: 'remade', task: 2, x: 10.5, z: -9.4, label: 'Take the remade jollof', color: RUST, shape: 'plate', y: 1.1 },
  ],
  sequences: { 1: ['rice', 'sauce', 'chicken'] },
  serves: { 2: { eatSecs: 4, from: 0, guests: [{ id: 'picky', name: 'Mr Picky', order: 'Remade jollof', dish: 'remade', x: 20, z: -1.6, seat: { x: 30, z: -1.2 }, table: { x: 30, z: 0.4 } }] } },
  guide: [{ x: 20, z: -1.6, r: 3 }, { x: -3.8, z: -7.4, r: 5 }, { x: 24, z: 0, r: 8 }],
  crowd: [{ x: 34, z: 5, rot: -2.2 }],
  npcs: { folake: { x: -10.5, z: -9, rot: 0.8 }, tunde: { x: 4, z: -6.4, rot: 0.2 } }, choiceLabel: 'response',
  endBeat: { text: 'He finishes the plate, orders a second one and complains about that too. The kitchen counts it as a win.', line: 'Something is burning in the back.' },
  starRules: ['Finish the level', 'Finish with no wrong orders', 'Finish with no mistakes and no hints'],
}), sail('work', 'Ferry to work', 'Something has gone wrong at table five', [sayAs('Mama Folake', 'folake', 'A customer is already complaining and you are not even here. Take the ferry. Be kind. Be quick.', 'worried')], [say('helper', 'He was rude to the waiter. He was rude to the menu.', 'suspicious')]))

// ---------------------------------------------------------------------------------------------------------------- Level 6
export const LEVEL_C4L6 = withBus(L({
  ch: 'ch4', n: 6, title: 'Kitchen Fire', next: 'ch4.l7', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'It starts with a smell, then a flicker, then a very loud voice. A pan has caught fire at the stove and the room is full of diners.',
  theme: { ground: '#cfc4a8', ...REST([{ kind: 'sign', x: -10, z: 8.8, label: 'GAS VALVE', w: 1.6 }, { kind: 'rug', x: 26, z: 0.4, w: 9, d: 3, color: '#c4562a' }]) },
  furniture: [stove(), prep(), sink(), F('fridge', R(-11.6, -9.6, -10, -8.4), 2.0, '#e8ecef'), F('cabinet', R(14.4, 17, -10, -9), 1.6, DARK)], ...base,
  tasks: [
    T('ch4.l6', 1, 'find', 'Find the extinguisher', { purpose: 'The extinguisher lives on a wall somewhere. In a panic everything looks like a wall.', objective: 'Find the fire extinguisher', success: 'You find it.',
      intro: [say('tunde', 'FIRE! Extinguisher! Where is the extinguisher?!', 'angry')], done: [say('player', 'On the wall, right where the poster said. I never read the poster.', 'tired')], hint: 'Check the fridge, the cabinet and the wall by the sink.' }),
    T('ch4.l6', 2, 'sequence', 'Put it out', { purpose: 'Pull the pin, aim at the base, squeeze the handle. In that order.', objective: 'Pull the pin, aim, then squeeze', success: 'The fire is out.',
      intro: [say('tunde', 'Pin. Aim at the base, not the flames. Squeeze. Sweep. Calm voice. No screaming.', 'angry')], done: [say('tunde', 'Out. Good. Who left that pan?', 'angry')], hint: 'Order: pin, aim, squeeze.' }),
    T('ch4.l6', 3, 'reach', 'Turn off the gas', { purpose: 'The gas valve is at the back: get there through the panic.', objective: 'Get to the gas valve in time', success: 'The gas is off.',
      intro: [say('folake', 'The gas! Turn off the gas! Mind the chairs!', 'worried')], done: [say('tunde', 'Gas off. Phew. We all live.', 'happy')], hint: 'Cross behind the sliding chairs and run left to the GAS VALVE.' }),
    T('ch4.l6', 4, 'choose', 'Clear the dining room?', { purpose: 'The room is full. Calm voice, loud voice or the alarm: all three work, differently.', objective: 'Decide how to tell the guests', success: 'You choose.',
      intro: [say('helper', 'Everyone is looking. What do we tell them?', 'worried')], done: [say('player', 'Nothing to see here. Everyone is safe. Cake for all.', 'calm')], hint: 'Three signs on the rug: calm, loud or the alarm.' }),
  ],
  spots: [
    { id: 'fridge', task: 0, x: -10.6, z: -6.8, label: 'Check the fridge', wrong: say('player', 'That is a fridge. I am not putting out a fire with a lettuce.', 'tired') },
    { id: 'cabinet', task: 0, x: 15.6, z: -7.4, label: 'Check the cabinet', wrong: say('helper', 'Plates. So many plates. No extinguisher.', 'cheeky') },
    { id: 'wall', task: 0, x: -6, z: 4.4, label: 'Check the wall by the sink', right: true },
  ],
  items: [
    { id: 'pin', task: 1, x: -5.6, z: -7.2, label: 'Pull the pin', color: YELLOW, shape: 'stamp', y: 1.0, act: 'grab' },
    { id: 'aim', task: 1, x: -4, z: -7.2, label: 'Aim at the base', color: RUST, shape: 'cones', y: 0.6, act: 'point' },
    { id: 'squeeze', task: 1, x: -2.4, z: -7.2, label: 'Squeeze the handle', color: '#d62828', shape: 'bottle', y: 1.0, act: 'pour' },
    { id: 'calm', task: 3, x: 22, z: 1.6, label: 'Speak calmly', color: GREEN, shape: 'sign', y: 0 },
    { id: 'loud', task: 3, x: 26, z: 1.6, label: 'Shout to everyone', color: RUST, shape: 'sign', y: 0 },
    { id: 'alarm', task: 3, x: 30, z: 1.6, label: 'Sound the alarm', color: YELLOW, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['pin', 'aim', 'squeeze'] },
  goto: [null, null, RING(-10, 7, 1.5), null],
  guide: [{ x: -6, z: 4, r: 14 }, { x: -4, z: -7, r: 4 }, RING(-10, 7, 1.5), { x: 26, z: 1.6, r: 6 }],
  hazards: [D('chair', -4, -6, 8, 2.6, 0, RUST), D('chair', 0, -6, 8, 2.9, 1.2, GREEN), D('chair', 4, -6, 8, 2.4, 0.6, ORANGE)],
  timeLimit: 20,
  crowd: [{ x: 20, z: -6, rot: 0.2 }, { x: 30, z: 7, rot: 3 }, { x: 34, z: -4, rot: -2 }],
  npcs: { folake: { x: 10, z: 8.4, rot: -1 }, tunde: { x: -8, z: -6.4, rot: 0.2 } }, choiceLabel: 'announcement',
  endBeat: { text: 'The fire is out, the gas is off and half the dining room is applauding. The other half has left without paying.', line: 'Supplies run low next.' },
  starRules: ['Finish the level', 'Reach the valve before the timer ends', 'Be on time with two or fewer slips'],
}), sail('work', 'Ferry to work', 'Late shift', [sayAs('Mama Folake', 'folake', 'Evening shift. Take the ferry and keep your eyes open. Kitchens are hot places in more ways than one.', 'calm')], [sayAs('Baba Tunde', 'tunde', 'If you smell smoke, say so. Loudly.', 'confident')]))

// ---------------------------------------------------------------------------------------------------------------- Level 7
export const LEVEL_C4L7 = withBus(L({
  ch: 'ch4', n: 7, title: 'Stock Shortage', next: 'ch4.l8', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'The supplier did not come. The shelves are bare, the rice has vanished and the menu is a list of things you cannot cook.',
  theme: { ground: '#cfc4a8', ...REST([{ kind: 'sign', x: 34, z: -6.2, label: 'CORNER SHOP', w: 2.2 }, { kind: 'rug', x: 20, z: 3, w: 9, d: 3, color: BLUE }]) },
  furniture: [stove(), prep(), F('bench', R(2, 6.4, 4, 5.4), 0.7, DARK), F('shelf', R(8, 12, -10, -9), 1.6, DARK), F('shopcounter', R(30, 38, -10, -8.6), 1.0, WOOD)], ...base,
  tasks: [
    T('ch4.l7', 1, 'find', 'Find what is left', { purpose: 'Somewhere in the kitchen there is still rice. Find it.', objective: 'Find the last bag of rice', success: 'You find the rice.',
      intro: [say('folake', 'No rice? In my kitchen? Find it! There is always a bag somewhere!', 'angry')], done: [say('helper', 'Under the bench. Behind a mop. Hiding like a coward.', 'cheeky')], hint: 'Try the shelf, the stove corner and under the bench.' }),
    T('ch4.l7', 2, 'reach', 'Run to the corner shop', { purpose: 'The shop closes soon and the road is full of traffic.', objective: 'Run to the corner shop', success: 'You reach the shop before the timer ends.',
      intro: [say('tunde', 'Go! Shop closes at six! And mind the carts, carts do not care!', 'angry')], done: [say('player', 'Open. Still open. I love this shop.', 'laughing')], hint: 'Cross behind the carts and run right to the CORNER SHOP.' }),
    T('ch4.l7', 3, 'collect', 'Buy what you can', { purpose: 'You have ₦1500 for three things. Rice is expensive tonight.', objective: 'Buy 3 things within ₦1500', success: 'Three things are in your bag.',
      intro: [sayAs('Mama Put', 'neighbour', 'Salt, beans, oil, rice. Rice is dear, my child. Rice is always dear when you need it.', 'cheeky')], done: [say('player', 'Salt, beans, oil. Rice will have to wait.', 'thinking')], hint: 'Rice costs too much: pick salt, beans and oil. Start over if you overspend.' }),
    T('ch4.l7', 4, 'talk', 'Change the menu', { purpose: 'With no rice the menu must change. Tell the shopkeeper and your boss what you suggest.', objective: 'Talk to Mama Put', success: 'The new menu is decided.',
      intro: [say('player', 'No rice. Beans and plantain. We can call it a special.', 'thinking')], done: [say('folake', 'A special. Fine. Beans special. We say it is on purpose.', 'cheeky')], hint: 'Mama Put stands by the shop counter.' }),
  ],
  spots: [
    { id: 'shelf', task: 0, x: 10, z: -7.6, label: 'Check the shelf', wrong: say('player', 'Flour. More flour. A bag of regret.', 'tired') },
    { id: 'stove', task: 0, x: -4, z: -7.4, label: 'Check the stove corner', wrong: say('helper', 'A pan, a mop and a mood. No rice.', 'cheeky') },
    { id: 'bench', task: 0, x: 4.2, z: 3, label: 'Look under the bench', right: true },
  ],
  items: [
    { id: 'salt', task: 2, price: 150, x: 31.4, z: -9.2, label: 'Buy salt (₦150)', color: '#fbf8f0', shape: 'produce', y: 1.1 },
    { id: 'beans', task: 2, price: 450, x: 33.4, z: -9.2, label: 'Buy beans (₦450)', color: '#8a5a2a', shape: 'bag', y: 1.1 },
    { id: 'oil', task: 2, price: 600, x: 35.2, z: -9.2, label: 'Buy oil (₦600)', color: YELLOW, shape: 'bottle', y: 1.1 },
    { id: 'rice', task: 2, price: 1200, x: 36.8, z: -9.2, label: 'Buy rice (₦1200)', color: '#fbf8f0', shape: 'bag', y: 1.1 },
  ],
  budgets: { 2: { budget: 1500, need: 3 } },
  talks: { 3: [{ id: 'put', name: 'Mama Put', x: 34, z: -6.2, lines: [sayAs('Mama Put', 'neighbour', 'So, no rice. What will you serve tonight? Beans? Plantain? Sorrow?', 'cheeky')], rounds: [{ options: [
    { id: 'simple', label: '"A simple menu: beans and plantain."', reply: sayAs('Mama Put', 'neighbour', 'Simple sells. Simple does not burn.', 'happy') },
    { id: 'special', label: '"A chef\'s special, only tonight."', reply: sayAs('Mama Put', 'neighbour', 'Everything is a special when you run out of everything else.', 'cheeky') },
    { id: 'closed', label: '"We close for the night."', reply: sayAs('Mama Put', 'neighbour', 'Brave. The customers will remember. So will your boss.', 'worried') },
  ] }] }] },
  goto: [null, RING(32, -6, 1.5), null, null],
  guide: [{ x: 5, z: 3, r: 10 }, RING(32, -6, 1.5), { x: 34, z: -8, r: 5 }, { x: 34, z: -6, r: 4 }],
  hazards: [D('cart', 16, -6, 8, 2.6, 0, RUST), D('walker', 22, -6, 8, 2.8, 1.2, GREEN), D('cart', 27, -6, 8, 2.4, 0.6, ORANGE)],
  timeLimit: 20,
  crowd: [{ x: 18, z: 6, rot: -2.4 }, { x: 36, z: 4, rot: 3 }],
  npcs: { folake: { x: -10.5, z: -9, rot: 0.8 }, tunde: { x: 7, z: -6.4, rot: 0.2 } }, choiceLabel: 'menu',
  endBeat: { text: 'The new menu has three items. The customers say it is "refreshingly honest". The cook says nothing.', line: 'A critic is on the way.' },
  starRules: ['Finish the level', 'Reach the shop before the timer ends', 'Be on time with two or fewer slips'],
}), sail('work', 'Ferry to work', 'A bad delivery morning', [sayAs('Mama Folake', 'folake', 'The supplier did not come. Take the ferry and bring ideas, not complaints.', 'worried')], [say('helper', 'I counted the rice. Then I counted it again. It did not grow.', 'tired')]))

// ---------------------------------------------------------------------------------------------------------------- Level 8
export const LEVEL_C4L8 = withBus(L({
  ch: 'ch4', n: 8, title: 'The Critic', next: 'ch4.l9', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'A quiet man in a good jacket walks in and orders the simplest dish on the menu. He writes something down. Everyone panics politely.',
  theme: { ground: '#cfc4a8', ...REST([{ kind: 'sign', x: 32, z: -6.2, label: 'TABLE 1', w: 1.6 }, { kind: 'chair', x: 32, z: -2.4, color: WOOD }, { kind: 'rug', x: 26, z: 4, w: 10, d: 3, color: BLUE }]) },
  furniture: [stove(), prep(), pass(), F('t1', R(30, 34, -1.6, -0.2), 0.8, WOOD)], ...base,
  tasks: [
    T('ch4.l8', 1, 'talk', 'Greet the critic', { purpose: 'Step out and welcome the guest everyone is nervous about.', objective: 'Talk to the critic', success: 'He has ordered.',
      intro: [say('folake', 'That is the critic. Be charming. Be calm. Be invisible.', 'worried')], done: [say('tunde', 'Base. Sauce. Garnish. No fingers on the rim. No sneezing. No thoughts.', 'angry')], hint: 'The critic stands by the door in the dining room.' }),
    T('ch4.l8', 2, 'sequence', 'Plate the signature dish', { purpose: 'The best dish, plated perfectly: base, sauce, garnish.', objective: 'Base, sauce, then garnish', success: 'The plate is perfect.',
      intro: [say('tunde', 'Base. Sauce. Garnish. In that order. Slowly. With love.', 'calm')], done: [say('tunde', 'It is art. It might also be dinner.', 'proud')], hint: 'Order at the pass: base, sauce, garnish.' }),
    T('ch4.l8', 3, 'serve', 'Serve the critic', { purpose: 'Show him to table one, bring the plate and let him eat slowly and silently.', objective: 'Seat the critic and serve his dish', success: 'He finishes eating.',
      intro: [say('helper', 'Seat him. Serve him. Do not breathe near the plate. He is chewing. He chewed twice. He wrote something.', 'worried')], done: [sayAs('The Critic', 'neighbour', 'Hm.', 'thinking')], hint: 'Seat him at table one, take the signature dish from the pass and bring it over.' }),
    T('ch4.l8', 4, 'choose', 'Explain your dish', { purpose: 'He asks about the dish. Humble, proud or funny: all work.', objective: 'Choose how to describe it', success: 'You choose.',
      intro: [sayAs('The Critic', 'neighbour', 'Tell me about this dish.', 'curious')], done: [sayAs('The Critic', 'neighbour', 'Thank you. That was... informative.', 'thinking')], hint: 'Be humble, proud or funny.' }),
  ],
  talks: { 0: [{ id: 'critic', name: 'The Critic', x: 20, z: 1.2, lines: [sayAs('The Critic', 'neighbour', 'Good evening. One plate of your most honest dish, please. And no need to explain it. Yet.', 'calm')], rounds: [{ options: [
    { id: 'welcome', label: '"Of course, sir. Please follow me."', reply: sayAs('The Critic', 'neighbour', 'Polite. I write that down too.', 'curious') },
    { id: 'honest', label: '"It is all honest, sir. We cannot afford otherwise."', reply: sayAs('The Critic', 'neighbour', 'A joke? In a kitchen? I will allow it.', 'happy') },
  ] }] }] },
  items: [
    { id: 'base', task: 1, x: 8.8, z: -9.4, label: 'Plate the base', color: '#fbf8f0', shape: 'plate', y: 1.1, act: 'grab' },
    { id: 'sauce', task: 1, x: 10.4, z: -9.4, label: 'Add the sauce', color: '#d62828', shape: 'plate', y: 1.1, act: 'pour' },
    { id: 'garnish', task: 1, x: 12, z: -9.4, label: 'Add the garnish', color: GREEN, shape: 'produce', y: 1.1, act: 'pour' },
    { id: 'signature', task: 2, x: 10.4, z: -8.8, label: 'Take the signature dish', color: '#fbf8f0', shape: 'plate', y: 1.1 },
    { id: 'humble', task: 3, x: 22, z: 4.8, label: 'Be humble about it', color: GREEN, shape: 'sign', y: 0 },
    { id: 'proud', task: 3, x: 26, z: 4.8, label: 'Be proud of it', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'funny', task: 3, x: 30, z: 4.8, label: 'Make a joke about it', color: ORANGE, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['base', 'sauce', 'garnish'] },
  serves: { 2: { eatSecs: 5, from: 0, guests: [{ id: 'critic', name: 'The Critic', order: 'Signature dish', dish: 'signature', x: 20, z: 1.2, seat: { x: 32, z: -2.4 }, table: { x: 32, z: -0.9 } }] } },
  guide: [{ x: 20, z: 1.2, r: 3 }, { x: 10.4, z: -7, r: 4 }, { x: 24, z: 0, r: 10 }, { x: 26, z: 4.8, r: 6 }],
  crowd: [{ x: 28, z: -6, rot: 0.2 }, { x: 36, z: 5, rot: -2.2 }],
  npcs: { folake: { x: -10.5, z: -9, rot: 0.8 }, tunde: { x: 4, z: -6.4, rot: 0.2 } }, choiceLabel: 'description',
  endBeat: { text: 'The critic stands, buttons his jacket and says: "I will write about this." Nobody knows if that is good.', line: 'The last service is next.' },
  starRules: ['Finish the level', 'Finish with no wrong orders', 'Finish with no mistakes and no hints'],
}), sail('work', 'Ferry to work', 'A special guest tonight', [sayAs('Mama Folake', 'folake', 'A critic is coming tonight. Take the ferry, wash your hands twice and look innocent.', 'worried')], [sayAs('Baba Tunde', 'tunde', 'He eats in silence. We cook in terror.', 'angry')]))

// ---------------------------------------------------------------------------------------------------------------- Level 9
export const LEVEL_C4L9 = withBus(L({
  ch: 'ch4', n: 9, title: 'Last Order', next: null, badge: 'Kitchen Rush', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'Closing time, one table left and one ticket still on the printer. The last order of the week is always the one you remember.',
  theme: { ground: '#cfc4a8', ...REST([{ kind: 'sign', x: 37, z: 6, label: 'FRONT DOOR', w: 1.8 }, { kind: 'rug', x: 22, z: 5, w: 9, d: 3, color: GREEN }]) },
  furniture: [stove(), prep(), pass(), F('t9', R(26, 30, -1.6, -0.2), 0.8, WOOD)], ...base,
  tasks: [
    T('ch4.l9', 1, 'goto', 'Take the last order', { purpose: 'Walk out to the last table and hear what they want.', objective: 'Walk to the last table', success: 'You reach the table.',
      intro: [say('folake', 'One table left. Take the order. Smile. Do not let them see you are tired.', 'calm')], done: [sayAs('Last Guest', 'neighbour', 'Just a plate of your jollof. The way you made it the first day.', 'happy')], hint: 'Follow the ring to the last table.' }),
    T('ch4.l9', 2, 'sequence', 'Cook the final order', { purpose: 'Chop, fry and plate: the whole job in one go.', objective: 'Chop, fry, then plate', success: 'The last order is ready.',
      intro: [say('tunde', 'Chop. Fry. Plate. You have done it a hundred times. Do it once more.', 'calm')], done: [say('tunde', 'That is the best plate you have made. Do not tell anyone I said so.', 'proud')], hint: 'Order: onion at the prep board, fry at the stove, plate at the pass.' }),
    T('ch4.l9', 3, 'reach', 'Carry it out', { purpose: 'Carry the last plate through the last chairs and the last of the crowd.', objective: 'Carry the plate to the last table', success: 'You reach the table before the timer ends.',
      intro: [say('helper', 'Mind the chairs! Mind the chairs! It is the last plate, do not drop it now!', 'worried')], done: [sayAs('Last Guest', 'neighbour', 'It is still warm. Thank you.', 'happy')], hint: 'Cross behind the sliding chairs and go right.' }),
    T('ch4.l9', 4, 'choose', 'Close the kitchen', { purpose: 'Everybody has gone. Close with a speech, a toast or a quiet clean.', objective: 'Decide how to close', success: 'You choose.',
      intro: [say('folake', 'Everybody is gone. How do we close?', 'calm')], done: [say('tunde', 'Good. That is how you end a week.', 'proud')], hint: 'Three signs on the rug: speech, toast or a quiet clean.' }),
    T('ch4.l9', 5, 'goto', 'Walk out the front door', { purpose: 'The week that started on a ferry ends at a front door.', objective: 'Walk out of the front door', success: 'You step outside.',
      intro: [say('folake', 'Go home. Rest. Tomorrow we do it again.', 'happy')], done: [say('tunde', 'You were a beginner on day one. Look at you now.', 'proud')], hint: 'The front door is on the far right.' }),
  ],
  items: [
    { id: 'o9', task: 1, x: 3, z: -9.4, label: 'Chop the onion', color: '#a25ab0', shape: 'produce', y: 1.05, act: 'chop' },
    { id: 'f9', task: 1, x: -4, z: -9.4, label: 'Fry it', color: '#a85a1f', shape: 'plate', y: 1.1, act: 'stir' },
    { id: 'p9', task: 1, x: 10.4, z: -9.4, label: 'Plate it', color: '#fbf8f0', shape: 'plate', y: 1.1, act: 'grab' },
    { id: 'speech', task: 3, x: 18, z: 4.4, label: 'Give a short speech', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'toast', task: 3, x: 22, z: 4.4, label: 'Raise a toast', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'clean', task: 3, x: 26, z: 4.4, label: 'Quietly clean up', color: GREEN, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['o9', 'f9', 'p9'] },
  goto: [RING(28, 1.6, 1.6), null, RING(28, 1.6, 1.6), null, RING(37, 4.4, 1.5)],
  guide: [RING(28, 1.6), { x: 4, z: -8, r: 14 }, RING(28, 1.6), { x: 22, z: 4.4, r: 6 }, RING(37, 4.4)],
  hazards: [D('chair', 16, -7, 8, 2.6, 0, RUST), D('chair', 21, -7, 8, 2.9, 1.2, GREEN), D('chair', 25, -7, 8, 2.4, 0.6, ORANGE)],
  timeLimit: 20,
  crowd: [{ x: 33, z: 6, rot: -2.4 }],
  npcs: { folake: { x: -10.5, z: -9, rot: 0.8 }, tunde: { x: 4, z: -6.4, rot: 0.2 } }, choiceLabel: 'closing',
  endBeat: { text: 'The lights go off one by one. The kitchen cools down. Somewhere in the dark a pot is still ticking, and you decide that is the nicest sound in the world.', line: 'Chapter 4 is done.' },
  starRules: ['Finish the level', 'Finish with no mistakes', 'Finish with no mistakes and no hints'],
}), sail('work', 'Ferry to work', 'The last service of the week', [sayAs('Mama Folake', 'folake', 'Last service. Take the ferry, my child. Tonight we close the kitchen together.', 'happy')], [sayAs('Baba Tunde', 'tunde', 'You were a beginner on day one. Look at you now.', 'proud')]))
void CREAM; void RING
