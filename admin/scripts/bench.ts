// Rough dashboard timing at scale (PRD AC-4): bulk-loads synthetic aggregates into in-process Postgres and times each page's queries.
//   npm run bench -- 100000
import { memoryDb } from '../server/db'
import * as Q from '../server/queries'
const N = Number(process.argv[2] ?? 100000)
import { existsSync } from 'node:fs'
const dir = process.env.BENCH_DIR
const loaded = !!dir && existsSync(dir)
const db = await memoryDb(dir)
const to = new Date().toISOString().slice(0, 10), from = Q.addDays(to, -89)
if (!loaded) {
let t = Date.now(); const lap = (l: string) => { const n = Date.now(); console.log(l.padEnd(34), `${n - t} ms`); t = n }
await db.query(`INSERT INTO devices (device_id, first_seen, last_seen, country, region, city, os, browser, device_type, language, tz, app_version, sessions_count, active_seconds, lives_count, consent_version)
  SELECT gen_random_uuid(), now() - make_interval(days => floor(random()*89)::int), now() - make_interval(days => floor(random()*3)::int), (ARRAY['NG','NG','NG','NG','GB','US','GH'])[1+floor(random()*7)], (ARRAY['LA','FC','RI','OY','KN','EN'])[1+floor(random()*6)], 'Lagos',
    'Android','Chrome',(ARRAY['mobile','mobile','desktop'])[1+floor(random()*3)],'en','Africa/Lagos','1.0', 10, 3000, 1, '1' FROM generate_series(1, ${N})`); lap(`insert ${N} devices`)
await db.query(`INSERT INTO device_days (day, device_id, active_seconds, sessions, country, region, city, device_type, app_version, is_new)
  SELECT (d.first_seen::date + g), d.device_id, 60 + floor(random()*1800), 1 + floor(random()*3), d.country, d.region, d.city, d.device_type, d.app_version, g = 0
  FROM devices d, generate_series(0, 14) g WHERE d.first_seen::date + g <= current_date AND (g = 0 OR random() < 0.5)`); lap('insert device_days')
await db.query(`INSERT INTO feature_days (day, feature, device_id, uses, score_sum, score_n) SELECT dd.day, (ARRAY['place:home','place:buka','task:study','task:penalty','activity:rest','map','shop'])[1+floor(random()*7)], dd.device_id, 3, 1.5, 3 FROM device_days dd WHERE random() < 0.6 ON CONFLICT DO NOTHING`); lap('insert feature_days')
await db.query(`INSERT INTO sessions (session_id, device_id, started_at, last_event_at, active_seconds) SELECT gen_random_uuid(), device_id, day::timestamptz, day::timestamptz, active_seconds FROM device_days`); lap('insert sessions')
await db.query(`INSERT INTO playtime_split (day, device_id, bucket, seconds) SELECT day, device_id, 'world', active_seconds FROM device_days WHERE random() < 0.5`); lap('insert playtime_split')
await db.query(`INSERT INTO activity_heat (day, device_id, dow, hour, seconds) SELECT day, device_id, extract(dow from day)::int, floor(random()*24)::int, active_seconds FROM device_days WHERE random() < 0.3 ON CONFLICT DO NOTHING`); lap('insert activity_heat')
await db.query('ANALYZE'); lap('analyze')
}
let t = Date.now(); const lap = (l: string) => { const n = Date.now(); console.log(l.padEnd(34), `${n - t} ms`); t = n }
const f = { from, to }
for (const [name, fn] of [['overview', () => Q.overview(db, f)], ['players', () => Q.players(db, { ...f, page: 1, size: 25 })], ['geography', () => Q.geography(db, f)], ['engagement', () => Q.engagement(db, f)], ['features', () => Q.features(db, f)]] as const) { t = Date.now(); await fn(); lap(`${name} (90 days)`) }
process.exit(0)
