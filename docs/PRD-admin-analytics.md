# PRD: Admin Console and Player Analytics

Status: draft for build. Companion to `docs/PRD.md` (game) and `docs/STATUS.md`.
Owner: game owner. Audience: whoever builds the admin side (human or AI tools).

## 1. Why this exists

Today the game is a static, offline-first web app. It has **no server, no accounts and no real analytics**: `src/platform/analytics.ts` only counts two events (`life_started`, `life_ended`) in the player's own browser. The owner cannot see who plays, from where, for how long, or which features matter.

This PRD defines:

1. A **telemetry pipeline** (client SDK + collector) that records who is playing, where from, for how long and what they do.
2. An **Admin Console** (separate protected web app) that turns that data into dashboards, user lists and exports.
3. The **privacy, consent and security** rules that make this lawful and safe, particularly under the Nigeria Data Protection Act (NDPA) 2023 and, for any non-Nigerian players, GDPR-style expectations.

### Goals

| # | Goal | Success looks like |
|---|------|--------------------|
| G1 | Know who plays | Daily/weekly/monthly active players, new vs returning, retention curves |
| G2 | Know where from | Country, region/state and city (approximate), language, device, browser, install (PWA) vs web |
| G3 | Know how long | Session length, time-in-world vs time-in-minigame, playtime per day, remaining/spent Playtime Tokens |
| G4 | Know what they use | Feature usage: places entered, tasks performed (study, penalties, hangouts), activities, minigames, shop, quests, achievements, menu mode vs 3D world |
| G5 | Know where they drop off | Funnel: landing > character created > first walk > first task > first year ended > day-2 return > paywall seen > top-up |
| G6 | Support the business | Revenue, paywall conversion, token economy health (when payments exist) |
| G7 | Operate the game | Error rates, slow-device rate (quality governor), content feedback (🚩 flags), moderation of reports |

### Non-goals (v1)

- Real-time session replay, screen recording or keystroke capture.
- Selling or sharing player data with third parties.
- Personal data beyond what is listed in section 6.
- Editing game content from the admin (a later phase; see backlog).

## 2. Users of the admin console

| Persona | Needs | Role |
|---------|-------|------|
| **Owner / Product** | Health of the game at a glance, geography, retention, revenue | `owner` (full access incl. exports and user management) |
| **Analyst** | Slice and export data, build cohorts | `analyst` (read all aggregates, no raw identifiers) |
| **Support / Moderator** | Look up one player, see flags and reports, reset a token balance | `support` (read single-user records, limited writes, every action audit-logged) |
| **Engineer** | Error and performance data | `engineer` (read errors, perf, feature flags) |

## 3. Key concepts and identity

- **Device ID**: random UUID generated on first visit, stored in `localStorage`. This is the identity in v1 because there are no accounts yet. It is *pseudonymous* personal data under NDPA.
- **Player ID**: assigned when accounts arrive (M2). Device IDs link to a Player ID at login so history is preserved.
- **Session**: starts when the app is opened or returns to the foreground after 30 minutes idle. Ends on 30 minutes of inactivity or on close. Active time is measured from heartbeats, not from wall-clock open time (a tab left open overnight must not count as 9 hours).
- **Life**: one run of the game (`life_started` to `life_ended`). A player has many lives.
- **Active time**: seconds in which the tab is visible *and* there was input or game activity in the last 60 seconds. This matches the existing Playtime Token meter (`src/platform/tokens.ts`), which should become the single source of truth for playtime.

## 4. Functional requirements

### 4.1 Telemetry capture (client)

**FR-T1** A small SDK (`src/platform/analytics.ts`, replacing the local counter) batches events and sends them to the collector. It is a no-op until the player has consented (`meta.consentAnalytics`). Consent can be withdrawn in Settings and stops all sending at once.

**FR-T2** Delivery: queue in memory and `localStorage`, flush every 15 seconds, on `visibilitychange: hidden` and `pagehide` using `navigator.sendBeacon` (fallback `fetch` with `keepalive`). Offline events queue and send later (the game is an offline-first PWA). Retry with exponential backoff, drop events older than 7 days, cap the queue at 500 events.

