# Navigating Adult Life 2.0: chapter-based redesign (design document)

## Context
About 55 people have played the current game and almost none came back. The reasons you gave: it is confusing ("a lot is happening", "I don't know what to do"), it is tied to Lagos/Abuja, and nothing pulls players back. The fix is a new concept, not a patch: **play a role for a day, level by level, in real-feeling 3D scenes, always with one clear thing to do, chasing points on a leaderboard.** The only thing carried over from the old game is the endless runner, which stops being hidden and becomes a headline game.

This document is the design only. No code is written until you approve it. Open items that need you are at the end.

## What you have already decided
- Core idea: **live a role for a day**, shown as real 3D scenes (not choice cards, not menus).
- Structure: a normal level-based game. Win a level, the next unlocks. Chapters group levels. 10 chapters at launch, played in order; locked ones are visible but locked.
- Each task you finish scores a point and moves straight to the next task. Points feed a **local and a global leaderboard**.
- No sign-up to start. Optional Google/Apple sign-in later gives bonus points. Later chapters are a **one-time purchase per chapter**, owned for life and replayable forever.
- The runner is a top-level game with: play with someone online, or alone. If nobody is online it silently becomes a race against **Alfred (AI)**. An online player gets a Bolt/Uber-style request even mid-chapter; accepting takes them to the run, and their chapter stays paused where it was.
- Chapter length: about 90 minutes if played in one sitting, but built so it can be left and resumed at any point.
- Not Lagos/Abuja specific any more: anyone, anywhere can play.
- Character style will change. You will send references. **Character screens wait for them.**

## Design pillars (so the app is never overwhelming)
1. **One thing on screen.** Every screen has one main action. A level shows only the current objective, a progress dots row and a points counter. No map, no stat bars, no menus during play.
2. **Always know what is next.** A glowing objective marker plus one line of text ("Pick up your lunch box"). A "Show me" button repeats it.
3. **Points are instant.** Finish a task: points pop, short cheer, next objective appears within 2 seconds.
4. **Sessions are small even if chapters are long.** A level is 8 to 10 minutes. Progress is saved after every task. Opening the app offers "Continue" first.
5. **Reasons to come back:** next level or chapter unlock, daily challenge, rank changes on the leaderboard, a friend's challenge notification.

## Screens, one by one

**S0. First open (no sign-up, 3 seconds).** Logo, a short animated bus/road moment, then straight to Home. No account, no tutorial wall. The first level of Chapter 1 teaches by doing. A tiny consent line for analytics is shown once as a bottom sheet, not a blocking page.

**S1. Home.** Top bar: points, a small leaderboard rank chip, settings gear. Centre: **two large game cards**.
- Card A, **"Hustle Run"** (working name for the runner; proposed alternatives: "Rush Hour", "Street Sprint"): looping animated preview, label "Race someone or beat Alfred".
- Card B, **"Chapters"**: shows the current chapter's art, name, a progress ring ("Level 3 of 8") and a big **Continue** button.
Below, small: Leaderboard, Profile. Nothing else. A returning player with a paused level sees Continue first.

**S2. Hustle Run lobby.** Three big buttons: **Find a player**, **Play alone**, **Challenge a friend** (invite link). Below: your best score and today's rank.

**S3. Searching.** Radar animation, "Looking for a runner...", Cancel. After about 8 seconds with no one: "Nobody around, you are racing Alfred" and a 3-2-1 start. If someone is found: both names appear, 3-2-1.

**S4. Incoming challenge (the Uber moment).** A banner slides from the top over whatever you are doing, even mid-level: avatar, name, "Wants to race you", **Accept** and **Not now**, with a 15 second ring. Accept pauses and saves the level, loads the run. When the race ends, a card says "Back to Chapter 1, Level 3" with a Resume button. The same person can then be added as a friend and invited again.

**S5. Run play.** Full screen, the existing 3D runner. HUD: score, coins, hearts, level name, race bar (you vs opponent), time left. Controls as now. Race rules: both runners get the same seed; if you crash first the opponent finishes, then the winner is decided (already built).

**S6. Run result.** Win/lose banner, both scores, points earned (win bonus), new rank, **Race again**, **Rematch**, **Add friend**, **Home**.

