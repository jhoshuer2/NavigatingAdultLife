# PRD: Multiplayer and Co-op (other real players)

Status: draft. Companion to `docs/PRD.md`, `docs/PRD-admin-analytics.md` and `docs/STATUS.md`.

## 1. What exists today, and what this adds

Today the game is single-player and runs entirely in the browser. People in your life (family, friends, classmates, teammates, sellers, loaders) are **AI-driven characters** with daily routines. Some tasks are already "co-op with a character": chores with a family member, a three-a-side football match with AI teammates and rivals.

This PRD adds **other real players** in the same world so people can see each other, talk, and do tasks together, while keeping the single-player life intact and fully playable offline.

### Goals
| # | Goal | Success looks like |
|---|------|--------------------|
| G1 | Feel like a living neighbourhood | You see other real players walking around your district and can wave, chat and join in |
| G2 | Do tasks together | Two to four players complete chores, a market stall, a class study session or a football match as a team, with shared rewards |
| G3 | Meet people safely | Players can add friends, party up and play without exposure to strangers' free text unless they choose |
| G4 | Stay affordable and fast | Under 150 ms perceived latency on mid-range Android over Nigerian mobile networks; server cost per concurrent player stays low |
| G5 | Never break the single-player game | Offline play, saves and the Playtime Token meter keep working with multiplayer off |

