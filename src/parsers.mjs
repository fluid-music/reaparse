import rppp from 'rppp'
import { readFile} from 'fs/promises'
import fs from 'fs'

async function old() {
  const rppString = fs.readFileSync('./beat-it.RPP', 'utf-8')
  const rppObj = rppp.parse(rppString)
  const tracks = rppObj.contents.filter(o => o.token === 'TRACK')
  const t1Items = tracks[1].contents.filter(o => o.token === 'ITEM')
  const posObjects = t1Items
    .map(o => o.contents.filter(o => o.token === 'POSITION'))
    .map(array => array[0])
  const positions = posObjects.map(o => o.params[0])

  console.log(positions)
  console.log('found:', positions.length)

  // I rendered a wave file that "beat-it.wav" that trims the silence from the
  // beginning. The following timing adjustment calculates the start time of
  // all measures within "beat-it.wav"
  const startInSession = positions[0]
  const beatTimesInWav = positions.map(position => position - startInSession)

  const commonjs = 'module.exports = ' + JSON.stringify(beatTimesInWav, null, 2)
  fs.writeFileSync('./beat-it-measures.js', commonjs)
}

export async function parseRppFileFromFilename(reaperFilename) {
  const reaperFileString = await readFile(reaperFilename, 'utf-8');
  const reaperProject = rppp.parse(reaperFileString);
  return rppp.specialize(reaperProject);
}

export function getTracksFromProject(reaperProject) {
  return reaperProject.contents.filter(o => o.token === 'TRACK');
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