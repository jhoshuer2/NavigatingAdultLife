// How far do headless players get on each dream path? `npx tsx tools/dream-sim.ts [lives]`
import { playLife, randomConfig, type BotKind } from '../src/engine/bot'
import { makeRng } from '../src/engine/core/rng'
import { DREAMS, dreamsFor } from '../src/content/dreams'

const lives = Number(process.argv[2] ?? 40)
for (const d of DREAMS.filter((x) => x.city !== 'old')) {
  const home = d.city === 'abuja' ? 'garki' : 'surulere'
  const row: string[] = []
  for (const kind of ['random', 'scholar', 'money'] as BotKind[]) {
    let done = 0, stages = 0, ages: number[] = []
    for (let i = 0; i < lives; i++) {
      const cfg = { ...randomConfig(makeRng(500 + i)), dreamId: d.id, homeId: home }
      const r = playLife(900 + i * 31, kind, cfg)
      if (r.error) continue
      stages += r.state.dreamStage ?? 0
      if (r.state.dreamDone) { done++; const m = r.state.moments.find((x) => x.text.startsWith('Achieved the Dream')); ages.push(m?.age ?? r.state.character.age) }
    }
    ages.sort((a, b) => a - b)
    row.push(`${kind}: done ${Math.round((done / lives) * 100)}% avg step ${(stages / lives).toFixed(1)}/${d.stages.length}${ages.length ? ` age~${ages[Math.floor(ages.length / 2)]}` : ''}`)
  }
  console.log(`${d.name.padEnd(18)} ${row.join(' | ')}`)
}
void dreamsFor
