import type { GameEvent } from '@engine/core/types'
import { ev, ch, cash, happy, know, rep, stress, health, rel, flag, inc, moment, hustle } from './dsl'

const Y: GameEvent['stage'] = ['youngAdult']

export const youngAdultEvents: GameEvent[] = [
  ev({ id: 'evt_y_owambe', title: 'Owambe invitation', stage: ['youngAdult', 'adult'], w: 8, cd: 2, tags: ['celebration', 'h:yoruba'], when: { all: [{ stat: ['reputation', '>=', 15] }] },
    text: "{friend}'s cousin is getting married on Saturday. Aso-ebi is already in the family WhatsApp group. Rice, suya, a live band, and an MC who will not let you sit down.",
    choices: [
      ch('go', { label: 'Buy the aso-ebi and go', cost: { cash: 15000 }, risk: 'safe', fx: [happy(5), rep(3), rel('friend', 5)], text: 'You danced, you ate, you were photographed. The aso-ebi fit "like a promise".' }),
      ch('spray', { label: 'Go and spray money like a boss', cost: { cash: 90000 }, risk: 'gamble', check: { stat: 'charm', difficulty: 40 }, out: {
        success: { effects: [rep(8), happy(6), flag('legendarySprayer'), moment('Sprayed big at an owambe.')], text: 'The MC calls your name three times. Legendary.' },
        fail: { effects: [rep(-1), happy(-1)], text: 'You spray everything and still end up behind the speakers.' } } }),
      ch('skip', { label: 'Not today, sapa is real', fx: [energy10(), rel('friend', -2)], text: 'You rest at home with plain rice and honest accounting.' }),
    ] }),
  ev({ id: 'evt_y_black_tax', title: 'A call from home', stage: ['youngAdult', 'adult'], w: 9, cd: 2, who: 'mother', when: { all: [{ ageBetween: [22, 70] }, { any: [{ employed: true }, { cashAtLeast: 400000 }] }] },
    text: "{mother} calls. She starts with \"how are you\" and \"have you eaten\", which means the real request is coming. Your cousin needs school fees, an uncle needs medical help, and the roof needs repairs. You are suddenly the family's bank.",
    choices: [
      ch('give', { label: 'Send the money (₦300,000)', cost: { cash: 300000 }, fx: [rel('mother', 7), rep(4), happy(2), inc('blackTaxPaid')], text: 'The family prays for you for an hour. You hear your name in three languages.' }),
      ch('half', { label: 'Send what you can (₦100,000)', cost: { cash: 100000 }, fx: [rel('mother', 3), rep(1), inc('blackTaxPaid')], text: 'It helps, a little. Your cousin\'s "thank you" had a long pause in it.' }),
      ch('refuse', { label: 'Explain your own bills and refuse', fx: [rel('mother', -8), rep(-3), stress(4), happy(-3)], text: 'The silence on the phone was louder than the generator.' }),
    ] }),
  ev({ id: 'evt_y_landlord', title: 'Landlord and the rent hike', stage: ['youngAdult', 'adult'], w: 6, cd: 3, when: { all: [{ housing: 'rent' }] },
    text: "Baba Landlord knocks at 7 a.m. with a smile and a new tenancy agreement. The rent has increased by 30%, because \"everything is expensive\". The estate levy is also \"under review\".",
    choices: [
      ch('pay', { label: 'Pay and keep quiet', cost: { cash: 200000 }, fx: [stress(2), rep(1)], text: 'You pay. He smiles even wider. He does not fix the gate.' }),
      ch('negotiate', { label: 'Negotiate with facts', risk: 'risky', check: { stat: 'charm', difficulty: 38 }, out: {
        success: { effects: [rep(3), stress(-1), cash(60000)], text: 'He drops the increase by half, and complains about it for a week.' },
        fail: { effects: [rep(-1), stress(4), cash(-300000)], text: 'You argued well and still paid more. Landlords have the last word.' } } }),
      ch('move', { label: 'Look for another place', cost: { cash: 80000 }, fx: [stress(5), happy(-2), cash(40000)], text: 'House hunting. A week of agents, "just five minutes away", and dust.' }),
    ] }),
  ev({ id: 'evt_y_omo_onile', title: 'Omo onile at the gate', stage: ['youngAdult', 'adult'], w: 4, cd: 6, when: { all: [{ cashAtLeast: 800000 }] },
    text: "You went to inspect land, and suddenly four men appear from nowhere. \"Welcome, Oga. We are the omo onile. A small something for the community before you start.\" They have no paper, only confidence.",
    choices: [
      ch('pay', { label: 'Pay "settlement" and move on', cost: { cash: 200000 }, fx: [stress(3), rep(1)], text: 'You pay the fee. They shake your hand and vanish into the bush.' }),
      ch('lawyer', { label: 'Call a lawyer and verify the land papers', cost: { cash: 80000 }, check: { stat: 'knowledge', difficulty: 35 }, out: {
        success: { effects: [know(2), stress(1), rep(2)], text: 'The documents were clean. The omo onile were not. You walk away safe.' },
        fail: { effects: [stress(5), rep(-1)], text: 'Paper trail: long. Patience: short. The deal collapses.' } } }),
      ch('leave', { label: 'Walk away and rent instead', fx: [happy(-1)], text: 'Some land is not worth the headache.' }),
    ] }),
  ev({ id: 'evt_y_hostel', title: 'Hostel life', stage: Y, w: 8, cd: 2, when: { all: [{ eduLevel: ['university', 'polytechnic'] }] },
    text: "Hostel life: eight to a room, one socket, and a gas cooker that argues with the rule of law. Someone ate your noodles again, and the \"Hall Master\" is checking bedsheets.",
    choices: [
      ch('cook', { label: 'Start a mini food business in the hostel', cost: { energy: 12 }, check: { stat: 'hustle', difficulty: 35 }, out: {
        success: { effects: [hustle(110000), rep(3), happy(4)], text: 'Your suya-flavoured noodles are now famous on the whole floor.' },
        fail: { effects: [hustle(15000), stress(3)], text: 'The cooker blew a fuse. The business was short and spicy.' } } }),
      ch('read', { label: 'Study in the reading room', cost: { energy: 12 }, fx: [know(4), stress(2)], text: 'The reading room is silent, except for a boy with loud snoring.' }),
      ch('social', { label: 'Join the party hall night', fx: [happy(7), rep(3), know(-2), health(-1)], text: 'Music, jollof, a bad dance move and a good story.' }),
    ] }),
  ev({ id: 'evt_y_strike', title: 'Lecturers\' strike', stage: Y, w: 6, cd: 5, when: { all: [{ eduLevel: ['university', 'polytechnic'] }] },
    text: "The lecturers have announced an indefinite strike. Nobody knows when it will end. The campus is empty, the hostels are quiet, and the corridor politicians are busy predicting the future.",
    choices: [
      ch('skills', { label: 'Learn a skill online', cost: { energy: 14 }, fx: [know(5), rep(2), stress(-1)], text: 'You pick up a new skill. The strike ended soon after, rudely.' }),
      ch('work', { label: 'Take a temporary job', cost: { energy: 14 }, fx: [hustle(150000), stress(2), rep(1)], text: 'You earned a bit. The strike ended and the new semester began.' }),
      ch('home', { label: 'Go home and rest', fx: [happy(5), stress(-4), know(-1), rel('mother', 4)], text: 'Mama feeds you and asks when you will graduate.' }),
    ] }),
  ev({ id: 'evt_y_interview', title: 'Job interview', stage: ['youngAdult', 'adult'], w: 7, cd: 2, when: { all: [{ employed: false }, { eduLevel: 'none' }, { flag: 'pathChosen' }] },
    text: "A company has invited you for an interview. The email says: \"business casual\". Your only business shirt is borrowed. The interview panel has three people, one of whom is eating throughout.",
    choices: [
      ch('prep', { label: 'Prepare thoroughly', cost: { energy: 12 }, check: { stat: 'knowledge', difficulty: 38 }, out: {
        success: { effects: [flag('interviewWin'), rep(2), happy(5), cash(150000)], text: 'You sailed through the panel. HR calls you the same day.' },
        fail: { effects: [happy(-4), stress(3)], text: '"We will call you." They did not call.' } } }),
      ch('connect', { label: 'Call someone you know at the company', risk: 'risky', check: { stat: 'reputation', difficulty: 28 }, out: {
        success: { effects: [flag('nepotism'), happy(4), rep(-1)], text: 'A phone call opens a door. Whether it is fair is another conversation.' },
        fail: { effects: [rep(-3), stress(3)], text: 'Your contact said "I will see what I can do". He saw nothing.' } } }),
    ] }),
  ev({ id: 'evt_y_japa', title: 'The japa question', stage: ['youngAdult', 'adult'], w: 6, cd: 4, tags: ['japa'], when: { all: [{ ageBetween: [22, 40] }, { stat: ['knowledge', '>=', 30] }] },
    text: "Your WhatsApp status list is now 40% \"just landed\" photos. A colleague has packed and gone. Your cousin abroad says: \"the opportunities are real\". Your mother says: \"who will take care of me?\"",
    choices: [
      ch('plan', { label: 'Start preparing seriously (savings, IELTS)', cost: { cash: 250000 }, fx: [know(4), stress(4), flag('japaPlan')], text: 'You book an IELTS slot and start a budget. The dream is now a spreadsheet.' }),
      ch('stay', { label: 'Stay and build here', fx: [rep(2), happy(2), rel('mother', 4)], text: 'You decide to build home. A sign on your desk says: "Naija no go better by itself".' }),
      ch('fantasy', { label: 'Keep dreaming and scroll', fx: [happy(1), stress(2)], text: 'Another night, another \"japa\" reel. The data bundle disappears.' }),
    ] }),
  ev({ id: 'evt_y_fuel', title: 'Fuel queue', stage: ['youngAdult', 'adult'], w: 5, cd: 3,
    text: "Petrol is scarce again. A queue snakes around the junction, and everyone has a theory. You need to reach work, and your generator is almost on empty.",
    choices: [
      ch('queue', { label: 'Join the queue', cost: { energy: 14 }, fx: [stress(3), cash(-20000), health(-1)], text: 'Four hours later, you pay triple and everyone around you has become a friend.' }),
      ch('black', { label: 'Buy from the roadside at black-market price', cost: { cash: 60000 }, fx: [stress(1)], text: 'Costly, quick, and slightly murky. But you reach work on time.' }),
      ch('bike', { label: 'Take a bike or walk', cost: { energy: 10 }, fx: [health(2), stress(1), happy(-1)], text: 'You see the city properly for once. It is hotter than you remember.' }),
    ] }),
  ev({ id: 'evt_y_pos', title: 'POS wahala', stage: ['youngAdult', 'adult'], w: 6, cd: 3,
    text: "You tried to transfer money for rent. The bank app says \"network error\". The POS agent says: \"₦300 for ₦10,000, and no refund\". Your landlord is calling. The queue behind you is growing.",
    choices: [
      ch('pay', { label: 'Pay the POS agent and move on', cost: { cash: 3000 }, fx: [stress(2)], text: 'Painful, quick, and done.' }),
      ch('retry', { label: 'Retry on the app', check: { stat: 'knowledge', difficulty: 30 }, out: {
        success: { effects: [stress(1)], text: 'Third attempt: success. The universe took pity.' },
        fail: { effects: [stress(5), happy(-3), cash(-5000)], text: 'The money left your account but not reached the other side. Customer care will "revert in 24 hours".' } } }),
    ] }),
  ev({ id: 'evt_y_side_gig', title: 'A side gig appears', stage: ['youngAdult', 'adult'], w: 7, cd: 2,
    text: "A friend messages: \"Guy, I have a gig for you. Pays well. Just need you for the weekend.\" It could be events, deliveries, a quick design job, or tutoring. Everyone in Lagos has a gig.",
    choices: [
      ch('take', { label: 'Take the gig', cost: { energy: 14 }, check: { stat: 'hustle', difficulty: 38 }, out: {
        critSuccess: { effects: [hustle(380000), rep(3), happy(5)], text: 'The client loved it and referred two more clients.' },
        success: { effects: [hustle(180000), rep(1)], text: 'Solid pay and a new contact.' },
        fail: { effects: [hustle(30000), stress(3)], text: 'The client paid half and then went silent.' } } }),
      ch('pass', { label: 'Decline, you are tired', fx: [energy10(), happy(2)], text: 'Sometimes the best gig is rest.' }),
    ] }),
  ev({ id: 'evt_y_ponzi', title: 'Double your money in 30 days', stage: ['youngAdult', 'adult'], w: 6, cd: 5, when: { all: [{ cashAtLeast: 300000 }] },
    text: "A colleague wears a new watch and swears an \"investment platform\" doubled his money in a month. He sends you the link and a testimony with five exclamation marks. The platform has a profile photo of a smiling man in a suit.",
    choices: [
      ch('invest', { label: 'Put in ₦300,000', cost: { cash: 300000 }, risk: 'gamble', check: { stat: 'knowledge', difficulty: 70, luck: true }, out: {
        success: { effects: [cash(600000), rep(-1), stress(2)], text: 'You got your money, and a little extra, then the site vanished. Lucky escape.' },
        fail: { effects: [happy(-10), stress(8), rep(-2), moment('Lost money to a fake investment scheme.')], text: 'The platform vanished with your money. The smiling man was a stock photo.' } } }),
      ch('research', { label: 'Research it and report it', fx: [know(3), rep(2)], text: 'The platform is a scam. Your colleague is annoyed, then grateful.' }),
      ch('ignore', { label: 'Ignore it', fx: [happy(0)], text: 'Good sense is expensive, but cheaper than a scam.' }),
    ] }),
  ev({ id: 'evt_y_harmattan', title: 'Harmattan haze', stage: ['youngAdult', 'adult'], w: 4, cd: 3, tags: ['season'],
    text: "The Harmattan has come early. The sky is white, your throat is dry, and your skin is practicing for a desert. The roads are hazy, and flights are delayed. Everyone has a cold and a remedy.",
    choices: [
      ch('care', { label: 'Take care: water, cream, rest', fx: [health(2), flag('harmattanSurvivor')], text: 'You emerge from the Harmattan with soft skin and an intact voice.' }),
      ch('push', { label: 'Push through as usual', fx: [health(-3), stress(2)], text: 'The cough lasted three weeks and became everyone else\'s business.' }),
    ] }),
  ev({ id: 'evt_y_networking', title: 'The networking event', stage: ['youngAdult', 'adult'], w: 5, cd: 3,
    text: "A tech and business meetup is holding in Yaba. Free snacks, a keynote on \"disrupting everything\", and a hundred people holding business cards. You could meet someone important, or at least eat well.",
    choices: [
      ch('work', { label: 'Work the room', cost: { energy: 12 }, check: { stat: 'charm', difficulty: 38 }, out: {
        success: { effects: [rep(5), happy(3), flag('networker')], text: 'Three useful contacts and a job lead. Exhausted but richer.' },
        fail: { effects: [rep(1), stress(2)], text: 'You handed out cards. Nobody gave you theirs.' } } }),
      ch('eat', { label: 'Stay at the snack table', fx: [happy(3), health(1)], text: 'The small chops were first class. The keynote was optional.' }),
    ] }),
  ev({ id: 'evt_y_sibling_help', title: 'Your sibling needs help', stage: ['youngAdult', 'adult'], w: 5, cd: 4, who: 'sibling', when: { all: [{ roleAlive: ['sibling', true] }] },
    text: "{sibling} calls with a shaky voice. There is a problem: school fees, a failed business, or a heartbreak. You are the older, wiser, or richer one, and they say: \"you are the only one I can tell\".",
    choices: [
      ch('help', { label: 'Help with money and advice', cost: { cash: 150000 }, fx: [rel('sibling', 8), rep(2), happy(2)], text: 'The bond grows stronger. "I won\'t forget this," they say. They will mention it often.' }),
      ch('listen', { label: 'Just listen and encourage', fx: [rel('sibling', 5), happy(1)], text: 'Sometimes a good ear is a gift.' }),
      ch('busy', { label: 'Say you are too busy', fx: [rel('sibling', -6), happy(-1)], text: 'The call ended in awkward silence.' }),
    ] }),
  ev({ id: 'evt_y_flatshare', title: 'Roommate wahala', stage: Y, w: 5, cd: 4, when: { all: [{ housing: 'rent' }, { married: false }] },
    text: "Your roommate has started \"borrowing\" your things: your plates, your light bill, your shirts, and, last week, your last indomie. Dishes are piling up, and the generator fuel account is a mystery.",
    choices: [
      ch('talk', { label: 'Have a calm talk', check: { stat: 'charm', difficulty: 32 }, out: {
        success: { effects: [stress(-2), rep(1)], text: 'Peace returns. A house rule list goes on the fridge.' },
        fail: { effects: [stress(3), happy(-2)], text: 'He nodded, apologised, and repeated everything the next day.' } } }),
      ch('move', { label: 'Move out', cost: { cash: 120000 }, fx: [stress(4), happy(1)], text: 'Finding a place is harder than finding patience.' }),
    ] }),
]
function energy10() { return { stat: 'energy' as const, delta: 10 } }
