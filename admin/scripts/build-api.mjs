// Bundles each serverless function (api-src/*.ts) into one self-contained api/*.js file.
// Vercel's Node loader cannot resolve extensionless imports between files, and the functions also import ../shared;
// a single bundle per function removes both problems. The output is committed so Vercel finds the functions before it builds.
import { build } from 'esbuild'
import { readdirSync } from 'node:fs'

const entries = readdirSync(new URL('../api-src/', import.meta.url)).filter((f) => f.endsWith('.ts')).map((f) => `api-src/${f}`)
await build({
  entryPoints: entries, outdir: 'api', bundle: true, platform: 'node', target: 'node20', format: 'esm', outExtension: { '.js': '.js' },
  external: ['pg-native', '@electric-sql/pglite'], // pglite is only used for local development and tests
  banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  legalComments: 'none', logLevel: 'info',
})
