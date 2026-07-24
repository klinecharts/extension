import { init, type KLineData, type OverlayTemplate, registerOverlay } from 'klinecharts'

import * as overlays from '../src/overlays/index'

type Tool = {
  name: keyof typeof overlays
  label: string
  symbol: string
  points: number | 'any'
}

type ToolGroup = {
  title: string
  tools: Tool[]
}

const toolGroups: ToolGroup[] = [
  {
    title: 'Basic shapes',
    tools: [
      { name: 'arrow', label: 'Arrow', symbol: '↗', points: 2 },
      { name: 'circle', label: 'Circle', symbol: '○', points: 2 },
      { name: 'parallelogram', label: 'Parallel', symbol: '▱', points: 3 },
      { name: 'rect', label: 'Rectangle', symbol: '□', points: 2 },
      { name: 'triangle', label: 'Triangle', symbol: '△', points: 3 }
    ]
  },
  {
    title: 'Patterns',
    tools: [
      { name: 'abcd', label: 'ABCD', symbol: 'M', points: 4 },
      { name: 'xabcd', label: 'XABCD', symbol: 'W', points: 5 }
    ]
  },
  {
    title: 'Waves',
    tools: [
      { name: 'anyWaves', label: 'Any waves', symbol: '⌁', points: 'any' },
      { name: 'threeWaves', label: '3 waves', symbol: '3', points: 4 },
      { name: 'fiveWaves', label: '5 waves', symbol: '5', points: 6 },
      { name: 'eightWaves', label: '8 waves', symbol: '8', points: 9 }
    ]
  },
  {
    title: 'Fibonacci',
    tools: [
      { name: 'fibonacciCircle', label: 'Circle', symbol: '◎', points: 2 },
      { name: 'fibonacciExtension', label: 'Extension', symbol: 'F↗', points: 3 },
      { name: 'fibonacciSegment', label: 'Segment', symbol: 'F≡', points: 2 },
      { name: 'fibonacciSpeedResistanceFan', label: 'Speed fan', symbol: 'F⌁', points: 2 },
      { name: 'fibonacciSpiral', label: 'Spiral', symbol: 'F◉', points: 2 }
    ]
  },
  {
    title: 'Analysis',
    tools: [
      { name: 'gannBox', label: 'Gann box', symbol: 'G', points: 2 },
      { name: 'measure', label: 'Measure', symbol: '↔', points: 2 }
    ]
  }
]

function getRequiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector)
  if (!element) {
    throw new Error(`The debug page is missing ${selector}`)
  }
  return element
}

const chartElement = getRequiredElement<HTMLElement>('#chart')
const toolGroupsElement = getRequiredElement<HTMLElement>('#tool-groups')
const toolCountElement = getRequiredElement<HTMLElement>('#tool-count')
const statusCard = getRequiredElement<HTMLElement>('#status-card')
const statusTitle = getRequiredElement<HTMLElement>('#status-title')
const statusDetail = getRequiredElement<HTMLElement>('#status-detail')
const clearButton = getRequiredElement<HTMLButtonElement>('#clear-overlays')
const resetButton = getRequiredElement<HTMLButtonElement>('#reset-view')
const themeButton = getRequiredElement<HTMLButtonElement>('#theme-toggle')

const overlayTemplates: Record<string, OverlayTemplate> = overlays
for (const template of Object.values(overlayTemplates)) {
  registerOverlay(template)
}

function createChart(): NonNullable<ReturnType<typeof init>> {
  const chart = init(chartElement)
  if (!chart) {
    throw new Error('Unable to initialize KLineChart')
  }
  return chart
}

const chart = createChart()

let activeTool: string | null = null
let activeOverlayId: string | null = null
let darkTheme = true

function createDemoData(count: number): KLineData[] {
  const data: KLineData[] = []
  const day = 24 * 60 * 60 * 1000
  const lastTimestamp = Math.floor(Date.now() / day) * day
  let randomState = 29
  let previousClose = 126.5

  const random = (): number => {
    randomState = (randomState * 48271) % 2147483647
    return randomState / 2147483647
  }

  for (let index = 0; index < count; index += 1) {
    const cycle = Math.sin(index / 13) * 1.15 + Math.sin(index / 37) * 0.7
    const open = previousClose + (random() - 0.5) * 1.25
    const close = open + (random() - 0.46) * 2.8 + cycle * 0.22
    const high = Math.max(open, close) + random() * 1.6 + 0.15
    const low = Math.min(open, close) - random() * 1.6 - 0.15

    data.push({
      timestamp: lastTimestamp - (count - index - 1) * day,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.round(18_000 + random() * 72_000)
    })
    previousClose = close
  }

  return data
}

