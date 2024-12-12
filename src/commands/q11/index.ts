import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

/**
 * If the stone is engraved with the number 0, it is replaced by a stone engraved with the number 1.
If the stone is engraved with a number that has an even number of digits, it is replaced by two stones. The left half of the digits are engraved on the new left stone, and the right half of the digits are engraved on the new right stone. (The new numbers don't keep extra leading zeroes: 1000 would become stones 10 and 0.)
If none of the other rules apply, the stone is replaced by a new stone; the old stone's number multiplied by 2024 is engraved on the new stone.
 */

function rules(number: number): number[] {
  if (number === 0) return [1]

  const numberString = number.toString()
  if (numberString.length % 2 === 0) {
    const half = numberString.length / 2
    return [Number(numberString.slice(0, half)), Number(numberString.slice(half))]
  }

  return [number * 2024]
}

const stones: Record<string, number> = {}

function blink(x: number, blinks: number): number {
  const key = `${x}-${blinks}`
  if (stones[key]) return stones[key]

  const next = rules(x)
  if (blinks === 1) {
    stones[key] = next.length
    return next.length
  }

  const recurse = next.reduce((acc, value) => acc + blink(value, blinks - 1), 0)
  stones[key] = recurse
  return recurse
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
    const path = 'assets/q11.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    const list: number[] = []
    for await (const line of rl) {
      const data = line.split(/\s+/)
      list.push(...data.map((value) => Number.parseInt(value, 10)))
    }

    let sum1 = 0
    let sum2 = 0
    for (const number of list) {
      sum1 += blink(number, 25)
      sum2 += blink(number, 75)
    }

    this.log('Stones (Part 1):', sum1)
    this.log('Stones (Part 2):', sum2)
  }
}
