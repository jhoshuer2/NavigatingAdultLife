import type { GameEvent } from '@engine/core/types'
import { ev, ch, cash, happy, know, rep, stress, health, rel, flag, moment, hustle } from './dsl'

const C: GameEvent['stage'] = ['child']

export const childEvents: GameEvent[] = [
  ev({ id: 'evt_c_sunday_rice', title: 'Sunday rice', stage: C, w: 8, cd: 3, who: 'mother',
    text: "It is Sunday. The smell of {mother}'s jollof rice has taken over the whole compound. Neighbours are suddenly \"just passing by\". There are exactly enough plates for the family.",
    choices: [
      ch('share', { label: 'Take a plate to the neighbour\'s children', fx: [rep(3), happy(3), rel('mother', 3)], text: 'You earn a nickname: "Good child". It will follow you for years.' }),
      ch('seconds', { label: 'Ask for seconds. And thirds.', fx: [happy(5), health(1), rel('mother', -1)], text: 'Stomach full, conscience mostly clear. A small meatball may have been taken without permission.' }),
      ch('help', { label: 'Help serve and wash the plates', fx: [rel('mother', 5), rep(2), happy(1)], text: '{mother} says you are "a blessing". You pretend not to hear.' }),
    ] }),
  ev({ id: 'evt_c_bully', title: 'The class bully', stage: C, w: 6, cd: 4, when: { all: [{ inSchool: true }] },
    text: "A bigger boy in your class has started collecting your biscuit money every morning. He calls it \"tax\". You have noticed that he is nice to teachers.",
    choices: [
      ch('tell', { label: 'Tell the teacher', fx: [rep(2), happy(2), stress(-2)], text: 'The teacher summons him, scolds him, and he starts calling you "snitch". But the tax stops.' }),
      ch('stand', { label: 'Stand up to him', risk: 'risky', check: { stat: 'reputation', difficulty: 22 }, out: {
        success: { effects: [rep(5), happy(4)], text: 'He backs down and the whole class cheers. You feel ten feet tall.' },
        fail: { effects: [happy(-4), health(-3), stress(4)], text: 'He wins, you lose your biscuit and part of your pride.' } } }),
      ch('pay', { label: 'Keep paying the tax', fx: [happy(-4), stress(4), rep(-1)], text: 'Peace has a price, and it is ₦50 a day.' }),
    ] }),
  ev({ id: 'evt_c_spelling', title: 'Spelling bee', stage: C, w: 5, cd: 4, when: { all: [{ inSchool: true }, { ageBetween: [8, 11] }] },
    text: "The inter-class spelling bee is on Friday. Your teacher has chosen you. The word list is long and includes words like \"necessary\" that no human can spell on the first try.",
    choices: [
      ch('prep', { label: 'Practise every night', cost: { energy: 10 }, risk: 'safe', check: { stat: 'knowledge', difficulty: 30 }, out: {
        critSuccess: { effects: [know(4), rep(5), happy(7), flag('spellingChamp'), moment('Won the school spelling bee.')], text: 'Champion! Your name is on the assembly board.' },
        success: { effects: [know(3), rep(2), happy(4)], text: 'Second place and a pencil box. Not bad.' },
        fail: { effects: [know(1), happy(-1)], text: 'You spelled "necessary" with two c\'s and a prayer.' } } }),
      ch('wing', { label: 'Wing it', risk: 'gamble', check: { stat: 'knowledge', difficulty: 45 }, out: {
        success: { effects: [rep(3), happy(5)], text: 'Pure luck, pure talent, or both. You will never tell.' },
        fail: { effects: [rep(-1), happy(-3)], text: 'You froze at "separate". The room has not forgotten.' } } }),
    ] }),
  ev({ id: 'evt_c_errand', title: 'The errand money', stage: C, w: 6, cd: 3, who: 'mother',
    text: "{mother} gives you ₦2,000 to buy tomatoes, pepper and onions from the market, and warns: \"bring my change\". On the way, there is a man selling ice cream and a game on a phone you can rent for ₦200.",
    choices: [
      ch('honest', { label: 'Buy exactly what she asked and return the change', fx: [rel('mother', 5), rep(2), happy(1)], text: '{mother} counts every naira twice, then pats your head. Trust earned.' }),
      ch('ice', { label: 'Buy ice cream with a bit of the change', risk: 'risky', check: { stat: 'reputation', difficulty: 15 }, out: {
        success: { effects: [happy(6)], text: 'You eat the evidence on the way home. Nobody ever finds out.' },
        fail: { effects: [happy(-3), rel('mother', -6), rep(-2)], text: '{mother} counted. She always counts. A long lecture follows.' } } }),
    ] }),
  ev({ id: 'evt_c_goat', title: 'The goat on the road', stage: C, w: 5, cd: 3,
    text: "A goat has decided your path to school is its path too. It stands in the middle of the road, chewing something that looks like your teacher's register.",
    choices: [
      ch('shoo', { label: 'Shoo it away', check: { stat: 'health', difficulty: 40 }, out: {
        success: { effects: [happy(3), rep(1)], text: 'The goat moves with the dignity of a retired civil servant.' },
        fail: { effects: [happy(-2), health(-1), stress(2)], text: 'The goat head-butts your school bag. Lunch is now flat.' } } }),
      ch('detour', { label: 'Take the long way around', fx: [happy(1), stress(1)], text: 'You arrive late with a story nobody believes, even though it is true.' }),
    ] }),
  ev({ id: 'evt_c_village_xmas', title: 'Christmas in the village', stage: C, w: 6, cd: 4, tags: ['festival'],
    text: "December has arrived and the whole family is travelling \"home\". The road is long, the bus is full, and the chicken in the boot has opinions. In the village, grandmother is waiting with a feast and endless questions about your school.",
    choices: [
      ch('enjoy', { label: 'Play with your cousins till sunset', fx: [happy(8), health(2), stress(-5), rel('sibling', 4)], text: 'Stories under the moon, food by firelight, and a tradition you will remember always.' }),
      ch('greet', { label: 'Greet every elder properly and run errands', fx: [rep(5), happy(3), rel('mother', 3)], text: 'The elders bless you. One gives you ₦200. Another gives you a lecture. Both count.' }),
      ch('cry', { label: 'Complain about the road and the mosquitoes', fx: [happy(-2), rep(-1), stress(2)], text: 'Grandmother says: "In my days we walked." You sigh and sit very still.' }),
    ] }),
  ev({ id: 'evt_c_malaria', title: 'Fever and malaria', stage: C, w: 4, cd: 5, who: 'mother',
    text: "You wake up hot and shivering. {mother} touches your forehead, makes the face that mothers make, and is already searching for her handbag. \"Malaria,\" she says. She is rarely wrong.",
    choices: [
      ch('clinic', { label: 'Go to the clinic', cost: { cash: 30000 }, fx: [health(-2), happy(-3), rel('mother', 4), flag('healthy', true)], text: 'A quick test, injections that sting, and two days of rest. You recover. The nurse gives you a sweet.' }),
      ch('herbal', { label: 'Try herbal remedies first', risk: 'risky', check: { stat: 'health', difficulty: 45 }, out: {
        success: { effects: [health(-3), happy(-3)], text: 'The bitter drink is worse than the malaria, but you pull through.' },
        fail: { effects: [health(-12), happy(-6), cash(-60000)], text: 'Day three: you are worse. Off to the hospital you go, and the bill is bigger.' } } }),
    ] }),
  ev({ id: 'evt_c_football', title: 'Street football', stage: C, w: 7, cd: 3,
    text: "The boys on your street have formed a team and need one more player. The pitch is a stretch of tarred road between two parked cars. The ball is a nylon bag tied tight with string.",
    choices: [
      ch('play', { label: 'Join and play like Okocha', cost: { energy: 8 }, check: { stat: 'health', difficulty: 50 }, out: {
        success: { effects: [happy(8), rep(3), health(3), rel('friend', 5)], text: 'You score a goal that will be retold for years, getting bigger each time.' },
        fail: { effects: [happy(3), health(-2), stress(-3)], text: 'You miss the open goal and trip over a stone. Still the best afternoon of the week.' } } }),
      ch('ref', { label: 'Referee (and favour your friends)', fx: [rep(-1), happy(4), rel('friend', 3)], text: 'Your whistle is just a loud mouth. The decisions are final. Mostly.' }),
    ] }),
  ev({ id: 'evt_c_uniform', title: 'The uniform tailor', stage: C, w: 4, cd: 5,
    text: "The tailor promised your uniform for resumption, but it is the night before and his shop is locked. {mother} is standing in the corridor with her wrapper and the face of a woman who will find that tailor.",
    choices: [
      ch('wait', { label: 'Wait for the tailor outside his shop', fx: [stress(2), rel('mother', 2), happy(-1)], text: 'He appears at 9 p.m. with excuses and a perfect uniform. All is forgiven.' }),
      ch('old', { label: 'Wear last year\'s uniform, it is fine', fx: [rep(-2), happy(-2)], text: 'The sleeves are short and everybody knows. Confidence is the best fabric.' }),
    ] }),
  ev({ id: 'evt_c_water', title: 'Sachet water business', stage: C, w: 4, cd: 4, when: { all: [{ ageBetween: [9, 11] }] },
    text: "Your neighbour offers you a deal: carry a tray of sachet water to the park on Saturday and keep one naira out of every five. A small business is waiting.",
    choices: [
      ch('sell', { label: 'Take the tray and sell', cost: { energy: 10 }, check: { stat: 'hustle', difficulty: 30 }, out: {
        success: { effects: [hustle(25000), rep(2), happy(3)], text: 'The sun was hot, the sales were better.' },
        fail: { effects: [hustle(5000), stress(2)], text: 'You sold three sachets and drank four.' } } }),
      ch('pass', { label: 'Stay home and watch cartoons', fx: [happy(3), health(-1)], text: 'A good day to do absolutely nothing.' }),
    ] }),
  ev({ id: 'evt_c_late', title: 'Late for school', stage: C, w: 6, cd: 3, when: { all: [{ inSchool: true }] },
    text: "You overslept, and now the school bell is ringing three streets away. Gate-closing time is in five minutes, and the prefect at the gate is known to be merciless.",
    choices: [
      ch('run', { label: 'Run as fast as you can', cost: { energy: 8 }, check: { stat: 'health', difficulty: 45 }, out: {
        success: { effects: [rep(2), happy(2), health(1)], text: 'You slide through the gate as it is closing. The prefect writes your name anyway.' },
        fail: { effects: [happy(-3), rep(-1), stress(2)], text: 'The gate shuts in your face. You clean the corridor as punishment.' } } }),
      ch('excuse', { label: 'Tell the prefect a long, creative story', fx: [rep(-1), happy(1)], text: '"My mother\'s goat fell sick." The prefect has heard worse. You are let in with a warning.' }),
    ] }),
  ev({ id: 'evt_c_teacher', title: 'The teacher who believed in you', stage: C, w: 5, cd: 6, when: { all: [{ inSchool: true }, { stat: ['knowledge', '>=', 25] }] },
    text: "Your class teacher stays back after school, holds up your exercise book and says, \"this child will go far\". She gives you extra reading and a stern warning not to waste it.",
    choices: [
      ch('listen', { label: 'Take the extra lessons seriously', cost: { energy: 10 }, fx: [know(6), rep(2), happy(2), flag('mentorTeacher')], text: 'You work. She watches. One day you will thank her, and she will pretend she forgot.' }),
      ch('shrug', { label: 'Smile, nod, and go play', fx: [happy(3), know(1)], text: 'The opportunity waits patiently. It does not wait forever.' }),
    ] }),
  ev({ id: 'evt_c_harmattan', title: 'Harmattan season', stage: C, w: 4, cd: 3, tags: ['season'],
    text: "The Harmattan wind has arrived, dusty and dry. Your lips crack, the mornings are cold, and every cough in the neighbourhood is shared. Mama is rubbing shea butter on everyone like it is a family tradition.",
    choices: [
      ch('care', { label: 'Use the shea butter and drink water', fx: [health(2), happy(1), flag('harmattanSurvivor')], text: 'You emerge with soft lips and a clean conscience.' }),
      ch('ignore', { label: 'Ignore it, it will pass', fx: [health(-3), happy(-1)], text: 'Your lips look like a map of Nigeria. Mama does not stop talking about it.' }),
    ] }),
  ev({ id: 'evt_c_borrow', title: 'The borrowed toy', stage: C, w: 4, cd: 5, who: 'friend',
    text: "{friend} lends you a toy car, your favourite thing in the world, but the wheel has just fallen off in your hands. {friend} is about to arrive and ask for it back.",
    choices: [
      ch('confess', { label: 'Confess immediately', fx: [rep(2), rel('friend', -2), happy(-1)], text: '{friend} frowns for exactly one minute, then forgives you for a biscuit.' }),
      ch('fix', { label: 'Try to fix it with gum and hope', risk: 'risky', check: { stat: 'knowledge', difficulty: 35 }, out: {
        success: { effects: [know(2), rel('friend', 4), happy(3)], text: 'The wheel stays. You are suddenly "the engineer".' },
        fail: { effects: [rel('friend', -5), happy(-3)], text: 'The wheel falls off in front of everybody. Silence.' } } }),
    ] }),
]
