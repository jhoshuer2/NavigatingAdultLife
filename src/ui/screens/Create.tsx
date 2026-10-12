import { useMemo, useState } from 'react'
import { useGame } from '../../store'
import { Btn, Mentor, RoundBtn, nairaShort } from '../components'
import { Icon } from '../icons'
import { Avatar, SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS } from '../Avatar'
import { TRAITS } from '@content/traits'
import { DREAMS } from '@content/dreams'
import { ARCHETYPES, HOMES, taglineFor, tierRank } from '@content/archetypes'
import { NAME_POOLS, HERITAGE_LABEL, HERITAGE_HINT } from '@content/names'
import { FREE_FABRICS, FREE_HAIR, FREE_OUTFITS, UNLOCKABLES } from '@platform/meta'
import type { Appearance, DreamId, Gender, Heritage, NewLifeConfig, TraitId } from '@engine/core/types'
import { audio } from '@platform/audio'
import { CITIES, CITY_LIST, type CityId } from '@content/cities'
import { ITEM_BY_ID } from '@content/items'
import { CityArt } from '../CityArt'

const HAIRS = [['afro', 'Afro'], ['lowcut', 'Low cut'], ['braids', 'Braids'], ['bald', 'Bald'], ['locs', 'Locs'], ['cornrows', 'Cornrows'], ['bun', 'Bun'], ['ponytail', 'Ponytail'], ['gele', 'Gele']] as const
const OUTFITS = [['casual', 'Casual'], ['hoodie', 'Hoodie'], ['office', 'Office'], ['chill', 'Chill'], ['siteWork', 'Site work'], ['owambe', 'Owambe'], ['traditional', 'Traditional']] as const
const FABRICS = [['plain', 'Plain'], ['ankara', 'Ankara'], ['adire', 'Adire'], ['asoOke', 'Aso-oke']] as const
const BAD = ['fuck', 'shit', 'bitch', 'nigga', 'rape', 'dick', 'pussy', 'whore']
const STEPS = ['City', 'Look', 'Vibe', 'Dream', 'Luck', 'Home', 'Name']
const SAY = ['Where are we starting this journey?', 'Make it yours!', 'Pick two traits that fit you.', 'What is the big dream?', 'Let luck decide!', 'Where do you call home?', 'And what do they call you?']
type Tab = 'you' | 'skin' | 'hair' | 'face' | 'fit'

