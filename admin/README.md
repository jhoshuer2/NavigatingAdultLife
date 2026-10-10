# Adult Life Admin (collector and console)

Separate app from the game. Implements `docs/PRD-admin-analytics.md`: the telemetry collector, the database and the admin console.
The game never imports from here; the two share only `../shared/events.ts` (the event schema).

```
game (src/platform/analytics.ts) --batch--> POST /api/collect  --> Postgres --> /api/admin/* --> console (this app's UI)
```

## Run it locally (no accounts, no services)

```bash
cd admin && npm install
DEV_TOTP=1 npm run dev        # API on :8787, in-process Postgres kept in .pglite, 60 demo players, demo owner
npm run dev:ui                # console on http://localhost:5173 (proxies /api to :8787)
```

Sign in as `owner@example.com` / `dev-password`; the 6-digit code is at <http://localhost:8787/dev/code> (dev only, needs `DEV_TOTP=1`).

To see the game send events to it, from the repo root: `VITE_COLLECTOR_URL=http://localhost:8787/api/collect npm run dev -- --port 5174`
and add that origin to `GAME_ORIGINS`. Agree to the consent screen and play.

Tests: `npm test` (collector, auth, roles, dashboards run on in-process Postgres). `npm run bench -- 100000` times the dashboards at 100k players.

## Deploy (needs accounts, so do this when you are ready)

1. **Database**: any Postgres (Neon or Supabase free tiers work). Choose the nearest region and get legal advice on cross-border transfer. Run `DATABASE_URL=... npm run migrate`.
2. **Vercel project #2**: root directory `admin`, framework Vite. "Include source files outside of the Root Directory" must be on (it imports `../shared`).
3. **Environment variables** (admin project):
   | Name | Purpose |
   |---|---|
   | `DATABASE_URL` | Postgres connection string |
   | `GAME_ORIGINS` | Comma-separated game origins allowed to call the collector, e.g. `https://adultlife.example` |
   | `ID_HASH_SECRET` | Random string; keys the hashed player IDs analysts see |
   | `IP_SALT` | Random string; salts the hashed admin IP in the audit log |
   | `CRON_SECRET` | Random string; Vercel Cron sends it so only the daily retention job can run |
4. **Game project** (the existing one): set `VITE_COLLECTOR_URL=https://<admin-domain>/api/collect` (and optionally `VITE_APP_VERSION`). Without it the game sends nothing and does not show the consent screen.
5. **First admin**: `DATABASE_URL=... npm run create-user -- you@example.com owner` prints a password and a 2FA secret once.

## What it stores (and does not)

- Stored: device ID, session timing, country/region/city from the host's edge headers, language, time zone, device class, gameplay events on the allow-list in `../shared/events.ts`.
- Never stored: IP address, raw user agent, player or character names, any free text. Props not on the allow-list are dropped by the collector.
- Retention (daily cron): raw events 90 days; sessions, lives and daily summaries 25 months; audit log 24 months.
- Erasure: the game's "Delete my statistics" button and the console's "Delete this player's data" both remove the device from every table.

## Deviations from the PRD (on purpose, for v1)

- `raw_events` is one indexed table purged by age, not day-partitioned. Dashboards read the compact `device_days` / `feature_days` tables, so this holds well past the first million players; partition it if volume grows.
- Login is email + password + authenticator-app code (TOTP) for every role, not email one-time code or Google SSO, because those need an email provider or Google project. Add them when you want them.
- Geography is ranked lists and tables, not a choropleth map.
- "Active player" is a device with at least 10 active seconds on the day (not a session of 10 seconds).
- Not built yet (later phases): funnels and cohort retention page, errors and device quality, live view, scheduled email, revenue (payments are out of scope), consent-text versions and API keys in Settings.
- Not tracked by the game yet: `conversation_choice`, `tokens_spent`, `door_opened`, `content_flagged`, `tutorial_step/skipped`, `webgl_unavailable`, `slow_device_detected` (the schema allows them).
