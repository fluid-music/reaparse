import { ReaperBase } from 'rppp'
import { Item, createItem } from './item'
import { getItemsInTrack, getFirstParamByToken, getTracksFromProject } from './rppp-helpers'

export interface Track {
  items: Item[]
  name: string
  rppSource: ReaperBase
}

export function createTrack (rppTrack: ReaperBase): Track {
  const simplifiedItems = getItemsInTrack(rppTrack).map(createItem)
  const name = getFirstParamByToken(rppTrack, 'NAME')

  if (typeof name !== 'string') {
    throw new Error(`Track is missing a NAME struct ${JSON.stringify(rppTrack)}`)
  }

  return Object.create({}, {
    name: { value: name, enumerable: true },
    items: { value: simplifiedItems, enumerable: true },
    rppSource: { value: rppTrack, enumerable: false }
  })
}

export function createTracks (rpppProject: ReaperBase): Track[] {
  const tracks: Track[] = []
  for (const track of getTracksFromProject(rpppProject)) {
    tracks.push(createTrack(track))
  }
  return tracks
}
