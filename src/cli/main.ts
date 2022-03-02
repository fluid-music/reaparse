#!/usr/bin/env node
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import yargs from 'yargs'
import { isAbsolute, join, extname } from 'node:path'
import { readFile } from 'node:fs/promises'
import { parseRppFile } from '../project'
import { csvStringToFluidSession, rppProjectToCsvString } from '../csv'

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

const argument = argv._[0] as string
const inputFilename = isAbsolute(argument)
  ? argument
  : join(process.cwd(), argument)

async function run (): Promise<void> {
  const fileExtension = extname(inputFilename).toLowerCase()

  if (fileExtension === '.rpp') {
    const output = await parseRppFile(inputFilename)

    if (argv.common || argv.cjs) {
      process.stdout.write(`module.exports = ${JSON.stringify(output, null, 2)}`)
    } else if (argv.json || argv.j) {
      process.stdout.write(JSON.stringify(output, null, 2))
    } else if (argv.c || argv.csv) {
      process.stdout.write(rppProjectToCsvString(output.rppSource))
    } else {
      console.dir(output, { depth: null })
    }
  } else if (fileExtension === '.csv') {
    const csvString = await readFile(inputFilename, { encoding: 'utf-8' })
    const fluidSession = csvStringToFluidSession(csvString)
    const rppFilename = inputFilename + '.RPP'
    await fluidSession.saveAsReaperFile(rppFilename)
  } else {
    throw new Error(`unrecognized input file extension: ${fileExtension}`)
  }
}

run().catch(e => { throw e })
