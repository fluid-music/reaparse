import * as rppp from 'rppp'
import { readFile } from 'fs/promises'
import { FluidAudioFile, FluidSession } from 'fluid-music';

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

/**
 * @typedef {Object} SimplifiedItem A convenient oversimplification of a Reaper
 * ITEM, which is a non-destructive reference to a region within a timeline
 * @property {string} name The item name, as set in Reaper
 * @property {string} filename The source file for the item
 * @property {number} startInSourceSeconds trim this many seconds from the
 * beginning of the source file
 * @property {number} durationSeconds play this many seconds of the source
 * material
 * @property {number} positionSeconds where to place this item on the session
 * timeline
 */

/**
 * @typedef {Object} SimplifiedTrack A convenient oversimplification of a Reaper
 * Track
 * @property {SimplifiedItem[]} items
 * @property {string} name
 */

/**
 * @typedef {Object} SimplifiedProject A convenient oversimplification of a
 * Reaper project
 * @property {SimplifiedTrack[]} tracks
 * @property {string} filename
 */

/**
 * @param {Object} rpppTrack
 * @returns {SimplifiedTrack}
 */
export function createSimplifiedTrack(rpppTrack) {
  const simplifiedItems = getItemsInTrack(rpppTrack).map(createSimplifiedItem);

  return {
    name: getFirstParamByToken(rpppTrack, 'NAME'),
    items: simplifiedItems,
    isBus: getStructByToken(rpppTrack, 'ISBUS').params,
  };
}

type SimplifiedItem = {
  name: string,
  path: string,
  durationSeconds: number,
  startInSourceSeconds: number,
  startTimeSeconds: number,
}

export function createSimplifiedItem(rppItem) {
  const simplifiedItems : SimplifiedItem[] = []
  const itemName = getFirstParamByToken(rppItem, 'NAME')
  for (const source of getSourcesInItem(rppItem)) {
    const filename = getFirstParamByToken(source, 'FILE');
    if (!filename) {
      console.warn('reaparse is skipping an item with no direct FILE. (is it compound?)', rppItem)
    } else {
      const durationSeconds = getFirstParamByToken(rppItem, 'LENGTH');
      const startInSourceSeconds = getFirstParamByToken(rppItem, 'SOFFS');
      const startTimeSeconds = getFirstParamByToken(rppItem, 'POSITION');
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
        });
      }
    }
  }

  if (simplifiedItems.length === 0) {
    console.error(rppItem);
    throw new Error('reaparse found an item with no sources. This is not currently supported.');
  }
  if (simplifiedItems.length > 1) {
    console.error(rppItem);
    throw new Error(`reaparse does not currently support parsing items with multiple sources.`);
  }

  return simplifiedItems[0];
}

/**
 * @param rpppProject 
 * @returns {SimplifiedTrack[]}
 */
export function createSimplifiedTracks(rpppProject) {
  const tracks : {
    name: string,
    items: SimplifiedItem[]
  }[] = [];
  for (const track of getTracksFromProject(rpppProject)) {
    tracks.push(createSimplifiedTrack(track));
  }
  return tracks
}

/**
 * @param {string} rppFilename
 * @returns {Promise<SimplifiedProject>}
 */
export async function parseRppFile(rppFilename) {
  const rpppProject = await parseRppFileFromFilename(rppFilename);
  const tracks = createSimplifiedTracks(rpppProject)
  return { tracks, filename: rppFilename }
}

/**
 * @param {Object} rppProject
 * @returns {import('fluid-music').FluidSession}
 */
export function createFluidSession(rppProject) {
  const bpm = getFirstParamByToken(rppProject, 'TEMPO')
  const simplifiedTracks = createSimplifiedTracks(rppProject)

  // This is naive, because it doesn't account for track folders
  const fluidTrackConfigs = simplifiedTracks.map(simpleTrack => {
    return {
      name: simpleTrack.name
    }
  })

  const session = new FluidSession({bpm}, fluidTrackConfigs)

  let globalTrackIndex = 0
  session.forEachTrack(fluidTrack => {
    const simplifiedTrack = simplifiedTracks[globalTrackIndex++]
    simplifiedTrack.items.forEach(simplifiedItem => {
      fluidTrack.audioFiles.push(new FluidAudioFile({
        path: simplifiedItem.path,
        startInSourceSeconds: simplifiedItem.startInSourceSeconds,
        durationSeconds: simplifiedItem.durationSeconds,
        startTimeSeconds: simplifiedItem.startTimeSeconds,
      }))
    })
  })
  return session
}