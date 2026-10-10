import { useMemo } from 'react'
import { useGame } from '../store'
import { Btn, DeltaChips, Modal, nairaShort } from './components'
import { getActivities } from '@engine/api'
import { DISTRICTS, buildDistrict, type PlaceId } from '../world/layout'
import { placeActive, placeNote } from '../world/guide'
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

export function PlaceModal() {
  const { life, placeId, openSheet, endActions, enterPlace, hour, startPenalty, startMarket, startChores, startShop } = useGame()
  const route = useActivityRouter()
  const acts = useMemo(() => (life ? getActivities(life) : []), [life])
  if (!life || !placeId) return null
  const district = buildDistrict(life.character.housing.districtId)
  const place = district.places.find((p) => p.id === placeId)
  if (!place) return null
  const rows = place.activities.map((id) => acts.find((a) => a.def.id === id)).filter(Boolean) as typeof acts
  const note = placeNote(life, placeId)
  const active = placeActive(life, placeId)
  const closed = !isOpen(placeId, hour)
  const lastDelta = life.lastAction?.deltas ?? []
  return (
    <Modal onClose={() => openSheet(null)}>
      <div className="flex items-center gap-3">
        <div className="text-4xl">{place.icon}</div>
        <div className="min-w-0"><div className="font-display text-3xl text-danfo leading-none">{place.name}</div><div className="text-sm opacity-75">{place.blurb}</div></div>
      </div>
      {note && <div className="card p-3 mt-3 text-sm">{note}</div>}
      <div className="mt-3 grid gap-2">
        {INTERIORS[placeId] && (isOpen(placeId, hour)
          ? <button className="card-btn" style={{ borderColor: '#ffd23f' }} onClick={() => { audio.sfx('click'); enterPlace(placeId) }}><b>🚪 Go inside</b><div className="text-xs opacity-75">Open the door and walk in.</div></button>
          : <div className="card p-3 text-sm text-yellow-300">🔒 Closed. Opens at {fmtClock(opensAt(placeId))}.</div>)}
        {rows.map(({ def, enabled, reason, remaining }) => (
          <button key={def.id} className="card-btn" disabled={!enabled || life.phase !== 'action' || closed} onClick={() => { audio.sfx('click'); if (def.id === 'rest' && placeId === 'home') { enterPlace('home', 'sleep'); return } if (def.id === 'study' && INTERIORS[placeId]) { enterPlace(placeId); return } if (def.id === 'chores' && placeId === 'home') { startChores(); return } if ((def.id === 'overtime' || def.id === 'community') && INTERIORS[placeId]) { enterPlace(placeId); return } if (placeId === 'market' && def.id === 'shop') { startShop(); return } if (placeId === 'market' && def.id === 'hustle') { startMarket(); return } if (placeId === 'pitch' && (def.id === 'play' || def.id === 'exercise')) { startPenalty(def.id); return } if (def.id !== 'applyJob' && def.id !== 'socialise' && def.id !== 'familyTime' && def.id !== 'shop') openSheet(null); route(def.id) }}>
            <div className="flex items-center justify-between gap-2"><b>{def.icon} {def.label}</b><span className="chip">{def.cost.energy ? `⚡${def.cost.energy}` : 'free'}{def.cost.cash ? ` · ${nairaShort(def.cost.cash)}` : ''}</span></div>
            <div className="text-xs opacity-75 mt-0.5">{closed ? <span className="text-yellow-300">Closed until {fmtClock(opensAt(placeId))}.</span> : enabled ? <>{def.blurb} <span className="opacity-70">→ {BENEFIT[def.id] ?? ''}</span></> : <span className="text-yellow-300">{reason}</span>}</div>
            {remaining !== undefined && enabled && <div className="text-[10px] opacity-50">{remaining} left this year</div>}
          </button>
        ))}
        {placeId === 'home' && (
          <button className="card-btn" style={{ borderColor: '#2fd27b' }} disabled={life.phase !== 'action' || !!life.quiz} onClick={() => { audio.sfx('good'); openSheet(null); endActions() }}>
            <b>📅 End the year</b><div className="text-xs opacity-75">Age {life.character.age} → {life.character.age + 1}. Events happen, then salary, rent and fees are settled.</div>
          </button>
        )}
        {rows.length === 0 && !note && active && <div className="opacity-70 text-sm">Nothing to do here right now.</div>}
      </div>
      {lastDelta.length > 0 && <DeltaChips deltas={lastDelta} limit={5} />}
      <Btn variant="ghost" className="w-full mt-3" onClick={() => openSheet(null)}>Close</Btn>
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
  const hangAct = acts.find((a) => a.def.id === (family ? 'familyTime' : 'socialise'))
  return (
    <Modal onClose={close}>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full grid place-items-center text-2xl font-black" style={{ background: '#3a3358' }}>{npc.name[0]}</div>
        <div className="min-w-0"><div className="font-display text-3xl text-danfo leading-none">{npc.name}</div><div className="text-sm opacity-75 capitalize">{roleLabel} · {npc.gender === 'male' ? 'he' : 'she'}</div></div>
      </div>
      <div className="mt-3 text-xs opacity-70">Closeness {npc.closeness}/100</div><div className="bar"><i style={{ width: `${npc.closeness}%`, background: '#ff7ab8' }} /></div>
      <div className="grid gap-2 mt-3">
        <button className="card-btn" disabled={!chat?.enabled || life.phase !== 'action'} onClick={() => startTalk('chat', role)}>
          <div className="flex justify-between"><b>💬 Chat</b><span className="chip">⚡3</span></div><div className="text-xs opacity-75">{chat?.enabled ? 'Stand together and talk. Your replies shape the bond.' : chat?.reason}</div>
        </button>
        {hang && (
          <button className="card-btn" disabled={!hangAct?.enabled || life.phase !== 'action'} onClick={() => startTalk(family ? 'family' : 'hang', role)}>
            <div className="flex justify-between"><b>{family ? '👪 Spend time together' : '🧑‍🤝‍🧑 Hang out'}</b><span className="chip">⚡{hangAct?.def.cost.energy ?? 12}</span></div>
            <div className="text-xs opacity-75">{hangAct?.enabled ? (family ? 'Sit down together and talk properly.' : 'Walk somewhere together: the pitch or the buka.') : hangAct?.reason}</div>
          </button>
        )}
      </div>
      <Btn variant="ghost" className="w-full mt-3" onClick={close}>Close</Btn>
    </Modal>
  )
}

export function PlacesModal() {
  const { life, openSheet, goToPlace } = useGame()
  if (!life) return null
  const d = buildDistrict(life.character.housing.districtId)
  return (
    <Modal title={`${DISTRICTS[life.character.housing.districtId]?.name ?? 'Your area'} places`} onClose={() => openSheet(null)}>
      <div className="grid gap-2">
        {d.places.map((p) => {
          const on = placeActive(life, p.id as PlaceId)
          return (
            <button key={p.id} className="card-btn" style={{ opacity: on ? 1 : 0.55 }} onClick={() => goToPlace(p.id)}>
              <div className="flex items-center justify-between"><b>{p.icon} {p.name}</b><span className="chip">🚶 Go</span></div>
              <div className="text-xs opacity-75">{p.blurb}</div>
            </button>
          )
        })}
      </div>
      <Btn variant="ghost" className="w-full mt-3" onClick={() => openSheet(null)}>Close</Btn>
    </Modal>
  )
}
