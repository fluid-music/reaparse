
import { stringify } from 'csv-stringify/sync'
import { getItemsInTrack, getTracksFromProject } from './rppp-helpers'
import { createItem } from './item'
import { ReaperBase } from 'rppp'

interface CsvRow {
  name: string
  startTimeSeconds: number
  durationSeconds: number
}

export function rppProjectToCsv (rppProject: ReaperBase): string {
  const rows: CsvRow[] = []

  for (const track of getTracksFromProject(rppProject)) {
    for (const rppItem of getItemsInTrack(track)) {
      const item = createItem(rppItem)
      rows.push({
        name: item.name,
        startTimeSeconds: item.startTimeSeconds,
        durationSeconds: item.durationSeconds
      })
    }
  }

  rows.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)

  return stringify(rows, { header: true, columns: ['name', 'startTimeSeconds', 'durationSeconds'] })
}