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

## Map tooltips and spoken text now match the screen
- Hovering a place on the full map or the minimap shows a tooltip: name, compass direction and step count, and whether it is open (touch: tap a pin). `tests/e2e/maptip.mjs`.
- The spoken line is now exactly the line on the card. Variable parts (direction and steps, place name, spot name) moved into a small gold chip under the line and are not spoken.
- Voice likeness: the 94 clips were made with `eleven_v4`; the owner reports they do not sound like the "Joshua Jumbo" clone. Test takes with other models were generated for comparison; re-record everything once a model is chosen.

## Voice re-recording (done)
- All 94 clips are now recorded with `eleven_multilingual_v2` in the owner's "Joshua Jumbo" cloned voice (the model the owner chose as sounding most like them). The earlier `eleven_v4` takes were replaced. Total ElevenLabs use for the whole voice work was roughly 20,000 credits including tests.

## Cities, character look and the luck scroll (latest)
- **Sound:** audio now unlocks on every finished tap, resumes when the browser suspends it, nudges iPhones off the silent switch, runs a hotter master level, and Settings has a "Test sound" button plus a build id (bottom of Settings) so we can tell which version a player is on. Saved settings are merged with defaults (an old save with no `volume` could break the audio config).
- **Character carries over:** the 3D world and the Dash now build the player from the creation choices (`buildHuman` takes gender, hair, facial hair, outfit, fabric and what you wear). Women get a slimmer frame, earrings and wrappers/skirts; men get beards, caps, kaftan/agbada. The school uniform is no longer forced on children, so the outfit chosen is the outfit seen.
- **Cities:** `src/content/cities.ts`. Create has a new first step (Lagos or Abuja); homes are filtered by city. Abuja districts: Kubwa, Garki, Wuse II, Maitama (`DISTRICTS` in `world/layout.ts`). Abuja shows green and white taxis (parked at the Cab Rank, in the Dash), a cab-rank name, rock hills on the horizon, its own Dash route, and Abuja events (`city` condition). Event text and Dash how-to text are localised (danfo → cab, Lagos → Abuja). Old saves with a Lagos home are unchanged.
- **Switch city in game:** Map sheet → "Move to another place" (`relocate` in `engine/api.ts`): ₦100,000 + 25 energy, friends drift if you change city.
- **Luck scroll heirloom:** each scroll result hands down an item (`heirloom: true` in `content/items.ts`) that is worn by the character (portrait and 3D), has a passive effect, shows in the profile and is never sold in the market.
- **"Other" tribe** replaces "Naija Mix" (Akwa Ibom, Cross River, Delta, Edo, Rivers, Benue names by gender); includes a Carnival event.
- Known follow-ups: the Dash how-to voice clips still say "danfo", so Abuja uses the phone voice for the cab version; Abuja place and event wording is a first draft for native review.

