// Conversation scripts for in-world talking and hanging out. Each exchange is one NPC line and three
// replies for the player (warm / funny / meh). UI-only content; the quality of the replies becomes
// the `perf` score handed to the engine. 🚩 Cultural review welcome: edit freely.

export type Tone = 'warm' | 'funny' | 'meh'
export interface Option { text: string; tone: Tone; reply: string }
export interface Exchange { npc: string; options: Option[] }
export type Group = 'friend' | 'partner' | 'mother' | 'father' | 'sibling' | 'child' | 'boss'
export type Setting = 'pitch' | 'mamaput' | 'home' | 'school' | 'office' | 'street'

const x = (npc: string, w: [string, string], f: [string, string], m: [string, string]): Exchange => ({
  npc,
  options: [{ text: w[0], tone: 'warm', reply: w[1] }, { text: f[0], tone: 'funny', reply: f[1] }, { text: m[0], tone: 'meh', reply: m[1] }],
})

const FRIEND: Exchange[] = [
  x('Guy, how far? You have been hiding from me o.', ['I missed you, I just got busy.', 'Aww. Come, we will make up for it.'], ['Hiding? I am a ghost with school fees.', 'Hahaha! Ghost with school fees, I am using that.'], ['Hm. Busy.', 'Okay... I see.']),
  x('Did you see how NEPA took light again last night?', ['Yes! I almost cried, my phone was at 2%.', 'Same! We are all suffering together.'], ['NEPA is in a long-distance relationship with us.', 'You are wicked. I laughed for one minute.'], ['Yeah.', 'Mm.']),
  x('Abeg, what do you want to become in life sef?', ['I want to make my family proud. What about you?', 'That is beautiful. We will both reach there.'], ['Rich enough for Mama to stop asking questions.', 'Amen! Even my own mother needs that prayer.'], ['I do not know.', 'Hmm, okay.']),
  x('My jollof today was top tier. Nobody can tell me anything.', ['Sharing is caring. Next time bring me a plate!', 'Deal! You have a customer for life.'], ['Party jollof or home jollof? Choose carefully.', 'Party jollof! Smoky or nothing.'], ['I prefer rice and stew.', 'Ehn, to each their own.']),
  x('Traffic was crazy today. I spent two hours on one road.', ['That sounds exhausting. You deserve a rest.', 'Thanks o. At least I met you here.'], ['Two hours? That is a small trip in Lagos.', 'Lol! True, I am not even tired.'], ['Lagos.', 'Mhm.']),
  x('Do you think we will be okay? Like in ten years?', ['Yes. We keep showing up, so yes.', 'You always say the right thing.'], ['Ten years? I cannot plan next week.', 'Me too! Let us just chop life one day at a time.'], ['Who knows.', 'Okay, if you say so.']),
]
const FRIEND_PITCH: Exchange[] = [
  x('You remember the day Segun fell inside the gutter while chasing the ball?', ['Haha! I remember. We were so young.', 'Ah, those days were golden.'], ['I still hear the splash in my dreams!', 'Please do not remind me, I will laugh tomorrow too.'], ['Not really.', 'Oh.']),
  x('This pitch is rough, but I love it. Nobody judges you here.', ['Same. It feels like home to me too.', 'Exactly. This is where we are free.'], ['Judges? Only the goats are watching us.', 'The goats have been scouting us for years.'], ['It is just a pitch.', 'Right.']),
]
const FRIEND_BUKA: Exchange[] = [
  x('Iya Ibeji is giving extra meat today. Quick, order before it finishes!', ['Order for both of us. My treat today.', 'Ehen! You are a real one.'], ['Meat? I will fight a goat for it.', 'Haha! Goat meat, abi?'], ['I am not hungry.', 'Your loss.']),
  x('Gist me. What is the latest in your life?', ['Honestly, I have been trying to grow. How about you?', 'Wow, I am proud of you. Tell me more.'], ['Plot twist: still broke, still handsome.', 'Hahaha! Same energy.'], ['Nothing much.', 'Okay.']),
]
const PARTNER: Exchange[] = [
  x('You look nice today. Did you do something new?', ['Just seeing you made my day better.', 'Aww. You are so sweet.'], ['It is the free light from NEPA.', 'Hahaha! Silly you.'], ['No.', 'Oh... okay.']),
  x('Tell me one thing you are looking forward to.', ['A quiet evening with you. That is enough.', 'Me too. I really mean it.'], ['The next payday and what is after.', 'Lol! Payday is a love language.'], ['Nothing really.', 'Hmm.']),
  x('My mother asked about you again. She is already planning things.', ['Tell her I am coming to greet her soon.', 'She will be so happy. I am too.'], ['Please give me notice before the wedding.', 'Hahaha! Not yet o.'], ['Okay.', 'Hmm.']),
  x('Can we spend more time together this year?', ['Yes. You are my priority.', 'That is all I wanted to hear.'], ['Only if you bring suya.', 'Done. Medium pepper, extra onion.'], ['I will try.', 'Try how?']),
]
const MOTHER: Exchange[] = [
  x('Have you eaten? You look thin. Sit down first.', ['Yes Mama, thank you. Your food is the best.', 'My child, God bless you. Eat more anyway.'], ['Mama, my thinness is just good lighting.', 'Hmm. Sit down, I am bringing the plate.'], ['I am fine.', 'Fine? Fine is not food.']),
  x('When will you marry? My friends are already carrying their grandchildren.', ['Mama, when the time is right, you will be the first to know.', 'God will do it in His time. I trust you.'], ['Mama, let me finish chopping my own life first.', 'You and your jokes. Go and wash your hands.'], ['Not now.', 'Always not now.']),
  x('I prayed for you this morning. Tell me, are you doing well?', ['Thank you Mama. Your prayers carry me.', 'Amen, my child. Amen.'], ['Mama, please add NEPA to the prayer list.', 'I have already done it, do not worry.'], ['Yes.', 'Hm. I hope so.']),
  x('Black tax is not a joke, but I am proud of what you do for the family.', ['It is my joy to help you and the family.', 'God bless your hands, my child.'], ['Mama, the tax is high but the love is higher.', 'Hahaha! You learned that from your father.'], ['Okay.', 'Hm.']),
]
const FATHER: Exchange[] = [
  x('Is that how you greet your father? Come and shake my hand properly.', ['Good evening Papa, I am sorry. How was your day?', 'Better. Now sit, let us talk like men.'], ['Papa, I was saving my greeting for a bigger audience.', 'Hmm. Your humour will not pay your rent, but sit.'], ['Hello.', 'Hello? That is all?']),
  x('Are you saving money? Do not spend everything at once.', ['Yes Papa. I am trying to build something solid.', 'Good. That is how my own father taught me.'], ['I have saved 40 per cent of my smile.', 'Mm. Smile does not buy food, my boy.'], ['Maybe.', 'Maybe is a weak word.']),
  x('Your uncle is asking for help again. What do you think we should do?', ['Let us talk to him together and see what we can do.', 'That is wise. I will call him now.'], ['Papa, let us give him advice instead of money.', 'Ha! He will not like that, but it is sensible.'], ['Not my problem.', 'It is the family problem, my child.']),
]
const SIBLING: Exchange[] = [
  x('Abeg, no touch my remote. Nobody should touch my remote!', ['Sorry. I will leave it. Do you want to watch together?', 'Okay... fine, come sit.'], ['I am not touching it. I am just visiting it.', 'Haha. Silly you. Just share the couch.'], ['Whatever.', 'You are always like this.']),
  x('Can you lend me small money? I will pay you back, I swear.', ['Sure, but let us talk about what it is for.', 'You are the best sibling ever.'], ['Your last promise is still in the cooler.', 'Wow. Low blow. But fair.'], ['No.', 'Wow. Just like that.']),
  x('Mama said I must follow you to church. I do not want to go.', ['Come, I will buy you ice cream after.', 'Okay! You are cool, you know?'], ['You can sit at the back and pretend to pray.', 'Hehe, I am so using that.'], ['You have to.', 'You are boring.']),
]
const CHILD: Exchange[] = [
  x('Daddy, Mummy, can you play with me? Please, please?', ['Of course, my love. Let us play together.', 'Yay! You are the best!'], ['I am the champion of this game, prepare yourself!', 'Hahaha! You are so funny!'], ['Later.', 'You always say later...']),
  x('Why is the sky blue?', ['Because the sun paints it for us. Isn\'t it beautiful?', 'I love the blue. Let us look at it together.'], ['Because the sky forgot its other crayons.', 'Hehe! The sky is silly!'], ['Ask your teacher.', 'Hmm.']),
  x('Can we eat chin chin?', ['Yes, let us share some. Open your hand.', 'Mmm, crunchy! Thank you!'], ['Only if you do not eat all of it. I know you.', 'Hehe, me? Never!'], ['No.', 'Aww.']),
]
const BOSS: Exchange[] = [
  x('Targets do not meet themselves. Where are we with the report?', ['It will be on your desk by evening. I will make it count.', 'Good. That is the attitude I want.'], ['The report is cooking. Slow cooking, premium taste.', 'Hmm. Cook faster, then.'], ['Almost there.', 'Almost is not done.']),
  x('I notice you are always on time. Keep it up.', ['Thank you, sir. I take pride in my work.', 'Pride is good. Keep going.'], ['I am just scared of the gate man.', 'Ha! He is the real boss of this place.'], ['Okay.', 'Hm.']),
  x('There is a project coming. Are you ready for more responsibility?', ['Yes. I would like to learn and grow with the team.', 'Excellent. I will remember this.'], ['Give me the project, I will give you the miracle.', 'Confidence! I like it. Do not disappoint me.'], ['Not sure.', 'Think about it, then.']),
]

