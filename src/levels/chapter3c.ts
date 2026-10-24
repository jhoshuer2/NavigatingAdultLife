// Chapter 3 "Market Day": one trading season at Mama Folake's stall. A helicopter flies you to the market every day; the days bring suppliers, customers,
// a hard haggler, a money box, rain, a rival, an inspector and closing time. Each level is a different place with a different mix of tasks.
import type { Deco } from './schema'
import { L, T, R, F, say, sayAs, D, WOOD, DARK } from './chapter1b'
import { B, TREES, LAMPS, RING, GREEN } from './chapter1c'
import { withBus, type BusOpts } from './bus'

const ORANGE = '#e07a1f', YELLOW = '#f5b91c', RUST = '#c4562a', BLUE = '#2b6ad0', GREY = '#44444e'
const fly = (to: string, title: string, why: string, intro: BusOpts['intro'], done: BusOpts['done']): BusOpts => ({ vehicle: 'helicopter', to, title, purpose: `${why}: wait at the helipad, board the helicopter and fly there.`, objective: `Take the helicopter to ${to}`, success: `You land at ${to}.`, intro, done })
const MKT = (extra: Deco[] = []): Deco[] => [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: '#d9b98a' }, ...extra]
const stall = (x: number, z: number, color: string, label: string): { f: ReturnType<typeof F>; d: Deco } => ({ f: F(`counter${x}${z}`, R(x - 1.7, x + 1.7, z - 0.8, z + 0.8), 1.0, WOOD), d: { kind: 'stall', x, z: z - 0.4, w: 3.4, d: 1.6, color, label } })

