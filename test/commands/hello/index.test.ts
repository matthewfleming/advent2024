import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('Day 1', () => {
  it('runs q1', async () => {
    const {stdout} = await runCommand('q1')
    expect(stdout).to.contain('Distance')
  })
})
