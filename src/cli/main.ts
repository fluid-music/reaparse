#!/usr/bin/env node
import yargs from 'yargs'
import { isAbsolute, join } from 'path'
import { parseRppFile } from '../project'

const argv = yargs(process.argv.slice(2))
  .option('json', {
    alias: 'j',
    type: 'boolean',
    describe: 'format output as raw JSON'
  })
  .option('common', {
    alias: 'c',
    type: 'boolean',
    describe: 'format output as common js module'
  })
  .usage('Usage: $0 session.RPP')
  .demandCommand(1)
  .help()
  .argv

const argument = argv._[0]
const reaperFilename = isAbsolute(argument)
  ? argument
  : join(process.cwd(), argument)

async function run (): Promise<void> {
  const output = await parseRppFile(reaperFilename)

  if (argv.common || argv.c) { // eslint-disable-line
    console.log(`module.exports = ${JSON.stringify(output, null, 2)}`)
  } else if (argv.json || argv.j) { // eslint-disable-line
    console.log(JSON.stringify(output, null, 2))
  } else {
    for (const track of output.tracks) {
      console.dir({
        name: track.name,
        items: track.items
      }, { depth: 2 })
    }
  }
}

run().catch(e => { throw e })