export function Create() {
  const { go, newLife, meta } = useGame()
  const [step, setStep] = useState(0)
  const [city, setCity] = useState<CityId | null>(null)
  const [gender, setGender] = useState<Gender>('female')
  const [look, setLook] = useState<Appearance>({ skinTone: 5, faceShape: 1, hairStyle: 'braids', hairColor: HAIR_COLORS[0], outfitType: 'casual', fabric: 'plain', topColor: OUTFIT_COLORS[0], bottomColor: OUTFIT_COLORS[6] })
  const [traits, setTraits] = useState<TraitId[]>([])
  const [dream, setDream] = useState<DreamId | null>(null)
  const [archetype, setArchetype] = useState<string | null>(null)
  const [rerolled, setRerolled] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [spinName, setSpinName] = useState('')
  const [home, setHome] = useState<string | null>(null)
  const [heritage, setHeritage] = useState<Heritage>('yoruba')
  const [name, setName] = useState('')
  const [nick, setNick] = useState('')
  const [perk, setPerk] = useState<string | undefined>(undefined)
  const [facial, setFacial] = useState<'none' | 'stubble' | 'beard'>('none')
  const [tab, setTab] = useState<Tab>('you')
  const [peek, setPeek] = useState<string | null>(null)

  const unlocked = (id: string) => meta.unlocks.includes(id)
  const hairOk = (h: string) => FREE_HAIR.includes(h) || unlocked(`hair:${h}`)
  const outfitOk = (o: string) => FREE_OUTFITS.includes(o) || unlocked(`outfit:${o}`)
  const fabricOk = (f: string) => FREE_FABRICS.includes(f) || unlocked(`fabric:${f}`)
  const arch = ARCHETYPES.find((a) => a.id === archetype)
  const heirloom = arch ? ITEM_BY_ID[arch.heirloom] : undefined
  const wear = heirloom?.wear ?? []
  const pool = NAME_POOLS[heritage][gender]
  const suggestions = useMemo(() => [...pool].sort(() => Math.random() - 0.5).slice(0, 6), [pool])
  const nameOk = name.trim().length >= 2 && !BAD.some((b) => name.toLowerCase().includes(b))

  const set = (p: Partial<Appearance>) => { audio.sfx('tap'); setLook((l) => ({ ...l, ...p })) }
  const appearance: Appearance = { ...look, facialHair: gender === 'male' && facial !== 'none' ? facial : undefined }

  const spin = (first: boolean) => {
    if (spinning || (!first && rerolled)) return
    setSpinning(true); if (!first) setRerolled(true)
    let i = 0
    const t = setInterval(() => { setSpinName(ARCHETYPES[i++ % ARCHETYPES.length].title); audio.sfx('tap') }, 90)
    setTimeout(() => {
      clearInterval(t)
      const pick = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)]
      setArchetype(pick.id); setHome(null); setSpinning(false); audio.sfx('level')
    }, 1300)
  }

  const canNext = [!!city, true, traits.length === 2, !!dream, !!archetype && !spinning, !!home, nameOk][step]

  const surprise = () => {
    const g: Gender = Math.random() < 0.5 ? 'male' : 'female'
    const h = (['yoruba', 'igbo', 'hausa', 'mix'] as Heritage[])[Math.floor(Math.random() * 4)]
    const t = [...TRAITS].sort(() => Math.random() - 0.5).slice(0, 2).map((x) => x.id) as [TraitId, TraitId]
    const a = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)]
    const homes = HOMES.filter((x) => (!city || x.city === city) && tierRank(a.tier) >= tierRank(x.minTier))
    const hair = HAIRS.filter(([id]) => hairOk(id)).map(([id]) => id)
    const outf = OUTFITS.filter(([id]) => outfitOk(id)).map(([id]) => id)
    const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]
    const cfg: NewLifeConfig = {
      name: pick(NAME_POOLS[h][g]), gender: g, heritage: h, traits: t, dreamId: pick(DREAMS).id, archetypeId: a.id, homeId: pick(homes).id,
      appearance: { skinTone: Math.floor(Math.random() * 10), faceShape: Math.floor(Math.random() * 4), hairStyle: pick(hair), hairColor: pick(HAIR_COLORS), outfitType: pick(outf), fabric: 'plain', topColor: pick(OUTFIT_COLORS), bottomColor: OUTFIT_COLORS[6] },
    }
    audio.unlock(); newLife(cfg)
  }

  const finish = () => {
    if (!dream || !archetype || !home || traits.length !== 2) return
    audio.unlock()
    newLife({ name: name.trim().slice(0, 14), nickname: nick.trim().slice(0, 14) || undefined, gender, heritage, appearance, traits: [traits[0], traits[1]], dreamId: dream, archetypeId: archetype, homeId: home, perkId: perk })
  }

  const tabs: { id: Tab; label: string; icon: 'user' | 'smile' | 'star' | 'heart' | 'bag' }[] = [{ id: 'you', label: 'You', icon: 'user' }, { id: 'skin', label: 'Skin', icon: 'smile' }, { id: 'hair', label: 'Hair', icon: 'star' }, { id: 'face', label: 'Face', icon: 'heart' }, { id: 'fit', label: 'Outfit', icon: 'bag' }]
  const mini = (over: Partial<Appearance>, size = 58) => <div className="overflow-hidden rounded-xl" style={{ height: size * 0.82 }}><Avatar look={{ ...appearance, ...over }} gender={gender} wear={wear} size={size} /></div>
  const avatarStage = (size: number) => (
    <div className="stage flex justify-center pt-1 pb-2"><div className="float" style={{ animationDuration: '5s' }}><Avatar look={appearance} gender={gender} wear={wear} size={size} /></div></div>
  )
  const detail = (text: string | null) => text ? <div className="card mt-2 px-3 py-2 text-[13px] font-bold leading-snug pop">{text}</div> : null

  return (
    <div className="screen flex flex-col">
      <header className="px-3 pt-3 flex items-center gap-3" style={{ paddingTop: 'calc(.75rem + var(--safe-t))' }}>
        <RoundBtn icon="back" label="Back" onClick={() => (step === 0 ? go('title') : setStep(step - 1))} />
        <div className="flex-1 flex items-center justify-center gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
          {STEPS.map((n, i) => (
            <div key={n} className="flex flex-col items-center gap-0.5 flex-1 max-w-[52px]">
              <i className="h-2 w-full rounded-full transition-all duration-500" style={{ background: i < step ? 'linear-gradient(180deg,#ffe27a,#f59e0b)' : i === step ? 'linear-gradient(90deg,#ff3d8b,#8f6bff)' : 'rgba(255,255,255,.16)', boxShadow: i === step ? '0 0 12px #ff3d8b' : undefined }} />
              <span className={`text-[10px] uppercase tracking-wider font-extrabold ${i === step ? 'opacity-100' : 'opacity-40'}`}>{n}</span>
            </div>
          ))}
        </div>
        <RoundBtn icon="dice" label="Surprise me" onClick={surprise} tone="gold" />
      </header>

      <div className="px-4 mt-2"><Mentor>{SAY[step]}</Mentor></div>

      <main className="flex-1 px-4 pt-2 pb-2 flex flex-col min-h-0">
        {step === 0 && (
          <div className="grid gap-3 stagger">
            {CITY_LIST.map((c) => (
              <button key={c.id} className={`card-btn text-left !p-0 overflow-hidden ${city === c.id ? 'is-on' : ''}`} aria-pressed={city === c.id} onClick={() => { audio.sfx('pop'); setCity(c.id); setHome(null) }}>
                <CityArt city={c.id} />
                <div className="p-3">
                  <div className="font-display text-[26px] uppercase leading-none">{c.name}</div>
                  <div className="text-[13px] opacity-85 mt-1 leading-snug">{c.tagline}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">{c.vibe.map((v) => <span key={v} className="chip">{v}</span>)}</div>
                </div>
              </button>
            ))}
            <div className="text-center text-[12px] font-bold opacity-70">You can move to the other city later, in the game.</div>
          </div>
        )}

        {step === 1 && (
          <>
            {avatarStage(188)}
            <div className="flex justify-center gap-1.5 mb-1" role="tablist">
              {tabs.map((t) => (
                <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => { audio.sfx('click'); setTab(t.id) }} className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all" style={{ background: tab === t.id ? 'linear-gradient(180deg,#ffe27a,#f59e0b)' : 'rgba(255,255,255,.08)', color: tab === t.id ? '#3b2300' : '#fff', boxShadow: tab === t.id ? '0 3px 0 #9a5a00' : undefined }}>
                  <Icon name={t.icon} size={20} color={tab === t.id ? '#7a4700' : undefined} /><span className="text-[11px] font-extrabold uppercase tracking-wide">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="card p-2 stagger" key={tab}>
              {tab === 'you' && (
                <div className="grid grid-cols-2 gap-2">
                  {(['female', 'male'] as Gender[]).map((g) => (
                    <button key={g} className={`tile ${gender === g ? 'is-on' : ''}`} onClick={() => { audio.sfx('click'); setGender(g) }} aria-pressed={gender === g}>
                      <div className="overflow-hidden rounded-xl" style={{ height: 52 }}><Avatar look={{ ...appearance, facialHair: undefined }} gender={g} wear={wear} size={64} /></div>
                      <span className="font-display uppercase tracking-wide">{g === 'female' ? 'Girl' : 'Boy'}</span>
                    </button>
                  ))}
                </div>
              )}
              {tab === 'skin' && <div className="hscroll">{SKIN_TONES.map((c, i) => <Swatch key={c} c={c} on={look.skinTone === i} onClick={() => set({ skinTone: i })} label={`Skin tone ${i + 1}`} big />)}</div>}
              {tab === 'hair' && (
                <>
                  <div className="hscroll">{HAIRS.map(([id, label]) => <button key={id} className={`tile !min-w-[78px] ${look.hairStyle === id ? 'is-on' : ''}`} disabled={!hairOk(id)} onClick={() => set({ hairStyle: id })} aria-pressed={look.hairStyle === id}>{!hairOk(id) ? <div className="grid place-items-center" style={{ height: 48 }}><Icon name="lock" size={24} /></div> : mini({ hairStyle: id })}<span className="text-[11px] font-extrabold">{label}</span></button>)}</div>
                  <div className="hscroll">{HAIR_COLORS.map((c) => <Swatch key={c} c={c} on={look.hairColor === c} onClick={() => set({ hairColor: c })} label="Hair colour" />)}</div>
                  {gender === 'male' && <div className="flex gap-2 pb-1">{(['none', 'stubble', 'beard'] as const).map((f) => <button key={f} className={`tile flex-1 !min-h-[44px] !py-1 ${facial === f ? 'is-on' : ''}`} onClick={() => setFacial(f)}><span className="text-[12px] font-extrabold">{f === 'none' ? 'Clean' : f === 'stubble' ? 'Stubble' : 'Beard'}</span></button>)}</div>}
                </>
              )}
              {tab === 'face' && <div className="hscroll">{[0, 1, 2, 3].map((f) => <button key={f} className={`tile !min-w-[78px] ${look.faceShape === f ? 'is-on' : ''}`} onClick={() => set({ faceShape: f })}>{mini({ faceShape: f })}<span className="text-[11px] font-extrabold">Face {f + 1}</span></button>)}</div>}
              {tab === 'fit' && (
                <>
                  <div className="hscroll">{OUTFITS.map(([id, label]) => <button key={id} className={`tile !min-w-[78px] ${look.outfitType === id ? 'is-on' : ''}`} disabled={!outfitOk(id)} onClick={() => set({ outfitType: id })} aria-pressed={look.outfitType === id}>{!outfitOk(id) ? <div className="grid place-items-center" style={{ height: 48 }}><Icon name="lock" size={24} /></div> : mini({ outfitType: id })}<span className="text-[11px] font-extrabold">{label}</span></button>)}</div>
                  <div className="hscroll">{FABRICS.map(([id, label]) => <button key={id} className={`tile !min-w-[72px] !min-h-[44px] !py-1 ${look.fabric === id ? 'is-on' : ''}`} disabled={!fabricOk(id)} onClick={() => set({ fabric: id })}>{!fabricOk(id) && <Icon name="lock" size={14} />}<span className="text-[11px] font-extrabold">{label}</span></button>)}</div>
                  <div className="hscroll">{OUTFIT_COLORS.map((c) => <Swatch key={c} c={c} on={look.topColor === c} onClick={() => set({ topColor: c })} label="Top colour" />)}</div>
                </>
              )}
            </div>
            <p className="text-[11px] opacity-60 mt-1.5 text-center flex items-center justify-center gap-1"><Icon name="lock" size={12} /> Locked looks unlock with <Icon name="shell" size={12} /> earned at the end of each life.</p>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-3 gap-2 stagger">
              {TRAITS.map((t) => {
                const on = traits.includes(t.id)
                return (
                  <button key={t.id} className={`tile !min-h-[96px] ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => { audio.sfx('pop'); setPeek(t.id); setTraits((cur) => (cur.includes(t.id) ? cur.filter((x) => x !== t.id) : cur.length < 2 ? [...cur, t.id] : [cur[1], t.id])) }}>
                    <span className="text-[30px] leading-none">{t.icon}</span>
                    <span className="font-display text-[13px] uppercase leading-tight text-center">{t.name}</span>
                    <span className="flex gap-1"><Icon name="up" size={12} /><Icon name="down" size={12} /></span>
                    {on && <span className="absolute top-1.5 right-1.5 grid place-items-center w-5 h-5 rounded-full" style={{ background: 'var(--gold)' }}><Icon name="check" size={13} color="#3b2300" /></span>}
                  </button>
                )
              })}
            </div>
            {(() => { const t = TRAITS.find((x) => x.id === (peek ?? traits[traits.length - 1])); return t ? <div className="card mt-3 p-3 pop" key={t.id}><div className="font-display text-xl uppercase">{t.icon} {t.name}</div><div className="text-[13px] mt-1 flex gap-1.5 items-start"><Icon name="up" size={14} className="mt-0.5" /><span className="text-green-200">{t.perk}</span></div><div className="text-[13px] mt-1 flex gap-1.5 items-start"><Icon name="down" size={14} className="mt-0.5" /><span className="text-red-200">{t.downside}</span></div></div> : <div className="text-center text-[13px] opacity-70 mt-3">Tap a trait to see its upside <Icon name="up" size={12} className="inline" /> and catch <Icon name="down" size={12} className="inline" /></div> })()}
            <div className="flex justify-center gap-1.5 mt-3">{[0, 1].map((i) => <span key={i} className="w-8 h-2 rounded-full" style={{ background: i < traits.length ? 'var(--gold)' : 'rgba(255,255,255,.18)' }} />)}</div>
          </>
        )}

        {step === 3 && (
          <div className="grid gap-2.5 stagger">
            {DREAMS.map((d) => (
              <button key={d.id} className={`card-btn flex items-center gap-3 ${dream === d.id ? 'is-on' : ''}`} onClick={() => { audio.sfx('pop'); setDream(d.id) }} aria-pressed={dream === d.id}>
                <span className="grid place-items-center w-14 h-14 rounded-2xl text-[32px]" style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,226,122,.5), rgba(106,61,245,.35))', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.2)' }}>{d.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-display text-[19px] uppercase leading-tight">{d.name}</span>
                  <span className="chip chip-gold mt-1"><Icon name="flag" size={12} color="#7a4700" />{d.target}</span>
                </span>
                {dream === d.id && <Icon name="check" size={22} color="var(--gold)" />}
              </button>
            ))}
            {dream && <div className="card px-3 py-2 text-[13px] pop">{DREAMS.find((x) => x.id === dream)?.blurb}</div>}
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {!arch && !spinning && (
              <div className="w-full max-w-xs">
                <div className="card py-10 float" style={{ borderRadius: 28, background: 'linear-gradient(160deg,#6a3df5,#2a1a8a)' }}><span className="font-display text-[84px] leading-none" style={{ textShadow: '0 6px 0 #1a0f55' }}>?</span></div>
                <Btn className="w-full mt-5 !min-h-16 !text-xl" shine onClick={() => spin(true)}><Icon name="dice" size={24} color="#fff" /> Spin</Btn>
              </div>
            )}
            {spinning && <div className="card w-full max-w-xs py-10 overflow-hidden" style={{ borderRadius: 28 }}><div className="reel font-display text-[34px] uppercase leading-tight px-3">{spinName || '…'}</div></div>}
            {arch && !spinning && avatarStage(96)}
            {arch && !spinning && (
              <div className="card w-full max-w-sm p-4 text-left flip" style={{ borderRadius: 26, background: 'linear-gradient(170deg, rgba(120,90,255,.6), rgba(24,16,80,.9))' }} key={arch.id}>
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-20 h-20 rounded-3xl text-[44px]" style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,226,122,.7), rgba(106,61,245,.3))', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.3)' }}>{arch.icon}</span>
                  <div className="min-w-0"><div className="font-display text-[27px] uppercase leading-none">{arch.title}</div><div className="text-[13px] opacity-80 mt-1 leading-snug">{taglineFor(arch, city ?? 'lagos')}</div></div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">{arch.perks.map((p) => <span key={p} className="chip chip-green"><Icon name="up" size={11} />{p}</span>)}</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">{arch.constraints.map((p) => <span key={p} className="chip chip-red"><Icon name="down" size={11} />{p}</span>)}</div>
                {heirloom && (
                  <div className="mt-3 rounded-2xl p-2.5 flex items-center gap-3" style={{ background: 'rgba(255,210,63,.14)', boxShadow: 'inset 0 0 0 1.5px rgba(255,210,63,.55)' }}>
                    <span className="text-[34px] leading-none">{heirloom.icon}</span>
                    <div className="min-w-0"><div className="text-[10px] font-extrabold uppercase tracking-wider text-yellow-300">Handed down to you</div><div className="font-display text-[17px] leading-tight">{heirloom.name}</div><div className="text-[12px] opacity-80 leading-snug">{heirloom.desc}</div></div>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1.5"><span className="chip chip-gold"><Icon name="coin" size={14} />{nairaShort(arch.startCash)}</span><span className="chip"><Icon name="book" size={13} />{arch.schoolType}</span></div>
                  <button className="chip !py-1.5 !px-3" style={{ opacity: rerolled ? 0.4 : 1 }} disabled={rerolled} onClick={() => spin(false)}><Icon name="swap" size={14} />{rerolled ? 'Used' : 'Re-roll'}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 5 && arch && city && (
          <div className="flex items-center justify-between mb-2">
            <span className="chip chip-gold">{CITIES[city].icon} Homes in {CITIES[city].name}</span>
            <button className="text-[12px] font-extrabold underline opacity-80" onClick={() => { audio.sfx('tap'); setStep(0) }}>Change city</button>
          </div>
        )}
        {step === 5 && arch && (
          <div className="grid grid-cols-2 gap-2.5 stagger">
            {HOMES.filter((h) => h.city === (city ?? 'lagos')).map((h, i) => {
              const locked = tierRank(arch.tier) < tierRank(h.minTier)
              const hue = [24, 150, 215, 290][i % 4]
              return (
                <button key={h.id} className={`tile !items-stretch !justify-start !p-0 overflow-hidden !min-h-[170px] ${home === h.id ? 'is-on' : ''}`} disabled={locked} onClick={() => { audio.sfx('pop'); setHome(h.id) }} aria-pressed={home === h.id}>
                  <div className="h-[74px] grid place-items-center text-[40px] relative" style={{ background: `linear-gradient(160deg, hsl(${hue} 80% 58%), hsl(${hue + 40} 70% 28%))` }}>{locked ? <Icon name="lock" size={34} /> : ['🏘️', '🏠', '🏢', '🏰'][i % 4]}</div>
                  <div className="px-2.5 py-2 text-left">
                    <div className="font-display uppercase text-[16px] leading-tight">{h.district}</div>
                    <div className="text-[11px] opacity-75 leading-tight mt-0.5">{h.name}</div>
                    <div className="flex items-center justify-between mt-1.5"><span className="chip chip-gold !text-[10px]">{h.tag}</span><span className="flex">{Array.from({ length: Math.max(1, Math.round(h.costMult * 2)) }, (_, k) => <Icon key={k} name="coin" size={13} />)}</span></div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
        {step === 5 && !arch && <div className="text-center opacity-70">Spin the lottery first.</div>}

        {step === 6 && (
          <>
            {avatarStage(118)}
            <div className="grid grid-cols-4 gap-2 mb-2">{(['yoruba', 'igbo', 'hausa', 'mix'] as Heritage[]).map((h) => <button key={h} className={`tile !min-h-[52px] !py-1 ${heritage === h ? 'is-on' : ''}`} onClick={() => { audio.sfx('tap'); setHeritage(h); setName('') }}><span className="text-[12px] font-extrabold">{HERITAGE_LABEL[h]}</span></button>)}</div>
            {HERITAGE_HINT[heritage] && <div className="text-center text-[11px] font-bold opacity-70 -mt-1 mb-2">{HERITAGE_HINT[heritage]}</div>}
            <input className="w-full rounded-2xl px-4 py-3.5 text-xl font-display uppercase tracking-wide outline-none text-center" style={{ background: 'rgba(255,255,255,.95)', color: '#1a0f55', boxShadow: 'inset 0 3px 0 rgba(0,0,0,.12), 0 0 0 3px rgba(255,199,44,.0)' }} placeholder="Your name" maxLength={14} value={name} onChange={(e) => setName(e.target.value)} aria-label="First name" />
            <div className="hscroll mt-1">{suggestions.map((n) => <button key={n} className={`chip !text-sm !py-2 !px-3.5 ${name === n ? 'chip-gold' : ''}`} onClick={() => { audio.sfx('tap'); setName(n) }}>{n}</button>)}</div>
            <input className="w-full rounded-2xl px-4 py-2.5 text-center font-bold outline-none mt-1" style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)' }} placeholder="Nickname (optional)" maxLength={14} value={nick} onChange={(e) => setNick(e.target.value)} aria-label="Nickname" />
            {UNLOCKABLES.some((u) => u.kind === 'perk' && meta.unlocks.includes(u.id)) && (
              <div className="hscroll mt-1">
                <button className={`chip !text-sm !py-2 ${!perk ? 'chip-gold' : ''}`} onClick={() => { audio.sfx('tap'); setPerk(undefined) }}>No perk</button>
                {UNLOCKABLES.filter((u) => u.kind === 'perk' && meta.unlocks.includes(u.id)).map((u) => <button key={u.id} className={`chip !text-sm !py-2 ${perk === u.id.split(':')[1] ? 'chip-gold' : ''}`} onClick={() => { audio.sfx('tap'); setPerk(u.id.split(':')[1]) }}><Icon name="star" size={13} />{u.name}</button>)}
              </div>
            )}
          </>
        )}
        <span className="hidden">{detail(null)}</span>
      </main>

      <footer className="px-4 pb-3 pt-6 safe-pad sticky bottom-0 z-10 dock-fade">
        {step < STEPS.length - 1
          ? <Btn className="w-full !min-h-14 !text-xl" shine={canNext} disabled={!canNext} onClick={() => setStep(step + 1)}>Next <Icon name="chevron" size={20} color="#fff" /></Btn>
          : <Btn className="w-full !min-h-14 !text-xl" shine={canNext} disabled={!canNext} onClick={finish}><Icon name="rocket" size={22} color="#fff" /> Start my life</Btn>}
      </footer>
    </div>
  )
}

function Swatch({ c, on, onClick, label, big }: { c: string; on: boolean; onClick: () => void; label: string; big?: boolean }) {
  const d = big ? 50 : 42
  return <button aria-label={label} aria-pressed={on} onClick={() => { audio.sfx('click'); onClick() }} className="rounded-full transition-transform" style={{ width: d, height: d, background: c, border: on ? '4px solid #ffc72c' : '3px solid rgba(255,255,255,.25)', boxShadow: on ? '0 0 0 3px #1a0f55, 0 0 18px rgba(255,199,44,.55)' : 'inset 0 -4px 0 rgba(0,0,0,.25)', transform: on ? 'scale(1.1)' : undefined }} />
}
