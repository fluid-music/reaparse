/* eslint-env mocha */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unused-expressions */
// disabling no-unused-expressions allows `expect(obj).to.exist`

import { readFileSync } from 'node:fs'
import { join } from 'path'

import 'mocha'
import { expect } from 'chai'
import { parseAndSpecialize } from 'rppp'
import { parse } from 'csv-parse/sync'

import { rppProjectToCsv } from '../../dist/csv'

const rppFileAsString = readFileSync(join('test', '60-bpm.RPP'), { encoding: 'utf-8' })
const rppProject = parseAndSpecialize(rppFileAsString)

describe('rppProjectToCsv', async function () {
  const csvString = rppProjectToCsv(rppProject)

  it('should return a string', function () {
    expect(csvString).to.be.a.string
  })

  it('should be in csv format', function () {
    const data = parse(csvString, { columns: true, groupColumnsByName: true, cast: true })
    expect(data).to.have.lengthOf(5)
    expect(data).to.deep.equal([
      { name: 'kick', startTimeSeconds: 0, durationSeconds: 0.125 },
      { name: 'snare', startTimeSeconds: 0.5, durationSeconds: 0.25 },
      { name: 'snare', startTimeSeconds: 1, durationSeconds: 0.25 },
      { name: 'kick', startTimeSeconds: 1.5, durationSeconds: 0.125 },
      { name: 'kick', startTimeSeconds: 2, durationSeconds: 0.125 }
    ])
  })
})
