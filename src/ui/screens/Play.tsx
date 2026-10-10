import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useGame } from '../../store'
import { Btn, DeltaChips, StatBar, naira, nairaShort } from '../components'
import { Avatar } from '../Avatar'
import { SceneArt } from '../SceneArt'
import { getActivities, getDreamProgress } from '@engine/api'
import { stageForAge } from '@engine/core/helpers'
import { DREAM_BY_ID } from '@content/dreams'
import { fmtTime, remainingSec } from '@platform/tokens'
import { audio } from '@platform/audio'
import { EventModal, QuizModal, SummaryModal, ShopModal, JobsModal, PickModal, QuestsModal, ProfileModal, LifestyleModal, PaywallModal, TutorialModal } from '../modals'
import { NpcModal, PlaceModal, PlacesModal } from '../placeUi'
const World = lazy(() => import('./World'))

function webglOk(): boolean { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false } }

const STAGE_LABEL = { child: 'Childhood', teen: 'Teen years', youngAdult: 'Young adult', adult: 'Adult life', elder: 'Elder years' } as const

function PlayMenu({ onWorld }: { onWorld?: () => void }) {
  const g = useGame()
  const { life, meta } = g
  const [scene, setScene] = useState<string | null>(null)
  useEffect(() => { audio.playMusic('play') }, [])
  const acts = useMemo(() => (life ? getActivities(life).filter((a) => !a.def.hidden) : []), [life])
  if (!life) return null
  const c = life.character
  const stage = stageForAge(c.age)
  const inSchool = c.edu.level !== 'none'
  const defaultScene = c.job ? 'office' : inSchool ? 'school' : stage === 'child' || stage === 'teen' ? 'compound' : 'home'
  const dream = DREAM_BY_ID[c.dreamId]
  const dp = getDreamProgress(life)
  const reserved = Number(life.flags.__reserved ?? 0)
  const left = remainingSec(meta)
  const delta = (k: string) => life.yearDeltas.filter((d) => d.stat === k).reduce((a, d) => a + d.delta, 0)
  const phase = life.phase

  const onAct = (id: string) => {
    const def = acts.find((a) => a.def.id === id)?.def
    if (!def) return
    setScene(def.scene ?? null)
    if (id === 'socialise') return g.openSheet('pick-social')
    if (id === 'familyTime') return g.openSheet('pick-family')
    if (id === 'shop') return g.openSheet('shop')
    if (id === 'applyJob') return g.openSheet('jobs')
    if (id === 'dash') return g.startDash()
    if (id === 'quitJob' && !confirm('Resign from your job?')) return
    g.act(id)
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="px-3 pt-3 flex items-center gap-3">
        <button className="card p-1 shrink-0" onClick={() => g.openSheet('profile')} aria-label="Open profile"><Avatar look={c.appearance} gender={c.gender} age={c.age} uniform={inSchool && c.age < 18} size={52} /></button>
        <div className="min-w-0 flex-1">
          <div className="font-display text-2xl leading-none text-danfo truncate">{c.nickname || c.name}, {c.age}</div>
          <div className="text-xs opacity-75 truncate">{STAGE_LABEL[stage]} · {life.year}{inSchool ? ` · ${{ primary: 'Primary school', jss: 'Junior secondary', sss: 'Senior secondary', university: 'University', polytechnic: 'Polytechnic', apprentice: 'Apprenticeship', none: '' }[c.edu.level]}` : c.job ? ` · ${c.job.title}` : ''}</div>
        </div>
        <button className="chip shrink-0" onClick={() => g.openSheet('paywall')} aria-label="Play time left" title="Play time left">⏱ {fmtTime(left)}</button>
        {onWorld && <button className="btn btn-primary !min-h-10 !px-3 text-sm" onClick={onWorld}>🗺 World</button>}
        <button className="btn btn-ghost !min-h-10 !px-3" onClick={() => g.go('settings')} aria-label="Settings">⚙️</button>
      </header>

      {/* HUD */}
      <section className="px-3 mt-3">
        <div className="card p-3">
          <div className="flex items-baseline justify-between">
            <div className="font-display text-4xl text-green-300 tabular-nums" aria-label={`Cash ${naira(c.stats.cash)}`}>{nairaShort(c.stats.cash)}</div>
            <div className="text-xs opacity-70 text-right">{reserved > 0 ? `${inSchool ? 'School' : 'Work'} uses ⚡${reserved}` : ''}</div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 mt-2">
            <StatBar stat="energy" value={c.stats.energy} max={c.stats.maxEnergy} />
            <StatBar stat="happiness" value={c.stats.happiness} delta={delta('happiness')} />
            <StatBar stat="knowledge" value={c.stats.knowledge} delta={delta('knowledge')} />
            <StatBar stat="reputation" value={c.stats.reputation} delta={delta('reputation')} />
            <StatBar stat="health" value={c.stats.health} delta={delta('health')} />
            <StatBar stat="stress" value={c.stats.stress} delta={delta('stress')} />
          </div>
        </div>
      </section>

      {/* Scene */}
      <section className="px-3 mt-3">
        <div className="relative card overflow-hidden h-36">
          <SceneArt scene={scene ?? defaultScene} className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-x-0 bottom-0 p-2.5" style={{ background: 'linear-gradient(transparent, #000b)' }}>
            <div className="text-sm font-bold leading-snug">{life.lastAction?.text ?? `${dream.icon} Dream: ${dream.name} (${dp.text})`}</div>
            {life.lastAction && <DeltaChips deltas={life.lastAction.deltas} limit={5} />}
          </div>
        </div>
      </section>

      {/* Activities */}
      <section className="px-3 mt-3 flex-1">
        <div className="text-xs font-extrabold uppercase tracking-wider opacity-70 mb-1.5">What will you do this year?</div>
        <div className="grid grid-cols-2 gap-2">
          {acts.map(({ def, enabled, reason, remaining }) => (
            <button key={def.id} className="card-btn" disabled={!enabled || phase !== 'action'} onClick={() => onAct(def.id)} aria-label={`${def.label}. ${def.blurb}`}>
              <div className="flex items-center justify-between gap-1">
                <span className="font-extrabold">{def.icon} {def.label}</span>
                <span className="chip">{def.cost.energy ? `⚡${def.cost.energy}` : 'free'}{def.cost.cash ? ` · ${nairaShort(def.cost.cash)}` : ''}</span>
              </div>
              <div className="text-xs opacity-75 mt-0.5 leading-snug">{enabled ? def.blurb : <span className="text-yellow-300">{reason}</span>}</div>
              {remaining !== undefined && enabled && <div className="text-[10px] opacity-50 mt-0.5">{remaining} left this year</div>}
            </button>
          ))}
        </div>
      </section>

      <footer className="sticky bottom-0 mt-3 px-3 pt-2 pb-3 safe-pad z-10" style={{ background: '#14121f', borderTop: '1px solid #ffffff14' }}>
        <div className="flex gap-2 mb-2">
          <button className="chip !text-xs flex-1 justify-center !py-2" onClick={() => g.openSheet('quests')}>📋 Quests</button>
          <button className="chip !text-xs flex-1 justify-center !py-2" onClick={() => g.openSheet('lifestyle')}>🎚 Lifestyle: {c.lifestyle}</button>
          <button className="chip !text-xs flex-1 justify-center !py-2" onClick={() => g.openSheet('profile')}>👤 Profile</button>
        </div>
        <Btn variant="green" className="w-full !text-lg" disabled={phase !== 'action' || !!life.quiz} onClick={() => { audio.sfx('good'); g.endActions() }}>End year ▶ <span className="text-sm opacity-80">(age {c.age} → {c.age + 1})</span></Btn>
      </footer>

    </div>
  )
}

