import { useMemo } from 'react'
import { useGame } from '../store'
import { Btn, Confetti, CountUp, DeltaChips, Modal, Ribbon, Tile, naira, nairaShort } from './components'
import { Icon } from './icons'
import { Lines } from './Guide'
import { ACTIVITY_BY_ID } from '@content/activities'
import { QUEST_HINTS, dreamGoal } from '../world/guide'
import { Avatar } from './Avatar'
import { currentEvent, getDreamProgress, getJobOptions, getShopItems } from '@engine/api'
import { QUESTS } from '@content/quests'
import { ACHIEVEMENTS } from '@content/achievements'
import { DREAM_BY_ID } from '@content/dreams'
import { TRAIT_BY_ID } from '@content/traits'
import { ARCHETYPE_BY_ID } from '@content/archetypes'
import { TRACKS } from '@content/jobs'
import { ITEM_BY_ID, wearOf } from '@content/items'
import { CITIES, cityOfHome } from '@content/cities'
import { DISTRICTS } from '../world/layout'
import { RENT_NAME } from '@engine/systems/economy'
import { fmtTime, remainingSec, secondsToNextRefill, TOP_UP_PACKS } from '@platform/tokens'
import type { NpcRole } from '@engine/core/types'
import { audio } from '@platform/audio'
import { HERITAGE_LABEL } from '@content/names'
import { addFlag } from '@platform/feedback'
import { track } from '@platform/analytics'

const RISK = { safe: ['🟢', 'Safe'], risky: ['🟠', 'Risky'], gamble: ['🔴', 'Gamble'] } as const
const TIER_LABEL = { critSuccess: ['🌟', 'Brilliant!'], success: ['✅', 'It worked'], fail: ['😬', 'Not great'], critFail: ['💥', 'Disaster'] } as const

