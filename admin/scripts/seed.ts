// Fill the configured database with synthetic players (development only).   npm run seed -- 80 30
import { getDb, migrate } from '../server/db'
import { seedPlayers } from '../server/seed'
if (process.env.NODE_ENV === 'production') { console.error('refusing to seed in production'); process.exit(1) }
const [players = '60', days = '30'] = process.argv.slice(2)
const db = await getDb(); await migrate(db); await seedPlayers(db, { players: Number(players), days: Number(days), now: new Date() }); console.log('seeded'); process.exit(0)
