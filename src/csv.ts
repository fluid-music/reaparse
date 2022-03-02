
import { stringify } from 'csv-stringify/sync'
import { parse } from 'csv-parse/sync'
import { getItemsInTrack, getTrackName, getTracksFromProject } from './rppp-helpers'
import { createItem } from './item'
import { ReaperBase } from 'rppp'
import { FluidAudioFile, FluidSession, FluidTrack } from 'fluid-music'

export interface CsvRow {
  name: string
  startTimeSeconds: number
  startInSourceSeconds: number
  durationSeconds: number
  path: string
  trackName: string
  trackNumber: number
}
export function rppProjectToCsvRows (rppProject: ReaperBase): CsvRow[] {
  const rows: CsvRow[] = []

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

export function rppProjectToCsvString (rppProject: ReaperBase): string {
  const rows = rppProjectToCsvRows(rppProject)
  return stringify(rows, { header: true, columns: ['name', 'startTimeSeconds', 'startInSourceSeconds', 'durationSeconds', 'path', 'trackName', 'trackNumber'] })
}

export function csvRowsToFluidSession (rows: CsvRow[]): FluidSession {
  const tracksMap: Map<number, { name: string, rows: CsvRow[] }> = new Map()
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

export function csvStringToFluidSession (csvString: string): FluidSession {
  const data = parse(csvString, { columns: true, groupColumnsByName: true, cast: true })
  return csvRowsToFluidSession(data)
}
