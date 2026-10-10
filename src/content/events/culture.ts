import type { GameEvent } from '@engine/core/types'
import { ev, ch, cash, happy, know, rep, stress, health, rel, flag, moment, hustle } from './dsl'

const ANY: GameEvent['stage'] = ['child', 'teen', 'youngAdult', 'adult', 'elder']

export const cultureEvents: GameEvent[] = [
  // ---- festivals and seasons ----
  ev({ id: 'evt_x_eid', title: 'Sallah morning', stage: ANY, w: 6, cd: 3, tags: ['festival', 'h:hausa'], when: { all: [{ any: [{ heritage: 'hausa' }, { flagAtLeast: ['faithMuslim', 1] }] }] },
    text: "Eid morning. New clothes, early prayers, the smell of the ram, and greetings across the street: \"Barka da Sallah!\" Children go door to door for sallah money, and the whole neighbourhood feels freshly washed.",
    choices: [
      ch('prayers', { label: 'Pray with family, then visit elders', fx: [happy(8), rep(4), rel('mother', 3), stress(-4)], text: 'Handshakes, blessings, and rice enough for three families. A perfect day.' }),
      ch('visit', { label: 'Go round every house with your friends', cost: { energy: 8 }, fx: [happy(9), rep(3), rel('friend', 5), cash(30000)], text: 'You collected sallah money and ate in six homes. You did not need dinner.' }),
      ch('cook', { label: 'Help in the kitchen all day', cost: { energy: 10 }, fx: [rel('mother', 7), rep(3), happy(4)], text: 'The kitchen was a battlefield, and you survived with honour.' }),
    ] }),
  ev({ id: 'evt_x_yam', title: 'New Yam festival', stage: ANY, w: 6, cd: 3, tags: ['festival', 'h:igbo'], when: { all: [{ any: [{ heritage: 'igbo' }, { heritage: 'mix' }] }] },
    text: "The new yam has come. The elders bless the harvest, the first yam is roasted and shared with palm oil, and masquerades appear to a rhythm that moves your chest. The village is home again, even if you live in Lagos.",
    choices: [
      ch('join', { label: 'Join the dancing and the feast', fx: [happy(9), rep(4), rel('father', 3)], text: 'Roast yam with palm oil and fish: scientifically the best food. The elders pat your back.' }),
      ch('respect', { label: 'Take part in the rites with the elders', fx: [rep(7), happy(5), know(1)], text: 'You learned the order of the prayers, and the meaning behind each. It stays with you.' }),
      ch('work', { label: 'Send your regards and stay in the city', fx: [rep(-3), happy(-1)], text: 'Your phone rang all day with "when are you coming home?"' }),
    ] }),
  ev({ id: 'evt_x_eyo', title: 'Eyo on the Island', stage: ANY, w: 5, cd: 4, tags: ['festival', 'h:yoruba'], when: { all: [{ any: [{ heritage: 'yoruba' }, { heritage: 'mix' }] }] },
    text: "Lagos Island turns white: tall figures in flowing white robes and wide hats move through the streets as drummers follow. People say the Eyo procession is a blessing and a spectacle at the same time. Roads are closed and everyone is smiling.",
    choices: [
      ch('watch', { label: 'Watch from the roadside and take photos', fx: [happy(7), rep(2), stress(-3)], text: 'You returned with a dusty shirt and a very happy phone gallery.' }),
      ch('learn', { label: 'Ask an elder about the history behind it', fx: [know(3), rep(3), happy(4)], text: 'Stories of kings, spirits and ancestors, told over pepper soup.' }),
    ] }),
  ev({ id: 'evt_x_osun', title: 'Osun grove pilgrimage', stage: ['youngAdult', 'adult'], w: 4, cd: 6, tags: ['festival', 'h:yoruba'], when: { all: [{ any: [{ heritage: 'yoruba' }, { heritage: 'mix' }] }] },
    text: "Your aunt insists the family travel to Osogbo for the annual Osun festival: drumming, white cloth, calabashes, and people from many countries by the river. The traffic to Osogbo is a festival of its own.",
    choices: [
      ch('go', { label: 'Go along and respect the day', cost: { cash: 90000, energy: 12 }, fx: [happy(8), rep(3), know(2), rel('mother', 4)], text: 'A long road, a beautiful grove, and a day you will not forget.' }),
      ch('skip', { label: 'Send your regards and skip it', fx: [rel('mother', -2)], text: 'Your aunt sent seven voice notes. All of them are about the traffic you missed.' }),
    ] }),
  ev({ id: 'evt_x_durbar', title: 'The Durbar', stage: ANY, w: 4, cd: 5, tags: ['festival', 'h:hausa'], when: { all: [{ any: [{ heritage: 'hausa' }, { heritage: 'mix' }] }] },
    text: "Horses in colourful regalia charge across the grounds as riders in turbans and flowing robes salute the emir. Drums, trumpets, and dust rise together. You have never seen anything so loud and so beautiful.",
    choices: [
      ch('front', { label: 'Push to the front for the best view', check: { stat: 'health', difficulty: 40 }, out: { success: { effects: [happy(9), rep(2)], text: 'A horse thundered past a metre away. You remember the sound forever.' }, fail: { effects: [happy(2), health(-2)], text: 'You got an elbow in the ribs, a great photo, and a dusty face.' } } }),
      ch('stand', { label: 'Watch from a shaded stand', fx: [happy(6), health(1)], text: 'Calmer, cooler, and just as spectacular.' }),
    ] }),
  ev({ id: 'evt_x_detty', title: 'Detty December', stage: ['youngAdult', 'adult'], w: 7, cd: 2, tags: ['festival', 'season'],
    text: "December has arrived and Lagos has lost its mind. Concerts, beach parties, owambes, flights home, relatives from abroad, and traffic that moves like it is meditating. Everyone has a plan and nobody has a budget.",
    choices: [
      ch('go', { label: 'Go all in: concerts and beach, every weekend', cost: { cash: 350000, energy: 14 }, fx: [happy(11), rep(4), stress(-6), health(-2)], text: 'Your throat is gone, your bank balance is missing, and the pictures are legendary.' }),
      ch('mix', { label: 'Pick two events and enjoy them well', cost: { cash: 90000, energy: 8 }, fx: [happy(7), rep(2), stress(-3)], text: 'A balanced December: fun, sleep, and a quiet bank alert.' }),
      ch('home', { label: 'Travel home to the village', cost: { cash: 150000, energy: 10 }, fx: [rep(5), happy(6), rel('mother', 5), stress(-2)], text: 'Long journey, loud family, and a "when are you getting married?" for every cousin.' }),
    ] }),
  ev({ id: 'evt_x_flood', title: 'The rain came to stay', stage: ['teen', 'youngAdult', 'adult', 'elder'], w: 5, cd: 4, tags: ['season'],
    text: "It rained all night, and in the morning the road is a river. Cars are floating politely, okada riders carry passengers across for a fee, and your shoes have become a heavy prayer. Work or school is still expected.",
    choices: [
      ch('wade', { label: 'Take off your shoes and wade through', cost: { energy: 8 }, fx: [health(-2), stress(2), happy(1), rep(1)], text: 'You arrive wet, late and slightly heroic.' }),
      ch('bike', { label: 'Pay an okada to ferry you across', cost: { cash: 3000 }, fx: [stress(1)], text: 'He charged triple. You paid. Dry feet are priceless.' }),
      ch('stay', { label: 'Stay home and call it a rain day', fx: [happy(3), rep(-1), know(-1)], text: 'Tea, rain sounds, and a very guilty good time.' }),
    ] }),
  ev({ id: 'evt_x_ember', title: 'The ember months', stage: ['youngAdult', 'adult', 'elder'], w: 4, cd: 3, tags: ['season'],
    text: "September arrives and the warnings begin: \"ember months, be careful on the road\". Your aunt prays for your journey every morning. Your colleague refuses to travel by night. Everyone sends you holiday plans with extra prayer lines.",
    choices: [
      ch('careful', { label: 'Take extra care and avoid night travel', fx: [stress(1), health(1), rel('mother', 3)], text: 'You arrived everywhere safely, and your mother counts it as a prayer answered.' }),
      ch('laugh', { label: 'Laugh it off and carry on', fx: [happy(1)], text: 'Nothing happened. Your mother has not forgiven the laughing.' }),
    ] }),
  // ---- everyday systems ----
  ev({ id: 'evt_x_light', title: 'The light came!', stage: ANY, w: 6, cd: 3,
    text: "At 2 a.m., the whole street screams: \"UP NEPA!\" Fans spin, lights glow, the fridge hums and someone's television is suddenly at full volume. Three weeks of darkness are over, for tonight at least.",
    choices: [
      ch('charge', { label: 'Race to charge everything you own', cost: { energy: 6 }, fx: [stress(-3), happy(4)], text: 'Phones, power banks, rechargeable lamps, and a laptop that has not seen charge in days.' }),
      ch('sleep', { label: 'Sleep in the cool air for once', fx: [health(2), happy(5), stress(-5)], text: 'The best sleep of the year. Then at 4 a.m. the light left again.' }),
    ] }),
  ev({ id: 'evt_x_solar', title: 'Generator versus inverter', stage: ['youngAdult', 'adult'], w: 5, cd: 6, when: { all: [{ cashAtLeast: 600000 }, { notSeen: 'evt_x_solar' }] },
    text: "The generator costs a fortune in fuel and noise. A neighbour installed solar panels and an inverter, and now smiles at everyone in the evenings. The installer's quote is long, and so is the warranty.",
    choices: [
      ch('solar', { label: 'Invest in solar and an inverter (₦1,200,000)', cost: { cash: 1200000 }, fx: [stress(-8), happy(6), flag('solarInstalled'), moment('Installed solar power at home.')], text: 'Silence at last. The fuel station no longer knows your name.' }),
      ch('gen', { label: 'Stay with the generator and fuel', fx: [stress(2)], text: 'You told yourself it is temporary. You have said that for five years.' }),
    ] }),
  ev({ id: 'evt_x_borehole', title: 'No water today', stage: ['youngAdult', 'adult'], w: 4, cd: 4,
    text: "The tap coughs and offers a brown whisper. The tanker man wants triple, the neighbour's borehole is \"under repair\", and today is a very important day. You count how many sachet waters it takes to take a bath.",
    choices: [
      ch('tanker', { label: 'Pay for a tanker', cost: { cash: 25000 }, fx: [stress(-1)], text: 'The truck arrived with all the drama of a presidential motorcade.' }),
      ch('fetch', { label: 'Fetch buckets from the neighbour', cost: { energy: 10 }, fx: [rep(1), health(1), rel('neighbour', 2)], text: 'You carried water and gossip back in equal amounts.' }),
    ] }),
  ev({ id: 'evt_x_keke', title: 'The keke negotiation', stage: ['teen', 'youngAdult', 'adult'], w: 5, cd: 3,
    text: "You flag down a keke and ask: \"How much to the junction?\" He says ₦800. You say ₦300. He says: \"Oga, na fuel o.\" You say: \"Na my last money o.\" The negotiation is an art form.",
    choices: [
      ch('haggle', { label: 'Haggle like a professional', check: { stat: 'charm', difficulty: 32 }, out: { success: { effects: [cash(500), rep(1), happy(2)], text: '₦400. You win, and he waves cheerfully.' }, fail: { effects: [cash(-300), stress(1)], text: 'He drove off. You walked in the heat.' } } }),
      ch('pay', { label: 'Pay and get in', cost: { cash: 800 }, fx: [stress(-1)], text: 'Seat taken, argument avoided, wallet slightly offended.' }),
    ] }),
  ev({ id: 'evt_x_agent', title: 'Agent fees and agreement fees', stage: ['youngAdult', 'adult'], w: 5, cd: 4, when: { all: [{ housing: 'rent' }] },
    text: "Your tenancy renewal arrives with a spreadsheet of fees: rent, agent fee, legal fee, caution deposit, and \"service charge\". The agent calls everything \"standard\", and your calculator calls it \"extra\".",
    choices: [
      ch('pay', { label: 'Pay it all and get your key', cost: { cash: 280000 }, fx: [stress(2)], text: 'The receipts have more stamps than a passport.' }),
      ch('negotiate', { label: 'Negotiate the agent fee', check: { stat: 'charm', difficulty: 40 }, out: { success: { effects: [cash(-120000), rep(2)], text: 'He settled halfway. His smile did not.' }, fail: { effects: [cash(-280000), stress(3)], text: 'He said "that is the law". It was not the law.' } } }),
    ] }),
  ev({ id: 'evt_x_market_mama', title: 'Aunty at the market', stage: ['youngAdult', 'adult', 'elder'], w: 6, cd: 3,
    text: "The market woman calls you \"my husband\" or \"my wife\" as part of the price negotiation. \"For you, special price.\" You are quite sure everybody gets the special price. She is smiling like a saint.",
    choices: [
      ch('bargain', { label: 'Bargain hard', check: { stat: 'charm', difficulty: 35 }, out: { success: { effects: [cash(4000), rep(1), happy(3)], text: 'You saved ₦4,000 and she called you "wicked, but nice".' }, fail: { effects: [cash(-2500), happy(-1)], text: 'The special price was actually the usual price. You smiled anyway.' } } }),
      ch('regular', { label: 'Become a regular customer', fx: [rep(2), rel('neighbour', 2), happy(2)], text: 'She starts adding "small something" to your bag. Loyalty pays.' }),
    ] }),
  ev({ id: 'evt_x_whot', title: 'A game of Whot!', stage: ['teen', 'youngAdult', 'adult', 'elder'], w: 6, cd: 3,
    text: "The cards are out, the gist has started, and somebody says \"check up\". The table goes silent. A man you do not know claims \"I am coming with general market\" and the whole room gasps.",
    choices: [
      ch('play', { label: 'Join the table and play to win', check: { stat: 'charm', difficulty: 38 }, out: { success: { effects: [happy(7), rep(3)], text: 'You played the last card with a flourish and a victory shout.' }, fail: { effects: [happy(3), rep(1)], text: 'You lost, but you lost with style.' } } }),
      ch('watch', { label: 'Sit back and enjoy the commentary', fx: [happy(4), stress(-3)], text: 'The commentary was better than the cards.' }),
    ] }),
  ev({ id: 'evt_x_ayo', title: 'Ayo under the tree', stage: ['child', 'teen', 'elder'], w: 5, cd: 4,
    text: "An elder sits under the mango tree with a carved ayo board and a handful of seeds. He looks at you and says: \"Come and I will teach you, and you will lose with respect.\"",
    choices: [
      ch('learn', { label: 'Sit and learn the game', fx: [know(3), happy(5), rep(2)], text: 'Seed by seed, the board came alive. You lost five times and learned five lessons.' }),
      ch('beat', { label: 'Challenge him to win', check: { stat: 'knowledge', difficulty: 55 }, out: { success: { effects: [rep(5), happy(7), know(2)], text: 'You won! The elder laughed so loudly the mango fell.' }, fail: { effects: [happy(2), know(1)], text: 'He won in eleven moves and offered you a mango as consolation.' } } }),
    ] }),
  ev({ id: 'evt_x_greeting', title: 'The greeting test', stage: ['child', 'teen', 'youngAdult'], w: 7, cd: 3, tags: ['respect'],
    text: "An elder from the next compound is passing, and you are holding a phone and a bag of groundnut. The rule is clear: greet properly, and greet first. Your friends are already looking away, pretending not to see.",
    choices: [
      ch('proper', { label: 'Greet properly (kneel or bow as is custom)', fx: [rep(4), happy(2), rel('mother', 2)], text: '"May you live long", he says. Your mother heard about it before you got home.' }),
      ch('wave', { label: 'Give a quick wave', fx: [rep(-2), happy(0)], text: 'He paused. The pause was the whole lecture.' }),
      ch('hide', { label: 'Pretend to be on a call', fx: [rep(-4), happy(-1)], text: 'He saw you. Everybody saw you. You will hear about it on Sunday.' }),
    ] }),
  ev({ id: 'evt_x_asoebi_school', title: 'Class party aso-ebi', stage: ['teen'], w: 4, cd: 4, tags: ['celebration'], when: { all: [{ inSchool: true }] },
    text: "The final-year class has decided on matching outfits for graduation: green Ankara, with a tailor of the class president's choosing. The cost is ₦12,000 per person. Your mother's eyebrow has already voted.",
    choices: [
      ch('buy', { label: 'Pay and join the squad', cost: { cash: 12000 }, fx: [happy(6), rep(3), rel('friend', 4)], text: 'The photographs will outlive every one of you.' }),
      ch('skip', { label: 'Decline politely', fx: [rep(-2), happy(-2), rel('friend', -2)], text: 'You wore your uniform. The class was kind, but you noticed.' }),
    ] }),
  ev({ id: 'evt_x_vigil', title: 'Night vigil', stage: ['youngAdult', 'adult', 'elder'], w: 4, cd: 4, tags: ['faith'], when: { all: [{ any: [{ trait: 'devout' }, { chance: 0.4 }] }] },
    text: "The overnight vigil begins at 10 p.m. with hymns, intercessions, sermons, and more hymns. By 2 a.m. the whole hall is warm, sleepy, and glowing. Someone has packed rice and jollof in foil in the back, quietly.",
    choices: [
      ch('stay', { label: 'Stay till dawn', cost: { energy: 14 }, fx: [happy(6), stress(-6), rep(3), health(-1)], text: 'You walked home at sunrise, wrapped in a strange peace.' }),
      ch('half', { label: 'Join for a few hours, then go home', cost: { energy: 6 }, fx: [happy(3), stress(-3), rep(1)], text: 'A quiet blessing and a very good sleep.' }),
    ] }),
  ev({ id: 'evt_x_igba_boi', title: 'The apprenticeship settlement', stage: ['youngAdult'], w: 6, cd: 5, tags: ['h:igbo', 'career'], when: { all: [{ eduLevel: 'apprentice' }, { any: [{ heritage: 'igbo' }, { heritage: 'mix' }] }] },
    text: "Years of sweeping, lifting and learning have led here. Your oga says: \"Next year, you will be settled.\" The settlement means capital, a shop, and the blessing of a master who has watched you grow. Every apprentice remembers this day.",
    choices: [
      ch('learn', { label: 'Double down on learning his methods', cost: { energy: 12 }, fx: [know(3), rep(3), flag('masterBlessing')], text: 'He grumbled that you ask too many questions. Then he taught you everything.' }),
      ch('side', { label: 'Start your own small side orders', cost: { energy: 12 }, check: { stat: 'hustle', difficulty: 38 }, out: { success: { effects: [hustle(200000), rep(2)], text: 'Your oga pretended not to notice. He sent you a customer.' }, fail: { effects: [rep(-3), stress(3)], text: 'He found out. It was a long lecture, then a longer silence.' } } }),
    ] }),
  ev({ id: 'evt_x_visa', title: 'The visa interview', stage: ['youngAdult', 'adult'], w: 4, cd: 6, tags: ['japa'], when: { all: [{ flag: 'japaPlan' }] },
    text: "After six months of forms, bank statements, and sleepless nights, your interview day arrives. The queue starts at dawn. The officer asks one question: \"Why do you want to travel?\" You have prepared 14 answers, and your mind goes blank.",
    choices: [
      ch('honest', { label: 'Answer honestly and calmly', check: { stat: 'knowledge', difficulty: 45 }, out: { success: { effects: [happy(14), rep(3), moment('Got a visa approved.'), flag('visaApproved')], text: '"Approved." The word glowed. You walked out smiling at nobody.' }, fail: { effects: [happy(-10), stress(6)], text: '"Refused." You have to wait six months to try again.' } } }),
      ch('wait', { label: 'Postpone and strengthen your case', fx: [know(3), stress(1)], text: 'Another year of savings and certificates. Hope has a long lead time.' }),
    ] }),
  ev({ id: 'evt_x_election', title: 'Election season', stage: ['youngAdult', 'adult', 'elder'], w: 4, cd: 4, tags: ['civic'],
    text: "Posters appear overnight on every pole and wall. Campaign trucks with loud songs go past at noon. Your neighbour has two strong opinions, and your uncle has three. Everyone asks the same question: \"Who are you voting for?\"",
    choices: [
      ch('vote', { label: 'Register, check your options and vote responsibly', cost: { energy: 8 }, fx: [rep(3), happy(2), stress(1)], text: 'You waited in line, voted, and went home with your ink-stained finger and a clear conscience.' }),
      ch('abstain', { label: 'Stay home. They are all the same.', fx: [stress(-1), rep(-1)], text: 'You watched the results with strong opinions and no stake.' }),
      ch('gift', { label: 'Take the free rice and sell your opinion', fx: [rep(-4), cash(5000), happy(-1)], text: 'The rice was nice. The conscience less so.' }),
    ] }),
  ev({ id: 'evt_x_sapa', title: 'Sapa season', stage: ['youngAdult', 'adult'], w: 7, cd: 3, when: { all: [{ cashBelow: 150000 }] },
    text: "It is the 18th of the month, and your account balance looks like a lonely single digit. A friend sends \"Guy, how far?\" and you reply with a very long \"Sapa don catch me\". Your options are creative.",
    choices: [
      ch('borrow', { label: 'Borrow from a friend', fx: [cash(60000), stress(3), rel('friend', -2)], text: '"I will pay back on Friday." Everyone knows which Friday.' }),
      ch('hustle', { label: 'Pick up any small job', cost: { energy: 14 }, fx: [hustle(70000), stress(2)], text: 'You washed cars for a weekend. You are now a very clean person.' }),
      ch('eat', { label: 'Go home and eat at your family\'s', fx: [cash(0), happy(2), rel('mother', 4), rep(-1)], text: 'Mama asked no questions, served double, and prayed for you quietly.' }),
    ] }),
  ev({ id: 'evt_x_pidgin', title: 'Learning to speak Pidgin properly', stage: ['teen', 'youngAdult'], w: 4, cd: 6,
    text: "Your friend says: \"You dey like person wey just land.\" You realise you have been speaking the wrong Pidgin to the right people. A crash course in \"how far, wetin dey, abeg, na so\" is available at any bus stop.",
    choices: [
      ch('learn', { label: 'Practise with the conductor and the market women', fx: [rep(3), happy(5), know(1)], text: 'You nailed "abeg no vex" and the conductor said "you try". You glowed all day.' }),
      ch('proper', { label: 'Insist on "proper English"', fx: [rep(-1), happy(-1)], text: 'Your English was flawless and everybody wondered why you sounded like the news.' }),
    ] }),
  ev({ id: 'evt_x_fashion', title: 'The tailor and the Ankara', stage: ['youngAdult', 'adult'], w: 5, cd: 3, tags: ['celebration'],
    text: "You have a wedding in two weeks. The tailor says \"it will be ready Thursday\". He said that three weddings ago. You have already bought the fabric: loud, golden Ankara that makes people smile.",
    choices: [
      ch('trust', { label: 'Trust him and wait', check: { stat: 'reputation', difficulty: 20 }, out: { success: { effects: [rep(4), happy(5)], text: 'The outfit arrived at 6 p.m., wrapped in nylon. It fit perfectly.' }, fail: { effects: [rep(-2), stress(5), cash(-15000)], text: 'It arrived at 11 p.m., with one sleeve longer than the other.' } } }),
      ch('second', { label: 'Hire a second tailor as backup', cost: { cash: 35000 }, fx: [rep(3), happy(4)], text: 'Two outfits, one wedding, zero stress. Both tailors blamed each other.' }),
    ] }),
  ev({ id: 'evt_x_roast', title: 'Suya at midnight', stage: ['teen', 'youngAdult', 'adult'], w: 7, cd: 2,
    text: "The smell of grilled meat and yaji (spicy peanut powder) drifts down the street. The mallam's stall is crowded, and the line is happy. A friend says: \"Let's go, my treat\". Your stomach says yes before you do.",
    choices: [
      ch('eat', { label: 'Order a big one with onions and extra pepper', cost: { cash: 4500 }, fx: [happy(7), health(-1), rel('friend', 4)], text: 'Heat, smoke, and a happiness that costs ₦4,500.' }),
      ch('share', { label: 'Share one stick between three', cost: { cash: 1500 }, fx: [happy(4), rep(1), rel('friend', 3)], text: 'A crumb of suya each. Friendship at its most rationed.' }),
    ] }),
  ev({ id: 'evt_x_naija_time', title: 'Naija time', stage: ['youngAdult', 'adult'], w: 6, cd: 3,
    text: "The invitation says 2 p.m. You arrive at 2 p.m. and meet an empty hall, a sleepy DJ and a woman folding chairs. The \"real\" start is 5 p.m. You are the first guest at your own surprise.",
    choices: [
      ch('wait', { label: 'Wait patiently and help set up', cost: { energy: 6 }, fx: [rep(4), happy(3), rel('friend', 3)], text: 'You became the unofficial usher, and got free food before everyone else.' }),
      ch('leave', { label: 'Go home and come back later', fx: [stress(-1), rep(-1)], text: 'You returned at 5. The party started at 6. Your rice was cold.' }),
    ] }),
  ev({ id: 'evt_x_elder_advice', title: 'The uncle\'s wisdom', stage: ['youngAdult'], w: 6, cd: 3, who: 'father',
    text: "Uncle drops by unannounced with groundnut, hard advice and strong opinions on your life: marry, build a house, avoid bad friends, never lend money you cannot lose. He speaks for forty minutes, and somewhere in it, a wise sentence hides.",
    choices: [
      ch('listen', { label: 'Listen carefully and take notes', fx: [know(2), rep(2), happy(1)], text: 'The wise sentence was: "never co-sign for anybody." You wrote it twice.' }),
      ch('argue', { label: 'Push back politely with your own plan', check: { stat: 'charm', difficulty: 35 }, out: { success: { effects: [rep(4), happy(3)], text: 'He nodded slowly: "You have thought about it. Good."' }, fail: { effects: [rep(-2), stress(3)], text: '"Young people today think they know everything," he said, to the ceiling.' } } }),
    ] }),
  ev({ id: 'evt_x_school_prefect_duty', title: 'The visiting inspector', stage: ['child', 'teen'], w: 4, cd: 5, when: { all: [{ inSchool: true }] },
    text: "Word is the state inspector arrives tomorrow. The school is being cleaned from roof to gutter, the headmaster practises a new smile, and the textbooks you have never seen suddenly appear on every desk.",
    choices: [
      ch('help', { label: 'Help clean and organise', cost: { energy: 8 }, fx: [rep(3), happy(1), rel('friend', 2)], text: 'The school shone. The inspector blinked. A good report was written.' }),
      ch('observe', { label: 'Watch the chaos with popcorn', fx: [happy(3), rep(-1)], text: 'Nothing is as entertaining as a school preparing for an inspector.' }),
    ] }),
  ev({ id: 'evt_x_cooperative', title: 'The cooperative society', stage: ['adult', 'elder'], w: 5, cd: 4, tags: ['money'], when: { all: [{ employed: true }] },
    text: "At work, a cooperative society invites staff to join: contribute monthly, access cheap loans, and receive a share-out at year end. The treasurer wears three pens and a very serious smile.",
    choices: [
      ch('join', { label: 'Join and contribute', cost: { cash: 120000 }, fx: [rep(3), stress(-2), cash(40000), flag('cooperative')], text: 'Dividends arrive in December like a quiet miracle.' }),
      ch('loan', { label: 'Join and take a small loan for a project', cost: { cash: 120000 }, fx: [cash(400000), stress(2), rep(1), flag('cooperative')], text: 'The loan arrived quickly. The repayments will also arrive quickly.' }),
      ch('skip', { label: 'Skip it', fx: [], text: 'Your savings plan stays in your head and a small notebook.' }),
    ] }),
  ev({ id: 'evt_x_pos_business', title: 'A POS point', stage: ['youngAdult', 'adult'], w: 5, cd: 4, when: { all: [{ cashAtLeast: 250000 }] },
    text: "Everyone seems to run a POS stand now: a small table, an umbrella, a machine and a queue. A friend shows you the numbers: small, steady profit, daily. The only risk is network failure and customers who \"will return the change\".",
    choices: [
      ch('open', { label: 'Open a POS point (₦200,000)', cost: { cash: 200000, energy: 12 }, check: { stat: 'hustle', difficulty: 38 }, out: { success: { effects: [hustle(380000), rep(3)], text: 'Steady cash and steady customers. The umbrella pays for itself.' }, fail: { effects: [hustle(60000), stress(4), rep(-1)], text: 'Network trouble and long queues cut your profit.' } } }),
      ch('pass', { label: 'Pass', fx: [], text: 'Some opportunities are for other people.' }),
    ] }),
]
