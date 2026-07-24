import { rm } from 'node:fs/promises'
import { type BuildConfig, build, Glob, write } from 'bun'

const outdir = 'dist'
const entrypoints = Array.from(
  new Glob('**/*.ts').scanSync({
    absolute: true,
    cwd: 'src'
  })
).filter((entrypoint) => !entrypoint.endsWith('/src/index.ts'))

await rm(outdir, { force: true, recursive: true })

const sharedConfig = {
  external: ['klinecharts'],
  outdir,
  root: 'src',
  target: 'browser'
} satisfies Omit<BuildConfig, 'entrypoints'>

const results = await Promise.all(
  entrypoints.flatMap((entrypoint) => [
    build({
      ...sharedConfig,
      entrypoints: [entrypoint],
      format: 'esm',
      naming: '[dir]/[name].js'
    }),
    build({
      ...sharedConfig,
      entrypoints: [entrypoint],
      format: 'cjs',
      naming: '[dir]/[name].cjs'
    })
  ])
)

const failedResults = results.filter((result) => !result.success)
if (failedResults.length > 0) {
  for (const result of failedResults) {
    for (const log of result.logs) {
      console.error(log)
    }
  }
  process.exit(1)
}

await Promise.all([
  write(`${outdir}/index.js`, `export { default as volume } from './indicators/volume.js'\nexport { default as measure } from './overlays/measure.js'\n`),
  write(`${outdir}/index.cjs`, `'use strict'\n\nmodule.exports = {\n  volume: require('./indicators/volume.cjs').default,\n  measure: require('./overlays/measure.cjs').default\n}\n`)
])
