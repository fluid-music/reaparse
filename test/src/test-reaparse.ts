/* eslint-env mocha */
/* eslint-disable @typescript-eslint/no-unused-expressions */
// disabling no-unused-expressions allows `expect(obj).to.exist`

import 'mocha'
import { expect } from 'chai'

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as rppp from 'rppp'

import { createTracks } from '../../dist/track'
import { createFluidSession, gain2db, db2gain } from '../../dist/fluid-helpers'

import { FluidSession } from 'fluid-music'

const rppFileAsString = readFileSync(join('test', 'kit.RPP'), { encoding: 'utf-8' })
const kitRppProject = rppp.parseAndSpecialize(rppFileAsString)

describe('createSimplifiedTracks', function () {
  it('should have three tracks', function () {
    const tracks = createTracks(kitRppProject)
    expect(tracks).to.have.lengthOf(3)
  })
})

describe('createFluidSession', function () {
  const rppProject = rppp.parseAndSpecialize(rppFileAsString)
  const fluidSession = createFluidSession(rppProject)

  it('should exist', function () {
    expect(createFluidSession).to.exist
  })

  it('should create a FluidSession instance', function () {
    expect(fluidSession).to.be.an.instanceOf(FluidSession)
  })

  it('should extract the bpm of 90 from kit.RPP', function () {
    expect(fluidSession.bpm).to.equal(90)
  })

  describe('parse tracks', function () {
    it('should extract two tracks named "kick", and "snare" respectively', function () {
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

    describe('modified track', function () {
      const modTrack = fluidSession.tracks[2]
      it('should exist', function () {
        expect(modTrack).to.exist
      })

      describe('modified item on the track', function () {
        const item = modTrack.audioFiles[0]
        it('should exist', function () {
          expect(item).to.exist
        })
        it('should have pan of -0.5', function () {
          expect(item.pan).to.equal(-0.5)
        })
        it('should have gain of approximately -6', function () {
          expect(item.gainDb).to.be.approximately(-6, 1e-5)
        })
      })
    })
  })
})

describe('decibel <-> gain conversion', function () {
  describe('gain2db', function () {
    it('should convert 0 to -Infinity', function () {
      expect(gain2db(0)).to.equal(-Infinity)
    })
    it('should convert 0.5 to approximately -6.02', function () {
      expect(gain2db(0.5)).to.be.approximately(-6.02, 1e-3)
    })
  })

  it('should convert decibels to gain and back again', function () {
    for (const value of [0, 1, -3, 3, -5, 5, -8 / 7, 8 / 7, 100, -100]) {
      expect(gain2db(db2gain(value))).to.be.approximately(value, 1e-10, `(${value.toPrecision(4)})`)
    }
  })

  it('should convert gain to decibels and back again', function () {
    for (const value of [0, 0.5, 2 / 3, 1, 2, 3, 4, 6, 12, 100]) {
      expect(db2gain(gain2db(value))).to.be.approximately(value, 1e-10, `(${value.toPrecision(4)})`)
    }
  })
})
