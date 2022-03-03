
import { stringify } from 'csv-stringify/sync'
import { parse } from 'csv-parse/sync'
import { getItemsInTrack, getTrackName, getTracksFromProject } from './rppp-helpers'
import { createItem } from './item'
import { ReaperBase, parseAndSpecialize } from 'rppp'
import { FluidAudioFile, FluidSession, FluidTrack, sessionToReaperProject } from 'fluid-music'

/**
 * A Region is a reference to a section of an audio file or audio resource.
 * Unlike a Reaper ITEM or FluidAudioFile, it is not designed to be contained
 * within a track. Instead it references a hypothetical track (and track number)
 * that it is contained within. This allows us to reconstruct a Fluid Music
 * session from only a list of regions.
 *
 * A Region is a a good way to store session information in a comparatively flat
 * structure.
 */
export interface Region {
  name: string
  startTimeSeconds: number
  startInSourceSeconds: number
  durationSeconds: number
  path: string
  trackName: string
  trackNumber: number
}

export function rppStringToRegions (rppString: string): Region[] {
  const rppProject = parseAndSpecialize(rppString)
  return rppProjectToRegions(rppProject)
}

export function rppProjectToRegions (rppProject: ReaperBase): Region[] {
  const rows: Region[] = []

  for (const [i, track] of getTracksFromProject(rppProject).entries()) {
    const trackName = getTrackName(track)

    for (const rppItem of getItemsInTrack(track)) {
      const item = createItem(rppItem)
      rows.push({
        name: item.name,
        startTimeSeconds: item.startTimeSeconds,
        durationSeconds: item.durationSeconds,
        startInSourceSeconds: item.startInSourceSeconds,
        path: item.path,
        trackName: trackName,
        trackNumber: i
      })
    }
  }

  rows.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)

  return rows
}

export function rppProjectToRegionsCsvString (rppProject: ReaperBase): string {
  const rows = rppProjectToRegions(rppProject)
  return stringify(rows, { header: true, columns: ['name', 'startTimeSeconds', 'startInSourceSeconds', 'durationSeconds', 'path', 'trackName', 'trackNumber'] })
}

export function regionsToFluidSession (rows: Region[]): FluidSession {
  const tracksMap: Map<number, { name: string, rows: Region[] }> = new Map()
  let highestTrackNumber = -1

  for (const row of rows) {
    if ((row.trackNumber) > highestTrackNumber) highestTrackNumber = row.trackNumber

    let newObject = tracksMap.get(row.trackNumber)

    if (newObject === undefined) {
      newObject = { name: row.trackName, rows: [] }
      tracksMap.set(row.trackNumber, newObject)
    }

    newObject.rows.push(row)
  }

  const session = new FluidSession()
  for (let i = 0; i <= highestTrackNumber; i++) {
    let trackObject = tracksMap.get(i)

    if (trackObject === undefined) {
      trackObject = { name: `track${i}`, rows: [] }
    }

    const track = new FluidTrack({ name: trackObject.name })
    session.tracks.push(track)

    for (const row of trackObject.rows) {
      track.audioFiles.push(new FluidAudioFile(row))
    }
  }

  return session
}

export function regionsCsvStringToFluidSession (csvString: string): FluidSession {
  const data = parse(csvString, { columns: true, groupColumnsByName: true, cast: true })
  return regionsToFluidSession(data)
}

export async function regionsCsvStringToRppString (csvString: string): Promise<string> {
  const fluidSession = regionsCsvStringToFluidSession(csvString)
  const rppProject = await sessionToReaperProject(fluidSession)
  return rppProject.dump()
}

export async function regionsToRppString (regions: Region[]): Promise<string> {
  const fluidSession = regionsToFluidSession(regions)
  const rppProject = await sessionToReaperProject(fluidSession)
  return rppProject.dump()
}
