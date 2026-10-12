import { useMemo } from 'react'
import { useGame } from '../store'
import { Btn, DeltaChips, Modal, nairaShort } from './components'
import { Icon } from './icons'
import { getActivities } from '@engine/api'
import { DISTRICTS, buildDistrict, type PlaceId } from '../world/layout'
import { placeActive, placeNote, suggest } from '../world/guide'
import { INTERIORS } from '../world/interiors'
import { isOpen, opensAt, fmtClock } from '../world/time'
import { useActivityRouter } from './useActivities'
import { audio } from '@platform/audio'

/** Short, honest benefit text for each activity (shown as chips in place panels). */
const BENEFIT: Record<string, string> = {
  study: '📚 Knowledge', play: '😊 Happiness · ❤️ Health', chores: '⭐ Reputation · 👪 Mama', hustle: '💰 Side income', socialise: '🧑‍🤝‍🧑 Friendship · 😊', familyTime: '👪 Family bond',
  rest: '❤️ Health · 😌 less Stress', exercise: '❤️ Health · 😌 less Stress', community: '😊 Happiness · ⭐ Reputation', dash: '🪙 Coins · ❤️ Health', applyJob: '💼 A new job',
  overtime: '⭐ Reputation · promotion odds', treat: '😊 Happiness', shop: '🛒 Useful items', quitJob: 'Leave your job',
}

const emojis = (t: string) => Array.from(t.matchAll(/\p{Extended_Pictographic}/gu)).map((m) => m[0]).slice(0, 3).join(' ')

