import { useMemo } from 'react'
import { useGame } from '../store'
import { Btn, DeltaChips, Modal, naira, nairaShort } from './components'
import { Avatar } from './Avatar'
import { currentEvent, getDreamProgress, getJobOptions, getShopItems } from '@engine/api'
import { QUESTS } from '@content/quests'
import { ACHIEVEMENTS } from '@content/achievements'
import { DREAM_BY_ID } from '@content/dreams'
import { TRAIT_BY_ID } from '@content/traits'
import { ARCHETYPE_BY_ID } from '@content/archetypes'
import { TRACKS } from '@content/jobs'
import { ITEM_BY_ID } from '@content/items'
import { RENT_NAME } from '@engine/systems/economy'
import { fmtTime, remainingSec, secondsToNextRefill, TOP_UP_PACKS } from '@platform/tokens'
import type { NpcRole } from '@engine/core/types'
import { audio } from '@platform/audio'
import { HERITAGE_LABEL } from '@content/names'
import { addFlag } from '@platform/feedback'

const RISK = { safe: ['🟢', 'Safe'], risky: ['🟠', 'Risky'], gamble: ['🔴', 'Gamble'] } as const
const TIER_LABEL = { critSuccess: ['🌟', 'Brilliant!'], success: ['✅', 'It worked'], fail: ['😬', 'Not great'], critFail: ['💥', 'Disaster'] } as const

