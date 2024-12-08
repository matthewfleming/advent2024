/* eslint-disable no-extend-native */
import {Command} from '@oclif/core'
import _ from 'lodash'
import {all, create} from 'mathjs'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

type Point = {
  x: number
  y: number
}
const locations: Record<string, Point[]> = {}

declare global {
  interface Array<T> {
    pairs(): Generator<[T, T], void, unknown>
  }
}

Array.prototype.pairs = function* <T>(): Generator<[T, T], void, unknown> {
  for (let i = 0; i < this.length - 1; i++) {
    for (let j = i; j < this.length - 1; j++) {
      yield [this[i], this[j + 1]]
    }
  }
}

const math = create(all, {number: 'Fraction'})

function addLocation(x: number, y: number, value: string) {
  if (!locations[value]) {
    locations[value] = []
  }

  locations[value].push({x, y})
}

function antiNode(node: Point, a: Point, b: Point, part2 = false) {
  const aDx = a.x - node.x
  const aDy = a.y - node.y
  const bDx = b.x - node.x
  const bDy = b.y - node.y
  const isAligned = math.divide(aDx, aDy) === math.divide(bDx, bDy)

  if (part2) {
    return isAligned || (aDx === 0 && aDy === 0) || (bDx === 0 && bDy === 0)
  }

  // console.log(aDx, aDy, bDx, bDy)
  if (!isAligned) return false

  // console.log('aligned', a, b)

  const aDist = math.sqrt(math.add(math.square(aDx), math.square(aDy)))
  const bDist = math.sqrt(math.add(math.square(bDx), math.square(bDy)))

  return math.equal(aDist, math.multiply(2, bDist)) || math.equal(bDist, math.multiply(2, aDist))
}

function testAntenna(node: Point, antennas: Point[], part2 = false) {
  for (const [a, b] of antennas.pairs()) {
    // console.log('pairs', a, b)
    if (antiNode(node, a, b, part2)) {
      console.log('found', node, a, b)
      return true
    }
  }

  return false
}

export default class Q8 extends Command {
  static args = {}

  static description = 'Q8'

  static examples = [
    `<%= config.bin %> <%= command.id %>
`,
  ]

  static flags = {}

  async run(): Promise<void> {
    const path = 'assets/q8.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    const map = []
    for await (const line of rl) {
      map.push([...line])
    }

    const width = map[0].length
    const height = map.length

    for (const [y, element] of map.entries()) {
      for (const [x, value] of element.entries()) {
        if (value !== '.') {
          addLocation(x, y, value)
        }
      }
    }

    console.log(locations)
    let antiNodesPart1 = 0
    let antiNodesPart2 = 0

    const map2: string[][] = _.cloneDeep(map)

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const node = {x, y}
        for (const [name, antennas] of Object.entries(locations)) {
          if (testAntenna(node, antennas)) {
            console.log('match', name, node)
            antiNodesPart1++
            break
          }
        }
      }
    }

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const node = {x, y}
        for (const [name, antennas] of Object.entries(locations)) {
          if (testAntenna(node, antennas, true)) {
            console.log('match', name, node)
            map2[y][x] = '#'
            antiNodesPart2++
            break
          }
        }
      }
    }

    this.log('Antinodes Part 1:', antiNodesPart1)
    this.log('Antinodes Part 2:', antiNodesPart2)

    this.log(map2.map((line) => line.join('')).join('\n'))
  }
}
