import { rm } from 'node:fs/promises'
import { type BuildConfig, build, Glob, write } from 'bun'

const outdir = 'dist'
const publicEntries = [
  { name: 'volume', path: 'indicators/volume' },
  { name: 'abcd', path: 'overlays/abcd' },
  { name: 'anyWaves', path: 'overlays/anyWaves' },
  { name: 'arrow', path: 'overlays/arrow' },
  { name: 'circle', path: 'overlays/circle' },
  { name: 'eightWaves', path: 'overlays/eightWaves' },
  { name: 'fibonacciCircle', path: 'overlays/fibonacciCircle' },
  { name: 'fibonacciExtension', path: 'overlays/fibonacciExtension' },
  { name: 'fibonacciSegment', path: 'overlays/fibonacciSegment' },
  { name: 'fibonacciSpeedResistanceFan', path: 'overlays/fibonacciSpeedResistanceFan' },
  { name: 'fibonacciSpiral', path: 'overlays/fibonacciSpiral' },
  { name: 'fiveWaves', path: 'overlays/fiveWaves' },
  { name: 'gannBox', path: 'overlays/gannBox' },
  { name: 'measure', path: 'overlays/measure' },
  { name: 'parallelogram', path: 'overlays/parallelogram' },
  { name: 'rect', path: 'overlays/rect' },
  { name: 'threeWaves', path: 'overlays/threeWaves' },
  { name: 'triangle', path: 'overlays/triangle' },
  { name: 'xabcd', path: 'overlays/xabcd' }
] as const
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
  write(`${outdir}/index.js`, `${publicEntries.map(({ name, path }) => `export { default as ${name} } from './${path}.js'`).join('\n')}\n`),
  write(`${outdir}/index.cjs`, `'use strict'\n\nmodule.exports = {\n${publicEntries.map(({ name, path }) => `  ${name}: require('./${path}.cjs').default`).join(',\n')}\n}\n`)
])
