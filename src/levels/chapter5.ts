// Chapter 5 "Beach Weekend": a group trip that keeps changing its plan. A keke (three-wheeler) takes you everywhere: to the meeting point, along the road to
// the coast, to the beach itself. Friends to talk to, a lunch to cook and serve, football in the sand, the tide, a missing friend and a sunset.
import type { Deco, Furn } from './schema'
import { L, T, R, F, say, sayAs, D, WOOD, DARK } from './chapter1b'
import { B, TREES, LAMPS, RING, GREEN } from './chapter1c'
import { withBus, type BusOpts } from './bus'

const ORANGE = '#e07a1f', YELLOW = '#f5b91c', RUST = '#c4562a', BLUE = '#2b6ad0', SAND = '#e8d8a8'
const ride = (to: string, title: string, why: string, intro: BusOpts['intro'], done: BusOpts['done']): BusOpts => ({ vehicle: 'keke', to, title, purpose: `${why}: wait at the stand, board the keke and ride there.`, objective: `Take the keke to ${to}`, success: `You hop off at ${to}.`, intro, done })
/** a beach: sand, the sea along the top, palms, a few umbrellas */
const BEACH = (extra: Deco[] = []): { floors: { x0: number; x1: number; z0: number; z1: number; color: string }[]; deco: Deco[] } => ({
  floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: SAND }],
  deco: [{ kind: 'water', x: 14, z: -12, w: 80, d: 4.4 }, ...TREES([[-10, 9], [39, 9], [20, 10]]), ...LAMPS([[6, 6]]), ...extra],
})
const TOWN = (extra: Deco[] = []): { floors: { x0: number; x1: number; z0: number; z1: number; color: string }[]; deco: Deco[] } => ({
  floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#d9cdb0' }],
  deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: '#f3e7cf' }, ...TREES([[-10, 9], [39, 9]]), ...LAMPS([[8, 4], [26, 4]]), ...extra],
})
const umbrella = (x: number, z: number, color: string): Deco => ({ kind: 'awning', x, z, w: 3.2, d: 3.2, color })
const base = { spawn: { x: -9, z: 0 }, resume: { x: -6, z: 2 } }
const BIGB = R(-12, 40, -12.4, 12.4)

