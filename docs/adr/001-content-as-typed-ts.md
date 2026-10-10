# ADR 001: Content authored as typed TypeScript modules (not YAML)

**Status:** accepted (deviation from PRD 6.2 authoring format)

The PRD suggests YAML/JSON content validated by Zod. For M1 we author content as typed TypeScript data modules in `src/content`:
- no extra parser dependency, full type checking and editor autocomplete for AI agents and humans;
- the same Zod schemas (`src/content/schemas.ts`) still validate every definition in `npm run content:lint` and in tests;
- the shape is plain JSON-serialisable data, so a later move to YAML/JSON files or a CMS is mechanical.
