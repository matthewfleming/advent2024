import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

function printMap(map: number[]): string {
  return map.map((v) => (v < 0 ? '.' : v > 9 ? `(${v})` : v)).join('')
}

export default class Q9 extends Command {
  static args = {}

  static description = 'Q9'

  static examples = [
    `<%= config.bin %> <%= command.id %>
`,
  ]

  static flags = {}

  async run(): Promise<void> {
    const path = 'assets/q9.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    const diskMap: number[] = []
    const freespace: {length: number; start: number}[] = []

    // Load data
    for await (const line of rl) {
      let i = 0
      let id = 0
      for (const char of line) {
        if (i % 2 === 0) {
          diskMap.push(...Array.from({length: Number(char)}, () => id))
          id++
        } else {
          freespace.push({length: Number(char), start: diskMap.length})
          diskMap.push(...Array.from({length: Number(char)}, () => -1))
        }

        i++
      }
    }

    const diskMap2 = [...diskMap]
    console.log('Inital:        ', printMap(diskMap))

    // Part1 - Compact
    let right = diskMap.length - 1
    let left = 0

    while (left < right) {
      while (diskMap[left] >= 0) {
        left++
      }

      while (diskMap[right] < 0) {
        right--
      }

      if (left < right) {
        diskMap[left] = diskMap[right]
        diskMap[right] = -1
      }
    }

    // Checksum
    let sum = 0
    for (const [index, char] of diskMap.entries()) {
      if (char !== -1) {
        sum += index * Number(char)
      }
    }

    // Part2 - Compact
    compact(diskMap2, freespace)

    // Checksum
    let sum2 = 0
    for (const [index, char] of diskMap2.entries()) {
      if (char !== -1) {
        sum2 += index * Number(char)
      }
    }

    console.log('Final (Part 1):', printMap(diskMap))
    console.log('Final (Part 2):', printMap(diskMap2))

    console.log('Checksum     1:', sum)
    console.log('Checksum     2:', sum2)
  }
}

function compact(diskMap: number[], freespace: {length: number; start: number}[]): void {
  const {length} = diskMap

  let right = length - 1
  while (freespace.some((v) => v.start < right)) {
    while (diskMap[right] < 0 && right >= 0) {
      right--
    }

    const end = right
    const value = diskMap[right]

    while (diskMap[right] === value) {
      right--
      if (right < 0) {
        break
      }
    }

    right += 1
    const length = end - right + 1

    const free = freespace.findIndex((v) => v.length >= length && v.start < right)
    if (free >= 0) {
      const space = freespace[free]
      let i = 0
      while (i < length) {
        diskMap[space.start + i] = value
        diskMap[right + i++] = -1
      }

      space.start += length
      space.length -= length

      if (space.length === 0) {
        freespace.splice(free, 1)
      }
    }

    right--

    // console.log('Step:          ', printMap(diskMap))
  }
}