**FR-T3** Every event carries: `event_id` (UUID, for de-duplication), `name`, `ts` (client time ISO), `device_id`, `session_id`, `life_id` (if in a life), `app_version`, `props` (small JSON). The server adds `received_at` and geo (4.2). Maximum event size 2 KB, maximum batch 50 events.

**FR-T4** Heartbeat: while active, send `heartbeat` every 30 seconds with `active_seconds` since the last one, current `screen` (title / world / menu / dash / ending), `mode` (3D world or menu mode) and `place` if any.

**FR-T5** The SDK must never block gameplay, throw, or add more than ~5 KB gzip to the initial bundle. Failures are swallowed.

#### Event taxonomy (v1)

| Group | Event | Key props |
|-------|-------|-----------|
| Lifecycle | `app_open`, `session_start`, `session_end`, `heartbeat`, `consent_changed`, `pwa_installed` | `referrer`, `utm_source/medium/campaign`, `display_mode`, `active_seconds`, `reason` |
| Onboarding | `title_viewed`, `create_started`, `create_completed`, `tutorial_step`, `tutorial_skipped`, `tutorial_completed` | `step`, `archetype`, `gender`, `district`, `birth_lottery` |
| Life | `life_started`, `year_ended`, `life_ended` | `age`, `life_index`, `ending_id`, `years_lived`, `final_stats` |
| World | `place_entered`, `place_exited`, `door_opened`, `map_opened`, `map_travel`, `sleep_started`, `sleep_ended`, `wait_used` | `place`, `hour`, `hours_slept`, `appliances_on` |
| Tasks | `task_started`, `task_completed`, `task_abandoned` | `task` (class, library, penalty, hangout, chat, ...), `place`, `score`/`perf`, `duration_s`, `partner_role` |
| Activities | `activity_done` | `activity_id`, `energy_cost`, `cash_delta` |
| Social | `conversation_choice`, `hangout_destination` | `tone`, `role`, `setting` |
| Events | `story_event_shown`, `story_choice_made` | `event_id`, `choice_id` |
| Minigame | `dash_started`, `dash_finished` | `mode` (foot or danfo), `distance`, `coins`, `crashed` |
| Economy | `shop_viewed`, `item_bought`, `paywall_seen`, `topup_started`, `topup_completed`, `tokens_spent` | `item_id`, `price`, `minutes`, `amount`, `currency` |
| Progress | `quest_completed`, `achievement_unlocked`, `unlock_bought` | ids |
| Quality | `error`, `slow_device_detected`, `menu_mode_switched`, `webgl_unavailable` | `message` (truncated, no PII), `fps_band`, `ua_class` |
| Feedback | `content_flagged` | `event_id`, `reason` |

Event names and props are defined once in a shared typed schema (Zod) used by both client and collector so they cannot drift.

### 4.2 Collection and enrichment (server)

**FR-C1** `POST /api/collect` accepts a batch, validates it against the schema, rate-limits per device (for example 120 events/minute), rejects oversized payloads, and responds `204`. Invalid events are dropped and counted.

**FR-C2** **Geo-location** is derived server-side from the request IP using the hosting provider's edge headers (Vercel provides `x-vercel-ip-country`, `x-vercel-ip-country-region`, `x-vercel-ip-city`) or a GeoIP database. Store **country, region and city only**. **Do not store the raw IP address**; if abuse prevention needs it, store a salted hash that rotates daily and expires in 7 days.

**FR-C3** Parse the user agent into `device_type` (mobile, tablet, desktop), `os`, `browser`, `browser_version`; store screen size band and language (`navigator.language`) and time zone. Do not store the raw user agent beyond 30 days.

**FR-C4** Derive and maintain, per device and per session: first seen, last seen, sessions count, total active seconds, lives count, countries seen, and the "last 7 days" activity bitmap used for retention.

**FR-C5** Idempotent ingest: duplicate `event_id` values are ignored.

### 4.3 Admin console (web app)

