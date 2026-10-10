import type { GameEvent } from '@engine/core/types'
import { ev, ch, cash, happy, know, rep, stress, health, rel, flag, moment, hustle } from './dsl'

const AD: GameEvent['stage'] = ['adult']

export const adultEvents: GameEvent[] = [
  ev({ id: 'evt_a_village_house', title: 'The village house', stage: AD, w: 5, cd: 6, tags: ['family'], when: { all: [{ cashAtLeast: 2500000 }] },
    text: "The elders in the village have been asking for years: \"when will you build in the family land?\" A cousin brings plans, cement prices, and a sacrificial amount of optimism. A house in the village is a statement.",
    choices: [
      ch('build', { label: 'Start building (₦2,500,000)', cost: { cash: 2500000 }, fx: [rep(8), happy(4), rel('mother', 5), moment('Built a house in the family village.')], text: 'The foundation stones are laid. Elders bless the land. Your name is chanted.' }),
      ch('contribute', { label: 'Contribute a small amount', cost: { cash: 400000 }, fx: [rep(2), happy(1)], text: '"Small small" they say, in the warmest tone.' }),
      ch('no', { label: 'Not now', fx: [rep(-2), stress(1)], text: 'The elders nod. The nod has judgement in it.' }),
    ] }),
  ev({ id: 'evt_a_church_project', title: 'A community project', stage: AD, w: 6, cd: 3, tags: ['faith'],
    text: "The church/mosque/community association is building something new: a hall, a borehole, a clinic. They need donations, volunteers, and \"people of good name\". The treasurer is already looking at you.",
    choices: [
      ch('give', { label: 'Give generously', cost: { cash: 300000 }, fx: [rep(8), happy(5), stress(-3)], text: 'Your name is read out. People shake your hand differently.' }),
      ch('volunteer', { label: 'Volunteer your time instead', cost: { energy: 14 }, fx: [rep(5), happy(4), stress(-2)], text: 'You carried blocks and heard everyone\'s story. A good Saturday.' }),
      ch('excuse', { label: 'Plead a busy schedule', fx: [rep(-3), happy(-1)], text: 'You are told: "God understands." The treasurer looks disappointed.' }),
    ] }),
  ev({ id: 'evt_a_ajo', title: 'The ajo / esusu group', stage: AD, w: 6, cd: 4, tags: ['money'], when: { all: [{ cashAtLeast: 200000 }] },
    text: "A trusted colleague invites you to join an ajo: twelve people contribute ₦50,000 monthly, and each month someone collects the pot. It is how many people built houses and paid fees. You are told to go early in the rotation, or to be patient.",
    choices: [
      ch('join', { label: 'Join and contribute', cost: { cash: 150000 }, fx: [stress(1), rep(2), flag('joinedAjo')], text: 'Month by month, the discipline builds. Your turn arrives. The lump sum feels like a miracle.' }),
      ch('start', { label: 'Start your own group', cost: { cash: 150000 }, risk: 'risky', check: { stat: 'reputation', difficulty: 38 }, out: {
        success: { effects: [rep(7), cash(500000), happy(4)], text: 'Everyone paid on time. You are known as "the organiser".' },
        fail: { effects: [rep(-5), stress(6), cash(-100000)], text: 'One member defaulted and vanished. You covered it. Friendship has a limit.' } } }),
      ch('no', { label: 'Keep your money to yourself', fx: [], text: 'You save alone. Cash feels safe, at least.' }),
    ] }),
  ev({ id: 'evt_a_midlife', title: 'Midlife questions', stage: AD, w: 5, cd: 6, when: { all: [{ ageBetween: [38, 55] }] },
    text: "It is a quiet evening when you realise you are no longer \"young talent\" but \"senior something\". The youth call you \"uncle\"/\"aunty\" without irony. The mirror and the calendar agree.",
    choices: [
      ch('change', { label: 'Try something new: a course, a hobby, a business', cost: { energy: 14 }, fx: [know(4), happy(6), stress(2)], text: 'You enrolled in a weekend class. The teenagers were kind.' }),
      ch('settle', { label: 'Make peace and enjoy what you have', fx: [happy(6), stress(-4)], text: 'Contentment is also a good business plan.' }),
      ch('splurge', { label: 'Splurge: a trip or a new car', cost: { cash: 600000 }, fx: [happy(8), rep(2), stress(-3)], text: 'A big drive, a bigger smile. Your bank sent a concerned message.' }),
    ] }),
  ev({ id: 'evt_a_health', title: 'Health scare', stage: ['adult', 'elder'], w: 6, cd: 4, when: { all: [{ ageBetween: [40, 90] }] },
    text: "A routine check-up becomes a not-so-routine conversation. High blood pressure, a doctor says, and \"you have to slow down\". Your phone is full of advice from relatives who are experts on everything.",
    choices: [
      ch('treat', { label: 'Follow the doctor\'s advice', cost: { cash: 120000 }, fx: [health(6), stress(-3), happy(-1)], text: 'Less salt, more walking. The doctor is suspiciously pleased.' }),
      ch('herbal', { label: 'Mix herbal remedies and hope', risk: 'risky', check: { stat: 'health', difficulty: 45 }, out: {
        success: { effects: [health(2), happy(1)], text: 'Your herbal tea is bitter, but surprisingly effective.' },
        fail: { effects: [health(-9), stress(5), cash(-200000)], text: 'The condition worsened. A bigger hospital bill followed.' } } }),
      ch('ignore', { label: 'Ignore it, work comes first', fx: [health(-6), stress(4)], text: 'You pushed on, and your body noted the debt.' }),
    ] }),
  ev({ id: 'evt_a_burial', title: 'A burial in the family', stage: AD, w: 4, cd: 5, tags: ['family'],
    text: "A senior relative has passed away. The family WhatsApp is full of contribution requests, the village needs a decision, and the date is fixed. In many communities, burial is the biggest social event of the year.",
    choices: [
      ch('big', { label: 'Contribute generously and travel', cost: { cash: 350000, energy: 10 }, fx: [rep(7), happy(-3), stress(3)], text: 'You were seen and counted. The family nods with approval.' }),
      ch('small', { label: 'Send a modest contribution', cost: { cash: 90000 }, fx: [rep(1), happy(-2)], text: 'You sent money and condolences, and the village understood. Mostly.' }),
    ] }),
  ev({ id: 'evt_a_school_fees', title: 'The fees avalanche', stage: AD, w: 7, cd: 3, when: { all: [{ hasChildren: true }] },
    text: "Resumption day: fees, uniform, books, PTA levy, extra lessons, \"development fee\", and a mandatory trip to \"somewhere educational\". A calculator is smoking in your hands.",
    choices: [
      ch('pay', { label: 'Pay everything', cost: { cash: 450000 }, fx: [stress(3), happy(2)], text: 'The receipts are folded neatly. Your child looks great in the new uniform.' }),
      ch('negotiate', { label: 'Negotiate an instalment plan', check: { stat: 'charm', difficulty: 30 }, out: {
        success: { effects: [stress(1), cash(-200000)], text: 'The bursar agrees. The plan is a delicate truce.' },
        fail: { effects: [stress(4), cash(-450000), rep(-1)], text: 'No instalments. Pay or your child waits outside.' } } }),
    ] }),
  ev({ id: 'evt_a_inlaws', title: 'The in-laws visit', stage: AD, w: 5, cd: 4, who: 'partner', when: { all: [{ married: true }] },
    text: "{partner}'s family is visiting for \"a few days\". The few days are now week three. Someone is rearranging your kitchen, and someone else is rearranging your life decisions.",
    choices: [
      ch('welcome', { label: 'Welcome them warmly', cost: { cash: 80000 }, fx: [rel('partner', 6), rep(3), stress(3)], text: 'You cooked, hosted, and smiled. The in-laws left blessing you.' }),
      ch('boundaries', { label: 'Politely set boundaries', check: { stat: 'charm', difficulty: 38 }, out: {
        success: { effects: [stress(-1), rel('partner', 2)], text: 'A tactful talk, a shared plan. Peace returned.' },
        fail: { effects: [rel('partner', -6), stress(5)], text: 'It was heard as rudeness. Relationships got spicy.' } } }),
    ] }),
  ev({ id: 'evt_a_business', title: 'A side business opportunity', stage: AD, w: 6, cd: 4, when: { all: [{ cashAtLeast: 800000 }] },
    text: "A friend brings you a business idea: a small supermarket, a cold room, a farm, a laundry. The numbers look good on paper. On paper, everything looks good.",
    choices: [
      ch('invest', { label: 'Invest (₦800,000)', cost: { cash: 800000 }, risk: 'risky', check: { stat: 'hustle', difficulty: 40 }, out: {
        critSuccess: { effects: [hustle(2200000), rep(5), happy(6), moment('Started a successful side business.')], text: 'The business thrives. You now employ three people.' },
        success: { effects: [hustle(1200000), rep(3), happy(4)], text: 'Steady growth. A new source of income.' },
        fail: { effects: [stress(6), happy(-5)], text: 'The business never found its feet. Lesson: due diligence.' } } }),
      ch('pass', { label: 'Pass', fx: [stress(0)], text: 'You said no. The friend said "okay". The friendship cooled for about a week.' }),
    ] }),
  ev({ id: 'evt_a_harmattan_cold', title: 'Harmattan cold', stage: AD, w: 4, cd: 3, tags: ['season'],
    text: "The Harmattan chill has come early. Your cough is loud, your joints are dramatic, and your neighbour sells you \"special herbal tea\" for ₦500 that tastes like a bush.",
    choices: [
      ch('care', { label: 'Use warm drinks, rest and humidifier', fx: [health(2), flag('harmattanSurvivor')], text: 'You sipped, rested and recovered. The neighbour is mildly hurt.' }),
      ch('push', { label: 'Soldier on', fx: [health(-3), stress(2)], text: 'The cough stayed for a month and made friends.' }),
    ] }),
  ev({ id: 'evt_a_mentor', title: 'Be a mentor', stage: AD, w: 5, cd: 4, when: { all: [{ stat: ['reputation', '>=', 35] }] },
    text: "A young person from your area asks if you can mentor them: career, money, life. They are bright, a little lost, and holding a notebook with your name on the first page.",
    choices: [
      ch('yes', { label: 'Accept and make time', cost: { energy: 12 }, fx: [rep(6), happy(6), flag('mentor')], text: 'They send news every year: a degree, a job, a promotion. You feel proud.' }),
      ch('no', { label: 'Politely decline', fx: [rep(-1)], text: 'The notebook stays closed.' }),
    ] }),
  ev({ id: 'evt_a_jollof', title: 'The jollof argument', stage: ['youngAdult', 'adult'], w: 5, cd: 4, who: 'friend', when: { all: [{ roleAlive: ['friend', true] }] },
    text: "Dinner with {friend} turns political. Someone says \"party jollof is the real jollof\". Someone else mentions another country's version. Plates are lifted. This is how wars start.",
    choices: [
      ch('peace', { label: 'Be diplomatic and call a tie', fx: [rel('friend', 4), rep(2), flag('jollofJudge'), happy(3)], text: 'Peace restored with spoon and fork. You are named Judge of the Jollof.' }),
      ch('fight', { label: 'Defend your side to the end', fx: [rel('friend', -3), happy(2), rep(1)], text: 'You won the argument and lost the leftovers.' }),
    ] }),
]
