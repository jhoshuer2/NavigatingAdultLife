import { useMemo, useState } from 'react'
import { useGame } from '../../store'
import { Btn } from '../components'
import { Avatar, SKIN_TONES, HAIR_COLORS, OUTFIT_COLORS } from '../Avatar'
import { TRAITS } from '@content/traits'
import { DREAMS } from '@content/dreams'
import { ARCHETYPES, HOMES, tierRank } from '@content/archetypes'
import { NAME_POOLS, HERITAGE_LABEL } from '@content/names'
import { FREE_FABRICS, FREE_HAIR, FREE_OUTFITS, UNLOCKABLES } from '@platform/meta'
import type { Appearance, DreamId, Gender, Heritage, NewLifeConfig, TraitId } from '@engine/core/types'
import { audio } from '@platform/audio'
import { nairaShort } from '../components'

const HAIRS = [['afro', 'Afro'], ['lowcut', 'Low cut'], ['braids', 'Braids'], ['bald', 'Bald'], ['locs', 'Locs'], ['cornrows', 'Cornrows'], ['bun', 'Bun'], ['ponytail', 'Ponytail'], ['gele', 'Gele']] as const
const OUTFITS = [['casual', 'Casual'], ['hoodie', 'Hoodie'], ['office', 'Office'], ['chill', 'Chill'], ['siteWork', 'Site work'], ['owambe', 'Owambe'], ['traditional', 'Traditional']] as const
const FABRICS = [['plain', 'Plain'], ['ankara', 'Ankara'], ['adire', 'Adire'], ['asoOke', 'Aso-oke']] as const
const BAD = ['fuck', 'shit', 'bitch', 'nigga', 'rape', 'dick', 'pussy', 'whore']
const STEPS = ['Look', 'Personality', 'Dream', 'Birth lottery', 'Home', 'Name']

