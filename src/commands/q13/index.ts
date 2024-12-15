import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

interface Machine {
  a: {
    x: number
    y: number
  }
  b: {
    x: number
    y: number
  }
  prize: {
    x: number
    y: number
  }
}

function press(machine: Machine, a: number, b: number) {
  const cost = 3 * a + b
  const x = machine.a.x * a + machine.b.x * b
  const y = machine.a.y * a + machine.b.y * b

  return {cost, x, y}
}

function maxPress(machine: Machine) {
  const maxA = Math.min(Math.ceil(machine.prize.x / machine.a.x), Math.ceil(machine.prize.y / machine.a.y))
  const maxB = Math.min(Math.ceil(machine.prize.x / machine.b.x), Math.ceil(machine.prize.y / machine.b.y))

  return {maxA, maxB}
}

function bruteForce(machine: Machine) {
  const {maxA, maxB} = maxPress(machine)
  let best

  for (let i = 0; i <= maxA; i++) {
    for (let j = 0; j <= maxB; j++) {
      const {cost, x, y} = press(machine, i, j)
      if (x === machine.prize.x && y === machine.prize.y) {
        console.log(`A=${i}, B=${j}, Cost=${cost}`)
        if (!best || cost < best.cost) {
          best = {a: i, b: j, cost}
        }
      }
    }
  }

  return best
}

function test(machine: Machine) {
  const {maxA, maxB} = maxPress(machine)
  let best

  let a = maxA
  while (a >= 0) {
    let b = Math.floor(Math.min(machine.prize.x / a / machine.b.x, machine.prize.y / a / machine.b.y))
    while (b <= maxB) {
      const {cost, x, y} = press(machine, a, b)
      if (x === machine.prize.x && y === machine.prize.y) {
        console.log(`A=${a}, B=${b}, Cost=${cost}`)
        if (!best || cost < best.cost) {
          best = {a, b, cost}
        }
      }

      if (x > machine.prize.x || y > machine.prize.y) {
        break
      }

      b++
    }

    a--
  }

  return best
}

export default class Q13 extends Command {
  static args = {}

  static description = 'Q13'

  static examples = [
    `<%= config.bin %> <%= command.id %>
`,
  ]

  static flags = {}

  async run(): Promise<void> {
    const path = 'assets/q13.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    const machines: Machine[] = []
    let a
    let b
    let prize
    for await (const line of rl) {
      const match = line.match(/Button A: X([+-]\d+), Y([+-]\d+)/)
      if (match) {
        a = {
          x: Number.parseInt(match[1], 10),
          y: Number.parseInt(match[2], 10),
        }
        continue
      }

      const matchB = line.match(/Button B: X([+-]\d+), Y([+-]\d+)/)
      if (matchB) {
        b = {
          x: Number.parseInt(matchB[1], 10),
          y: Number.parseInt(matchB[2], 10),
        }
        continue
      }

      const matchPrize = line.match(/Prize: X=(\d+), Y=(\d+)/)
      if (matchPrize) {
        prize = {
          x: Number.parseInt(matchPrize[1], 10),
          y: Number.parseInt(matchPrize[2], 10),
        }
        if (!a || !b) {
          throw new Error('Invalid machine')
        }

        machines.push({a, b, prize})
      }
    }

    let tokens = 0
    let won = 0
    for (const machine of machines) {
      const best = bruteForce(machine)
      // console.log(best)
      if (best) {
        tokens += best.cost
        won++
      }
    }

    console.log(`Part 1`)
    console.log(`Tokens: ${tokens}`)
    console.log(`Won:    ${won}`)
    console.log(`From:   ${machines.length}`)

    tokens = 0
    won = 0
    for (const machine of machines) {
      machine.prize.x += 10_000_000_000_000
      machine.prize.y += 10_000_000_000_000
      const best = test(machine)
      if (best) {
        tokens += best.cost
        won++
      }
    }

    console.log(`Part 2`)
    console.log(`Tokens: ${tokens}`)
    console.log(`Won:    ${won}`)
    console.log(`From:   ${machines.length}`)
  }
}
