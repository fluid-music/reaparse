
import { stringify } from 'csv-stringify/sync'
import { getItemsInTrack, getTrackName, getTracksFromProject } from './rppp-helpers'
import { createItem } from './item'
import { ReaperBase } from 'rppp'

interface CsvRow {
  name: string
  startTimeSeconds: number
  startInSourceSeconds: number
  durationSeconds: number
  path: string
  trackName: string
  trackNumber: number
}

export function rppProjectToCsv (rppProject: ReaperBase): string {
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

  return stringify(rows, { header: true, columns: ['name', 'startTimeSeconds', 'startInSourceSeconds', 'durationSeconds', 'path', 'trackName', 'trackNumber'] })
}
