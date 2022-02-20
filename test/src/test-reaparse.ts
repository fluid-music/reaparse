/* eslint-env mocha */
import 'mocha'
import { expect } from 'chai'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as rppp from 'rppp'
import * as parsers from '../../dist/parsers'

import { FluidSession } from 'fluid-music'

const rppFileAsString = readFileSync(join('test', 'kit.RPP'), { encoding: 'utf-8' })
const rppProject = rppp.parseAndSpecialize(rppFileAsString)

describe('createSimplifiedTracks', function () {
  it('should have two tracks', function () {
    const tracks = parsers.createSimplifiedTracks(rppProject)
    expect(tracks).to.have.lengthOf(2)
  })
})

describe('createFluidSession', function () {
  const rppProject = rppp.parse(rppFileAsString)
  const fluidSession = parsers.createFluidSession(rppProject)

  it('should exist', function () {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(parsers.createFluidSession).to.exist
  })

  it('should create a FluidSession instance', function () {
    expect(fluidSession).to.be.an.instanceOf(FluidSession)
  })

  it('should extract the bpm of 90 from kit.RPP', function () {
    expect(fluidSession.bpm).to.equal(90)
  })

  describe('parse tracks', function () {
    it('should extract two tracks named "kick", and "snare" respectively', function () {
      expect(fluidSession.tracks.length).to.equal(2)
      expect(fluidSession.tracks[0].name).to.equal('kick')
      expect(fluidSession.tracks[1].name).to.equal('snare')
    })

    describe('kick track', function () {
      const beatDurationInMinutes = 1 / 90
      const beatDurationInSeconds = beatDurationInMinutes * 60

      it('should have two instances of the kick drum', function () {
        const kickTrack = fluidSession.tracks[0]
        expect(kickTrack.name).to.equal('kick')
        expect(kickTrack.audioFiles).to.have.lengthOf(2)

        const [k1, k2] = kickTrack.audioFiles
        expect(k1.startInSourceSeconds).to.equal(0)
        expect(k1.startTimeSeconds).to.equal(0)
        expect(k2.startTimeSeconds).to.be.approximately(beatDurationInSeconds * 2.5, 0.00000001)
      })
    })
  })
})
