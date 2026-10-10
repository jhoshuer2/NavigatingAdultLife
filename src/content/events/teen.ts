import type { GameEvent } from '@engine/core/types'
import { ev, ch, happy, know, rep, stress, health, rel, flag, moment, hustle } from './dsl'

const T: GameEvent['stage'] = ['teen']

export const teenEvents: GameEvent[] = [
  ev({ id: 'evt_t_nepa_exam', title: 'NEPA took light', stage: T, w: 8, cd: 3, when: { all: [{ inSchool: true }] },
    text: "It is the night before your mock exams and the whole street goes dark. Your candle is almost finished. {mother} is already saying a prayer. Somewhere, a generator starts, and it is not yours.",
    choices: [
      ch('candle', { label: 'Study by candlelight', cost: { energy: 12 }, risk: 'safe', check: { stat: 'knowledge', difficulty: 40 }, out: {
        critSuccess: { effects: [know(5), happy(3), flag('candleScholar')], text: 'You remember everything. The teacher is shocked.' },
        success: { effects: [know(3)], text: 'Wax on the book, answers in the head.' },
        fail: { effects: [know(1), health(-2), stress(3)], text: 'Candle wax, tears, and nothing stuck.' } } }),
      ch('sleep', { label: 'Sleep. God will provide.', fx: [energy10(), know(-1), happy(2)], text: 'You wake up refreshed and fully unprepared.' }),
      ch('neighbour', { label: 'Beg the neighbour for generator light', requires: { all: [{ stat: ['reputation', '>=', 18] }] }, fx: [know(3), rep(1), rel('friend', 2)], text: 'Mr Sule lets you sit in his sitting room with a lamp. Your books are fully charged.' }),
    ] }),
  ev({ id: 'evt_t_crush', title: 'A crush in school', stage: T, w: 7, cd: 3, when: { all: [{ hasPartner: false }, { ageBetween: [14, 17] }] },
    text: "Someone in your class has started to look different: neater uniform, brighter smile, handwriting you are suspiciously fond of. Your friends have noticed. Your friends are no good at secrets.",
    choices: [
      ch('letter', { label: 'Write a love letter (in perfect English)', risk: 'risky', check: { stat: 'charm', difficulty: 38 }, out: {
        success: { effects: [happy(8), rep(2), flag('firstCrushWin')], text: 'A reply arrives in rhyme. Your heart does a small dance.' },
        fail: { effects: [happy(-6), rep(-3), stress(3)], text: 'The letter is read aloud in class. You consider changing schools.' } } }),
      ch('wait', { label: 'Admire from afar', fx: [happy(1), stress(1)], text: 'Love is patient. Exams are coming anyway.' }),
      ch('study', { label: 'Focus on your books', fx: [know(3), happy(-1)], text: 'The crush graduates to a distant, unfinished story.' }),
    ] }),
  ev({ id: 'evt_t_jamb', title: 'JAMB registration', stage: T, w: 6, cd: 99, once: true, when: { all: [{ ageBetween: [16, 17] }, { eduLevel: 'sss' }] },
    text: "Registration day. You queue at the cyber café from 6 a.m. The network is as sad as the queue. Somebody ahead of you has been fixing the same page for forty minutes. Past questions are selling like hot akara.",
    choices: [
      ch('prep', { label: 'Buy past questions and study seriously', cost: { cash: 30000, energy: 15 }, fx: [know(4), stress(3), flag('boughtPastQs')], text: 'The pile of past questions grows. So does your knowledge.' }),
      ch('expo', { label: 'Pay for "expo" (leaked answers)', cost: { cash: 40000 }, risk: 'gamble', check: { stat: 'reputation', difficulty: 25 }, out: {
        success: { effects: [rep(-3), stress(-3), flag('usedExpo')], text: 'The answers are real this time. You hate how much you like it.' },
        fail: { effects: [rep(-6), happy(-6), stress(6)], text: 'The "expo" was a scam. Money gone, nerves worse.' } } }),
      ch('pray', { label: 'Pray, trust, and register early', fx: [happy(3), stress(-2), know(1)], text: 'Peace of mind is also a strategy.' }),
    ] }),
  ev({ id: 'evt_t_lessons', title: 'Extra lessons', stage: T, w: 6, cd: 3, when: { all: [{ inSchool: true }] },
    text: "Your teacher announces \"lesson classes\" after school: ₦3,000 a month for \"the real syllabus\". It is rumoured that the exam questions come from there.",
    choices: [
      ch('join', { label: 'Join the lessons', cost: { cash: 36000, energy: 12 }, fx: [know(5), stress(2)], text: 'You learn more from the lesson teacher than from the class teacher. Both of them are the same person.' }),
      ch('self', { label: 'Study alone with textbooks', cost: { energy: 10 }, check: { stat: 'knowledge', difficulty: 35 }, out: {
        success: { effects: [know(4), rep(1)], text: 'Self-study works. You feel suspiciously independent.' },
        fail: { effects: [know(1), stress(2)], text: 'The textbook was out of date. By nine years.' } } }),
      ch('skip', { label: 'Skip it and play football', fx: [happy(4), know(-1), health(2)], text: 'You scored twice. Your teacher noticed you absent.' }),
    ] }),
  ev({ id: 'evt_t_cheat', title: 'Give me the answers', stage: T, w: 5, cd: 4, when: { all: [{ inSchool: true }] },
    text: "During the test, the boy behind you coughs, taps your chair, and whispers: \"number 4?\" The teacher is looking out of the window. You have the answer. He has a fist.",
    choices: [
      ch('refuse', { label: 'Refuse and focus', fx: [rep(2), stress(2), happy(1)], text: 'He glares. You write. Integrity is quiet and lonely.' }),
      ch('help', { label: 'Pass him the answer', risk: 'risky', check: { stat: 'reputation', difficulty: 30 }, out: {
        success: { effects: [rel('friend', 4), rep(1)], text: 'Nobody noticed. A debt of gratitude is created.' },
        fail: { effects: [rep(-6), happy(-5), stress(4)], text: 'The teacher caught both of you. You are made to kneel at the assembly.' } } }),
    ] }),
  ev({ id: 'evt_t_prefect', title: 'Prefect elections', stage: T, w: 5, cd: 4, when: { all: [{ inSchool: true }, { stat: ['reputation', '>=', 20] }] },
    text: "The school is selecting prefects. A senior prefect says the position needs \"a student of good character and discipline\". Your friends say you have both. The principal says you have neither, but she is smiling.",
    choices: [
      ch('run', { label: 'Contest with a speech', check: { stat: 'charm', difficulty: 40 }, out: {
        critSuccess: { effects: [rep(8), happy(7), flag('prefect'), moment('Became school prefect.')], text: 'Head prefect! The staff room approved. The canteen lady blessed you.' },
        success: { effects: [rep(5), happy(4), flag('prefect')], text: 'You became a prefect. You are now responsible for making people queue.' },
        fail: { effects: [rep(-1), happy(-3)], text: 'You lost to a boy who promised free biscuits. Democracy works.' } } }),
      ch('skip', { label: 'Not interested', fx: [happy(1)], text: 'Leadership can wait; football cannot.' }),
    ] }),
  ev({ id: 'evt_t_phone', title: 'First smartphone', stage: T, w: 5, cd: 99, once: true, when: { all: [{ ageBetween: [13, 17] }] },
    text: "{father} hands you an old phone with a cracked screen and a battery that dies at 40%. It is the most beautiful thing you have ever owned. There is a data plan: 1GB for the month. Choose wisely.",
    choices: [
      ch('learn', { label: 'Use it for learning and videos', fx: [know(4), happy(3), { item: 'phone' }], text: 'Free tutorials, YouTube lessons, and a surprising amount of knowledge.' }),
      ch('social', { label: 'Spend it all on social media', fx: [happy(6), know(-1), rep(2), { item: 'phone' }], text: 'The 1GB lasted nine days. But your reputation online is solid.' }),
    ] }),
  ev({ id: 'evt_t_boarding', title: 'Boarding house life', stage: T, w: 5, cd: 5, when: { all: [{ inSchool: true }, { eduLevel: ['jss', 'sss'] }] },
    text: "Boarding school means indomie at midnight, buckets of water at dawn, and seniors who need \"errands\". Your trunk was inspected, your provisions were \"taxed\", and the bell is the loudest thing you have ever heard.",
    choices: [
      ch('adapt', { label: 'Adapt, make friends and learn the rules', fx: [rep(3), health(1), stress(-1), rel('friend', 3)], text: 'By the second term you know every shortcut and every corner.' }),
      ch('resist', { label: 'Resist the senior-junior hierarchy', risk: 'risky', check: { stat: 'reputation', difficulty: 32 }, out: {
        success: { effects: [rep(4), stress(2)], text: 'You stand up for the juniors. Even the seniors respect it.' },
        fail: { effects: [rep(-2), stress(5), happy(-4)], text: 'Extra chores and a lot of respect lost. A week of misery.' } } }),
    ] }),
  ev({ id: 'evt_t_parents_fees', title: 'The fees conversation', stage: T, w: 5, cd: 4, who: 'father',
    text: "You overhear {father} and {mother} talking quietly in the kitchen about money. School fees are due, rent is due, and a relative is in need. They notice you and change the subject to the weather.",
    choices: [
      ch('help', { label: 'Offer to do a side job to help', cost: { energy: 12 }, check: { stat: 'hustle', difficulty: 35 }, out: {
        success: { effects: [hustle(60000), rel('father', 6), rel('mother', 6), rep(2)], text: 'They tried to refuse the money. They kept it, then cried a little.' },
        fail: { effects: [hustle(10000), rel('mother', 3), stress(2)], text: 'You tried. The thought counts.' } } }),
      ch('ignore', { label: 'Pretend you did not hear', fx: [stress(3), happy(-2)], text: 'You carry the worry silently. It grows.' }),
      ch('ask', { label: 'Ask how you can ease the burden', fx: [rel('father', 4), rel('mother', 4), happy(1)], text: 'They said: "Just read your books." And somehow it was the best advice.' }),
    ] }),
  ev({ id: 'evt_t_youth_programme', title: 'Youth fellowship', stage: T, w: 5, cd: 3, tags: ['faith'],
    text: "Your church/mosque youth group is organising a weekend retreat: singing, football, good food, big questions. A cousin says it is \"actually fun\". Your elders say it is mandatory.",
    choices: [
      ch('go', { label: 'Go and join in fully', cost: { energy: 10 }, fx: [happy(6), rep(3), stress(-4), rel('friend2', 3)], text: 'You made new friends and eventually learned all the words to the closing song.' }),
      ch('quiet', { label: 'Go but keep to yourself', fx: [happy(1), stress(-1)], text: 'Peaceful, though a little lonely.' }),
      ch('skip', { label: 'Skip it, claim homework', fx: [know(1), rep(-1), rel('mother', -2)], text: 'The homework was real. The excuse was also real. It was not enough.' }),
    ] }),
  ev({ id: 'evt_t_interhouse', title: 'Inter-house sports', stage: T, w: 6, cd: 3, when: { all: [{ inSchool: true }] },
    text: "It is inter-house sports day: red, blue, green, yellow. The 100m final needs a runner. The house master looks at you with the face of a man who has run out of options.",
    choices: [
      ch('run', { label: 'Run the 100m', cost: { energy: 10 }, check: { stat: 'health', difficulty: 52 }, out: {
        critSuccess: { effects: [rep(7), happy(8), health(3), moment('Won the 100m at inter-house sports.')], text: 'First place! The house erupts, a teacher cries, and the headmaster claps once.' },
        success: { effects: [rep(3), happy(5), health(2)], text: 'Second place. Your house is proud, and your legs are not.' },
        fail: { effects: [happy(-2), health(-1)], text: 'You tripped over lane 4. The crowd was kind enough to laugh softly.' } } }),
      ch('cheer', { label: 'Lead the cheering squad', fx: [rep(3), happy(5), rel('friend', 3)], text: 'Your voice is gone, but your house has spirit.' }),
    ] }),
  ev({ id: 'evt_t_bad_company', title: 'Bad company', stage: T, w: 5, cd: 4,
    text: "A group of older boys from the next street invites you to \"chill\" after school. They have cool shoes, fast talk, and money from \"business\" nobody explains. {friend} is already telling you not to go.",
    choices: [
      ch('go', { label: 'Go and see', risk: 'gamble', check: { stat: 'reputation', difficulty: 38 }, out: {
        success: { effects: [rep(3), happy(3), stress(2)], text: 'You left early. Their shoes were not worth it.' },
        fail: { effects: [rep(-6), stress(6), happy(-4), flag('badCompanyTrouble')], text: 'A police patrol appeared. You ran fast. The lesson stayed.' } } }),
      ch('listen', { label: 'Listen to {friend} and stay home', fx: [rel('friend', 5), rep(1)], text: 'It was boring. Boring is good.' }),
    ] }),
  ev({ id: 'evt_t_debate', title: 'The debating team', stage: T, w: 4, cd: 5, when: { all: [{ inSchool: true }, { stat: ['knowledge', '>=', 30] }] },
    text: "The school is entering the state debate: \"This house believes power cuts make us stronger\". You are asked to propose. Your argument: they have certainly made us patient.",
    choices: [
      ch('debate', { label: 'Take the stage', cost: { energy: 12 }, check: { stat: 'charm', difficulty: 38 }, out: {
        success: { effects: [rep(5), know(3), happy(5), moment('Shone at the state debate.')], text: 'The judges laughed in the right places and wrote the right scores.' },
        fail: { effects: [happy(-3), rep(-1), know(1)], text: 'Your mind went blank at the second sentence. It stayed blank.' } } }),
      ch('prep', { label: 'Help prepare the team instead', fx: [know(2), rel('friend', 3)], text: 'You were the quiet strength behind the stage.' }),
    ] }),
  ev({ id: 'evt_t_hustle_teen', title: 'Holiday hustle', stage: T, w: 6, cd: 3, when: { all: [{ ageBetween: [14, 17] }] },
    text: "School is on break. A neighbour needs help with her provision shop, a cousin is selling phone accessories, and the tailor next door wants an extra pair of hands. Pocket money is the best motivation.",
    choices: [
      ch('shop', { label: 'Work in the provision shop', cost: { energy: 14 }, fx: [hustle(45000), rep(1), stress(2)], text: 'You learned that "customer is king" and "customer is also late".' }),
      ch('phones', { label: 'Sell phone accessories', cost: { energy: 14 }, check: { stat: 'hustle', difficulty: 35 }, out: {
        success: { effects: [hustle(90000), rep(2)], text: 'The market was kind. You charged an extra ₦50 for confidence.' },
        fail: { effects: [hustle(15000), stress(2)], text: 'A customer returned a broken charger, and you refunded.' } } }),
      ch('rest', { label: 'Rest at home', fx: [happy(5), health(2), stress(-3)], text: 'Zero hustle, maximum sleep. The best break ever.' }),
    ] }),
  ev({ id: 'evt_t_mock', title: 'Mock exam result', stage: T, w: 5, cd: 4, when: { all: [{ eduLevel: 'sss' }] },
    text: "The mock results are pasted on the notice board, and the crowd around it looks like a market day. Your teacher says the real exams will be \"harder than all of this\".",
    choices: [
      ch('push', { label: 'Redouble your efforts', cost: { energy: 15 }, fx: [know(4), stress(4)], text: 'The scoreboard motivates better than any speech.' }),
      ch('relax', { label: 'Relax, you have got this', fx: [happy(4), know(-1), stress(-3)], text: 'Confidence is a nice feeling. It is not an answer sheet.' }),
    ] }),
]
function energy10() { return { stat: 'energy' as const, delta: 10 } }
