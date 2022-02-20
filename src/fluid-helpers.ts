import { FluidAudioFile, FluidSession } from 'fluid-music'
import { createTracks } from './track'
import { getFirstParamByToken } from './rppp-helpers'

/**
 * @param {Object} rppProject
 * @returns {import('fluid-music').FluidSession}
 */
export function createFluidSession (rppProject): FluidSession {
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
      fluidTrack.audioFiles.push(new FluidAudioFile({
        path: simplifiedItem.path,
        startInSourceSeconds: simplifiedItem.startInSourceSeconds,
        durationSeconds: simplifiedItem.durationSeconds,
        startTimeSeconds: simplifiedItem.startTimeSeconds
      }))
    })
  })
  return session
}
