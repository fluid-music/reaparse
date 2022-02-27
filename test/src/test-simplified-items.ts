import 'mocha'
import { expect } from 'chai'

import * as rppp from 'rppp'
import { createItem } from '../../dist/item'

const rppTrackItemString = `<ITEM
  POSITION 1.66666666666667
  SNAPOFFS 0
  LENGTH 0.21260770975057
  LOOP 1
  ALLTAKES 0
  FADEIN 1 0 0 1 0 0 0
  FADEOUT 1 0 0 1 0 0 0
  MUTE 0 0
  SEL 0
  IGUID {5F6EB5A2-4AB4-0A4F-AA99-11F1B179C9E7}
  IID 3
  NAME kick.wav
  VOLPAN 1 0 1 -1
  SOFFS 0
  PLAYRATE 1 1 0 -1 0 0.0025
  CHANMODE 0
  GUID {9FCDA22D-AF70-0B41-A78C-AC85A5CB698F}
  <SOURCE WAVE
    FILE "media/kick.wav"
  >
>`

const rppTrackItemStringModified = `<ITEM
  POSITION 2.66666666666667
  SNAPOFFS 0
  LENGTH 0.33333333333333
  LOOP 1
  ALLTAKES 0
  FADEIN 1 0 0 1 0 0 0
  FADEOUT 1 0 0 1 0 0 0
  MUTE 0 0
  SEL 1
  IGUID {62DB51D0-B9CC-EB4B-AE0D-6D7A4C6187FE}
  IID 7
  NAME -6db
  VOLPAN 1 -0.5 0.501187 -1
  SOFFS 0
  PLAYRATE 1 1 0 -1 0 0.0025
  CHANMODE 1
  GUID {63074C1F-71AA-4440-B51E-83037C6D1BEC}
  <SOURCE WAVE
    FILE "media/snare.wav"
  >
>`

describe('createSimplifiedItem', function () {
  describe('a basic item', function () {
    const rppItem = rppp.parseAndSpecialize(rppTrackItemString)
    const simpleItem = createItem(rppItem)

    it('should correctly extract the startTime!', function () {
      expect(simpleItem.startTimeSeconds).to.be.approximately(1.66666666666667, 1e-10)
    })

    it('should correctly extract the length', function () {
      expect(simpleItem.durationSeconds).to.be.approximately(0.21260770975057, 1e-10)
    })
  })

  describe('an item with some ', function () {
    const rppItem = rppp.parseAndSpecialize(rppTrackItemStringModified)
    const simpleItem = createItem(rppItem)
    it('should have a gainDb of -6', function () {
      expect(simpleItem.gainDb).to.be.approximately(-6, 1e-5)
    })
    it('should have a pan of -0.5', function () {
      expect(simpleItem.pan).to.equal(-0.5)
    })
  })
})
