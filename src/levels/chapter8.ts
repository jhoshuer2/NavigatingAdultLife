// Chapter 8 "Hospital Shift": your first week as a trainee at St Mary's General. An ambulance gives you a lift to each part of the hospital:
// reception, the ward, the pharmacy, emergency, visiting hours, the lab, the night shift, the delivery ward and the end-of-week party.
import type { Deco } from './schema'
import { L, T, R, F, say, sayAs, D, WOOD, DARK } from './chapter1b'
import { B, TREES, LAMPS, RING, GREEN } from './chapter1c'
import { withBus, type BusOpts } from './bus'

const TEAL = '#2a9d8f', RED = '#c9372c', BLUE = '#2b6ad0', WHITE = '#f4f7f8', PALE = '#e4ecee', ORANGE = '#e07a1f', YELLOW = '#f5b91c'
const ride = (to: string, title: string, why: string, intro: BusOpts['intro'], done: BusOpts['done']): BusOpts => ({ vehicle: 'ambulance', to, title, purpose: `${why}: wait at the bay, board the ambulance and ride there.`, objective: `Take the ambulance to ${to}`, success: `You step down at ${to}.`, intro, done })
const HOSP = (floor: string, extra: Deco[] = []): { floors: { x0: number; x1: number; z0: number; z1: number; color: string }[]; deco: Deco[] } => ({
  floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: floor }],
  deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: WHITE }, ...TREES([[-10, 9], [39, 9]]), ...LAMPS([[8, 6], [28, 6]]), ...extra],
})
const base = { spawn: { x: -9, z: 0 }, resume: { x: -6, z: 2 } }
const BIGB = R(-12, 40, -12.4, 12.4)
const desk = (x: number, color: string, label: string): Deco => ({ kind: 'stall', x, z: 7.4, w: 3.4, d: 1.6, color, label })
const side = { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }
const walkers = (xs: number[], z0 = -2, z1 = 8): ReturnType<typeof D>[] => xs.map((x, i) => D('walker', x, z0, z1, 2.6 + (i % 3) * 0.2, i * 0.6, [GREEN, ORANGE, RED, BLUE][i % 4]))

