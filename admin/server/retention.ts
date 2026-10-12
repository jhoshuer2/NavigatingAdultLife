// Retention (PRD section 6): raw events 90 days, summaries 25 months, audit log 24 months, tombstones/limits 7 days.
import type { Db } from './db'

export const RETENTION = { rawEventsDays: 90, summaryMonths: 25, auditMonths: 24, tombstoneDays: 7 }

export async function purge(db: Db, now = new Date()): Promise<void> {
  const ago = (days: number) => new Date(now.getTime() - days * 86400e3).toISOString()
  const months = (m: number) => { const d = new Date(now); d.setUTCMonth(d.getUTCMonth() - m); return d.toISOString() }
  await db.tx(async (t) => {
    await t.query("SELECT set_config('nal.purge', 'on', true)")
    await t.query('DELETE FROM raw_events WHERE received_at < $1', [ago(RETENTION.rawEventsDays)])
    const s = months(RETENTION.summaryMonths)
    for (const [tbl, col] of [['device_days', 'day'], ['feature_days', 'day'], ['playtime_split', 'day'], ['activity_heat', 'day'], ['ingest_stats', 'day'], ['blocked_origins', 'day'], ['content_days', 'day'], ['quality_days', 'day'], ['error_days', 'day'], ['device_milestones', 'first_at'], ['sessions', 'started_at'], ['lives', 'started_at']]) await t.query(`DELETE FROM ${tbl} WHERE ${col} < $1`, [s])
    await t.query('DELETE FROM audit_log WHERE at < $1', [months(RETENTION.auditMonths)])
    await t.query('DELETE FROM erased_devices WHERE at < $1', [ago(RETENTION.tombstoneDays)])
    await t.query('DELETE FROM rate_limits WHERE window_start < $1', [Math.floor(now.getTime() / 60e3) - 10])
    await t.query('DELETE FROM login_attempts WHERE at < $1', [ago(1)])
    await t.query('DELETE FROM admin_sessions WHERE last_seen < $1', [ago(1)])
  })
}
