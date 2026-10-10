import { playLife, type BotKind } from '../src/engine/bot'

const lives = Number(process.argv[2] ?? 200)
const kinds: BotKind[] = ['random', 'scholar', 'money']
for (const kind of kinds) {
  const ages: number[] = [], nw: number[] = [], legacy: number[] = []
  const endings: Record<string, number> = {}
  let errors = 0
  const t0 = Date.now()
  for (let i = 0; i < lives; i++) {
    const r = playLife(1000 + i * 7919, kind)
    if (r.error) { errors++; if (errors < 3) console.error(r.error) ; continue }
    const e = r.state.ending!
    ages.push(r.state.character.age); nw.push(e.netWorth); legacy.push(e.legacy)
    endings[e.id] = (endings[e.id] ?? 0) + 1
  }
  const q = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.floor(a.length * p)] ?? 0
  console.log(`\n[${kind}] lives=${lives} errors=${errors} (${Date.now() - t0} ms)`)
  console.log(`  age at death p10/p50/p90: ${q(ages, 0.1)}/${q(ages, 0.5)}/${q(ages, 0.9)}`)
  console.log(`  net worth p10/p50/p90 (M): ${(q(nw, 0.1) / 1e6).toFixed(1)}/${(q(nw, 0.5) / 1e6).toFixed(1)}/${(q(nw, 0.9) / 1e6).toFixed(1)}`)
  console.log(`  legacy p10/p50/p90: ${q(legacy, 0.1)}/${q(legacy, 0.5)}/${q(legacy, 0.9)}`)
  console.log('  endings:', JSON.stringify(endings))
}
