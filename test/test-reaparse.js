/* eslint-env mocha */
import 'should';
import 'mocha';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import rppp from 'rppp';
import * as parsers from '../src/parsers.mjs';
import should from 'should';

import { FluidSession } from 'fluid-music';

const rppFileAsString = readFileSync(join('test', 'kit.RPP'), {encoding: 'utf-8'});
const rppProject = rppp.parse(rppFileAsString)

describe('createSimplifiedTracks', function () {
  it('should have two tracks', function () {
    const tracks = parsers.createSimplifiedTracks(rppProject);
    tracks.length.should.equal(2);
  })
})

describe('createFluidSession', function () {
  const rppProject = rppp.parse(rppFileAsString)
  const fluidSession = parsers.createFluidSession(rppProject);

  it('should exist', function () {
    should.exist(parsers.createFluidSession);
  });

  it('should create a FluidSession instance', function () {
    should(fluidSession).be.an.instanceOf(FluidSession);
  });

  it('should extract the bpm of 90 from kit.RPP', function () {
    fluidSession.bpm.should.equal(90);
  });

  describe('parse tracks', function () {
    it('should extract two tracks named "kick", and "snare" respectively', function () {
      fluidSession.tracks.length.should.equal(2);
      fluidSession.tracks[0].name.should.equal('kick');
      fluidSession.tracks[1].name.should.equal('snare');
    })

    describe('kick track', function () {
      const beatDurationInMinutes = 1/90;
      const beatDurationInSeconds = beatDurationInMinutes * 60;

      it('should have two instances of the kick drum', function () {
        const kickTrack = fluidSession.tracks[0];
        kickTrack.name.should.equal('kick');
        kickTrack.audioFiles.length.should.equal(2);
        const [k1, k2] = kickTrack.audioFiles
        k1.startInSourceSeconds.should.equal(0)
        k1.startTimeSeconds.should.equal(0)
        k2.startTimeSeconds.should.be.approximately(beatDurationInSeconds * 2.5, 0.00000001)
      })
    })
  })
})