function Modals({ lite }: { lite: boolean }) {
  const g = useGame()
  const { life, meta, sheet } = g
  if (!life) return null
  const phase = life.phase
  return (
    <>
      {phase === 'events' && <EventModal />}
      {phase === 'summary' && <SummaryModal />}
      {(life.quiz || g.quizFeedback) && !(g.taskActive && !lite) && <QuizModal />}
      {sheet === 'shop' && <ShopModal />}
      {sheet === 'jobs' && <JobsModal />}
      {(sheet === 'pick-social' || sheet === 'pick-family') && <PickModal kind={sheet === 'pick-social' ? 'social' : 'family'} />}
      {sheet === 'quests' && <QuestsModal />}
      {sheet === 'profile' && <ProfileModal />}
      {sheet === 'lifestyle' && <LifestyleModal />}
      {sheet === 'paywall' && <PaywallModal />}
      {sheet === 'place' && <PlaceModal />}
      {sheet === 'npc' && <NpcModal />}
      {sheet === 'places' && <PlacesModal />}
      {lite && !meta.seenTutorial && phase !== 'ended' && <TutorialModal />}
    </>
  )
}

export function Play() {
  const { life, meta, updateSettings } = useGame()
  const ok = useMemo(() => webglOk(), [])
  useEffect(() => { audio.playMusic('play') }, [])
  if (!life) return null
  const lite = meta.settings.lite || !ok
  return (
    <>
      {lite ? <PlayMenu onWorld={ok ? () => updateSettings({ lite: false }) : undefined} /> : (
        <div className="fixed inset-0 mx-auto max-w-[480px] overflow-hidden"><Suspense fallback={<div className="p-8 text-center font-display text-3xl text-danfo">Loading your neighbourhood…</div>}><World /></Suspense></div>
      )}
      <Modals lite={lite} />
    </>
  )
}