const BY_GROUP: Record<Group, Exchange[]> = { friend: FRIEND, partner: PARTNER, mother: MOTHER, father: FATHER, sibling: SIBLING, child: CHILD, boss: BOSS }

export function groupOf(role: string): Group {
  if (role === 'friend2') return 'friend'
  return (role in BY_GROUP ? role : 'friend') as Group
}

/** Which tone lands best depends on who you are talking to. */
const FUNNY: Record<Group, number> = { friend: 1, partner: 0.7, mother: 0.5, father: 0.5, sibling: 1, child: 0.9, boss: 0.4 }
const WARM: Record<Group, number> = { friend: 0.85, partner: 1, mother: 1, father: 1, sibling: 0.8, child: 1, boss: 1 }
export function scoreOf(tone: Tone, group: Group): number {
  return tone === 'warm' ? WARM[group] : tone === 'funny' ? FUNNY[group] : 0.2
}

/** Pick `rounds` distinct exchanges, with place-flavoured ones first for friends. */
export function buildConversation(role: string, setting: Setting, rounds: number, rnd: () => number = Math.random): Exchange[] {
  const g = groupOf(role)
  const pool = [...BY_GROUP[g]]
  const flavour = g === 'friend' || g === 'partner' ? (setting === 'pitch' ? FRIEND_PITCH : setting === 'mamaput' ? FRIEND_BUKA : []) : []
  const pick: Exchange[] = []
  if (flavour.length) pick.push(flavour[Math.floor(rnd() * flavour.length)])
  while (pick.length < rounds && pool.length) pick.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0])
  return pick.slice(0, rounds)
}
