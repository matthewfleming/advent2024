import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

import {Direction, Vector, isVertical, move, peek} from '../../lib/map.js'

enum Tokens {
  BOX = 'O',
  BOX_LEFT = '[',
  BOX_RIGHT = ']',
  EMPTY = '.',
  ROBOT = '@',
  WALL = '#',
}

interface State {
  map: Tokens[][]
  x: number
  y: number
}

export default class Q15 extends Command {
  static args = {}

  static description = 'Q15'

  static examples = [
    `<%= config.bin %> <%= command.id %>
`,
  ]

  static flags = {}

  async run(): Promise<void> {
    const path = 'assets/q15.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    const map: Tokens[][] = []
    const map2: Tokens[][] = []

    const instructions: Direction[] = []

    for await (const line of rl) {
      if (line[0] === '#') {
        map.push([...(line as unknown as Tokens[])])
        const line2 = line.replaceAll(/[#.@O]/g, (match) => {
          if (match === 'O') {
            return '[]'
          }

          if (match === '@') {
            return '@.'
          }

          return match + match
        })
        map2.push([...(line2 as unknown as Tokens[])])
      } else {
        instructions.push(...(line as unknown as Direction[]))
      }
    }

    const {x, y} = findRobot(map)
    const state: State = {
      map,
      x,
      y,
    }

    // console.log(instructions)
    // for (const instruction of instructions) {
    console.log(state.map.map((row) => row.join('')).join('\n'))
    //   process(instruction, state)
    // }

    // console.log(state.map.map((row) => row.join('')).join('\n'))
    // console.log(gps(state.map))

    const {x: x2, y: y2} = findRobot(map2)
    const state2: State = {
      map: map2,
      x: x2,
      y: y2,
    }

    for (const instruction of instructions) {
      console.log(state2.map.map((row) => row.join('')).join('\n'))
      process(instruction, state2)
    }

    console.log(state2.map.map((row) => row.join('')).join('\n'))

    console.log(gps(state2.map))
  }
}

function process(instruction: Direction, state: State) {
  let next
  const queue: Vector<Tokens>[] = [{d: instruction, type: state.map[state.y][state.x], x: state.x, y: state.y}]
  const moves: Vector<Tokens>[] = []
  // peek forwards until we find an empty space
  do {
    const current = queue.pop()
    if (!current) {
      throw new Error('No moves')
    }

    next = peek(state.map, current.x, current.y, instruction)
    // if wall or end of map we can't move
    if (!next || next.type === Tokens.WALL) {
      return
    }

    if (isVertical(instruction)) {
      if (next.type === Tokens.BOX_LEFT) {
        const boxRight = {d: instruction, type: Tokens.BOX_RIGHT, x: next.x + 1, y: next.y}
        moves.push(current)
        queue.push(next, boxRight)
        continue
      }

      if (next.type === Tokens.BOX_RIGHT) {
        const boxLeft = {d: instruction, type: Tokens.BOX_LEFT, x: next.x - 1, y: next.y}
        moves.push(current)
        queue.push(next, boxLeft)
        continue
      }
    }

    moves.push(current)
    if (next.type !== Tokens.EMPTY) {
      queue.push(next)
    }
  } while (queue.length > 0)

  moves.sort((a, b) => {
    if (instruction === Direction.up) {
      return b.y - a.y || a.x - b.x
    }

    if (instruction === Direction.left) {
      return a.y - b.y || b.x - a.x
    }

    return a.y - b.y || a.x - b.x
  })

  let current
  while ((current = moves.pop())) {
    const newPosition = move(state.map, current, Tokens.EMPTY)
    if (newPosition && current.type === Tokens.ROBOT) {
      state.x = newPosition.x
      state.y = newPosition.y
    }
  }
}

function findRobot(map: string[][]): {x: number; y: number} {
  for (const [y, element] of map.entries()) {
    for (const [x, element_] of element.entries()) {
      if (element_ === Tokens.ROBOT) {
        return {x, y}
      }
    }
  }

  throw new Error('Robot not found')
}

function gps(map: Tokens[][]) {
  let total = 0
  for (const [y, row] of map.entries()) {
    for (const [x, cell] of row.entries()) {
      if (cell === Tokens.BOX) {
        total += 100 * y + x
      }

      if (cell === Tokens.BOX_LEFT) {
        total += 100 * y + x
        // const dx = Math.min(x, row.length - x - 2)
        // const dy = Math.min(y, map.length - y - 1)
        // total += 100 * dy + dx
      }
    }
  }

  return total
}
