#!/usr/bin/env node
import yargs from 'yargs';
import { isAbsolute, join } from 'path';
import {
  parseRppFileFromFilename,
  createSimplifiedProject,
} from './src/parsers.mjs';

const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 session.RPP')
  .demandCommand(1)
  .alias('j', 'json')
  .describe('j', 'format output as raw JSON')
  .argv;

const argument = argv._[0];
const reaperFilename = isAbsolute(argument)
  ? argument 
  : join(process.cwd(), argument);

async function run() {
  const rppProject = await parseRppFileFromFilename(reaperFilename);
  const sProject = createSimplifiedProject(rppProject);
  // print the results
  if (argv.json) {
    console.log(JSON.stringify(sProject.tracks, null, 2))
  } else {
    console.dir(sProject.tracks, {depth: null})
  }
}

run()
