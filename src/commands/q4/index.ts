/* eslint-disable unicorn/no-console-spaces */
/* eslint-disable unicorn/no-for-loop */
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

    const lines: string[] = []

    for await (const line of rl) {
      lines.push(line)
    }

    // const limitX = lines[0].length
    const limitY = lines.length

    const word = 'XMAS'
    let count = 0

    function findUpRight(x: number, y: number, word: string) {
      for (let i = 0; i < word.length; i++) {
        if (y - i < 0) {
          return false
        }

        if (lines[y - i][x + i] !== word[i]) {
          return false
        }
      }

      return true
    }

    function findRight(x: number, y: number, word: string) {
      for (let i = 0; i < word.length; i++) {
        if (lines[y][x + i] !== word[i]) {
          return false
        }
      }

      return true
    }

    function findDownRight(x: number, y: number, word: string) {
      for (let i = 0; i < word.length; i++) {
        if (y + i >= limitY) {
          return false
        }

        if (lines[y + i][x + i] !== word[i]) {
          return false
        }
      }

      return true
    }

    function findDown(x: number, y: number, word: string) {
      for (let i = 0; i < word.length; i++) {
        if (y + i >= limitY) {
          return false
        }

        if (lines[y + i][x] !== word[i]) {
          return false
        }
      }

      return true
    }

    for (let y = 0; y < limitY; y++) {
      let x = 0
      while ((x = lines[y].indexOf(word[0], x)) !== -1) {
        if (findUpRight(x, y, word)) {
          console.log('Found up right  ', {x, y})
          count++
        }

        if (findRight(x, y, word)) {
          console.log('Found right     ', {x, y})
          count++
        }

        if (findDownRight(x, y, word)) {
          console.log('Found down right', {x, y})
          count++
        }

        if (findDown(x, y, word)) {
          console.log('Found down      ', {x, y})
          count++
        }

        x++
      }

      const reversed = [...word].reverse().join('')
      while ((x = lines[y].indexOf(reversed[0], x)) !== -1) {
        if (findUpRight(x, y, reversed)) {
          console.log('Found down left ', {x, y})
          count++
        }

        if (findRight(x, y, reversed)) {
          console.log('Found left      ', {x, y})
          count++
        }

        if (findDownRight(x, y, reversed)) {
          console.log('Found up left   ', {x, y})
          count++
        }

        if (findDown(x, y, reversed)) {
          console.log('Found up        ', {x, y})
          count++
        }

        x++
      }
    }

    this.log(`XMAS count: ${count}`)

    // Part 2
    function findX(x: number, y: number) {
      if (
        (lines[y - 1][x - 1] === 'M' && lines[y + 1][x + 1] === 'S') ||
        (lines[y - 1][x - 1] === 'S' && lines[y + 1][x + 1] === 'M')
      ) {
        return (
          (lines[y + 1][x - 1] === 'M' && lines[y - 1][x + 1] === 'S') ||
          (lines[y + 1][x - 1] === 'S' && lines[y - 1][x + 1] === 'M')
        )
      }
    }

    let x = 0
    let countX = 0
    for (let y = 1; y < limitY - 1; y++) {
      while ((x = lines[y].indexOf('A', x)) !== -1) {
        if (findX(x, y)) {
          console.log('Found X', {x, y})
          countX++
        }

        x++
      }
    }

    this.log(`X count: ${countX}`)
  }
}