**S7. Chapters map.** A vertical or horizontal road of 10 chapter cards. Completed: full colour with stars. Current: glowing, **Play**. Next locked: dimmed padlock, "Finish Chapter N to unlock". Paid chapters later: a price tag and "Unlock for life". Locked ones may be teased with a blurred picture.

**S8. Chapter intro.** Cinematic card: title, the role you play ("Today you are the new hire"), a 3-line story, the rival or helper character, number of levels, expected time (about 90 min, can pause anywhere). **Start** or **Resume** (shows exactly where you stopped).

**S9. Level select inside a chapter.** A short path of level nodes (8 to 10). Done levels show points and stars. Next level is lit. Replaying a level is always allowed.

**S10. Level play.** A compact 3D scene (office floor, beach, market, pitch...). Only: a top strip (level name, task dots, points), a glowing marker in the world, one instruction line, and the on-screen controls for that task. Tasks are short 3D actions: carry, run to, cook, serve, kick, type-and-time, balance, drive. Finish a task: +1 point (plus a small performance bonus shown as coins), a brief reaction from the characters, next marker.

**S11. Level result.** Points, stars (1 to 3 by performance), a one-line story beat, and the next level unlocking animation. Buttons: **Next level**, **Replay**, **Chapters**.

**S12. Chapter complete.** Big celebration (the new confetti and ribbon already built), chapter total, rank change, the next chapter unlocking (or a paywall card for paid chapters).

**S13. Leaderboard.** Tabs: **Friends**, **Local** (this device/country), **Global**. Your row is pinned. Shows points, not coins. Weekly and all-time toggle.

**S14. Profile.** Display name and avatar (once the new character style is ready), total points, chapters done, badges. **Sign in with Google / Apple** card: "Link your progress and earn +500 bonus points". Optional.

**S15. Unlock a chapter (later).** One tap sheet: chapter art, what is in it, one price, Apple Pay / Google Pay / Paystack button, no card typing, "Yours forever".

**S16. Settings.** Sound, music, vibration, language, how to play, privacy, delete my data.

## Scoring rules (simple)
- 1 point per completed task. A level's tasks add up; performance adds **coins** (not points) so the leaderboard stays fair and easy to understand.
- Run: points for distance/score tiers and a win bonus vs a real player; a smaller one vs Alfred. Daily cap so bots cannot farm.
- Sign-in bonus and first-time chapter completions add one-off points.

## The chapter map (10 at launch, each a role for a day)
1. **The Job: Day One** (office, promotion race against Phil), template chapter, designed below
2. **Trial Day** (footballer)
3. **Market Day** (trader: stall, customers, haggling, closing)
4. **Kitchen Rush** (restaurant cook and server)
5. **Beach Weekend** (lifeguard / beach-resort host)
6. **Move-Out Day** (renting, packing, landlord, first flat)
7. **Campus Life** (student: lectures, exam week, group project)
8. **Hospital Shift** (nurse/porter on a busy ward)
9. **Road Trip** (driver, travel, directions, a breakdown)
10. **Family Weekend** (parent: school run, shopping, party, bedtime)
Later paid chapters: more roles and places (airport, farm, studio, other countries).

## Chapter 1 in full: "The Job: Day One"
You are the new hire at a busy company. **Phil** is a friendly but ambitious co-worker who wants the same promotion. By the end of the day the boss picks who gets the Junior Team Lead role, based on your points. Time on screen: about 90 minutes in 9 levels (about 10 min each).

| Level | Scene | Tasks (3D, 1 point each) | Story beat |
|---|---|---|---|
| 1. Getting there | Street and bus stop | Wake and pack the bag, catch the bus, run to beat the gate closing | You nearly miss it. Phil waves from the lobby |
| 2. Reception | Lobby | Sign in, pick up your ID badge, find your desk | Meet the boss, Ms Adeyemi |
| 3. Learn the ropes | Open office | Set up your computer, file 5 documents, answer the phone | First small win. Phil shows you the coffee machine |
| 4. The first mistake | Office | Fix a wrong order, apologise, redo it faster | Phil quietly helps, or does not. Trust is tested |
| 5. Lunch run | Street food stall | Queue and order for 4 people, carry, do not drop, back in time | Team bonding. Phil's secret |
| 6. Crunch | Office | Deadline: sort, print, deliver in a race against the clock | Fire alarm of work stress, boss notices |
| 7. The client | Meeting room | Set up the room, serve drinks, present the slide | Big moment. Phil stumbles or you do |
| 8. After hours | Office and car park | Help a colleague, lock up, carry the boxes | Quiet kindness is seen |
| 9. Promotion | Boss's office | Final timed challenge, score vs Phil's, boss decides | Promotion cinematic, payslip, chapter complete |

