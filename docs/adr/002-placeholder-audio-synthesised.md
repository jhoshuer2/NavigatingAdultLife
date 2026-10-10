# ADR 002: Placeholder music is synthesised at runtime

**Status:** accepted

The owner approved placeholder music/art (PRD Q7/Q9). To avoid licensing risk and keep the bundle tiny, placeholder music and SFX are generated with the Web Audio API (`src/platform/audio.ts`). Real files can replace them by listing them in `src/assets/manifest.ts` (id -> URL); when a manifest entry exists the file is played instead of the synth. No code changes are needed to swap assets.
