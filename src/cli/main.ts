#!/usr/bin/env node
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import yargs from 'yargs'
import { isAbsolute, join } from 'path'
import { parseRppFile } from '../project'
import { rppProjectToCsv } from '../csv'

const argv = yargs(process.argv.slice(2))
  .option('json', {
    alias: 'j',
    type: 'boolean',
    describe: 'format output as raw JSON'
  })
  .option('cjs', {
    type: 'boolean',
    describe: 'format output as common js module'
  })
  .option('csv', {
    alias: 'c',
    type: 'boolean',
    describe: 'List all project items in CSV format'
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

  if (argv.common || argv.cjs) {
    process.stdout.write(`module.exports = ${JSON.stringify(output, null, 2)}`)
  } else if (argv.json || argv.j) {
    process.stdout.write(JSON.stringify(output, null, 2))
  } else if (argv.c || argv.csv) {
    process.stdout.write(rppProjectToCsv(output.rppSource))
  } else {
    console.dir(output, { depth: null })
  }
}

run().catch(e => { throw e })
