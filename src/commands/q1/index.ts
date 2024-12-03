import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

export default class Q1 extends Command {
  static args = {}

  static description = 'Q1'

  static examples = [
    `<%= config.bin %> <%= command.id %>
`,
  ]

  static flags = {}

  async run(): Promise<void> {
    const path = 'assets/q1.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    const list1: number[] = []
    const list2: number[] = []
    for await (const line of rl) {
      const data = line.split(/\s+/)
      list1.push(Number(data[0]))
      list2.push(Number(data[1]))
    }

    list1.sort()
    list2.sort()

    const dist = list1
      .map((value, index) => Math.abs(value - list2[index]))
      .reduce((previousValue, currentValue) => previousValue + currentValue, 0)

    this.log(`Distance:   ${dist}`)

    const similarity = list1
      .map((value) => list2.filter((value2) => value === value2).length * value)
      .reduce((previousValue, currentValue) => previousValue + currentValue, 0)

    this.log(`Similarity: ${similarity}`)
  }
}
