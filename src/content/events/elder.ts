import type { GameEvent } from '@engine/core/types'
import { ev, ch, cash, happy, know, rep, stress, health, rel, moment } from './dsl'

const E: GameEvent['stage'] = ['elder']

export const elderEvents: GameEvent[] = [
  ev({ id: 'evt_e_grandchildren', title: 'Grandchildren in the house', stage: E, w: 8, cd: 2, when: { all: [{ hasChildren: true }] },
    text: "The compound is loud again: small feet, big questions, and a grandchild who calls you by the wrong name with total confidence. They want stories, snacks, and your wallet, in that order.",
    choices: [
      ch('stories', { label: 'Tell stories under the tree', fx: [happy(8), rep(3), stress(-5)], text: 'You told the one about the goat on the road. They laughed. They always laugh.' }),
      ch('gifts', { label: 'Spoil them with gifts', cost: { cash: 80000 }, fx: [happy(6), rel('child', 5)], text: 'Parents complained. Grandchildren cheered.' }),
    ] }),
  ev({ id: 'evt_e_pension', title: 'Pension wahala', stage: E, w: 6, cd: 3, when: { all: [{ employed: false }] },
    text: "You queue at the pension office with a folder of documents, a face mask and a lot of patience. The clerk says: \"come back Monday\". You came last Monday.",
    choices: [
      ch('persist', { label: 'Be patient and polite', cost: { energy: 10 }, fx: [stress(3), cash(150000), rep(1)], text: 'Third visit, success. The clerk is suddenly a very nice person.' }),
      ch('connect', { label: 'Call your old colleague who works there', check: { stat: 'reputation', difficulty: 30 }, out: {
        success: { effects: [cash(300000), stress(-1)], text: 'Done in one day. Connections never retire.' },
        fail: { effects: [stress(3)], text: 'He was transferred last year. Nobody told you.' } } }),
    ] }),
  ev({ id: 'evt_e_village', title: 'Return to the village', stage: E, w: 6, cd: 5, tags: ['family'],
    text: "The old compound has changed: new roofs, new paths, the same mango tree. The community gathers to receive you with kola and drumming. Elders greet you as an equal. A young man asks you to tell the story of your life.",
    choices: [
      ch('tell', { label: 'Tell your story and give advice', fx: [rep(8), happy(8), stress(-5), moment('Returned to the village as an honoured elder.')], text: 'The crowd listened for three hours. A title was mentioned.' }),
      ch('rest', { label: 'Rest quietly with old friends', fx: [happy(6), health(2), stress(-5)], text: 'The quiet suited you. The food suited you more.' }),
    ] }),
  ev({ id: 'evt_e_will', title: 'Writing the will', stage: E, w: 5, cd: 8, when: { all: [{ cashAtLeast: 500000 }] },
    text: "Everyone is suddenly very concerned about your health, and also about the house. A lawyer friend says: \"write a will, so there is no wahala\". You pick up a pen and discover how long it takes to decide who gets the generator.",
    choices: [
      ch('write', { label: 'Write a fair will', cost: { cash: 60000 }, fx: [stress(-4), rep(4), happy(2)], text: 'Clear, fair, and notarised. Peace in the family is a legacy too.' }),
      ch('delay', { label: 'Delay it again', fx: [stress(2)], text: 'The pen goes back in the drawer. The family waits.' }),
    ] }),
  ev({ id: 'evt_e_title', title: 'A chieftaincy title', stage: E, w: 4, cd: 99, once: true, when: { all: [{ stat: ['reputation', '>=', 55] }] },
    text: "The community has decided to confer a title on you for your service, generosity and character. There will be a ceremony, regalia, and very loud drums. The conferment fee is \"just a token\".",
    choices: [
      ch('accept', { label: 'Accept with gratitude', cost: { cash: 400000 }, fx: [rep(12), happy(10), moment('Received a community chieftaincy title.')], text: 'Your name is now preceded by a long and beautiful title.' }),
      ch('decline', { label: 'Decline humbly', fx: [rep(5), happy(3)], text: 'Your humility increased your standing even more.' }),
    ] }),
  ev({ id: 'evt_e_reunion', title: 'Old friends reunion', stage: E, w: 6, cd: 4, who: 'friend', when: { all: [{ roleAlive: ['friend', true] }] },
    text: "{friend} calls: a reunion of the class of long ago. The photos are old, the hair is grey, and the stories grow with each telling. Someone brought akara, and someone else brought stories that were definitely not true.",
    choices: [
      ch('go', { label: 'Go and laugh until your sides hurt', cost: { cash: 40000 }, fx: [happy(10), rel('friend', 8), stress(-6)], text: 'It was the best day of the year. Your jaw hurt from laughing.' }),
      ch('stay', { label: 'Stay home, you are tired', fx: [rel('friend', -3), happy(-1)], text: 'You watched the photos on your phone. Not the same.' }),
    ] }),
  ev({ id: 'evt_e_advice', title: 'Younger people seek your advice', stage: E, w: 6, cd: 3, when: { all: [{ stat: ['reputation', '>=', 40] }] },
    text: "Young people keep coming to ask for advice: relationships, jobs, whether to \"japa\". You listen. You nod. You tell them about the time the generator died before the wedding. They hear wisdom.",
    choices: [
      ch('guide', { label: 'Take time to guide them', cost: { energy: 8 }, fx: [rep(5), happy(5), know(1)], text: 'You were useful again. Some of them even took notes.' }),
      ch('joke', { label: 'Give funny advice and a proverb', fx: [happy(4), rep(2)], text: 'The proverb made no sense, but they loved it.' }),
    ] }),
  ev({ id: 'evt_e_slowdown', title: 'Slowing down', stage: E, w: 6, cd: 3,
    text: "The stairs are higher than they used to be, and the stool is lower. Your joints have opinions about the weather. A neighbour offers to carry your bag, and you refuse, then accept.",
    choices: [
      ch('walk', { label: 'Take a gentle walk each morning', fx: [health(3), happy(3), stress(-3)], text: 'Slow steps, fresh air, and greetings from the whole street.' }),
      ch('rest', { label: 'Rest more and let others help', fx: [health(1), happy(2), rep(1)], text: 'Letting others help is also a skill.' }),
    ] }),
]
