import type { GameEvent } from '@engine/core/types'
import { ev, ch, cash, happy, know, rep, stress, health, flag, moment, hustle, rel } from './dsl'

export const careerEvents: GameEvent[] = [
  // --- generic work ---
  ev({ id: 'evt_w_boss', title: 'Boss wahala', stage: ['youngAdult', 'adult'], w: 7, cd: 3, who: 'boss', when: { all: [{ employed: true }] },
    text: "{boss} has taken a decision that makes no sense, announced it in a meeting, and asked \"any questions?\" in the tone of someone who does not want questions. Your colleague raises an eyebrow at you.",
    choices: [
      ch('comply', { label: 'Comply and keep the peace', fx: [stress(3), rep(1)], text: 'The project goes ahead. Whether it works is for the future to say.' }),
      ch('speak', { label: 'Politely suggest a better way', risk: 'risky', check: { stat: 'charm', difficulty: 40 }, out: {
        success: { effects: [rep(5), happy(3), flag('boldAtWork')], text: '{boss} thinks it over and adopts your idea as "our idea".' },
        fail: { effects: [rep(-3), stress(5)], text: 'You were told to \"stay in your lane\". The lane is narrow.' } } }),
      ch('quit', { label: 'Think about resigning', fx: [stress(2), happy(-2)], text: 'The CV is updated. Nothing else is, yet.' }),
    ] }),
  ev({ id: 'evt_w_raise', title: 'Ask for a raise?', stage: ['youngAdult', 'adult'], w: 6, cd: 3, when: { all: [{ employed: true }, { jobLevelAtLeast: 1 }] },
    text: "Your salary has not moved in years, the price of garri has, and your landlord is not shy. You rehearse the conversation in the bathroom mirror. The mirror is encouraging.",
    choices: [
      ch('ask', { label: 'Request a raise', risk: 'risky', check: { stat: 'reputation', difficulty: 45 }, out: {
        success: { effects: [cash(450000), happy(6), rep(2)], text: '"We value you." (The raise is real.)' },
        fail: { effects: [happy(-4), stress(3)], text: '"The company is doing its best." The raise stays in the future.' } } }),
      ch('wait', { label: 'Wait for the appraisal', fx: [stress(1)], text: 'Patience, patience. Maybe next year.' }),
    ] }),
  ev({ id: 'evt_w_team', title: 'The office party', stage: ['youngAdult', 'adult'], w: 5, cd: 3, when: { all: [{ employed: true }] },
    text: "The end-of-year party is at a hotel with small chops, a DJ, and the managing director dancing badly with surprising confidence. Attendance is \"optional\" in the way weddings are.",
    choices: [
      ch('go', { label: 'Go, dance and network', cost: { cash: 20000 }, fx: [rep(4), happy(5), rel('boss', 3)], text: 'You danced with the MD. Nobody mentions it, but everyone remembers.' }),
      ch('skip', { label: 'Skip it and rest', fx: [energy10(), rep(-1)], text: 'Your bed was lovely. Your name was missed.' }),
    ] }),
  // --- trade ---
  ev({ id: 'evt_tr_customer', title: 'The customer who will not pay', stage: ['youngAdult', 'adult', 'elder'], w: 8, cd: 3, when: { all: [{ track: 'trade' }] },
    text: "A customer collected the finished outfit/repair and said, \"I will bring the money tomorrow\". That was last Tuesday. He is now posting photos of the work on social media.",
    choices: [
      ch('chase', { label: 'Visit him and ask politely', cost: { energy: 8 }, check: { stat: 'charm', difficulty: 35 }, out: {
        success: { effects: [hustle(150000), rep(2)], text: 'He paid, apologised, and ordered more. Customers are strange.' },
        fail: { effects: [stress(4), rep(-1)], text: 'He promised again. This time with a different excuse.' } } }),
      ch('forgive', { label: 'Let it go', fx: [hustle(0), happy(-1), rep(1)], text: 'Lesson learned: collect deposits.' }),
    ] }),
  ev({ id: 'evt_tr_bigorder', title: 'A big order', stage: ['youngAdult', 'adult'], w: 6, cd: 4, when: { all: [{ track: 'trade' }, { jobLevelAtLeast: 2 }] },
    text: "A wedding party needs 40 outfits (or 15 refurbished generators) by a tight deadline. The money is big, the timeline is mad, and your apprentice asks if sleep is optional.",
    choices: [
      ch('accept', { label: 'Accept and push the team', cost: { energy: 15 }, risk: 'risky', check: { stat: 'hustle', difficulty: 42 }, out: {
        success: { effects: [hustle(600000), rep(5), stress(5), moment('Delivered a huge order on time.')], text: 'You finished at 4 a.m. The client wept with joy. The money was great.' },
        fail: { effects: [hustle(120000), rep(-3), stress(8)], text: 'You missed the deadline by a day. The client reduced the payment.' } } }),
      ch('decline', { label: 'Decline politely', fx: [stress(-1)], text: 'Some work is not worth the sleep.' }),
    ] }),
  ev({ id: 'evt_tr_apprentice', title: 'Your apprentice wants to leave', stage: ['adult'], w: 4, cd: 6, when: { all: [{ track: 'trade' }, { jobLevelAtLeast: 3 }] },
    text: "Your best apprentice says they want to \"settle\" early and open their own shop. It is a big step, and a big loss. They look at you with hope and a little fear.",
    choices: [
      ch('bless', { label: 'Bless them and help them start', cost: { cash: 200000 }, fx: [rep(8), happy(5), moment('Helped an apprentice start their own business.')], text: 'They return every Christmas with gifts. A legacy of skill.' }),
      ch('hold', { label: 'Ask them to wait a year', fx: [stress(2), rep(-1)], text: 'They waited, but they remembered.' }),
    ] }),
  // --- civil ---
  ev({ id: 'evt_cv_salary', title: 'Salary delay', stage: ['youngAdult', 'adult'], w: 7, cd: 3, when: { all: [{ track: 'civil' }] },
    text: "Salary was due on the 25th. It is now the 3rd of next month. Your colleagues are sharing memes about \"alert\". The bank app says \"pending\" in a cheerful font.",
    choices: [
      ch('borrow', { label: 'Borrow from a friend', fx: [stress(4), cash(100000), rep(-1)], text: 'A friend loans you money and advice. The advice is free; the money is not.' }),
      ch('hustle', { label: 'Pick up extra weekend work', cost: { energy: 12 }, fx: [hustle(120000), stress(3)], text: 'You survived the month with garri and ambition.' }),
    ] }),
  ev({ id: 'evt_cv_file', title: 'The file that will not move', stage: ['youngAdult', 'adult'], w: 6, cd: 4, when: { all: [{ track: 'civil' }] },
    text: "A contractor leaves a file on your desk and a small envelope beside it. \"Just something for transport,\" he says. The file has been pending for two years. Everyone knows how files move in this office.",
    choices: [
      ch('refuse', { label: 'Refuse and process it properly', fx: [rep(5), stress(3), happy(2)], text: 'The contractor sulks. The file moves on merit. A rare victory.' }),
      ch('take', { label: 'Take the envelope', risk: 'gamble', check: { stat: 'reputation', difficulty: 45 }, out: {
        success: { effects: [cash(200000), rep(-3), happy(-2)], text: 'Nobody noticed this time. The money feels heavy.' },
        fail: { effects: [rep(-12), stress(10), happy(-8), moment('Was caught in a bribery scandal at work.')], text: 'An audit surprised you. The envelope became evidence.' } } }),
    ] }),
  ev({ id: 'evt_cv_training', title: 'A training programme', stage: ['youngAdult', 'adult'], w: 5, cd: 4, when: { all: [{ track: 'civil' }] },
    text: "The ministry is sending staff on a two-week training. The venue is a nice hotel and the allowance is generous. The \"lectures\" are mostly snacks and group photos, but you can choose to learn something real.",
    choices: [
      ch('learn', { label: 'Take it seriously', cost: { energy: 10 }, fx: [know(5), rep(3), cash(80000)], text: 'You were the only one who read the handbook. People noticed.' }),
      ch('relax', { label: 'Enjoy the hotel and the allowance', fx: [happy(5), cash(120000), know(-1)], text: 'A nice break. Your waist and wallet are slightly wider.' }),
    ] }),
  // --- corporate ---
  ev({ id: 'evt_co_targets', title: 'Monday meeting, Friday pressure', stage: ['youngAdult', 'adult'], w: 7, cd: 3, when: { all: [{ track: 'corporate' }] },
    text: "The bank has set new targets: \"increase deposits by 40%\" and \"onboard 20 customers per week\". A dashboard shows your name in amber. Your manager says: \"I know it is tough, but I believe in you\". He is also in amber.",
    choices: [
      ch('push', { label: 'Work evenings and hit the target', cost: { energy: 15 }, risk: 'risky', check: { stat: 'hustle', difficulty: 42 }, out: {
        success: { effects: [rep(5), cash(400000), stress(6)], text: 'You hit the target. A bonus comes. So does the next target.' },
        fail: { effects: [stress(8), happy(-4), rep(-1)], text: 'You were close but not close enough. Dashboard: red.' } } }),
      ch('realistic', { label: 'Set a realistic plan and communicate', fx: [rep(2), stress(2)], text: 'Honest and steady. Your manager is not thrilled, but he respects it.' }),
    ] }),
  ev({ id: 'evt_co_credit', title: 'Someone took your credit', stage: ['youngAdult', 'adult'], w: 5, cd: 4, when: { all: [{ track: 'corporate' }] },
    text: "At the town hall, a colleague presents your analysis as \"our team's insight\". The MD claps. Your name does not appear. Your colleague winks at you, as if it was a favour.",
    choices: [
      ch('speak', { label: 'Speak up politely, in front of everyone', risk: 'risky', check: { stat: 'charm', difficulty: 40 }, out: {
        success: { effects: [rep(6), happy(3)], text: 'The MD asks for your slides. The colleague tries to look busy.' },
        fail: { effects: [rep(-3), stress(5)], text: 'You were told to \"work as a team\". The credit stayed gone.' } } }),
      ch('private', { label: 'Raise it privately with {boss}', fx: [rep(2), stress(2)], text: '{boss} promises to \"look into it\". Looking is the first step.' }),
      ch('let', { label: 'Let it go', fx: [stress(3), happy(-3)], text: 'You swallowed it. It sat in your stomach for weeks.' }),
    ] }),
  ev({ id: 'evt_co_layoff', title: 'Layoff rumours', stage: ['adult', 'youngAdult'], w: 4, cd: 5, when: { all: [{ track: 'corporate' }] },
    text: "A rumour is flying: \"restructuring\". Meetings are held behind glass walls, people are looking at their phones, and a colleague says: \"I heard 20%\". Nobody knows who.",
    choices: [
      ch('prove', { label: 'Work extra to prove your value', cost: { energy: 14 }, fx: [rep(3), stress(5)], text: 'You stayed late for a month. Maybe it helped.' }),
      ch('prepare', { label: 'Update your CV and savings', fx: [stress(2), know(1), cash(0)], text: 'A quiet plan B is the best friend of a nervous heart.' }),
    ] }),
  // --- tech ---
  ev({ id: 'evt_te_remote', title: 'A remote job offer', stage: ['youngAdult', 'adult'], w: 5, cd: 4, when: { all: [{ track: 'tech' }, { jobLevelAtLeast: 2 }] },
    text: "A foreign company offers a remote role, paid in dollars. The interview is at 2 a.m. your time, the power is erratic, and your internet likes drama. But the offer is real.",
    choices: [
      ch('take', { label: 'Take it, with generator and mobile data backup', cost: { cash: 100000 }, check: { stat: 'knowledge', difficulty: 50 }, out: {
        success: { effects: [cash(1200000), rep(4), happy(6), stress(4), moment('Landed a remote job paid in dollars.')], text: 'The first dollar salary arrives. Your mother asks to see the alert.' },
        fail: { effects: [stress(5), happy(-3)], text: 'Your internet died mid-interview. They said they would "keep your CV on file".' } } }),
      ch('stay', { label: 'Stay at your current job', fx: [stress(1)], text: 'A dollar is a dollar, but sleep is also valuable.' }),
    ] }),
  ev({ id: 'evt_te_startup', title: 'The startup idea', stage: ['youngAdult', 'adult'], w: 6, cd: 4, when: { all: [{ track: 'tech' }, { jobLevelAtLeast: 3 }, { flagAbsent: 'startupFunded' }] },
    text: "You and a friend have an idea that solves a real problem: payments for market women, or logistics for small shops. A demo day in Yaba is coming, and an investor will be there. Your slides are mostly confidence.",
    choices: [
      ch('pitch', { label: 'Pitch at demo day', cost: { energy: 14 }, risk: 'risky', check: { stat: 'charm', difficulty: 52 }, out: {
        critSuccess: { effects: [flag('startupFunded'), cash(8000000), rep(10), happy(12), moment('Got a startup funded.')], text: 'The investor said yes. The WhatsApp group exploded.' },
        success: { effects: [flag('startupFunded'), cash(3000000), rep(6), happy(8), moment('Raised pre-seed funding.')], text: 'Pre-seed secured. Work begins.' },
        fail: { effects: [happy(-4), stress(3), know(2)], text: '"Come back with traction." You learned about traction.' } } }),
      ch('build', { label: 'Build more before pitching', fx: [know(3), stress(2)], text: 'You spent six months building. The product is better. The runway is shorter.' }),
    ] }),
  ev({ id: 'evt_te_burnout', title: 'Burnout', stage: ['youngAdult', 'adult'], w: 5, cd: 4, when: { all: [{ track: 'tech' }, { stat: ['stress', '>=', 55] }] },
    text: "Your eyes burn, your back hurts, and your code reads like a foreign language. The sprint is another sprint after another sprint. You haven't seen the sun since Tuesday, and you can't remember which Tuesday.",
    choices: [
      ch('rest', { label: 'Take a break and rest', fx: [stress(-12), health(4), happy(4), rep(-1)], text: 'You slept for twelve hours. The world kept working without you.' }),
      ch('push', { label: 'Push through', fx: [stress(6), health(-6), know(1)], text: 'The deadline was met. Your body filed a complaint.' }),
    ] }),
  ev({ id: 'evt_te_hackathon', title: 'Hackathon', stage: ['youngAdult', 'adult'], w: 5, cd: 4, when: { all: [{ track: 'tech' }] },
    text: "A weekend hackathon with a prize of ₦1.5 million, free pizza, and a judge who yawns. Your team has two developers, a designer and a person who \"does the pitch\".",
    choices: [
      ch('join', { label: 'Join and give it everything', cost: { energy: 14 }, check: { stat: 'knowledge', difficulty: 48 }, out: {
        success: { effects: [cash(1500000), rep(5), happy(7)], text: 'First prize! You slept for two days.' },
        fail: { effects: [know(3), rep(2), stress(3)], text: 'No prize, but you learned a lot and made new contacts.' } } }),
      ch('skip', { label: 'Skip it', fx: [energy10()], text: 'You slept in. The pizza was someone else\'s problem.' }),
    ] }),
  // --- creative ---
  ev({ id: 'evt_cr_viral', title: 'Something goes viral', stage: ['youngAdult', 'adult'], w: 5, cd: 4, when: { all: [{ track: 'creative' }] },
    text: "A 30-second clip you posted at 2 a.m. has been shared by a famous account. Your phone is vibrating like a generator. DMs, brand deals, and one \"Aunty\" who sends prayers.",
    choices: [
      ch('ride', { label: 'Ride the wave: post more, say yes', cost: { energy: 14 }, check: { stat: 'charm', difficulty: 42 }, out: {
        success: { effects: [rep(10), cash(900000), happy(8), moment('Went viral online.')], text: 'Followers rise, deals follow. You are now somebody\'s favourite.' },
        fail: { effects: [rep(2), stress(5), cash(100000)], text: 'The wave was short. Your fans moved on, but you learned.' } } }),
      ch('steady', { label: 'Stay steady and keep making quality work', fx: [rep(4), happy(4), know(1)], text: 'Slow and loyal. Not viral, but dependable.' }),
    ] }),
  ev({ id: 'evt_cr_deal', title: 'The contract', stage: ['youngAdult', 'adult'], w: 5, cd: 5, when: { all: [{ track: 'creative' }, { jobLevelAtLeast: 2 }] },
    text: "A label (or production company) offers a deal with a big advance and fine print that looks like a university thesis. The manager says \"just sign\". Your lawyer cousin says \"do not sign\".",
    choices: [
      ch('lawyer', { label: 'Have a lawyer read it and negotiate', cost: { cash: 150000 }, check: { stat: 'knowledge', difficulty: 40 }, out: {
        success: { effects: [cash(1500000), rep(5), happy(5)], text: 'Better terms and a cleaner deal. The label respects you.' },
        fail: { effects: [cash(300000), stress(3)], text: 'They walked away. A good deal was lost, but so was a bad one.' } } }),
      ch('sign', { label: 'Sign and hope', risk: 'gamble', check: { stat: 'reputation', difficulty: 55 }, out: {
        success: { effects: [cash(2500000), rep(6), happy(8)], text: 'The deal worked out. You are very, very lucky.' },
        fail: { effects: [cash(500000), rep(-4), stress(7), happy(-6)], text: 'The fine print owned your songs for ten years. Painful lessons.' } } }),
    ] }),
  ev({ id: 'evt_cr_audition', title: 'Audition day', stage: ['youngAdult'], w: 6, cd: 3, when: { all: [{ track: 'creative' }] },
    text: "A casting call for a big Nollywood film (or a music reality show) has 800 people queueing outside. You have six lines and one minute. The casting director has a very tired face and a very good pen.",
    choices: [
      ch('perform', { label: 'Give it everything', cost: { energy: 12 }, check: { stat: 'charm', difficulty: 44 }, out: {
        success: { effects: [cash(500000), rep(6), happy(9), moment('Landed a role after an audition.')], text: '"We will call you." They actually did.' },
        fail: { effects: [happy(-3), rep(1), know(1)], text: 'You were great. They chose someone taller.' } } }),
    ] }),
  ev({ id: 'evt_cr_bad_gig', title: 'The gig that never paid', stage: ['youngAdult', 'adult'], w: 5, cd: 3, when: { all: [{ track: 'creative' }] },
    text: "You performed at an event, and the organiser promised to \"settle you next week\". It is now next month. His phone is switched off, and his Instagram is full of new cars.",
    choices: [
      ch('call', { label: 'Keep calling and negotiating', check: { stat: 'charm', difficulty: 38 }, out: {
        success: { effects: [hustle(120000), rep(1)], text: 'He paid half. Half is a miracle.' },
        fail: { effects: [stress(4), happy(-3)], text: 'You got a "bro, I am so sorry". Nothing else.' } } }),
      ch('post', { label: 'Post about it online', risk: 'risky', check: { stat: 'reputation', difficulty: 38 }, out: {
        success: { effects: [hustle(200000), rep(4)], text: 'Public pressure worked. He paid with an apology and a discount on his next event.' },
        fail: { effects: [rep(-4), stress(3)], text: 'The post backfired. Some people called you "difficult".' } } }),
    ] }),
]
function energy10() { return { stat: 'energy' as const, delta: 10 } }
