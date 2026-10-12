import { useState } from 'react'
import { useGame } from '../store'
import { Btn, nairaShort } from './components'
import { audio } from '@platform/audio'
import { HOMES } from '@content/archetypes'
import { CITIES, cityOfHome } from '@content/cities'
import { MOVE_COST, MOVE_ENERGY } from '@engine/api'

/** "Move to another place" card: pick a home in any district or city, confirm, and the whole world changes around you. */
export function Relocate() {
  const { life, moveHome } = useGame()
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState<string | null>(null)
  if (!life) return null
  const here = life.character.housing.districtId
  const hereCity = cityOfHome(here)
  const broke = life.character.stats.cash < MOVE_COST
  return (
    <div className="mt-4">
      <button className="btn btn-ghost w-full" onClick={() => { audio.sfx('click'); setOpen(!open) }}>{CITIES[hereCity].icon} Move to another place</button>
      {open && (
        <div className="hud-glass rounded-2xl p-3 mt-2 pop">
          <div className="text-[12px] font-bold opacity-80 mb-2">Moving costs {nairaShort(MOVE_COST)} and {MOVE_ENERGY} energy. Friends back home drift a little if you change city.{broke ? ' You cannot afford it yet.' : ''}</div>
          {(['lagos', 'abuja'] as const).map((cid) => (
            <div key={cid} className="mb-2">
              <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-70 mb-1">{CITIES[cid].icon} {CITIES[cid].name}</div>
              <div className="grid grid-cols-2 gap-2">
                {HOMES.filter((h) => cityOfHome(h.id) === cid).map((h) => (
                  <button key={h.id} disabled={h.id === here} className={`tile !min-h-[64px] !p-2 ${pick === h.id ? 'is-on' : ''}`} style={{ opacity: h.id === here ? 0.45 : 1 }} onClick={() => { audio.sfx('tap'); setPick(h.id) }}>
                    <span className="font-display text-[14px] leading-tight uppercase">{h.district}</span>
                    <span className="text-[10px] font-bold opacity-75">{h.id === here ? 'You live here' : h.tag}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Btn variant="green" className="w-full mt-1" disabled={!pick || broke} onClick={() => { if (pick) moveHome(pick) }}>{pick ? `Move to ${HOMES.find((h) => h.id === pick)?.district}` : 'Pick a place'}</Btn>
        </div>
      )}
    </div>
  )
}
