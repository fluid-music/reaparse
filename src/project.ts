import { ReaperBase } from 'rppp'
import { Track, createTracks } from './track'
import { parseRppFileFromFilename } from './rppp-helpers'

interface Project {
  tracks: Track[]
  path: string
  rppSource: ReaperBase
}

/**
 * @param {string} rppFilename
 * @returns {Promise<SimplifiedProject>}
 */
export async function parseRppFile (rppFilename): Promise<Project> {
  const rpppProject = await parseRppFileFromFilename(rppFilename)
  const tracks = createTracks(rpppProject)
  return Object.create({}, {
    tracks: { value: tracks, enumerable: true },
    path: { value: rppFilename, enumerable: true },
    rppSource: { value: rpppProject, enumerable: false }
  })
}
