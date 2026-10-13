// How does the computer runner do over many roads? Prints score and survival for both modes. Run with: npx tsx tools/race-sim.ts
import { createRival, stepRival, RACE_SECS } from '../src/minigames/go-slow-dash/race'
for (const mode of ['foot', 'danfo'] as const) {
  const scores: number[] = [], dies: number[] = [], lv: number[] = []
  for (let seed = 1; seed <= 60; seed++) {
    const rv = createRival({ seed, mode, hearts: 3, assist: false })
    let t = 0
    while (t < RACE_SECS && !rv.st.over) { stepRival(rv, 1 / 60); t += 1 / 60 }
    scores.push(rv.st.score); dies.push(rv.st.over ? t : RACE_SECS); lv.push(rv.st.level)
  }
  const avg = (a: number[]) => Math.round(a.reduce((x, y) => x + y, 0) / a.length)
  scores.sort((a, b) => a - b)
  console.log(mode, 'score avg', avg(scores), 'min', scores[0], 'median', scores[30], 'max', scores[59], '| avg survived s', avg(dies), '| died early', dies.filter((d) => d < RACE_SECS).length, '/60 | avg level', (lv.reduce((a, b) => a + b, 0) / 60).toFixed(1))
}
