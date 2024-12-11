import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

/**
 * If the stone is engraved with the number 0, it is replaced by a stone engraved with the number 1.
If the stone is engraved with a number that has an even number of digits, it is replaced by two stones. The left half of the digits are engraved on the new left stone, and the right half of the digits are engraved on the new right stone. (The new numbers don't keep extra leading zeroes: 1000 would become stones 10 and 0.)
If none of the other rules apply, the stone is replaced by a new stone; the old stone's number multiplied by 2024 is engraved on the new stone.
 */

interface Division {
  level: number
  list: number[]
}

function rules(number: number): number[] {
  if (number === 0) return [1]

  const numberString = number.toString()
  if (numberString.length % 2 === 0) {
    const half = numberString.length / 2
    return [Number(numberString.slice(0, half)), Number(numberString.slice(half))]
  }

  return [number * 2024]
}

function blink(division: Division, blinks: number): Division {
  let result = division
  while (blinks--) {
    result = {
      level: result.level + 1,
      list: result.list.flatMap((number) => rules(number)),
    }
  }

  return result
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

    const list: Division[] = []
    for await (const line of rl) {
      const data = line.split(/\s+/)
      list.push({level: 1, list: data.map((value) => Number.parseInt(value, 10))})
    }

    const blinks = 75
    let sum = 0
    let input
    while ((input = list.pop())) {
      const output: number[] = []

      for (const number of input.list) {
        const result = rules(number)
        output.push(...result)
      }

      if (input.level < blinks) {
        if (output.length > 100) {
          const slice = output.length / 2
          const left = output.slice(0, slice)
          const right = output.slice(slice)
          list.push({level: input.level + 1, list: right}, {level: input.level + 1, list: left})
        } else {
          list.push({level: input.level + 1, list: output})
        }
      } else {
        sum += output.length
      }

      // this.log('Iteration:', output)
    }

    this.log('Stones:', sum)
  }
}
