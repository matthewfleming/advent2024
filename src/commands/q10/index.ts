/* eslint-disable no-constant-condition */
/* eslint-disable perfectionist/sort-union-types */
import {Command} from '@oclif/core'
import _ from 'lodash'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

enum Tokens {
  down = 'v',
  left = '<',
  peak = '!',
  retreat = 'x',
  right = '>',
  up = '^',
}

interface Position {
  d: Tokens.up | Tokens.left | Tokens.right | Tokens.down | Tokens.retreat
  elevation: number
  x: number
  y: number
}

function travel(x: number, y: number, d: Tokens.up | Tokens.left | Tokens.right | Tokens.down): {x: number; y: number} {
  switch (d) {
    case Tokens.up: {
      return {x, y: y - 1}
    }

    case Tokens.down: {
      return {x, y: y + 1}
    }

    case Tokens.left: {
      return {x: x - 1, y}
    }

    case Tokens.right: {
      return {x: x + 1, y}
    }
  }
}

function turn(
  d: Tokens.up | Tokens.left | Tokens.right | Tokens.down | Tokens.right,
): Tokens.up | Tokens.left | Tokens.retreat | Tokens.down {
  switch (d) {
    case Tokens.up: {
      return Tokens.retreat
    }

    case Tokens.down: {
      return Tokens.left
    }

    case Tokens.left: {
      return Tokens.up
    }

    case Tokens.right: {
      return Tokens.down
    }
  }
}

function explore(x: number, y: number, map: number[][]) {
  function peek(nx: number, ny: number): number {
    if (nx < 0 || ny < 0 || nx >= map[0].length || ny >= map.length) {
      return -1
    }

    return map[ny][nx]
  }

  function retreat(path: Position[]): Position {
    let last
    let d
    do {
      last = path.pop()
      console.log('Retreating:', last)

      if (!last) {
        throw new Error('Cannot retreat')
      }

      if (last.d === Tokens.retreat) {
        throw new Error('Invalid state')
      }

      d = turn(last.d)
    } while (d === Tokens.retreat && path.length > 0)

    return {...last, d}
  }

  let state: Position = {
    d: Tokens.right,
    elevation: map[y][x],
    x,
    y,
  }
  const trails: Position[][] = []
  const peaks = new Set<string>()
  const path: Position[] = []

  if (state.elevation !== 0) {
    throw new Error('Invalid starting position')
  }

  while (true) {
    // Exit condition, retreat to the previous position or exit
    if (state.d === Tokens.retreat) {
      if (state.elevation === 0) {
        break
      }

      state = retreat(path)
      if (state.d === Tokens.retreat) {
        break
      }
    }

    // peek at the next position
    const next = travel(state.x, state.y, state.d)
    const nextValue = peek(next.x, next.y)

    if (nextValue === state.elevation + 1) {
      // Found a step
      console.log('Found step:', state)
      path.push({...state})

      if (nextValue === 9) {
        // Found a peak
        console.log('Found peak:', nextValue, next.x, next.y)
        peaks.add(JSON.stringify({d: Tokens.peak, x: next.x, y: next.y}))
        trails.push(_.cloneDeep(path))
        state = retreat(path)
      } else {
        // Move to the next position
        // Start search again from the right
        state = {
          d: (state.d = Tokens.right),
          elevation: nextValue,
          x: next.x,
          y: next.y,
        }
      }
    } else {
      // Try the next direction
      state.d = turn(state.d)
    }
  }

  console.log('Found trails:', trails)
  console.log('Found peaks:', peaks)

  return {
    rating: trails.length,
    score: peaks.size,
  }
}

export default class Q10 extends Command {
  static args = {}

  static description = 'Q10'

  static examples = [
    `<%= config.bin %> <%= command.id %>
`,
  ]

  static flags = {}

  async run(): Promise<void> {
    const path = 'assets/q10.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    const map: number[][] = []
    for await (const line of rl) {
      map.push([...line].map((value) => Number.parseInt(value, 10)))
    }

    let score = 0
    let rating = 0
    for (const [y, row] of map.entries()) {
      for (const [x, value] of row.entries()) {
        if (value === 0) {
          const result = explore(x, y, map)
          score += result.score
          rating += result.rating
        }
      }
    }

    this.log('Score:', score)
    this.log('Rating:', rating)
  }
}
