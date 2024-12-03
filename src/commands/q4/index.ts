import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

export default class Q4 extends Command {
  static args = {}

  static description = 'Q4'

  static examples = [`<%= config.bin %> <%= command.id %>`]

  static flags = {}

  async run(): Promise<void> {
    const path = 'assets/q4.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    const input = []

    for await (const line of rl) {
      input.push(line)
    }

    const regex = /mul\((\d{1,3}),(\d{1,3})\)|do\(\)|don't\(\)/g
    let match
    let sum = 0
    let on = true
    for await (const line of input) {
      while ((match = regex.exec(line))) {
        const op = match[0]
        if (op === 'do()') {
          on = true
          console.log('on')
        } else if (op === "don't()") {
          console.log('off')
          on = false
        } else if (on) {
          const a = Number(match[1])
          const b = Number(match[2])

          sum += a * b
        }
      }
    }

    this.log(`Sum: ${sum}`)
  }
}
