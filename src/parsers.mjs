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
  const simplifiedItems = [];
  for (const item of getItemsInTrack(rpppTrack)) {
    const itemName = getFirstParamByToken(item, 'NAME')
    for (const source of getSourcesInItem(item)) {
      const filename = getFirstParamByToken(source, 'FILE');
      if (!filename) {
        console.warn('reaparse is skipping an item with no direct FILE. (is it compound?)', item)
      } else {
        const durationSeconds = getFirstParamByToken(item, 'LENGTH');
        const startInSourceSeconds = getFirstParamByToken(item, 'SOFFS');
        const positionSeconds = getFirstParamByToken(item, 'POSITION');
        if (
          typeof durationSeconds !== 'number' ||
          typeof startInSourceSeconds !== 'number' ||
          typeof positionSeconds !== 'number'
        ) {
          console.warn(`reaparse is skipping an ITEM with missing timing tokens (${filename})...`, item)
        } else {
          simplifiedItems.push({
            name: itemName,
            filename,
            durationSeconds,
            startInSourceSeconds,
            positionSeconds,
          });
        }
      }
    }
  }
  return {
    name: getFirstParamByToken(rpppTrack, 'NAME'),
    items: simplifiedItems,
  };
}

/**
 * @param rpppProject 
 * @returns {SimplifiedTrack[]}
 */
export function createSimplifiedTracks(rpppProject) {
  const tracks = [];
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