export function Create() {
  const { go, newLife, meta } = useGame()
  const [step, setStep] = useState(0)
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

  const unlocked = (id: string) => meta.unlocks.includes(id)
  const hairOk = (h: string) => FREE_HAIR.includes(h) || unlocked(`hair:${h}`)
  const outfitOk = (o: string) => FREE_OUTFITS.includes(o) || unlocked(`outfit:${o}`)
  const fabricOk = (f: string) => FREE_FABRICS.includes(f) || unlocked(`fabric:${f}`)
  const arch = ARCHETYPES.find((a) => a.id === archetype)
  const pool = NAME_POOLS[heritage][gender]
  const suggestions = useMemo(() => [...pool].sort(() => Math.random() - 0.5).slice(0, 6), [pool])
  const nameOk = name.trim().length >= 2 && !BAD.some((b) => name.toLowerCase().includes(b))

  const set = (p: Partial<Appearance>) => setLook((l) => ({ ...l, ...p }))
  const appearance: Appearance = { ...look, facialHair: gender === 'male' && facial !== 'none' ? facial : undefined }

  const spin = (first: boolean) => {
    if (spinning || (!first && rerolled)) return
    setSpinning(true); if (!first) setRerolled(true)
    let i = 0
    const t = setInterval(() => { setSpinName(ARCHETYPES[i++ % ARCHETYPES.length].title); audio.sfx('click') }, 90)
    setTimeout(() => {
      clearInterval(t)
      const pick = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)]
      setArchetype(pick.id); setHome(null); setSpinning(false); audio.sfx('good')
    }, 1300)
  }

  const canNext = [true, traits.length === 2, !!dream, !!archetype && !spinning, !!home, nameOk][step]

  const surprise = () => {
    const g: Gender = Math.random() < 0.5 ? 'male' : 'female'
    const h = (['yoruba', 'igbo', 'hausa', 'mix'] as Heritage[])[Math.floor(Math.random() * 4)]
    const t = [...TRAITS].sort(() => Math.random() - 0.5).slice(0, 2).map((x) => x.id) as [TraitId, TraitId]
    const a = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)]
    const homes = HOMES.filter((x) => tierRank(a.tier) >= tierRank(x.minTier))
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

  return (
    <div className="min-h-full flex flex-col">
      <header className="px-4 pt-3 flex items-center gap-2">
        <button className="btn btn-ghost !min-h-10 !px-3" onClick={() => (step === 0 ? go('title') : setStep(step - 1))} aria-label="Back">←</button>
        <div className="flex-1">
          <div className="text-xs font-extrabold opacity-70">Step {step + 1}/{STEPS.length} · {STEPS[step]}</div>
          <div className="flex gap-1 mt-1">{STEPS.map((_, i) => <i key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i <= step ? '#ffd23f' : '#ffffff22' }} />)}</div>
        </div>
        <button className="btn btn-ghost !min-h-10 !px-3 text-sm" onClick={surprise}>🎲 Surprise me</button>
      </header>

      <main className="flex-1 px-4 py-3 scroll-y">
        {step === 0 && (
          <div>
            <div className="flex justify-center -mb-2"><div className="card p-2 pattern-ankara"><Avatar look={appearance} gender={gender} size={150} /></div></div>
            <Section title="Who are you?">
              <div className="grid grid-cols-2 gap-2">{(['female', 'male'] as Gender[]).map((g) => <Pill key={g} on={gender === g} onClick={() => setGender(g)}>{g === 'female' ? '👩🏾 Female' : '👨🏾 Male'}</Pill>)}</div>
            </Section>
            <Section title="Skin tone"><div className="flex flex-wrap gap-2">{SKIN_TONES.map((c, i) => <Swatch key={c} c={c} on={look.skinTone === i} onClick={() => set({ skinTone: i })} label={`Skin tone ${i + 1}`} />)}</div></Section>
            <Section title="Hairstyle"><div className="flex flex-wrap gap-2">{HAIRS.map(([id, label]) => <Pill key={id} on={look.hairStyle === id} locked={!hairOk(id)} onClick={() => hairOk(id) && set({ hairStyle: id })}>{label}</Pill>)}</div>
              <div className="flex flex-wrap gap-2 mt-2">{HAIR_COLORS.map((c) => <Swatch key={c} c={c} on={look.hairColor === c} onClick={() => set({ hairColor: c })} label="Hair colour" />)}</div>
              {gender === 'male' && <div className="flex gap-2 mt-2">{(['none', 'stubble', 'beard'] as const).map((f) => <Pill key={f} on={facial === f} onClick={() => setFacial(f)}>{f === 'none' ? 'Clean' : f === 'stubble' ? 'Stubble' : 'Beard'}</Pill>)}</div>}
            </Section>
            <Section title="Face"><div className="flex gap-2">{[0, 1, 2, 3].map((f) => <Pill key={f} on={look.faceShape === f} onClick={() => set({ faceShape: f })}>Shape {f + 1}</Pill>)}</div></Section>
            <Section title="Outfit"><div className="flex flex-wrap gap-2">{OUTFITS.map(([id, label]) => <Pill key={id} on={look.outfitType === id} locked={!outfitOk(id)} onClick={() => outfitOk(id) && set({ outfitType: id })}>{label}</Pill>)}</div>
              <div className="text-xs font-extrabold opacity-70 mt-2 mb-1">Fabric</div>
              <div className="flex flex-wrap gap-2">{FABRICS.map(([id, label]) => <Pill key={id} on={look.fabric === id} locked={!fabricOk(id)} onClick={() => fabricOk(id) && set({ fabric: id })}>{label}</Pill>)}</div>
              <div className="flex flex-wrap gap-2 mt-2">{OUTFIT_COLORS.map((c) => <Swatch key={c} c={c} on={look.topColor === c} onClick={() => set({ topColor: c })} label="Top colour" />)}</div>
            </Section>
            <p className="text-xs opacity-60 mt-2">🐚 Locked looks unlock with Cowries earned at the end of each life.</p>
          </div>
        )}
        {step === 1 && (
          <div>
            <h2 className="font-display text-3xl text-danfo">Choose 2 traits</h2>
            <p className="text-sm opacity-70 mb-3">Each has an upside and a catch. Picked: {traits.length}/2</p>
            <div className="grid grid-cols-2 gap-2">
              {TRAITS.map((t) => {
                const on = traits.includes(t.id)
                return (
                  <button key={t.id} className="card-btn" style={on ? { borderColor: '#ffd23f', background: '#3a3358' } : undefined} onClick={() => setTraits((cur) => (cur.includes(t.id) ? cur.filter((x) => x !== t.id) : cur.length < 2 ? [...cur, t.id] : [cur[1], t.id]))} aria-pressed={on}>
                    <div className="font-extrabold">{t.icon} {t.name}</div>
                    <div className="text-xs text-green-300 mt-0.5">+ {t.perk}</div>
                    <div className="text-xs text-red-300 mt-0.5">− {t.downside}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="font-display text-3xl text-danfo">What is your big Dream?</h2>
            <p className="text-sm opacity-70 mb-3">Your life will chase it. Achieve it for a bonus to your Legacy.</p>
            <div className="flex flex-col gap-2">
              {DREAMS.map((d) => (
                <button key={d.id} className="card-btn" style={dream === d.id ? { borderColor: '#ffd23f', background: '#3a3358' } : undefined} onClick={() => setDream(d.id)} aria-pressed={dream === d.id}>
                  <div className="font-extrabold text-lg">{d.icon} {d.name}</div>
                  <div className="text-sm opacity-80">{d.blurb}</div>
                  <div className="text-xs mt-1 opacity-60">Goal: {d.target}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="text-center">
            <h2 className="font-display text-3xl text-danfo">Birth Lottery</h2>
            <p className="text-sm opacity-70 mb-3">Where did life start you off? One re-roll per life.</p>
            {!archetype && !spinning && <Btn className="mt-6 !text-xl !py-5" onClick={() => spin(true)}>🎰 Spin the lottery</Btn>}
            {spinning && <div className="card p-8 pop"><div className="font-display text-4xl text-danfo animate-pulse">{spinName || '…'}</div></div>}
            {arch && !spinning && (
              <div className="card p-4 text-left pop">
                <div className="text-5xl">{arch.icon}</div>
                <div className="font-display text-3xl text-danfo mt-1">{arch.title}</div>
                <div className="text-sm opacity-80">{arch.tagline}</div>
                <div className="mt-3 text-sm"><b className="text-green-300">Perks</b><ul className="list-disc ml-5">{arch.perks.map((p) => <li key={p}>{p}</li>)}</ul></div>
                <div className="mt-2 text-sm"><b className="text-red-300">Catches</b><ul className="list-disc ml-5">{arch.constraints.map((p) => <li key={p}>{p}</li>)}</ul></div>
                <div className="mt-2 text-xs opacity-70">Starting pocket cash: {nairaShort(arch.startCash)} · {arch.schoolType} school</div>
                <Btn variant="ghost" className="mt-3 w-full" disabled={rerolled} onClick={() => spin(false)}>{rerolled ? 'Re-roll used' : '🔁 Re-roll (once)'}</Btn>
              </div>
            )}
          </div>
        )}
        {step === 4 && arch && (
          <div>
            <h2 className="font-display text-3xl text-danfo">Where do you live?</h2>
            <p className="text-sm opacity-70 mb-3">Lagos. Pick the neighbourhood you grow up in.</p>
            <div className="flex flex-col gap-2">
              {HOMES.map((h) => {
                const locked = tierRank(arch.tier) < tierRank(h.minTier)
                return (
                  <button key={h.id} className="card-btn" disabled={locked} style={home === h.id ? { borderColor: '#ffd23f', background: '#3a3358' } : undefined} onClick={() => setHome(h.id)} aria-pressed={home === h.id}>
                    <div className="flex items-center justify-between"><b>{h.name}</b><span className="chip">{h.tag}</span></div>
                    <div className="text-sm opacity-80">{h.blurb}</div>
                    {locked && <div className="text-xs mt-1 text-yellow-300">🔒 Work your way here: needs a more comfortable start.</div>}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        {step === 5 && (
          <div>
            <h2 className="font-display text-3xl text-danfo">Heritage & name</h2>
            <Section title="Heritage"><div className="grid grid-cols-2 gap-2">{(['yoruba', 'igbo', 'hausa', 'mix'] as Heritage[]).map((h) => <Pill key={h} on={heritage === h} onClick={() => { setHeritage(h); setName('') }}>{HERITAGE_LABEL[h]}</Pill>)}</div></Section>
            <Section title="First name">
              <input className="w-full rounded-2xl bg-[#2a2540] border-2 border-[#3a3358] px-4 py-3 text-lg font-bold outline-none focus:border-[#ffd23f]" placeholder="Your name" maxLength={14} value={name} onChange={(e) => setName(e.target.value)} aria-label="First name" />
              <div className="flex flex-wrap gap-2 mt-2">{suggestions.map((n) => <Pill key={n} on={name === n} onClick={() => setName(n)}>{n}</Pill>)}</div>
            </Section>
            <Section title="Nickname (optional)"><input className="w-full rounded-2xl bg-[#2a2540] border-2 border-[#3a3358] px-4 py-3 font-bold outline-none focus:border-[#ffd23f]" placeholder="e.g. Oga Small" maxLength={14} value={nick} onChange={(e) => setNick(e.target.value)} aria-label="Nickname" /></Section>
            {UNLOCKABLES.some((u) => u.kind === 'perk' && meta.unlocks.includes(u.id)) && (
              <Section title="Starting perk (unlocked)">
                <div className="flex flex-wrap gap-2">
                  <Pill on={!perk} onClick={() => setPerk(undefined)}>None</Pill>
                  {UNLOCKABLES.filter((u) => u.kind === 'perk' && meta.unlocks.includes(u.id)).map((u) => <Pill key={u.id} on={perk === u.id.split(':')[1]} onClick={() => setPerk(u.id.split(':')[1])}>{u.name}</Pill>)}
                </div>
              </Section>
            )}
          </div>
        )}
      </main>

      <footer className="px-4 pb-4 pt-2 safe-pad">
        {step < STEPS.length - 1
          ? <Btn className="w-full" disabled={!canNext} onClick={() => setStep(step + 1)}>Next →</Btn>
          : <Btn variant="green" className="w-full !text-lg" disabled={!canNext} onClick={finish}>🚀 Start my life</Btn>}
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-4"><div className="text-xs font-extrabold opacity-70 mb-1.5 uppercase tracking-wider">{title}</div>{children}</section>
}
function Pill({ on, locked, onClick, children }: { on?: boolean; locked?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return <button className="chip !text-sm !py-2 !px-3" style={{ background: on ? '#ffd23f' : '#2a2540', color: on ? '#1c1b22' : '#fff8ea', opacity: locked ? 0.5 : 1, border: '2px solid ' + (on ? '#1c1b22' : '#3a3358') }} onClick={onClick} aria-pressed={on} disabled={locked}>{locked ? '🔒 ' : ''}{children}</button>
}
function Swatch({ c, on, onClick, label }: { c: string; on: boolean; onClick: () => void; label: string }) {
  return <button aria-label={label} aria-pressed={on} onClick={onClick} className="w-9 h-9 rounded-full" style={{ background: c, border: on ? '3px solid #ffd23f' : '3px solid #3a3358', boxShadow: on ? '0 0 0 2px #1c1b22' : undefined }} />
}
