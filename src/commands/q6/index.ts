/* eslint-disable no-constant-condition */
/* eslint-disable perfectionist/sort-object-types */
/* eslint-disable perfectionist/sort-union-types */
/* eslint-disable perfectionist/sort-objects */
import {Command} from '@oclif/core'
import _ from 'lodash'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

enum Tokens {
  down = 'v',
  exit = '!',
  left = '<',
  obstacle = '#',
  return = '+',
  right = '>',
  travel = 'X',
  travelHorizontal = '-',
  travelVertical = '|',
  up = '^',
}

interface Position {
  d: Tokens.up | Tokens.left | Tokens.right | Tokens.down
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
  d: Tokens.up | Tokens.left | Tokens.right | Tokens.down,
): Tokens.up | Tokens.left | Tokens.right | Tokens.down {
  switch (d) {
    case Tokens.up: {
      return Tokens.right
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

let loops = 0
function explore(position: Position, map: string[][], turns: Position[], looping: boolean): boolean {
  function peek(nx: number, ny: number): Tokens {
    if (nx < 0 || ny < 0 || nx >= map[0].length || ny >= map.length) {
      return Tokens.exit
    }

    return map[ny][nx] as Tokens
  }

  let {x, y, d} = position
  while (x >= 0 && y >= 0 && x < map[0].length && y < map.length) {
    const next = travel(x, y, d)
    const token = peek(next.x, next.y)
    switch (token) {
      case Tokens.exit: {
        x = next.x
        y = next.y
        break
      }

      case Tokens.obstacle: {
        // If we've already been here, we're in a loop
        if (looping && turns.some((t) => t.x === x && t.y === y && t.d === d)) {
          console.log('Looping at', x, y, d)
          return true
        }

        turns.push({x, y, d})
        map[y][x] = Tokens.return
        d = turn(d)
        break
      }

      case Tokens.travelHorizontal:
      case Tokens.travelVertical:
      case Tokens.up:
      case Tokens.down:
      case Tokens.right:
      case Tokens.left: {
        x = next.x
        y = next.y
        map[y][x] = Tokens.return
        break
      }

      default: {
        // First check if adding an obstacle would create a loop
        if (!looping) {
          const mapCopy = _.cloneDeep(map)
          const turnCopy = _.cloneDeep(turns)
          mapCopy[next.y][next.x] = Tokens.obstacle
          if (explore({x, y, d}, mapCopy, turnCopy, true)) {
            loops++
          }
        }

        x = next.x
        y = next.y
        map[y][x] = d === Tokens.up || d === Tokens.down ? Tokens.travelVertical : Tokens.travelHorizontal
        // map[y][x] = d
      }
    }
  }

  console.log('No loop found')
  return false
}

export default class Q6 extends Command {
  static args = {}

  static description = 'Q6'

  static examples = [`<%= config.bin %> <%= command.id %>`]

  static flags = {}

  async run(): Promise<void> {
    const path = 'assets/q6.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    const map: string[][] = []
    const guards: Position[] = []
    const turns: Position[] = []

    let y = 0
    for await (const line of rl) {
      map.push([...line])
      let x = 0
      if ((x = line.search(/[<>^v]/)) !== -1) {
        guards.push({x, y, d: line[x] as Tokens.up | Tokens.left | Tokens.right | Tokens.down})
      }

      y++
    }

    for (const guard of guards) {
      map[guard.y][guard.x] =
        guard.d === Tokens.up || guard.d === Tokens.down ? Tokens.travelVertical : Tokens.travelHorizontal
      explore(guard, map, turns, false)
    }

    const flatMap = map.map((n) => n.join('')).join('\n')
    const visited = flatMap.match(/[+|-]/g)?.length
    console.log(guards)
    console.log(flatMap)

    this.log('Visited:', visited)
    this.log('Loop:', loops)
  }
}