export function EventModal() {
  const { life, choose, proceed } = useGame()
  const cur = useMemo(() => (life ? currentEvent(life) : undefined), [life])
  if (!life || !cur) return null
  const result = life.activeEvent?.result
  const npc = cur.event.who ? life.npcs[life.roles[cur.event.who] ?? ''] : undefined
  const queueLeft = life.eventQueue.length
  const flag = () => { const note = window.prompt(`Feedback on "${cur.event.title}" (wrong, offensive, inaccurate, or could be funnier?)`); if (note) { track('content_flagged', { event_id: cur.event.id, reason: 'flagged' }); addFlag({ contentId: cur.event.id, kind: 'event', age: life.character.age, note }); useGame.getState().toast('Thanks, feedback saved') } }
  return (
    <Modal wide>
      <div className="flex items-center gap-2">
        <span className="chip chip-pink"><Icon name="clock" size={13} /> Age {life.character.age}</span>
        {queueLeft > 1 && <span className="chip">+{queueLeft - 1}</span>}
        <span className="flex-1" />
        <button className="chip" aria-label="Flag this event for the playtest feedback log" onClick={flag}><Icon name="flag" size={13} /></button>
      </div>
      <div className="flex items-center gap-3 mt-2">
        {npc && <div className="w-14 h-14 rounded-full grid place-items-center text-2xl font-display shrink-0" style={{ background: 'radial-gradient(circle at 30% 20%, #ff8ec2, #7a2a9a)', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,.35)' }} title={npc.name}>{npc.name[0]}</div>}
        <h2 className="font-display text-[28px] text-white leading-[1.05]" style={{ textShadow: '0 2px 0 rgba(0,0,0,.4)' }}>{cur.event.title}</h2>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed opacity-90">{cur.text}</p>
      {!result ? (
        <div className="mt-4 flex flex-col gap-2.5 stagger">
          {cur.choices.map(({ choice, label, affordable }, i) => (
            <button key={choice.id} className="card-btn flex items-center gap-3" onClick={() => { audio.sfx('click'); choose(choice.id) }}>
              <span className="grid place-items-center w-8 h-8 rounded-full shrink-0 font-display" style={{ background: 'var(--gold)', color: '#3b2300' }}>{'ABCD'[i]}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-extrabold leading-snug">{label}</span>
                <span className="flex flex-wrap gap-1.5 mt-1 empty:hidden">
                  {choice.risk && <span className="chip !py-0.5">{RISK[choice.risk][0]} {RISK[choice.risk][1]}</span>}
                  {choice.cost?.cash ? <span className={`chip !py-0.5 ${affordable ? 'chip-gold' : 'chip-red'}`}>{naira(-choice.cost.cash)}{!affordable ? ' (debt)' : ''}</span> : null}
                  {choice.cost?.energy ? <span className="chip !py-0.5"><Icon name="bolt" size={12} color="#ffd23f" />−{choice.cost.energy}</span> : null}
                </span>
                {choice.hint && <span className="block text-xs opacity-65 mt-0.5">{choice.hint}</span>}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 pop">
          {result.tier && <div className={`chip !text-sm mb-2 ${result.tier === 'critSuccess' || result.tier === 'success' ? 'chip-green' : 'chip-red'}`}>{TIER_LABEL[result.tier][0]} {TIER_LABEL[result.tier][1]}</div>}
          {result.tier === 'critSuccess' && <Confetti />}
          <div className="hud-glass rounded-2xl p-3 text-[17px] leading-snug">{result.text || 'It is done.'}</div>
          <DeltaChips deltas={result.deltas} />
          <Btn variant="green" shine className="w-full mt-4 !text-lg" onClick={proceed}>Continue <Icon name="chevron" size={18} /></Btn>
        </div>
      )}
    </Modal>
  )
}

export function QuizModal() {
  const { life, answer, quizFeedback, clearQuiz, toast } = useGame()
  if (!life) return null
  const fb = quizFeedback
  // studying counts in rounds (twice a year): say which round this is, and celebrate only when the last one is done
  const cap = ACTIVITY_BY_ID.study?.maxPerYear ?? 2
  const round = Math.min(Number(life.activityCounts.study ?? 1), cap)
  const yearDone = !!fb?.last && round >= cap
  const moreToDo = !!fb?.last && round < cap
  const quiz = life.quiz
  const q = fb ? fb.q : quiz?.questions[quiz.index]
  if (!q) return null
  const total = quiz?.questions.length ?? 3
  const n = quiz ? Math.min(quiz.index + 1, total) : total
  return (
    <Modal wide title="Pop quiz!">
      <div className="flex items-center gap-2">
        <span className="chip chip-pink uppercase">{q.subject}</span>
        <span className="chip !py-0.5">Round {round} of {cap}</span>
        <div className="flex gap-1.5 flex-1 justify-end">{Array.from({ length: total }, (_, i) => <span key={i} className="w-7 h-2 rounded-full" style={{ background: i < n ? 'var(--gold)' : 'rgba(255,255,255,.18)' }} />)}</div>
      </div>
      <p className="text-xl font-bold leading-snug mt-3">{q.q}</p>
      <div className="mt-3 grid gap-2.5">
        {q.options.map((o, i) => {
          const picked = fb && fb.picked === i
          const right = fb && q.answer === i
          return (
            <button key={i} className="card-btn flex items-center gap-3" disabled={!!fb} onClick={() => answer(i)}
              style={fb ? { borderColor: right ? '#2fd27b' : picked ? '#ff6b5e' : undefined, background: right ? '#1d5a3a' : picked ? '#5a1f24' : undefined, opacity: 1 } : undefined}>
              <span className="grid place-items-center w-8 h-8 rounded-full shrink-0 font-display bg-white/15">{right ? <Icon name="check" size={16} color="#8dffbb" /> : picked ? <Icon name="close" size={14} color="#ffb0b3" /> : 'ABCD'[i]}</span>
              <span className="font-bold">{o}</span>
            </button>
          )
        })}
      </div>
      {fb && (
        <div className="mt-3 pop">
          <div className={`chip !text-sm ${fb.correct ? 'chip-green' : 'chip-red'}`}>{fb.correct ? 'Correct!' : 'Not quite'}</div>
          <div className="hud-glass rounded-2xl p-3 mt-2 text-sm">{fb.funny ?? (fb.correct ? '+Knowledge' : 'It happens to the best of us.')}</div>
          {moreToDo && <div className="rounded-2xl p-3 mt-2 text-sm font-bold leading-snug" style={{ background: 'rgba(255,210,63,.16)', boxShadow: 'inset 0 0 0 1.5px rgba(255,210,63,.55)' }}>📚 Round {round} of {cap} done. You still need to study {cap - round === 1 ? 'one more time' : `${cap - round} more times`} to finish studying for this year.</div>}
          {yearDone && <><Confetti n={40} /><div className="text-center mt-3"><Ribbon>Congratulations!</Ribbon><div className="font-display text-xl mt-2 text-gold">You finished studying for the year!</div></div></>}
          <Btn variant="green" className="w-full mt-3" onClick={() => { clearQuiz(); if (moreToDo) toast(`📚 Round ${round} of ${cap} done. Study once more to finish this year.`) }}>{yearDone ? 'Continue' : fb.last ? 'Finish' : 'Next'} <Icon name="chevron" size={18} /></Btn>
        </div>
      )}
    </Modal>
  )
}

export function SummaryModal() {
  const { life, nextYear } = useGame()
  if (!life?.summary) return null
  const s = life.summary
  const dp = getDreamProgress(life)
  const dream = DREAM_BY_ID[life.character.dreamId]
  const net = s.income - s.expenses
  return (
    <Modal wide title={`Age ${s.age}`}>
      {net > 0 && <Confetti n={24} />}
      <h2 className="font-display text-[26px] text-white leading-tight text-center" style={{ textShadow: '0 2px 0 rgba(0,0,0,.4)' }}>{s.headline}</h2>
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <div className="hud-glass rounded-2xl p-3 text-center"><div className="chip chip-green !py-0.5"><Icon name="up" size={12} /> In</div><div className="font-display text-2xl text-green-300 mt-1"><CountUp to={s.income} format={naira} /></div></div>
        <div className="hud-glass rounded-2xl p-3 text-center"><div className="chip chip-red !py-0.5"><Icon name="down" size={12} /> Out</div><div className="font-display text-2xl text-red-300 mt-1"><CountUp to={-s.expenses} format={naira} /></div></div>
      </div>
      <DeltaChips deltas={s.deltas.filter((d) => d.stat !== 'cash')} limit={10} />
      <div className="hud-glass rounded-2xl p-3 mt-3 flex items-center gap-3">
        <span className="text-3xl">{dream.icon}</span>
        <div className="flex-1 min-w-0"><div className="font-display text-sm uppercase">{dream.name}</div><div className="bar mt-1.5"><i style={{ width: `${Math.round(dp.pct * 100)}%`, background: 'linear-gradient(90deg,#ffe27a,#ffc72c)' }} /></div></div>
        <span className="font-display text-gold">{Math.round(dp.pct * 100)}%</span>
      </div>
      {s.lines.length > 0 && (
        <details className="mt-3 group">
          <summary className="chip cursor-pointer list-none">What happened <Icon name="chevron" size={12} /></summary>
          <ul className="mt-2 text-sm space-y-1 opacity-85">{s.lines.slice(0, 9).map((l, i) => <li key={i}>• {l}</li>)}</ul>
        </details>
      )}
      <Btn variant="green" shine className="w-full mt-4 !text-xl" onClick={() => { audio.sfx('click'); nextYear() }}>Next year <Icon name="chevron" size={20} /></Btn>
    </Modal>
  )
}

export function ShopModal() {
  const { life, act, openSheet } = useGame()
  const items = useMemo(() => (life ? getShopItems(life) : []), [life])
  return (
    <Modal title="Shop" onClose={() => openSheet(null)}>
      {items.length === 0 && <p className="opacity-70 text-center py-6">Nothing new to buy yet.</p>}
      <div className="grid grid-cols-2 gap-2.5">
        {items.map(({ item, affordable }) => (
          <button key={item.id} className="tile" disabled={!affordable} onClick={() => act('shop', { itemId: item.id })}>
            <span className="text-[34px] leading-none">{item.icon}</span>
            <span className="font-display text-[14px] uppercase leading-tight text-center">{item.name}</span>
            <span className="chip chip-gold !py-0.5">{nairaShort(item.price)}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

export function JobsModal() {
  const { life, act, openSheet } = useGame()
  const opts = useMemo(() => (life ? getJobOptions(life) : []), [life])
  return (
    <Modal title="Look for work" onClose={() => openSheet(null)}>
      <div className="grid grid-cols-2 gap-2.5">
        {opts.map((o) => (
          <button key={o.track.id} className="tile" disabled={!o.ok} onClick={() => act('applyJob', { track: o.track.id })}>
            <span className="text-[34px] leading-none">{o.ok ? o.track.icon : '🔒'}</span>
            <span className="font-display text-[14px] uppercase leading-tight text-center">{o.track.name}</span>
            {!o.ok && <span className="text-[11px] font-bold text-yellow-300 text-center leading-tight">{o.why}</span>}
          </button>
        ))}
      </div>
      <div className="text-center mt-3"><span className="chip"><Icon name="bolt" size={12} color="#ffd23f" />15</span></div>
    </Modal>
  )
}

export function PickModal({ kind }: { kind: 'social' | 'family' }) {
  const { life, openSheet, startTalk } = useGame()
  if (!life) return null
  const roles: NpcRole[] = kind === 'social' ? ['friend', 'friend2', 'partner'] : ['mother', 'father', 'sibling', 'partner', 'child']
  const entries = roles.map((r) => ({ r, n: life.npcs[life.roles[r] ?? ''] })).filter((e) => e.n && e.n.alive)
  const kids = kind === 'family' ? life.character.childrenIds.map((id) => life.npcs[id]).filter((n) => n?.alive) : []
  const people = [...entries.filter((e) => e.r !== 'child').map(({ r, n }) => ({ id: n.id, name: n.name, closeness: n.closeness, role: r })), ...kids.slice(0, 1).map((k) => ({ id: k.id, name: k.name, closeness: k.closeness, role: 'child' as NpcRole }))]
  return (
    <Modal title={kind === 'social' ? 'Hang out with' : 'Family time'} onClose={() => openSheet(null)}>
      <div className="grid grid-cols-3 gap-2.5">
        {people.map((p) => (
          <button key={p.id} className="tile" onClick={() => startTalk(kind === 'social' ? 'hang' : 'family', p.role)}>
            <span className="w-12 h-12 rounded-full grid place-items-center text-xl font-display" style={{ background: 'radial-gradient(circle at 30% 20%, #ff8ec2, #7a2a9a)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.35)' }}>{p.name[0]}</span>
            <span className="font-display text-[14px] uppercase leading-tight">{p.name}</span>
            <span className="flex items-center gap-1 text-[12px] font-extrabold"><Icon name="heart" size={12} color="#ff7ab8" />{p.closeness}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

export function QuestsModal() {
  const { life, meta, openSheet, setGuideTrack } = useGame()
  if (!life) return null
  const lang = meta.settings.lang ?? 'en'
  const dp = getDreamProgress(life)
  const dream = DREAM_BY_ID[life.character.dreamId]
  const goal = dreamGoal(life)
  return (
    <Modal title="Quests" onClose={() => openSheet(null)} wide>
      <div className="hud-glass rounded-2xl p-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{dream.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-yellow-300">Your big dream</div>
            <div className="font-display text-lg uppercase leading-none">{dream.name}</div>
            <div className="bar mt-1.5"><i style={{ width: `${Math.round(dp.pct * 100)}%`, background: 'linear-gradient(90deg,#ffe27a,#ffc72c)' }} /></div>
          </div>
          <span className="font-display text-xl text-gold">{Math.round(dp.pct * 100)}%</span>
        </div>
        {dream.stages.length > 0 ? (
          <ol className="mt-3 grid gap-1.5">
            {dream.stages.map((st, i) => {
              const at = life.dreamDone ? dream.stages.length : life.dreamStage ?? 0
              const done = i < at, now = i === at
              return (
                <li key={i} className="flex items-center gap-2 text-[13px] font-bold leading-tight" style={{ opacity: done ? 0.6 : now ? 1 : 0.5 }}>
                  <span className="grid place-items-center w-6 h-6 rounded-full text-[12px] shrink-0" style={{ background: done ? 'var(--green)' : now ? 'var(--gold)' : 'rgba(255,255,255,.16)', color: done ? '#04361c' : now ? '#3b2300' : '#fff' }}>{done ? '✓' : i === dream.stages.length - 1 ? '★' : i + 1}</span>
                  <span className={now ? 'text-gold' : ''}>{st.title}</span>
                </li>
              )
            })}
          </ol>
        ) : <div className="text-xs opacity-70 mt-2">{dp.text}</div>}
        {goal && (
          <div className="mt-3 rounded-2xl p-2.5" style={{ background: 'rgba(255,210,63,.12)' }}>
            <div className="text-[12px] font-bold leading-snug text-gold">📍 <Lines lang={lang} s={goal.suggestion.say} /></div>
            {goal.note && <div className="text-[12px] leading-snug mt-1 opacity-90">⏳ {goal.note}</div>}
            <button className="chip chip-green mt-1.5" onClick={() => { audio.sfx('click'); setGuideTrack({ place: goal.suggestion.place, say: goal.suggestion.say, act: goal.suggestion.act }); openSheet(null) }}><Icon name="pin" size={12} />Show me</button>
          </div>
        )}
      </div>
      <div className="mt-3 grid gap-2.5 stagger">
        {QUESTS.map((q) => {
          const st = life.quests[q.id] ?? { stage: 0, done: false }
          const stage = Math.min(st.stage, q.stages.length - 1)
          const hint = QUEST_HINTS[q.id]?.[stage]
          return (
            <div key={q.id} className="card p-3 flex gap-3 items-center" style={st.done ? { opacity: 0.65 } : undefined}>
              <span className="grid place-items-center w-11 h-11 rounded-full shrink-0" style={{ background: st.done ? 'var(--green)' : 'rgba(255,255,255,.14)' }}><Icon name={st.done ? 'check' : 'flag'} size={20} color={st.done ? '#04361c' : '#fff'} /></span>
              <div className="flex-1 min-w-0">
                <div className="font-display uppercase text-[15px] leading-tight">{q.title}</div>
                <div className="text-xs opacity-75 mt-0.5 leading-snug">{st.done ? q.rewardText : q.stages[stage].text}</div>
                {!st.done && hint && <div className="text-[12px] font-bold mt-1 leading-snug text-gold">📍 <Lines lang={lang} s={hint.say} /></div>}
                {!st.done && hint?.place && <button className="chip chip-green mt-1.5" onClick={() => { audio.sfx('click'); setGuideTrack({ place: hint.place!, say: hint.say, act: hint.act, voice: `quest_${q.id}_${stage}` }) }}><Icon name="pin" size={12} />Show me</button>}
                {!st.done && <div className="flex gap-1 mt-1.5">{q.stages.map((_, i) => <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i < st.stage ? 'var(--green)' : 'rgba(255,255,255,.18)' }} />)}</div>}
              </div>
              <span className="chip chip-gold shrink-0"><Icon name="shell" size={13} color="#3b2300" />{q.cowries}</span>
            </div>
          )
        })}
      </div>
      <div className="text-center mt-3"><span className="chip"><Icon name="trophy" size={13} color="#ffd23f" /> {life.achievements.length}/{ACHIEVEMENTS.length}</span></div>
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
        <div className="card p-1 pattern-ankara"><Avatar look={c.appearance} gender={c.gender} age={c.age} wear={wearOf(c.items)} size={96} /></div>
        <div className="min-w-0">
          <div className="font-display text-3xl text-danfo leading-none">{c.nickname || c.name}</div>
          <div className="text-xs opacity-70">{c.gender === 'male' ? 'Male' : 'Female'} · {HERITAGE_LABEL[c.heritage]} · age {c.age}</div>
          <div className="text-xs mt-1">{arch.icon} {arch.title}</div>
          <div className="text-xs">{dream.icon} Dream: {dream.name}</div>
          <div className="text-xs opacity-80">📍 {DISTRICTS[c.housing.districtId]?.name ?? 'Home'}, {CITIES[cityOfHome(c.housing.districtId)].name}</div>
        </div>
      </div>
      {dream.item && ITEM_BY_ID[dream.item] && <div className="mt-3 rounded-2xl p-2.5 flex items-center gap-3" style={{ background: 'rgba(255,210,63,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,210,63,.5)' }}><span className="text-[30px] leading-none">{ITEM_BY_ID[dream.item!].icon}</span><div className="min-w-0"><div className="text-[10px] font-extrabold uppercase tracking-wider text-yellow-300">Your dream symbol</div><div className="font-display text-[16px] leading-tight">{ITEM_BY_ID[dream.item!].name}</div><div className="text-[12px] opacity-80 leading-snug">{ITEM_BY_ID[dream.item!].desc}</div></div></div>}
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
    { id: 'frugal', icon: '🪙', name: 'Frugal', tag: '−30% costs' },
    { id: 'normal', icon: '🏠', name: 'Normal', tag: 'Balanced' },
    { id: 'baller', icon: '💎', name: 'Baller', tag: '+60% costs' },
  ] as const
  return (
    <Modal title="Lifestyle" onClose={() => openSheet(null)}>
      <div className="grid grid-cols-3 gap-2.5">
        {opts.map((o) => <Tile key={o.id} emoji={o.icon} label={o.name} sub={o.tag} on={life.character.lifestyle === o.id} onClick={() => lifestyle(o.id)} />)}
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
      <div className="hud-glass rounded-3xl p-4 text-center">
        <Icon name="hourglass" size={30} color="#ffd23f" />
        <div className="font-display text-5xl text-gold leading-none mt-1">{fmtTime(left)}</div>
        <div className="flex justify-center gap-2 mt-2"><span className="chip">Free {fmtTime(meta.tokens.freeSec)}</span><span className="chip chip-gold">Paid {fmtTime(meta.tokens.paidSec)}</span></div>
        <div className="text-xs opacity-70 mt-2">{out ? 'Your life is saved. ' : ''}Free refill in {refill}</div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        {TOP_UP_PACKS.map((p) => (
          <button key={p.id} className="tile" onClick={() => topUpTest(p.minutes)}>
            <Icon name="clock" size={28} />
            <span className="font-display text-[15px] uppercase">{p.label}</span>
            <span className="chip chip-gold !py-0.5">{naira(p.price)}</span>
          </button>
        ))}
      </div>
      <div className="text-[11px] opacity-55 text-center mt-2">Test mode: no payment is taken yet.</div>
      <div className="flex gap-2 mt-3">
        <Btn variant="ghost" className="flex-1" onClick={() => go('achievements')}><Icon name="trophy" size={18} /> Trophies</Btn>
        {out && <Btn variant="ghost" className="flex-1" onClick={() => go('title')}>Menu</Btn>}
      </div>
    </Modal>
  )
}

export function TutorialModal() {
  const finish = useGame((x) => x.finishTutorial)
  const steps: [string, string][] = [['⚡', 'Energy each year. Spend it on activities.'], ['🎲', 'Events bring choices. Trade-offs, not answers.'], ['💰', 'Money settles once a year.'], ['🎯', 'Chase your dream. Earn 🐚 for next life.']]
  return (
    <Modal title="How life works" wide>
      <div className="grid grid-cols-2 gap-2.5 stagger">
        {steps.map(([e, t]) => <div key={e} className="hud-glass rounded-2xl p-3 text-center"><div className="text-3xl">{e}</div><div className="text-sm font-bold mt-1 leading-snug">{t}</div></div>)}
      </div>
      <Btn variant="green" shine className="w-full mt-4 !text-lg" onClick={finish}>Let's live!</Btn>
    </Modal>
  )
}


/** The big dream just came true. Keep playing, or close this life and roll a new one. */
export function DreamDoneModal() {
  const { life, openSheet, finishDream } = useGame()
  if (!life) return null
  const c = life.character
  const dream = DREAM_BY_ID[c.dreamId]
  return (
    <Modal>
      <Confetti n={36} />
      <div className="text-center">
        <div className="text-[64px] leading-none">{dream.icon}</div>
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-yellow-300 mt-2">Dream achieved</div>
        <h2 className="font-display text-[30px] text-white leading-tight uppercase" style={{ textShadow: '0 3px 0 rgba(0,0,0,.45)' }}>{dream.name}</h2>
        <p className="text-sm opacity-90 mt-2 leading-snug">{c.nickname || c.name} did it at {c.age}. From a small child to the dream. Well done!</p>
      </div>
      <div className="grid gap-2 mt-4">
        <Btn variant="green" shine onClick={() => { audio.sfx('click'); finishDream() }}><Icon name="trophy" size={20} color="#fff" /> Finish this life and roll a new one</Btn>
        <Btn variant="ghost" onClick={() => { audio.sfx('click'); openSheet(null) }}>Keep playing this life</Btn>
      </div>
    </Modal>
  )
}