## Big dream as the whole game (latest)
- The separate "big dream" screen is gone. The **luck scroll now rolls your dream** (Abuja: Politician, Business Person, 9-5er, Content Creator, Degree Collector, I Never Know o. Lagos: Onile, LASTMA Officer, Governor, Pastor, Job Person, I no know o) and, in the same roll, a family background. Re-roll once. Each dream hands you a **symbol** that your character wears (3D world, portrait) and that has a small passive effect (`heirloom` items in `content/items.ts`).
- Every dream is a **path of six steps** (`content/dreams.ts`): finish school, join the community, get a job, save, and so on. Steps complete in order from conditions on the game state (lifetime activity counters `n_<activity>` are kept for this). The guide's "next step" now points at the current dream step first (after energy/health/mood), the Quests sheet shows the whole path with a "Show me" button, and a toast fires when a step is done.
- **Finishing the dream** opens a "Dream achieved" sheet: finish this life (ending screen, legacy and cowries recorded, then roll a new life) or keep playing. Onile has a dedicated land-buying event.
- Older saves keep their old dream and its old goal; they do not get a path.
- `tools/dream-sim.ts` shows how far headless players get on each path (rough guide: most paths complete for 20 to 100% of naive bots, 9-5er, Business and I-don't-know are easiest).

## District character and group trips (latest)
- `src/world/flavour.ts` describes what makes each of the eight districts itself: building heights and paint for home, school, office and worship, props (palms, billboards and political posters, flags, compound walls and gates, generators), moving traffic (yellow-black danfos, okada and keke, red BRT, SUVs and motorcades in Lagos and Abuja; green taxis in Abuja), street characters (touts at the bus stop, politicians with fila and agbada, hawkers), the skyline (granite and green hills in Abuja, towers, lagoon and ocean in Lagos) and the paint inside your home.
- New group trip place (`outing`): a hill with a trail and flag in Abuja ("Hike with friends"), a beach with sea, umbrellas, a boat and goal posts in Lagos ("Beach day with friends"). The task (`ui/tasks/TripTask.tsx`) has your friends follow you along five pins. The guide suggests it in the afternoon.
- Drawn from general knowledge of the two cities, not from a web search. Names of landmarks and the wording of slogans are a first draft for locals to review.

## Go-Slow Dash: levels, new obstacles and races
- **Levels** (`LEVELS` in `sim.ts`): 8 levels by distance (Warm-up, Rush hour, Market day, Junction wahala, Rail crossing, Airport road, Full Naija, Wahala no dey finish). Each raises top speed, tightens gaps and unlocks new things; a banner shows the level and a tip.
- **New obstacles**: cars, trains (20 m, dodge), a plane taxiing across the road (slide under the wing, foot only), big buses you jump ON and ride for roof coins (foot only), people walking across the road, crowds standing at junctions (with zebra crossing and traffic lights), roadside shops, and tunnels (dark, lit by lamps) at fixed places.
- **Fair, shared road**: the course depends only on position and seed (`generateRow` uses `spawnedTo`), so two runners with the same seed meet the same road. `rowSolvable` still guarantees a way through every row.
- **Race** (`race.ts`): Play now asks "Run alone" (unchanged solo run) or "Play against someone". `platform/match.ts` searches for a runner (no live race server yet, so it always returns nobody after ~3 s) and falls back to the computer runner **Alfred ai** (skill 0.8, beatable; see `tools/race-sim.ts`). 90-second race, most points wins, 10-coin win bonus, `flags.dashRaceWon` set on a win.
- A real human opponent plugs into `findRunner` and would need a lobby plus a way to stream the other runner's position.
- **Homes** now differ by city (Lagos zinc roof, veranda, washing line, water tank; modern duplex in Lekki/Yaba; Abuja tiled roof, porch pillars, hedges, gate pillars; Wuse apartment block).

## Washing tasks and home interiors
- **Brush teeth / take a bath** (`ui/tasks/WashTask.tsx`): the player walks to the sink or shower, the camera moves in, and each step is theirs to press: brush (foam, arm scrubbing), turn on the tap, rinse the mouth, turn off the tap; or turn on the shower, get wet, soap up (foam bubbles), rinse off, turn off. Falling spray and tap stream are drawn in `InteriorView.setWater`, running-water sound is `audio.water`. Finishing counts as the Freshen up activity.
- **Home interiors by district** (`world/homeDecor.ts`): paint and floor come from the district flavour; rug, sofa, bed and decor differ per district (Lagos: Eyo masquerade, ankara, washing line in Surulere, water drums in Ikorodu, bookshelf and fairy lights in Yaba, curtains and glass table in Lekki. Abuja: Zuma Rock pictures, Hausa leather poufs in Kubwa, certificates and flag in Garki, modern lamps in Wuse, gold mirror and curtains in Maitama). Visual only: nothing blocks walking.

## Street traffic and bus rides
- **Cars give way** (`WorldRenderer.updateTraffic`): every vehicle looks ahead for people on foot (you, residents, NPCs, commuters) in its lane and brakes to a stop, honks (with a "Beep beep!" bubble, only near you) and waits until they have passed. They also keep a gap behind the vehicle in front and hold back at the junction while another vehicle is crossing it. Go-Slow Dash keeps its own rules.
- **Buses at your stop**: the danfos (Lagos) and cabs (Abuja) on the road beside the stop slow down, halt, honk "Oya enter!", take on waiting commuters, let others off and drive on.
- **Take the bus**: at the bus stop panel, "Take the bus" lists the places with a fare that grows with distance. The fare is paid, a bus pulls up, you board, the screen goes dark while you ride (+20 minutes), and you step off beside the destination and walk to its door (`RideTask`, `rideBoard/rideDepart/rideArrive`).

## Quiet nights
Street life follows the clock (`WorldRenderer.streetLife`): full from 6:30am to 9pm, thinning until midnight, empty from midnight to 5am, building up again until 6:30. Cars keep driving until they are out of sight and then stay off the road; people head to the nearest door and go indoors, except two who linger a minute or so and then go home as well. Commuters leave the bus stop. At 12:30am a headless run showed 0 cars and 2 people (14:00: 11 cars, 18 people).

## Night animals
From about 7:30pm to 6am (`WorldRenderer.nightLevel`) owls (on rooftops, glowing eyes, swivelling heads, "I be witch o!" with a hoot when you come near), rats and cockroaches (scurry about, scatter from you, rats squeak), bats flapping round, and street cats with glowing eyes (meow) come out. They gather around wherever you are and are hidden by day and indoors.

## Dawn exercise and the gym
- **5am to 6:30am** people on the street jog along the pavements (with "Morning jog!" and "Feel the burn!" bubbles) or do jumping jacks, stretches and squats where they stand. Poses live in `characters.exercisePose`.
- **The gym** (new place `gym`, west of the pitch, open 5am to 10pm): glass walls and roof, so you can see treadmills and people working out from the street. Inside: treadmills, weights, mats, a coach and a member. You can run, lift or stretch (`GymTask`: tap to do 12 reps), which counts as the Exercise activity. Mama and Papa often work out there between 5 and 6:30am.

## Street plans and home floor plans per district
- **Streets** (`layout.shufflePlaces`): every district has its own plan. The home, the place of worship and the gym trade places along the north side of the main road, and the buka, the office and the job centre along the south side (seeded by the district id, always keeping a free lane beside the market and school). Your spawn is the front of your own door (`spawnOf`).
- **Homes** (`world/homes.ts`): five real floor plans, with different walls, rooms and furniture, not just colours: a row of rooms opening onto a shared passage (Surulere, Garki flipped), a bungalow with bedroom and kitchen wings (Ikorodu, Kubwa flipped), the classic plan (Yaba), open plan with a kitchen island and a separate bedroom (Lekki, Maitama flipped) and a compact studio with a balcony passage (Wuse). `setHomeVariant(districtId)` swaps `INTERIORS.home` and the chores spots; tests check every plan for reachability.

## Market catalog and "ask Mama to buy it"
The market shows everything it sells (`shopItems` returns the whole range, with `canBuy` and `mum` per item; a Goods list lists it all, the first ten stand in the aisles). When you are under 18 and live with a parent, Mama (or Papa) comes along to the market. For anything you are too young to buy yourself, "Ask Mama to buy it" spends YOUR money (`act('shop', { byMum: true })`, `mumCanBuy`): she buys for the house (appliances such as the air conditioner arrive by loader free of charge, rice for the family) and for things you are nearly old enough for; for things far too adult she says no. New child items: football, story books, a bag of rice.

## Birthday celebration
After the year summary, "Next year" now shows a birthday screen (`BirthdayModal`): confetti, balloons, a cake, "Happy Birthday!", your new age, a milestone line at ages like 1, 5, 10, 13, 16, 18 (bigger confetti), 21, 30 and so on, and greetings from Mama, Papa, a sibling and a friend who are alive. It shows once per year and is skipped when the life ends.

## Race fix: running out of hearts first
If you crash out while Alfred ai is still running, his run now continues to the end of the 90-second race (instantly, behind the result screen) and the scores are compared at the end, so you can only win if you are still ahead when his run is over. The result says "Alfred ai kept running after you crashed."

## 2.0 first playable (Level 1 + The Rush)
Source of truth: `docs/SPEC-v2-the-unexpected-day.md`; code notes: `docs/V2-TECH-NOTES.md`.
- **Shell**: the app now opens on `Home` (Chapters card, The Rush card, Leaderboard, Profile, Settings). The old open-world life is still in the code but unreachable from Home (`go('title')` maps to Home).
- **Characters**: `src/world/toon.ts` (3D, sheet style, 15 expressions), `castData.ts` (Baba Tunde, Zuri, Navi, Mama Folake, neighbours), `src/ui/Portrait.tsx` (SVG headshots). Preview: `/?sheet=1`.
- **Level 1 "The Morning Disaster"**: `src/levels/` (`schema.ts` task template, `chapter1.ts` data, `TaskRunner.ts` pure rules, `LevelRenderer.ts` scene, `progress.ts` save rules) and `src/ui/screens/{V2,LevelPlay}.tsx`. Four tasks: find the phone, pack the essentials, choose what to take (stored as flag `ch1.l1.item`), leave on time (sliding clutter costs 3 s, never a restart). Stars: finish, on time, on time with 2 mistakes or fewer. 1 point per task the first time only; coins 10 per extra star.
- **Progress** is saved at every task in `MetaProfile.chapter` (resume at the exact task). Debug hook: `?debug=1` exposes `window.__level`.
- **The Rush**: `Dash.tsx` has a `rush` mode (no life, no energy, 2.0 character). Lobby: Play alone, Find a player (honest: "Nobody is online right now", then an explicit "Race Alfred ai (computer)" button), Challenge a friend (disabled, needs backend). Points: 1 for a new personal best over 100 m, 1 for the first win. Local leaderboard shows this device only; Global is marked "soon".
- **Analytics** (admin schema): first_task_started, first_task_completed, level_started, level_completed, level_abandoned, task_failed, hint_used, session_resume, rush_finished.
- **Not built (open in spec section 16)**: levels 2 to 9, chapters 2 to 10, global leaderboard, matchmaking/invitations, sign-in, purchases, points policy for competitive play.

### Level 1 polish round (after first live test)
Popups moved to edge strips (Rush and Level 1); tasks are acted out (walk up, dig, lift, pick up); tap-to-move; a soft yellow guide ring on the area of the next step after 15 s without progress; faint hazard paths in task 4 and a shorter knock-back; first-move hint line; one-tap "How was it?" feedback after Level 1 (`level_feedback` event: rating + issue, no free text). Analytics are on by default with an opt-out in Settings.

### The Rush upgrade: timer, pickups, flying, rides, Alfred gap
- **Run time**: every Rush run (solo or vs Alfred) is timed. Chips 1:00, 1:30, 2:00, 3:00, 5:00 in the lobby, the pause menu and the result screen; saved in `chapter.rush.secs`; changing it mid-run applies at once. When time is up the run ends ("TIME UP"), the score is distance and skill based.
- **HUD**: one slim row at the top (time left with a thin bar, Alfred "N m ahead / behind", scores). Nothing in the lanes; the Alfred name tag over his head is gone; the road-progress bar is hidden in The Rush.
- **Pickups** (`sim.ts`, same seed = same road for both runners): ⚡ boost (5 s, about 35% faster), 🪽 wings (7 s of flight, a sky stretch of coins with birds, drones and kites follows; a sky hit drops you to the road with a speed loss, no heart), rides 🛹 skateboard / 🚲 bike (every ~620 m) and 🛶 canoe (start of every bridge stretch): 10 s, faster, and the ride absorbs one hit. Alfred picks them up and avoids sky obstacles while flying.
- Tests: `tests/rush-extras.test.ts`.

### One look everywhere
All screens use the cream, orange and green palette (tokens in `src/ui/index.css`, constants in `src/ui/theme.ts`): buttons, cards, tiles, chips, ribbons, sheets, toasts, Settings, Trophies, Shop, Lives and every Rush overlay. The old purple gradient is retired. The unreachable open-world HUD (`World.tsx`, `Play.tsx`) inherits the new tokens but was not restyled or tested.
The old open-world screens (Create, World HUD and dock, place/NPC/profile/menu sheets, events, Ending, Trophies, Shop, task panels, city art, icons) were also moved to the palette (purple and magenta hexes replaced, white text and overlays flipped to ink on cream). To look at them: `?debug=1&screen=create|play|ending|history|unlocks|achievements` (starts a random life if none exists).

### Chapter select (eFootball-style)
Home's story card is now a generic "Chapters" card leading to a sideways row of chapter cards (`Chapters` in `src/ui/screens/V2.tsx`, data in `src/levels/chapters.ts`, unlock rule `chapterState` in `src/levels/progress.ts`). The open chapter has Start/Continue; the others are dimmed with a lock until every level of the chapter before them has stars (chapters 2 to 10 are placeholders). `?debug=1&unlockall=1` opens them all for testing.

### Chapter 2: Trial Day (first playable level)
Chapter lineup now follows the spec (section 12). Chapter 2 "Trial Day" has Level 1 "Arrival at the Pitch" (`src/levels/chapter2.ts`): find the registration desk (new `goto` task kind with a marker ring), collect bib, shin pads and water, choose Striker/Winger/Defender boots (stored as `ch2.l1.item`), warm-up dribble through sliding training dummies (timed, 3 s per clip, never a restart). The renderer builds either the home or a football pitch (`sceneKind`), hazards, NPC positions and the football kit are now level data. While a chapter has only some of its levels built (`prototype: true`), finishing the built ones opens the next chapter, so testers can move on; the rule switches to all nine levels when they exist. Levels 2 to 9 of both chapters are still to do.

### Chapter 2 Level 2: Skills Stations
`LEVEL_C2L2` in `src/levels/chapter2.ts`: gather at the centre circle through a crowd of hopefuls, three penalties (new `kick` task: a timing needle, green zone widens a little after each miss, ball and keeper animated), choose the next drill (Sprint ladder: 14 s, 2 fast dummies; Passing circle: 24 s, 3 slower dummies; stored as `ch2.l2.item`), then run back to the circle. New engine bits: `kick` task kind, `variants` (the timed task changes with the choice before it), `crowd`, and reach tasks that end in an area instead of a line. Level 1 now chains to Level 2 with a Next level button on the result screen.

### Chapter 1 complete: levels 2 to 9
All nine levels of "The Unexpected Day" exist (`src/levels/chapter1.ts` and `chapter1b.ts`), chained with Next level, ending with a chapter-complete banner, the "Somehow, You Made It" badge and Chapter 2 opening (chapter 1 now needs all nine levels; chapter 2 stays a prototype with two levels). New engine pieces: generic data-driven scenes (`sceneKind: 'scene'` with a `theme`), task kinds `hold` (stand in the ring) and `sequence` (do things in order), budgeted shopping with a Start over button (never unwinnable), choice-dependent lines (`introByChoice`), timed runs and goals that change with the earlier choice (`variants`, `variant: true`), result endings by stars (`endBeats`), two side characters (The Neighbour, The Helper), and new hazards and item shapes. Tests: `tests/chapter1.test.ts` plays every level of both chapters with a correct bot and checks the templates, rings, items and hazard fairness. Levels: 2 The Journey (street), 3 The Errand That Wasn't (market, budget), 4 Everybody Needs Something (square, prioritising), 5 The Queue (queue, wait, order memory), 6 The Deadline (office, urgent folder, order, interruption), 7 The Unexpected Guest (flat, social choices), 8 The Final Complication (bus stop to market to home), 9 Somehow, You Made It (party, five tasks).

### Chapter 2 Level 3: The Trial Match
`LEVEL_C2L3` in `src/levels/chapter2.ts`: take your position (the ring depends on the boots chosen in Level 1: striker, winger or defender), complete two passes (the penalty needle reused as a pass to a teammate, `kick.pass`, no keeper), beat the defenders (time and number of defenders by position: 14 s / 18 s / 24 s), the decisive moment (shoot, pass or hold) and face the coach (his lines follow your decision). Engine additions: `TaskDef.flag` (a task can read a flag saved in an earlier level) and variants that give a different ring per task (`goals`). Level 2 now chains to Level 3.

### Chapter 2 complete: levels 4 to 9
`src/levels/chapter2b.ts`: 4 The Waiting Game (clubhouse: results board, wait, find the coach's door, how to go in), 5 Fitness Test (sprint, plank hold, cone-order drill, rest or push on), 6 Kit Trouble (find the boot, dress in order, budgeted kit shop, hurry through the corridor), 7 The Rival (taunt choice, penalty shootout whose rival lines follow the choice, how it ends), 8 The Friendly Match (position by the Level 1 boots, counter-attack by the Level 3 decision, penalty, defend the lead, celebrate), 9 The Verdict (sign forms in order, accept / ask for time / decline, tell Mama, walk onto the pitch; badge "Trial Day"). Chapter 2 now needs all nine levels, and finishing it opens Chapter 3 (placeholder). The shared level helpers (`L`, `T`, `say`, `D`) are exported from `chapter1b.ts`. The bot-playthrough tests cover every new level.

### Chapter 3: Market Day (all nine levels)
`src/levels/chapter3.ts`: you run a market stall for a day. 1 Opening the Stall (set up in order, choose prices, open the shutter in time), 2 The Wholesaler (find the supplier, ₦2000 stock budget, wait for the receipt, rush back), 3 First Customers (serve in order, discount choice, chase the lost change), 4 The Haggler (offer, stay firm, settle), 5 Counting the Takings (find the money box, count notes in order, ₦1500 supplier budget, save or restock), 6 Rain! (run, cover goods in order, choose fresh or dry goods which changes the run), 7 The Competitor (visit his stall, find the sign, answer, outlast), 8 The Inspector (greet, tidy in order, find the licence, honesty), 9 Closing Time (count, share the profit, tell Mama, close the shutter; badge "Market Day"). Finishing it opens Chapter 4 (placeholder). Covered by the bot-playthrough tests.
