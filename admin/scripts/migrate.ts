// Apply database migrations to DATABASE_URL.   npm run migrate
import { getDb, migrate } from '../server/db'
const db = await getDb(); await migrate(db); console.log('migrations applied'); process.exit(0)
