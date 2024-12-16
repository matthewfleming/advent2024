import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

interface Region {
  internalRegions?: RegionList
  plots: Map<string, Plot>
  type: string
}

const classes = ['island', 'internal-corner', 'corner', 'edge', 'internal-end', 'end', 'middle', 'neck'] as const

interface Node {
  id: string
  type: string
  x: number
  y: number
}
interface Plot extends Node {
  class?: (typeof classes)[number]
}

type RegionList = Region[]
type BaseMap = string[][]

enum Direction {
  up,
  down,
  left,
  right,
}

const regions: RegionList = []
const map: BaseMap = []

// Find the number of edges on the outside of a region by counting the number of corners
function outerEdges(region: Region) {
  let corners = 0
  for (const plot of region.plots.values()) {
    if (plot.class === 'island') return 4
    if (plot.class === 'end') corners += 2
    if (plot.class === 'corner') corners += 1
  }

  return 2 * corners - 4
}

function border(region: Region, width: number, height: number) {
  for (const plot of region.plots.values()) {
    if (plot.x === 0 || plot.x === width - 1 || plot.y === 0 || plot.y === height - 1) {
      return true
    }
  }

  return false
}

function analyse(region: Region) {
  let edges = 0

  const {height, map, region: reframed, width} = reframe(region)

  let node: Plot | undefined

  const internal = []
  while ((node = next(map, '*', [region.type]))) {
    const antiregion = {plots: flood(map, node, '*'), type: '.'}
    if (!border(antiregion, width, height)) {
      classify(antiregion)
      edges += outerEdges(antiregion)
      internal.push(antiregion)
    }
  }

  if (internal.length > 0) {
    reframed.internalRegions = internal
  }

  draw(reframed)
  const {area, perimeter} = classify(reframed)
  edges += outerEdges(reframed)

  return {area, edges, perimeter}
}

function mapUnion<T>(...maps: Map<string, T>[]): Map<string, T> {
  const map = new Map<string, T>()
  for (const iterable of maps) {
    for (const item of iterable) {
      map.set(...item)
    }
  }

  return map
}

function classifyNode(countX: number, countY: number, internal: number) {
  switch (countX + countY) {
    case 0: {
      return 'island'
    }

    case 1: {
      return internal === 3 ? 'internal-end' : internal ? 'corner' : 'end'
    }

    case 2: {
      if (countX === 2 || countY === 2) {
        return 'neck'
      }

      return internal ? 'internal-corner' : 'corner'
    }

    case 3: {
      return 'edge'
    }

    case 4: {
      return 'middle'
    }
  }
}

function classify(region: Region) {
  let perimeter = 0
  const internalRegions = region.internalRegions
    ? mapUnion(...region.internalRegions.map((region) => region.plots))
    : new Map<string, Plot>()

  for (const plot of region.plots.values()) {
    let internal = 0
    const xNeighbours = [`${plot.x - 1},${plot.y}`, `${plot.x + 1},${plot.y}`]
    const yNeighbours = [`${plot.x},${plot.y - 1}`, `${plot.x},${plot.y + 1}`]
    let countX = 0
    let countY = 0
    for (const neighbour of xNeighbours) {
      if (region.plots.has(neighbour)) {
        countX++
      }

      if (internalRegions.has(neighbour)) {
        internal++
      }
    }

    for (const neighbour of yNeighbours) {
      if (region.plots.has(neighbour)) {
        countY++
      }

      if (internalRegions.has(neighbour)) {
        internal++
      }
    }

    const count = countX + countY
    perimeter += 4 - count

    plot.class = classifyNode(countX, countY, internal)
  }

  return {
    area: region.plots.size,
    perimeter,
  }
}

function draw(region: Region) {
  const {height, minX, minY, width} = boundingBox(region)

  const map: string[][] = Array.from({length: height}).map(() => Array.from({length: width}, () => '.'))

  for (const plot of region.plots.values()) {
    map[plot.y - minY][plot.x - minX] = plot.type
  }

  for (const internal of region.internalRegions || []) {
    for (const plot of internal.plots.values()) {
      map[plot.y - minY][plot.x - minX] = '+'
    }
  }

  console.log(map.map((v) => v.join('')).join('\n'))
}