Routes and screens (all require login, section 4.4):

1. **Overview** (landing)
   - KPI tiles with delta vs previous period: DAU, WAU, MAU, new players, returning players, average active time per player per day, average session length, lives started, lives completed, paywall conversion.
   - Time series: active players (hour/day/week), new vs returning, sessions.
   - Date range picker (today, 7d, 30d, 90d, custom) and a global filter bar (country, device type, app version, new/returning).
2. **Players**
   - Table: device/player ID (shortened), first seen, last seen, country/city, device, sessions, total active time, lives, last feature used, tokens left, status. Search, sort, filters, pagination, CSV export (owner and analyst only; IDs hashed for analyst).
   - **Player detail** page: timeline of sessions with duration, places visited, tasks done, activities, lives and endings, token usage, flags. A "delete this player's data" action for NDPA erasure requests (audit-logged).
3. **Geography**
   - World map and Nigeria state/city breakdown (choropleth plus ranked table): players, sessions, average playtime, retention by location.
4. **Engagement and playtime**
   - Distribution of session length and daily playtime (histogram), time-of-day heatmap (hour by weekday in the player's local time), playtime split: world vs minigame vs menus vs sleeping/waiting.
   - Stickiness (DAU/MAU), session frequency, days played per week.
5. **Features**
   - Ranked usage of every feature (places entered, task types, activities, minigames, shop, map, wait, menu mode vs 3D world) with unique users, total uses, uses per active player and trend.
   - **Task performance**: average score for class quizzes, penalty goals, conversation tone mix; completion vs abandon rates.
   - Feature adoption funnel and time-to-first-use.
6. **Funnels and retention**
   - Configurable funnel (default in G5). Cohort retention table (D1, D3, D7, D14, D30) by acquisition week and by country/device.
   - Drop-off points inside a life: age at which players quit, most common endings.
7. **Economy and revenue** (active once payments exist)
   - Token grants vs spend, time to paywall, conversion, ARPU/ARPPU, refunds, top-up size mix; guards against abuse (devices with abnormal free-token refills).
8. **Content and quality**
   - Story events: times shown, choice split, 🚩 flags per event; top flagged items for cultural review.
   - Errors (grouped), slow-device rate, WebGL failure rate, load time bands, by app version and device.
9. **Live view** (optional in v1): players online now (heartbeat in the last 2 minutes) with country and screen.
10. **Reports and exports**: scheduled weekly email summary to the owner; CSV/JSON export per view; saved views.
11. **Settings**: users and roles, data retention, event schema viewer, consent text versions, API keys, audit log.

**FR-A1** Every chart shows its definition on hover (what counts as an active user, session, etc.) so numbers are never ambiguous.
**FR-A2** Dashboards load in under 3 seconds for a 90-day range at 100k players (use pre-aggregated tables, section 5).
**FR-A3** The console works on a laptop first and is usable on a phone (the owner reviews on mobile).

### 4.4 Authentication, roles and audit

**FR-S1** Admin login with email plus one-time code or SSO (Google). Mandatory 2FA for `owner` and `support`. Sessions expire after 8 hours of idle time. The console is a separate deployment/subdomain (for example `admin.<domain>`) and is **never** reachable from the game bundle.
**FR-S2** Role-based access control as in section 2. Analysts see pseudonymous IDs only. Support can see a single player's detail but cannot bulk export.
**FR-S3** Every admin read of a single-player record and every write is written to an immutable audit log (who, when, what, from where).

## 5. Technical approach

Recommended for an AI-assisted build and the current Vercel deployment; swap pieces freely.

```
Game client (SDK) --batch--> /api/collect (Vercel Function, edge geo headers)
                                   |
                                   v
                       Postgres (Neon / Supabase)
                 raw_events (partitioned by day)
                 devices, sessions, lives, players
                 daily_rollups, feature_rollups, geo_rollups
                                   ^
        nightly + incremental jobs |  (Vercel Cron / pg_cron)
                                   v
Admin Console (Next.js or Vite+React, shadcn/ui or Tailwind, Recharts) --> /api/admin/* (RBAC)
```

- **Storage**: Postgres is enough for the first ~10M events/month. If volume grows, add ClickHouse or BigQuery behind the same schema. Keep `raw_events` append-only and partitioned by day; query dashboards from rollup tables.
- **Idempotency and cost**: batch writes; `INSERT ... ON CONFLICT DO NOTHING` on `event_id`.
- **Rollups**: incremental per-day jobs for DAU/WAU/MAU, session stats, feature counts, geography, funnels and cohorts. Backfill job to rebuild from raw.
- **Privacy by design**: PII-free schema, per-event allow-list, no free-text fields from players. The player name chosen in character creation is **not** sent.
- **Observability**: collector exposes its own metrics (accepted, dropped, invalid, latency).
- **Environments**: staging collector so test traffic (`?debug=1`, `?unlimited=1`, bots, dev builds) is tagged `is_test` and excluded from KPIs.

### Core data model (simplified)

```
devices(device_id pk, first_seen, last_seen, country, region, city, os, browser, device_type, language, tz, app_version, player_id null, consent_version, consent_at, deleted_at)
sessions(session_id pk, device_id, started_at, ended_at, active_seconds, screens jsonb, entry_referrer, utm jsonb)
lives(life_id pk, device_id, started_at, ended_at, age_reached, ending_id, archetype, gender, district)
raw_events(event_id pk, received_at, ts, device_id, session_id, life_id, name, props jsonb, country, region, city, is_test)
daily_rollups(day, country, device_type, app_version, dau, new_players, sessions, active_seconds, ...)
feature_rollups(day, feature, users, uses, avg_score, ...)
players(player_id pk, email_hash, created_at, tokens jsonb, status)       -- M2
payments(payment_id pk, player_id, provider, amount, currency, minutes, status, created_at) -- M2
admin_users(admin_id pk, email, role, 2fa, disabled)
audit_log(id, admin_id, action, target, at, ip_hash)
```

## 6. Privacy, consent and compliance

- **Legal basis**: consent (opt-in, unticked by default, plain-language screen on first run: what is collected, why, how long, how to withdraw). Register with and follow guidance from the Nigeria Data Protection Commission (NDPC) as required for the volume of data processed; appoint a data protection contact; keep a processing record. Plan a Data Protection Impact Assessment before launch.
- **Data collected (allow-list)**: device ID, session timing, approximate location (country/region/city), language, device/browser class, gameplay events as in 4.1. **Not collected**: precise GPS, raw IP, contacts, free text, the player's chosen name, or anything from other apps.
- **Children**: the game includes childhood stages and may attract players under 18. Collect the minimum, require a parent/guardian-appropriate consent flow when an age is declared under the legal threshold, never use data for ads or profiling.
- **Rights**: access, correction and **erasure** (admin tool plus an in-game "Delete my data" button that deletes by device ID), export, withdrawal of consent (stops collection immediately).
- **Retention**: raw events 90 days; sessions and rollups 25 months; audit log 24 months; IP hash 7 days; user agent 30 days. Configurable.
- **Security**: TLS everywhere, encryption at rest, least-privilege DB roles, secrets in environment variables, rate limiting and bot filtering on the collector, CORS restricted to the game origin, dependency and vulnerability scanning.
- **Transparency**: an in-app privacy page (link from Settings and the consent screen) and a changelog of what telemetry exists.

## 7. Metric definitions

| Metric | Definition |
|--------|------------|
| Active player (DAU/WAU/MAU) | Distinct device IDs (Player IDs later) with at least one session having `active_seconds >= 10` in the period, excluding `is_test` |
| New player | First `session_start` ever for that device in the period |
| Returning player | Active in the period and first seen before it |
| Session | See section 3; length is `active_seconds`, with wall-clock span shown separately |
| Retention Dn | Share of a cohort (by first-seen day) active exactly n days later |
| Playtime | Sum of active seconds; split by screen/mode from heartbeats |
| Feature user | Distinct players with at least one event of that feature in the period |
| Paywall conversion | Players who completed `topup_completed` / players who saw `paywall_seen` |
| Task score | `perf` (0 to 1) reported on `task_completed`; average per task type |

## 8. Acceptance criteria

- **AC-1** With consent granted, a play session of 5 minutes appears in the admin console within 60 seconds, with correct duration (within 10 seconds), device class and country.
- **AC-2** With consent denied or withdrawn, zero network requests to the collector are made.
- **AC-3** Closing the tab mid-task still records the session end and active time (via beacon) in at least 95% of tests; offline play syncs when back online with no duplicate events.
- **AC-4** Overview, Players, Geography, Engagement and Features pages return in under 3 seconds with 100k simulated players and 10M events.
- **AC-5** A player's raw IP address cannot be found anywhere in the database, logs or backups beyond the 7-day hashed window.
- **AC-6** An `analyst` account cannot open a single-player detail page or see unhashed IDs; every `support` lookup creates an audit entry.
- **AC-7** Deleting a player/device removes it from raw events, sessions and lives, and aggregates are recomputed on the next rollup.
- **AC-8** Test traffic (`?debug=1`, `?unlimited=1`, automated bots) never inflates KPIs.
- **AC-9** The SDK adds no more than 5 KB gzip and no measurable frame-time impact on a low-end Android phone.

## 9. Delivery plan and backlog

**Phase A: Collector and SDK (1 to 2 weeks)**
1. Typed event schema package (Zod) shared by game and collector. 2. `/api/collect` with validation, rate limit, geo from headers, idempotency. 3. SDK with consent gate, batching, `sendBeacon`, heartbeat, offline queue. 4. Instrument the game: lifecycle, onboarding, world, tasks, activities, minigame, economy, errors (the taxonomy above). 5. Consent screen and Settings controls ("Delete my data").

**Phase B: Admin MVP (2 to 3 weeks)**
6. Auth, roles, audit log. 7. Overview with KPIs, DAU/WAU/MAU, new vs returning. 8. Players table and detail. 9. Geography. 10. Session length and daily playtime. 11. Feature usage ranking. 12. CSV export.

**Phase C: Depth (2 to 3 weeks)**
13. Funnels and cohort retention. 14. Task performance and content flags. 15. Errors and device quality. 16. Live view. 17. Scheduled email summary.

**Phase D: Business (after accounts and payments, M2)**
18. Player ID linking, account-level views. 19. Revenue and token economy dashboard. 20. Alerts (error spike, conversion drop, abuse). 21. A/B test and feature-flag support. 22. Optional content editor (events, quizzes, dialogue) with review workflow.

**Prerequisite from the game (M2)**: accounts and a server-side token ledger (see `docs/PRD.md`) so playtime and payments are authoritative and cannot be edited in the browser's `localStorage`.

## 10. Risks and open questions

| Item | Question / mitigation |
|------|-----------------------|
| Consent rate | Opt-in may be low. Decide whether essential, non-identifying aggregate counts (page load, country) are allowed without consent under NDPA advice from counsel; otherwise numbers will undercount. **Owner decision needed.** |
| Minors | What minimum age and guardian flow do we apply? **Owner and legal.** |
| Identity | Are accounts (email/phone/Google) coming before launch? Without them, "who logged in" means "which device", and clearing the browser creates a new player. |
| "Who" granularity | Does the owner need to see names/emails of players (requires accounts and explicit consent), or is pseudonymous enough? Recommendation: pseudonymous by default, email visible only to `owner`/`support`. |
| Geo accuracy | IP geolocation is approximate (city-level is unreliable on Nigerian mobile networks, which route through carrier gateways). Treat region/city as indicative. |
| Hosting | Vercel Functions are fine for the collector at this scale; revisit cost beyond ~50M events/month. |
| Payments | Provider choice (Paystack or Flutterwave are the likely options for Nigeria) affects the economy dashboard schema. |
| Data residency | Confirm whether NDPA cross-border transfer rules require a Nigeria/Africa region or contractual safeguards for the chosen database host. **Legal.** |
