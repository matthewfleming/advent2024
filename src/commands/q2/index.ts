import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

export default class Q2 extends Command {
  static args = {}

  static description = 'Q2'

  static examples = [`<%= config.bin %> <%= command.id %>`]

  static flags = {}

  static isSafe(list: number[]): boolean {
    const one = list[0]
    const two = list[1]

    if (one === two) {
      return false
    }

    const up = two > one
    let last = one

    for (let i = 1; i < list.length; i++) {
      const current = list[i]

      if (up && current < last) {
        return false
      }

      if (!up && current > last) {
        return false
      }

      const diff = Math.abs(current - last)

      if (diff < 1 || diff > 3) {
        return false
      }

      last = current
    }

    return true
  }

  async run(): Promise<void> {
    const path = 'assets/q2.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    const levels: number[][] = []

    for await (const line of rl) {
      const data = line.split(/\s+/).map(Number)
      levels.push(data)
    }

    // Part 1
    let safe = 0
    let unsafe = 0

    for (const list of levels) {
      const safety = Q2.isSafe(list)
      console.log({list, safety})
      safety ? safe++ : unsafe++
    }

    this.log(`Safe:   ${safe}`)
    this.log(`Unsafe: ${unsafe}`)

    // Part 2
    safe = 0
    unsafe = 0
    for (const list of levels) {
      let safety
      let current = list
      let i = 0
      do {
        safety = Q2.isSafe(current)
        if (!safety) {
          // brute force all solutions ftw
          current = [...list]
          current.splice(i, 1)
          i++
        }
      } while (!safety && i <= list.length)

      i && console.log({current, list, safety})
      safety ? safe++ : unsafe++
    }

    this.log(`Safe (damped):   ${safe}`)
    this.log(`Unsafe (damped): ${unsafe}`)
  }
}
