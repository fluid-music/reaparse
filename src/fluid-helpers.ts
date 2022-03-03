import { FluidAudioFile, FluidSession } from 'fluid-music'
import { createTracks } from './track'
import { getFirstParamByToken } from './rppp-helpers'
import { ReaperBase } from 'rppp'

/**
 * @param {Object} rppProject
 * @returns {import('fluid-music').FluidSession}
 */
export function rppProjectToFluidSession (rppProject: ReaperBase): FluidSession {
  const simplifiedTracks = createTracks(rppProject)
  // This is naive, because it doesn't account for track folders
  const fluidTrackConfigs = simplifiedTracks.map(simpleTrack => {
    return {
      name: simpleTrack.name
    }
  })

  const bpm = getFirstParamByToken(rppProject, 'TEMPO')
  if (typeof bpm !== 'number') {
    throw new Error('failed to extract BPM from RPP')
  }
  const session = new FluidSession({ bpm }, fluidTrackConfigs)

  let globalTrackIndex = 0
  session.forEachTrack(fluidTrack => {
    const simplifiedTrack = simplifiedTracks[globalTrackIndex++]
    simplifiedTrack.items.forEach(simplifiedItem => {
      fluidTrack.audioFiles.push(new FluidAudioFile(simplifiedItem))
    })
  })
  return session
}

/**
 * Reaper appears to store gain in db to a numeric multiplier. Remember that
 * this is equivalent to voltage gain, so we use 20 for the denominator in the
 * equation. This means that 6.02 db of gain is approximately equal to a
 * gain factor of 2. Remember Power=Voltage^2 which is how the 20 ends up in the
 * db equation instead of 10.
 */
export function db2gain (db: number): number {
  return Math.pow(10, db / 20)
}

export function gain2db (gain: number): number {
  return 20 * Math.log10(gain)
}