/** Big square activity tile: icon, short name, then only symbols (cost and reward). */
function ActTile({ icon, label, energy, cash, reward, reason, left, disabled, hot, guide, onClick }: { guide?: boolean; icon: string; label: string; energy?: number; cash?: number; reward?: string; reason?: string; left?: number; disabled?: boolean; hot?: boolean; onClick: () => void }) {
  return (
    <button className={`tile !justify-start !gap-1 !pt-3 ${hot ? 'is-on' : ''} ${guide ? 'guide-glow' : ''}`} disabled={disabled} onClick={onClick}>
      {guide && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 chip chip-gold !py-0 !text-[10px] guide-nudge">👉</span>}
      <span className="text-[34px] leading-none">{disabled && reason ? '🔒' : icon}</span>
      <span className="font-display text-[15px] leading-tight text-center uppercase tracking-wide">{label}</span>
      {disabled && reason ? <span className="text-[11px] font-bold text-yellow-300 leading-tight text-center">{reason}</span> : (
        <span className="flex flex-wrap justify-center gap-1 mt-0.5">
          <span className="chip !py-0.5">{energy ? <><Icon name="bolt" size={12} color="#ffd23f" />{energy}</> : 'free'}</span>
          {cash ? <span className="chip chip-gold !py-0.5">{nairaShort(cash)}</span> : null}
          {reward ? <span className="chip chip-green !py-0.5">{reward}</span> : null}
        </span>
      )}
      {left !== undefined && !disabled && <span className="text-[10px] font-bold opacity-60">{left} left</span>}
    </button>
  )
}

export function PlaceModal() {
  const { life, placeId, meta, openSheet, endActions, enterPlace, hour, startPenalty, startMarket, startChores, startShop, startJog, startMatch } = useGame()
  const route = useActivityRouter()
  const acts = useMemo(() => (life ? getActivities(life) : []), [life])
  const guideOn = meta.settings.guide !== false
  if (!life || !placeId) return null
  const district = buildDistrict(life.character.housing.districtId)
  const place = district.places.find((p) => p.id === placeId)
  if (!place) return null
  const rows = place.activities.map((id) => acts.find((a) => a.def.id === id)).filter(Boolean) as typeof acts
  const note = placeNote(life, placeId)
  const active = placeActive(life, placeId)
  const closed = !isOpen(placeId, hour)
  const lastDelta = life.lastAction?.deltas ?? []
  const idle = life.phase !== 'action'
  const sug = guideOn ? suggest(life) : null
  const mine = sug?.place === placeId ? sug : null
  const run = (def: (typeof rows)[number]['def']) => {
    audio.sfx('click')
    if (def.id === 'rest' && placeId === 'home') { enterPlace('home', 'sleep'); return }
    if (def.id === 'study' && INTERIORS[placeId]) { enterPlace(placeId); return }
    if (def.id === 'chores' && placeId === 'home') { startChores(); return }
    if ((def.id === 'overtime' || def.id === 'community') && INTERIORS[placeId]) { enterPlace(placeId); return }
    if (placeId === 'market' && def.id === 'shop') { startShop(); return }
    if (placeId === 'market' && def.id === 'hustle') { startMarket(); return }
    if (placeId === 'pitch' && def.id === 'exercise') { startJog(); return }
    if (placeId === 'pitch' && def.id === 'play') { startPenalty(def.id); return }
    if (def.id !== 'applyJob' && def.id !== 'socialise' && def.id !== 'familyTime' && def.id !== 'shop') openSheet(null)
    route(def.id)
  }
  return (
    <Modal onClose={() => openSheet(null)}>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-[20px] grid place-items-center text-4xl shrink-0" style={{ background: 'radial-gradient(circle at 30% 20%, #8a5cff, #3b22a8)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.25), 0 6px 0 rgba(0,0,0,.35)' }}>{place.icon}</div>
        <div className="min-w-0">
          <div className="font-display text-[26px] text-white leading-none" style={{ textShadow: '0 2px 0 rgba(0,0,0,.4)' }}>{place.name}</div>
          <div className="text-xs opacity-70 mt-1 leading-snug">{place.blurb}</div>
        </div>
      </div>
      {note && <div className="hud-glass rounded-2xl px-3 py-2 mt-3 text-sm flex gap-2 items-start"><Icon name="info" size={18} color="#5cc8ff" /><span>{note}</span></div>}
      {INTERIORS[placeId] && (closed
        ? <div className="chip chip-gold !text-sm mt-3"><Icon name="clock" size={14} color="#3b2300" /> Opens {fmtClock(opensAt(placeId))}</div>
        : <Btn variant="green" className={`w-full mt-3 ${mine && !rows.some((r) => r.def.id === mine.act) ? 'guide-glow' : ''}`} onClick={() => { audio.sfx('click'); enterPlace(placeId) }}><Icon name="door" size={20} /> Go inside</Btn>)}
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        {placeId === 'pitch' && <ActTile hot icon="⚽" label="Play a match" energy={12} reward="🏆" disabled={idle || closed} onClick={() => { audio.sfx('click'); startMatch() }} />}
        {rows.map(({ def, enabled, reason, remaining }) => (
          <ActTile key={def.id} guide={!!mine && mine.act === def.id && enabled} icon={def.icon} label={def.label} energy={def.cost.energy} cash={def.cost.cash} reward={emojis(BENEFIT[def.id] ?? '')} reason={closed ? `Opens ${fmtClock(opensAt(placeId))}` : reason} left={remaining} disabled={!enabled || idle || closed} onClick={() => run(def)} />
        ))}
        {placeId === 'home' && <ActTile hot icon="📅" label="End the year" reward={`${life.character.age} → ${life.character.age + 1}`} disabled={idle || !!life.quiz} onClick={() => { audio.sfx('good'); openSheet(null); endActions() }} />}
      </div>
      {rows.length === 0 && !note && active && <div className="opacity-70 text-sm mt-2">Nothing to do here right now.</div>}
      {lastDelta.length > 0 && <DeltaChips deltas={lastDelta} limit={5} />}
    </Modal>
  )
}

export function NpcModal() {
  const { life, npcId, openSheet, startTalk } = useGame()
  if (!life || !npcId) return null
  const npc = life.npcs[npcId]
  if (!npc) return null
  const role = npc.role
  const family = role === 'mother' || role === 'father' || role === 'sibling' || role === 'child'
  const hang = ['friend', 'friend2', 'partner', 'mother', 'father', 'sibling', 'child'].includes(role)
  const roleLabel = role === 'friend2' ? 'friend' : role
  const close = () => openSheet(null)
  const acts = getActivities(life)
  const chat = acts.find((a) => a.def.id === 'chat')
  const meal = acts.find((a) => a.def.id === 'meal')
  const hangAct = acts.find((a) => a.def.id === (family ? 'familyTime' : 'socialise'))
  const idle = life.phase !== 'action'
  return (
    <Modal onClose={close}>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full grid place-items-center text-3xl font-display shrink-0" style={{ background: 'radial-gradient(circle at 30% 20%, #ff8ec2, #7a2a9a)', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,.35), 0 6px 0 rgba(0,0,0,.35)' }}>{npc.name[0]}</div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[26px] text-white leading-none" style={{ textShadow: '0 2px 0 rgba(0,0,0,.4)' }}>{npc.name}</div>
          <div className="chip chip-pink !py-0.5 mt-1.5 capitalize">{roleLabel}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Icon name="heart" size={20} color="#ff7ab8" />
        <div className="bar flex-1"><i style={{ width: `${npc.closeness}%`, background: 'linear-gradient(90deg,#ff7ab8,#ff3d8b)' }} /></div>
        <span className="font-display text-sm">{npc.closeness}</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 mt-3">
        <ActTile icon="💬" label="Chat" energy={3} disabled={!chat?.enabled || idle} reason={chat?.reason} onClick={() => startTalk('chat', role)} />
        {family && role !== 'child' && <ActTile icon="🍛" label="Food" energy={1} disabled={!meal?.enabled || idle} reason={meal?.reason} onClick={() => startTalk('food', role)} />}
        {hang && <ActTile icon={family ? '🛋️' : '🚶'} label={family ? 'Sit together' : 'Hang out'} energy={hangAct?.def.cost.energy ?? 12} disabled={!hangAct?.enabled || idle} reason={hangAct?.reason} onClick={() => startTalk(family ? 'family' : 'hang', role)} />}
      </div>
    </Modal>
  )
}

export function PlacesModal() {
  const { life, openSheet, goToPlace } = useGame()
  if (!life) return null
  const d = buildDistrict(life.character.housing.districtId)
  return (
    <Modal title={DISTRICTS[life.character.housing.districtId]?.name ?? 'Your area'} onClose={() => openSheet(null)}>
      <div className="grid grid-cols-3 gap-2.5">
        {d.places.map((p) => {
          const on = placeActive(life, p.id as PlaceId)
          return (
            <button key={p.id} className="tile" style={{ opacity: on ? 1 : 0.5 }} onClick={() => { audio.sfx('click'); goToPlace(p.id) }}>
              <span className="text-[32px] leading-none">{p.icon}</span>
              <span className="font-display text-[13px] leading-tight text-center uppercase">{p.name}</span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