// ---------------------------------------------------------------------------------------------------------------- Level 1
const mine = stall(10, -8.6, ORANGE, 'YOUR STALL'), grains = stall(0, -8.6, GREEN, 'GRAINS'), spices = stall(21, -8.6, YELLOW, 'SPICES')
export const LEVEL_C3L1 = withBus(L({
  ch: 'ch3', n: 1, title: 'Opening the Stall', next: 'ch3.l2', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'Mama Folake has handed you the keys to her stall for the day. The sun is up, the crowd is gathering and nothing is ready.',
  theme: { ground: '#c9b48a', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#e0d2b2' }], deco: MKT([mine.d, grains.d, spices.d, { kind: 'sign', x: 37, z: 0, label: 'SHUTTER', w: 1.8 }, ...TREES([[-10, -10], [38, -10], [-10, 10]]), ...LAMPS([[4, 3], [18, 3], [30, 3]])]) },
  furniture: [mine.f, grains.f, spices.f],
  spawn: { x: -9, z: 0 }, resume: { x: -6, z: 0 },
  tasks: [
    T('ch3.l1', 1, 'sequence', 'Set up the display', { purpose: 'A tidy stall sells more: cloth, crate, scale, price sign, in that order.', objective: 'Cloth, crate, scale, then the price sign', success: 'The display is set up in order.',
      intro: [say('folake', 'Cloth first, then the crate, then the scale, then the sign. A sign on a crooked table is a lie.', 'calm')], done: [say('folake', 'Beautiful. Now people will actually stop.', 'proud')], hint: 'Order: cloth, crate, scale, sign.' }),
    T('ch3.l1', 2, 'choose', 'Set your prices', { purpose: 'Your first trading decision: low, fair or high. All three can work.', objective: 'Choose your prices', success: 'You choose.',
      intro: [sayAs('Mama Ngozi', 'neighbour', 'Too cheap and you lose money. Too dear and nobody comes. Choose.', 'curious')], done: [say('player', 'Prices set. Fingers crossed.', 'worried')], hint: 'Three signs on the ground in front of the stall.' }),
    T('ch3.l1', 3, 'reach', 'Open the shutter in time', { purpose: 'Cross the market before the first rush and open the shutter.', objective: 'Reach the shutter before the rush', success: 'You reach the shutter before the timer ends.',
      intro: [say('helper', 'The crowd is coming! Get the shutter up!', 'worried')], done: [say('player', 'Open! We are open!', 'laughing')], hint: 'Cross behind the carts, then run to the right.' }),
  ],
  items: [
    { id: 'cloth', task: 0, x: 8.4, z: -8.2, label: 'Lay the cloth', color: GREEN, shape: 'blanket', y: 1.0, act: 'wipe' },
    { id: 'crate', task: 0, x: 9.6, z: -8.2, label: 'Place the crate', color: ORANGE, shape: 'crate', y: 1.0, act: 'lift' },
    { id: 'scale', task: 0, x: 10.8, z: -8.2, label: 'Set the scale', color: '#1c1b22', shape: 'stamp', y: 1.0, act: 'grab' },
    { id: 'sign', task: 0, x: 12, z: -8.2, label: 'Put up the price sign', color: RUST, shape: 'paper', y: 1.0, act: 'write' },
    { id: 'low', task: 1, x: 4, z: 1.2, label: 'Low prices: sell fast, earn little', color: GREEN, shape: 'sign', y: 0 },
    { id: 'fair', task: 1, x: 10, z: 1.2, label: 'Fair prices: steady and honest', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'high', task: 1, x: 16, z: 1.2, label: 'High prices: earn more, sell less', color: RUST, shape: 'sign', y: 0 },
  ],
  sequences: { 0: ['cloth', 'crate', 'scale', 'sign'] },
  goto: [null, null, RING(36, 0, 1.6)],
  guide: [{ x: 10, z: -6.4, r: 3 }, { x: 10, z: 1.2, r: 8 }, RING(36, 0)],
  hazards: [D('cart', 20, -7, 7, 2.8, 0, RUST), D('cart', 25, -7, 7, 3.0, 1.2, GREEN), D('walker', 30, -7, 7, 2.5, 0.6, ORANGE)],
  timeLimit: 20,
  crowd: [{ x: 4, z: 4, rot: 1.4 }, { x: 22, z: 5, rot: -2 }, { x: 14, z: -4.4, rot: 3 }],
  npcs: { folake: { x: 6, z: -6, rot: 0.2 }, tunde: { x: 33, z: -4, rot: -2 } }, choiceLabel: 'pricing',
  endBeat: { text: 'The shutter goes up. A woman with a very large bag is already looking at your tomatoes.', line: 'Your first stock run is next.' },
  starRules: ['Finish the level', 'Open the shutter before the timer ends', 'Be on time with two or fewer slips'],
}), fly('the market', 'Helicopter to the market', 'Mama Folake has a stall across town', [sayAs('Mama Folake', 'folake', 'Today you sell, my child. The stall is across town and the helicopter does not wait. Go!', 'happy')], [say('player', 'The market already smells like fried plantain and shouting.', 'happy')]))

// ---------------------------------------------------------------------------------------------------------------- Level 2
const depot = B('depot', -6, 4, -12, -7, '#c9d9e8', 'WHOLESALE DEPOT', 3.6), farm = stall(8, -8.6, GREEN, 'TOMATOES'), pep = stall(18, -8.6, RUST, 'PEPPER'), oni = stall(28, -8.6, '#a25ab0', 'ONIONS')
export const LEVEL_C3L2 = withBus(L({
  ch: 'ch3', n: 2, title: 'The Supplier', next: 'ch3.l3', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'Stock does not grow on the stall. Out at the wholesale depot three suppliers shout prices and nobody is willing to go first.',
  theme: { ground: '#bfb393', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#d9cdb0' }], deco: MKT([...depot.d, farm.d, pep.d, oni.d, { kind: 'sign', x: 37, z: 3, label: 'TRUCK GATE', w: 1.8 }, ...TREES([[-10, 10], [38, -10]]), ...LAMPS([[12, 3], [24, 3]])]) },
  furniture: [depot.f, farm.f, pep.f, oni.f],
  spawn: { x: -9, z: 0 }, resume: { x: -6, z: 0 },
  tasks: [
    T('ch3.l2', 1, 'talk', 'Meet the suppliers', { purpose: 'Three suppliers, three prices. Say hello, ask what they have and hear what they want.', objective: 'Talk to all three suppliers', success: 'You know who sells what.',
      intro: [say('folake', 'Speak to all three before you buy. A trader who buys from the first is a gift to the other two.', 'calm')], done: [say('player', 'Tomatoes nine hundred, pepper six, onions seven. And rice that is not on the list.', 'thinking')], hint: 'The three suppliers stand in front of their stalls along the top.' }),
    T('ch3.l2', 2, 'collect', 'Buy your stock', { purpose: 'You have ₦2500 to buy three crates. The rice is not what you came for.', objective: 'Buy 3 crates within your budget', success: 'Three crates are yours.',
      intro: [sayAs('Alhaji Musa', 'helper', 'Rice! Very good rice! Not the pepper, the rice! Eighteen hundred, only today!', 'cheeky')], done: [say('player', 'Three crates, under budget. Mama Folake will tell the whole village.', 'proud')], hint: 'Pick the tomatoes, pepper and onions. If you overspend, tap Start over.' }),
    T('ch3.l2', 3, 'reach', 'Rush the goods to the truck', { purpose: 'The truck leaves in half a minute and there are forklifts everywhere.', objective: 'Carry the crates to the truck gate', success: 'You reach the truck before the timer ends.',
      intro: [sayAs('Driver', 'helper', 'Last call! The truck leaves now! Now now!', 'angry')], done: [say('player', 'On the truck. I am on the truck. I am not on the truck. The crates are.', 'laughing')], hint: 'Cross behind the carts and go right to the TRUCK GATE.' }),
  ],
  talks: { 0: [
    { id: 'ngozi', name: 'Mama Ngozi', x: 8, z: -5.4, lines: [sayAs('Mama Ngozi', 'neighbour', 'Tomatoes! Red as a promise. Nine hundred a crate and I give you the story free.', 'happy')], rounds: [{ options: [
      { id: 'ask', label: '"Is nine hundred the best price?"', reply: sayAs('Mama Ngozi', 'neighbour', 'For you, nine hundred. For a stranger, one thousand. Choose to be a friend.', 'cheeky') },
      { id: 'ok', label: '"Fine, I will take tomatoes."', reply: sayAs('Mama Ngozi', 'neighbour', 'A decisive buyer! May your tomatoes always sell.', 'happy') },
    ] }] },
    { id: 'musa', name: 'Alhaji Musa', x: 18, z: -5.4, lines: [sayAs('Alhaji Musa', 'helper', 'Pepper, six hundred. Hot. Hotter than gossip.', 'cheeky')] },
    { id: 'tola', name: 'Madam Tola', x: 28, z: -5.4, lines: [sayAs('Madam Tola', 'neighbour', 'Onions, seven hundred. They will make you cry. Mine do not. Yours might.', 'calm')] },
  ] },
  items: [
    { id: 'tomato', task: 1, price: 900, x: 7, z: -8.2, label: 'Buy tomatoes (₦900)', color: '#d62828', shape: 'crate', y: 1.1, act: 'lift' },
    { id: 'pepper', task: 1, price: 600, x: 18, z: -8.2, label: 'Buy pepper (₦600)', color: ORANGE, shape: 'crate', y: 1.1, act: 'lift' },
    { id: 'onion', task: 1, price: 700, x: 28, z: -8.2, label: 'Buy onions (₦700)', color: '#a25ab0', shape: 'crate', y: 1.1, act: 'lift' },
    { id: 'rice', task: 1, price: 1800, x: 9.5, z: -8.2, label: 'Buy rice (₦1800)', color: '#fbf8f0', shape: 'bag', y: 1.1 },
    { id: 'yam', task: 1, price: 1500, x: 19.6, z: -8.2, label: 'Buy yams (₦1500)', color: '#c9a074', shape: 'bag', y: 1.1 },
  ],
  budgets: { 1: { budget: 2500, need: 3 } },
  goto: [null, null, RING(36, 3, 1.6)],
  guide: [{ x: 18, z: -5, r: 12 }, { x: 18, z: -6, r: 12 }, RING(36, 3)],
  hazards: [D('cart', 14, -6, 8, 3.0, 0, RUST), D('cart', 22, -6, 8, 3.2, 1.2, GREEN), D('walker', 30, -6, 8, 2.6, 0.6, ORANGE)],
  timeLimit: 22,
  crowd: [{ x: 12, z: 4, rot: 3 }, { x: 26, z: 6, rot: -2 }],
  npcs: { folake: { x: -9, z: 8, rot: 0.8 }, tunde: { x: 34, z: 8, rot: -2.4 } }, choiceLabel: 'stock',
  endBeat: { text: 'The truck pulls out with your three crates swaying on top. You have bought your first stock. You also have a new friend and a new enemy.', line: 'Customers next.' },
  starRules: ['Finish the level', 'Reach the truck before the timer ends', 'Be on time with two or fewer slips'],
}), fly('the wholesale depot', 'Helicopter to the depot', 'The best suppliers are out of town at the wholesale depot', [sayAs('Mama Folake', 'folake', 'The suppliers are at the depot. Take the helicopter, keep hold of the money and do not buy the first price.', 'calm')], [say('helper', 'The depot helicopter smells of onions and ambition.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 3
const me3 = stall(12, -6.4, ORANGE, 'YOUR STALL')
export const LEVEL_C3L3 = withBus(L({
  ch: 'ch3', n: 3, title: 'First Customers', next: 'ch3.l4', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'The shutter is up, the crates are stacked and three shoppers are arriving at once. Nobody wants to wait. Everybody wants a discount.',
  theme: { ground: '#c9b48a', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#e0d2b2' }], deco: MKT([me3.d, { kind: 'sign', x: 36, z: 0, label: 'LOST CHANGE', w: 2 }, ...TREES([[-10, 10], [38, -10]]), ...LAMPS([[0, 3], [26, 3]])]) },
  furniture: [me3.f, F('counter3', R(8, 17, -3, -1.8), 1.0, WOOD)],
  spawn: { x: -9, z: 0 }, resume: { x: -6, z: 2 },
  tasks: [
    T('ch3.l3', 1, 'goto', 'Greet the first customer', { purpose: 'Step up to the front of the stall.', objective: 'Walk to the front of the counter', success: 'You reach the counter.',
      intro: [sayAs('Madam Ngozi', 'neighbour', 'Good morning! Tomatoes! Are they fresh? Are they cheap? Are they free?', 'cheeky')], done: [say('player', 'Good morning, madam. They are fresh and they are fair.', 'happy')], hint: 'The ring is at the front of the counter.' }),
    T('ch3.l3', 2, 'serve', 'Serve the customers', { purpose: 'Three shoppers at once: greet each, read what they want, fetch it from the counter and hand it over.', objective: 'Serve all three shoppers', success: 'All three shoppers are served.',
      intro: [sayAs('Madam Ngozi', 'neighbour', 'I want tomatoes. She wants pepper. He wants onions. Do not mix us up!', 'calm')], done: [sayAs('Madam Ngozi', 'neighbour', 'Perfect! You are very professional.', 'happy')], hint: 'Greet a shopper, take what they asked for from the counter and bring it to them.' }),
    T('ch3.l3', 3, 'choose', 'Give a discount?', { purpose: 'Another customer asks for a discount. Full price, a little off or a lot: all fair.', objective: 'Decide on the discount', success: 'You choose.',
      intro: [say('helper', 'Make it cheaper! I am your regular customer! Today is my first day!', 'cheeky')], done: [say('helper', 'A pleasure doing business.', 'happy')], hint: 'Three signs on the ground by the counter.' }),
    T('ch3.l3', 4, 'reach', 'Chase the lost change', { purpose: 'A customer forgets his change and walks off: catch up.', objective: 'Catch the customer to give back his change', success: 'You reach him before the timer ends.',
      intro: [say('helper', 'My change! Where is my change?', 'worried')], done: [say('player', 'Honest trader, honest market.', 'proud')], hint: 'Cross behind the walkers and run right.' }),
  ],
  items: [
    { id: 'tomato', task: 1, x: 10, z: -2.4, label: 'Take the tomatoes', color: '#d62828', shape: 'produce', y: 1.05, act: 'grab' },
    { id: 'pepper', task: 1, x: 12.5, z: -2.4, label: 'Take the pepper', color: ORANGE, shape: 'produce', y: 1.05, act: 'grab' },
    { id: 'onion', task: 1, x: 15, z: -2.4, label: 'Take the onions', color: '#a25ab0', shape: 'produce', y: 1.05, act: 'grab' },
    { id: 'full', task: 2, x: 8, z: 4.4, label: 'Keep the full price', color: RUST, shape: 'sign', y: 0 },
    { id: 'some', task: 2, x: 12.5, z: 4.4, label: 'Give a small discount', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'lots', task: 2, x: 17, z: 4.4, label: 'Give a big discount', color: GREEN, shape: 'sign', y: 0 },
  ],
  serves: { 1: { eatSecs: 2.5, verb: 'greet', guests: [
    { id: 'ngozi', name: 'Madam Ngozi', order: 'Tomatoes', dish: 'tomato', x: 1, z: 3, seat: { x: 10, z: -0.6 }, table: { x: 10, z: -2.4 } },
    { id: 'halima', name: 'Halima', order: 'Pepper', dish: 'pepper', x: 1, z: 5.4, seat: { x: 12.5, z: -0.6 }, table: { x: 12.5, z: -2.4 } },
    { id: 'segun', name: 'Segun', order: 'Onions', dish: 'onion', x: 3.4, z: 4.2, seat: { x: 15, z: -0.6 }, table: { x: 15, z: -2.4 } },
  ] } },
  goto: [RING(12.5, 0.6, 1.5), null, null, RING(35, 0, 1.5)],
  guide: [RING(12.5, 0.6), { x: 12.5, z: -1, r: 5 }, { x: 12.5, z: 4.4, r: 6 }, RING(35, 0)],
  hazards: [D('walker', 22, -7, 8, 2.6, 0, GREEN), D('walker', 27, -7, 8, 2.8, 1.2, ORANGE), D('cart', 31, -7, 8, 3.0, 0.6, RUST)],
  timeLimit: 18,
  crowd: [{ x: 4, z: 9, rot: 0.5 }, { x: 26, z: 4, rot: -2 }],
  npcs: { folake: { x: 4, z: -8, rot: 0.2 }, tunde: { x: 32, z: -8, rot: -2 } }, choiceLabel: 'discount',
  endBeat: { text: 'By noon you have sold more than your mother did on her first day. She will never admit it.', line: 'A hard haggler is coming.' },
  starRules: ['Finish the level', 'Catch the customer before the timer ends', 'Be on time with two or fewer slips'],
}), fly('the market', 'Helicopter to the market', 'Second day at the stall', [sayAs('Mama Folake', 'folake', 'Second day. Take the helicopter, say good morning to everyone and smile at the customers.', 'happy')], [say('player', 'Fresh day. Fresh tomatoes. Same noisy helicopter.', 'happy')]))

// ---------------------------------------------------------------------------------------------------------------- Level 4
const me4 = stall(10, -8.6, ORANGE, 'YOUR STALL')
export const LEVEL_C3L4 = withBus(L({
  ch: 'ch3', n: 4, title: 'The Haggler', next: 'ch3.l5', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'Everyone has a haggler story. Today you get yours: a woman who has never paid the first price in her life and does not plan to start.',
  theme: { ground: '#c9b48a', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#e0d2b2' }], deco: MKT([me4.d, { kind: 'rug', x: 20, z: 1, w: 8, d: 3, color: RUST }, ...TREES([[-10, 10], [38, -10]]), ...LAMPS([[6, 3], [30, 3]])]) },
  furniture: [me4.f],
  spawn: { x: -9, z: 0 }, resume: { x: -6, z: 0 },
  tasks: [
    T('ch3.l4', 1, 'talk', 'Meet the haggler', { purpose: 'A woman wants your best tomatoes at half the price. Hear her out and answer.', objective: 'Talk to Madam Bisi', success: 'The haggling has begun.',
      intro: [say('helper', 'That is Madam Bisi. She is the reason the other stalls close at noon.', 'suspicious')], done: [say('player', 'Eight hundred? She said eight hundred? For these?', 'surprised')], hint: 'Madam Bisi waits in front of your stall.' }),
    T('ch3.l4', 2, 'hold', 'Stay firm', { purpose: 'A staring match: stand your ground until she gives in.', objective: 'Stand your ground', success: 'She blinks first.',
      intro: [sayAs('Madam Bisi', 'neighbour', 'I will wait. I have all day. I have all week.', 'suspicious')], done: [sayAs('Madam Bisi', 'neighbour', 'Fine. Fine! One-fifty off and not a kobo more.', 'angry')], hint: 'Stand inside the ring on the rug until the count is full.' }),
    T('ch3.l4', 3, 'choose', 'Settle the price', { purpose: 'She meets you halfway. All three answers are fair.', objective: 'Decide the final price', success: 'You settle.',
      intro: [sayAs('Madam Bisi', 'neighbour', 'So? Yes or no? My tomatoes are rotting. Yours, I mean.', 'angry')], done: [sayAs('Madam Bisi', 'neighbour', 'A pleasure. I will tell my cousin. She is worse than me.', 'cheeky')], hint: 'Three signs on the rug: hold the price, split the difference, or give in.' }),
  ],
  talks: { 0: [{ id: 'bisi', name: 'Madam Bisi', x: 12, z: -4, lines: [sayAs('Madam Bisi', 'neighbour', 'Your tomatoes. Eight hundred a crate? Ridiculous. Five hundred, and I carry them myself.', 'angry')], rounds: [
    { options: [
      { id: 'no', label: '"No, madam. Nine hundred is already the lowest."', reply: sayAs('Madam Bisi', 'neighbour', 'Nine?! I will bring my cousin!', 'angry') },
      { id: 'meet', label: '"Eight hundred and I add pepper."', reply: sayAs('Madam Bisi', 'neighbour', 'Pepper? Hm. Interesting.', 'curious') },
      { id: 'smile', label: '(Smile and say nothing.)', reply: sayAs('Madam Bisi', 'neighbour', 'You are smiling. I do not trust smiles.', 'suspicious') },
    ] },
  ] }] },
  holds: { 1: { x: 20, z: 1, r: 1.6, secs: 6, pose: 'lean' } },
  items: [
    { id: 'hold', task: 2, x: 16, z: 3.4, label: 'Hold the price', color: RUST, shape: 'sign', y: 0 },
    { id: 'split', task: 2, x: 20, z: 3.4, label: 'Split the difference', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'give', task: 2, x: 24, z: 3.4, label: 'Give in', color: GREEN, shape: 'sign', y: 0 },
  ],
  guide: [{ x: 12, z: -4, r: 3 }, RING(20, 1, 1.6), { x: 20, z: 3.4, r: 6 }],
  crowd: [{ x: 6, z: 6, rot: 1 }, { x: 28, z: 4, rot: -2 }],
  npcs: { folake: { x: 4, z: -8, rot: 0.2 }, tunde: { x: 33, z: -8, rot: -2 } }, choiceLabel: 'price',
  endBeat: { text: 'She leaves with a smile and eleven tomatoes. You tell yourself you won. You half believe it.', line: 'The money box is next.' },
  starRules: ['Finish the level', 'Finish without a hint', 'Finish without hints or mistakes'],
}), fly('the market', 'Helicopter to the market', 'Market day again', [sayAs('Mama Folake', 'folake', 'A woman is coming to your stall who has never paid the first price in her life. Take the helicopter and take your patience.', 'worried')], [sayAs('Baba Tunde', 'tunde', 'Stay calm. Breathe. And do not agree to the first offer.', 'confident')]))

// ---------------------------------------------------------------------------------------------------------------- Level 5
export const LEVEL_C3L5 = withBus(L({
  ch: 'ch3', n: 5, title: 'The Money Box', next: 'ch3.l6', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'Closing time and the takings need counting. The money box is somewhere in the market and every trader suddenly knows nothing.',
  theme: { ground: '#bfb393', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#d9cdb0' }], deco: MKT([stall(10, -8.6, ORANGE, 'YOUR STALL').d, { kind: 'sign', x: 33, z: -2, label: 'SUPPLIER', w: 1.8 }, { kind: 'rug', x: 12, z: 4.8, w: 8, d: 3, color: BLUE }, ...TREES([[-10, 10], [38, -10]]), ...LAMPS([[4, 3], [26, 3]])]) },
  furniture: [stall(10, -8.6, ORANGE, 'YOUR STALL').f, F('bin', R(24, 25.4, 5, 6.4), 1.0, GREY), F('crates', R(-6, -3, 5, 6.4), 0.8, DARK), F('table', R(8, 16, 7.8, 9.2), 0.8, WOOD)],
  spawn: { x: -9, z: 0 }, resume: { x: -6, z: 0 },
  tasks: [
    T('ch3.l5', 1, 'find', 'Find the money box', { purpose: 'The box was under something. Look in the likely places.', objective: 'Find the money box', success: 'You find the box.',
      intro: [say('folake', 'The box! Where is the box? It was RIGHT here!', 'angry')], done: [say('helper', 'Under the crates. Obviously.', 'tired')], hint: 'Try the crates, the bin and the table at the bottom.' }),
    T('ch3.l5', 2, 'sequence', 'Count the notes', { purpose: 'Count the takings in the right order: the big notes, the middle notes, the small notes.', objective: 'Count the ₦1000, ₦500 then ₦200 notes', success: 'The takings are counted.',
      intro: [say('folake', 'Thousands first. Then the five hundreds. Then the small ones. Do not rush, money does not run. People do.', 'calm')], done: [say('player', 'Ten thousand, three hundred. Not bad for a girl from the village.', 'proud')], hint: 'Order: ₦1000, ₦500, ₦200.' }),
    T('ch3.l5', 3, 'collect', 'Put aside the supplier money', { purpose: 'The supplier must be paid first: pick the right amounts out of the takings.', objective: 'Set aside the two supplier envelopes', success: 'The supplier\'s money is aside.',
      intro: [say('folake', 'Pay the supplier first. Always. Before the shoes, before the snacks, before the joy.', 'calm')], done: [say('player', 'Paid first. Learned from Mama.', 'proud')], hint: 'Take the two envelopes on the table that the supplier is owed.' }),
    T('ch3.l5', 4, 'choose', 'Save or restock', { purpose: 'What is left: save it, buy more stock, or share with your helper.', objective: 'Decide what to do with the rest', success: 'You choose.',
      intro: [sayAs('Mama Ngozi', 'neighbour', 'Money in a box earns nothing. Money in tomatoes earns more. Money shared earns friends.', 'cheeky')], done: [say('player', 'Decision made. May it be a good one.', 'worried')], hint: 'Three signs on the rug: save, restock or share.' }),
  ],
  spots: [
    { id: 'crates', task: 0, x: -4.4, z: 3.6, label: 'Look under the crates', right: true },
    { id: 'bin', task: 0, x: 24.7, z: 3.6, label: 'Look in the bin', wrong: say('player', 'I will never speak of this again.', 'tired') },
    { id: 'table', task: 0, x: 12, z: 6.4, label: 'Look under the table', wrong: say('helper', 'Two slippers and a goat. No box.', 'cheeky') },
  ],
  items: [
    { id: 'n1000', task: 1, x: 8.4, z: -8.2, label: 'Count the ₦1000 notes', color: GREEN, shape: 'bank', y: 1.0, act: 'countMoney' },
    { id: 'n500', task: 1, x: 10, z: -8.2, label: 'Count the ₦500 notes', color: BLUE, shape: 'bank', y: 1.0, act: 'countMoney' },
    { id: 'n200', task: 1, x: 11.6, z: -8.2, label: 'Count the ₦200 notes', color: YELLOW, shape: 'bank', y: 1.0, act: 'countMoney' },
    { id: 'e1', task: 2, x: 10, z: 8.5, label: 'Set aside the supplier envelope', color: '#fbf8f0', shape: 'wallet', y: 0.9, act: 'countMoney' },
    { id: 'e2', task: 2, x: 12, z: 8.5, label: 'Set aside the supplier envelope', color: '#fbf8f0', shape: 'wallet', y: 0.9, act: 'countMoney' },
    { id: 'save', task: 3, x: 8, z: 4.8, label: 'Save it for later', color: GREEN, shape: 'sign', y: 0 },
    { id: 'restock', task: 3, x: 12, z: 4.8, label: 'Restock the stall', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'share', task: 3, x: 16, z: 4.8, label: 'Share it with your helper', color: YELLOW, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['n1000', 'n500', 'n200'] },
  guide: [{ x: 8, z: 4, r: 18 }, { x: 10, z: -6.4, r: 3 }, { x: 12, z: 7, r: 4 }, { x: 12, z: 4.8, r: 6 }],
  crowd: [{ x: 26, z: 0, rot: -2 }, { x: 2, z: 8, rot: 0.5 }],
  npcs: { folake: { x: 4, z: -8, rot: 0.2 }, tunde: { x: 33, z: -8, rot: -2 } }, choiceLabel: 'plan',
  endBeat: { text: 'The money is counted, set aside and mostly safe. A small voice says "business is good", and nobody argues.', line: 'The sky is going dark.' },
  starRules: ['Finish the level', 'Finish with no wrong places', 'Finish with no mistakes and no hints'],
}), fly('the market', 'Helicopter after closing', 'The takings need counting', [sayAs('Mama Folake', 'folake', 'You left the money box at the stall. Take the helicopter back and count it before anyone else does.', 'worried')], [say('player', 'Please let the box still be there.', 'worried')]))

// ---------------------------------------------------------------------------------------------------------------- Level 6
const me6 = stall(10, -8.6, ORANGE, 'YOUR STALL')
export const LEVEL_C3L6 = withBus(L({
  ch: 'ch3', n: 6, title: 'Rain!', next: 'ch3.l7', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'The sky turns grey in about a minute. Every trader in the market starts running at the same time, and so should you.',
  theme: { ground: '#a8a08a', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#bfb8a4' }], deco: MKT([me6.d, { kind: 'awning', x: 36, z: 0, w: 6, d: 8, color: BLUE }, { kind: 'sign', x: 33, z: -4, label: 'SHELTER', w: 1.6 }, ...TREES([[-10, 10]]), ...LAMPS([[4, 3], [20, 3]])]) },
  furniture: [me6.f, F('crates', R(14, 17, -5, -3.8), 0.7, DARK)],
  spawn: { x: -9, z: 0 }, resume: { x: -6, z: 0 },
  tasks: [
    T('ch3.l6', 1, 'reach', 'Run for the stall', { purpose: 'Get back to the stall through a crowd all running the same way.', objective: 'Get back to your stall before the rain', success: 'You reach the stall before the timer ends.',
      intro: [say('folake', 'Rain! RAIN! Run!', 'angry')], done: [say('player', 'Stall. Goods. Tarpaulin. Go!', 'worried')], hint: 'Cross behind the walkers and run right.' }),
    T('ch3.l6', 2, 'sequence', 'Cover the goods', { purpose: 'Tarpaulin, rope, then weights: in that order or everything blows away.', objective: 'Tarpaulin, rope, then weights', success: 'The goods are covered.',
      intro: [say('helper', 'Tarpaulin, rope, weights! In that order or it all flies away!', 'worried')], done: [say('helper', 'It is holding! It is actually holding!', 'laughing')], hint: 'Order: tarpaulin, rope, weights.' }),
    T('ch3.l6', 3, 'choose', 'Save which goods first?', { purpose: 'Not everything can be saved at once. Your choice changes the next run.', objective: 'Choose what to carry to shelter first', success: 'You choose.',
      intro: [say('folake', 'Take the dry goods or the fresh ones first. You cannot carry both.', 'worried')], done: [say('player', 'Decision made. Run!', 'confident')], hint: 'Fresh goods are heavy and slow. Dry goods are light and fast.' }),
    T('ch3.l6', 4, 'reach', 'Carry it to shelter', { purpose: 'Heavy fresh goods are slow but safe; light dry goods are fast but risky.', objective: 'Carry the goods to the shelter', variant: true, success: 'You reach the shelter before the timer ends.',
      intro: [say('tunde', 'Shelter is on the right! Move your feet!', 'angry')], done: [say('player', 'Dry! Mostly dry! Somewhat damp!', 'laughing')], hint: 'Cross behind what slides, then run to the shelter.' }),
  ],
  items: [
    { id: 'tarp', task: 1, x: 8.4, z: -8.2, label: 'Pull the tarpaulin', color: BLUE, shape: 'blanket', y: 1.0, act: 'reachHigh' },
    { id: 'rope', task: 1, x: 10, z: -8.2, label: 'Tie the rope', color: '#a87a50', shape: 'stamp', y: 1.0, act: 'grab' },
    { id: 'weights', task: 1, x: 11.6, z: -8.2, label: 'Add the weights', color: '#1c1b22', shape: 'crate', y: 1.0, act: 'lift' },
    { id: 'fresh', task: 2, x: 14, z: 2.4, label: 'Carry the fresh goods (heavy)', color: GREEN, shape: 'sign', y: 0 },
    { id: 'dry', task: 2, x: 19, z: 2.4, label: 'Carry the dry goods (light)', color: YELLOW, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['tarp', 'rope', 'weights'] },
  goto: [RING(10, -5.6, 1.6), null, null, RING(36, 0, 1.6)],
  guide: [RING(10, -5.6), { x: 10, z: -6.4, r: 3 }, { x: 16, z: 2.4, r: 6 }, RING(36, 0)],
  hazards: [D('walker', 0, -7, 7, 3.0, 0, GREEN), D('walker', 4, -7, 7, 3.2, 1.2, ORANGE), D('walker', 20, -7, 7, 2.8, 0.6, RUST)],
  variants: {
    fresh: { label: 'Fresh goods', timeLimit: 26, hazards: [D('cart', 24, -7, 7, 2.2, 0, RUST), D('cart', 29, -7, 7, 2.4, 1.2, GREEN)] },
    dry: { label: 'Dry goods', timeLimit: 15, hazards: [D('cart', 22, -7, 7, 3.6, 0, RUST), D('cart', 26.4, -7, 7, 4.0, 1.3, GREEN), D('walker', 30, -7, 7, 3.2, 0.7, ORANGE)] },
  },
  timeLimit: 18,
  crowd: [{ x: 6, z: 6, rot: 0.6 }, { x: 28, z: 6, rot: -2 }],
  npcs: { folake: { x: 4, z: -8, rot: 0.2 }, tunde: { x: 33, z: 6, rot: -2.4 } }, choiceLabel: 'goods',
  endBeat: { text: 'Under the shelter, everyone is soaked, laughing and slightly in love with the stranger next to them.', line: 'Not everyone is so friendly next.' },
  starRules: ['Finish the level', 'Reach the shelter before the timer ends', 'Be on time with two or fewer slips'],
}), fly('the market', 'Helicopter to the market', 'Dark clouds are gathering', [sayAs('Mama Folake', 'folake', 'The sky looks angry. Take the helicopter now and cover those goods before it rains!', 'worried')], [sayAs('Baba Tunde', 'tunde', 'It will rain the second you land. Run.', 'angry')]))

// ---------------------------------------------------------------------------------------------------------------- Level 7
export const LEVEL_C3L7 = withBus(L({
  ch: 'ch3', n: 7, title: 'The Competitor', next: 'ch3.l8', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'The stall across the lane has been selling the same tomatoes, to the same people, for a very different price. Something smells.',
  theme: { ground: '#c9b48a', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#e0d2b2' }], deco: MKT([stall(8, -8.6, ORANGE, 'YOUR STALL').d, stall(26, -8.6, RUST, 'LUCKY STALL').d, { kind: 'sign', x: 17, z: 3, label: 'BINS', w: 1.2 }, { kind: 'rug', x: 26, z: 2, w: 7, d: 3, color: RUST }, ...TREES([[-10, 10], [38, -10]]), ...LAMPS([[4, 3], [32, 3]])]) },
  furniture: [stall(8, -8.6, ORANGE, 'YOUR STALL').f, stall(26, -8.6, RUST, 'LUCKY STALL').f, F('bins', R(16, 18.4, 4.4, 5.8), 0.9, GREY), F('cart', R(-4, -1, 6, 7.6), 0.9, DARK)],
  spawn: { x: -9, z: 0 }, resume: { x: -6, z: 0 },
  tasks: [
    T('ch3.l7', 1, 'find', 'Find who moved your sign', { purpose: 'Your price sign has been moved: find where it ended up.', objective: 'Find your missing price sign', success: 'You find the sign.',
      intro: [say('player', 'My sign has legs. Somebody gave it legs.', 'angry')], done: [say('helper', 'The bins! Of course the bins.', 'tired')], hint: 'Try the cart, the bins and behind the Lucky Stall.' }),
    T('ch3.l7', 2, 'talk', 'Face the competitor', { purpose: 'The man at the Lucky Stall says he knows nothing. Answer him however you like.', objective: 'Talk to Mr Lucky', success: 'You have spoken.',
      intro: [say('helper', 'He is the one with the large smile and the very low prices.', 'suspicious')], done: [say('player', 'Okay. That is how we are doing this.', 'confident')], hint: 'Mr Lucky stands in front of the LUCKY STALL.' }),
    T('ch3.l7', 3, 'hold', 'Outlast him', { purpose: 'A staring match: stand in the ring until he blinks.', objective: 'Stand your ground', success: 'You outlast him.',
      intro: [sayAs('Mr Lucky', 'neighbour', 'Say something.', 'suspicious')], done: [say('tunde', 'Looks like he blinked first.', 'proud')], hint: 'Stand inside the ring until the count is full.' }),
  ],
  spots: [
    { id: 'cart', task: 0, x: -2.4, z: 4.6, label: 'Look under the cart', wrong: say('player', 'Just a goat. The goat has no opinion.', 'curious') },
    { id: 'bins', task: 0, x: 17.2, z: 3.4, label: 'Look in the bins', right: true },
    { id: 'back', task: 0, x: 26, z: -6.4, label: 'Look behind his stall', wrong: say('player', 'More tomatoes. Cheaper tomatoes. I am furious.', 'angry') },
  ],
  talks: { 1: [{ id: 'lucky', name: 'Mr Lucky', x: 26, z: -4.6, lines: [sayAs('Mr Lucky', 'neighbour', 'Your sign? Maybe the wind moved it. Maybe the wind has a business.', 'cheeky')], rounds: [{ options: [
    { id: 'confront', label: '"I know it was you."', reply: sayAs('Mr Lucky', 'neighbour', 'Are you accusing me? In front of my own tomatoes?', 'angry') },
    { id: 'joke', label: '"The wind has good taste in competition."', reply: sayAs('Mr Lucky', 'neighbour', 'Ha. Funny. Very funny. Stop smiling.', 'angry') },
    { id: 'letgo', label: '"Let us forget it and sell tomatoes."', reply: sayAs('Mr Lucky', 'neighbour', 'You are not going to say anything else? Hm.', 'suspicious') },
  ] }] }] },
  holds: { 2: { x: 26, z: 1, r: 1.6, secs: 6, pose: 'lean' } },
  guide: [{ x: 10, z: 4, r: 14 }, { x: 26, z: -4, r: 3 }, RING(26, 1, 1.6)],
  crowd: [{ x: 20, z: 6, rot: -1.6 }, { x: 4, z: 8, rot: 0.4 }],
  npcs: { folake: { x: 4, z: -8, rot: 0.2 }, tunde: { x: 34, z: -8, rot: -2.2 } }, choiceLabel: 'reaction',
  endBeat: { text: 'He smiles, you smile, the goat looks between you. Nothing is settled and everybody knows it.', line: 'The inspector arrives next.' },
  starRules: ['Finish the level', 'Take your time: no timer here', 'Finish with no wrong searches'],
}), fly('his market', 'Helicopter to his market', 'The competitor trades across town', [say('helper', 'Lucky Stall is cheaper than yours. Suspiciously cheaper. Take the helicopter and go and see.', 'suspicious')], [sayAs('Mr Lucky', 'neighbour', 'Welcome to Lucky Stall! Everything is lucky!', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 8
export const LEVEL_C3L8 = withBus(L({
  ch: 'ch3', n: 8, title: 'The Inspector', next: 'ch3.l9', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'A man in a hat and with a very small clipboard is walking down the aisle, looking at everything. Everybody stands up straighter.',
  theme: { ground: '#c9b48a', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#e0d2b2' }], deco: MKT([stall(10, -8.6, ORANGE, 'YOUR STALL').d, { kind: 'rug', x: 24, z: 3, w: 6, d: 3, color: GREEN }, { kind: 'sign', x: 32, z: 4, label: 'LICENCE OFFICE', w: 2.4 }, ...TREES([[-10, 10], [38, -10]]), ...LAMPS([[4, 3], [20, 3]])]) },
  furniture: [stall(10, -8.6, ORANGE, 'YOUR STALL').f, F('desk', R(30, 35, 6, 7.4), 0.9, WOOD), F('shelves', R(-6, -2, -7, -5.8), 1.4, DARK)],
  spawn: { x: -9, z: 0 }, resume: { x: -6, z: 0 },
  tasks: [
    T('ch3.l8', 1, 'talk', 'Greet the inspector', { purpose: 'Say good morning and answer his first question honestly.', objective: 'Talk to the inspector', success: 'He starts his inspection.',
      intro: [say('helper', 'That is Mr Danladi. He has closed three stalls this year and eaten at none.', 'worried')], done: [sayAs('Mr Danladi', 'neighbour', 'Tidy your stall. I will be back in five minutes. Have your licence ready.', 'calm')], hint: 'Mr Danladi stands in front of your stall.' }),
    T('ch3.l8', 2, 'sequence', 'Tidy up fast', { purpose: 'Sweep, wipe, then straighten the crates: in that order.', objective: 'Sweep, wipe, then straighten the crates', success: 'The stall is spotless.',
      intro: [say('folake', 'Sweep the floor. Wipe the counter. Straighten the crates. In that order, quickly!', 'worried')], done: [say('folake', 'It gleams. Who are you? What have you done with my child?', 'laughing')], hint: 'Order: sweep, wipe, crates.' }),
    T('ch3.l8', 3, 'find', 'Find your licence', { purpose: 'The licence was somewhere safe. Look in the likely places.', objective: 'Find your licence', success: 'You find the licence.',
      intro: [say('player', 'It was somewhere safe. Somewhere so safe I forgot.', 'worried')], done: [say('player', 'In the licence office folder. Where it always lives.', 'tired')], hint: 'Try the shelves, the rug and the LICENCE OFFICE desk.' }),
    T('ch3.l8', 4, 'choose', 'Be honest or bluff?', { purpose: 'He finds a small problem. All three answers have a price.', objective: 'Decide how to answer', success: 'You choose.',
      intro: [sayAs('Mr Danladi', 'neighbour', 'This scale is not stamped. Whose fault is that?', 'suspicious')], done: [sayAs('Mr Danladi', 'neighbour', 'Noted. Everything is noted.', 'calm')], hint: 'Three signs on the rug: admit it, blame the supplier or promise to fix it.' }),
  ],
  talks: { 0: [{ id: 'danladi', name: 'Mr Danladi', x: 10, z: -5, lines: [sayAs('Mr Danladi', 'neighbour', 'Good morning. Weights, scales, licence, hygiene. I look at all of them. I will not smile at any of them.', 'calm')], rounds: [{ options: [
    { id: 'welcome', label: '"Welcome, sir. Please look at anything."', reply: sayAs('Mr Danladi', 'neighbour', 'Confidence. I will test it.', 'curious') },
    { id: 'nervous', label: '"I am a bit nervous, sir."', reply: sayAs('Mr Danladi', 'neighbour', 'Good. Nervous people are careful.', 'calm') },
  ] }] }] },
  items: [
    { id: 'sweep', task: 1, x: 8.4, z: -8.2, label: 'Sweep the floor', color: '#a87a50', shape: 'stamp', y: 1.0, act: 'sweep' },
    { id: 'wipe', task: 1, x: 10, z: -8.2, label: 'Wipe the counter', color: '#fbf8f0', shape: 'blanket', y: 1.0, act: 'wipe' },
    { id: 'tidy', task: 1, x: 11.6, z: -8.2, label: 'Straighten the crates', color: ORANGE, shape: 'crate', y: 1.0, act: 'lift' },
    { id: 'admit', task: 3, x: 20, z: 5.4, label: 'Admit it and apologise', color: GREEN, shape: 'sign', y: 0 },
    { id: 'blame', task: 3, x: 24, z: 5.4, label: 'Blame the supplier', color: RUST, shape: 'sign', y: 0 },
    { id: 'fix', task: 3, x: 28, z: 5.4, label: 'Promise to fix it today', color: YELLOW, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['sweep', 'wipe', 'tidy'] },
  spots: [
    { id: 'shelves', task: 2, x: -4, z: -4.6, label: 'Check the shelves', wrong: say('player', 'Dust. A lot of dust. A very proud spider.', 'tired') },
    { id: 'rug', task: 2, x: 24, z: 0.8, label: 'Check under the rug', wrong: say('helper', 'A coin. A button. No licence.', 'cheeky') },
    { id: 'desk', task: 2, x: 32.5, z: 4.8, label: 'Check the licence desk', right: true },
  ],
  guide: [{ x: 10, z: -5, r: 3 }, { x: 10, z: -6.4, r: 3 }, { x: 28, z: 3, r: 12 }, { x: 24, z: 5.4, r: 6 }],
  crowd: [{ x: 20, z: -4, rot: 3 }, { x: 4, z: 6, rot: 0.4 }],
  npcs: { folake: { x: 4, z: -8, rot: 0.2 }, tunde: { x: 36, z: -6, rot: -2 } }, choiceLabel: 'answer',
  endBeat: { text: 'He writes something small on his small clipboard and leaves. The market breathes out like one very large animal.', line: 'The season ends tomorrow.' },
  starRules: ['Finish the level', 'Finish with no wrong places', 'Finish with no mistakes and no hints'],
}), fly('the market', 'Helicopter to the market', 'Inspection day', [sayAs('Mama Folake', 'folake', 'The inspector is coming today. Tidy, honest and early. Take the helicopter and do not be late!', 'worried')], [say('helper', 'I hear the inspector has a very small clipboard and a very big opinion.', 'suspicious')]))

// ---------------------------------------------------------------------------------------------------------------- Level 9
export const LEVEL_C3L9 = withBus(L({
  ch: 'ch3', n: 9, title: 'Closing Time', next: null, badge: 'Market Day', bounds: R(-12, 40, -12.4, 12.4),
  intro: 'The last day of the season. The crowd thins, the light turns orange and the whole market starts to count what it earned.',
  theme: { ground: '#c9a074', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#e0c9a0' }], deco: MKT([stall(10, -8.6, ORANGE, 'YOUR STALL').d, { kind: 'rug', x: 22, z: 3, w: 8, d: 3.4, color: GREEN }, { kind: 'sign', x: 37, z: 0, label: 'SHUTTER', w: 1.8 }, ...TREES([[-10, 10], [38, -10]]), ...LAMPS([[4, 3], [26, 3]])]) },
  furniture: [stall(10, -8.6, ORANGE, 'YOUR STALL').f, F('table', R(16, 24, -2.4, -1), 0.8, WOOD)],
  spawn: { x: -9, z: 0 }, resume: { x: -6, z: 0 },
  tasks: [
    T('ch3.l9', 1, 'collect', 'Stack the unsold crates', { purpose: 'Three crates did not sell today: lift them onto the pile for tomorrow.', objective: 'Stack three crates', success: 'The pile is tidy.',
      intro: [say('folake', 'Three crates left. Stack them neat. Lift with the knees, not the opinions.', 'calm')], done: [say('player', 'Tomorrow they will sell. Tomorrow they will sell.', 'proud')], hint: 'The crates are on the ground near the stall. Lift each one.' }),
    T('ch3.l9', 2, 'sequence', 'Count the day\'s money', { purpose: 'Count the takings in order: big notes, middle notes, small notes.', objective: 'Count the ₦1000, ₦500 then ₦200 notes', success: 'The takings are counted.',
      intro: [say('folake', 'Now the money. Big notes first. Slowly. People who count fast count wrong.', 'calm')], done: [say('player', 'Twenty-two thousand. Twenty-two thousand!', 'surprised')], hint: 'Order on the table: ₦1000, ₦500, ₦200.' }),
    T('ch3.l9', 3, 'choose', 'Share the profit', { purpose: 'How much do you pay your helper and how much do you keep?', objective: 'Decide how to share the profit', success: 'You choose.',
      intro: [sayAs('Kofi', 'helper', 'I did not do anything. I only carried everything. All day. Slowly.', 'cheeky')], done: [sayAs('Kofi', 'helper', 'You are the best boss. Do not tell the other boss.', 'happy')], hint: 'Three signs on the rug: even split, a bonus for the helper or keep most.' }),
    T('ch3.l9', 4, 'talk', 'Tell Mama Folake', { purpose: 'Tell Mama what happened this season, and hear what she has to say about it.', objective: 'Talk to Mama Folake', success: 'Mama has heard it all.',
      intro: [say('player', 'Where do I even start?', 'thinking')], done: [say('folake', 'You did well, my child. Better than I did my first season. Do not tell your father.', 'proud')], hint: 'Mama Folake sits on the right near the shutter.' }),
    T('ch3.l9', 5, 'goto', 'Close the shutter', { purpose: 'The last job of the season: pull the shutter down.', objective: 'Walk to the shutter and close it', success: 'The shutter is down.',
      intro: [say('tunde', 'Go on. The last one is always the best one.', 'proud')], done: [say('folake', 'Season over. Go home. Sleep. We start tomorrow.', 'happy')], hint: 'The shutter is on the far right.' }),
  ],
  items: [
    { id: 'crA', task: 0, x: 4, z: 2, label: 'Lift a crate', color: ORANGE, shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'crB', task: 0, x: 6, z: 4.4, label: 'Lift a crate', color: RUST, shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'crC', task: 0, x: 8, z: 2.4, label: 'Lift a crate', color: YELLOW, shape: 'crate', y: 0.3, act: 'lift' },
    { id: 'n1000', task: 1, x: 17.6, z: -1.7, label: 'Count the ₦1000 notes', color: GREEN, shape: 'bank', y: 0.9, act: 'countMoney' },
    { id: 'n500', task: 1, x: 20, z: -1.7, label: 'Count the ₦500 notes', color: BLUE, shape: 'bank', y: 0.9, act: 'countMoney' },
    { id: 'n200', task: 1, x: 22.4, z: -1.7, label: 'Count the ₦200 notes', color: YELLOW, shape: 'bank', y: 0.9, act: 'countMoney' },
    { id: 'even', task: 2, x: 18, z: 4.6, label: 'Split it evenly', color: GREEN, shape: 'sign', y: 0 },
    { id: 'bonus', task: 2, x: 22, z: 4.6, label: 'Give your helper a bonus', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'keep', task: 2, x: 26, z: 4.6, label: 'Keep most of it', color: RUST, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['n1000', 'n500', 'n200'] },
  talks: { 3: [{ id: 'mamaF', name: 'Mama Folake', x: 33, z: -3, lines: [sayAs('Mama Folake', 'folake', 'So. A whole season. Tell me three things: what went right, what went wrong and what you will do differently.', 'calm')], rounds: [{ options: [
    { id: 'right', label: '"Customers came back. That went right."', reply: sayAs('Mama Folake', 'folake', 'Customers coming back is everything. Remember that.', 'happy') },
    { id: 'wrong', label: '"I lost the money box. Once."', reply: sayAs('Mama Folake', 'folake', 'Once is a lesson. Twice is a habit. Good.', 'cheeky') },
    { id: 'better', label: '"I will never skip the supplier again."', reply: sayAs('Mama Folake', 'folake', 'Then you already know more than half the market.', 'proud') },
  ] }] }] },
  goto: [null, null, null, null, RING(36, 0, 1.5)],
  guide: [{ x: 6, z: 3, r: 5 }, { x: 20, z: -1.7, r: 5 }, { x: 22, z: 4.6, r: 6 }, { x: 33, z: -3, r: 4 }, RING(36, 0)],
  crowd: [{ x: 14, z: 5, rot: 2 }],
  npcs: { folake: { x: 33, z: -5.4, rot: -2.4 }, tunde: { x: 2, z: -8, rot: 0.4 } }, choiceLabel: 'profit',
  endBeat: { text: 'The shutter comes down with a long, tired clatter. In the dark the market hums with the sound of a hundred people deciding what to eat.', line: 'Chapter 3 is done.' },
  starRules: ['Finish the level', 'Finish with no wrong order', 'Finish with no mistakes and no hints'],
}), fly('the market', 'Helicopter to the market', 'The last trading day', [sayAs('Mama Folake', 'folake', 'Last day of the season. Take the helicopter, my child. We count the money together tonight.', 'happy')], [sayAs('Baba Tunde', 'tunde', 'Whatever you earned, you earned it standing up.', 'proud')]))
