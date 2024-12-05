import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

function equalsCheck(a: number[], b: number[]) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export default class Q5 extends Command {
  static args = {}

  static description = 'Q5'

  static examples = [`<%= config.bin %> <%= command.id %>`]

  static flags = {}

  async run(): Promise<void> {
    const path = 'assets/q5.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    const updates: number[][] = []
    const rules: [number, number][] = []

    const rulesRegex = /(.*)\|(.*)/

    for await (const line of rl) {
      const match = rulesRegex.exec(line)

      if (match) {
        rules.push([Number(match[1]), Number(match[2])])
      } else if (line.length > 0) {
        updates.push(line.split(',').map(Number))
      }
    }

    function customSort(a: number, b: number): number {
      // Should really precompute these for efficiency but it's a small dataset
      const aValues = rules.filter((rule) => rule[0] === a).flatMap((rule) => rule[1])

      if (aValues.includes(b)) {
        return -1
      }

      const bValues = rules.filter((rule) => rule[0] === b).flatMap((rule) => rule[1])
      if (bValues.includes(a)) {
        return 1
      }

      return 0
    }

    let sumOrdered = 0
    let sumUnordered = 0
    for (const update of updates) {
      try {
        const sorted = [...update].sort(customSort)
        if (equalsCheck(sorted, update)) {
          const middle = Math.floor(update.length / 2)
          sumOrdered += update[middle]
          console.log('Sorted:    ', update, update[middle])
        } else {
          const middle = Math.floor(sorted.length / 2)
          sumUnordered += sorted[middle]
          console.log('Not sorted:', sorted)
        }
      } catch (error) {
        console.error(error)
      }
    }

    this.log('Ordered:', sumOrdered)
    this.log('Unordered:', sumUnordered)
  }
}
