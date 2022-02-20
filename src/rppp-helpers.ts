import * as rppp from 'rppp'
import { readFile } from 'fs/promises'

export async function parseRppFileFromFilename (reaperFilename): Promise<rppp.ReaperBase> {
  const reaperFileString = await readFile(reaperFilename, 'utf-8')
  return rppp.parseAndSpecialize(reaperFileString)
}

export function getTracksFromProject (reaperProject: rppp.ReaperBase): rppp.objects.ReaperTrack[] {
  return reaperProject.contents.filter(o => o.token === 'TRACK').map(t => {
    if (t instanceof rppp.objects.ReaperTrack) return t
    throw new Error(`Found non-ReaperTrack instance with TrackToken: ${JSON.stringify(t)}`)
  })
}

export function getTrackName (reaperTrack: rppp.ReaperBase): string {
  const name = getFirstParamByToken(reaperTrack, 'NAME')
  if (name === undefined) throw Error(`Track has with no name: ${reaperTrack.dump()}`)
  if (typeof name !== 'string') throw Error(`Track has non-string name: ${reaperTrack.dump()}`)
  return name
}

export function getItemsInTrack (reaperTrack: rppp.ReaperBase): rppp.ReaperBase[] {
  return reaperTrack.contents.filter(o => o.token === 'ITEM').map(i => {
    if (i instanceof rppp.ReaperBase) return i
    throw new Error(`Found invalid ITEM while iterating over ITEM sources: ${JSON.stringify(i)}`)
  })
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