// ---------------------------------------------------------------------------------------------------------------- Level 1
const snackShop = B('snackshop', 28, 38, -12, -8, '#f0d9a8', 'SNACK SHOP', 3.0)
export const LEVEL_C5L1 = withBus(L({
  ch: 'ch5', n: 1, title: 'The Plan', next: 'ch5.l2', bounds: BIGB,
  intro: 'It is Thursday and the group chat has two hundred unread messages. Everyone wants the beach. Nobody agrees on which one.',
  theme: { ground: '#bfb393', ...TOWN([...snackShop.d, { kind: 'rug', x: 14, z: 5, w: 9, d: 3, color: GREEN }, { kind: 'sign', x: 37, z: 0, label: 'KEKE STAND', w: 1.8 }]) },
  furniture: [snackShop.f, F('bench', R(4, 9, 7, 8), 0.6, DARK)], ...base,
  tasks: [
    T('ch5.l1', 1, 'talk', 'Settle the plan', { purpose: 'Three friends, three different ideas for the weekend. Hear them all out.', objective: 'Talk to Ada, Bayo and Chi', success: 'You have heard everyone.',
      intro: [say('helper', 'The group chat has gone quiet. That is never good. Go and ask them in person.', 'cheeky')], done: [say('player', 'Beach, beach and beach. At different beaches. Fine.', 'thinking')], hint: 'Ada, Bayo and Chi stand in front of the buildings along the top.' }),
    T('ch5.l1', 2, 'choose', 'Pick the beach', { purpose: 'Three beaches to choose from. Whichever you choose, the weekend gets its own flavour.', objective: 'Choose which beach to go to', success: 'You choose.',
      intro: [say('player', 'A quiet one, a busy one or a far one. Everyone will complain about all three.', 'thinking')], done: [sayAs('Ada', 'neighbour', 'Fine. But I am bringing my own umbrella.', 'cheeky')], hint: 'Three signs on the rug: quiet beach, party beach or the far beach.' }),
    T('ch5.l1', 3, 'collect', 'Buy snacks for the trip', { purpose: 'You have ₦1500 for three things from the shop. The cake is lovely and too dear.', objective: 'Buy 3 snacks within ₦1500', success: 'Three snacks are in your bag.',
      intro: [sayAs('Shopkeeper', 'neighbour', 'Chips, drinks, fruit, cake. The cake is fresh. The cake is also expensive. The cake knows.', 'cheeky')], done: [say('player', 'Chips, drinks, fruit. A balanced diet, if you squint.', 'happy')], hint: 'Pick chips, fruit and drinks. If you overspend, tap Start over.' }),
    T('ch5.l1', 4, 'reach', 'Catch the keke', { purpose: 'The last keke leaves in a minute and the road is busy.', objective: 'Run to the keke stand', success: 'You reach the stand before the timer ends.',
      intro: [sayAs('Bayo', 'helper', 'The keke is leaving! Run! It does not wait for dreamers!', 'worried')], done: [say('player', 'On time. Sandwiched between two strangers and a goat. On time.', 'laughing')], hint: 'Cross behind the traffic and run right to the KEKE STAND.' }),
  ],
  talks: { 0: [
    { id: 'ada', name: 'Ada', x: 4, z: -4, lines: [sayAs('Ada', 'neighbour', 'Quiet beach. Hammocks. Books. Silence. No loud music. I will leave if there is loud music.', 'calm')], rounds: [{ options: [
      { id: 'yes', label: '"Quiet sounds lovely."', reply: sayAs('Ada', 'neighbour', 'Finally someone with taste.', 'happy') },
      { id: 'maybe', label: '"Maybe a little music?"', reply: sayAs('Ada', 'neighbour', 'A little. A very little. I am timing it.', 'suspicious') },
    ] }] },
    { id: 'bayo', name: 'Bayo', x: 16, z: -4, lines: [sayAs('Bayo', 'helper', 'Party beach! Speakers! Football! People! More people! And a man selling roasted corn!', 'cheeky')] },
    { id: 'chi', name: 'Chi', x: 26, z: -4, lines: [sayAs('Chi', 'neighbour', 'The far beach. Three hours there. But nobody else knows about it. Not even Google.', 'curious')] },
  ] },
  items: [
    { id: 'quiet', task: 1, x: 8, z: 3.6, label: 'Go to the quiet beach', color: GREEN, shape: 'sign', y: 0 },
    { id: 'party', task: 1, x: 14, z: 3.6, label: 'Go to the party beach', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'far', task: 1, x: 20, z: 3.6, label: 'Go to the far beach', color: BLUE, shape: 'sign', y: 0 },
    { id: 'chips', task: 2, price: 300, x: 29.4, z: -8.6, label: 'Buy chips (₦300)', color: YELLOW, shape: 'snack', y: 1.1 },
    { id: 'fruit', task: 2, price: 400, x: 31.4, z: -8.6, label: 'Buy fruit (₦400)', color: ORANGE, shape: 'produce', y: 1.1 },
    { id: 'drinks', task: 2, price: 500, x: 33.4, z: -8.6, label: 'Buy drinks (₦500)', color: BLUE, shape: 'bottle', y: 1.1 },
    { id: 'cake', task: 2, price: 1200, x: 35.4, z: -8.6, label: 'Buy cake (₦1200)', color: '#e0457b', shape: 'cake', y: 1.1 },
  ],
  budgets: { 2: { budget: 1500, need: 3 } },
  goto: [null, null, null, RING(36, 0, 1.5)],
  guide: [{ x: 15, z: -4, r: 14 }, { x: 14, z: 3.6, r: 8 }, { x: 33, z: -7, r: 5 }, RING(36, 0)],
  hazards: [D('cart', 12, -6, 7, 2.8, 0, RUST), D('walker', 18, -6, 7, 2.6, 1.2, GREEN), D('cart', 24, -6, 7, 3.0, 0.6, ORANGE), D('walker', 30, -6, 7, 2.4, 0.2)],
  timeLimit: 20,
  crowd: [{ x: 22, z: 6, rot: -2 }, { x: 4, z: 5, rot: 1.4 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 8, rot: -2.4 } }, choiceLabel: 'beach',
  endBeat: { text: 'The plan is settled. For ten minutes. Then the group chat lights up again with a new plan and a lot of exclamation marks.', line: 'Meet at the stand in the morning.' },
  starRules: ['Finish the level', 'Reach the stand before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the stand', 'Keke to the meeting', 'The group is meeting in town', [sayAs('Mama Folake', 'folake', 'A beach weekend with friends! Take the keke into town, take sunscreen and do not take the whole fridge.', 'happy')], [say('helper', 'Keke drivers are the only people in the city who drive on faith.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 2
export const LEVEL_C5L2 = withBus(L({
  ch: 'ch5', n: 2, title: 'The Meeting Point', next: 'ch5.l3', bounds: BIGB,
  intro: 'Seven in the morning at the car park. Half the group is there, half the group is "five minutes away" and the van has not decided to exist yet.',
  theme: { ground: '#bfb393', ...TOWN([{ kind: 'rug', x: 22, z: 4, w: 8, d: 3, color: BLUE }, { kind: 'sign', x: 3, z: -6, label: 'CAR PARK', w: 1.8 }]) },
  furniture: [F('van', R(4, 9, -8, -5.6), 1.7, BLUE), F('car1', R(14, 18.4, -8.4, -6), 1.3, RUST), F('car2', R(24, 28.4, -8.4, -6), 1.3, '#2b8aa0'), F('bench', R(18, 24, 6.4, 7.4), 0.6, DARK)], ...base,
  tasks: [
    T('ch5.l2', 1, 'find', 'Find your group', { purpose: 'A car park full of groups with bags. Which one is yours?', objective: 'Find your friends\' van', success: 'You find the group.',
      intro: [say('player', 'Everyone has a cooler and a sunhat. Everyone looks like my friends. None of them is.', 'worried')], done: [sayAs('Ada', 'neighbour', 'There you are! We were about to leave. We were not. But we were about to.', 'happy')], hint: 'Check the blue van, the red car and the green car.' }),
    T('ch5.l2', 2, 'talk', 'Roll call', { purpose: 'Count heads and find out who has what.', objective: 'Talk to Ada and Chi', success: 'You know who is here and who is missing.',
      intro: [sayAs('Ada', 'neighbour', 'Roll call! Who has the speaker? Who has the towels? Who has the money?', 'cheeky')], done: [say('player', 'Everyone is here except Dami. And the towels.', 'thinking')], hint: 'Ada is by the van; Chi stands near the cars.' }),
    T('ch5.l2', 3, 'hold', 'Wait for Dami', { purpose: 'Dami is "five minutes away". Wait with everyone else and try to look relaxed.', objective: 'Wait for Dami at the bench', success: 'Dami arrives.',
      intro: [sayAs('Chi', 'neighbour', 'Five minutes. In Dami time that is forty.', 'tired')], done: [sayAs('Dami', 'helper', 'Sorry sorry sorry! The alarm was loud. I was louder. In my dream.', 'cheeky')], hint: 'Stand in the ring by the bench until Dami arrives.' }),
    T('ch5.l2', 4, 'choose', 'Who rides where?', { purpose: 'Two vehicles, six people. Pick who goes with whom.', objective: 'Choose who rides in the keke', success: 'You choose.',
      intro: [sayAs('Bayo', 'helper', 'Whoever goes in the keke gets the breeze. Whoever goes in the van gets the music.', 'cheeky')], done: [sayAs('Ada', 'neighbour', 'Fine. But the quiet people are mine.', 'calm')], hint: 'Three signs on the rug: keke with Ada, keke with Bayo or the van.' }),
  ],
  spots: [
    { id: 'van', task: 0, x: 6.5, z: -4.4, label: 'Check the blue van', right: true },
    { id: 'car1', task: 0, x: 16.2, z: -4.8, label: 'Check the red car', wrong: say('helper', 'A family of six and a goat. Not our goat.', 'cheeky') },
    { id: 'car2', task: 0, x: 26.2, z: -4.8, label: 'Check the green car', wrong: say('player', 'A man in sunglasses asking if I need a ride. I do not.', 'tired') },
  ],
  talks: { 1: [
    { id: 'ada', name: 'Ada', x: 10, z: -4, lines: [sayAs('Ada', 'neighbour', 'Towels, speaker, cooler, money. Who has what? Nobody ever knows.', 'calm')], rounds: [{ options: [
      { id: 'towels', label: '"I have the towels."', reply: sayAs('Ada', 'neighbour', 'Thank goodness. One responsible person.', 'happy') },
      { id: 'cooler', label: '"I have the cooler."', reply: sayAs('Ada', 'neighbour', 'And the ice? You have the ice?', 'suspicious') },
      { id: 'nothing', label: '"I have a smile and a hat."', reply: sayAs('Ada', 'neighbour', 'We will take the hat. And the smile. In that order.', 'cheeky') },
    ] }] },
    { id: 'chi', name: 'Chi', x: 21, z: -4, lines: [sayAs('Chi', 'neighbour', 'Dami is late again. I have a bet with Bayo on how late.', 'cheeky')] },
  ] },
  holds: { 2: { x: 21, z: 5.4, r: 1.4, secs: 6, pose: 'lean' } },
  items: [
    { id: 'kekeAda', task: 3, x: 16, z: 3.4, label: 'Ride the keke with Ada', color: GREEN, shape: 'sign', y: 0 },
    { id: 'kekeBayo', task: 3, x: 22, z: 3.4, label: 'Ride the keke with Bayo', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'vanAll', task: 3, x: 28, z: 3.4, label: 'Ride in the van', color: BLUE, shape: 'sign', y: 0 },
  ],
  guide: [{ x: 15, z: -4, r: 14 }, { x: 15, z: -4, r: 12 }, RING(21, 5.4, 1.4), { x: 22, z: 3.4, r: 7 }],
  crowd: [{ x: 12, z: -2, rot: 3 }, { x: 30, z: 4, rot: -2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 36, z: 8, rot: -2.4 } }, choiceLabel: 'seating',
  endBeat: { text: 'Six people, two bags of towels, one speaker and a cooler the size of a small car. The road to the coast has no idea what is coming.', line: 'A stop on the road.' },
  starRules: ['Finish the level', 'Finish with no wrong cars', 'Finish with no mistakes and no hints'],
}), ride('the car park', 'Keke to the car park', 'Everyone is meeting at the car park', [sayAs('Mama Folake', 'folake', 'Seven sharp at the car park. Take the keke, take a hat, and do not wait for Dami. Nobody waits for Dami.', 'calm')], [say('helper', 'The driver says he knows a faster road. He has said that before.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 3
const stallI = (x: number, color: string, label: string): { f: Furn; d: Deco } => ({ f: F(`s${x}`, R(x - 1.7, x + 1.7, -9.8, -8.2), 1.0, WOOD), d: { kind: 'stall', x, z: -9, w: 3.4, d: 1.6, color, label } })
const sI = stallI(8, BLUE, 'ICE'), sW = stallI(18, '#2b8aa0', 'WATER'), sS = stallI(28, YELLOW, 'SUNSCREEN')
export const LEVEL_C5L3 = withBus(L({
  ch: 'ch5', n: 3, title: 'Stop on the Road', next: 'ch5.l4', bounds: BIGB,
  intro: 'Halfway to the coast the engine coughs, the driver pulls over and everyone remembers what they forgot. A roadside market appears like a miracle.',
  theme: { ground: '#bfb393', ...TOWN([sI.d, sW.d, sS.d, { kind: 'rug', x: 20, z: 5, w: 10, d: 3, color: GREEN }, { kind: 'chair', x: 15, z: 2.8, color: WOOD }, { kind: 'chair', x: 20, z: 2.8, color: WOOD }, { kind: 'chair', x: 25, z: 2.8, color: WOOD }, { kind: 'sign', x: 37, z: 0, label: 'KEKE', w: 1.2 }]) },
  furniture: [sI.f, sW.f, sS.f, F('ctable', R(14, 26, 3.6, 4.8), 0.8, WOOD), F('cooler', R(10, 13, 1, 2.4), 0.8, BLUE)], ...base,
  tasks: [
    T('ch5.l3', 1, 'collect', 'Shop the roadside', { purpose: 'Ice, water and sunscreen from three different stalls along the road.', objective: 'Fetch ice, water and sunscreen', success: 'You have all three.',
      intro: [sayAs('Bayo', 'helper', 'Ice, water, sunscreen. In three different places. This is the world\'s least efficient market.', 'cheeky')], done: [say('player', 'Ice, water, sunscreen. I am a walking beach kit.', 'laughing')], hint: 'Ice at the blue stall, water at the teal one, sunscreen at the yellow one.' }),
    T('ch5.l3', 2, 'serve', 'Cold drinks for the group', { purpose: 'Seat your tired friends at the roadside table and bring each a cold drink.', objective: 'Seat and serve the three friends', success: 'Everyone has a cold drink.',
      intro: [sayAs('Ada', 'neighbour', 'I am melting. Chi is melting. Dami is already a puddle. Drinks. Now. Please.', 'tired')], done: [sayAs('Chi', 'neighbour', 'Never leaving this chair.', 'happy')], hint: 'Seat each friend, take their drink from the cooler and carry it to them.' }),
    T('ch5.l3', 3, 'reach', 'Race back to the keke', { purpose: 'The driver honks. He does not wait for anyone. Even tourists. Especially tourists.', objective: 'Get back to the keke in time', success: 'You reach the keke before the timer ends.',
      intro: [sayAs('Driver', 'helper', 'Peeeep! I leave! I leave now! I count to ten! One! Ten!', 'angry')], done: [say('player', 'On board. Mostly. One foot on, one foot in the road.', 'laughing')], hint: 'Cross behind the traffic and run right to the KEKE sign.' }),
  ],
  items: [
    { id: 'ice', task: 0, x: 8, z: -8.6, label: 'Take the ice', color: '#d9f0fb', shape: 'crate', y: 1.05, act: 'lift' },
    { id: 'water', task: 0, x: 18, z: -8.6, label: 'Take the water', color: '#6a8ab8', shape: 'bottle', y: 1.05, act: 'grab' },
    { id: 'sunscreen', task: 0, x: 28, z: -8.6, label: 'Take the sunscreen', color: ORANGE, shape: 'bottle', y: 1.05, act: 'grab' },
    { id: 'dAda', task: 1, x: 10.6, z: 1.7, label: 'Take Ada\'s drink', color: BLUE, shape: 'cup', y: 0.95 },
    { id: 'dChi', task: 1, x: 11.6, z: 1.7, label: 'Take Chi\'s drink', color: GREEN, shape: 'cup', y: 0.95 },
    { id: 'dDami', task: 1, x: 12.4, z: 1.7, label: 'Take Dami\'s drink', color: ORANGE, shape: 'cup', y: 0.95 },
  ],
  serves: { 1: { eatSecs: 3, from: 1, guests: [
    { id: 'ada', name: 'Ada', order: 'Something cold', dish: 'dAda', x: 6, z: 6, seat: { x: 15, z: 2.8 }, table: { x: 15, z: 4.2 } },
    { id: 'chi', name: 'Chi', order: 'Water, lots', dish: 'dChi', x: 8, z: 8, seat: { x: 20, z: 2.8 }, table: { x: 20, z: 4.2 } },
    { id: 'dami', name: 'Dami', order: 'Anything wet', dish: 'dDami', x: 4, z: 8.4, seat: { x: 25, z: 2.8 }, table: { x: 25, z: 4.2 } },
  ] } },
  goto: [null, null, RING(36, 0, 1.5)],
  guide: [{ x: 18, z: -6, r: 14 }, { x: 20, z: 2, r: 10 }, RING(36, 0)],
  hazards: [D('cart', 18, -6, 6, 2.8, 0, RUST), D('walker', 24, -6, 6, 2.6, 1.2, GREEN), D('cart', 30, -6, 6, 3.0, 0.6, ORANGE)],
  timeLimit: 18,
  crowd: [{ x: 32, z: 6, rot: -2.2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 8, rot: -2.4 } }, choiceLabel: 'stop',
  endBeat: { text: 'The keke starts on the fourth try. Everybody cheers like it was a rocket. The road to the coast stretches out, golden and slightly bumpy.', line: 'The beach at last.' },
  starRules: ['Finish the level', 'Reach the keke before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the roadside', 'Keke to the roadside stop', 'The road to the coast is long', [sayAs('Mama Folake', 'folake', 'Have you got ice? Water? Sunscreen? You will have none of them. Take the keke and stop at the market.', 'worried')], [sayAs('Bayo', 'helper', 'We have broken down. Again. I love road trips.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 4
export const LEVEL_C5L4 = withBus(L({
  ch: 'ch5', n: 4, title: 'Arrival', next: 'ch5.l5', bounds: BIGB,
  intro: 'The sea! Right there! Blue, huge and not at all interested in your plans. Find your spot, set up the umbrella and sit down before anybody changes the plan again.',
  theme: { ground: '#d9c98a', ...BEACH([umbrella(26, 4, ORANGE), { kind: 'rug', x: 24, z: 0, w: 6, d: 3.6, color: '#c4562a' }, { kind: 'chair', x: 24, z: 0, color: '#c4562a' }, { kind: 'stall', x: 6, z: -7, w: 3.4, d: 1.6, color: GREEN, label: 'LIFEGUARD' }]) },
  furniture: [F('tower', R(4.3, 7.7, -7.8, -6.2), 1.4, '#f3e7cf')], ...base,
  tasks: [
    T('ch5.l4', 1, 'goto', 'Find your spot', { purpose: 'Walk down the beach and pick the perfect patch of sand.', objective: 'Walk to the spot with the red towel', success: 'You reach the spot.',
      intro: [sayAs('Ada', 'neighbour', 'Not there, too windy. Not there, too crowded. There! No. There!', 'cheeky')], done: [sayAs('Ada', 'neighbour', 'Perfect. Do not move. Nobody move. Nobody breathe.', 'happy')], hint: 'Follow the ring to the red towel on the right.' }),
    T('ch5.l4', 2, 'sequence', 'Set up the umbrella', { purpose: 'Lift the pole, open the canopy, then dig it into the sand so it does not fly away.', objective: 'Lift the pole, open it, then anchor it', success: 'The umbrella stands.',
      intro: [say('helper', 'Pole first. Then open. Then anchor. If you anchor first, you cannot open. If you open first, you fly.', 'cheeky')], done: [say('helper', 'It stands! It actually stands!', 'laughing')], hint: 'Order: pole, canopy, anchor.' }),
    T('ch5.l4', 3, 'talk', 'Listen to the lifeguard', { purpose: 'The lifeguard has three rules and a whistle. Listen to the rules.', objective: 'Talk to the lifeguard', success: 'You know the rules.',
      intro: [say('player', 'He is holding a whistle. He looks like a man who likes using it.', 'worried')], done: [say('player', 'Flags. Currents. No swimming after lunch. Got it. Mostly.', 'thinking')], hint: 'The lifeguard stands by his tower at the top left.' }),
    T('ch5.l4', 4, 'hold', 'Sit down at last', { purpose: 'Sit on the towel, take your shoes off and look at the sea.', objective: 'Sit on the towel and look at the sea', success: 'You are rested.',
      intro: [say('player', 'Sand between the toes. Sea in the eyes. Phone in the bag. Perfect.', 'happy')], done: [say('player', 'I am going to live here. I am going to stay here forever.', 'happy')], hint: 'Stand in the ring on the red towel until you are rested.' }),
  ],
  talks: { 2: [{ id: 'guard', name: 'Mr Kunle', x: 6, z: -4.6, lines: [sayAs('Mr Kunle', 'helper', 'Three rules. One: swim between the flags. Two: do not swim after eating. Three: if I whistle, you stop. Everyone stops.', 'calm')], rounds: [{ options: [
    { id: 'ok', label: '"Understood, sir."', reply: sayAs('Mr Kunle', 'helper', 'Good. Enjoy. And wear the sunscreen.', 'happy') },
    { id: 'ask', label: '"What does the red flag mean?"', reply: sayAs('Mr Kunle', 'helper', 'It means do not. Whatever you were about to do, do not.', 'cheeky') },
  ] }] }] },
  items: [
    { id: 'pole', task: 1, x: 22, z: 4.4, label: 'Lift the umbrella pole', color: '#a87a50', shape: 'ladder', y: 0.15, act: 'lift' },
    { id: 'open', task: 1, x: 26, z: 4.4, label: 'Open the canopy', color: ORANGE, shape: 'umbrella', y: 1.5, act: 'reachHigh' },
    { id: 'anchor', task: 1, x: 30, z: 4.4, label: 'Dig it into the sand', color: '#d9c98a', shape: 'cones', y: 0.1, act: 'pickLow' },
  ],
  sequences: { 1: ['pole', 'open', 'anchor'] },
  holds: { 3: { x: 24, z: 0, r: 1.0, secs: 6, pose: 'sit' } },
  goto: [RING(24, 0, 1.6), null, null, null],
  guide: [RING(24, 0), { x: 26, z: 4.4, r: 6 }, { x: 6, z: -4.6, r: 3 }, RING(24, 0, 1.0)],
  crowd: [{ x: 14, z: 3, rot: 1 }, { x: 32, z: -3, rot: -2 }, { x: 18, z: 7, rot: 3 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 8, rot: -2.4 } }, choiceLabel: 'spot',
  endBeat: { text: 'The sea says hello with a very long wave. Everyone claims to be fine with it. Nobody is brave enough to be first in.', line: 'Games on the sand next.' },
  starRules: ['Finish the level', 'Finish with no wrong order', 'Finish with no mistakes and no hints'],
}), ride('the beach', 'Keke to the beach', 'The last bit of the road', [sayAs('Mama Folake', 'folake', 'The sea air is good for you. Take the last keke to the beach and wear the hat I packed. The one you left.', 'happy')], [say('helper', 'The sea! The actual sea! It looks even bigger from here!', 'happy')]))

// ---------------------------------------------------------------------------------------------------------------- Level 5
export const LEVEL_C5L5 = withBus(L({
  ch: 'ch5', n: 5, title: 'Beach Games', next: 'ch5.l6', bounds: BIGB, kit: true,
  intro: 'Bayo has brought a football and a plan for a tournament. Nobody remembers agreeing to either. The sand is hot, the shallows are cold and the goals are two umbrellas.',
  theme: { ground: '#d9c98a', ...BEACH([{ kind: 'goal', x: 33, z: 0, d: 4.3 }, { kind: 'sign', x: 8, z: 4, label: 'TEAMS', w: 1.6 }]) },
  furniture: [], ...base, kick: { x: 24, z: 0, goals: 3, goal: { x: 32.4, z: 0 } },
  tasks: [
    T('ch5.l5', 1, 'kick', 'Penalties on the sand', { purpose: 'Time the needle: tap Kick when it is in the green. The sand slows the ball, so no showing off.', objective: 'Score 3 penalties', success: 'Three penalties go in.',
      intro: [sayAs('Bayo', 'helper', 'Penalties! Winner chooses the team! Loser carries the cooler!', 'cheeky')], done: [sayAs('Bayo', 'helper', 'Three! Three goals in the sand! I am not jealous! I am slightly jealous.', 'angry')], hint: 'Stand on the white spot and tap Kick with the needle in the green.' }),
    T('ch5.l5', 2, 'reach', 'Run through the shallows', { purpose: 'The relay: run along the water\'s edge without getting knocked over by the buoys and the waves.', objective: 'Run through the shallows to the far flag', success: 'You reach the flag before the timer ends.',
      intro: [sayAs('Ada', 'neighbour', 'Relay race! Along the water! Do not stop! Do not look at the sea! It looks back!', 'cheeky')], done: [say('player', 'Wet to the knees. Winner. Probably.', 'laughing')], hint: 'Cross behind the sliding buoys and run right to the flag.' }),
    T('ch5.l5', 3, 'choose', 'Pick your team', { purpose: 'Because you won, you choose: Team Sun, Team Wave or sit it out and referee.', objective: 'Choose a team', success: 'You choose.',
      intro: [say('player', 'Captain. For the first time in my life. Do not mess it up.', 'worried')], done: [sayAs('Bayo', 'helper', 'Interesting choice. We will see how that works for you.', 'cheeky')], hint: 'Three signs near the TEAMS sign: Sun, Wave or referee.' }),
    T('ch5.l5', 4, 'talk', 'Argue about the score', { purpose: 'The score is disputed. Both teams claim it. Be the referee.', objective: 'Talk to both team captains', success: 'The score is settled.',
      intro: [sayAs('Chi', 'neighbour', 'That was a goal! The ball crossed the umbrella!', 'angry')], done: [say('player', 'Three all. Everybody wins. Everybody is a little bit wrong.', 'laughing')], hint: 'Chi and Dami stand near the far goal.' }),
  ],
  items: [
    { id: 'sun', task: 2, x: 8, z: 7, label: 'Join Team Sun', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'wave', task: 2, x: 14, z: 7, label: 'Join Team Wave', color: BLUE, shape: 'sign', y: 0 },
    { id: 'ref', task: 2, x: 20, z: 7, label: 'Referee the match', color: GREEN, shape: 'sign', y: 0 },
  ],
  talks: { 3: [
    { id: 'chi', name: 'Chi', x: 26, z: -4, lines: [sayAs('Chi', 'neighbour', 'The ball crossed the line! It was a goal! I saw it with my own eyes!', 'angry')], rounds: [{ options: [
      { id: 'goal', label: '"It was a goal."', reply: sayAs('Chi', 'neighbour', 'Thank you! Justice!', 'happy') },
      { id: 'nogoal', label: '"It was not a goal."', reply: sayAs('Chi', 'neighbour', 'You have betrayed me. I will remember this at dinner.', 'angry') },
      { id: 'replay', label: '"Let us replay it."', reply: sayAs('Chi', 'neighbour', 'Replay? With a tide? Fine.', 'cheeky') },
    ] }] },
    { id: 'dami', name: 'Dami', x: 26, z: 4, lines: [sayAs('Dami', 'helper', 'It hit the umbrella. The umbrella is the goalpost. The umbrella is on my side.', 'cheeky')] },
  ] },
  goto: [null, RING(36, 4, 1.6), null, null],
  guide: [{ x: 24, z: 0, r: 1.5 }, RING(36, 4, 1.6), { x: 14, z: 7, r: 8 }, { x: 26, z: 0, r: 5 }],
  hazards: [D('dummy', 14, -2, 8, 2.8, 0, ORANGE), D('dummy', 20, -2, 8, 3.0, 1.2, ORANGE), D('dummy', 27, -2, 8, 2.6, 0.6, ORANGE)],
  timeLimit: 16,
  crowd: [{ x: 18, z: -4, rot: 0 }, { x: 32, z: 7, rot: -2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: -6, rot: -2.4 } }, choiceLabel: 'team',
  endBeat: { text: 'Final score, depending on who you ask: three-three, four-three or "we never discuss it". Everyone agrees it was the best match of their lives.', line: 'Lunch time.' },
  starRules: ['Finish the level', 'Reach the flag before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the sand', 'Keke along the shore', 'The party beach is further along the shore', [sayAs('Mama Folake', 'folake', 'Beach football is dangerous. Keep your ankles and take the keke to the party beach.', 'worried')], [say('helper', 'Sand football. The only sport where the ground fights back.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 6
export const LEVEL_C5L6 = withBus(L({
  ch: 'ch5', n: 6, title: 'Lunch on the Sand', next: 'ch5.l7', bounds: BIGB,
  intro: 'Hunger arrives like a tide. The charcoal is somewhere, the fish is waiting and four friends are watching you the way vultures watch a very slow picnic.',
  theme: { ground: '#d9c98a', ...BEACH([{ kind: 'stall', x: 8, z: -6, w: 3.4, d: 1.6, color: RUST, label: 'FISH' }, { kind: 'rug', x: 26, z: 3, w: 10, d: 3, color: GREEN }, { kind: 'chair', x: 22, z: 2.4, color: WOOD }, { kind: 'chair', x: 26, z: 2.4, color: WOOD }, { kind: 'chair', x: 30, z: 2.4, color: WOOD }]) },
  furniture: [F('grill', R(12, 16, -7, -5.6), 0.9, '#44444e'), F('fishcounter', R(6.3, 9.7, -7, -5.4), 1.0, WOOD), F('cooler', R(34, 37, -2, -0.6), 0.7, BLUE), F('feast', R(22, 30, 3.2, 4.4), 0.8, WOOD), F('sack', R(26, 28, 8, 9.2), 0.7, DARK), F('log', R(0, 3, 6, 7), 0.5, DARK)], ...base,
  tasks: [
    T('ch5.l6', 1, 'find', 'Find the charcoal', { purpose: 'The charcoal bag was packed. It was also unpacked. Where did it go?', objective: 'Find the charcoal bag', success: 'You find the charcoal.',
      intro: [sayAs('Bayo', 'helper', 'Who has the charcoal? Nobody has the charcoal. Everybody had the charcoal!', 'angry')], done: [sayAs('Dami', 'helper', 'Behind the sack. Where it fell. And I knew. And I said nothing.', 'cheeky')], hint: 'Try the cooler, the log and the sack at the bottom.' }),
    T('ch5.l6', 2, 'sequence', 'Grill the fish', { purpose: 'Season it, lay it on the grill, then flip it. In that order.', objective: 'Season, grill, then flip', success: 'The fish is done.',
      intro: [sayAs('Ada', 'neighbour', 'Season first. Then the grill. Then flip, once. Only once. It is not a pancake.', 'calm')], done: [sayAs('Ada', 'neighbour', 'It smells like a holiday. It looks like a holiday. If it tastes like a holiday, I will cry.', 'happy')], hint: 'Order at the grill: season, grill, flip.' }),
    T('ch5.l6', 3, 'serve', 'Serve lunch', { purpose: 'Seat your hungry friends on the stools and bring each their fish.', objective: 'Seat and serve three friends', success: 'Everyone is eating.',
      intro: [sayAs('Chi', 'neighbour', 'If I do not eat in five minutes I will eat the umbrella.', 'tired')], done: [sayAs('Chi', 'neighbour', 'I forgive everything you ever did.', 'happy')], hint: 'Seat each friend, take their fish from the grill table and carry it over.' }),
  ],
  spots: [
    { id: 'cooler', task: 0, x: 35.4, z: 0.8, label: 'Check the cooler', wrong: say('player', 'Ice, drinks and one very sad lime. No charcoal.', 'tired') },
    { id: 'log', task: 0, x: 1.5, z: 5.2, label: 'Check the log', wrong: say('helper', 'A crab. The crab is also looking for the charcoal.', 'cheeky') },
    { id: 'sack', task: 0, x: 27, z: 7, label: 'Look behind the sack', right: true },
  ],
  items: [
    { id: 'season', task: 1, x: 12.8, z: -6.4, label: 'Season the fish', color: ORANGE, shape: 'bottle', y: 0.95, act: 'pour' },
    { id: 'grillIt', task: 1, x: 14, z: -6.4, label: 'Lay it on the grill', color: '#a85a1f', shape: 'plate', y: 0.95, act: 'grab' },
    { id: 'flip', task: 1, x: 15.2, z: -6.4, label: 'Flip the fish', color: '#a85a1f', shape: 'plate', y: 0.95, act: 'stir' },
    { id: 'fAda', task: 2, x: 7, z: -6.2, label: 'Take Ada\'s fish', color: '#a85a1f', shape: 'plate', y: 1.1 },
    { id: 'fBayo', task: 2, x: 8, z: -6.2, label: 'Take Bayo\'s fish', color: '#a85a1f', shape: 'plate', y: 1.1 },
    { id: 'fChi', task: 2, x: 9, z: -6.2, label: 'Take Chi\'s fish', color: '#a85a1f', shape: 'plate', y: 1.1 },
  ],
  sequences: { 1: ['season', 'grillIt', 'flip'] },
  serves: { 2: { eatSecs: 3, from: 2, guests: [
    { id: 'ada', name: 'Ada', order: 'Grilled fish', dish: 'fAda', x: 18, z: 0, seat: { x: 22, z: 2.4 }, table: { x: 22, z: 3.8 } },
    { id: 'bayo', name: 'Bayo', order: 'Fish and extra pepper', dish: 'fBayo', x: 20, z: -2, seat: { x: 26, z: 2.4 }, table: { x: 26, z: 3.8 } },
    { id: 'chi', name: 'Chi', order: 'The biggest fish', dish: 'fChi', x: 22, z: 0.4, seat: { x: 30, z: 2.4 }, table: { x: 30, z: 3.8 } },
  ] } },
  guide: [{ x: 20, z: 3, r: 14 }, { x: 14, z: -4.4, r: 4 }, { x: 24, z: 1, r: 8 }],
  crowd: [{ x: 34, z: 6, rot: -2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: -6, rot: -2.4 } }, choiceLabel: 'lunch',
  endBeat: { text: 'The fish is gone in four minutes. The bones are arranged into a small, respectful monument.', line: 'The sea looks restless.' },
  starRules: ['Finish the level', 'Finish with no wrong places or orders', 'Finish with no mistakes and no hints'],
}), ride('the camp', 'Keke to the camp', 'Lunch is further along the beach', [sayAs('Mama Folake', 'folake', 'The fish will not cook itself. Take the keke to the camp. And wash your hands this time.', 'worried')], [sayAs('Bayo', 'helper', 'I can smell charcoal. Or I imagine it. Same thing.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 7
export const LEVEL_C5L7 = withBus(L({
  ch: 'ch5', n: 7, title: 'The Tide Comes In', next: 'ch5.l8', bounds: BIGB,
  intro: 'Nobody checked the tide table. The sea creeps up the sand, takes the first towel, then the second, then looks at the bags with something like hunger.',
  theme: { ground: '#d9c98a', ...BEACH([umbrella(14, 4, ORANGE), { kind: 'rug', x: 14, z: 3, w: 6, d: 3, color: '#c4562a' }, { kind: 'sign', x: 37, z: 8, label: 'HIGH GROUND', w: 2 }]) },
  furniture: [F('cooler', R(10, 13, 4.4, 5.8), 0.7, BLUE)], ...base,
  tasks: [
    T('ch5.l7', 1, 'reach', 'Save the bags', { purpose: 'The bags are at the water\'s edge. Run to them before the next wave.', objective: 'Run to the bags before the wave', success: 'You reach the bags in time.',
      intro: [sayAs('Ada', 'neighbour', 'The bags! The sea is eating the bags! RUN!', 'angry')], done: [say('player', 'Got them! Only slightly damp! Mostly!', 'laughing')], hint: 'Cross behind the surging waves and run to the ring at the water.' }),
    T('ch5.l7', 2, 'sequence', 'Pack up in order', { purpose: 'Umbrella down, cooler shut, towels folded: in that order.', objective: 'Umbrella, cooler, then towels', success: 'Everything is packed.',
      intro: [sayAs('Bayo', 'helper', 'Umbrella first. Then the cooler. Then towels. If you do the towels first the umbrella will fly.', 'worried')], done: [sayAs('Bayo', 'helper', 'Packed. The sea can have the sand. We take everything else.', 'happy')], hint: 'Order: umbrella, cooler, towels.' }),
    T('ch5.l7', 3, 'collect', 'Rescue the floaters', { purpose: 'A hat, a flip-flop and the ball are floating away. Grab each from the shallows.', objective: 'Rescue the hat, flip-flop and ball', success: 'Everything is saved.',
      intro: [sayAs('Dami', 'helper', 'My hat! My flip-flop! The ball! The sea has all the good things!', 'worried')], done: [say('player', 'Hat, flip-flop, ball. Saved. And I am wet to the knees.', 'laughing')], hint: 'The three floaters are along the water\'s edge. Bend and grab each.' }),
    T('ch5.l7', 4, 'choose', 'Leave early or stay?', { purpose: 'The weather turns. Pack up and leave, move to higher ground or stay and enjoy the storm.', objective: 'Decide what to do', success: 'You choose.',
      intro: [sayAs('Chi', 'neighbour', 'We could leave. We could move. We could stay and be dramatic.', 'cheeky')], done: [sayAs('Ada', 'neighbour', 'Interesting. I will not say what I think.', 'suspicious')], hint: 'Three signs: leave now, high ground or stay.' }),
  ],
  items: [
    { id: 'umb', task: 1, x: 14, z: 3.6, label: 'Take the umbrella down', color: ORANGE, shape: 'umbrella', y: 1.2, act: 'reachHigh' },
    { id: 'coolerShut', task: 1, x: 11.5, z: 5.1, label: 'Shut the cooler', color: BLUE, shape: 'crate', y: 0.8, act: 'lift' },
    { id: 'towels', task: 1, x: 17, z: 2.4, label: 'Fold the towels', color: '#fbf8f0', shape: 'blanket', y: 0.1, act: 'pickLow' },
    { id: 'hat', task: 2, x: 20, z: -6.4, label: 'Grab the hat', color: YELLOW, shape: 'produce', y: 0.2, act: 'pickLow' },
    { id: 'flip', task: 2, x: 26, z: -6.8, label: 'Grab the flip-flop', color: BLUE, shape: 'shinpad', y: 0.2, act: 'pickLow' },
    { id: 'ball', task: 2, x: 31, z: -6.2, label: 'Grab the ball', color: '#fbf8f0', shape: 'produce', y: 0.2, act: 'pickLow' },
    { id: 'leave', task: 3, x: 16, z: 8, label: 'Leave right now', color: RUST, shape: 'sign', y: 0 },
    { id: 'high', task: 3, x: 22, z: 8, label: 'Move to higher ground', color: GREEN, shape: 'sign', y: 0 },
    { id: 'stay', task: 3, x: 28, z: 8, label: 'Stay and be dramatic', color: YELLOW, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['umb', 'coolerShut', 'towels'] },
  goto: [RING(24, -6.2, 1.6), null, null, null],
  guide: [RING(24, -6.2, 1.6), { x: 14, z: 4, r: 5 }, { x: 26, z: -6, r: 8 }, { x: 22, z: 8, r: 8 }],
  hazards: [D('dummy', 16, -8, 4, 3.0, 0, BLUE), D('dummy', 20, -8, 4, 3.2, 1.1, BLUE)],
  timeLimit: 14,
  crowd: [{ x: 8, z: 4, rot: 1 }, { x: 33, z: 4, rot: -2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 5, rot: -2.4 } }, choiceLabel: 'weather',
  endBeat: { text: 'The first big wave takes your footprints. The second takes the spot where the umbrella stood. You stand on the high ground, damp and laughing.', line: 'Somebody is missing.' },
  starRules: ['Finish the level', 'Reach the bags before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the beach', 'Keke back to the beach', 'The weather is turning', [sayAs('Mama Folake', 'folake', 'I heard on the radio there is a storm out at sea. Take the keke back to the beach and keep your things dry.', 'worried')], [sayAs('Ada', 'neighbour', 'Do you hear the waves? They are getting closer. They are getting very enthusiastic.', 'worried')]))

// ---------------------------------------------------------------------------------------------------------------- Level 8
export const LEVEL_C5L8 = withBus(L({
  ch: 'ch5', n: 8, title: 'The Missing Friend', next: 'ch5.l9', bounds: BIGB,
  intro: 'Roll call after the storm. Five names are answered. One is not. Dami has gone to look at "something interesting" and nobody saw which way.',
  theme: { ground: '#d9c98a', ...BEACH([{ kind: 'stall', x: 6, z: -7, w: 3.4, d: 1.6, color: GREEN, label: 'LIFEGUARD' }, { kind: 'stall', x: 28, z: 6.4, w: 3.4, d: 1.6, color: ORANGE, label: 'CORN' }, { kind: 'sign', x: 37, z: -4, label: 'ROCKS', w: 1.4 }]) },
  furniture: [F('tower', R(4.3, 7.7, -7.8, -6.2), 1.4, '#f3e7cf'), F('cornstall', R(26.3, 29.7, 6.8, 8.4), 1.0, WOOD), F('rocks', R(34, 38, -8, -5), 1.2, '#6b6b70'), F('boat', R(16, 21, 8, 10), 0.8, '#2b6ad0')], ...base,
  tasks: [
    T('ch5.l8', 1, 'find', 'Find Dami\'s trail', { purpose: 'Footprints, a flip-flop and a dropped phone: three clues, one of them is Dami\'s.', objective: 'Find Dami\'s trail', success: 'You find where he went.',
      intro: [sayAs('Ada', 'neighbour', 'He is a grown man. He is also a child. Find him before he finds trouble.', 'worried')], done: [say('player', 'His footprints go to the rocks. His footprints always go to the rocks.', 'thinking')], hint: 'Check the boat, the corn stall and the sand near the rocks.' }),
    T('ch5.l8', 2, 'talk', 'Ask around', { purpose: 'The lifeguard and the corn seller both saw something. Ask them both.', objective: 'Talk to the lifeguard and the corn seller', success: 'You know where he went.',
      intro: [say('player', 'Somebody must have seen him. A man in a yellow hat is not invisible.', 'thinking')], done: [say('player', 'The rocks. Of course the rocks.', 'worried')], hint: 'The lifeguard is at the tower; the corn seller by the CORN stall.' }),
    T('ch5.l8', 3, 'reach', 'Run to the rocks', { purpose: 'The tide is coming in and the rocks will be underwater in a minute.', objective: 'Run to the rocks before the tide', success: 'You reach the rocks in time.',
      intro: [sayAs('Mr Kunle', 'helper', 'The rocks go under in two minutes! Run! I will blow the whistle!', 'angry')], done: [sayAs('Dami', 'helper', 'Oh. Hello. I was watching a very interesting crab.', 'cheeky')], hint: 'Cross behind the waves and run right to the rocks.' }),
    T('ch5.l8', 4, 'goto', 'Bring him back', { purpose: 'Walk Dami back to the group before the sea decides otherwise.', objective: 'Walk back to the group', success: 'You reach the group.',
      intro: [sayAs('Ada', 'neighbour', 'Bring him back! Hold his hand if you must!', 'cheeky')], done: [sayAs('Ada', 'neighbour', 'Dami. We do not leave. We do not wander. We do not look at crabs.', 'angry')], hint: 'Follow the ring to the group under the umbrella.' }),
  ],
  spots: [
    { id: 'boat', task: 0, x: 18.4, z: 6.8, label: 'Check the boat', wrong: say('helper', 'A paddle and a very confused seagull. No Dami.', 'cheeky') },
    { id: 'corn', task: 0, x: 28, z: 5, label: 'Check by the corn stall', wrong: say('player', 'Roasted corn. A smell like heaven. No Dami.', 'tired') },
    { id: 'sand', task: 0, x: 33, z: -4, label: 'Look at the footprints by the rocks', right: true },
  ],
  talks: { 1: [
    { id: 'kunle', name: 'Mr Kunle', x: 6, z: -4.6, lines: [sayAs('Mr Kunle', 'helper', 'Yellow hat? Went towards the rocks twenty minutes ago. I blew the whistle. He waved.', 'tired')], rounds: [{ options: [
      { id: 'thanks', label: '"Thank you. I will fetch him."', reply: sayAs('Mr Kunle', 'helper', 'Be quick. The tide does not wait. Neither do I.', 'calm') },
      { id: 'how', label: '"How long till the rocks go under?"', reply: sayAs('Mr Kunle', 'helper', 'Less than ten minutes. Run.', 'worried') },
    ] }] },
    { id: 'corn', name: 'Corn Seller', x: 28, z: 4.4, lines: [sayAs('Corn Seller', 'neighbour', 'Yellow hat? He bought three corns, ate two and went to look at the rocks.', 'cheeky')] },
  ] },
  goto: [null, null, RING(32, -4.4, 1.6), RING(14, 3, 1.6)],
  guide: [{ x: 28, z: 0, r: 10 }, { x: 15, z: -4, r: 14 }, RING(32, -4.4, 1.6), RING(14, 3, 1.6)],
  hazards: [D('dummy', 14, -9, 3, 3.0, 0, BLUE), D('dummy', 20, -9, 3, 3.2, 1.1, BLUE), D('dummy', 26, -9, 3, 2.8, 0.5, BLUE)],
  timeLimit: 16,
  crowd: [{ x: 14, z: 3, rot: 1 }, { x: 16, z: 5, rot: 2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 8, rot: -2.4 } }, choiceLabel: 'search',
  endBeat: { text: 'Dami is back, soaked, happy and holding a crab. Everyone agrees not to say anything about the crab. The crab does not agree.', line: 'One last evening.' },
  starRules: ['Finish the level', 'Reach the rocks before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the beach', 'Keke along the beach', 'The search party needs a lift', [sayAs('Mama Folake', 'folake', 'Dami is lost? Dami is always lost. Take the keke and go and find him before the sea does.', 'worried')], [sayAs('Ada', 'neighbour', 'We need to find him quickly. And we need to not tell his mother.', 'worried')]))

// ---------------------------------------------------------------------------------------------------------------- Level 9
export const LEVEL_C5L9 = withBus(L({
  ch: 'ch5', n: 9, title: 'Sunset', next: null, badge: 'Beach Weekend', bounds: BIGB,
  intro: 'The last evening. The sea turns gold, the speaker plays something slow and everyone says they will do this again. Everyone means it.',
  theme: { ground: '#d9b878', ...BEACH([{ kind: 'rug', x: 22, z: 2, w: 9, d: 4, color: '#c4562a' }, { kind: 'chair', x: 20, z: 2, color: '#c4562a' }, umbrella(30, 5, ORANGE), { kind: 'sign', x: 37, z: 3, label: 'KEKE STAND', w: 1.8 }]) },
  furniture: [F('cooler', R(10, 13, 5, 6.4), 0.7, BLUE), F('bag', R(14, 16.4, 7, 8.4), 0.6, DARK)], ...base,
  tasks: [
    T('ch5.l9', 1, 'talk', 'Say the good things', { purpose: 'Everybody has a favourite moment from the weekend. Hear theirs and share yours.', objective: 'Talk to Ada and Bayo', success: 'The good things are said.',
      intro: [say('player', 'It was only two days. It feels like a whole summer.', 'happy')], done: [say('player', 'I will remember this when I am old. And when I am tired. And on Monday.', 'happy')], hint: 'Ada and Bayo sit on the red rug.' }),
    T('ch5.l9', 2, 'hold', 'Watch the sunset', { purpose: 'Sit on the sand with the people you came with and watch the sun go.', objective: 'Sit on the sand and watch the sunset', success: 'The sun is gone.',
      intro: [sayAs('Chi', 'neighbour', 'Nobody speak. Nobody move. Nobody check their phone.', 'calm')], done: [sayAs('Ada', 'neighbour', 'Okay. You can speak now. You can breathe.', 'happy')], hint: 'Stand in the ring on the rug until the sun sets.' }),
    T('ch5.l9', 3, 'sequence', 'Pack the keke', { purpose: 'Cooler, bag, umbrella: heavy first, light last, so nothing is crushed.', objective: 'Cooler, bag, then umbrella', success: 'The keke is packed.',
      intro: [sayAs('Bayo', 'helper', 'Cooler first. Bag next. Umbrella last. Otherwise the umbrella arrives as a pancake.', 'cheeky')], done: [sayAs('Bayo', 'helper', 'Packed. Tight. Like a nervous suitcase.', 'laughing')], hint: 'Order: cooler, bag, umbrella.' }),
    T('ch5.l9', 4, 'goto', 'Walk to the keke', { purpose: 'The last walk of the weekend, along the sand to the stand.', objective: 'Walk to the keke stand', success: 'You reach the stand.',
      intro: [say('tunde', 'Go on. The keke is waiting. So is the week.', 'proud')], done: [say('folake', 'You went to the beach and came back in one piece. I am so proud I could burst.', 'proud')], hint: 'The keke stand is on the far right.' }),
  ],
  talks: { 0: [
    { id: 'ada', name: 'Ada', x: 22, z: 5.4, lines: [sayAs('Ada', 'neighbour', 'My favourite part was the quiet half hour. Before anyone woke up.', 'happy')], rounds: [{ options: [
      { id: 'sea', label: '"Mine was the first look at the sea."', reply: sayAs('Ada', 'neighbour', 'That first look. You never get a second one.', 'happy') },
      { id: 'friends', label: '"Mine was being with everybody."', reply: sayAs('Ada', 'neighbour', 'Sappy. Correct. Sappy and correct.', 'cheeky') },
    ] }] },
    { id: 'bayo', name: 'Bayo', x: 26, z: 5.4, lines: [sayAs('Bayo', 'helper', 'The football! And the corn! And Dami and the crab! Best weekend of my life!', 'happy')] },
  ] },
  holds: { 1: { x: 22, z: 2, r: 1.0, secs: 8, pose: 'sit' } },
  items: [
    { id: 'coolerP', task: 2, x: 11.5, z: 5.7, label: 'Load the cooler', color: BLUE, shape: 'crate', y: 0.8, act: 'lift' },
    { id: 'bagP', task: 2, x: 15.2, z: 7.7, label: 'Load the bag', color: '#1c1b22', shape: 'bag', y: 0.7, act: 'lift' },
    { id: 'umbP', task: 2, x: 30, z: 5, label: 'Load the umbrella', color: ORANGE, shape: 'umbrella', y: 1.2, act: 'reachHigh' },
  ],
  sequences: { 2: ['coolerP', 'bagP', 'umbP'] },
  goto: [null, null, null, RING(36, 3, 1.6)],
  guide: [{ x: 24, z: 5, r: 4 }, RING(22, 2, 1.0), { x: 18, z: 6, r: 14 }, RING(36, 3, 1.6)],
  crowd: [{ x: 18, z: -4, rot: 0.2 }, { x: 30, z: -2, rot: -2 }],
  npcs: { folake: { x: 38, z: 8, rot: -2.4 }, tunde: { x: 34, z: 7, rot: -2.4 } }, choiceLabel: 'memory',
  endBeat: { text: 'The keke bumps back along the coast road with six sleepy friends, a speaker playing very quietly and a cooler that smells faintly of fish. Nobody wants it to end. Everyone is already planning the next one.', line: 'Chapter 5 is done.' },
  starRules: ['Finish the level', 'Finish with no wrong order', 'Finish with no mistakes and no hints'],
}), ride('the beach', 'Keke to the sunset spot', 'The best spot is further along the coast', [sayAs('Mama Folake', 'folake', 'Go and watch the sunset for me. Take the keke and take a photograph. Do not take the crab.', 'happy')], [say('helper', 'Golden light. Warm sand. Slightly smelly keke. Perfect.', 'happy')]))
void WOOD