function boundingBox(region: Region) {
  const minX = Math.min(...[...region.plots.values()].map((v) => v.x))
  const minY = Math.min(...[...region.plots.values()].map((v) => v.y))
  const maxX = Math.max(...[...region.plots.values()].map((v) => v.x))
  const maxY = Math.max(...[...region.plots.values()].map((v) => v.y))

  const width = maxX - minX + 1
  const height = maxY - minY + 1

  return {height, maxX, maxY, minX, minY, width}
}

function reframe(region: Region): {height: number; map: string[][]; region: Region; width: number} {
  const {height, minX, minY, width} = boundingBox(region)
  const plots = new Map<string, Plot>()
  const map: string[][] = Array.from({length: height}).map(() => Array.from({length: width}, () => '.'))

  for (const plot of region.plots.values()) {
    map[plot.y - minY][plot.x - minX] = plot.type
    plots.set(createId(plot.x - minX, plot.y - minY), {...plot, x: plot.x - minX, y: plot.y - minY})
  }

  return {height, map, region: {plots, type: region.type}, width}
}

function createId(x: number, y: number) {
  return `${x},${y}`
}

function peek(map: string[][], x: number, y: number, d: Direction): {type: string; x: number; y: number} | undefined {
  let nx = x
  let ny = y
  switch (d) {
    case Direction.up: {
      if (y <= 0) return
      ny = y - 1
      break
    }

    case Direction.down: {
      if (y >= map.length - 1) return
      ny = y + 1
      break
    }

    case Direction.left: {
      if (x <= 0) return
      nx = x - 1
      break
    }

    case Direction.right: {
      if (x >= map[0].length - 1) return
      nx = x + 1
      break
    }
  }

  return {type: map[ny][nx], x: nx, y: ny}
}

function next(map: string[][], mappedValue: string = '.', ignore: string[] = []): Plot | undefined {
  let x = 0
  let y = 0

  ignore.push(mappedValue)
  while (ignore.includes(map[y][x])) {
    x++
    if (x >= map[0].length) {
      x = 0
      y++
      if (y >= map.length) return
    }
  }

  return {id: createId(x, y), type: map[y][x], x, y}
}

function flood<T extends Node>(map: string[][], startNode: T, mappedValue: string = '.'): Map<string, T> {
  const floodMap = new Map<string, T>()
  const found: T[] = [startNode]
  floodMap.set(startNode.id, startNode)
  map[startNode.y][startNode.x] = mappedValue

  while (found.length > 0) {
    const node = found.shift()
    if (!node) throw new Error('Node is undefined')

    for (const d of [Direction.up, Direction.down, Direction.left, Direction.right]) {
      const next = peek(map, node.x, node.y, d as Direction)
      if (next?.type === node.type) {
        const id = createId(next.x, next.y)
        if (!floodMap.has(id)) {
          const nextNode = {id, ...next} as T
          map[next.y][next.x] = mappedValue
          floodMap.set(nextNode.id, nextNode)
          found.push(nextNode)
        }
      }
    }
  }

  return floodMap
}

export default class Q1 extends Command {
  static args = {}

  static description = 'Q1'

  static examples = [
    `<%= config.bin %> <%= command.id %>
`,
  ]

  static flags = {}

  async run(): Promise<void> {
    const path = 'assets/q12.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    for await (const line of rl) {
      map.push([...line])
    }

    let plot: Plot | undefined
    while ((plot = next(map))) {
      const plots = flood(map, plot)
      regions.push({plots, type: plot.type})
    }

    let totalPrice = 0
    let discountPrice = 0
    for (const region of regions) {
      const {area, edges, perimeter} = analyse(region)
      totalPrice += area * perimeter
      discountPrice += area * edges
      console.log({area, edges, perimeter})
    }

    // Part 1 1359028
    console.log('Total Price:     ', totalPrice)
    console.log('Discount Price:  ', discountPrice)

    // console.log(map.map((v) => v.join('')).join('\n'))
  }
}
