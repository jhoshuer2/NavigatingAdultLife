import type { QuizQuestion } from '@engine/core/types'
import type { Rng } from '@engine/core/rng'

type Subject = QuizQuestion['subject']
const q = (id: string, subject: Subject, minAge: number, maxAge: number, text: string, options: string[], answer: number, funnyRight?: string, funnyWrong?: string): QuizQuestion =>
  ({ id, subject, minAge, maxAge, q: text, options, answer, funnyRight, funnyWrong })

export const QUIZ_BANK: QuizQuestion[] = [
  // general / Nigeria
  q('g1', 'general', 6, 99, 'What is the capital of Nigeria?', ['Lagos', 'Abuja', 'Kano', 'Ibadan'], 1, 'Teacher nods like you personally built Abuja.', 'Lagos is not the capital, even if it feels like it.'),
  q('g2', 'general', 6, 99, 'What are the colours of the Nigerian flag?', ['Green-white-green', 'Red-white-blue', 'Green-yellow-black', 'White-green-white'], 0, 'Patriotism points!', 'Check the flag on your uniform badge.'),
  q('g3', 'general', 6, 99, 'In which year did Nigeria gain independence?', ['1950', '1960', '1970', '1980'], 1),
  q('g4', 'general', 8, 99, 'Which rivers meet at Lokoja?', ['Niger and Benue', 'Ogun and Osun', 'Kaduna and Yobe', 'Cross and Imo'], 0),
  q('g5', 'general', 8, 99, 'Who wrote the novel "Things Fall Apart"?', ['Wole Soyinka', 'Chinua Achebe', 'Chimamanda Adichie', 'Ben Okri'], 1, 'Literature teacher is crying proudly.'),
  q('g6', 'general', 8, 99, 'Which Nigerian won the Nobel Prize in Literature?', ['Wole Soyinka', 'Chinua Achebe', 'Ken Saro-Wiwa', 'Buchi Emecheta'], 0),
  q('g7', 'general', 6, 99, 'Which animal is the symbol on the Nigerian coat of arms?', ['Eagle', 'Lion', 'Elephant', 'Horse'], 0, undefined, 'Two horses hold it up, but the eagle sits on top.'),
  q('g8', 'general', 10, 99, 'Which is the largest city in Nigeria by population?', ['Kano', 'Abuja', 'Lagos', 'Port Harcourt'], 2),
  q('g9', 'general', 10, 99, 'Zuma Rock is found near which city?', ['Abuja', 'Enugu', 'Jos', 'Calabar'], 0),
  q('g10', 'general', 12, 99, 'The Nigerian currency is the…', ['Cedi', 'Naira', 'Rand', 'Shilling'], 1, 'Your wallet remembers it well.'),
  q('g11', 'general', 12, 99, 'How many states are in Nigeria (excluding the FCT)?', ['30', '33', '36', '40'], 2),
  q('g12', 'general', 10, 99, 'Olumo Rock is located in which city?', ['Abeokuta', 'Makurdi', 'Sokoto', 'Uyo'], 0),
  // science
  q('s1', 'science', 6, 99, 'What do plants need to make their own food?', ['Sunlight', 'Darkness', 'Plastic', 'Salt'], 0, 'Photosynthesis passes. Teacher smiles.'),
  q('s2', 'science', 6, 99, 'At what temperature does water boil (°C)?', ['50', '75', '100', '150'], 2),
  q('s3', 'science', 6, 99, 'Which planet is closest to the Sun?', ['Earth', 'Mercury', 'Mars', 'Venus'], 1),
  q('s4', 'science', 8, 99, 'What is the chemical formula for water?', ['CO2', 'H2O', 'O2', 'NaCl'], 1),
  q('s5', 'science', 8, 99, 'Which organ pumps blood around the body?', ['Liver', 'Heart', 'Lungs', 'Kidney'], 1),
  q('s6', 'science', 10, 99, 'Which liquid metal is used in some thermometers?', ['Iron', 'Mercury', 'Zinc', 'Tin'], 1),
  q('s7', 'science', 10, 99, 'Plants take in which gas for photosynthesis?', ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], 1),
  q('s8', 'science', 12, 99, 'The basic unit of life is the…', ['Atom', 'Cell', 'Organ', 'Molecule'], 1),
  q('s9', 'science', 12, 99, 'Which of these is an acid?', ['Lime juice', 'Soap', 'Baking soda', 'Bleach'], 0, 'Lime juice wins. Pepper soup would argue.'),
  q('s10', 'science', 12, 99, 'The force that pulls objects toward Earth is…', ['Friction', 'Gravity', 'Magnetism', 'Inertia'], 1),
  q('s11', 'science', 14, 99, 'How many bones are in an adult human body?', ['106', '206', '306', '406'], 1),
  // english
  q('e1', 'english', 6, 99, 'What is the plural of "child"?', ['Childs', 'Children', 'Childrens', 'Childes'], 1, 'Grammar approved.'),
  q('e2', 'english', 6, 99, 'Which word is the opposite of "ancient"?', ['Old', 'Modern', 'Strong', 'Tiny'], 1),
  q('e3', 'english', 8, 99, 'What is the past tense of "go"?', ['Goed', 'Gone', 'Went', 'Going'], 2),
  q('e4', 'english', 8, 99, 'A group of lions is called a…', ['Herd', 'Pride', 'Flock', 'Swarm'], 1),
  q('e5', 'english', 10, 99, 'Which word is a synonym for "happy"?', ['Joyful', 'Angry', 'Tired', 'Late'], 0),
  q('e6', 'english', 10, 99, 'Choose the correct sentence.', ['She don’t like rice.', 'She doesn’t like rice.', 'She not like rice.', 'She no likes rice.'], 1, undefined, 'Pidgin is lovely, but this is an English exam.'),
  q('e7', 'english', 12, 99, '"As brave as a lion" is an example of a…', ['Simile', 'Metaphor', 'Pun', 'Proverb'], 0),
  q('e8', 'english', 12, 99, 'Which is a noun?', ['Quickly', 'Beautiful', 'Teacher', 'Run'], 2),
  q('e9', 'english', 14, 99, 'What does "ephemeral" mean?', ['Lasting a short time', 'Very large', 'Extremely loud', 'Totally clean'], 0),
  // ICT
  q('i1', 'ict', 8, 99, 'Which of these is an output device?', ['Keyboard', 'Monitor', 'Mouse', 'Scanner'], 1),
  q('i2', 'ict', 10, 99, 'What does CPU stand for?', ['Central Processing Unit', 'Computer Power Unit', 'Core Program Utility', 'Central Printer Unit'], 0),
  q('i3', 'ict', 12, 99, 'Which language is used to structure web pages?', ['HTML', 'Excel', 'SQL', 'Pidgin'], 0, 'Pidgin is a language, just not for browsers.'),
  q('i4', 'ict', 12, 99, 'Which shortcut copies selected text?', ['Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+Z'], 0),
  q('i5', 'ict', 14, 99, 'The binary number 1001 equals…', ['7', '9', '10', '11'], 1, 'Binary is just counting with fewer fingers.'),
  q('i6', 'ict', 14, 99, 'Which file extension is an image?', ['.jpg', '.exe', '.mp3', '.doc'], 0),
  q('i7', 'ict', 16, 99, 'What does "HTTP" stand for?', ['HyperText Transfer Protocol', 'High Transfer Text Process', 'Home Tool Transfer Page', 'Hyper Terminal Tag Program'], 0),
]