// ---------------------------------------------------------------------------------------------------------------- Level 1
const recep = B('recep', -8, 2, -12, -7, '#dfeef0', 'RECEPTION', 3.6), wardA = B('wardA', 10, 20, -12, -7, '#e8f0f0', 'WARD A', 3.8), staff = B('staff', 28, 36, -12, -7, '#f0e4c8', 'STAFF ROOM', 3.4)
export const LEVEL_C8L1 = withBus(L({
  ch: 'ch8', n: 1, title: 'Day One', next: 'ch8.l2', bounds: BIGB,
  intro: 'St Mary\'s General: six hundred beds, one very long corridor and a lanyard that says TRAINEE in letters that are a bit too big.',
  theme: { ground: '#b9c1bd', ...HOSP(PALE, [...recep.d, ...wardA.d, ...staff.d, desk(8, TEAL, 'SCRUBS'), desk(18, BLUE, 'BADGES'), desk(28, RED, 'GLOVES'), { kind: 'rug', x: 18, z: 0, w: 28, d: 2, color: '#d6e2e4' }]) },
  furniture: [recep.f, wardA.f, staff.f, F('d1', R(6.3, 9.7, 6.6, 8.2), 1.0, WOOD), F('d2', R(16.3, 19.7, 6.6, 8.2), 1.0, WOOD), F('d3', R(26.3, 29.7, 6.6, 8.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch8.l1', 1, 'talk', 'Meet the team', { purpose: 'Matron, a doctor and a senior nurse. Say hello to all three and try to remember their names.', objective: 'Talk to Matron Ngozi, Dr Musa and Nurse Chi', success: 'You have met them all.',
      intro: [say('helper', 'Hospitals run on people who remember names. Start by remembering these three.', 'calm')], done: [say('player', 'Ngozi, Musa, Chi. Matron, doctor, nurse. Easy. Probably.', 'laughing')], hint: 'Matron Ngozi, Dr Musa and Nurse Chi stand on the path near the buildings.' }),
    T('ch8.l1', 2, 'find', 'Find the staff room', { purpose: 'Three doors on the top row. Only one has a kettle behind it.', objective: 'Find the staff room', success: 'You find it.',
      intro: [say('player', 'Reception, Ward A, Staff Room. If I walk into Ward A with my lunch bag I will regret it.', 'thinking')], done: [say('player', 'The staff room. A kettle, a sofa and a poster about washing hands. Home.', 'happy')], hint: 'The STAFF ROOM is the building on the right at the top.' }),
    T('ch8.l1', 3, 'collect', 'Collect your kit', { purpose: 'Scrubs, a name badge and gloves from three desks along the bottom.', objective: 'Collect scrubs, a badge and gloves', success: 'Your kit is complete.',
      intro: [sayAs('Store Clerk', 'neighbour', 'Scrubs first, badge second, gloves third. The gloves go on last. Always last.', 'calm')], done: [say('player', 'Scrubs, badge, gloves. I look like I know what I am doing. Do not ask me anything.', 'proud')], hint: 'Follow the three desks along the bottom: SCRUBS, BADGES and GLOVES.' }),
    T('ch8.l1', 4, 'choose', 'Pick a department', { purpose: 'Matron lets you choose where to spend your first week: children, emergency or maternity.', objective: 'Choose a department', success: 'You choose.',
      intro: [sayAs('Matron Ngozi', 'neighbour', 'Children, emergency or maternity. All three are loud. Pick the loud you can live with.', 'cheeky')], done: [say('player', 'Decision made. May my ears survive the week.', 'worried')], hint: 'Three signs on the path: children, emergency or maternity.' }),
  ],
  talks: { 0: [
    { id: 'ngozi', name: 'Matron Ngozi', x: 4, z: -3, lines: [sayAs('Matron Ngozi', 'neighbour', 'You are the new trainee. Good. Wash your hands, keep your eyes open and your mouth polite.', 'calm')], rounds: [{ options: [
      { id: 'ready', label: '"I am ready, Matron."', reply: sayAs('Matron Ngozi', 'neighbour', 'Nobody is ready. But the answer is correct.', 'happy') },
      { id: 'nervous', label: '"I am a little nervous."', reply: sayAs('Matron Ngozi', 'neighbour', 'Good. Nervous people check twice. We like checking twice.', 'calm') },
    ] }] },
    { id: 'musa', name: 'Dr Musa', x: 16, z: -3, lines: [sayAs('Dr Musa', 'helper', 'Welcome. If you do not know something, ask. If you do know it, ask anyway. We ask a lot here.', 'cheeky')] },
    { id: 'chi', name: 'Nurse Chi', x: 26, z: -3, lines: [sayAs('Nurse Chi', 'neighbour', 'I will be your shadow this week. Or you will be mine. Either way, keep up.', 'curious')] },
  ] },
  spots: [
    { id: 'recep', task: 1, x: -3, z: -5.4, label: 'Check reception', wrong: say('helper', 'A queue, a bell and a very tired receptionist. Not this one.', 'cheeky') },
    { id: 'wardA', task: 1, x: 15, z: -5.4, label: 'Check Ward A', wrong: say('player', 'Beds, drips and a very firm sign saying "SILENCE". Not this one.', 'tired') },
    { id: 'staff', task: 1, x: 32, z: -5.4, label: 'Check the staff room', right: true },
  ],
  items: [
    { id: 'scrubs', task: 2, x: 8, z: 7.2, label: 'Take your scrubs', color: TEAL, shape: 'folder', y: 1.05, act: 'grab' },
    { id: 'badge', task: 2, x: 18, z: 7.2, label: 'Take your badge', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'grab' },
    { id: 'gloves', task: 2, x: 28, z: 7.2, label: 'Take your gloves', color: '#9ecbe6', shape: 'bag', y: 1.05, act: 'grab' },
    { id: 'kids', task: 3, x: 6, z: 2, label: 'Choose the children\'s ward', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'er', task: 3, x: 18, z: 2.4, label: 'Choose emergency', color: RED, shape: 'sign', y: 0 },
    { id: 'mat', task: 3, x: 30, z: 2, label: 'Choose maternity', color: TEAL, shape: 'sign', y: 0 },
  ],
  guide: [{ x: 16, z: -3, r: 14 }, { x: 32, z: -5.4, r: 8 }, { x: 18, z: 6, r: 12 }, { x: 18, z: 2, r: 12 }],
  crowd: [{ x: 10, z: 4, rot: 1 }, { x: 24, z: 4, rot: -2 }],
  npcs: side, choiceLabel: 'department',
  endBeat: { text: 'By lunchtime you can find the staff room, you smell faintly of hand sanitiser and you have been called "the new one" eleven times.', line: 'The ward is next.' },
  starRules: ['Finish the level', 'Finish with no wrong doors', 'Finish with no mistakes and no hints'],
}), ride('the hospital', 'Ride to the hospital', 'Your first shift at St Mary\'s', [sayAs('Mama Folake', 'folake', 'A hospital! My child, wash your hands, be kind and do not faint. Take the ambulance bay lift, they know you are coming.', 'happy')], [say('helper', 'The driver says nobody is ever late to a hospital in an ambulance. He is mostly right.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 2
const ward = B('ward', 6, 26, -12, -7, '#e8f0f0', 'WARD 3', 3.8)
export const LEVEL_C8L2 = withBus(L({
  ch: 'ch8', n: 2, title: 'Morning Rounds', next: 'ch8.l3', bounds: BIGB,
  intro: 'Seven o\'clock in Ward 3: twelve beds, twelve breakfasts and twelve people who all want something different. The chart on the wall says who gets what.',
  theme: { ground: '#b9c1bd', floors: [{ x0: -12, x1: 6, z0: -12, z1: 12, color: PALE }, { x0: 6, x1: 40, z0: -12, z1: 12, color: '#dfeff0' }], deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: WHITE }, ...ward.d, { kind: 'sign', x: 8, z: 3, label: 'WARD 3', w: 1.4 }, { kind: 'rug', x: 28, z: 2, w: 8, d: 4, color: TEAL }, { kind: 'chair', x: 26, z: 1, color: WOOD }, { kind: 'chair', x: 30, z: 1, color: WOOD }, { kind: 'chair', x: 34, z: 1, color: WOOD }, ...TREES([[-10, 9], [39, 9]])] },
  furniture: [ward.f, F('beds', R(14, 20, -6, -3), 0.7, '#6b8a95'), F('sink', R(22, 25, -6.4, -5.4), 1.2, '#9fb3ba'), F('trolley', R(28, 33, 6, 7.2), 0.9, WOOD)], ...base,
  tasks: [
    T('ch8.l2', 1, 'goto', 'Find Ward 3', { purpose: 'Walk down the corridor and find the ward door.', objective: 'Walk to Ward 3', success: 'You reach the ward.',
      intro: [sayAs('Nurse Chi', 'neighbour', 'Ward 3. Left at the lift, right at the smell of toast. You cannot miss it. People do. Often.', 'cheeky')], done: [sayAs('Nurse Chi', 'neighbour', 'Good. Every patient in there has opinions. Be polite to all of them.', 'calm')], hint: 'Follow the ring to the door marked WARD 3.' }),
    T('ch8.l2', 2, 'sequence', 'Before you touch anything', { purpose: 'Wash your hands, put on gloves, then check the patient chart. In that order. Always.', objective: 'Wash, glove, then check the chart', success: 'You are ready.',
      intro: [sayAs('Nurse Chi', 'neighbour', 'Wash first. Gloves second. Chart last. If you swap them I will know. I always know.', 'calm')], done: [say('player', 'Clean hands, clean gloves, clear chart. I am a professional.', 'proud')], hint: 'Order: the sink, the gloves, then the chart at the top.' }),
    T('ch8.l2', 3, 'serve', 'Breakfast round', { purpose: 'Help three patients to the table and bring each the right tray.', objective: 'Seat and serve three patients', success: 'Everyone has breakfast.',
      intro: [sayAs('Baba Sule', 'neighbour', 'Help me up, young one. Do not rush me. I was walking before you were thought of.', 'cheeky')], done: [sayAs('Mama Bisi', 'neighbour', 'Hot pap and a kind face. I will recover quickly.', 'happy')], hint: 'Seat each patient, take their tray from the trolley and carry it over.' }),
    T('ch8.l2', 4, 'hold', 'Sit with a patient', { purpose: 'Mama Bisi is nervous about her test. Sit beside her for a little while.', objective: 'Sit with Mama Bisi', success: 'She feels calmer.',
      intro: [say('player', 'Medicine is sometimes just sitting there so a person is not alone.', 'calm')], done: [sayAs('Mama Bisi', 'neighbour', 'Thank you, my dear. You are good at this. Do not tell Matron I said so.', 'happy')], hint: 'Stand in the ring next to the chair until she is calm.' }),
  ],
  items: [
    { id: 'wash', task: 1, x: 23.5, z: -5.9, label: 'Wash your hands', color: '#9ecbe6', shape: 'bottle', y: 1.2, act: 'wipe' },
    { id: 'glove', task: 1, x: 17, z: -2.4, label: 'Put on gloves', color: '#9ecbe6', shape: 'bag', y: 0.9, act: 'grab' },
    { id: 'chart', task: 1, x: 18, z: -6.5, label: 'Check the chart', color: '#fbf8f0', shape: 'paper', y: 1.6, act: 'reachHigh' },
    { id: 'tSule', task: 2, x: 29, z: 5.6, label: 'Take Baba Sule\'s tray', color: ORANGE, shape: 'plate', y: 1.0 },
    { id: 'tBisi', task: 2, x: 30.5, z: 5.6, label: 'Take Mama Bisi\'s tray', color: GREEN, shape: 'plate', y: 1.0 },
    { id: 'tTobi', task: 2, x: 32, z: 5.6, label: 'Take Tobi\'s tray', color: YELLOW, shape: 'plate', y: 1.0 },
  ],
  sequences: { 1: ['wash', 'glove', 'chart'] },
  serves: { 2: { eatSecs: 3, from: 2, guests: [
    { id: 'sule', name: 'Baba Sule', order: 'Soft bread and tea', dish: 'tSule', x: 10, z: 6, seat: { x: 26, z: 1 }, table: { x: 26, z: 2.6 } },
    { id: 'bisi', name: 'Mama Bisi', order: 'Hot pap', dish: 'tBisi', x: 8, z: 8, seat: { x: 30, z: 1 }, table: { x: 30, z: 2.6 } },
    { id: 'tobi', name: 'Tobi', order: 'Fruit and milk', dish: 'tTobi', x: 12, z: 9, seat: { x: 34, z: 1 }, table: { x: 34, z: 2.6 } },
  ] } },
  holds: { 3: { x: 10, z: 4, r: 1.2, secs: 6, pose: 'sit' } },
  goto: [RING(8, 4, 1.5), null, null, null],
  guide: [RING(8, 4, 1.5), { x: 19, z: -4, r: 8 }, { x: 30, z: 4, r: 10 }, RING(10, 4, 1.2)],
  crowd: [{ x: 4, z: 6, rot: 1 }],
  npcs: side, choiceLabel: 'ward',
  endBeat: { text: 'The trays are collected, the charts are updated and Baba Sule has told you the same story three times. You wish you had a fourth ear.', line: 'The pharmacy is next.' },
  starRules: ['Finish the level', 'Finish with no wrong order', 'Finish with no mistakes and no hints'],
}), ride('Ward 3', 'Ride to Ward 3', 'Morning rounds start at seven', [sayAs('Nurse Chi', 'neighbour', 'Rounds start at seven. Not seven-ten. Not "seven-ish". Take the ambulance round to the ward block.', 'worried')], [sayAs('Nurse Chi', 'neighbour', 'On time. I am almost proud. Do not tell anyone.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 3
const pharm = B('pharm', 6, 34, -12, -7, '#dfeef0', 'PHARMACY', 4.0)
export const LEVEL_C8L3 = withBus(L({
  ch: 'ch8', n: 3, title: 'The Pharmacy', next: 'ch8.l4', bounds: BIGB,
  intro: 'Rows of bottles with labels you cannot pronounce, a pharmacist who counts everything twice and a prescription that has to be right the first time.',
  theme: { ground: '#b9c1bd', ...HOSP(PALE, [...pharm.d, { kind: 'rug', x: 20, z: 3, w: 12, d: 3, color: TEAL }, { kind: 'sign', x: 37, z: 2, label: 'WARD ROUND', w: 1.8 }]) },
  furniture: [pharm.f, F('s1', R(10, 14, -4, -2.8), 1.6, '#8aa0a8'), F('s2', R(18, 22, -4, -2.8), 1.6, '#8aa0a8'), F('s3', R(26, 30, -4, -2.8), 1.6, '#8aa0a8'), F('counter', R(12, 28, 7.8, 9.2), 1.0, '#6a8ab8')], ...base,
  tasks: [
    T('ch8.l3', 1, 'find', 'Find the right cabinet', { purpose: 'The medicine is in one of three cabinets. The label on the prescription is smudged.', objective: 'Find the antibiotic cabinet', success: 'You find the cabinet.',
      intro: [sayAs('Pharmacist Kola', 'helper', 'Cabinet A is painkillers, B is antibiotics and C is things you should not touch. I would rather you did not guess.', 'calm')], done: [say('player', 'Antibiotics. Right where Kola said. I should have listened the first time.', 'happy')], hint: 'Check the three cabinets in the middle: left, middle and right.' }),
    T('ch8.l3', 2, 'collect', 'Collect the medicine', { purpose: 'The prescription has three items: tablets, syrup and a bandage roll.', objective: 'Collect tablets, syrup and a bandage', success: 'The prescription is filled.',
      intro: [sayAs('Pharmacist Kola', 'helper', 'Tablets, syrup, bandage. Check each one against the prescription. Twice. I count twice.', 'calm')], done: [say('player', 'Three items, all checked, all correct. Kola is nodding. That is rare.', 'proud')], hint: 'Take the three items from the counter at the bottom.' }),
    T('ch8.l3', 3, 'choose', 'Pick the right dose', { purpose: 'A child needs half a spoon, one spoon or two spoons. The label says one spoon for adults.', objective: 'Choose the child\'s dose', success: 'You choose.',
      intro: [sayAs('Pharmacist Kola', 'helper', 'This one is for a child of six. Adults take one spoon. What does a six-year-old take?', 'curious')], done: [sayAs('Pharmacist Kola', 'helper', 'Correct. The small ones need the small spoon. Always the small spoon.', 'happy')], hint: 'Three signs on the rug: half a spoon, one spoon or two spoons.' }),
    T('ch8.l3', 4, 'sequence', 'Label and bag it', { purpose: 'Write the label, count the tablets and then seal the bag.', objective: 'Label, count, then seal', success: 'The bag is ready.',
      intro: [sayAs('Pharmacist Kola', 'helper', 'Label, count, seal. If you seal first, you will have to open it. And I will have to watch.', 'cheeky')], done: [say('player', 'Sealed, labelled and counted. A small bag with a big job.', 'proud')], hint: 'Order on the counter: label, count, seal.' }),
  ],
  spots: [
    { id: 's1', task: 0, x: 12, z: -1.8, label: 'Check cabinet A', wrong: say('player', 'Paracetamol, paracetamol and more paracetamol. Not this one.', 'tired') },
    { id: 's2', task: 0, x: 20, z: -1.8, label: 'Check cabinet B', right: true },
    { id: 's3', task: 0, x: 28, z: -1.8, label: 'Check cabinet C', wrong: say('helper', 'A sign says "DO NOT TOUCH". I have decided not to.', 'cheeky') },
  ],
  items: [
    { id: 'tabs', task: 1, x: 14, z: 7.4, label: 'Take the tablets', color: '#fbf8f0', shape: 'bottle', y: 1.05, act: 'grab' },
    { id: 'syrup', task: 1, x: 20, z: 7.4, label: 'Take the syrup', color: ORANGE, shape: 'bottle', y: 1.05, act: 'grab' },
    { id: 'roll', task: 1, x: 26, z: 7.4, label: 'Take the bandage roll', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'grab' },
    { id: 'half', task: 2, x: 12, z: 1.4, label: 'Half a spoon', color: TEAL, shape: 'sign', y: 0 },
    { id: 'one', task: 2, x: 20, z: 1.4, label: 'One spoon', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'two', task: 2, x: 28, z: 1.4, label: 'Two spoons', color: RED, shape: 'sign', y: 0 },
    { id: 'label', task: 3, x: 14, z: 8.6, label: 'Write the label', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'write' },
    { id: 'count', task: 3, x: 20, z: 8.6, label: 'Count the tablets', color: '#fbf8f0', shape: 'bottle', y: 1.05, act: 'countMoney' },
    { id: 'seal', task: 3, x: 26, z: 8.6, label: 'Seal the bag', color: RED, shape: 'stamp', y: 1.05, act: 'stamp' },
  ],
  sequences: { 3: ['label', 'count', 'seal'] },
  guide: [{ x: 20, z: -1.8, r: 10 }, { x: 20, z: 7, r: 10 }, { x: 20, z: 1.4, r: 10 }, { x: 20, z: 8, r: 10 }],
  crowd: [{ x: 6, z: 2, rot: 1 }, { x: 34, z: 5, rot: 3 }],
  npcs: side, choiceLabel: 'dose',
  endBeat: { text: 'The small bag goes up to the ward with a hand-written label and a smile from Kola. You think of pharmacies a little differently.', line: 'Emergency is next.' },
  starRules: ['Finish the level', 'Finish with no wrong cabinets', 'Finish with no mistakes and no hints'],
}), ride('the pharmacy', 'Ride to the pharmacy', 'A prescription is waiting', [sayAs('Nurse Chi', 'neighbour', 'The pharmacy is across the car park. Take the ambulance. It is faster than the lift. Everything is faster than the lift.', 'cheeky')], [sayAs('Pharmacist Kola', 'helper', 'Mind the floor. I just cleaned it. And mind the bottles. I just counted them.', 'calm')]))

// ---------------------------------------------------------------------------------------------------------------- Level 4
const er = B('er', 4, 14, -12, -7, '#f0dcdc', 'EMERGENCY', 3.8), tri = B('triage', 22, 34, -12, -7, '#e8f0f0', 'TRIAGE', 3.6)
export const LEVEL_C8L4 = withBus(L({
  ch: 'ch8', n: 4, title: 'Emergency', next: 'ch8.l5', bounds: BIGB,
  intro: 'The doors slam open, a siren stops in the car park and suddenly everyone in emergency moves at a speed you did not know hospital people had.',
  theme: { ground: '#b9c1bd', ...HOSP('#e8e4e2', [...er.d, ...tri.d, { kind: 'rug', x: 18, z: 4, w: 10, d: 3, color: RED }, { kind: 'sign', x: 37, z: 2, label: 'ER BAY', w: 1.4 }]) },
  furniture: [er.f, tri.f, F('bed', R(16, 22, 6.8, 8.4), 0.8, '#6b8a95')], ...base,
  tasks: [
    T('ch8.l4', 1, 'reach', 'Run to the ER bay', { purpose: 'An ambulance is arriving. Dodge the trolleys and get to the ER bay before it does.', objective: 'Run to the ER bay', success: 'You reach the bay in time.',
      intro: [sayAs('Nurse Chi', 'neighbour', 'Ambulance incoming! Go go go! Mind the trolleys, mind the people, do not mind me!', 'worried')], done: [say('player', 'Here. Out of breath. Ready to help. Mostly ready to breathe.', 'laughing')], hint: 'Cross behind the trolleys and run right to the ER BAY sign.' }),
    T('ch8.l4', 2, 'talk', 'Talk to the patient', { purpose: 'Baba Sule has cut his hand badly. Ask what happened, and keep him calm.', objective: 'Talk to Baba Sule', success: 'He is calmer.',
      intro: [say('player', 'Breathe. Smile. Do not look at the blood. Look at his face.', 'worried')], done: [sayAs('Baba Sule', 'neighbour', 'You talk too much, young one. But you are helping. Carry on.', 'cheeky')], hint: 'Baba Sule sits by the bed on the right.' }),
    T('ch8.l4', 3, 'sequence', 'Clean and dress the wound', { purpose: 'Clean the cut, put on a dressing and then wrap it in a bandage.', objective: 'Clean, dress, then bandage', success: 'The wound is dressed.',
      intro: [sayAs('Dr Musa', 'helper', 'Clean first. Dressing second. Bandage last. A bandage on a dirty wound is a very bad idea.', 'calm')], done: [sayAs('Dr Musa', 'helper', 'Good hands. Steady. You could be a nurse. Or a magician.', 'happy')], hint: 'Order at the bed: clean, dressing, bandage.' }),
    T('ch8.l4', 4, 'hold', 'Keep the pressure on', { purpose: 'Press firmly on the dressing and hold it still until the bleeding stops.', objective: 'Hold pressure on the dressing', success: 'The bleeding stops.',
      intro: [sayAs('Dr Musa', 'helper', 'Hold it there. Firmly. Not too hard. Not too soft. Like holding a very important sandwich.', 'cheeky')], done: [say('player', 'It has stopped. My hands are shaking. His are steady. Funny.', 'laughing')], hint: 'Stand in the ring by the bed and wait for the count to finish.' }),
  ],
  talks: { 1: [{ id: 'sule', name: 'Baba Sule', x: 20, z: 6, lines: [sayAs('Baba Sule', 'neighbour', 'I was cutting yam. The knife won. I did not expect that.', 'cheeky')], rounds: [{ options: [
    { id: 'calm', label: '"You are in good hands, Baba."', reply: sayAs('Baba Sule', 'neighbour', 'Your hands are young. They shake. But the voice is kind.', 'happy') },
    { id: 'ask', label: '"Does it hurt a lot?"', reply: sayAs('Baba Sule', 'neighbour', 'A little. I have had worse. The knife and I have history.', 'cheeky') },
  ] }] }] },
  items: [
    { id: 'clean', task: 2, x: 14, z: 8.6, label: 'Clean the wound', color: '#9ecbe6', shape: 'bottle', y: 1.0, act: 'wipe' },
    { id: 'dress', task: 2, x: 18, z: 8.6, label: 'Put on the dressing', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'bandage' },
    { id: 'wrap', task: 2, x: 22, z: 8.6, label: 'Wrap the bandage', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'bandage' },
  ],
  sequences: { 2: ['clean', 'dress', 'wrap'] },
  holds: { 3: { x: 18, z: 4, r: 1.2, secs: 7, pose: 'bandage' } },
  goto: [RING(36, 4, 1.5), null, null, null],
  guide: [RING(36, 4, 1.5), { x: 20, z: 5, r: 4 }, { x: 18, z: 8, r: 8 }, RING(18, 4, 1.2)],
  hazards: walkers([8, 14, 20, 28], -2, 8),
  timeLimit: 16,
  crowd: [{ x: 6, z: 6, rot: 1 }, { x: 32, z: 7, rot: -2 }],
  npcs: side, choiceLabel: 'emergency',
  endBeat: { text: 'The siren fades, the doors swing shut and Baba Sule is back on his feet. Matron nods at you from across the room. A tiny nod. It counts.', line: 'Visiting hours are next.' },
  starRules: ['Finish the level', 'Reach the bay before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the emergency wing', 'Ride to emergency', 'A call has just come in', [sayAs('Nurse Chi', 'neighbour', 'Emergency! Right now! Take the ambulance, take a deep breath and do not take your time!', 'angry')], [say('helper', 'The siren fades. Somewhere a monitor beeps. Everybody inside is already moving.', 'worried')]))

// ---------------------------------------------------------------------------------------------------------------- Level 5
const lobby = B('lobby', 4, 24, -12, -7, '#dfeef0', 'MAIN LOBBY', 3.6)
export const LEVEL_C8L5 = withBus(L({
  ch: 'ch8', n: 5, title: 'Visiting Hours', next: 'ch8.l6', bounds: BIGB,
  intro: 'Four o\'clock and the corridor fills with relatives carrying soup, flowers and enough worry to power the building.',
  theme: { ground: '#b9c1bd', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: PALE }], deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: WHITE }, ...lobby.d, { kind: 'awning', x: 28, z: 3, w: 12, d: 5, color: TEAL }, { kind: 'rug', x: 28, z: 3, w: 10, d: 3, color: '#2a7d72' }, { kind: 'chair', x: 24, z: 4, color: WOOD }, { kind: 'chair', x: 28, z: 4, color: WOOD }, { kind: 'chair', x: 32, z: 4, color: WOOD }, { kind: 'rug', x: 12, z: 3, w: 12, d: 3, color: '#d6e2e4' }, { kind: 'sign', x: 37, z: 8, label: 'WARD 5', w: 1.4 }, ...TREES([[-10, 9]])] },
  furniture: [lobby.f, F('urn', R(24, 32, -8.6, -7.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch8.l5', 1, 'talk', 'Greet the visitors', { purpose: 'Three families, three sets of worries. Listen to each one.', objective: 'Talk to Mrs Okoro, Mr Danjuma and Tobi\'s mum', success: 'You have helped everyone.',
      intro: [say('helper', 'Visitors are scared. Scared people ask the same question five times. Answer it five times.', 'calm')], done: [say('player', 'Three families, three kinds of worry. I only mixed one of them up.', 'laughing')], hint: 'The three visitors wait along the lobby.' }),
    T('ch8.l5', 2, 'serve', 'Tea in the waiting area', { purpose: 'Seat the visitors under the awning and bring each a hot cup of tea.', objective: 'Seat and serve three visitors', success: 'Everyone has tea.',
      intro: [sayAs('Nurse Chi', 'neighbour', 'Tea fixes more than medicine does. Do not tell Dr Musa I said that.', 'cheeky')], done: [sayAs('Mrs Okoro', 'neighbour', 'You are a good child. May your pay be generous.', 'happy')], hint: 'Seat each visitor, take their cup from the urn and carry it over.' }),
    T('ch8.l5', 3, 'choose', 'The hard question', { purpose: 'A relative asks if the patient will be fine. You are only a trainee. Be honest and kind.', objective: 'Choose what to say', success: 'You choose.',
      intro: [sayAs('Mr Danjuma', 'neighbour', 'Will she be all right? Tell me she will be all right. Please. I am asking nicely.', 'worried')], done: [say('player', 'Decision made. I hope it was the kind one.', 'worried')], hint: 'Three signs on the rug: "She will be fine", "I will ask the doctor" or "I do not know".' }),
    T('ch8.l5', 4, 'goto', 'Walk them to Ward 5', { purpose: 'Visiting hours are on and the family is waiting. Walk to the Ward 5 door and show the way.', objective: 'Walk to Ward 5', success: 'You reach Ward 5.',
      intro: [say('player', 'Corridor, lift, second left. Say it twice so nobody is lost.', 'thinking')], done: [sayAs('Mrs Okoro', 'neighbour', 'Thank you. Without you we would be walking until Christmas.', 'happy')], hint: 'Follow the ring to the WARD 5 sign.' }),
  ],
  talks: { 0: [
    { id: 'okoro', name: 'Mrs Okoro', x: 6, z: 2, lines: [sayAs('Mrs Okoro', 'neighbour', 'My husband is in Ward 5. Is he eating? He never eats the hospital food. He is stubborn.', 'worried')], rounds: [{ options: [
      { id: 'eating', label: '"He is eating well today, Ma."', reply: sayAs('Mrs Okoro', 'neighbour', 'Thank God. I brought him some stew anyway. A mother always brings stew.', 'happy') },
      { id: 'ask', label: '"I will check and tell you."', reply: sayAs('Mrs Okoro', 'neighbour', 'Honest. Good. Check carefully. He lies about his appetite.', 'cheeky') },
    ] }] },
    { id: 'danjuma', name: 'Mr Danjuma', x: 14, z: 2, lines: [sayAs('Mr Danjuma', 'helper', 'Which ward is it again? Is it left? Right? I am turning in circles.', 'worried')] },
    { id: 'tobi', name: 'Tobi\'s mum', x: 22, z: 2, lines: [sayAs('Tobi\'s mum', 'neighbour', 'He asked for ice cream. I do not know if he is allowed. Can I bring ice cream?', 'curious')] },
  ] },
  items: [
    { id: 'cOkoro', task: 1, x: 25, z: -7.8, label: 'Take Mrs Okoro\'s tea', color: ORANGE, shape: 'cup', y: 1.1 },
    { id: 'cDanj', task: 1, x: 28, z: -7.8, label: 'Take Mr Danjuma\'s tea', color: GREEN, shape: 'cup', y: 1.1 },
    { id: 'cMum', task: 1, x: 31, z: -7.8, label: 'Take Tobi\'s mum\'s tea', color: BLUE, shape: 'cup', y: 1.1 },
    { id: 'fine', task: 2, x: 8, z: 7.6, label: 'Say "She will be fine"', color: YELLOW, shape: 'sign', y: 0 },
    { id: 'ask', task: 2, x: 18, z: 7.6, label: 'Say "I will ask the doctor"', color: GREEN, shape: 'sign', y: 0 },
    { id: 'idk', task: 2, x: 28, z: 7.6, label: 'Say "I do not know"', color: RED, shape: 'sign', y: 0 },
  ],
  serves: { 1: { eatSecs: 3, from: 1, guests: [
    { id: 'okoro', name: 'Mrs Okoro', order: 'Tea, two sugars', dish: 'cOkoro', x: 6, z: 2, seat: { x: 24, z: 4 }, table: { x: 24, z: 2.4 } },
    { id: 'danj', name: 'Mr Danjuma', order: 'Black tea', dish: 'cDanj', x: 14, z: 2, seat: { x: 28, z: 4 }, table: { x: 28, z: 2.4 } },
    { id: 'mum', name: 'Tobi\'s mum', order: 'Tea with milk', dish: 'cMum', x: 22, z: 2, seat: { x: 32, z: 4 }, table: { x: 32, z: 2.4 } },
  ] } },
  goto: [null, null, null, RING(36, 6, 1.6)],
  guide: [{ x: 14, z: 2, r: 12 }, { x: 28, z: 0, r: 10 }, { x: 18, z: 7.6, r: 12 }, RING(36, 6, 1.6)],
  crowd: [{ x: 10, z: 8, rot: 2 }],
  npcs: side, choiceLabel: 'answer',
  endBeat: { text: 'The corridor is warm with soup and whispers. Nobody here is a patient or a visitor right now. They are just people who are glad to be together.', line: 'The lab is calling.' },
  starRules: ['Finish the level', 'Finish with no wrong cups', 'Finish with no mistakes and no hints'],
}), ride('the main lobby', 'Ride to the lobby', 'Visiting hours open at four', [sayAs('Matron Ngozi', 'neighbour', 'Visiting hours. The most important hour of the day. Smile. Be kind. Be quiet. All at once.', 'calm')], [say('helper', 'A queue is already forming. Soup flasks, flowers and a lot of nervous energy.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 6
const lab = B('lab', 28, 38, -12, -7, '#e8f0f0', 'LABORATORY', 3.8)
export const LEVEL_C8L6 = withBus(L({
  ch: 'ch8', n: 6, title: 'Lab Run', next: 'ch8.l7', bounds: BIGB,
  intro: 'Blood samples do not wait. Every tube in the building has to get to the lab before the machines go on their ten-minute break.',
  theme: { ground: '#b9c1bd', ...HOSP(PALE, [...lab.d, { kind: 'sign', x: 34, z: 2, label: 'LAB', w: 1.2 }, { kind: 'rug', x: 14, z: 3, w: 12, d: 3, color: '#d6e2e4' }]) },
  furniture: [lab.f, F('rack1', R(8, 12, -3, -1.8), 1.0, '#8aa0a8'), F('rack2', R(16, 20, -3, -1.8), 1.0, '#8aa0a8'), F('rack3', R(24, 28, -3, -1.8), 1.0, '#8aa0a8')], ...base,
  tasks: [
    T('ch8.l6', 1, 'collect', 'Collect the samples', { purpose: 'Three tubes from three wards, each with its name on.', objective: 'Collect three sample tubes', success: 'You have all three.',
      intro: [sayAs('Nurse Chi', 'neighbour', 'Three samples, three wards. Check the names. Check them again. A wrong name is a wrong diagnosis.', 'worried')], done: [say('player', 'Three tubes, three names, all checked. My pocket is very important now.', 'proud')], hint: 'Take a tube from each of the three racks.' }),
    T('ch8.l6', 2, 'reach', 'Run to the lab', { purpose: 'The machines are about to pause. Dodge the trolleys and get to the lab before the break.', objective: 'Run to the lab door', success: 'You reach the lab in time.',
      intro: [sayAs('Technician Amaka', 'helper', 'The machine pauses in a minute! Run! Do not drop the tubes! Do not run into the trolleys!', 'angry')], done: [say('player', 'In. Out of breath. Tubes intact. A tiny miracle.', 'laughing')], hint: 'Cross behind the trolleys and run right to the LAB sign.' }),
    T('ch8.l6', 3, 'find', 'Find the right result', { purpose: 'Three result folders on the bench and only one matches the patient.', objective: 'Find the matching folder', success: 'You find it.',
      intro: [sayAs('Technician Amaka', 'helper', 'Three folders, three patients. Only one is yours. Do not read them aloud. It is private.', 'calm')], done: [say('player', 'The right one. A good feeling. A quiet feeling.', 'happy')], hint: 'Check the three folders on the racks near the top.' }),
    T('ch8.l6', 4, 'talk', 'Ask Amaka', { purpose: 'Amaka explains the result. Ask her one question so you understand it.', objective: 'Talk to Technician Amaka', success: 'You understand the result.',
      intro: [say('player', 'Ask a good question. Not a clever question. A useful question.', 'thinking')], done: [sayAs('Technician Amaka', 'helper', 'Good question. Most people never ask. That is how mistakes happen.', 'happy')], hint: 'Amaka stands next to the lab door.' }),
  ],
  items: [
    { id: 't1', task: 0, x: 10, z: 7.4, label: 'Take the tube from Ward 1', color: RED, shape: 'bottle', y: 1.05, act: 'grab' },
    { id: 't2', task: 0, x: 18, z: 7.4, label: 'Take the tube from Ward 2', color: RED, shape: 'bottle', y: 1.05, act: 'grab' },
    { id: 't3', task: 0, x: 26, z: 7.4, label: 'Take the tube from Ward 3', color: RED, shape: 'bottle', y: 1.05, act: 'grab' },
  ],
  spots: [
    { id: 'f1', task: 2, x: 10, z: -1.4, label: 'Check the left folder', wrong: say('helper', 'Wrong name. A man called Ibrahim. Not ours.', 'cheeky') },
    { id: 'f2', task: 2, x: 18, z: -1.4, label: 'Check the middle folder', right: true },
    { id: 'f3', task: 2, x: 26, z: -1.4, label: 'Check the right folder', wrong: say('player', 'A lovely lady called Funmi. Not ours either.', 'tired') },
  ],
  talks: { 3: [{ id: 'amaka', name: 'Technician Amaka', x: 33, z: -1.4, lines: [sayAs('Technician Amaka', 'helper', 'The white cells are high. That usually means infection. Any questions?', 'calm')], rounds: [{ options: [
    { id: 'what', label: '"What does that mean for the patient?"', reply: sayAs('Technician Amaka', 'helper', 'It means the doctor needs to see this now. Which is where you come in.', 'cheeky') },
    { id: 'normal', label: '"What would be normal?"', reply: sayAs('Technician Amaka', 'helper', 'Lower. About half. You ask good questions, trainee.', 'happy') },
  ] }] }] },
  goto: [null, RING(36, 4, 1.6), null, null],
  guide: [{ x: 18, z: 7, r: 12 }, RING(36, 4, 1.6), { x: 18, z: -1.4, r: 10 }, { x: 33, z: -1.4, r: 4 }],
  hazards: walkers([10, 16, 22, 28], -3, 9),
  timeLimit: 16,
  crowd: [{ x: 4, z: 5, rot: 1 }],
  npcs: side, choiceLabel: 'result',
  endBeat: { text: 'The machines hum, the numbers appear on the screen and somewhere upstairs a doctor is about to make a decision because of tubes you carried.', line: 'Night is coming.' },
  starRules: ['Finish the level', 'Reach the lab before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the lab block', 'Ride to the lab block', 'The samples cannot wait', [sayAs('Nurse Chi', 'neighbour', 'Samples! The lab! Ten minutes! The ambulance is outside. It knows the way better than the lift.', 'worried')], [sayAs('Technician Amaka', 'helper', 'You made it. Good. Now do not touch anything. Everything here is expensive.', 'calm')]))

// ---------------------------------------------------------------------------------------------------------------- Level 7
export const LEVEL_C8L7 = withBus(L({
  ch: 'ch8', n: 7, title: 'Night Shift', next: 'ch8.l8', bounds: BIGB,
  intro: 'Three in the morning. The corridor lights are dim, the vending machine hums and two hundred patients are asleep. Mostly.',
  theme: { ground: '#8a9296', ...HOSP('#cfd6d8', [{ kind: 'rug', x: 18, z: 4, w: 10, d: 3, color: '#3a5a6a' }, { kind: 'chair', x: 18, z: 5, color: WOOD }, { kind: 'sign', x: 37, z: 2, label: 'WARD 3', w: 1.4 }, { kind: 'sign', x: 8, z: -6, label: 'BED 1', w: 1.2 }, { kind: 'sign', x: 18, z: -6, label: 'BED 2', w: 1.2 }, { kind: 'sign', x: 28, z: -6, label: 'BED 3', w: 1.2 }]) },
  furniture: [F('b1', R(6, 10, -5, -3), 0.7, '#6b8a95'), F('b2', R(16, 20, -5, -3), 0.7, '#6b8a95'), F('b3', R(26, 30, -5, -3), 0.7, '#6b8a95'), F('desk', R(10, 26, 8, 9.2), 0.9, WOOD)], ...base,
  tasks: [
    T('ch8.l7', 1, 'hold', 'Check a pulse', { purpose: 'A patient cannot sleep. Sit beside the bed and check the pulse for a full minute.', objective: 'Check the pulse', success: 'The pulse is steady.',
      intro: [sayAs('Nurse Chi', 'neighbour', 'Two fingers on the wrist. Count. Do not talk. Count properly.', 'calm')], done: [say('player', 'Steady and slow. He is sleeping now. I love this job. At three in the morning.', 'happy')], hint: 'Stand in the ring at the bed until the count is full.' }),
    T('ch8.l7', 2, 'sequence', 'Do the night rounds', { purpose: 'Visit Bed 1, Bed 2 and Bed 3 in that order and note the readings on each chart.', objective: 'Bed 1, Bed 2, then Bed 3', success: 'Your rounds are done.',
      intro: [sayAs('Nurse Chi', 'neighbour', 'Beds in order. One, two, three. If you skip one, somebody will wake up and tell me.', 'cheeky')], done: [say('player', 'Three beds, three charts, three people breathing. A good round.', 'proud')], hint: 'Order along the top: Bed 1, Bed 2, Bed 3.' }),
    T('ch8.l7', 3, 'find', 'Find the beeping alarm', { purpose: 'A monitor is beeping somewhere. Check the three side rooms and find the one that needs you.', objective: 'Find the alarm', success: 'You find it.',
      intro: [say('player', 'Beep. Beep. Beep. It is coming from... somewhere. Everywhere. Nowhere.', 'worried')], done: [say('player', 'A loose wire. Not the patient. Phew.', 'laughing')], hint: 'Check the left, middle and right rooms near the desk.' }),
    T('ch8.l7', 4, 'reach', 'Run to Ward 3', { purpose: 'Nurse Chi calls over the radio. Cross the corridor to Ward 3 before the lights flicker back on.', objective: 'Run to the Ward 3 door', success: 'You reach it in time.',
      intro: [sayAs('Nurse Chi', 'neighbour', 'Ward 3! Now! Do not run into the cleaner! The floor is wet!', 'angry')], done: [say('player', 'In time. No slips. No spills. A small victory in the dark.', 'proud')], hint: 'Cross behind the cleaners and run right to the WARD 3 sign.' }),
  ],
  items: [
    { id: 'c1', task: 1, x: 8, z: -5.7, label: 'Note Bed 1', color: '#fbf8f0', shape: 'paper', y: 1.3, act: 'write' },
    { id: 'c2', task: 1, x: 18, z: -5.7, label: 'Note Bed 2', color: '#fbf8f0', shape: 'paper', y: 1.3, act: 'write' },
    { id: 'c3', task: 1, x: 28, z: -5.7, label: 'Note Bed 3', color: '#fbf8f0', shape: 'paper', y: 1.3, act: 'write' },
  ],
  spots: [
    { id: 'r1', task: 2, x: 10, z: 7, label: 'Check the left room', wrong: say('helper', 'A sleeping man, a snoring monitor. Fine.', 'cheeky') },
    { id: 'r2', task: 2, x: 18, z: 6.6, label: 'Check the middle room', wrong: say('player', 'Empty. A bed, a plant and a clock. The clock is loud.', 'tired') },
    { id: 'r3', task: 2, x: 26, z: 7, label: 'Check the right room', right: true },
  ],
  sequences: { 1: ['c1', 'c2', 'c3'] },
  holds: { 0: { x: 18, z: 4, r: 1.2, secs: 8, pose: 'checkPulse' } },
  goto: [null, null, null, RING(36, 4, 1.5)],
  guide: [RING(18, 4, 1.2), { x: 18, z: -4, r: 14 }, { x: 18, z: 7, r: 10 }, RING(36, 4, 1.5)],
  hazards: walkers([8, 14, 20, 28], -2, 8),
  timeLimit: 16,
  crowd: [{ x: 6, z: 6, rot: 1 }],
  npcs: side, choiceLabel: 'night',
  endBeat: { text: 'Four o\'clock. The sky outside the window turns a very soft blue. A man in Bed 2 wakes up and thanks you. You did not do much. It counts.', line: 'Dawn is on the way.' },
  starRules: ['Finish the level', 'Reach Ward 3 before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the night ward', 'Ride to the night ward', 'Your first night shift', [sayAs('Mama Folake', 'folake', 'A night shift? At your age? Take a flask of tea and wear your thick socks. The ambulance will drop you off.', 'worried')], [sayAs('Nurse Chi', 'neighbour', 'Night shift. Coffee in the corner. Cold in the corridor. Calm in your heart. Okay?', 'calm')]))

// ---------------------------------------------------------------------------------------------------------------- Level 8
const mat = B('maternity', 8, 30, -12, -7, '#f0e4e8', 'MATERNITY', 3.8)
export const LEVEL_C8L8 = withBus(L({
  ch: 'ch8', n: 8, title: 'The Delivery Ward', next: 'ch8.l9', bounds: BIGB,
  intro: 'Seven in the morning and a baby is on the way. Everybody moves faster, speaks softer and carries more towels.',
  theme: { ground: '#b9c1bd', ...HOSP('#f0e8ea', [...mat.d, { kind: 'sign', x: 37, z: 2, label: 'NURSERY', w: 1.6 }, { kind: 'rug', x: 18, z: 4, w: 12, d: 3, color: '#e0a8b8' }]) },
  furniture: [mat.f, F('table', R(10, 26, -3.4, -2), 0.9, WOOD), F('shelf', R(10, 29, 6.8, 8.2), 1.0, '#c8b0b8')], ...base,
  tasks: [
    T('ch8.l8', 1, 'sequence', 'Get ready', { purpose: 'Put on the gown, then the mask, then wash and glove up. Order matters in the delivery room.', objective: 'Gown, mask, then gloves', success: 'You are ready.',
      intro: [sayAs('Midwife Joy', 'neighbour', 'Gown, mask, gloves. Quickly but properly. Babies do not wait for slow trainees.', 'worried')], done: [say('player', 'Gowned, masked, gloved. I look like an astronaut who got lost.', 'laughing')], hint: 'Order on the table: gown, mask, gloves.' }),
    T('ch8.l8', 2, 'collect', 'Gather the supplies', { purpose: 'Towels, a warm blanket and a baby hat from the shelf along the bottom.', objective: 'Collect towels, a blanket and a hat', success: 'You have everything.',
      intro: [sayAs('Midwife Joy', 'neighbour', 'Towels, blanket, hat. The hat is small. The hat is very important.', 'cheeky')], done: [say('player', 'Towels, blanket and a hat the size of an orange. Perfect.', 'happy')], hint: 'Take the three items from the shelf along the bottom.' }),
    T('ch8.l8', 3, 'talk', 'Help the mother', { purpose: 'The mother is nervous. Say something calm and kind.', objective: 'Talk to Mrs Adaeze', success: 'She feels braver.',
      intro: [say('player', 'Be calm. Be quiet. Be there. That is all she needs from me.', 'calm')], done: [sayAs('Mrs Adaeze', 'neighbour', 'You are good at this. Can you hold my hand? Not too hard. Not too soft.', 'happy')], hint: 'Mrs Adaeze lies on the bed in the middle.' }),
    T('ch8.l8', 4, 'reach', 'Run to the nursery', { purpose: 'The baby has to be warm. Run to the nursery door and bring the warmer back before the cry gets louder.', objective: 'Run to the nursery door', success: 'You reach the nursery.',
      intro: [sayAs('Midwife Joy', 'neighbour', 'The warmer! In the nursery! Go! The baby is cold! The baby is also loud!', 'angry')], done: [say('player', 'Warmer in hand. Heart in my throat. A tiny cry. A perfect cry.', 'happy')], hint: 'Cross behind the nurses and run right to the NURSERY sign.' }),
  ],
  items: [
    { id: 'gown', task: 0, x: 13, z: -2.7, label: 'Put on the gown', color: TEAL, shape: 'folder', y: 1.0, act: 'lean' },
    { id: 'mask', task: 0, x: 18, z: -2.7, label: 'Put on the mask', color: '#9ecbe6', shape: 'paper', y: 1.0, act: 'grab' },
    { id: 'glov', task: 0, x: 23, z: -2.7, label: 'Put on the gloves', color: '#9ecbe6', shape: 'bag', y: 1.0, act: 'grab' },
    { id: 'towels', task: 1, x: 12, z: 7.4, label: 'Take the towels', color: '#fbf8f0', shape: 'blanket', y: 1.05, act: 'grab' },
    { id: 'blanket', task: 1, x: 19, z: 7.4, label: 'Take the blanket', color: '#e0a8b8', shape: 'blanket', y: 1.05, act: 'grab' },
    { id: 'hat', task: 1, x: 26, z: 7.4, label: 'Take the baby hat', color: YELLOW, shape: 'paper', y: 1.05, act: 'grab' },
  ],
  sequences: { 0: ['gown', 'mask', 'glov'] },
  talks: { 2: [{ id: 'adaeze', name: 'Mrs Adaeze', x: 18, z: 4, lines: [sayAs('Mrs Adaeze', 'neighbour', 'I am scared. I do not want to be scared. I just am. Is that silly?', 'worried')], rounds: [{ options: [
    { id: 'normal', label: '"Not silly at all. Everybody is."', reply: sayAs('Mrs Adaeze', 'neighbour', 'Thank you. I feel a little less alone.', 'happy') },
    { id: 'strong', label: '"You are stronger than you think."', reply: sayAs('Mrs Adaeze', 'neighbour', 'That is what my mother says. She is outside. She is praying. Loudly.', 'cheeky') },
  ] }] }] },
  goto: [null, null, null, RING(36, 4, 1.6)],
  guide: [{ x: 18, z: -2.7, r: 8 }, { x: 19, z: 7, r: 12 }, { x: 18, z: 4, r: 4 }, RING(36, 4, 1.6)],
  hazards: walkers([8, 14, 22, 30], -2, 8),
  timeLimit: 16,
  crowd: [{ x: 6, z: 6, rot: 1 }],
  npcs: side, choiceLabel: 'moment',
  endBeat: { text: 'At 7:42 the room goes silent, then there is a cry like a tiny trumpet. Everybody laughs and nobody knows why they are crying.', line: 'The week is almost over.' },
  starRules: ['Finish the level', 'Reach the nursery before the timer ends', 'Be on time with two or fewer slips'],
}), ride('the maternity wing', 'Ride to maternity', 'A baby is on the way', [sayAs('Midwife Joy', 'neighbour', 'We have a delivery! Seven in the morning, the baby is early and the mother is brave. Come quickly!', 'worried')], [say('helper', 'The driver says he has delivered three babies in this ambulance. He does not recommend it.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 9
export const LEVEL_C8L9 = withBus(L({
  ch: 'ch8', n: 9, title: 'Last Round', next: null, badge: 'Hospital Shift', bounds: BIGB,
  intro: 'Friday afternoon. Your trainee week is over, the corridor smells of jollof and somebody has hung a banner that says WELL DONE in three different spellings.',
  theme: { ground: '#b9c1bd', ...HOSP(PALE, [{ kind: 'awning', x: 14, z: 3, w: 12, d: 5, color: TEAL }, { kind: 'rug', x: 14, z: 3, w: 10, d: 3, color: '#2a7d72' }, { kind: 'chair', x: 10, z: 4, color: WOOD }, { kind: 'chair', x: 14, z: 4, color: WOOD }, { kind: 'chair', x: 18, z: 4, color: WOOD }, { kind: 'rug', x: 30, z: 0, w: 8, d: 3, color: BLUE }, { kind: 'chair', x: 30, z: 0, color: DARK }, { kind: 'sign', x: 37, z: -4, label: 'MAIN GATE', w: 1.8 }]) },
  furniture: [F('buffet', R(8, 20, -8.6, -7.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch8.l9', 1, 'talk', 'Say your thank-yous', { purpose: 'Three people who taught you something this week. Thank each of them.', objective: 'Talk to Nurse Chi, Dr Musa and Matron Ngozi', success: 'You have thanked everyone.',
      intro: [say('player', 'One week. It feels like a year. And I have the feet to prove it.', 'tired')], done: [say('player', 'I thanked them all. Nobody cried. Almost nobody.', 'laughing')], hint: 'Nurse Chi, Dr Musa and Matron Ngozi stand in the corridor.' }),
    T('ch8.l9', 2, 'serve', 'The ward party', { purpose: 'Seat the team under the awning and bring each their treat.', objective: 'Seat and serve three colleagues', success: 'The party is on.',
      intro: [sayAs('Nurse Chi', 'neighbour', 'A party! With cake! I have not had cake since Tuesday. Do not judge.', 'happy')], done: [sayAs('Dr Musa', 'helper', 'This is the best ward party in the history of the hospital. And I have been to two.', 'cheeky')], hint: 'Seat each colleague, take their treat from the buffet and carry it over.' }),
    T('ch8.l9', 3, 'hold', 'Sit through the speech', { purpose: 'The hospital director gives a speech about dedication. Sit still and nod in the right places.', objective: 'Sit and listen to the speech', success: 'The speech is over.',
      intro: [sayAs('Director', 'helper', 'Dear staff and trainees, what you do is more than a job. It is a calling. It is also a rota. I will explain both.', 'calm')], done: [sayAs('Director', 'helper', 'And so, in conclusion. Which I have been approaching for some time. Thank you.', 'cheeky')], hint: 'Stand in the ring on the blue rug until the speech ends.' }),
    T('ch8.l9', 4, 'goto', 'Walk out of the main gate', { purpose: 'Your last walk of the week: through the gate, out into the evening.', objective: 'Walk out through the main gate', success: 'You are out.',
      intro: [say('folake', 'Come home, my child. I have food. I have a pillow. I have a very proud face.', 'happy')], done: [say('tunde', 'A whole week in a hospital and you are still smiling. Keep that.', 'proud')], hint: 'The gate is at the top right.' }),
  ],
  talks: { 0: [
    { id: 'chi', name: 'Nurse Chi', x: 4, z: -2, lines: [sayAs('Nurse Chi', 'neighbour', 'You were good. Do not let it go to your head. It is a very small head.', 'cheeky')], rounds: [{ options: [
      { id: 'thanks', label: '"Thank you for teaching me, Nurse Chi."', reply: sayAs('Nurse Chi', 'neighbour', 'Stop. You will make me emotional. I have a reputation.', 'happy') },
      { id: 'again', label: '"Can I shadow you again next month?"', reply: sayAs('Nurse Chi', 'neighbour', 'You can. If you bring biscuits. Digestives. Not the cheap ones.', 'cheeky') },
    ] }] },
    { id: 'musa', name: 'Dr Musa', x: 12, z: -2, lines: [sayAs('Dr Musa', 'helper', 'You asked a lot of questions this week. That is the best habit a person can have. Keep it.', 'calm')] },
    { id: 'ngozi', name: 'Matron Ngozi', x: 20, z: -2, lines: [sayAs('Matron Ngozi', 'neighbour', 'I told Matron of the other ward that I had a good trainee. She did not believe me. Come back and prove it.', 'happy')] },
  ] },
  items: [
    { id: 'tChi', task: 1, x: 9.4, z: -7.8, label: 'Take Nurse Chi\'s cake', color: '#e0457b', shape: 'cake', y: 1.1 },
    { id: 'tMusa', task: 1, x: 13.6, z: -7.8, label: 'Take Dr Musa\'s rice', color: RED, shape: 'plate', y: 1.1 },
    { id: 'tNgozi', task: 1, x: 17.8, z: -7.8, label: 'Take Matron\'s drink', color: BLUE, shape: 'cup', y: 1.1 },
  ],
  serves: { 1: { eatSecs: 3, from: 1, guests: [
    { id: 'chi', name: 'Nurse Chi', order: 'Cake', dish: 'tChi', x: 4, z: 6, seat: { x: 10, z: 4 }, table: { x: 10, z: 2.4 } },
    { id: 'musa', name: 'Dr Musa', order: 'Jollof', dish: 'tMusa', x: 8, z: 8, seat: { x: 14, z: 4 }, table: { x: 14, z: 2.4 } },
    { id: 'ngozi', name: 'Matron Ngozi', order: 'A cold drink', dish: 'tNgozi', x: 2, z: 8, seat: { x: 18, z: 4 }, table: { x: 18, z: 2.4 } },
  ] } },
  holds: { 2: { x: 30, z: 0, r: 1.0, secs: 7, pose: 'sit' } },
  goto: [null, null, null, RING(36, -2, 1.6)],
  guide: [{ x: 12, z: -2, r: 14 }, { x: 14, z: 2, r: 10 }, RING(30, 0, 1.0), RING(36, -2, 1.6)],
  crowd: [{ x: 26, z: 5, rot: -2 }, { x: 34, z: 4, rot: -2 }],
  npcs: { folake: { x: 38, z: 8, rot: -2.4 }, tunde: { x: 34, z: 9, rot: -2.4 } }, choiceLabel: 'farewell',
  endBeat: { text: 'The gate swings open onto a warm Lagos evening. Your feet ache, your scrubs smell of cake and you finally understand why people do this for a living.', line: 'Chapter 8 is done.' },
  starRules: ['Finish the level', 'Finish with no wrong plate', 'Finish with no mistakes and no hints'],
}), ride('the hospital', 'Ride to the hospital', 'The last day of your trainee week', [sayAs('Mama Folake', 'folake', 'Last day! Be kind, say thank you properly and bring home the leftover cake.', 'happy')], [say('helper', 'The driver is waving. He waved on day one. He waves on every last day.', 'happy')]))
void RED; void TEAL; void WHITE; void YELLOW
