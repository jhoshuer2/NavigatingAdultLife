# Adult Life Admin (collector and console)

Separate app from the game. Implements `docs/PRD-admin-analytics.md`: the telemetry collector, the database and the admin console.
The game never imports from here; the two share only `../shared/events.ts` (the event schema).

```
game (src/platform/analytics.ts) --batch--> POST /api/collect  --> Postgres --> /api/admin/* --> console (this app's UI)
```

## Run it locally (no accounts, no services)

The admin app imports the shared event schema from `../shared`, which needs the repo's top-level packages too, so install both:

```bash
npm install            # in the repo's top folder
cd admin && npm install
DEV_TOTP=1 npm run dev        # API on :8787, in-process Postgres kept in .pglite, 60 demo players, demo owner
npm run dev:ui                # console on http://localhost:5173 (proxies /api to :8787)
```

Sign in as `owner@example.com` / `dev-password`; the 6-digit code is at <http://localhost:8787/dev/code> (dev only, needs `DEV_TOTP=1`).

To see the game send events to it, from the repo root: `VITE_COLLECTOR_URL=http://localhost:8787/api/collect npm run dev -- --port 5174`
and add that origin to `GAME_ORIGINS`. Agree to the consent screen and play.

Tests: `npm test` (collector, auth, roles, dashboards run on in-process Postgres). `npm run bench -- 100000` times the dashboards at 100k players.

## Deploy (needs accounts, so do this when you are ready)

1. **Database (Supabase)**: supabase.com > New project (free plan). Pick the closest region (check the list for Cape Town; otherwise Frankfurt or London), set a database password and keep it safe. Then **Connect** > **Connection string**:
   - **Session pooler** (port 5432) for `npm run migrate` and `npm run create-user` from your computer (works over IPv4; the direct connection is IPv6-only on the free plan).
   - **Transaction pooler** (port 6543) for `DATABASE_URL` on Vercel.
   - Supabase's certificate is signed by its own CA. Download it from Project Settings > Database > SSL configuration and put the file's contents in `DATABASE_SSL_CA` (preferred), or set `DATABASE_SSL=no-verify` to get going (encrypted but not verified).
   - Run `DATABASE_URL='<session pooler string>' DATABASE_SSL_CA="$(cat prod-ca-2021.crt)" npm run migrate`. Any Postgres host (Neon, etc.) works the same way; only the connection string differs.
2. **Vercel project #2**: root directory `admin`, framework Vite. The four serverless functions are bundled into single files in `admin/api/*.js` (committed; regenerate with `npm run build:api` after changing anything in `server/` or `api-src/`, which `npm run build` also does). "Include source files outside of the Root Directory" must be on (it imports `../shared`).
3. **Environment variables** (admin project):
   | Name | Purpose |
   |---|---|
   | `DATABASE_URL` | Postgres connection string (Supabase: transaction pooler) |
   | `DATABASE_SSL_CA` | Database certificate authority text (or `DATABASE_SSL=no-verify`) |
   | `GAME_ORIGINS` | Comma-separated game addresses allowed to send data, e.g. `https://adultlife.vercel.app`. Every address people use to open the game must be listed (Vercel gives one project several: the main one, a custom domain, branch links). Settings > Data and retention shows any address that was turned away |
   | `ID_HASH_SECRET` | Random string; keys the hashed player IDs analysts see |
   | `IP_SALT` | Random string; salts the hashed admin IP in the audit log |
   | `CRON_SECRET` | Random string; Vercel Cron sends it so only the daily retention job can run |
   | `ACCOUNT_SECRET` | Random string (32+ characters); signs player account tokens and hashes recovery codes. Changing it signs every player out and invalidates recovery codes |
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
- Phase C pages: Funnels (funnel, retention cohorts by week/country/device, drop-off age, endings), Content (flags, story choices, tone mix, task completion), Quality (errors, slow and no-3D rates, load time, by version/device) and Live. The weekly summary is generated and previewable in Settings, but **not emailed**: sending needs an email service account, which has not been set up.
- Not built yet: revenue (payments are out of scope), consent-text versions and API keys in Settings, A/B tests and alerts (Phase D).
- Not tracked by the game yet: `tokens_spent`, `door_opened`, `tutorial_step/skipped` (the schema allows them). The flag button sends only the event id, never the player's note.


## Player accounts (online play)

`POST /api/account` (one endpoint, `op` field) implements the accounts part of `docs/PRD-multiplayer.md`: anonymous accounts with a display name and tag (`Tobi#4821`), a friend code, an age band (`under13`, `13to17`, `18plus`), an optional 4-digit guardian PIN and a recovery code for restoring on another device. No email or phone is collected. The game talks to it from Settings > Online profile.

`POST /api/rush` (same account token and CORS) runs live Rush races: presence pings, challenges to active players, accept/decline, race snapshots, results and the global board (`shared/rush.ts`, `server/rush.ts`, migration 5). The game needs `VITE_COLLECTOR_URL` (or `VITE_ACCOUNT_URL`) at build time and `GAME_ORIGINS` set on this project, like the accounts API.

- Under-13 accounts cannot switch online play on until a guardian PIN is set; once a PIN exists, switching it on needs the PIN (switching off never does). Free chat stays off for everyone (`chat_level: none`) until the chat phase.
- Tokens are signed (HMAC) with `ACCOUNT_SECRET`, valid 60 days, and revoked by recovery or "sign out everywhere".
- Throttling: 8 creations per hour and 10 recovery tries per hour per address, 8 PIN tries per hour per account.
- Inactive accounts are deleted after 18 months (daily cron). Players can delete their own account any time.
- Age is self-declared. It cannot be raised later by the player.
- Accounts are deliberately **not** linked to the analytics device ID.
- Tests: `tests/account.test.ts`.
