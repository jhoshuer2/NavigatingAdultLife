// Chapter 7 "Campus Life": a first semester at university. A little green campus shuttle takes you between the quad, the hostel, the lecture hall, the
// library, the cafeteria and the exam hall. Each level is a different place with a different mix of tasks.
import type { Deco } from './schema'
import { L, T, R, F, say, sayAs, D, WOOD, DARK } from './chapter1b'
import { B, TREES, LAMPS, RING, GREEN } from './chapter1c'
import { withBus, type BusOpts } from './bus'

const ORANGE = '#e07a1f', YELLOW = '#f5b91c', RUST = '#c4562a', BLUE = '#2b6ad0', CREAM = '#f3e7cf', GRASS = '#cfdcb0'
const shuttle = (to: string, title: string, why: string, intro: BusOpts['intro'], done: BusOpts['done']): BusOpts => ({ vehicle: 'shuttle', to, title, purpose: `${why}: wait at the stop, board the shuttle and ride there.`, objective: `Take the shuttle to ${to}`, success: `You hop off at ${to}.`, intro, done })
const CAMPUS = (floor: string, extra: Deco[] = []): { floors: { x0: number; x1: number; z0: number; z1: number; color: string }[]; deco: Deco[] } => ({
  floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: floor }],
  deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: CREAM }, ...TREES([[-10, 9], [39, 9]]), ...LAMPS([[8, 6], [28, 6]]), ...extra],
})
const base = { spawn: { x: -9, z: 0 }, resume: { x: -6, z: 2 } }
const BIGB = R(-12, 40, -12.4, 12.4)
const desk = (x: number, color: string, label: string): Deco => ({ kind: 'stall', x, z: 7.4, w: 3.4, d: 1.6, color, label })