Each level ends with the short Phil moment so the story pulls the player forward. Chapter 2 unlocks on completion.

## How it maps to the current code (what to keep and what to drop)
**Keep and reuse**
- The runner: sim, renderer, race, Alfred, level banners (`src/minigames/go-slow-dash/*`, `src/ui/screens/Dash.tsx`, `src/platform/match.ts`).
- Audio, voice, install (PWA), analytics SDK and the admin console, confetti and ribbon, design system (`src/ui/components.tsx`).
- 3D tools: `buildHuman` and `exercisePose` (`src/world/characters.ts`), the scene batching and critters, and the animation helpers. The character art will be reskinned once references arrive.
- Pieces of existing tasks as starting points (cook, serve, shop, gym, match, wash, ride). They currently need `WorldRenderer`; each becomes a small standalone `Task` with an `onDone(perf)` contract.

**Retire**
- The open map, clock, age, housing, relocation, the year-end summary, dreams, the pay-per-minute token meter and paywall (conflicts with one-time purchases).

**New**
- Screens S0 to S16 and a lightweight router (the `Screen` type in `src/store.ts`).
- A chapter/level/task data format, a `TaskRunner`, and a small `SceneKit` that builds one 3D scene per level.
- Progress save per task (extend `src/platform/storage.ts` and `MetaProfile`).

## Back end (needed for global rank, online runs, purchases)
Today there is only the admin analytics app (Vercel functions + Postgres/Supabase). There is no leaderboard, matchmaking or realtime. Recommended:
- **Leaderboard and anonymous player id**: add tables and endpoints to the existing admin project (device id first, later linked to Google/Apple via Supabase Auth). Scores are validated server-side by replaying the runner seed and inputs, which the deterministic sim allows.
- **Online race and invites**: Supabase Realtime (or PartyKit, as in `docs/PRD-multiplayer.md`) for presence, matchmaking and the incoming-challenge notification. Web push for when the app is backgrounded.
- **Purchases**: server-side entitlements per chapter; Apple/Google in-app purchases in store builds, Paystack (or similar) on the web with wallet buttons so players never type a card.

## Build order (once approved)
1. Foundations: new screens and router, chapter/level/task schema, progress save, home with the two cards and the standalone runner (no life needed).
2. Runner as a headline game: lobby, matchmaking (Alfred fallback first), result, leaderboard (local first).
3. Chapter 1 vertical slice: scene kit, 9 levels, tasks, Phil, results, chapter complete, unlock of chapter 2.
4. Global leaderboard, anonymous ids, Google/Apple link with bonus points.
5. Real online matchmaking and challenge notifications.
6. Chapters 2 to 10, one by one, then paid unlock and purchases.
7. Retire the old open world and token system, clean up.

## Verification (for each phase)
- Unit tests on the chapter/level/score logic and the leaderboard validation, extending the existing vitest suite.
- Headless-browser runs and screenshots of every screen at phone size, as done for the current game.
- A scripted "full chapter" run to check that every task can be completed and the next chapter unlocks.
- A real-phone check by you for feel and sound, before each release, plus a check of 7-day return rate in the admin console.

## Open items I need from you
1. **Character style references** (images or links). The character, avatar and level art screens wait for these.
2. Confirm **Chapter 1 = "The Job: Day One"** with Phil as the rival (this is my recommendation based on your promotion-over-Phil example), or name another.
3. Confirm the **runner name** ("Hustle Run" is a placeholder).
4. Confirm the **10-chapter list** or swap any roles.
5. Backend choice: stay on Supabase + Vercel (recommended, already in the project) or something else.