### Non-goals (v1)
- Open-world voice chat, user-created content, trading real money between players, competitive ranked ladders.
- Cross-district persistent housing visits (friends' homes) before presence and co-op tasks are stable.

## 2. Player experience

### 2.1 Shared districts ("Hangout mode")
- A district (Surulere, Ikorodu, Yaba, Lekki) runs as **rooms** of up to about 20 players. Each room has the same map and buildings as single-player.
- You enter Hangout mode from the Places menu or a **🌐 Online** chip. Your own life (stats, cash, family) is unchanged; Hangout mode shows only your **avatar, name, level of look** to others.
- Other players appear as avatars walking around, with name tags. Their positions are smoothed (interpolated) so movement looks natural.
- **Emotes and preset phrases** first (wave, laugh, "Let's play football", "Come and help me", "Thank you", in English and Pidgin). Free-text chat is an opt-in later phase (section 6).
- Tap a player: Wave, Add friend, Invite to team, Report, Block, Mute.

### 2.2 Co-op tasks (shared reward, shared progress)
| Task | How two to four players work together | Reward |
|------|----------------------------------------|--------|
| Chores | Split the home or compound spots; each player tidies different areas; progress is shared | Faster finish, bond bonus with each other, shared Reputation |
| Market stall | One serves customers, one restocks or manages change; haggling is decided by the pair | Bigger takings, shared |
| Study group | Same question set; you can hint to each other; the group's score counts | Knowledge bonus for all |
| Overtime | Sort documents in parallel; mistakes cost the team time | Reputation bonus |
| Football | Real players fill teammate and rival slots in a three-a-side match; AI fills any gaps | Win bonus, team record |
| Delivery help | One player buys, another is the loader who carries and installs | Shared small fee |

Every co-op task already works with AI partners, so a lobby can **start immediately with bots** and swap a bot for a real player who joins.

### 2.3 Friends and parties
- Friend list by username code (and later by phone/Google contacts, with consent).
- Party of up to 4; party members see each other's location, can teleport to a friend, and start tasks together.
- Presence states: online, in task, away.

### 2.4 Safety and age
- Many players are children. Default for everyone: **preset phrases only**, no free text, no images, no links, no voice.
- Under-13 and unknown-age accounts can never enable free chat. 13 to 17 can enable "friends only" free chat with a filter. 18+ can enable local chat with a filter.
- Report and Block in two taps; blocked players never appear; reports go to the admin console moderation queue (see the admin PRD) with a rolling 60-second context of the room.
- Profanity and PII filter (phone numbers, emails, addresses, links) for any free text, English plus Pidgin, Yoruba, Igbo and Hausa word lists maintained by the owner.
- Guardian controls: a setting to turn multiplayer off, with a parent PIN.

### 2.5 Rush races (built)
A live race for The Rush, ahead of the hangout and co-op phases. Tapping **Find a player** sends a challenge to every online player who is active in the game right now (online play on, pinged within 30 s, not already in a race). They get a popup on any screen and have 20 s to accept. Everyone who accepts races the same road (shared seed, synced 3-2-1); each phone simulates its own run and sends a small snapshot about 2.5 times a second, and the others are drawn as ghosts. The highest score wins and earns 3 points on the Global leaderboard. If nobody accepts (or nobody is around) the host is offered Alfred ai, and only then.
Transport is plain polling over `POST /api/rush` (`ping`, `challenge`, `respond`, `lobby`, `state`, `finish`, `leave`, `board`) on the admin app and its Postgres (tables `rush_matches`, `rush_players`, `rush_board`), because Vercel Functions cannot hold websockets. The match state machine advances lazily on each call, so there is no worker. Scores are client-reported and only capped for plausibility; a runner whose snapshots stop for 10 s is dropped and scored on their last snapshot. A real-time transport (PartyKit etc.) can replace the polling later behind `src/platform/rush.ts` without touching the game.

## 3. Functional requirements

**FR-M1 Accounts.** Multiplayer requires an account (anonymous device account is allowed, upgradeable to email or Google). The server issues a short-lived signed session token. This is also the prerequisite for the server token ledger and payments in the main PRD.

**FR-M2 Presence.** The client sends position and heading at 10 Hz (only when changed), received by others at the same rate, interpolated on screen. Server keeps authoritative last-known positions and drops idle clients after 30 s.

**FR-M3 Interest management.** A client only receives players within about 40 world units, capped at 30 nearby avatars, so rooms stay cheap.

**FR-M4 Events.** Emotes, preset phrases, task invites and task actions are small validated messages (schema shared with the client, as with the analytics schema in `shared/`).

**FR-M5 Task rooms.** A co-op task is a short-lived room with an authoritative state machine on the server (for example chores progress, stall queue, match state). Clients send inputs; the server validates and broadcasts state. Rewards are granted by the server once, on completion (idempotent), and applied to each player's local game with a signed result so cheating is detectable.

**FR-M6 Football match.** Server-authoritative ball and player positions at 20 Hz with client-side prediction for your own player. If fewer than six humans, AI fills the rest (same AI as single-player).

**FR-M7 Graceful degradation.** If the connection drops or the player is offline, Hangout mode closes, the single-player world continues, and any task falls back to AI partners.

**FR-M8 Moderation.** Report queue, mute/ban tools, and audit logging in the admin console; automatic temporary mute on repeated filter hits.

**FR-M9 Fair play.** Rewards are capped per day for co-op tasks (to stop farming), speed and teleport checks on movement, and rate limits on every message type.

**FR-M10 Analytics.** Use the events in the admin PRD (new events: `hangout_joined`, `friend_added`, `party_started`, `coop_task_started`, `coop_task_completed`, `report_sent`), subject to the same consent rules.

## 4. Technical approach

Vercel Functions cannot hold long-lived WebSocket connections, so multiplayer needs a realtime service next to the existing Vercel apps. Options, cheapest to most work:

| Option | Fit | Notes |
|--------|-----|-------|
| **Supabase Realtime** (Broadcast and Presence) | Good for presence, emotes, invites | If the admin app already uses Supabase this adds almost no new infrastructure; not ideal for a 20 Hz authoritative football match |
| **PartyKit / Cloudflare Durable Objects** | Excellent for rooms and task state machines | One room object per district and per task room; global edge; pay per use; TypeScript, shares schemas with the game |
| **Colyseus on Fly.io** | Best for authoritative real-time matches | A server you run; needs more ops work |
| **Ably or Pusher** | Fastest to ship presence | Per-message cost grows with players |

**Recommendation:** start with **PartyKit (Cloudflare Durable Objects)** for rooms and co-op tasks, with Supabase (or the existing database) for accounts, friends, reports and rewards. Football can run in the same room object at 20 Hz for three-a-side. Keep the message schema in `shared/` so the game, the room server and the admin console agree.

```
Game client (Three.js world)  <--WebSocket-->  Room server (district rooms, task rooms)
        |                                              |
        | HTTPS                                        | HTTPS (signed)
        v                                              v
 Vercel Functions: accounts, friends, reports   Database (users, friendships, reports, rewards)
```

Client changes: a `src/platform/net.ts` connection manager (reconnect, backoff, offline queue-free), a remote-player layer in `WorldRenderer` (interpolated avatars with name tags), and task components that can accept a `partners` list of either AI or remote players.

Cost guide: about 20 players per room at 10 Hz of small messages is a few KB/s per player; budget it before launch and set a per-room cap.

## 5. Data model (additions)

```
accounts(account_id pk, device_id, email_hash null, birth_year null, age_band, created_at, mp_enabled bool, chat_level enum(none,friends,local))
friendships(a_id, b_id, status enum(pending,accepted,blocked), created_at)
parties(party_id pk, leader_id, created_at, ended_at)
rooms(room_id pk, kind enum(district,task), district_id, started_at, ended_at)
coop_results(result_id pk, room_id, task, players[], score, reward jsonb, signature, created_at)
reports(report_id pk, reporter_id, target_id, reason, context jsonb, status, created_at, handled_by)
bans(account_id, kind enum(mute,ban), until, reason, created_by)
```

## 6. Delivery plan

| Phase | Scope | Depends on |
|-------|-------|-----------|
| **P0** (done in game) | AI-partner co-op (chores helper, football teammates) so every co-op task already works alone | none |
| **P1 Accounts** | Anonymous and email/Google accounts, age band, guardian setting | main PRD M2 |
| **P2 Presence** | Hangout rooms, see other players, emotes and preset phrases, friends, report and block, admin moderation queue | P1, admin console |
| **P3 Co-op tasks** | Lobby, partner slot with bot fallback, shared progress, server-granted rewards: chores, market stall, study group, overtime | P2 |
| **P4 Football** | Three-a-side with real players, AI fill, authoritative server | P3 |
| **P5 Chat** | Opt-in filtered chat by age band; community guidelines; appeals | P2 and legal review |

## 7. Acceptance criteria

- **AC-1** Two browsers in the same district see each other within 1 s and movement looks smooth (interpolated) at 100 to 150 ms latency.
- **AC-2** With multiplayer off, no network connection is opened and the game behaves exactly as today.
- **AC-3** A co-op chores run with one real player and one bot completes, rewards both players once, and survives one player disconnecting (bot takes over).
- **AC-4** No free-text field reaches a player whose account is under 13 or unknown age.
- **AC-5** A blocked player is invisible to the blocker in rooms and tasks, and cannot message them.
- **AC-6** A report appears in the admin moderation queue with context within 5 s.
- **AC-7** A football match with 3 humans and 3 bots keeps ball and player state consistent for all clients (no more than 1 m divergence after correction).
- **AC-8** Reward replay is rejected: submitting the same signed result twice grants it once.

## 8. Risks and open questions

| Item | Question |
|------|----------|
| Children and safety | Minimum age for multiplayer at all? Parent consent flow? Recommendation: preset phrases only below 13, and get legal advice under the Nigeria Data Protection Act before launch. |
| Moderation capacity | Who reviews reports and how fast? Without moderators, keep chat off. |
| Cost | Realtime hosting cost per concurrent player; set a cap per room and a budget alert. |
| Network quality | Players on weak mobile data: keep messages small, support reconnects and automatic fallback to AI partners. |
| Rewards and fairness | Cap co-op rewards per day so farming with friends does not break the economy. |
| Identity | Is Google or phone sign-in the main route in Nigeria? Phone (OTP) is common but costs SMS credit; Google is free. |
| Language | Which Pidgin and local-language phrases ship first? The owner should supply and review the preset list. |
