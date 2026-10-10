# Milestone 1 status

_Last updated alongside the M1 build. Source of truth for requirements: `docs/PRD.md`._

## Update: explorable world (pulled forward from M2)

Playtest feedback was that the menu-driven hub did not feel like living a life. The explorable 3D district originally planned for M2 (M2-F01, F21, F23 in the PRD) was built early: walk with joystick / WASD / tap-to-walk with pathfinding, 9 places with action panels, persistent NPCs you can talk to, ambient pedestrians with speech bubbles, minimap, "next thing to do" guidance with auto-walk, month and season (Harmattan, rains, Detty December) shown in the world, and a Menu mode fallback. Layout and pathfinding are unit tested (every place reachable in all four districts). Not yet done: interiors, time-of-day lighting, Focus Days, and real-device performance measurement.

## Feature checklist (PRD section 9, Milestone 1)

| ID | Feature | Status |
|---|---|---|
| M1-F00 | Repo, CI, build, PWA | Done (deploy target not yet chosen) |
| M1-F01 | Title and main menu | Done |
| M1-F02 | Character creation (Look, 2 of 14 traits, Dream, Birth Lottery, Home, name) | Done |
| M1-F03 | Core engine (yearly loop, stats, Energy, seeded RNG) | Done |
| M1-F04 | HUD | Done |
| M1-F05 | Activity system (15 activities) | Done |
| M1-F06 | Scene cards | Done (8 procedural scenes; placeholder art) |
| M1-F07 | Education path and exams | Done |
| M1-F08 | Careers (5 tracks x 4 levels) | Done |
| M1-F09 | Money (yearly settlement, tax, rent, lifestyle, black tax events) | Done |
| M1-F10 | Relationships (basic, marriage, children) | Done |
| M1-F11 | Events (138, branching, flags, follow-ups, templating) | Done (see content gaps) |
| M1-F12 | Go-Slow Dash, On Foot and Danfo modes (3D, Three.js) | Done |
| M1-F13 | Coins to cash with yearly cap | Done |
| M1-F14 | Quests (8) | Done |
| M1-F15 | Achievements (27) | Done |
| M1-F16 | Cowries and unlocks (11 cosmetics, 3 perks) | Done |
| M1-F17 | Endings, obituary, Legacy, share card | Done |
| M1-F18 | Save/load, export/import | Done |
| M1-F19 | Settings | Done |
| M1-F20 | Audio | Done (synthesised placeholders) |
| M1-F21 | Tutorial | Done (first-run modal) |
| M1-F22 | Accessibility baseline | Partly: labels, keyboard on forms, reduced motion, large text; no full audit yet |
| M1-F23 | Consent-gated analytics | Done (local counters only) |
| M1-F24 | PWA | Done (installable, precached) |
| M1-F25 | Pop-quiz study (SHOULD) | Done (89 written questions plus generated maths; answer order shuffled) |
| M1-F26 | Playtime Tokens (client side, mock top-up) | Done |
| M1-F27 | Playtest feedback button | Done |

## Acceptance criteria

| AC | Result |
|---|---|
| AC-M1-01 creation <= 120 s | Met by design (6 steps, plus Surprise me) |
| AC-M1-02 no crash/soft-lock | Met in tests: 24 bot lives in CI plus hand checks; every event has an unconditional choice |
| AC-M1-03 stats clamp and explain changes | Met (property checks in bot tests; year summary lists reasons) |
| AC-M1-04 traits/tiers change outcomes | Met (sim shows distinct net worth distributions per strategy and tier) |
| AC-M1-05 exam fail/resit, trade and work paths, 5 tracks | Implemented; covered by bot play; no dedicated scenario tests yet |
| AC-M1-06 runner >= 55 FPS on mid-range Android | **Not verified.** Software-rendered headless run only. Needs a real-device check (quality governor is in place) |
| AC-M1-07 >= 8 endings reachable | Met: all 9 verified by hand-built scenarios; bots reach 5 |
| AC-M1-08 save round trip | Met (test) |
| AC-M1-09 event repeat rate | **Not met as written.** About 75-80% of events overlap between two consecutive lives (138 events, ~70 seen per life). Needs more content (M2 target 220). Within a life, repeats are limited by cooldowns |
| AC-M1-10 first load budget | Met on size: initial JS ~126 KB gzip; Three.js (125 KB) loads only for the runner. Lighthouse timing not measured |
| AC-M1-11 no hard-coded content in engine | Met |
| AC-M1-12 Lighthouse a11y >= 90 / offline | Offline precache done; Lighthouse not run |
| AC-M1-13 token meter | Met: unit tests cover welcome grant, daily refill cap, spend order, unlimited mode |

## Known gaps and next steps

1. Real-device performance check of Go-Slow Dash (low-end Android) and tuning of the quality governor.
2. More events (variety), more quiz questions (to 120), per-career events in the weaker tracks.
3. Dedicated scenario tests for education paths and the in-game paywall UI.
4. Owner playtest: cultural review of events (use the in-game flag button), balance feedback.
5. Choose a hosting target (Cloudflare Pages is the PRD recommendation) and add a deploy step.
6. M2: accounts and server-side token ledger with real payments, explorable 3D districts.
