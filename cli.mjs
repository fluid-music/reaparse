#!/usr/bin/env node
import yargs from 'yargs';
import { isAbsolute, join } from 'path';
import {
  parseRppFileFromFilename,
  getTracksFromProject,
  getItemsInTrack,
  getSourcesInItem,
  getFirstParamByToken,
} from './src/parsers.mjs';

const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 session.RPP')
  .demandCommand(1)
  .argv;

const argument = argv._[0];
const reaperFilename = isAbsolute(argument)
  ? argument 
  : join(process.cwd(), argument);

async function run() {
  const rppProject = await parseRppFileFromFilename(reaperFilename);
  for (const track of getTracksFromProject(rppProject)) {
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
            console.log(result);
          }
        }
      }
    }
  }
}

run()
