import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

import {Direction, Vector, move, peek} from '../../lib/map.js'

enum Tokens {
  BOX = 'O',
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

    const map: string[][] = []
    const instructions: Direction[] = []

    for await (const line of rl) {
      if (line[0] === '#') {
        map.push([...line])
      } else {
        instructions.push(...(line as unknown as Direction[]))
      }
    }

    const {x, y} = findRobot(map)
    const state: State = {
      map: map.map((row) => row.map((c) => c as Tokens)),
      x,
      y,
    }

    console.log(instructions)
    for (const instruction of instructions) {
      console.log(state.map.map((row) => row.join('')).join('\n'))
      process(instruction, state)
    }

    console.log(state.map.map((row) => row.join('')).join('\n'))
    console.log(gps(state.map))
  }
}

function process(instruction: Direction, state: State) {
  let next
  let current: Vector<Tokens> | undefined = {d: instruction, type: state.map[state.y][state.x], x: state.x, y: state.y}
  const moves: Vector<Tokens>[] = []
  // peek forwards until we find an empty space
  do {
    next = peek(state.map, current.x, current.y, instruction)
    // if wall or end of map we can't move
    if (!next || next.type === Tokens.WALL) {
      return
    }

    moves.push(current)
    current = next
  } while (next.type !== Tokens.EMPTY)

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
    }
  }

  return total
}
