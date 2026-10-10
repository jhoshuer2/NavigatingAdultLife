import type { GameEvent } from '@engine/core/types'
import { ev, ch, cash, happy, know, rep, stress, rel, flag, moment, edu, school } from './dsl'

export const scriptedEvents: GameEvent[] = [
  ev({
    id: 'evt_first_day', title: 'First day of school', scripted: true, once: true, stage: ['child'], who: 'mother',
    when: { all: [{ ageBetween: [6, 6] }] },
    text: "It is your first morning in a school uniform that is two sizes too big (\"you will grow into it\"). {mother} fixes your collar, wipes your face with the same cloth that wipes everything, and walks you to the gate. Inside, forty children are shouting at once.",
    choices: [
      ch('brave', { label: 'March in like you own the place', fx: [rep(2), happy(2), flag('brave')], text: 'The class monitor salutes you. Nobody is sure why.' }),
      ch('shy', { label: 'Hold on to {mother} for ten extra minutes', fx: [rel('mother', 4), happy(1), stress(2)], text: '{mother} tells the teacher "she is just warming up". You are not warming up.' }),
      ch('friend', { label: 'Share your biscuit with the child next to you', fx: [rel('friend', 8), happy(3), rep(1)], text: 'Friendship in Nigeria is simple: biscuit equals padi forever.' }),
    ],
  }),
  ev({
    id: 'evt_post_sss', title: 'What next after secondary school?', scripted: true, stage: ['teen', 'youngAdult'],
    when: { all: [{ eduLevel: 'none' }, { flagAbsent: 'pathChosen' }, { ageBetween: [17, 24] }, { flag: 'examResult' }] },
    text: "The results are out. {mother} is already telling the neighbours, and the neighbours already have opinions: university, polytechnic, learn a trade, or start making money? Every uncle in the family has a different answer, delivered loudly.",
    choices: [
      ch('federal', { label: 'Federal university', hint: '4 years. Cheap fees, tough competition.', requires: { all: [{ flag: 'examPassed' }] }, risk: 'risky',
        check: { stat: 'knowledge', difficulty: 52 },
        out: {
          critSuccess: { effects: [edu('university'), school('federal'), flag('pathChosen'), happy(10), rep(4), moment('Won admission into a federal university.')], text: 'Admitted on merit! The family WhatsApp group will not sleep tonight.' },
          success: { effects: [edu('university'), school('federal'), flag('pathChosen'), happy(7), moment('Gained admission into a federal university.')], text: 'Admission list: your name is there. Third line. You screamed.' },
          fail: { effects: [happy(-4), stress(4), flag('missedFederal')], text: 'The cut-off mark won this round. You can try another path, or wait a year.' },
        } }),
      ch('private', { label: 'Private university', hint: '4 years. Easy admission, heavy fees.', requires: { all: [{ flag: 'examPassed' }] }, fx: [edu('university'), school('private'), flag('pathChosen'), happy(4), stress(3), moment('Started private university.')], text: 'Admission was almost instant. The fee schedule was not.' }),
      ch('poly', { label: 'Polytechnic (OND)', hint: '2 years of practical training.', requires: { all: [{ flag: 'examPassed' }] }, fx: [edu('polytechnic'), flag('pathChosen'), happy(4)], text: 'Practical classes, workshops, and teachers who say "theory is for those who fear work".' }),
      ch('apprentice', { label: 'Learn a trade (apprenticeship)', hint: '3 years, then your own skills and customers.', cost: { cash: 0 }, fx: [edu('apprentice'), flag('pathChosen'), happy(2), rel('mother', -2)], text: 'You sign up under a master in the market. {mother} sighs, then prays, then packs you food.' }),
      ch('work', { label: 'Go straight to work and hustle', hint: 'Start earning now, but doors need credentials.', fx: [flag('pathChosen'), happy(2), rep(1), stress(2)], text: 'No school, no problem. The market has lessons too.' }),
      ch('resit', { label: 'Resit the exams', hint: 'One more year of study. Try again.', requires: { all: [{ flagEq: ['examResult', 'fail'] }] }, fx: [{ resit: true }, stress(3), happy(-2)], text: 'You open your books again. Past questions will be your closest friend.' }),
    ],
  }),
  ev({
    id: 'evt_move_out', title: 'Time to find your own place', scripted: true, stage: ['youngAdult', 'adult'],
    when: { all: [{ housing: 'family' }, { ageBetween: [22, 45] }, { eduLevel: 'none' }, { flag: 'pathChosen' }, { any: [{ employed: true }, { cashAtLeast: 700000 }] }] },
    text: "Mama has started saying \"in my house\" more often. The agent says: one year rent upfront, agent fee, legal fee, and a caution deposit. The landlord says his generator is \"everyone's generator\". Welcome to adulthood.",
    choices: [
      ch('stay', { label: 'Stay with family and save', fx: [happy(-2), stress(2), rel('mother', 3)], text: '"The money you save is the money you save," says every uncle ever. Privacy is overrated.' }),
      ch('room', { label: 'Shared room (cheap)', cost: { cash: 40000 }, fx: [{ housing: { tier: 0 } }, happy(2), stress(3), flag('movedOut'), moment('Moved out for the first time.')], text: '"Face-me-I-face-you." You know all your neighbours\' business, and they know yours.' }),
      ch('mini', { label: 'Mini-flat (comfortable)', cost: { cash: 120000 }, fx: [{ housing: { tier: 1 } }, happy(5), flag('movedOut'), moment('Moved into a flat of your own.')], text: 'Your own door, your own key, and your own electricity bill. Freedom has a price.' }),
      ch('flat', { label: 'Two-bedroom flat (big spender)', cost: { cash: 280000 }, requires: { all: [{ cashAtLeast: 2000000 }] }, fx: [{ housing: { tier: 2 } }, happy(7), rep(3), flag('movedOut'), moment('Moved into a big flat.')], text: 'Tiled floors. A real kitchen. Your mother asks how much it costs and then asks God to forgive you.' }),
    ],
  }),
  ev({
    id: 'evt_nysc', title: 'NYSC call-up letter', scripted: true, once: true, stage: ['youngAdult'],
    when: { all: [{ flag: 'pendingNYSC' }, { ageBetween: [20, 30] }] },
    text: "Your NYSC call-up letter has arrived. Three weeks of orientation camp: khaki, early morning parades, boots that fight you, and a certificate at the end. Where will they post you? Everyone in the family knows \"somebody\" who can change it.",
    choices: [
      ch('serve', { label: 'Accept the posting and serve with joy', fx: [rep(4), happy(5), know(2), flag('nyscDone'), flag('pendingNYSC', false), cash(300000), moment('Completed NYSC.')], text: 'Camp food, new padis from other tribes, a CDS group that actually did something. You come out changed.' }),
      ch('uncle', { label: 'Call Uncle for a "better" posting', risk: 'risky', check: { stat: 'reputation', difficulty: 25 }, fx: [],
        out: {
          success: { effects: [happy(3), rep(1), flag('nyscDone'), flag('pendingNYSC', false), flag('nepotism'), cash(450000), moment('Served in a comfortable posting.')], text: 'The posting changes. You wonder if you owe Uncle forever. You do.' },
          fail: { effects: [happy(-3), rep(-3), flag('nyscDone'), flag('pendingNYSC', false), cash(200000), stress(4)], text: 'The "connection" collected money, then blocked your number. You serve exactly where you were sent.' },
        } }),
      ch('hustle', { label: 'Serve and run a side business at the same time', fx: [cash(500000), stress(5), rep(2), flag('nyscDone'), flag('pendingNYSC', false), moment('Hustled through NYSC.')], text: 'Wednesday CDS, Thursday deliveries, Friday exhaustion. Allowee plus gains: not bad.' }),
    ],
  }),
  ev({
    id: 'evt_loss', title: 'A heavy loss', scripted: true, stage: ['teen', 'youngAdult', 'adult', 'elder'], who: 'mother',
    when: { all: [{ flag: 'lostName' }] },
    text: "The phone rings late, and the voice is the kind you never forget. {lost}, your {lostRole}, has passed away. Relatives are already planning the funeral: aso-ebi, the venue, who will cook, who will speak. The village wants everyone to come home.",
    choices: [
      ch('full', { label: 'Travel home and give a befitting send-off', cost: { cash: 450000 }, fx: [rep(6), happy(-8), stress(6), flag('lostName', ''), moment('Gave a loved one a dignified send-off.')], text: 'You carry the grief and the cost, and the village says: "{name} did the right thing."' }),
      ch('simple', { label: 'Contribute and attend a simple service', cost: { cash: 120000 }, fx: [rep(2), happy(-6), stress(3), flag('lostName', '')], text: 'You say goodbye in your way. It is enough, even if some relatives mutter.' }),
      ch('cannot', { label: 'Send money and stay (work, bills, guilt)', cost: { cash: 60000 }, fx: [rep(-4), happy(-10), stress(8), flag('lostName', '')], text: 'You told yourself it was practical. The guilt sat beside you for months.' }),
    ],
  }),
  ev({
    id: 'evt_buy_home', title: 'Build or buy a home?', scripted: true, once: true, stage: ['adult'],
    when: { all: [{ cashAtLeast: 40000000 }, { housing: 'rent' }] },
    text: "Your bank balance has hit the number everyone hears about at weddings. Your cousin says land in Epe is cheap. The agent says an estate in Lekki is \"almost sold\". Omo onile says he must be settled before you lay one block.",
    choices: [
      ch('buy', { label: 'Buy a home (₦35,000,000 all in)', cost: { cash: 35000000 }, fx: [{ buyHome: true }, happy(12), rep(6), stress(-6)], text: 'The keys are yours. No more annual rent panic. Your mother asks to see the title document.' }),
      ch('wait', { label: 'Keep renting and invest in your business or career', fx: [happy(-1), stress(1)], text: 'Smart or scared? The future will tell.' }),
    ],
  }),
]

