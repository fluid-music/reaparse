import rppp from 'rppp'
import { readFile } from 'fs/promises'

export async function parseRppFileFromFilename(reaperFilename) {
  const reaperFileString = await readFile(reaperFilename, 'utf-8');
  const reaperProject = rppp.parse(reaperFileString);
  return rppp.specialize(reaperProject);
}

export function getTracksFromProject(reaperProject) {
  return reaperProject.contents.filter(o => o.token === 'TRACK');
}

export function getTrackName(reaperTrack) {
  return getFirstParamByToken(reaperTrack, 'NAME')
}

export function getItemsInTrack(reaperTrack) {
  return reaperTrack.contents.filter(o => o.token === 'ITEM');
}

export function getSourcesInItem(reaperItem) {
  return reaperItem.contents.filter(i => i.token === 'SOURCE');
}

export function getStructByToken(reaperObject, token) {
  for (const struct of reaperObject.contents) {
    if (struct.token === token) return struct;
  }
  return null;
}

export function getFirstParamByToken(reaperObject, token) {
  const struct = getStructByToken(reaperObject, token);
  if (!struct || !struct.params.length) return null;
  return struct.params[0]
}