export function EventModal() {
  const { life, choose, proceed } = useGame()
  const cur = useMemo(() => (life ? currentEvent(life) : undefined), [life])
  if (!life || !cur) return null
  const result = life.activeEvent?.result
  const npc = cur.event.who ? life.npcs[life.roles[cur.event.who] ?? ''] : undefined
  const queueLeft = life.eventQueue.length
  return (
    <Modal wide>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-60">Age {life.character.age} · event {life.after === 'summary' ? '' : '(milestone) '}{queueLeft > 1 ? `· ${queueLeft - 1} more` : ''}</div>
          <h2 className="font-display text-3xl text-danfo leading-tight">{cur.event.title}</h2>
        </div>
        <button className="chip shrink-0" aria-label="Flag this event for the playtest feedback log" title="Flag this (playtest feedback)" onClick={() => { const note = window.prompt(`Feedback on "${cur.event.title}" (wrong, offensive, inaccurate, or could be funnier?)`); if (note) { addFlag({ contentId: cur.event.id, kind: 'event', age: life.character.age, note }); useGame.getState().toast('Thanks, feedback saved') } }}>🚩</button>
        {npc && <div className="text-center shrink-0"><div className="w-12 h-12 rounded-full grid place-items-center text-xl font-black" style={{ background: '#3a3358' }}>{npc.name[0]}</div><div className="text-[10px] opacity-70 mt-0.5">{npc.name}</div></div>}
      </div>
      <p className="mt-2 leading-relaxed">{cur.text}</p>
      {!result ? (
        <div className="mt-3 flex flex-col gap-2">
          {cur.choices.map(({ choice, label, affordable }) => (
            <button key={choice.id} className="card-btn" onClick={() => { audio.sfx('click'); choose(choice.id) }}>
              <div className="font-extrabold">{label}</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {choice.risk && <span className="chip">{RISK[choice.risk][0]} {RISK[choice.risk][1]}</span>}
                {choice.cost?.cash ? <span className="chip" style={{ background: affordable ? '#ffffff14' : '#5a1f24' }}>{naira(-choice.cost.cash)}{!affordable ? ' (debt)' : ''}</span> : null}
                {choice.cost?.energy ? <span className="chip">⚡ −{choice.cost.energy}</span> : null}
                {choice.hint && <span className="text-xs opacity-70">{choice.hint}</span>}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3 pop">
          {result.tier && <div className="chip !text-sm mb-2">{TIER_LABEL[result.tier][0]} {TIER_LABEL[result.tier][1]}</div>}
          <div className="card p-3 text-lg leading-snug">{result.text || 'It is done.'}</div>
          <DeltaChips deltas={result.deltas} />
          <Btn className="w-full mt-4" onClick={proceed}>Continue ▶</Btn>
        </div>
      )}
    </Modal>
  )
}

export function QuizModal() {
  const { life, answer, quizFeedback, clearQuiz } = useGame()
  if (!life) return null
  const fb = quizFeedback
  const quiz = life.quiz
  const q = fb ? fb.q : quiz?.questions[quiz.index]
  if (!q) return null
  const total = quiz?.questions.length ?? (fb ? life.log.length * 0 + 3 : 3)
  return (
    <Modal wide title="Pop quiz!">
      <div className="text-xs opacity-60 mb-1">{q.subject.toUpperCase()}{quiz ? ` · question ${Math.min(quiz.index + 1, total)}/${total}` : ''}</div>
      <p className="text-lg font-bold leading-snug">{q.q}</p>
      <div className="mt-3 grid gap-2">
        {q.options.map((o, i) => {
          const picked = fb && fb.picked === i
          const right = fb && q.answer === i
          return (
            <button key={i} className="card-btn" disabled={!!fb} onClick={() => answer(i)}
              style={fb ? { borderColor: right ? '#2fd27b' : picked ? '#ff6b5e' : undefined, background: right ? '#1d5a3a' : picked ? '#5a1f24' : undefined, opacity: 1 } : undefined}>
              <span className="font-extrabold mr-2">{'ABCD'[i]}.</span>{o}
            </button>
          )
        })}
      </div>
      {fb && (
        <div className="mt-3 pop">
          <div className="card p-3">{fb.correct ? '✅ Correct! ' : '❌ Not quite. '}{fb.funny ?? (fb.correct ? '+Knowledge' : 'It happens to the best of us.')}</div>
          <Btn className="w-full mt-3" onClick={clearQuiz}>{fb.last ? 'Finish quiz ▶' : 'Next question ▶'}</Btn>
        </div>
      )}
    </Modal>
  )
}

export function SummaryModal() {
  const { life, nextYear } = useGame()
  if (!life?.summary) return null
  const s = life.summary
  const c = life.character
  const dp = getDreamProgress(life)
  const dream = DREAM_BY_ID[c.dreamId]
  return (
    <Modal wide>
      <div className="text-xs font-extrabold uppercase tracking-wider opacity-60">Age {s.age} · {life.year}</div>
      <h2 className="font-display text-3xl text-danfo leading-tight">{s.headline}</h2>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="card p-2.5"><div className="text-xs opacity-60">Income</div><div className="font-black text-green-300">{naira(s.income)}</div></div>
        <div className="card p-2.5"><div className="text-xs opacity-60">Expenses</div><div className="font-black text-red-300">{naira(-s.expenses)}</div></div>
      </div>
      <DeltaChips deltas={s.deltas.filter((d) => d.stat !== 'cash')} limit={10} />
      <ul className="mt-3 text-sm space-y-1 opacity-90">{s.lines.slice(0, 9).map((l, i) => <li key={i}>• {l}</li>)}</ul>
      <div className="mt-3 text-xs opacity-70">{dream.icon} {dream.name}: {dp.text} <div className="bar mt-1"><i style={{ width: `${Math.round(dp.pct * 100)}%`, background: '#ffd23f' }} /></div></div>
      <Btn variant="green" className="w-full mt-4 !text-lg" onClick={() => { audio.sfx('click'); nextYear() }}>Next year ▶</Btn>
    </Modal>
  )
}

export function ShopModal() {
  const { life, act, openSheet } = useGame()
  const items = useMemo(() => (life ? getShopItems(life) : []), [life])
  return (
    <Modal title="Shop" onClose={() => openSheet(null)}>
      {items.length === 0 && <p className="opacity-70">Nothing new to buy right now. Check back when you are older or richer.</p>}
      <div className="grid gap-2">
        {items.map(({ item, affordable }) => (
          <button key={item.id} className="card-btn" disabled={!affordable} onClick={() => act('shop', { itemId: item.id })}>
            <div className="flex justify-between"><b>{item.icon} {item.name}</b><span className="chip">{nairaShort(item.price)}</span></div>
            <div className="text-xs opacity-75">{item.desc}</div>
          </button>
        ))}
      </div>
      <Btn variant="ghost" className="w-full mt-3" onClick={() => openSheet(null)}>Close</Btn>
    </Modal>
  )
}

export function JobsModal() {
  const { life, act, openSheet } = useGame()
  const opts = useMemo(() => (life ? getJobOptions(life) : []), [life])
  return (
    <Modal title="Look for work" onClose={() => openSheet(null)}>
      <p className="text-sm opacity-75 mb-2">Pick a career track to apply for an entry job. Costs ⚡15.</p>
      <div className="grid gap-2">
        {opts.map((o) => (
          <button key={o.track.id} className="card-btn" disabled={!o.ok} onClick={() => act('applyJob', { track: o.track.id })}>
            <div><b>{o.track.icon} {o.track.name}</b></div>
            <div className="text-xs opacity-75">{o.track.blurb}</div>
            {!o.ok && <div className="text-xs mt-1 text-yellow-300">🔒 {o.why}</div>}
          </button>
        ))}
      </div>
      <Btn variant="ghost" className="w-full mt-3" onClick={() => openSheet(null)}>Close</Btn>
    </Modal>
  )
}

export function PickModal({ kind }: { kind: 'social' | 'family' }) {
  const { life, openSheet, startTalk } = useGame()
  if (!life) return null
  const roles: NpcRole[] = kind === 'social' ? ['friend', 'friend2', 'partner'] : ['mother', 'father', 'sibling', 'partner', 'child']
  const entries = roles.map((r) => ({ r, n: life.npcs[life.roles[r] ?? ''] })).filter((e) => e.n && e.n.alive && (kind === 'family' || e.r !== 'partner' || true))
  const kids = kind === 'family' ? life.character.childrenIds.map((id) => life.npcs[id]).filter((n) => n?.alive) : []
  return (
    <Modal title={kind === 'social' ? 'Who do you hang out with?' : 'Family time'} onClose={() => openSheet(null)}>
      <div className="grid gap-2">
        {entries.filter((e) => e.r !== 'child').map(({ r, n }) => (
          <button key={n.id} className="card-btn" onClick={() => startTalk(kind === 'social' ? 'hang' : 'family', r)}>
            <div className="flex justify-between"><b>{n.name} <span className="opacity-60 text-xs">({r === 'friend2' ? 'friend' : r})</span></b><span className="chip">❤ {n.closeness}</span></div>
            <div className="bar mt-1.5"><i style={{ width: `${n.closeness}%`, background: '#ff7ab8' }} /></div>
          </button>
        ))}
        {kids.length > 0 && kids.slice(0, 1).map((k) => (
          <button key={k.id} className="card-btn" onClick={() => startTalk('family', 'child')}>
            <div className="flex justify-between"><b>{k.name} <span className="opacity-60 text-xs">(child)</span></b><span className="chip">❤ {k.closeness}</span></div>
          </button>
        ))}
      </div>
      <Btn variant="ghost" className="w-full mt-3" onClick={() => openSheet(null)}>Cancel</Btn>
    </Modal>
  )
}

export function QuestsModal() {
  const { life, openSheet } = useGame()
  if (!life) return null
  const dp = getDreamProgress(life)
  const dream = DREAM_BY_ID[life.character.dreamId]
  return (
    <Modal title="Quests & Dream" onClose={() => openSheet(null)} wide>
      <div className="card p-3"><b>{dream.icon} Dream: {dream.name}</b><div className="text-sm opacity-75">{dream.blurb}</div><div className="text-xs mt-1">{dp.text}</div><div className="bar mt-1.5"><i style={{ width: `${Math.round(dp.pct * 100)}%`, background: '#ffd23f' }} /></div></div>
      <div className="mt-3 grid gap-2">
        {QUESTS.map((q) => {
          const st = life.quests[q.id] ?? { stage: 0, done: false }
          return (
            <div key={q.id} className="card p-3" style={st.done ? { opacity: 0.6 } : undefined}>
              <div className="flex justify-between"><b>{st.done ? '✅' : '🎯'} {q.title}</b><span className="chip">🐚 {q.cowries}</span></div>
              <div className="text-sm opacity-80 mt-0.5">{st.done ? q.rewardText : q.stages[Math.min(st.stage, q.stages.length - 1)].text}</div>
            </div>
          )
        })}
      </div>
      <div className="text-xs opacity-60 mt-3">Achievements this life: {life.achievements.length}/{ACHIEVEMENTS.length}</div>
      <Btn variant="ghost" className="w-full mt-3" onClick={() => openSheet(null)}>Close</Btn>
    </Modal>
  )
}

export function ProfileModal() {
  const { life, openSheet, abandonLife } = useGame()
  if (!life) return null
  const c = life.character
  const dream = DREAM_BY_ID[c.dreamId]
  const arch = ARCHETYPE_BY_ID[c.archetypeId]
  const people = Object.values(life.npcs).filter((n) => n.role !== 'child')
  return (
    <Modal title="Profile" onClose={() => openSheet(null)} wide>
      <div className="flex gap-3 items-center">
        <div className="card p-1 pattern-ankara"><Avatar look={c.appearance} gender={c.gender} age={c.age} size={96} /></div>
        <div className="min-w-0">
          <div className="font-display text-3xl text-danfo leading-none">{c.nickname || c.name}</div>
          <div className="text-xs opacity-70">{c.gender === 'male' ? 'Male' : 'Female'} · {HERITAGE_LABEL[c.heritage]} · age {c.age}</div>
          <div className="text-xs mt-1">{arch.icon} {arch.title}</div>
          <div className="text-xs">{dream.icon} Dream: {dream.name}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">{c.traits.map((t) => <span key={t} className="chip">{TRAIT_BY_ID[t].icon} {TRAIT_BY_ID[t].name}</span>)}</div>
      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
        <div className="card p-2"><div className="text-xs opacity-60">Education</div><b>{{ none: c.edu.credential === 'degree' ? 'Degree' : c.edu.credential === 'ond' ? 'Diploma (OND)' : c.edu.credential === 'trade' ? 'Trade certified' : c.edu.credential === 'ssce' ? 'WAEC/SSCE' : 'Primary', primary: 'Primary school', jss: 'Junior secondary', sss: 'Senior secondary', university: 'University', polytechnic: 'Polytechnic', apprentice: 'Apprentice' }[c.edu.level]}</b></div>
        <div className="card p-2"><div className="text-xs opacity-60">Career</div><b>{c.job ? `${c.job.title}` : 'Not working'}</b>{c.job && <div className="text-xs opacity-70">{TRACKS.find((t) => t.id === c.job!.trackId)?.name} · {nairaShort(c.job.salary)}/yr</div>}</div>
        <div className="card p-2"><div className="text-xs opacity-60">Home</div><b>{c.housing.type === 'family' ? 'Family house' : c.housing.type === 'own' ? 'Own home' : RENT_NAME[c.housing.tier]}</b></div>
        <div className="card p-2"><div className="text-xs opacity-60">Items</div><b>{c.items.length ? c.items.map((i) => ITEM_BY_ID[i]?.icon).join(' ') : 'None yet'}</b></div>
      </div>
      <div className="mt-3 text-xs font-extrabold uppercase tracking-wider opacity-60">People</div>
      <div className="grid gap-1.5 mt-1">
        {people.map((n) => (
          <div key={n.id} className="flex items-center gap-2 text-sm">
            <span className="w-24 truncate" style={{ opacity: n.alive ? 1 : 0.5 }}>{n.name}{!n.alive ? ' ✝' : ''}</span>
            <span className="text-xs opacity-60 w-14">{n.role === 'friend2' ? 'friend' : n.role}</span>
            <div className="bar flex-1"><i style={{ width: `${n.closeness}%`, background: '#ff7ab8' }} /></div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <Btn variant="ghost" className="flex-1" onClick={() => openSheet(null)}>Close</Btn>
        <Btn variant="danger" className="flex-1" onClick={() => { if (confirm('Abandon this life? Progress will be lost.')) abandonLife() }}>Abandon life</Btn>
      </div>
    </Modal>
  )
}

export function LifestyleModal() {
  const { life, lifestyle, openSheet } = useGame()
  if (!life) return null
  const opts = [
    { id: 'frugal', icon: '🪙', name: 'Frugal', desc: 'Costs 30% less. Fewer treats, more savings.' },
    { id: 'normal', icon: '🏠', name: 'Normal', desc: 'Balanced spending.' },
    { id: 'baller', icon: '💎', name: 'Baller', desc: 'Costs 60% more. People notice. Your bank also notices.' },
  ] as const
  return (
    <Modal title="Lifestyle" onClose={() => openSheet(null)}>
      <p className="text-sm opacity-75 mb-2">Affects what food, rent and upkeep cost each year.</p>
      <div className="grid gap-2">
        {opts.map((o) => (
          <button key={o.id} className="card-btn" style={life.character.lifestyle === o.id ? { borderColor: '#ffd23f' } : undefined} onClick={() => lifestyle(o.id)}>
            <b>{o.icon} {o.name}</b><div className="text-xs opacity-75">{o.desc}</div>
          </button>
        ))}
      </div>
    </Modal>
  )
}

export function PaywallModal() {
  const { meta, openSheet, topUpTest, go } = useGame()
  const left = remainingSec(meta)
  const out = left <= 0
  const refill = fmtTime(secondsToNextRefill())
  return (
    <Modal title={out ? 'Out of play time' : 'Play time'} onClose={out ? undefined : () => openSheet(null)} wide>
      <div className="card p-3 text-center">
        <div className="text-xs opacity-60">Time left</div>
        <div className="font-display text-5xl text-danfo">{fmtTime(left)}</div>
        <div className="text-xs opacity-70 mt-1">Free: {fmtTime(meta.tokens.freeSec)} · Topped up: {fmtTime(meta.tokens.paidSec)}</div>
      </div>
      <p className="text-sm opacity-80 mt-3 leading-relaxed">{out ? 'Your life is safely saved. ' : ''}You get free play time every day (up to 2 hours banked). Next free refill in <b>{refill}</b>. Or top up to keep playing now.</p>
      <div className="grid gap-2 mt-3">
        {TOP_UP_PACKS.map((p) => (
          <button key={p.id} className="card-btn" onClick={() => topUpTest(p.minutes)}>
            <div className="flex justify-between"><b>⏱ {p.label}</b><span className="chip">{naira(p.price)}</span></div>
            <div className="text-xs opacity-60">Test mode: tapping adds the time without payment. Real payments come in the next milestone.</div>
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        {!out && <Btn variant="ghost" className="flex-1" onClick={() => openSheet(null)}>Close</Btn>}
        <Btn variant="ghost" className="flex-1" onClick={() => go('achievements')}>🏆 Browse achievements</Btn>
        {out && <Btn variant="ghost" className="flex-1" onClick={() => go('title')}>Main menu</Btn>}
      </div>
    </Modal>
  )
}

export function TutorialModal() {
  const finish = useGame((x) => x.finishTutorial)
  return (
    <Modal title="How life works" wide>
      <ol className="space-y-2 text-sm leading-relaxed">
        <li>⚡ <b>Each year you have Energy.</b> School and work use some automatically; spend the rest on activities: study, hustle, friends, rest, or the Go-Slow Dash game.</li>
        <li>🎲 <b>Then life happens.</b> Events show up with choices. There is rarely a perfect answer, only trade-offs.</li>
        <li>💰 <b>Money moves once a year.</b> Salary, rent, fees and family obligations ("black tax") are settled in the Year Summary.</li>
        <li>🎯 <b>Chase your Dream</b>, complete quests, collect achievements and earn 🐚 Cowries for new looks and perks next life.</li>
        <li>🏃 <b>Go-Slow Dash</b> is an arcade runner: coins become cash, distance keeps you healthy.</li>
      </ol>
      <Btn className="w-full mt-4" onClick={finish}>Got it. Let's live!</Btn>
    </Modal>
  )
}
