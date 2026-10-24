# V2 technical notes (what the code can and cannot do for the new design)

Written before the Level 1 prototype, as the spec's section 13 asks.

## Reusable as it is
- Router: a `Screen` union in `src/store.ts`, rendered by conditional blocks in `src/App.tsx` (no URL router). New screens are added to the union and to `App.tsx`.
- UI kit: `src/ui/components.tsx` (`Btn`, `Confetti`, `Ribbon`, `Toasts`, chips), audio and voice (`src/platform/audio.ts`, `voice.ts`), PWA install, analytics SDK (`src/platform/analytics.ts`, consent gated) and the admin console in `admin/`.
- The Rush: pure deterministic sim (`src/minigames/go-slow-dash/sim.ts`), renderer, races and Alfred (`race.ts`), matchmaking stub (`src/platform/match.ts`). The screen `src/ui/screens/Dash.tsx` is coupled to the life sim (city, traits, energy, `finishDash`), so it needs decoupling.
- 3D helpers: `buildHuman`, `animateHuman`, `exercisePose` (`src/world/characters.ts`), collision and paths (`src/world/nav.ts`), the `Batch` geometry merger and text sprites (inside `src/world/WorldRenderer.ts`, to be shared).

## Not reusable without work
- Tasks in `src/ui/tasks/*` take a `WorldRenderer` and run inside the open map; they are not standalone.
- The token paywall (`src/platform/tokens.ts`) conflicts with one-time purchases and will be dropped.
- No leaderboard, accounts with Google/Apple, matchmaking service or realtime exists (only anonymous accounts in `src/platform/account.ts` and the analytics admin app with Postgres). Score validation by seed replay is possible because the runner sim is deterministic.
- Persistence is localStorage (`src/platform/storage.ts`, keys `nal.life.v1`, `nal.meta.v1`).

## Decisions taken for the prototype
Level 1 only, new characters built in code to match the sheets, the player picks Zuri or Navi, the old open world stays but is unreachable from the new Home.