function genMaths(rng: Rng, age: number): QuizQuestion {
  const band = age < 9 ? 0 : age < 13 ? 1 : age < 18 ? 2 : 3
  let text = ''
  let ans = 0
  if (band === 0) {
    const a = rng.int(3, 20), b = rng.int(3, 20)
    if (rng.chance(0.5)) { text = `${a} + ${b} = ?`; ans = a + b } else { const big = Math.max(a, b), small = Math.min(a, b); text = `${big} − ${small} = ?`; ans = big - small }
  } else if (band === 1) {
    const a = rng.int(3, 12), b = rng.int(3, 12)
    if (rng.chance(0.5)) { text = `${a} × ${b} = ?`; ans = a * b } else { text = `If 1 sachet water costs ₦${a * 10}, how much are ${b} sachets (₦)?`; ans = a * 10 * b }
  } else if (band === 2) {
    const pct = rng.pick([10, 20, 25, 50]), base = rng.pick([40, 80, 120, 200, 400])
    if (rng.chance(0.5)) { text = `What is ${pct}% of ${base}?`; ans = (pct * base) / 100 } else { const x = rng.int(2, 15); text = `Solve for x: 3x + 5 = ${3 * x + 5}`; ans = x }
  } else {
    const p = rng.pick([50000, 100000, 200000, 500000]), r = rng.pick([5, 10, 20])
    text = `Simple interest on ₦${p.toLocaleString('en-NG')} at ${r}% for 1 year (₦)?`
    ans = (p * r) / 100
  }
  const set = new Set<number>([ans])
  while (set.size < 4) {
    const d = rng.pick([-2, -1, 1, 2, 3, 10, -10, ans > 50 ? Math.round(ans * 0.1) : 4])
    const v = ans + d
    if (v > 0) set.add(v)
  }
  const options = rng.shuffle([...set]).map((n) => n.toLocaleString('en-NG'))
  return { id: `gen:${text}`, subject: 'maths', minAge: 6, maxAge: 99, q: text, options, answer: options.indexOf(ans.toLocaleString('en-NG')), funnyRight: undefined, funnyWrong: 'Even the calculator looked away.' }
}

export function pickQuestions(rng: Rng, age: number, n: number, seen: Set<string>): QuizQuestion[] {
  const pool = QUIZ_BANK.filter((x) => age >= x.minAge && age <= x.maxAge && !seen.has(x.id))
  const out: QuizQuestion[] = []
  const wantMaths = Math.max(1, Math.round(n / 2))
  for (let i = 0; i < wantMaths; i++) out.push(genMaths(rng, age))
  const rest = rng.shuffle(pool)
  for (const x of rest) {
    if (out.length >= n) break
    out.push(x)
  }
  while (out.length < n) out.push(genMaths(rng, age))
  return rng.shuffle(out).slice(0, n)
}
