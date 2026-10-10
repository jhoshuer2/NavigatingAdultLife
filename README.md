# Navigating Adult Life

A funny, replayable life simulator where you grow up Nigerian: school, hustle, love, family and legacy, from age 6 to old age. Mobile-first browser game (installable PWA). Starts in Lagos.

**Status:** Milestone 1 (playable life simulation) is implemented. See [`docs/PRD.md`](docs/PRD.md) for the full product requirements and [`docs/STATUS.md`](docs/STATUS.md) for what is done against the M1 acceptance criteria.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit, property and bot-simulation tests
npm run sim -- 200   # balance simulator: 200 bot lives per strategy
npm run build        # production build to dist/
```

Useful URL flags: `?unlimited=1` (disable the playtime meter for testing), `?debug=1` (exposes `window.__nal.jump(age)` for e2e).

End-to-end screenshots/flows use headless Chromium (`CHROME=<headless_shell path> npm run e2e` after `npm run build && npx vite preview --port 4173`).

## Architecture

| Path | What |
|---|---|
| `src/engine` | Pure TypeScript simulation. No DOM/React/Three.js. Deterministic (seeded RNG), serialisable state. Public API in `src/engine/api.ts`. |
| `src/content` | Data only: events, jobs, traits, quests, achievements, quiz bank, names. Add content here, not code. |
| `src/minigames/go-slow-dash` | Pure runner simulation (`sim.ts`) + Three.js renderer (`renderer.ts`). Lazy-loaded. |
| `src/ui` | React screens, modals, avatar and scene art (SVG, procedural). |
| `src/platform` | Saves, meta profile, playtime tokens, audio (synthesised placeholders), share card, feedback. |
| `docs/adr` | Architecture decisions. |

Placeholders: music and art are procedural/synthesised. To replace them, add files to `src/assets/manifest.ts` (no code changes needed).

## Adding an event

Add an `ev({...})` entry in `src/content/events/*.ts` using the helpers in `dsl.ts`. Tests check ids, choices, string lengths and soft-locks. Mark culturally uncertain content for owner review and use the in-game 🚩 button during playtests.
