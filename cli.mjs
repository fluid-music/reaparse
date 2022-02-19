#!/usr/bin/env node
import yargs from 'yargs';
import { isAbsolute, join } from 'path';
import { parseRppFile } from './src/parsers.mjs';

const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 session.RPP')
  .demandCommand(1)
  .alias('j', 'json')
  .describe('j', 'format output as raw JSON')
  .alias('c', 'common')
  .describe('c', 'format output as common js module')
  .argv;

const argument = argv._[0];
const reaperFilename = isAbsolute(argument)
  ? argument
  : join(process.cwd(), argument);

async function run() {
  const output = await parseRppFile(reaperFilename);

  if (argv.common) {
    console.log(`module.exports = ${JSON.stringify(output, null, 2)}`)
  } else if (argv.json) {
    console.log(JSON.stringify(output, null, 2))
  } else {
    console.dir(output, {depth: null})
  }
}

run()
