// Prints the voice line list as JSON: `npx tsx scripts/voice-lines.ts > lines.json`
import { voiceLines } from '../src/content/voiceLines'
console.log(JSON.stringify(voiceLines(), null, 1))
