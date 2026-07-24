# @klinecharts/extension

Indicators and overlays for [KLineChart](https://github.com/klinecharts/KLineChart).

The package provides reusable overlay templates without registering them globally. Import only the tools you need, register them with KLineChart, and then create overlays by name.

## Requirements

- KLineChart 10 or later
- A browser environment supported by KLineChart

## Installation

```bash
npm install @klinecharts/extension
```

You can use `pnpm`, `yarn`, or `bun` instead of npm.

## Quick start

Register an overlay before creating it on a chart:

```ts
import { init, registerOverlay } from 'klinecharts'
import { measure } from '@klinecharts/extension'

registerOverlay(measure)

const chart = init('chart')
chart?.createOverlay('measure')
```

Registration is global, so each template normally only needs to be registered once during application startup.

## Importing overlays

All overlays are available as named exports from the package root:

```ts
import { fibonacciSpiral, gannBox, rect } from '@klinecharts/extension'
```

For the smallest and most explicit import, use an overlay subpath. Subpath modules have a default export:

```ts
import { registerOverlay } from 'klinecharts'
import fibonacciSpiral from '@klinecharts/extension/overlays/fibonacciSpiral'

registerOverlay(fibonacciSpiral)
```

You can also register every included overlay:

```ts
import { registerOverlay } from 'klinecharts'
import * as overlays from '@klinecharts/extension/overlays/index'

Object.values(overlays).forEach(registerOverlay)
```

## Available overlays

| Category | Exports |
| --- | --- |
| Basic shapes | `arrow`, `circle`, `parallelogram`, `rect`, `triangle` |
| Price patterns | `abcd`, `xabcd` |
| Wave tools | `anyWaves`, `threeWaves`, `fiveWaves`, `eightWaves` |
| Fibonacci tools | `fibonacciCircle`, `fibonacciExtension`, `fibonacciSegment`, `fibonacciSpeedResistanceFan`, `fibonacciSpiral` |
| Analysis tools | `gannBox`, `measure` |

The export name is also the overlay name passed to `chart.createOverlay`:

```ts
registerOverlay(gannBox)
chart?.createOverlay('gannBox')
```

## Custom measure labels

The `measure` overlay accepts an `extendData` function when it is created. The returned strings are displayed next to the measured area:

```ts
import type { Point } from 'klinecharts'
import { init, registerOverlay } from 'klinecharts'
import { measure } from '@klinecharts/extension'

registerOverlay(measure)

const chart = init('chart')

chart?.createOverlay({
  name: 'measure',
  extendData: (points: Array<Partial<Point>>) => {
    const [start, end] = points
    if (start?.value === undefined || end?.value === undefined) {
      return []
    }

    const change = end.value - start.value
    const percent = start.value === 0 ? 0 : (change / start.value) * 100

    return [`Change: ${change.toFixed(2)}`, `Change: ${percent.toFixed(2)}%`]
  }
})
```

## Development

```bash
bun install
bun run check
bun run build
```

- `bun run check` runs formatting, linting, and TypeScript checks.
- `bun run build` creates ESM, CommonJS, and declaration files in `dist`.

## License

[Apache License 2.0](./LICENSE)
