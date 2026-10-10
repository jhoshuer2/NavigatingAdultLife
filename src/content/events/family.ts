import type { GameEvent } from '@engine/core/types'
import { ev, ch, happy, know, rep, stress, health, rel, flag, inc, moment, cash } from './dsl'

const AD: GameEvent['stage'] = ['youngAdult', 'adult']

export const familyEvents: GameEvent[] = [
  ev({ id: 'evt_f_meet', title: 'Someone catches your eye', stage: AD, w: 8, cd: 2, when: { all: [{ hasPartner: false }, { married: false }, { ageBetween: [19, 40] }] },
    text: "It might be at an owambe, in the office elevator, at a friend's hangout, or in a danfo with no seat. Someone looks up, smiles, and suddenly the whole world has a soundtrack. {friend} says: \"go and talk to them\".",
    choices: [
      ch('talk', { label: 'Go and say hello', risk: 'risky', check: { stat: 'charm', difficulty: 40 }, out: {
        critSuccess: { effects: [{ spawn: 'partner' }, happy(8), rep(2), moment('Met someone special.')], text: 'Conversation flows like jollof on a Sunday. Numbers exchanged, a date planned.' },
        success: { effects: [{ spawn: 'partner' }, happy(6), moment('Started dating someone.')], text: 'It started awkward, then turned warm. A coffee date is on.' },
        fail: { effects: [happy(-3), rep(-1)], text: 'You said "hello". You also said "I like your shoes", which was the wrong approach.' } } }),
      ch('intro', { label: 'Let {friend} introduce you', fx: [{ spawn: 'partner' }, happy(4), rel('friend', 3)], text: 'A friend-approved introduction. Everyone will claim credit.' }),
      ch('pass', { label: 'Stay single and focus on life', fx: [happy(1), know(1)], text: 'Love can wait, or at least it can pretend to.' }),
    ] }),
  ev({ id: 'evt_f_date', title: 'Date night', stage: AD, w: 8, cd: 1, who: 'partner', when: { all: [{ hasPartner: true }, { married: false }] },
    text: "{partner} suggests a date: nothing too fancy, just \"somewhere nice\", which in Lagos means traffic, a long wait for a table, and a bill with a service charge nobody mentioned.",
    choices: [
      ch('nice', { label: 'Go all out', cost: { cash: 80000 }, fx: [rel('partner', 9), happy(7)], text: 'Candles, jazz, grilled fish. {partner} says the evening was "perfect".' }),
      ch('simple', { label: 'Suya and a walk on the beach', cost: { cash: 15000 }, fx: [rel('partner', 6), happy(5)], text: 'Simple, warm, memorable. The sea breeze did the rest.' }),
      ch('cancel', { label: 'Cancel, you are exhausted', fx: [rel('partner', -6), energy10()], text: '{partner} says "it is fine" in the tone that is not fine.' }),
    ] }),
  ev({ id: 'evt_f_intro', title: 'Meeting the family', stage: AD, w: 7, cd: 2, who: 'partner', tags: ['family'], when: { all: [{ hasPartner: true }, { married: false }, { relAtLeast: ['partner', 55] }, { notSeen: 'evt_f_proposal' }] },
    text: "The big day: you are meeting {partner}'s family. Everyone arrives in their best clothes, the elders watch your every move, and a very large table is set. You have been practising your greeting for a week.",
    choices: [
      ch('greet', { label: 'Greet every elder properly and bring gifts', cost: { cash: 60000 }, risk: 'safe', fx: [rel('partner', 8), rep(5), happy(4)], text: 'The elders nod. Someone says "this one has home training". You have passed the first test.' }),
      ch('casual', { label: 'Keep it casual and friendly', check: { stat: 'charm', difficulty: 38 }, out: {
        success: { effects: [rel('partner', 5), rep(2), happy(3)], text: 'The relaxed approach works. A grandmother pinches your cheek.' },
        fail: { effects: [rel('partner', -4), rep(-3), stress(4)], text: 'You forgot to kneel (or bow), forgot someone\'s name, and used the wrong hand. The room noticed.' } } }),
    ] }),
  ev({ id: 'evt_f_proposal', title: 'The proposal', stage: AD, w: 9, cd: 1, who: 'partner', when: { all: [{ hasPartner: true }, { married: false }, { relAtLeast: ['partner', 68] }, { ageBetween: [22, 48] }] },
    text: "You and {partner} have been together a while. The family keeps asking when. The ring is in your mind, and so are the costs: engagement, traditional wedding, aso-ebi, the hall, the cake, the DJ and a very long guest list.",
    choices: [
      ch('grand', { label: 'Grand traditional + white wedding (₦3,000,000)', cost: { cash: 3000000 }, fx: [{ marry: true }, flag('weddingPlanned'), happy(15), rep(10), stress(5), moment('Had a grand wedding.')], text: 'Two ceremonies, five outfits, and a dance floor that never emptied. The whole city knows.' }),
      ch('small', { label: 'Intimate wedding with close family (₦700,000)', cost: { cash: 700000 }, fx: [{ marry: true }, flag('weddingPlanned'), happy(11), rep(4), moment('Had an intimate wedding.')], text: 'Warm, small, and perfect. The cost was easier than the guest list.' }),
      ch('court', { label: 'Court wedding and a quiet lunch (₦150,000)', cost: { cash: 150000 }, fx: [{ marry: true }, flag('weddingPlanned'), happy(8), rep(-1), moment('Married at the registry.')], text: 'Papers signed, smiles shared. The families grumbled for about a month.' }),
      ch('wait', { label: 'Not yet', fx: [rel('partner', -8), stress(3), happy(-3)], text: '{partner} nods slowly. The question hangs in the air.' }),
    ] }),
  ev({ id: 'evt_f_wedding_yoruba', title: 'The wedding day', scripted: true, once: true, who: 'partner', tags: ['h:yoruba'], when: { all: [{ flag: 'weddingPlanned' }, { heritage: 'yoruba' }] },
    text: "The engagement ceremony starts with a long exchange of greetings and proverbs. The families trade letters and gifts, the bride's friends tease you at the gate, and finally the \"iyawo\" appears in aso-oke and gele as the whole hall erupts. The MC says: \"the owambe has begun\".",
    choices: [
      ch('dance', { label: 'Dance, and let the whole party love you', fx: [happy(8), rep(5), rel('partner', 6), flag('weddingPlanned', false)], text: 'You danced until your shoes surrendered. The money spraying was "legendary".' }),
      ch('respect', { label: 'Focus on the elders\' blessings and rites', fx: [rep(7), happy(5), rel('partner', 5), flag('weddingPlanned', false)], text: 'The prayers were long and loving. The elders cried a little.' }),
    ] }),
  ev({ id: 'evt_f_wedding_igbo', title: 'The wedding day', scripted: true, once: true, who: 'partner', tags: ['h:igbo'], when: { all: [{ flag: 'weddingPlanned' }, { heritage: 'igbo' }] },
    text: "At the traditional wedding (igba nkwu), the kola nut is blessed and broken, and the elders pour palm wine. The bride moves through the crowd to find you with a cup, and finally lifts it to your lips. Wrappers, coral beads, and the whole kindred shout in joy.",
    choices: [
      ch('sing', { label: 'Join the dancing and the masquerade', fx: [happy(8), rep(5), rel('partner', 6), flag('weddingPlanned', false)], text: 'You learned the dance in ten seconds and remembered it for ten years.' }),
      ch('respect', { label: 'Honour the elders with the kola nut rites', fx: [rep(7), happy(5), rel('partner', 5), flag('weddingPlanned', false)], text: 'The kola nut was broken. Prayers rose into the air.' }),
    ] }),
  ev({ id: 'evt_f_wedding_hausa', title: 'The wedding day', scripted: true, once: true, who: 'partner', tags: ['h:hausa'], when: { all: [{ flag: 'weddingPlanned' }, { heritage: 'hausa' }] },
    text: "The wedding begins with the fatiha and the sadaki, followed by days of henna (lalle) for the bride and her friends. The drums rise and the guests arrive in their finest babban riga and hijab. The feast is huge, and the blessings are huge too.",
    choices: [
      ch('feast', { label: 'Celebrate with family and community', fx: [happy(8), rep(5), rel('partner', 6), flag('weddingPlanned', false)], text: 'Food for days, music for nights. The whole neighbourhood is fed.' }),
      ch('respect', { label: 'Focus on the prayers and traditions', fx: [rep(7), happy(5), rel('partner', 5), flag('weddingPlanned', false)], text: 'A peaceful, dignified wedding. The elders were very pleased.' }),
    ] }),
  ev({ id: 'evt_f_wedding_mix', title: 'The wedding day', scripted: true, once: true, who: 'partner', tags: [], when: { all: [{ flag: 'weddingPlanned' }, { heritage: 'mix' }] },
    text: "Two families, many traditions, one big wedding. Your aunties are arguing about the colour of the aso-ebi, a drummer from one side is competing with a DJ from the other, and the jollof is hot. Everybody wants a speech.",
    choices: [
      ch('mix', { label: 'Blend the customs and celebrate everything', fx: [happy(9), rep(6), rel('partner', 6), flag('weddingPlanned', false)], text: 'A magical mix of songs and dishes. Even the aunties agreed.' }),
      ch('simple', { label: 'Keep it simple and let love lead', fx: [happy(7), rep(3), rel('partner', 6), flag('weddingPlanned', false)], text: 'A calm celebration. The cake was good.' }),
    ] }),
  ev({ id: 'evt_f_baby', title: 'A new arrival', stage: AD, w: 8, cd: 1, who: 'partner', when: { all: [{ married: true }, { ageBetween: [22, 42] }, { flagAbsent: 'noMoreKids' }], not: [{ flagAtLeast: ['kidsBorn', 3] }] },
    text: "{partner} has some news: a baby is coming. The relatives are already planning to \"come and help\" (for six months). Names are being suggested in three languages. Your life is about to change.",
    choices: [
      ch('yes', { label: 'Welcome the baby with joy', cost: { cash: 180000 }, fx: [{ child: true }, inc('kidsBorn'), flag('namingDue'), happy(12), stress(5), rel('partner', 6)], text: 'A tiny hand wraps around your finger. The whole family comes for the naming.' }),
      ch('later', { label: 'Say you are not ready yet', fx: [rel('partner', -3), stress(2)], text: 'You decide to wait. The aunties are shocked.' }),
    ] }),
  ev({ id: 'evt_f_naming', title: 'The naming ceremony', scripted: true, once: false, tags: ['family'], when: { all: [{ flag: 'namingDue' }] },
    text: "The naming ceremony is a joyful gathering: a baby, a bowl of honey, some salt, water, a kola nut, and a lot of prayers. The elders pronounce the name and give blessings. Everyone dances and eats, and the baby sleeps through it all.",
    choices: [
      ch('big', { label: 'Host a big celebration', cost: { cash: 350000 }, fx: [rep(6), happy(8), flag('namingDue', false)], text: 'The compound was full, the food was endless, and the baby got twenty names.' }),
      ch('small', { label: 'Keep it small and family-only', cost: { cash: 60000 }, fx: [rep(2), happy(5), flag('namingDue', false)], text: 'Intimate and warm. The baby approved.' }),
    ] }),
  ev({ id: 'evt_f_kid_school', title: 'Choosing a school', stage: ['adult', 'youngAdult'], w: 6, cd: 5, when: { all: [{ hasChildren: true }] },
    text: "Your child is ready for school, and the options are many: a public school close to home, a private school with air-conditioned classrooms, or a good federal unity college a state away. Every option has a different cost and a different dream.",
    choices: [
      ch('private', { label: 'Private school (high fees)', cost: { cash: 400000 }, fx: [happy(3), stress(3), rep(3)], text: 'The uniforms are crisp, the bus is yellow, and the fees are painful.' }),
      ch('public', { label: 'Good public school', fx: [happy(1), rep(1)], text: 'Overcrowded classes, but a strong teacher makes it work.' }),
      ch('lessons', { label: 'Public school plus extra lessons', cost: { cash: 120000 }, fx: [happy(2), know(1)], text: 'The best of both budgets.' }),
    ] }),
  ev({ id: 'evt_f_kid_sick', title: 'Child is ill', stage: ['adult', 'youngAdult'], w: 5, cd: 4, when: { all: [{ hasChildren: true }] },
    text: "It is 2 a.m. and your child's fever is high. The nearest hospital is across town, and a nurse neighbour says: \"take them now\". You gather your things and the keys, and pray the road is clear.",
    choices: [
      ch('hospital', { label: 'Rush to the private hospital', cost: { cash: 160000 }, fx: [stress(5), happy(-2), health(-1)], text: 'Treated, stable, and sleeping. The bill was big, but the relief was bigger.' }),
      ch('clinic', { label: 'Go to the nearby clinic', cost: { cash: 40000 }, check: { stat: 'reputation', difficulty: 15 }, out: {
        success: { effects: [stress(3), happy(-1)], text: 'The clinic did well. By morning the fever broke.' },
        fail: { effects: [stress(8), cash(-120000)], text: 'The clinic referred you to a bigger hospital. Time and money wasted.' } } }),
    ] }),
  ev({ id: 'evt_f_marriage', title: 'Rough patch at home', stage: AD, w: 6, cd: 3, who: 'partner', when: { all: [{ married: true }] },
    text: "You and {partner} have been arguing about money, in-laws, who forgot to fix the generator, and \"what you said last Christmas\". The silence at dinner is thick enough to cut.",
    choices: [
      ch('talk', { label: 'Have a long, honest talk', check: { stat: 'charm', difficulty: 32 }, out: {
        success: { effects: [rel('partner', 10), happy(5), stress(-4)], text: 'You listened, and so did they. Hard talks make strong homes.' },
        fail: { effects: [rel('partner', -3), stress(3)], text: 'You talked, they talked, nobody listened.' } } }),
      ch('counsel', { label: 'See a counsellor or elder', cost: { cash: 40000 }, fx: [rel('partner', 8), happy(4), stress(-3)], text: 'A neutral voice helped. The advice was very Nigerian: pray, talk, and never go to bed angry.' }),
      ch('avoid', { label: 'Avoid the issue', fx: [rel('partner', -8), stress(5), happy(-4)], text: 'Avoiding it does not make it go away. It just makes it louder later.' }),
    ] }),
  ev({ id: 'evt_f_breakup', title: 'A difficult conversation', stage: AD, w: 7, cd: 2, who: 'partner', when: { all: [{ hasPartner: true }, { married: false }], not: [{ relAtLeast: ['partner', 45] }] },
    text: "{partner} asks to talk, and the way they say it already tells you. Weeks of mixed signals, missed calls, and \"I am just busy\" have led here. It is not dramatic, just sad.",
    choices: [
      ch('fight', { label: 'Fight for the relationship', check: { stat: 'charm', difficulty: 45 }, out: {
        success: { effects: [rel('partner', 18), happy(4)], text: 'You listened, apologised, and made a plan. The relationship survives.' },
        fail: { effects: [{ endPartner: true }, happy(-9), stress(4)], text: 'It was over before the conversation ended.' } } }),
      ch('accept', { label: 'Accept it and part kindly', fx: [{ endPartner: true }, happy(-6), stress(2), rep(1)], text: 'It hurts. You stay classy, and a friend delivers ice cream.' }),
    ] }),
  ev({ id: 'evt_f_temptation', title: 'A dangerous attraction', stage: ['adult', 'youngAdult'], w: 4, cd: 6, when: { all: [{ any: [{ married: true }, { hasPartner: true }] }, { stat: ['reputation', '>=', 30] }] },
    text: "A colleague has started messaging you at odd hours with \"how was your day?\" and heart emojis. The attention feels good. Your phone is on the table, and the screen lights up again.",
    choices: [
      ch('block', { label: 'Set boundaries and block', fx: [rep(2), rel('partner', 4), stress(2)], text: 'Awkward for a week, then back to normal. You feel proud.' }),
      ch('flirt', { label: 'Flirt a little', risk: 'gamble', check: { stat: 'reputation', difficulty: 40 }, out: {
        success: { effects: [happy(2), stress(3)], text: 'Nothing happened. You are not sure why you are not proud.' },
        fail: { effects: [rel('partner', -25), rep(-8), happy(-8), stress(8), moment('A betrayal damaged a relationship.')], text: 'Your partner found the messages. The silence was loud, and the damage was deep.' } } }),
    ] }),
  ev({ id: 'evt_f_parent_ill', title: 'A parent falls ill', stage: ['youngAdult', 'adult', 'elder'], w: 5, cd: 4, who: 'mother', when: { all: [{ any: [{ roleAlive: ['mother', true] }, { roleAlive: ['father', true] }] }, { ageBetween: [24, 70] }] },
    text: "{mother} has been complaining of pain for weeks, and now the doctor says she needs tests, a scan, and maybe an operation. The bills are long. Your siblings are \"checking\". Everyone looks at you.",
    choices: [
      ch('pay', { label: 'Cover the treatment (₦500,000)', cost: { cash: 500000 }, fx: [rel('mother', 12), rep(5), stress(4), happy(1)], text: 'The treatment worked. {mother} gave you her best blessing, the long one.' }),
      ch('share', { label: 'Share the cost with siblings', cost: { cash: 180000 }, fx: [rel('mother', 6), rep(2), stress(3)], text: 'A family meeting, a WhatsApp group, and eventually, everyone contributed. Nearly.' }),
      ch('cannot', { label: 'Say you cannot afford it', fx: [rel('mother', -8), rep(-4), happy(-6), stress(6)], text: 'You were honest, but guilt followed you for months.' }),
    ] }),
]
function energy10() { return { stat: 'energy' as const, delta: 10 } }
