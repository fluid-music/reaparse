/* eslint-env mocha */
import 'should';
import 'mocha';

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import rppp from 'rppp';
import * as parsers from '../src/parsers.mjs';

const rppFileAsString = readFileSync(join('test', 'kit.RPP'), {encoding: 'utf-8'});
const rppProject = rppp.parse(rppFileAsString)

describe('kit.RPP', function () {
  it('should have two tracks', function () {
    const tracks = parsers.createSimplifiedTracks(rppProject);
    tracks.length.should.equal(2);
  })
})