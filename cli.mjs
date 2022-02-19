#!/usr/bin/env node
import yargs from 'yargs';
import { isAbsolute, join } from 'path';
import {
  parseRppFileFromFilename,
  getTracksFromProject,
  getItemsInTrack,
  getSourcesInItem,
  getFirstParamByToken,
  getTrackName,
} from './src/parsers.mjs';

const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 session.RPP')
  .demandCommand(1)
  .argv;

const argument = argv._[0];
const reaperFilename = isAbsolute(argument)
  ? argument
  : join(process.cwd(), argument);

function getSimplifiedTracks(rppProject) {
  const tracks = []
  for (const track of getTracksFromProject(rppProject)) {
    const simpleTrackObject = {name: getTrackName(track), items: []}
    tracks.push(simpleTrackObject)
    for (const item of getItemsInTrack(track)) {
      const itemName = getFirstParamByToken(item, 'NAME')
      for (const source of getSourcesInItem(item)) {
        const filename = getFirstParamByToken(source, 'FILE');
        if (filename) {
          const durationSeconds = getFirstParamByToken(item, 'LENGTH');
          const startInSourceSeconds = getFirstParamByToken(item, 'SOFFS');
          if (typeof durationSeconds === 'number' && typeof startInSourceSeconds === 'number') {
            const result = {
              itemName,
              filename,
              durationSeconds,
              startInSourceSeconds,
            };
            simpleTrackObject.items.push(result)
          }
        }
      }
    }
  }

  return tracks
}

async function run() {
  const rppProject = await parseRppFileFromFilename(reaperFilename);
  const tracks = getSimplifiedTracks(rppProject)
  for (const track of tracks) {
    for (const item of track.items) {
      console.log(item.startInSourceSeconds)
    }
  }
  console.dir(tracks, {depth: null})
}

run()