const demoData = createDemoData(260)

chart.setDataLoader({
  getBars: ({ type, callback }) => {
    callback(type === 'init' ? demoData : [], false)
  }
})
chart.setSymbol({ ticker: 'KLINEUSD', pricePrecision: 2, volumePrecision: 0 })
chart.setPeriod({ type: 'day', span: 1 })
chart.setStyles('dark')

function setStatus(title: string, detail: string, drawing = false): void {
  statusTitle.textContent = title
  statusDetail.textContent = detail
  statusCard.classList.toggle('drawing', drawing)
}

function clearActiveTool(): void {
  activeTool = null
  for (const button of document.querySelectorAll<HTMLButtonElement>('.tool-button.active')) {
    button.classList.remove('active')
  }
}

function selectTool(tool: Tool, button: HTMLButtonElement): void {
  if (activeOverlayId) {
    chart.removeOverlay({ id: activeOverlayId })
    activeOverlayId = null
  }
  clearActiveTool()
  activeTool = tool.name
  button.classList.add('active')

  const pointsText = tool.points === 'any' ? 'Click points · double-click to finish' : `Place ${tool.points} points on the chart`
  setStatus(`Drawing ${tool.label}`, pointsText, true)

  const create =
    tool.name === 'measure'
      ? {
          name: tool.name,
          extendData: (points: Array<{ value?: number }>): string[] => {
            const [start, end] = points
            if (start?.value === undefined || end?.value === undefined) {
              return []
            }
            const change = end.value - start.value
            const percent = start.value === 0 ? 0 : (change / start.value) * 100
            return [`Δ ${change.toFixed(2)}`, `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`]
          },
          onDrawEnd: () => {
            activeOverlayId = null
            clearActiveTool()
            setStatus('Overlay added', `${tool.label} is ready to inspect`)
          }
        }
      : {
          name: tool.name,
          onDrawEnd: () => {
            activeOverlayId = null
            clearActiveTool()
            setStatus('Overlay added', `${tool.label} is ready to inspect`)
          }
        }

  const overlayId = chart.createOverlay(create)
  if (typeof overlayId === 'string') {
    activeOverlayId = overlayId
  } else {
    clearActiveTool()
    setStatus('Unable to draw', `${tool.label} could not be created`)
  }
}

for (const group of toolGroups) {
  const groupElement = document.createElement('section')
  groupElement.className = 'tool-group'

  const heading = document.createElement('h3')
  heading.textContent = group.title
  groupElement.append(heading)

  const list = document.createElement('div')
  list.className = 'tool-list'

  for (const tool of group.tools) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'tool-button'
    button.dataset.overlay = tool.name
    button.title = `Draw ${tool.label}`
    button.innerHTML = `<span class="tool-symbol" aria-hidden="true">${tool.symbol}</span><span class="tool-label">${tool.label}</span>`
    button.addEventListener('click', () => selectTool(tool, button))
    list.append(button)
  }

  groupElement.append(list)
  toolGroupsElement.append(groupElement)
}

const toolCount = toolGroups.reduce((count, group) => count + group.tools.length, 0)
toolCountElement.textContent = `${toolCount} tools`

clearButton.addEventListener('click', () => {
  chart.removeOverlay()
  activeOverlayId = null
  clearActiveTool()
  setStatus('Canvas cleared', 'Choose another overlay to continue')
})

resetButton.addEventListener('click', () => {
  chart.scrollToRealTime(220)
  setStatus('Latest candles', 'The chart returned to real time')
})

themeButton.addEventListener('click', () => {
  darkTheme = !darkTheme
  const theme = darkTheme ? 'dark' : 'light'
  document.documentElement.dataset.theme = theme
  chart.setStyles(theme)
  themeButton.setAttribute('aria-label', `Switch to ${darkTheme ? 'light' : 'dark'} theme`)
  setStatus(`${darkTheme ? 'Dark' : 'Light'} theme`, 'Chart and controls updated')
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && activeOverlayId) {
    chart.removeOverlay({ id: activeOverlayId })
    activeOverlayId = null
    clearActiveTool()
    setStatus('Drawing cancelled', 'Choose an overlay to start again')
  }
})

window.addEventListener('resize', () => chart.resize())
