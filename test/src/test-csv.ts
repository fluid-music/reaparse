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

import { CsvRow, csvRowsToFluidSession, rppProjectToCsvString } from '../../dist/csv'

const rppFileAsString = readFileSync(join('test', '60-bpm.RPP'), { encoding: 'utf-8' })
const rppProject = parseAndSpecialize(rppFileAsString)

describe('CSV', async function () {
  const csvString = rppProjectToCsvString(rppProject)
  const kick = { name: 'kick', startInSourceSeconds: 0, path: 'media/kick.wav', trackName: '1-kick', trackNumber: 0, durationSeconds: 0.125 }
  const snare = { name: 'snare', startInSourceSeconds: 0, path: 'media/snare.wav', trackName: '2-snare', trackNumber: 1, durationSeconds: 0.25 }

  it('should return a string', function () {
    expect(csvString).to.be.a.string
  })

  describe('csv parsing', function () {
    let data: any = null

    before(function () {
      data = parse(csvString, { columns: true, groupColumnsByName: true, cast: true })
    })

    it('should include five items', function () {
      expect(data).to.have.lengthOf(5)
    })
    it('should find a kick at position 0', function () {
      expect(data[0]).to.deep.equal({ startTimeSeconds: 0, ...kick })
    })
    it('should find a snare at position 1', function () {
      expect(data[1]).to.deep.equal({ startTimeSeconds: 0.5, ...snare })
    })
    it('should find a snare at position 2', function () {
      expect(data[2]).to.deep.equal({ startTimeSeconds: 1, ...snare })
    })
    it('should find a kick at position 3', function () {
      expect(data[3]).to.deep.equal({ startTimeSeconds: 1.5, ...kick })
    })
    it('should find a kick at position 4', function () {
      expect(data[4]).to.deep.equal({ startTimeSeconds: 2, ...kick })
    })
  })

  describe('csvRowsToFluidSession', function () {
    const csvRows: CsvRow[] = [
      { startTimeSeconds: 0, ...kick },
      { startTimeSeconds: 0.5, ...kick },
      { startTimeSeconds: 1.0, ...kick },
      { startTimeSeconds: 1.5, ...snare }
    ]

    const fluidSession = csvRowsToFluidSession(csvRows)
    it('should parse the tracks', function () {
      expect(fluidSession.tracks).to.have.lengthOf(2, 'incorrect number of tracks')
    })
  })
})