// ---------------------------------------------------------------------------------------------------------------- Level 1
const sci = B('science', -8, -1, -12, -7, '#c9d9e8', 'SCIENCE BLOCK', 3.6), hall = B('lechall', 10, 20, -12, -7, '#e8d9c9', 'LECTURE HALL', 3.8), arts = B('arts', 28, 36, -12, -7, '#f0d9a8', 'ARTS BLOCK', 3.4)
export const LEVEL_C7L1 = withBus(L({
  ch: 'ch7', n: 1, title: 'Orientation Day', next: 'ch7.l2', bounds: BIGB,
  intro: 'A hundred strangers, one quad and a lanyard that does not stay on. Orientation week is mostly smiling at people and pretending you know where the toilets are.',
  theme: { ground: '#bfb393', ...CAMPUS(GRASS, [...sci.d, ...hall.d, ...arts.d, desk(8, ORANGE, 'ID CARDS'), desk(18, BLUE, 'TIMETABLES'), desk(28, GREEN, 'MAPS'), { kind: 'rug', x: 18, z: 0, w: 28, d: 2, color: '#e0d6b8' }]) },
  furniture: [sci.f, hall.f, arts.f, F('d1', R(6.3, 9.7, 6.6, 8.2), 1.0, WOOD), F('d2', R(16.3, 19.7, 6.6, 8.2), 1.0, WOOD), F('d3', R(26.3, 29.7, 6.6, 8.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch7.l1', 1, 'talk', 'Meet three new people', { purpose: 'Orientation is for meeting people. Say hello to three of them and see who you click with.', objective: 'Talk to Ife, Dayo and Kemi', success: 'You have met them all.',
      intro: [say('helper', 'Everybody here is as nervous as you are. Some of them hide it by talking a lot.', 'cheeky')], done: [say('player', 'Ife, Dayo and Kemi. I will remember at least one of those names.', 'laughing')], hint: 'Ife, Dayo and Kemi stand on the quad near the paths.' }),
    T('ch7.l1', 2, 'find', 'Find the lecture hall', { purpose: 'Three big buildings, three confident signs. Only one is where the welcome talk is.', objective: 'Find the lecture hall', success: 'You find it.',
      intro: [say('player', 'Science, Lecture, Arts. The Lecture one sounds right. Unless it is a trick.', 'thinking')], done: [say('player', 'The Lecture Hall. Not a trick. Today.', 'happy')], hint: 'The LECTURE HALL is the middle building at the top.' }),
    T('ch7.l1', 3, 'collect', 'Collect your starter pack', { purpose: 'Three desks along the bottom: ID card, timetable and campus map.', objective: 'Collect an ID, a timetable and a map', success: 'Your pack is complete.',
      intro: [sayAs('Registry Clerk', 'neighbour', 'ID at the first desk, timetable at the second, map at the third. Do not mix the order. I have seen what happens.', 'calm')], done: [say('player', 'ID, timetable, map. I am officially a student. Please do not check.', 'proud')], hint: 'Follow the three desks along the bottom: ID CARDS, TIMETABLES and MAPS.' }),
    T('ch7.l1', 4, 'choose', 'Join a society', { purpose: 'A table for every kind of person: drama, football and coding. Pick one for the semester.', objective: 'Choose a society', success: 'You choose.',
      intro: [say('helper', 'The drama people sing at you. The football people kick at you. The coding people say "it compiles" at you.', 'cheeky')], done: [say('player', 'Decision made. May I never regret the t-shirt.', 'worried')], hint: 'Three signs on the path: drama, football or coding.' }),
  ],
  talks: { 0: [
    { id: 'ife', name: 'Ife', x: 4, z: -3, lines: [sayAs('Ife', 'neighbour', 'Hi! I am Ife. I am your roommate. I snore, but only slightly.', 'cheeky')], rounds: [{ options: [
      { id: 'hi', label: '"Hi Ife! I am glad it is you."', reply: sayAs('Ife', 'neighbour', 'Same! I was hoping for someone who does not snore. Do you?', 'happy') },
      { id: 'nervous', label: '"I am a bit nervous, honestly."', reply: sayAs('Ife', 'neighbour', 'Me too. We can be nervous together. Efficient.', 'happy') },
    ] }] },
    { id: 'dayo', name: 'Dayo', x: 16, z: -3, lines: [sayAs('Dayo', 'helper', 'Engineering? Me too! Do you know where we sit? Neither do I. We can be lost together.', 'cheeky')] },
    { id: 'kemi', name: 'Kemi', x: 26, z: -3, lines: [sayAs('Kemi', 'neighbour', 'I am in the same course. I read the whole timetable. It makes no sense. We can fix it together.', 'curious')] },
  ] },
  spots: [
    { id: 'sci', task: 1, x: -4.5, z: -5.4, label: 'Check the science block', wrong: say('helper', 'A lot of glass and a man in a very long coat. Not this one.', 'cheeky') },
    { id: 'hall', task: 1, x: 15, z: -5.4, label: 'Check the lecture hall', right: true },
    { id: 'arts', task: 1, x: 32, z: -5.4, label: 'Check the arts block', wrong: say('player', 'Somebody is playing a violin very badly. Not this one.', 'tired') },
  ],
  items: [
    { id: 'idc', task: 2, x: 8, z: 7.2, label: 'Take your ID card', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'grab' },
    { id: 'tt', task: 2, x: 18, z: 7.2, label: 'Take your timetable', color: '#fbf8f0', shape: 'folder', y: 1.05, act: 'grab' },
    { id: 'map', task: 2, x: 28, z: 7.2, label: 'Take a campus map', color: '#9ecbe6', shape: 'paper', y: 1.05, act: 'grab' },
    { id: 'drama', task: 3, x: 6, z: 2, label: 'Join the drama society', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'football', task: 3, x: 18, z: 2.4, label: 'Join the football society', color: GREEN, shape: 'sign', y: 0 },
    { id: 'coding', task: 3, x: 30, z: 2, label: 'Join the coding society', color: BLUE, shape: 'sign', y: 0 },
  ],
  guide: [{ x: 16, z: -3, r: 14 }, { x: 15, z: -5.4, r: 8 }, { x: 18, z: 6, r: 12 }, { x: 18, z: 2, r: 12 }],
  crowd: [{ x: 10, z: 4, rot: 1 }, { x: 24, z: 4, rot: -2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }, choiceLabel: 'society',
  endBeat: { text: 'By the end of the day you have an ID card, a map you do not understand and eight new friends whose names you will forget by Friday.', line: 'The hostel is next.' },
  starRules: ['Finish the level', 'Finish with no wrong buildings', 'Finish with no mistakes and no hints'],
}), shuttle('the quad', 'Shuttle to campus', 'Your first day at university', [sayAs('Mama Folake', 'folake', 'University! My child! Take the shuttle, smile at everyone and do not lose your ID card on the first day. I know you.', 'happy')], [say('helper', 'The shuttle goes everywhere. Slowly. Like a very polite snail.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 2
const hostel = B('hostel', 6, 26, -12, -7, '#e8c9a0', 'HOSTEL BLOCK B', 3.8)
export const LEVEL_C7L2 = withBus(L({
  ch: 'ch7', n: 2, title: 'Hostel Life', next: 'ch7.l3', bounds: BIGB,
  intro: 'Room 14: two beds, one window, one desk and a smell that says previous occupant. Today you turn it into a room that says you.',
  theme: { ground: '#bfb393', floors: [{ x0: -12, x1: 6, z0: -12, z1: 12, color: GRASS }, { x0: 6, x1: 40, z0: -12, z1: 12, color: '#d8b98a' }], deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.2, color: CREAM }, ...hostel.d, { kind: 'sign', x: 8, z: 3, label: 'ROOM 14', w: 1.4 }, { kind: 'rug', x: 28, z: 2, w: 8, d: 4, color: BLUE }, { kind: 'chair', x: 26, z: 1, color: WOOD }, { kind: 'chair', x: 30, z: 1, color: WOOD }, { kind: 'chair', x: 34, z: 1, color: WOOD }, ...TREES([[-10, 9], [39, 9]])] },
  furniture: [hostel.f, F('beds', R(14, 20, -6, -3), 0.7, '#6b3a1e'), F('shelf', R(22, 25, -6.4, -5.4), 1.9, DARK), F('kettle', R(28, 33, 6, 7.2), 0.9, WOOD)], ...base,
  tasks: [
    T('ch7.l2', 1, 'goto', 'Find room 14', { purpose: 'Walk down the corridor and find your door.', objective: 'Walk to room 14', success: 'You reach your room.',
      intro: [sayAs('Ife', 'neighbour', 'Fourteen! It is on the left. Or right. It is definitely one of the two.', 'cheeky')], done: [sayAs('Ife', 'neighbour', 'Ta-da. Our palace. Mind the damp patch. It is shaped like Africa.', 'cheeky')], hint: 'Follow the ring to the door marked ROOM 14.' }),
    T('ch7.l2', 2, 'sequence', 'Make the room yours', { purpose: 'Sheets on the bed first, then books on the shelf, then a poster on the wall.', objective: 'Sheets, books, then poster', success: 'The room looks like yours.',
      intro: [say('player', 'Sheets. Books. Poster. In that order. Or the poster falls on my head.', 'thinking')], done: [say('player', 'It looks like a room. A room with a very confident poster.', 'proud')], hint: 'Order: sheets on the bed, books on the shelf, poster at the top.' }),
    T('ch7.l2', 3, 'serve', 'Tea for the corridor', { purpose: 'Your neighbours drop in. Seat them on the stools and bring each a cup.', objective: 'Seat and serve three visitors', success: 'Everyone has tea.',
      intro: [sayAs('Ife', 'neighbour', 'People are coming. Three of them. They are hungry and homesick. Tea fixes both.', 'happy')], done: [sayAs('Dayo', 'helper', 'Best tea on the corridor. Also the only tea on the corridor.', 'cheeky')], hint: 'Seat each visitor, take their cup from the kettle table and carry it over.' }),
    T('ch7.l2', 4, 'hold', 'Sit and breathe', { purpose: 'Sit at your desk, look out of the window and let it sink in.', objective: 'Sit at your desk and look out', success: 'You are rested.',
      intro: [say('player', 'My room. My window. My damp patch. All mine.', 'happy')], done: [say('player', 'I am a student. I live here. Somebody pinch me. Not hard.', 'laughing')], hint: 'Stand in the ring at the desk until you are rested.' }),
  ],
  items: [
    { id: 'sheets', task: 1, x: 15, z: -2.4, label: 'Spread the sheets', color: '#fbf8f0', shape: 'blanket', y: 0.85, act: 'wipe' },
    { id: 'books', task: 1, x: 23.5, z: -5.9, label: 'Put the books on the shelf', color: BLUE, shape: 'folder', y: 1.7, act: 'reachHigh' },
    { id: 'poster', task: 1, x: 18, z: -6.5, label: 'Pin up the poster', color: ORANGE, shape: 'paper', y: 1.6, act: 'reachHigh' },
    { id: 'cIfe', task: 2, x: 29, z: 5.6, label: 'Take Ife\'s tea', color: ORANGE, shape: 'cup', y: 1.0 },
    { id: 'cDayo', task: 2, x: 30.5, z: 5.6, label: 'Take Dayo\'s tea', color: GREEN, shape: 'cup', y: 1.0 },
    { id: 'cKemi', task: 2, x: 32, z: 5.6, label: 'Take Kemi\'s tea', color: YELLOW, shape: 'cup', y: 1.0 },
  ],
  sequences: { 1: ['sheets', 'books', 'poster'] },
  serves: { 2: { eatSecs: 3, from: 2, guests: [
    { id: 'ife', name: 'Ife', order: 'Tea with sugar', dish: 'cIfe', x: 10, z: 6, seat: { x: 26, z: 1 }, table: { x: 26, z: 2.6 } },
    { id: 'dayo', name: 'Dayo', order: 'Strong tea', dish: 'cDayo', x: 8, z: 8, seat: { x: 30, z: 1 }, table: { x: 30, z: 2.6 } },
    { id: 'kemi', name: 'Kemi', order: 'Tea, no sugar', dish: 'cKemi', x: 12, z: 9, seat: { x: 34, z: 1 }, table: { x: 34, z: 2.6 } },
  ] } },
  holds: { 3: { x: 10, z: 4, r: 1.2, secs: 6, pose: 'sit' } },
  goto: [RING(8, 4, 1.5), null, null, null],
  guide: [RING(8, 4, 1.5), { x: 19, z: -4, r: 8 }, { x: 30, z: 4, r: 10 }, RING(10, 4, 1.2)],
  crowd: [{ x: 4, z: 6, rot: 1 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }, choiceLabel: 'room',
  endBeat: { text: 'The lights go off in the corridor, one door at a time. Behind the walls somebody is laughing and somebody is on a very long phone call to a mother.', line: 'The first lecture is tomorrow.' },
  starRules: ['Finish the level', 'Finish with no wrong order', 'Finish with no mistakes and no hints'],
}), shuttle('the hostel', 'Shuttle to the hostel', 'Move-in day', [sayAs('Mama Folake', 'folake', 'Take the shuttle to the hostel and unpack properly. Do not live out of a suitcase for three weeks. I know your habits.', 'worried')], [sayAs('Ife', 'neighbour', 'Welcome home! Well. Welcome to the hostel. Close enough.', 'happy')]))

// ---------------------------------------------------------------------------------------------------------------- Level 3
export const LEVEL_C7L3 = withBus(L({
  ch: 'ch7', n: 3, title: 'The First Lecture', next: 'ch7.l4', bounds: BIGB,
  intro: 'Two hundred seats, one microphone and a lecturer who has forgotten that anyone is nervous. Find a seat, listen hard and do not fall asleep. It is nine o\'clock.',
  theme: { ground: '#bfb393', floors: [{ x0: -12, x1: 40, z0: -12, z1: 12, color: '#e0d2b2' }], deco: [{ kind: 'wall', x: 14, z: -13.4, w: 78, d: 2, h: 3.4, color: '#d9b98a' }, { kind: 'sign', x: 20, z: -6, label: 'BOARD', w: 1.6 }, { kind: 'rug', x: 20, z: 1.6, w: 10, d: 3, color: BLUE }, { kind: 'chair', x: 20, z: 1.6, color: DARK }, ...TREES([[-10, 9]]), ...LAMPS([[8, 6]])] },
  furniture: [F('b1', R(10, 14, 4.4, 5.6), 0.7, DARK), F('b2', R(26, 30, 4.4, 5.6), 0.7, DARK), F('notes', R(14, 26, 8, 9.2), 0.9, WOOD), F('podium', R(18, 22, -5, -3.6), 1.1, DARK)], ...base,
  tasks: [
    T('ch7.l3', 1, 'find', 'Find a seat', { purpose: 'The hall fills up fast. Three empty seats: the front (too keen), the back (too sleepy) and the one that is actually free.', objective: 'Find the free seat', success: 'You find your seat.',
      intro: [sayAs('Kemi', 'neighbour', 'Quick! The good ones go first. The bad ones go second. The worst ones are already taken by someone\'s bag.', 'worried')], done: [say('player', 'In the middle. Not too keen, not too sleepy. Goldilocks would be proud.', 'happy')], hint: 'Check the left bench, the right bench and the empty seat in the middle row.' }),
    T('ch7.l3', 2, 'hold', 'Sit and listen', { purpose: 'Sit still and look attentive while the lecture begins.', objective: 'Sit and listen to the lecture', success: 'The lecture has started.',
      intro: [sayAs('Dr Bello', 'helper', 'Good morning, class. Today we begin with a very simple idea. It is not simple. Please sit up.', 'calm')], done: [sayAs('Dr Bello', 'helper', 'Now. Questions? No? Good. Everybody has questions. They are afraid.', 'cheeky')], hint: 'Stand in the ring on the blue rug until the count is full.' }),
    T('ch7.l3', 3, 'talk', 'Answer the question', { purpose: 'Dr Bello picks you. All eyes on you. Be brave.', objective: 'Talk to Dr Bello', success: 'You have answered.',
      intro: [say('player', 'He is looking at me. Why is he looking at me? Do not look back. Do look back.', 'worried')], done: [sayAs('Dr Bello', 'helper', 'Good. Wrong, but good. The effort is the point.', 'happy')], hint: 'Dr Bello stands at the podium at the front.' }),
    T('ch7.l3', 4, 'sequence', 'Take notes', { purpose: 'Write the title, the definition and the example in order, before the slide changes.', objective: 'Title, definition, then example', success: 'Your notes are done.',
      intro: [sayAs('Dr Bello', 'helper', 'Write this down. Title. Definition. Example. In that order. The slide will change in a moment. You will not like it.', 'calm')], done: [say('player', 'Three lines. I may even be able to read them tomorrow.', 'proud')], hint: 'Order at the notes desk: title, definition, example.' }),
  ],
  spots: [
    { id: 'left', task: 0, x: 12, z: 3.6, label: 'Check the left bench', wrong: say('player', 'A bag, a hoodie and a half-eaten sandwich. Taken.', 'tired') },
    { id: 'mid', task: 0, x: 20, z: 3.4, label: 'Check the middle row', right: true },
    { id: 'right', task: 0, x: 28, z: 3.6, label: 'Check the right bench', wrong: say('helper', 'A lot of snoring. Taken, in a way.', 'cheeky') },
  ],
  talks: { 2: [{ id: 'bello', name: 'Dr Bello', x: 20, z: -2.2, lines: [sayAs('Dr Bello', 'helper', 'You, in the middle. Name? Good. Tell me: why do things fall down and not up?', 'curious')], rounds: [{ options: [
    { id: 'gravity', label: '"Gravity, sir."', reply: sayAs('Dr Bello', 'helper', 'And what is gravity? No, do not answer. It was a trap. A friendly trap.', 'cheeky') },
    { id: 'mass', label: '"Because the Earth is heavier than us?"', reply: sayAs('Dr Bello', 'helper', 'Close! Closer than most. Sit down. You may be a scientist.', 'happy') },
    { id: 'unsure', label: '"I am not sure, sir."', reply: sayAs('Dr Bello', 'helper', 'Honesty. The beginning of science. Sit down, you are fine.', 'calm') },
  ] }] }] },
  items: [
    { id: 'title', task: 3, x: 16, z: 8.6, label: 'Write the title', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'typing' },
    { id: 'def', task: 3, x: 20, z: 8.6, label: 'Write the definition', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'typing' },
    { id: 'ex', task: 3, x: 24, z: 8.6, label: 'Write the example', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'typing' },
  ],
  sequences: { 3: ['title', 'def', 'ex'] },
  holds: { 1: { x: 20, z: 1.6, r: 1.0, secs: 6, pose: 'raiseHand' } },
  guide: [{ x: 20, z: 3.4, r: 10 }, RING(20, 1.6, 1.0), { x: 20, z: -2.2, r: 4 }, { x: 20, z: 7, r: 8 }],
  crowd: [{ x: 6, z: 4, rot: 0 }, { x: 34, z: 2, rot: 3 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }, choiceLabel: 'answer',
  endBeat: { text: 'The bell rings and two hundred people stand up at the same time. You have three pages of notes you cannot read and one new belief: this is what learning feels like.', line: 'The library is next.' },
  starRules: ['Finish the level', 'Finish with no wrong seats', 'Finish with no mistakes and no hints'],
}), shuttle('the lecture hall', 'Shuttle to lectures', 'Nine o\'clock is early', [sayAs('Mama Folake', 'folake', 'First lecture! Take the shuttle, sit in the middle and do not fall asleep. Do not even blink.', 'worried')], [sayAs('Kemi', 'neighbour', 'You made it! Only fifteen minutes late. We say "on time" in this country.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 4
const lib = B('library', 6, 34, -12, -7, '#c9d9e8', 'LIBRARY', 4.0)
export const LEVEL_C7L4 = withBus(L({
  ch: 'ch7', n: 4, title: 'Library Hunt', next: 'ch7.l5', bounds: BIGB,
  intro: 'The library has six floors, four thousand shelves and one librarian who looks at you like she knows what you are about to ask.',
  theme: { ground: '#bfb393', ...CAMPUS('#e0d2b2', [...lib.d, { kind: 'rug', x: 20, z: 3, w: 12, d: 3, color: BLUE }, { kind: 'sign', x: 37, z: 2, label: 'ENTRANCE', w: 1.6 }]) },
  furniture: [lib.f, F('s1', R(10, 14, -4, -2.8), 1.6, DARK), F('s2', R(18, 22, -4, -2.8), 1.6, DARK), F('s3', R(26, 30, -4, -2.8), 1.6, DARK), F('copier', R(12, 28, 7.8, 9.2), 1.0, '#6a8ab8')], ...base,
  tasks: [
    T('ch7.l4', 1, 'find', 'Find the book', { purpose: 'The book is on one of three shelves. The catalogue number says "somewhere".', objective: 'Find the textbook', success: 'You find the book.',
      intro: [sayAs('Mrs Adeyemi', 'neighbour', 'It is there somewhere. All books are somewhere. The question is whether it is where the catalogue says.', 'cheeky')], done: [say('player', 'It was on the wrong shelf. Of course it was on the wrong shelf.', 'tired')], hint: 'Check the three shelves in the middle: left, middle and right.' }),
    T('ch7.l4', 2, 'collect', 'Photocopy on a budget', { purpose: 'You have ₦300 for photocopies. The whole book costs far more. Three chapters it is.', objective: 'Copy 3 chapters within ₦300', success: 'Three chapters are copied.',
      intro: [say('helper', 'A hundred naira a chapter. The whole book is six hundred. Choose wisely. Copy sensibly.', 'cheeky')], done: [say('player', 'Three chapters. The rest I will memorise. Or borrow.', 'laughing')], hint: 'Pick three chapter copies. The whole-book copy costs too much. Start over if you overspend.' }),
    T('ch7.l4', 3, 'reach', 'Beat the closing bell', { purpose: 'The library closes in a minute and you still have to check the book out. Cross the crowded floor.', objective: 'Get to the entrance before it closes', success: 'You reach the entrance in time.',
      intro: [sayAs('Mrs Adeyemi', 'neighbour', 'The library is closing! Closing! The bell is about to ring! I do not enjoy the bell either!', 'angry')], done: [say('player', 'Out. With the book. With a feeling of mild heroism.', 'laughing')], hint: 'Cross behind the students and run right to the ENTRANCE.' }),
    T('ch7.l4', 4, 'talk', 'Check it out', { purpose: 'Hand the book to the librarian and answer her questions about it.', objective: 'Talk to Mrs Adeyemi', success: 'The book is checked out.',
      intro: [say('player', 'Be polite. Be quick. Do not say "um" in the library. It echoes.', 'worried')], done: [sayAs('Mrs Adeyemi', 'neighbour', 'Two weeks. Not three. Not "I forgot". Two.', 'angry')], hint: 'Mrs Adeyemi stands near the entrance on the right.' }),
  ],
  spots: [
    { id: 's1', task: 0, x: 12, z: -1.8, label: 'Check the left shelf', wrong: say('player', 'Maths. Maths. More maths. Not the right kind.', 'tired') },
    { id: 's2', task: 0, x: 20, z: -1.8, label: 'Check the middle shelf', wrong: say('helper', 'Poetry. Beautiful poetry. Not helpful poetry.', 'cheeky') },
    { id: 's3', task: 0, x: 28, z: -1.8, label: 'Check the right shelf', right: true },
  ],
  items: [
    { id: 'ch1', task: 1, price: 100, x: 14, z: 7.4, label: 'Copy chapter 1 (₦100)', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'stamp' },
    { id: 'ch2', task: 1, price: 100, x: 18, z: 7.4, label: 'Copy chapter 2 (₦100)', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'stamp' },
    { id: 'ch3', task: 1, price: 100, x: 22, z: 7.4, label: 'Copy chapter 3 (₦100)', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'stamp' },
    { id: 'whole', task: 1, price: 600, x: 26, z: 7.4, label: 'Copy the whole book (₦600)', color: '#e0d6b8', shape: 'folder', y: 1.05, act: 'stamp' },
  ],
  budgets: { 1: { budget: 300, need: 3 } },
  talks: { 3: [{ id: 'adeyemi', name: 'Mrs Adeyemi', x: 33, z: -4, lines: [sayAs('Mrs Adeyemi', 'neighbour', 'Student card? Good. This is a very heavy book. Are you sure you want it? Are you sure?', 'suspicious')], rounds: [{ options: [
    { id: 'sure', label: '"Yes, I am sure. I will return it on time."', reply: sayAs('Mrs Adeyemi', 'neighbour', 'They all say that. A few mean it. I will write your name down.', 'cheeky') },
    { id: 'ask', label: '"Can I renew it if I need more time?"', reply: sayAs('Mrs Adeyemi', 'neighbour', 'Once. Twice if you bring me a biscuit. A good biscuit.', 'happy') },
  ] }] }] },
  goto: [null, null, RING(36, 4, 1.6), null],
  guide: [{ x: 20, z: -1.8, r: 10 }, { x: 20, z: 7, r: 10 }, RING(36, 4, 1.6), { x: 33, z: -4, r: 4 }],
  hazards: [D('walker', 12, -2, 7, 2.8, 0, GREEN), D('walker', 18, -2, 7, 2.6, 1.2, ORANGE), D('walker', 24, -2, 7, 3.0, 0.6, RUST), D('walker', 30, -2, 7, 2.4, 0.2)],
  timeLimit: 20,
  crowd: [{ x: 6, z: 2, rot: 1 }, { x: 24, z: 4.5, rot: 3 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }, choiceLabel: 'book',
  endBeat: { text: 'You leave the library with a book you only half understand and a feeling that you have joined a very old club.', line: 'A group project is on the way.' },
  starRules: ['Finish the level', 'Reach the entrance before the timer ends', 'Be on time with two or fewer slips'],
}), shuttle('the library', 'Shuttle to the library', 'The library closes early on Fridays', [sayAs('Mama Folake', 'folake', 'The library! The place where grown people whisper at each other. Take the shuttle and borrow the book properly.', 'happy')], [sayAs('Mrs Adeyemi', 'neighbour', 'Shhh. We do not shout in here. We also do not whisper too loudly.', 'angry')]))

// ---------------------------------------------------------------------------------------------------------------- Level 5
const centre = B('centre', 4, 24, -12, -7, '#f0d9a8', 'STUDENT CENTRE', 3.6), labB = B('lab', 28, 38, -12, -7, '#c9d9e8', 'COMPUTER LAB', 3.6)
export const LEVEL_C7L5 = withBus(L({
  ch: 'ch7', n: 5, title: 'Group Project', next: 'ch7.l6', bounds: BIGB,
  intro: 'A presentation in three days, three people who have never met properly and one shared document that nobody has opened. Group projects are team sports with no referee.',
  theme: { ground: '#bfb393', ...CAMPUS('#e0d2b2', [...centre.d, ...labB.d, { kind: 'rug', x: 14, z: 3, w: 12, d: 4, color: GREEN }, { kind: 'sign', x: 34, z: 2, label: 'LAB', w: 1.2 }]) },
  furniture: [centre.f, labB.f, F('table', R(8, 20, 4.4, 5.6), 0.8, WOOD), F('pc', R(8, 20, -3, -1.8), 0.9, '#6a8ab8')], ...base,
  tasks: [
    T('ch7.l5', 1, 'talk', 'Meet your team', { purpose: 'Three people, three ideas, one deadline. Hear them out.', objective: 'Talk to Dayo, Kemi and Ife', success: 'You know what everyone wants.',
      intro: [say('helper', 'The first group meeting is always the same: nobody says anything, then everybody says everything.', 'cheeky')], done: [say('player', 'Dayo wants charts, Kemi wants words and Ife wants pizza. We have a plan. Sort of.', 'laughing')], hint: 'Dayo, Kemi and Ife are standing round the table in the middle.' }),
    T('ch7.l5', 2, 'sequence', 'Build the slides', { purpose: 'Slides in order: title, data, chart, thank-you. Each one at the shared computer.', objective: 'Title, data, chart, then thanks', success: 'The deck is done.',
      intro: [sayAs('Kemi', 'neighbour', 'Title. Data. Chart. Thanks. If the thank-you slide comes first they will think we are leaving.', 'cheeky')], done: [sayAs('Dayo', 'helper', 'It looks like a presentation. It sounds like a presentation. I am scared.', 'happy')], hint: 'Order at the computers: title, data, chart, thanks.' }),
    T('ch7.l5', 3, 'choose', 'Split the work', { purpose: 'Someone presents, someone does the research, someone makes it pretty. Pick your role.', objective: 'Choose your role', success: 'You choose.',
      intro: [sayAs('Ife', 'neighbour', 'Who does what? I will do the pizza. That is a role. It is a vital role.', 'cheeky')], done: [say('player', 'Role chosen. May I be better at it than I expect.', 'worried')], hint: 'Three signs on the rug: present, research or design.' }),
    T('ch7.l5', 4, 'reach', 'Run to the lab', { purpose: 'The lab is booked for ten minutes and the printer queue is long. Cross the campus.', objective: 'Run to the lab before the booking ends', success: 'You reach the lab in time.',
      intro: [sayAs('Dayo', 'helper', 'The lab! We booked it! We have eight minutes! Go! I will bring the pizza!', 'worried')], done: [say('player', 'In the lab. With the USB. With seconds to spare. And no pizza.', 'laughing')], hint: 'Cross behind the students and run right to the LAB sign.' }),
  ],
  talks: { 0: [
    { id: 'dayo', name: 'Dayo', x: 9, z: 2, lines: [sayAs('Dayo', 'helper', 'Charts! We need charts. Big, colourful, confusing charts. Judges love confusing charts.', 'cheeky')], rounds: [{ options: [
      { id: 'agree', label: '"Charts sound great."', reply: sayAs('Dayo', 'helper', 'A person of taste. We will be friends.', 'happy') },
      { id: 'simple', label: '"Maybe one simple chart?"', reply: sayAs('Dayo', 'helper', 'One. Simple. Hmm. Brave. I will think about it.', 'suspicious') },
    ] }] },
    { id: 'kemi', name: 'Kemi', x: 14, z: 2, lines: [sayAs('Kemi', 'neighbour', 'Words. A good argument beats a chart. Nobody has ever cried at a chart.', 'calm')] },
    { id: 'ife', name: 'Ife', x: 19, z: 2, lines: [sayAs('Ife', 'neighbour', 'I have snacks. And a laptop with a charger. And a very hopeful face.', 'happy')] },
  ] },
  items: [
    { id: 'sTitle', task: 1, x: 10, z: -2.4, label: 'Make the title slide', color: '#9ecbe6', shape: 'paper', y: 1.0, act: 'typing' },
    { id: 'sData', task: 1, x: 13, z: -2.4, label: 'Add the data slide', color: '#9ecbe6', shape: 'paper', y: 1.0, act: 'typing' },
    { id: 'sChart', task: 1, x: 16, z: -2.4, label: 'Add the chart slide', color: '#9ecbe6', shape: 'paper', y: 1.0, act: 'typing' },
    { id: 'sThanks', task: 1, x: 19, z: -2.4, label: 'Add the thank-you slide', color: '#9ecbe6', shape: 'paper', y: 1.0, act: 'typing' },
    { id: 'present', task: 2, x: 8, z: 7.6, label: 'Take the presenting role', color: ORANGE, shape: 'sign', y: 0 },
    { id: 'research', task: 2, x: 14, z: 7.6, label: 'Take the research role', color: GREEN, shape: 'sign', y: 0 },
    { id: 'design', task: 2, x: 20, z: 7.6, label: 'Take the design role', color: BLUE, shape: 'sign', y: 0 },
  ],
  sequences: { 1: ['sTitle', 'sData', 'sChart', 'sThanks'] },
  goto: [null, null, null, RING(34, 4, 1.6)],
  guide: [{ x: 14, z: 2, r: 8 }, { x: 14, z: -1.4, r: 8 }, { x: 14, z: 7.6, r: 8 }, RING(34, 4, 1.6)],
  hazards: [D('walker', 24, -2, 8, 2.8, 0, GREEN), D('walker', 28, -2, 8, 3.0, 1.2, ORANGE), D('walker', 32, -2, 8, 2.6, 0.6, RUST)],
  timeLimit: 16,
  crowd: [{ x: 26, z: 6, rot: -2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }, choiceLabel: 'role',
  endBeat: { text: 'The presentation goes well. Mostly. The chart is confusing. The judges nod anyway. You decide never to admit it was an accident.', line: 'Lunch time.' },
  starRules: ['Finish the level', 'Reach the lab before the timer ends', 'Be on time with two or fewer slips'],
}), shuttle('the student centre', 'Shuttle to the student centre', 'The group is meeting', [sayAs('Mama Folake', 'folake', 'A group project! The only exam where somebody else gets your mark. Take the shuttle and be nice to everyone.', 'worried')], [sayAs('Kemi', 'neighbour', 'You are here! Good. We have been staring at a blank document for two hours.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 6
export const LEVEL_C7L6 = withBus(L({
  ch: 'ch7', n: 6, title: 'Cafeteria Rush', next: 'ch7.l7', bounds: BIGB,
  intro: 'One o\'clock and the whole campus is hungry. The cafeteria has one queue, one very busy lady and one rule: do not stand in the middle looking at the menu.',
  theme: { ground: '#bfb393', ...CAMPUS('#e8d9b8', [{ kind: 'stall', x: 10, z: -9, w: 3.4, d: 1.6, color: ORANGE, label: 'RICE' }, { kind: 'stall', x: 18, z: -9, w: 3.4, d: 1.6, color: RUST, label: 'STEW' }, { kind: 'stall', x: 26, z: -9, w: 3.4, d: 1.6, color: GREEN, label: 'SIDES' }, { kind: 'stall', x: 34, z: -9, w: 3.4, d: 1.6, color: BLUE, label: 'DRINKS' }, { kind: 'chair', x: 12, z: 3, color: WOOD }, { kind: 'chair', x: 18, z: 3, color: WOOD }, { kind: 'chair', x: 24, z: 3, color: WOOD }, { kind: 'rug', x: 18, z: 1, w: 18, d: 2, color: '#e0d6b8' }, { kind: 'sign', x: 36, z: 3, label: 'QUAD', w: 1.4 }]) },
  furniture: [F('c1', R(8.3, 11.7, -9.8, -8.2), 1.0, WOOD), F('c2', R(16.3, 19.7, -9.8, -8.2), 1.0, WOOD), F('c3', R(24.3, 27.7, -9.8, -8.2), 1.0, WOOD), F('c4', R(32.3, 35.7, -9.8, -8.2), 1.0, WOOD), F('tables', R(10, 26, 4.4, 5.6), 0.8, WOOD)], ...base,
  tasks: [
    T('ch7.l6', 1, 'collect', 'Buy your lunch', { purpose: 'Rice, stew, a side and a drink from four stands. You have ₦1100.', objective: 'Buy 3 things within ₦1100', success: 'Your tray has three things.',
      intro: [sayAs('Mama Put', 'neighbour', 'Rice, stew, sides, drinks. Hurry, I have forty more behind you. They are hungry. They are staring.', 'cheeky')], done: [say('player', 'Rice, stew and a drink. A balanced diet, spiritually.', 'happy')], hint: 'Pick the cheaper items. Start over if you overspend.' }),
    T('ch7.l6', 2, 'serve', 'Look after your friends', { purpose: 'Your friends find a table. Seat them and bring each their plate.', objective: 'Seat and serve three friends', success: 'Everyone is eating.',
      intro: [sayAs('Ife', 'neighbour', 'If you bring me food I will love you forever. If you bring me food that is hot I will love you longer.', 'cheeky')], done: [sayAs('Dayo', 'helper', 'Perfect. I feel looked after. I am never leaving this table.', 'happy')], hint: 'Seat each friend, take their plate from the counter and carry it over.' }),
    T('ch7.l6', 3, 'choose', 'Pick a table', { purpose: 'Window seats are lovely but loud. The corner is quiet but far. The middle has everyone.', objective: 'Choose where to sit', success: 'You choose.',
      intro: [say('helper', 'Where do we sit? By the window? In the corner? Or in the middle with the whole campus?', 'cheeky')], done: [say('player', 'Decision made. May the chair be comfortable.', 'happy')], hint: 'Three signs on the rug: window, corner or middle.' }),
    T('ch7.l6', 4, 'goto', 'Walk back to the quad', { purpose: 'Lunch is over. The quad is calling. So is the next lecture.', objective: 'Walk to the quad', success: 'You reach the quad.',
      intro: [say('player', 'Full stomach, heavy eyelids, an afternoon lecture. This is how heroes are made.', 'tired')], done: [say('player', 'The quad. The grass. The brief fantasy of a nap.', 'happy')], hint: 'Follow the ring to the QUAD sign.' }),
  ],
  items: [
    { id: 'rice', task: 0, price: 500, x: 10, z: -8.6, label: 'Buy rice (₦500)', color: '#fbf8f0', shape: 'plate', y: 1.05, act: 'grab' },
    { id: 'stew', task: 0, price: 600, x: 18, z: -8.6, label: 'Buy stew (₦600)', color: '#d62828', shape: 'plate', y: 1.05, act: 'grab' },
    { id: 'plantain', task: 0, price: 300, x: 26, z: -8.6, label: 'Buy plantain (₦300)', color: YELLOW, shape: 'plate', y: 1.05, act: 'grab' },
    { id: 'drink', task: 0, price: 200, x: 34, z: -8.6, label: 'Buy a drink (₦200)', color: BLUE, shape: 'cup', y: 1.05, act: 'grab' },
    { id: 'pI', task: 1, x: 10.4, z: -7.8, label: 'Take Ife\'s plate', color: RUST, shape: 'plate', y: 1.05 },
    { id: 'pD', task: 1, x: 12, z: -7.8, label: 'Take Dayo\'s plate', color: ORANGE, shape: 'plate', y: 1.05 },
    { id: 'pK', task: 1, x: 17.4, z: -7.8, label: 'Take Kemi\'s plate', color: GREEN, shape: 'plate', y: 1.05 },
    { id: 'window', task: 2, x: 8, z: 7.6, label: 'Sit by the window', color: BLUE, shape: 'sign', y: 0 },
    { id: 'corner', task: 2, x: 18, z: 7.6, label: 'Sit in the quiet corner', color: GREEN, shape: 'sign', y: 0 },
    { id: 'middle', task: 2, x: 28, z: 7.6, label: 'Sit in the middle', color: ORANGE, shape: 'sign', y: 0 },
  ],
  budgets: { 0: { budget: 1100, need: 3 } },
  serves: { 1: { eatSecs: 3, from: 1, guests: [
    { id: 'ife', name: 'Ife', order: 'Rice and stew', dish: 'pI', x: 0, z: 4, seat: { x: 12, z: 3 }, table: { x: 12, z: 4.8 } },
    { id: 'dayo', name: 'Dayo', order: 'Rice, no stew', dish: 'pD', x: 2, z: 7, seat: { x: 18, z: 3 }, table: { x: 18, z: 4.8 } },
    { id: 'kemi', name: 'Kemi', order: 'Just plantain', dish: 'pK', x: -2, z: 8, seat: { x: 24, z: 3 }, table: { x: 24, z: 4.8 } },
  ] } },
  goto: [null, null, null, RING(34, 6, 1.6)],
  guide: [{ x: 22, z: -6, r: 16 }, { x: 14, z: 0, r: 12 }, { x: 18, z: 7.6, r: 12 }, RING(34, 6, 1.6)],
  crowd: [{ x: 30, z: 0, rot: 3 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }, choiceLabel: 'table',
  endBeat: { text: 'The tray is empty, the table is sticky and the three of you agree it was the best meal of the week. Mama Put gives you a free banana.', line: 'Exams are coming.' },
  starRules: ['Finish the level', 'Finish with no overspending', 'Finish with no mistakes and no hints'],
}), shuttle('the cafeteria', 'Shuttle to the cafeteria', 'Lunch is the only reliable part of the timetable', [sayAs('Mama Folake', 'folake', 'Eat properly! Rice, not just snacks. Take the shuttle to the cafeteria and tell Mama Put I said hello.', 'happy')], [sayAs('Mama Put', 'neighbour', 'Next! Next! Do not stand there looking! Order! Pay! Eat! Go!', 'angry')]))

// ---------------------------------------------------------------------------------------------------------------- Level 7
const examHall = B('examhall', 8, 30, -12, -7, '#e8d9c9', 'EXAM HALL', 4.0)
export const LEVEL_C7L7 = withBus(L({
  ch: 'ch7', n: 7, title: 'Exam Week', next: 'ch7.l8', bounds: BIGB,
  intro: 'Five days, five exams and a campus that has gone silent. The tea is cold, the library is full and everyone suddenly believes in prayer.',
  theme: { ground: '#bfb393', ...CAMPUS('#e0d2b2', [...examHall.d, { kind: 'rug', x: 18, z: 4, w: 10, d: 3, color: BLUE }, { kind: 'chair', x: 15, z: 4, color: DARK }, { kind: 'chair', x: 18, z: 4, color: DARK }, { kind: 'chair', x: 21, z: 4, color: DARK }, { kind: 'sign', x: 37, z: 2, label: 'HALL DOOR', w: 1.8 }]) },
  furniture: [examHall.f, F('dA', R(12, 14, -4, -2.6), 0.8, WOOD), F('dB', R(18, 20, -4, -2.6), 0.8, WOOD), F('dC', R(24, 26, -4, -2.6), 0.8, WOOD)], ...base,
  tasks: [
    T('ch7.l7', 1, 'reach', 'Rush to the hall', { purpose: 'You overslept. The paper starts in two minutes. Dodge the nervous crowd to the exam hall door.', objective: 'Run to the exam hall door', success: 'You reach the door in time.',
      intro: [sayAs('Ife', 'neighbour', 'Why are you still asleep? WHY? The paper starts in two minutes! Go! Run! I will bring a pen!', 'angry')], done: [say('player', 'In. Breathing. Holding a pen that is not mine. Wonderful.', 'laughing')], hint: 'Cross behind the students and run right to the HALL DOOR.' }),
    T('ch7.l7', 2, 'hold', 'Last revision', { purpose: 'Ten minutes to cram. Sit on the bench and read like your life depends on it. It does.', objective: 'Sit and revise your notes', success: 'You have revised.',
      intro: [sayAs('Kemi', 'neighbour', 'Do not read everything. Read what you know. Read what you almost know. Do not read what you never knew.', 'calm')], done: [say('player', 'I know some of it. I know most of some of it. I know that I know it.', 'worried')], hint: 'Stand in the ring on the bench until you have revised.' }),
    T('ch7.l7', 3, 'find', 'Find your desk', { purpose: 'The hall has two hundred desks and one is yours. The number is on your card.', objective: 'Find desk 14', success: 'You find your desk.',
      intro: [sayAs('Invigilator', 'helper', 'Desk numbers on your card. Find yours. Sit. Do not talk. Do not look at anyone. Do not breathe too loudly.', 'angry')], done: [say('player', 'Desk 14. A wobbly desk. A wobbly chair. A wobbly me.', 'worried')], hint: 'Try the three desks in the row: left, middle and right.' }),
    T('ch7.l7', 4, 'choose', 'The last hour', { purpose: 'The paper is over. You have one free hour before the next. Study, sleep or walk it off.', objective: 'Decide how to spend the last hour', success: 'You choose.',
      intro: [say('player', 'One hour. A tiny gap in a sea of exams. What do I do with it?', 'thinking')], done: [say('player', 'Done. May the hour be kind.', 'calm')], hint: 'Three signs outside: revise, sleep or walk.' }),
  ],
  spots: [
    { id: 'dA', task: 2, x: 13, z: -1.8, label: 'Check this desk', wrong: say('helper', 'Desk 7. A very serious boy with six pens.', 'cheeky') },
    { id: 'dB', task: 2, x: 19, z: -1.8, label: 'Check this desk', right: true },
    { id: 'dC', task: 2, x: 25, z: -1.8, label: 'Check this desk', wrong: say('player', 'Desk 22. A girl who is already writing. She has not read the question yet.', 'tired') },
  ],
  items: [
    { id: 'rev', task: 3, x: 12, z: 7.6, label: 'Revise one more time', color: BLUE, shape: 'sign', y: 0 },
    { id: 'sleep', task: 3, x: 20, z: 7.6, label: 'Take a short nap', color: GREEN, shape: 'sign', y: 0 },
    { id: 'walk', task: 3, x: 28, z: 7.6, label: 'Go for a walk', color: YELLOW, shape: 'sign', y: 0 },
  ],
  holds: { 1: { x: 18, z: 4, r: 1.2, secs: 8, pose: 'typing' } },
  goto: [RING(36, 4, 1.5), null, null, null],
  guide: [RING(36, 4, 1.5), RING(18, 4, 1.2), { x: 19, z: -2, r: 8 }, { x: 20, z: 7.6, r: 10 }],
  hazards: [D('walker', 8, -2, 8, 3.0, 0, GREEN), D('walker', 14, -2, 8, 3.2, 1.2, ORANGE), D('walker', 20, -2, 8, 2.8, 0.6, RUST), D('walker', 28, -2, 8, 3.0, 0.2)],
  timeLimit: 16,
  crowd: [{ x: 6, z: 6, rot: 1 }, { x: 32, z: 7, rot: -2 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }, choiceLabel: 'free hour',
  endBeat: { text: 'The last paper ends. Two hundred people breathe out like one enormous balloon. Somebody laughs. Somebody cries. Somebody does both, with a sandwich.', line: 'One deadline left.' },
  starRules: ['Finish the level', 'Reach the door before the timer ends', 'Be on time with two or fewer slips'],
}), shuttle('the exam hall', 'Shuttle to the exam hall', 'The paper starts in minutes', [sayAs('Mama Folake', 'folake', 'Exam! Today! Why are you still on the phone? Go! The shuttle! The pen! The calm!', 'worried')], [say('helper', 'The shuttle driver says good luck. The shuttle driver says it every day. He means it every day.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 8
const labCpx = B('labcomplex', 8, 30, -12, -7, '#c9d9e8', 'ENGINEERING LAB', 3.8)
export const LEVEL_C7L8 = withBus(L({
  ch: 'ch7', n: 8, title: 'Deadline Night', next: 'ch7.l9', bounds: BIGB,
  intro: 'Eleven o\'clock. The report is due at midnight. It is finished except for the introduction, the results, the references and the part where it is printed.',
  theme: { ground: '#9a9886', ...CAMPUS('#d4d0be', [...labCpx.d, { kind: 'sign', x: 37, z: 2, label: 'SUBMIT', w: 1.6 }, { kind: 'rug', x: 18, z: 4, w: 12, d: 3, color: BLUE }]) },
  furniture: [labCpx.f, F('table', R(10, 26, -3.4, -2), 0.9, WOOD), F('p1', R(10, 13, 6.8, 8.2), 1.0, '#6a8ab8'), F('p2', R(18, 21, 6.8, 8.2), 1.0, '#6a8ab8'), F('p3', R(26, 29, 6.8, 8.2), 1.0, '#6a8ab8')], ...base,
  tasks: [
    T('ch7.l8', 1, 'sequence', 'Assemble the report', { purpose: 'Introduction, results, then staple. Staple last, or the pages go in the wrong order.', objective: 'Introduction, results, then staple', success: 'The report is assembled.',
      intro: [sayAs('Tayo', 'helper', 'Introduction first, results second, staple last. If you staple first, you will have to explain it to me.', 'cheeky')], done: [say('player', 'Stapled. Heavy. Perfect. Slightly curved.', 'proud')], hint: 'Order on the table: introduction, results, staple.' }),
    T('ch7.l8', 2, 'collect', 'Print three copies', { purpose: 'One printer jams, another is out of paper, the third works. Collect pages from all three.', objective: 'Collect pages from three printers', success: 'You have all three copies.',
      intro: [sayAs('Tayo', 'helper', 'Printer one. Printer two. Printer three. One of them works. I will not say which. It builds character.', 'cheeky')], done: [say('player', 'Warm paper. Slightly crooked. Still readable. Glorious.', 'laughing')], hint: 'Take a page from each of the three printers at the bottom.' }),
    T('ch7.l8', 3, 'reach', 'Sprint to submit', { purpose: 'It is two minutes to midnight and the submission box is at the far end of the lab.', objective: 'Run to the submission desk', success: 'You reach the desk in time.',
      intro: [sayAs('Tayo', 'helper', 'Two minutes! Go! The box is closing! I will hold the door! I will not hold the door!', 'worried')], done: [say('player', 'Submitted. With forty seconds to spare. My heart is a drum.', 'laughing')], hint: 'Cross behind the students and run right to the SUBMIT sign.' }),
    T('ch7.l8', 4, 'talk', 'Face the TA', { purpose: 'Tayo checks your report. Be honest about what you did.', objective: 'Talk to Tayo', success: 'The TA has your report.',
      intro: [say('player', 'He is reading it. He is turning a page. He is turning another. He is smiling? Frowning?', 'worried')], done: [sayAs('Tayo', 'helper', 'Not perfect. Better than last time. The staple is crooked. I love it.', 'happy')], hint: 'Tayo stands by the submission desk.' }),
  ],
  items: [
    { id: 'intro', task: 0, x: 13, z: -2.7, label: 'Add the introduction', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'typing' },
    { id: 'results', task: 0, x: 18, z: -2.7, label: 'Add the results', color: '#fbf8f0', shape: 'paper', y: 1.0, act: 'typing' },
    { id: 'staple', task: 0, x: 23, z: -2.7, label: 'Staple it', color: '#c4562a', shape: 'stamp', y: 1.0, act: 'stamp' },
    { id: 'pg1', task: 1, x: 11.5, z: 7.4, label: 'Take the page', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'grab' },
    { id: 'pg2', task: 1, x: 19.5, z: 7.4, label: 'Take the page', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'grab' },
    { id: 'pg3', task: 1, x: 27.5, z: 7.4, label: 'Take the page', color: '#fbf8f0', shape: 'paper', y: 1.05, act: 'grab' },
  ],
  sequences: { 0: ['intro', 'results', 'staple'] },
  talks: { 3: [{ id: 'tayo', name: 'Tayo', x: 33, z: -1.4, lines: [sayAs('Tayo', 'helper', 'Let me see. Hmm. Interesting. This chart. Whose idea was this chart?', 'curious')], rounds: [{ options: [
    { id: 'mine', label: '"Mine, honestly."', reply: sayAs('Tayo', 'helper', 'Brave. Wrong, but brave. The best kind of wrong.', 'cheeky') },
    { id: 'team', label: '"The whole team\'s."', reply: sayAs('Tayo', 'helper', 'Teamwork. Hm. Diplomatic. I approve.', 'happy') },
    { id: 'dayo', label: '"Dayo\'s. He loves charts."', reply: sayAs('Tayo', 'helper', 'Dayo. Of course. Dayo always loves charts.', 'cheeky') },
  ] }] }] },
  goto: [null, null, RING(36, 2, 1.6), null],
  guide: [{ x: 18, z: -2.7, r: 8 }, { x: 19.5, z: 7, r: 12 }, RING(36, 2, 1.6), { x: 33, z: -1.4, r: 4 }],
  hazards: [D('walker', 16, -3, 9, 2.8, 0, GREEN), D('walker', 22, -3, 9, 3.0, 1.2, ORANGE), D('walker', 28, -3, 9, 2.6, 0.6, RUST)],
  timeLimit: 16,
  crowd: [{ x: 6, z: 6, rot: 1 }],
  npcs: { folake: { x: -10, z: 9, rot: 0.8 }, tunde: { x: 38, z: 9, rot: -2.4 } }, choiceLabel: 'deadline',
  endBeat: { text: 'It is 11:59 and 41 seconds. The submission box closes with a click. Somewhere in the lab a boy bursts into applause for no reason.', line: 'Term is almost over.' },
  starRules: ['Finish the level', 'Reach the desk before the timer ends', 'Be on time with two or fewer slips'],
}), shuttle('the engineering lab', 'Shuttle to the lab', 'The report is due at midnight', [sayAs('Mama Folake', 'folake', 'Midnight! A deadline! The only thing in life that arrives on time. Take the last shuttle and take a snack.', 'worried')], [sayAs('Tayo', 'helper', 'You are here! Good. Eleven o\'clock. We have an hour and a half of hopeful panic.', 'cheeky')]))

// ---------------------------------------------------------------------------------------------------------------- Level 9
export const LEVEL_C7L9 = withBus(L({
  ch: 'ch7', n: 9, title: 'End of Term', next: null, badge: 'Campus Life', bounds: BIGB,
  intro: 'The exams are over and the results are not out. The quad is full of suitcases, hugs and people promising to visit. This is the best part of any semester.',
  theme: { ground: '#bfb393', ...CAMPUS(GRASS, [{ kind: 'awning', x: 14, z: 3, w: 12, d: 5, color: ORANGE }, { kind: 'rug', x: 14, z: 3, w: 10, d: 3, color: '#c4562a' }, { kind: 'chair', x: 10, z: 4, color: WOOD }, { kind: 'chair', x: 14, z: 4, color: WOOD }, { kind: 'chair', x: 18, z: 4, color: WOOD }, { kind: 'rug', x: 30, z: 0, w: 8, d: 3, color: BLUE }, { kind: 'chair', x: 30, z: 0, color: DARK }, { kind: 'sign', x: 37, z: -4, label: 'THE GATE', w: 1.6 }]) },
  furniture: [F('buffet', R(8, 20, -8.6, -7.2), 1.0, WOOD)], ...base,
  tasks: [
    T('ch7.l9', 1, 'talk', 'Say your goodbyes', { purpose: 'Three friends, three hugs and three promises to meet again.', objective: 'Talk to Ife, Dayo and Kemi', success: 'You have said goodbye to everyone.',
      intro: [say('player', 'One semester. It feels like a whole year. In a good way. Mostly.', 'happy')], done: [say('player', 'I will see them again. In January. And in my dreams. And in the group chat.', 'laughing')], hint: 'Ife, Dayo and Kemi stand on the quad.' }),
    T('ch7.l9', 2, 'serve', 'The end-of-term party', { purpose: 'Seat your friends under the awning and bring each their treat.', objective: 'Seat and serve three friends', success: 'The party is on.',
      intro: [sayAs('Ife', 'neighbour', 'A party! With food! And an awning! I do not know what the awning is for. It is perfect.', 'happy')], done: [sayAs('Dayo', 'helper', 'This is the best party in the history of the world. And I have been to three.', 'cheeky')], hint: 'Seat each friend, take their treat from the buffet and carry it over.' }),
    T('ch7.l9', 3, 'hold', 'Sit through the ceremony', { purpose: 'The vice-chancellor gives a very long speech. Sit still, look moved and applaud on cue.', objective: 'Sit and listen to the speech', success: 'The speech is over.',
      intro: [sayAs('Vice-Chancellor', 'helper', 'Students, this semester you have grown. Some of you vertically. All of you spiritually. Let us pray. Briefly.', 'calm')], done: [sayAs('Vice-Chancellor', 'helper', 'And that brings me to my very short conclusion, which is nineteen minutes long.', 'cheeky')], hint: 'Stand in the ring on the blue rug until the speech ends.' }),
    T('ch7.l9', 4, 'goto', 'Walk through the gate', { purpose: 'The last walk of the term: out of the gate, into the holidays.', objective: 'Walk out through the gate', success: 'You are out.',
      intro: [say('folake', 'Come home, my child. Bring your laundry. I will pretend I am not delighted.', 'happy')], done: [say('tunde', 'A whole semester. And you are still smiling. Good. Keep that.', 'proud')], hint: 'The gate is at the top right.' }),
  ],
  talks: { 0: [
    { id: 'ife', name: 'Ife', x: 4, z: -2, lines: [sayAs('Ife', 'neighbour', 'I will miss your terrible singing. And your tea. And the damp patch shaped like Africa.', 'happy')], rounds: [{ options: [
      { id: 'miss', label: '"I will miss you too, Ife."', reply: sayAs('Ife', 'neighbour', 'Stop. You are making my eyes behave badly.', 'happy') },
      { id: 'snore', label: '"I will miss everything except the snoring."', reply: sayAs('Ife', 'neighbour', 'I do not snore. That was the vent. Allegedly.', 'cheeky') },
    ] }] },
    { id: 'dayo', name: 'Dayo', x: 12, z: -2, lines: [sayAs('Dayo', 'helper', 'We have to keep in touch! A group chat! Called "Never Again". Or "Again". I have not decided.', 'cheeky')] },
    { id: 'kemi', name: 'Kemi', x: 20, z: -2, lines: [sayAs('Kemi', 'neighbour', 'Next semester I will read the timetable. For real. You will see.', 'curious')] },
  ] },
  items: [
    { id: 'tIfe', task: 1, x: 9.4, z: -7.8, label: 'Take Ife\'s cake', color: '#e0457b', shape: 'cake', y: 1.1 },
    { id: 'tDayo', task: 1, x: 13.6, z: -7.8, label: 'Take Dayo\'s rice', color: RUST, shape: 'plate', y: 1.1 },
    { id: 'tKemi', task: 1, x: 17.8, z: -7.8, label: 'Take Kemi\'s drink', color: BLUE, shape: 'cup', y: 1.1 },
  ],
  serves: { 1: { eatSecs: 3, from: 1, guests: [
    { id: 'ife', name: 'Ife', order: 'Cake', dish: 'tIfe', x: 4, z: 6, seat: { x: 10, z: 4 }, table: { x: 10, z: 2.4 } },
    { id: 'dayo', name: 'Dayo', order: 'Jollof', dish: 'tDayo', x: 8, z: 8, seat: { x: 14, z: 4 }, table: { x: 14, z: 2.4 } },
    { id: 'kemi', name: 'Kemi', order: 'A cold drink', dish: 'tKemi', x: 2, z: 8, seat: { x: 18, z: 4 }, table: { x: 18, z: 2.4 } },
  ] } },
  holds: { 2: { x: 30, z: 0, r: 1.0, secs: 7, pose: 'sit' } },
  goto: [null, null, null, RING(36, -2, 1.6)],
  guide: [{ x: 12, z: -2, r: 14 }, { x: 14, z: 2, r: 10 }, RING(30, 0, 1.0), RING(36, -2, 1.6)],
  crowd: [{ x: 26, z: 5, rot: -2 }, { x: 34, z: 4, rot: -2 }],
  npcs: { folake: { x: 38, z: 8, rot: -2.4 }, tunde: { x: 34, z: 9, rot: -2.4 } }, choiceLabel: 'farewell',
  endBeat: { text: 'The gate swings shut behind you with a very polite creak. Somewhere behind it a hundred suitcases are being dragged to a hundred buses. You are not sad. You are not not sad.', line: 'Chapter 7 is done.' },
  starRules: ['Finish the level', 'Finish with no wrong plate', 'Finish with no mistakes and no hints'],
}), shuttle('the quad', 'Shuttle to the quad', 'The last day of term', [sayAs('Mama Folake', 'folake', 'Last day of term. Take the shuttle, say your goodbyes properly and bring home the laundry.', 'happy')], [say('helper', 'The shuttle driver is waving. He waved on day one. He waves on every last day.', 'happy')]))
void RUST; void YELLOW; void ORANGE; void BLUE; void WOOD; void DARK
