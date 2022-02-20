import * as rppp from 'rppp'
import { readFile } from 'fs/promises'
import { FluidAudioFile, FluidSession } from 'fluid-music'

export async function parseRppFileFromFilename (reaperFilename): Promise<rppp.ReaperBase> {
  const reaperFileString = await readFile(reaperFilename, 'utf-8')
  return rppp.parseAndSpecialize(reaperFileString)
}

export function getTracksFromProject (reaperProject: rppp.ReaperBase): rppp.objects.ReaperTrack[] {
  return reaperProject.contents.filter(o => o.token === 'TRACK').map(t => {
    if (t instanceof rppp.objects.ReaperTrack) return t
    throw new Error('Found non-ReaperTrack instance with TrackToken')
  })
}

export function getTrackName (reaperTrack: rppp.ReaperBase): string {
  const name = getFirstParamByToken(reaperTrack, 'NAME')
  if (name === undefined) throw Error(`Track has with no name: ${reaperTrack.dump()}`)
  if (typeof name !== 'string') throw Error(`Track has non-string name: ${reaperTrack.dump()}`)
  return name
}

export function getItemsInTrack (reaperTrack: rppp.ReaperBase): Array<rppp.ReaperBase|rppp.base.ReaData> {
  return reaperTrack.contents.filter(o => o.token === 'ITEM')
}

export function getSourcesInItem (reaperItem: rppp.ReaperBase): rppp.ReaperBase[] {
  return reaperItem.contents.filter(i => i.token === 'SOURCE').map(i => {
    if (i instanceof rppp.ReaperBase) return i
    throw new Error(`Found invalid SOURCE while iterating over ITEM sources: ${JSON.stringify(i)}`)
  })
}

export function getFirstParamByToken (reaperObject: rppp.ReaperBase, token: string): number|string|undefined {
  const struct = reaperObject.getStructByToken(token)
  if (struct === null || struct === undefined) return undefined
  if (Array.isArray(struct.params)) return struct.params[0]
  return undefined
}

interface SimplifiedItem {
  // The item name, as set in Reaper
  name: string
  // The source file for the item
  path: string
  // trim this many seconds from the beginning of the source file
  startInSourceSeconds: number
  // play this many seconds of the source material
  durationSeconds: number
  // where to place this item on the session timeline
  startTimeSeconds: number
  // the rppp source object that this was created from
  rppSource: rppp.ReaperBase
}

interface SimplifiedTrack {
  items: SimplifiedItem[]
  name: string
  rppSource: rppp.ReaperBase
}

interface SimplifiedProject {
  tracks: SimplifiedTrack[]
  filename: string
  rppSource: rppp.ReaperBase
}

export function createSimplifiedTrack (rppTrack: rppp.ReaperBase): SimplifiedTrack {
  const simplifiedItems = getItemsInTrack(rppTrack).map(createSimplifiedItem)
  const name = getFirstParamByToken(rppTrack, 'NAME')

  if (typeof name !== 'string') {
    throw new Error(`Track is missing a NAME struct ${JSON.stringify(rppTrack)}`)
  }

  return {
    name,
    items: simplifiedItems,
    rppSource: rppTrack
  }
}

export function createSimplifiedItem (rppItem): SimplifiedItem {
  const simplifiedItems: SimplifiedItem[] = []
  const itemName = getFirstParamByToken(rppItem, 'NAME')
  if (typeof itemName !== 'string') {
    throw new Error(`rppp item does not have a name: ${JSON.stringify(rppItem)}`)
  }
  for (const source of getSourcesInItem(rppItem)) {
    const filename = getFirstParamByToken(source, 'FILE')
    if (typeof filename !== 'string') {
      console.warn('reaparse is skipping an item with no direct FILE. (is it compound?)', rppItem)
    } else {
      const durationSeconds = getFirstParamByToken(rppItem, 'LENGTH')
      const startInSourceSeconds = getFirstParamByToken(rppItem, 'SOFFS')
      const startTimeSeconds = getFirstParamByToken(rppItem, 'POSITION')
      if (
        typeof durationSeconds !== 'number' ||
        typeof startInSourceSeconds !== 'number' ||
        typeof startTimeSeconds !== 'number'
      ) {
        console.warn(`reaparse is skipping an ITEM with missing timing tokens (${filename})...`, rppItem)
      } else {
        simplifiedItems.push({
          name: itemName,
          path: filename,
          durationSeconds,
          startInSourceSeconds,
          startTimeSeconds,
          rppSource: rppItem
        })
      }
    }
  }

  if (simplifiedItems.length === 0) {
    console.error(rppItem)
    throw new Error('reaparse found an item with no sources. This is not currently supported.')
  }
  if (simplifiedItems.length > 1) {
    console.error(rppItem)
    throw new Error('reaparse does not currently support parsing items with multiple sources.')
  }

  return simplifiedItems[0]
}

/**
 * @param rpppProject
 * @returns {SimplifiedTrack[]}
 */
export function createSimplifiedTracks (rpppProject: rppp.ReaperBase): SimplifiedTrack[] {
  const tracks: SimplifiedTrack[] = []
  for (const track of getTracksFromProject(rpppProject)) {
    tracks.push(createSimplifiedTrack(track))
  }
  return tracks
}

/**
 * @param {string} rppFilename
 * @returns {Promise<SimplifiedProject>}
 */
export async function parseRppFile (rppFilename): Promise<SimplifiedProject> {
  const rpppProject = await parseRppFileFromFilename(rppFilename)
  const tracks = createSimplifiedTracks(rpppProject)
  return { tracks, filename: rppFilename, rppSource: rpppProject }
}

/**
 * @param {Object} rppProject
 * @returns {import('fluid-music').FluidSession}
 */
export function createFluidSession (rppProject): FluidSession {
  const simplifiedTracks = createSimplifiedTracks(rppProject)

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
