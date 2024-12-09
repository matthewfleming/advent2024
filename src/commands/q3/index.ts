import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

export default class Q3 extends Command {
  static args = {}

  static description = 'Q3'

  static examples = [`<%= config.bin %> <%= command.id %>`]

  static flags = {}

  async run(): Promise<void> {
    const path = 'assets/q3.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    const input: string[] = []

    for await (const line of rl) {
      input.push(line)
    }

    const regex = /mul\((\d{1,3}),(\d{1,3})\)|do\(\)|don't\(\)/g
    let match

    let on = true

    async function compute(part2 = false) {
      let sum = 0
      for await (const line of input) {
        while ((match = regex.exec(line))) {
          const op = match[0]

          switch (op) {
            case 'do()': {
              if (part2) on = true
              break
            }

            case "don't()": {
              if (part2) on = false
              break
            }

            default: {
              if (on) {
                const a = Number(match[1])
                const b = Number(match[2])

                sum += a * b
              }
            }
          }
        }
      }

      return sum
    }

    // Part 1
    const part1 = await compute()
    this.log(`Part 1: ${part1}`)

    // Part 2
    const part2 = await compute(true)
    this.log(`Part 2: ${part2}`)
  }
}
