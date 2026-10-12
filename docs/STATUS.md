# Milestone 1 status

_Last updated alongside the M1 build. Source of truth for requirements: `docs/PRD.md`._

## Update: explorable world (pulled forward from M2)

Playtest feedback was that the menu-driven hub did not feel like living a life. The explorable 3D district originally planned for M2 (M2-F01, F21, F23 in the PRD) was built early: walk with joystick / WASD / tap-to-walk with pathfinding, 9 places with action panels, persistent NPCs you can talk to, ambient pedestrians with speech bubbles, minimap, "next thing to do" guidance with auto-walk, month and season (Harmattan, rains, Detty December) shown in the world, and a Menu mode fallback. Layout and pathfinding are unit tested (every place reachable in all four districts). Then added: a world clock with day/night lighting (dawn, sunset, lit windows and street lamps), opening hours (places lock at night, with a closed label), and enterable interiors (home, classroom, buka, place of worship, workplace, job centre) with furniture, people and hotspots. At home: "Rest & recover" walks you to bed; in the evening the light, TV and fan are on and can be switched off; sleep fast-forwards the clock with a Wake up button available any time (rest benefit scales with hours slept, appliances left on cost cash and spoil rest); plus meals, brushing teeth, TV, desk study. "End the year" is now a separate action. Then added playable in-world tasks: study in a classroom (teacher writes the question on the board, classmates react, 25s timer) or alone in the library corner or at your home desk; a swipe-to-shoot penalty shootout on the pitch (score feeds the play/exercise bonus); talking and hanging out as real scenes where both characters face each other and speak in bubbles (choose warm, funny or flat replies, which feed the bond), and friend hangouts that walk together to the pitch or the buka first. Also playable now: market hustle (serve and haggle with customers), household chores (walk the home tidying spots against a timer) and overtime (sort documents into trays). Worship is playable too (clap in time to a song, a short message with a question, an optional offering). Shopping is playable (walk the market aisles, stop at goods, buy or haggle). Exercise is a jog round the pitch (checkpoints, sprint stamina, dodging goats)., Focus Days and real-device performance measurement.

## Update: analytics and admin console (docs/PRD-admin-analytics.md, Phases A to C)

- **Game side (opt-in only):** `src/platform/analytics.ts` is now a consent-gated telemetry SDK (batching, offline queue, `sendBeacon`, 30 s heartbeat of active time). A first-run privacy screen asks for consent (off until the player agrees); Settings can withdraw it, show what is collected and the device code, and "Delete my statistics". Tracking calls are in `store.ts` and `World.tsx`; gameplay is unchanged. With no `VITE_COLLECTOR_URL` the game sends nothing and does not show the consent screen. Shared event schema: `shared/events.ts`.
- **Admin project:** `admin/` (own package and Vercel project): collector (`/api/collect`, `/api/forget`), Postgres schema, retention job, admin API with email + password + authenticator-app login, four roles, audit log, and the console pages Overview, Players (list and detail), Geography, Engagement, Features, Settings. See `admin/README.md` for running locally, deploying and the deviations from the PRD.
- **Phase C added:** Funnels, Content, Quality and Live pages, plus a weekly summary preview. The game now also reports conversation tone, content flags, slow-device and no-3D events, and page load time (all consent-gated).
- **Not yet:** the weekly summary is not emailed (needs an email service account); revenue (needs payments). Needs your accounts before it can run live: a Postgres database and a second Vercel project.

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
| M1-F23 | Consent-gated analytics | Done (opt-in SDK plus collector; see the update above) |
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


## Task tuning notes (in-world tasks)

First tuning pass, based on simulation and unit tests rather than player data (please playtest and send feedback):

- Penalties: swipe maps so a full-length sideways swipe goes just wide; the keeper guesses the shot side 30% of the time; high shots (above 1.8 on a 2.4 bar) beat a diving keeper. Simulated rates: random swipes about 50% goals, well-placed high corners over 90%, weak middle shots under 55%. Rules live in `src/ui/tasks/rules.ts` with tests in `tests/tuning.test.ts`.
- Time: activities now take roughly half the in-world hours they did before, so a year's energy budget fits in about one day and places do not all close by early evening.
- Conversations: tone now matters per person (funny wins with friends and siblings, warm with family, partners and the boss; flat is always worst).
- Chores 40s (was 60s), jog is two laps in 32s (was one lap in 50s, too easy), worship clap window tightened to about 180 ms either side.


## Living world update

- People have routines (`src/world/residents.ts`): family cook, eat, watch TV, play, go to work or school, sleep (off screen), and only sometimes appear outside, wandering near where they hang out. No more fixed doorstep spots.
- At home you can sit on the sofa, lie on the bed, cook a meal (pick ingredients, stir), ask family for food, or eat at the buka (sit, order, wait, eat, pay).
- Rented and owned homes start bare; buy a TV, fridge, fan or air conditioner at the market, hire a loader, and watch the delivery arrive at home.
- Football: find a team (three squads) and play a three-a-side match with AI teammates, rivals and goalkeepers.
- Co-op: chores can be done together with a family member who is home. Real multiplayer is planned in `docs/PRD-multiplayer.md` (needs accounts and a realtime server).

