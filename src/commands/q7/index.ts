/* eslint-disable unicorn/no-for-loop */
/* eslint-disable no-constant-condition */
/* eslint-disable unicorn/no-array-reduce */
import {Command} from '@oclif/core'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline/promises'

interface Data {
  operands: number[]
  result: number
}

function add(a: number, b: number): number {
  return a + b
}

function multiply(a: number, b: number): number {
  return a * b
}

function concat(a: number, b: number): number {
  return Number(String(a) + String(b))
}

function incrementMatrix(operationMatrix: number[], nOperations: number): boolean {
  operationMatrix[0]++
  for (let i = 0; i < operationMatrix.length; i++) {
    if (operationMatrix[i] === nOperations) {
      if (i + 1 === operationMatrix.length) {
        return false
      }

      operationMatrix[i] = 0
      operationMatrix[i + 1]++
    }
  }

  return true
}

export default class Q7 extends Command {
  static args = {}

  static description = 'Q7'

  static examples = [
    `<%= config.bin %> <%= command.id %>
`,
  ]

  static flags = {}

  async run(): Promise<void> {
    const path = 'assets/q7.txt'

    // Create a readable stream
    const fileStream = createReadStream(path)

    // Create an interface to read the file line by line
    const rl = createInterface({
      crlfDelay: Number.POSITIVE_INFINITY,
      input: fileStream,
    })

    const data: Data[] = []
    for await (const line of rl) {
      const row = line.split(/: /)
      if (!row || row[0].length >= 16) {
        console.log(row)
        throw new Error('Invalid data')
      }

      data.push({
        operands: row[1].split(' ').map(Number),
        result: Number(row[0]),
      })
    }

    // Part 1
    const operations = [add, multiply]
    const {solutions, sum} = solve(data, operations)

    // Part 2
    const operations2 = [add, multiply, concat]
    const {solutions: solutions2, sum: sum2} = solve(data, operations2)

    this.log('Part 1')
    this.log('Solutions: ', solutions)
    this.log('Sum:       ', sum)

    this.log('Part 2')
    this.log('Solutions: ', solutions2)
    this.log('Sum:       ', sum2)
  }
}

function solve(data: Data[], operations: Array<(a: number, b: number) => number>): {solutions: number; sum: number} {
  let solutions = 0
  let sum = 0
  for (const datum of data) {
    const operationMatrix = Array.from({length: datum.operands.length - 1}, () => 0)

    while (true) {
      // console.log('Trying with', operationMatrix, datum.operands)
      const result = datum.operands.reduce((prev, operand, index) => {
        if (index === 0) {
          return operand
        }

        return operations[operationMatrix[index - 1]](prev, operand)
      })

      if (result === datum.result) {
        solutions++
        sum += datum.result
        let solution = String(datum.operands[0])
        for (let i = 0; i < operationMatrix.length; i++) {
          solution += '+*|'[operationMatrix[i]] + datum.operands[i + 1]
        }

        console.log('Solution:', solution, datum)
        break
      }

      if (!incrementMatrix(operationMatrix, operations.length)) {
        console.log('No solution found', datum)
        break
      }
    }
  }

  return {solutions, sum}
}
