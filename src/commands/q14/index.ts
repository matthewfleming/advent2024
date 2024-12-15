/* eslint-disable no-constant-condition */
import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

interface Robot {
  vx: number
  vy: number
  x: number
  y: number
}

const robots: Robot[] = []

interface State {
  height: number
  robots: Robot[]
  safety?: {
    factor: number
    quadrants: number[]
  }
  seconds: number
  width: number
}

function travel(state: State, seconds: number) {
  for (const robot of state.robots) {
    const newX = (robot.x + robot.vx * seconds) % state.width
    const newY = (robot.y + robot.vy * seconds) % state.height
    robot.x = newX < 0 ? state.width + newX : newX
    robot.y = newY < 0 ? state.height + newY : newY
  }

  state.seconds += seconds
}

function draw(state: State) {
  console.log(state)
  const map = Array.from({length: state.height}, () => Array.from({length: state.width}, () => '.'))
  for (const robot of robots) {
    const current = map[robot.y][robot.x]
    map[robot.y][robot.x] = current === '.' ? '1' : String(Number(current) + 1)
  }

  console.log(map.map((row) => row.join('')).join('\n'))
}

function safety(state: State) {
  const quadrants = Array.from({length: 4}, () => 0)

  const halfWidth = Math.floor(state.width / 2)
  const halfHeight = Math.floor(state.height / 2)

  for (const robot of state.robots) {
    if (robot.x === halfWidth || robot.y === halfHeight) {
      continue
    }

    const quadrant = (robot.x < halfWidth ? 0 : 1) + (robot.y < halfHeight ? 0 : 2)
    quadrants[quadrant]++
  }

  state.safety = {
    factor: quadrants.reduce((acc, q) => acc * q, 1),
    quadrants,
  }
}

function singular(state: State) {
  const places = new Set<string>()
  for (const robot of state.robots) {
    if (places.has(`${robot.x},${robot.y}`)) {
      return false
    }

    places.add(`${robot.x},${robot.y}`)
  }

  return true
}

export default class Q14 extends Command {
  static args = {}

  static description = 'Q14'

  static examples = [
    `<%= config.bin %> <%= command.id %>
`,
  ]

  static flags = {}

  async run(): Promise<void> {
    const path = 'assets/q14.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    for await (const line of rl) {
      const match = line.match(/p=(-?\d+),(-?\d+) v=(-?\d+),(-?\d+)/)
      if (match) {
        robots.push({
          vx: Number.parseInt(match[3], 10),
          vy: Number.parseInt(match[4], 10),
          x: Number.parseInt(match[1], 10),
          y: Number.parseInt(match[2], 10),
        })
      }
    }

    const maxX = Math.max(...robots.map((r) => r.x))
    const maxY = Math.max(...robots.map((r) => r.y))

    const state = {
      height: maxY + 1,
      robots,
      seconds: 0,
      width: maxX + 1,
    }

    draw(state)
    travel(state, 100)
    safety(state)
    while (true) {
      travel(state, 1)
      if (singular(state)) {
        draw(state)
        console.log(state)
        break
      }
    }
  }
}