## Design overhaul ("Danfo Nights", docs/DESIGN-AUDIT.md)
Every screen was redesigned to be visual first: custom icon set, glass panels, chunky buttons, banner ribbons, stat badges, tile pickers, the Oga Conductor mentor, count-ups, confetti and staggered motion (Reduced Motion respected).
- Title, character creation (live avatar, icon tabs, swatches, lottery reveal), first-run mentor
- World HUD (avatar ring, cash, energy, stat badges, objective banner), round action prompts, joystick, icon dock with a raised Home button
- Place, person, hotspot and picker sheets as icon tile grids (cost and reward as symbols, locked tiles show the reason in one phrase)
- Events, quiz, year summary, quests, profile, trophy shelf, unlocks shop, past lives, settings (switches), ending ("Final whistle"), paywall, tutorial
- Brand rule: titles are white, gold is for rewards, green is the single main action
- Sounds: tile tap, sheet open, close, toggle, toast pop, reward chime (confetti and trophies), prompt blip. Still to polish: a real-phone check

## Online profile (client)
Settings > Online profile (shown only when the account API is configured) creates an anonymous profile, shows the recovery code once, restores with a code, sets or checks the guardian PIN, toggles "play with others" (no multiplayer yet), rotates the code, signs out and deletes. Code: `src/platform/account.ts`, `src/ui/screens/OnlineProfile.tsx`. Verified against the local admin API with `tests/e2e/profile.mjs`.

## Guide: "what do I do now?" (English, Pidgin or both)
Players said they were not sure where to begin, so the game now tells them, GTA style.
- **Language:** asked once at first run (English / Pidgin / Both), changeable in Settings > Guide. In "Both", Pidgin leads and English is the small second line. The "Show me what to do next" switch turns the guide off. Test and playtest links (`?unlimited=1`) skip the question; add `&asklang=1` to see it.
- **Guide card** (Oga Conductor + one line + icon) under the HUD, in the world and inside buildings. It decides the next step from the same logic as before (`suggest`) but now knows where you are: outdoors it says which way and how many steps; at the door, "tap the big green button"; inside the wrong building, "go outside first"; inside the right one, which spot to walk to.
- **Highlights:** the place ring and arrow outdoors, the hotspot marker or the exit door indoors, a gold pulse on the dock button, minimap or Home/Outside button the guide mentions, a pulsing tile in the place sheet, and an edge-of-screen compass arrow with the distance when the target is off screen.
- **Stuck:** after about 35 s of doing nothing the guide points at Quests, then at the Map, then repeats. Walking towards the target does not count as stuck.
- **Quests** now say where to go (in your language) and have a "Show me" button that makes the guide follow that quest.
- **Map:** your position is a ringed "YOU" marker, a dotted trail shows where you have been, a gold line shows the way to the guided or selected place, and the tooltip card gives compass direction, step count and what you can do there.
- Code: `src/content/lang.ts`, `src/world/guide.ts` (`guideStep`, `QUEST_HINTS`, `bearing`), `src/ui/Guide.tsx`. Tests: `tests/guide.test.ts`, `tests/e2e/guide.mjs`.
- 🚩 The Pidgin lines are first drafts and need a native-speaker review (all in `guide.ts`, `Guide.tsx`, the coach text in `World.tsx`).
- Not yet guided: the Dash, the tasks themselves (they have their own instructions) and the sheets other than the place sheet.

## Guide voice and how-to cards
- **Voice:** the guide, the first-run coach and the how-to cards are spoken with the phone's built-in speech (`src/platform/voice.ts`). It prefers a Nigerian English voice, then other English ones, and reads the Pidgin text with the same voice, so Pidgin will sound like an English voice reading it. Settings > Guide has a voice switch; the card has a speaker button to hear a line again. Same line is not repeated within 90 s. It follows the Sound switch and volume.
- **Better voice later:** record or generate the lines (for example with ElevenLabs) and play them from `voice.ts` instead; the text lives in `guide.ts`, `taskGuide.ts` and `World.tsx`. Not done because it needs a voice choice and a credit budget.
- **How-to cards:** every task (study, talk, penalty, market, chores, overtime, service, shop, jog, match, cook, dine) and the Dash (on foot and danfo) show a card first: steps with icons, the goal, a speaker button and Start. The task only begins after Start. Shown the first two times per task; Settings > "Show the how-to tips again" resets them. Test links skip them (add `&asklang=1` to see them).
- Content: `src/content/taskGuide.ts`. 🚩 Pidgin lines need a native-speaker review.
- `tests/e2e/dash.mjs` is out of date (it clicks "Skip creation", removed in the redesign) and needs updating.

## Recorded guide voice (ElevenLabs, Joshua's cloned voice)
- 94 clips (47 lines x English and Pidgin) were generated with ElevenLabs model `eleven_v4` in the workspace voice "Joshua Jumbo" (cloned, Nigerian English accent), about 6,900 credits. They live in `public/voice/<id>.<en|pcm>.mp3` (24 kHz mono, 2.7 MB in total) with `public/voice/manifest.json`.
- Covered: the 12 "what to do next" suggestions, the generic guide lines (stuck, at the door, go outside, look around, go to the glowing spot), the 3 first-run tips, a how-to clip for every task and the Dash (both modes), and every quest hint.
- Not recorded (so spoken by the phone voice instead): lines that contain a place name, step count or spot name, such as "Walk east, about 48 steps". Their recorded part (the suggestion) plays; the exact numbers are on screen.
- Playback: `speakLine` in `src/platform/voice.ts` plays the clip for the player's language (Pidgin for Pidgin and Both) and falls back to the phone voice if a clip is missing.
- Regenerate or change a line: edit the text (`guide.ts`, `taskGuide.ts`, `voiceLines.ts`), run `npx tsx scripts/voice-lines.ts`, generate the changed lines, and add the file to `public/voice` and the manifest. Old clips for edited lines must be replaced or they will say the old words.
- The Pidgin wording is still a first draft; re-record after a native-speaker review.
- Test: `tests/e2e/voice.mjs`.
