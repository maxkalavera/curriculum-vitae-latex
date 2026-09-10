#! /usr/bin/env pnpm exec tsx

import path from 'path'

import minimist from 'minimist'

import { pipe, EitherAsync, Either } from '@/lib/purify'
import { loadFunction } from '@/lib/dynamic-loader'
import { loadJSONResumeSchema } from '@/lib/json-resume'
import { rebaseBasename, removeExtension } from '@/lib/files'
import { renderFile } from '@/lib/render'


const TEMPLATE_EXT = 'ejs'
const argv = minimist(process.argv.slice(2))

function validate () {
  const resume = argv._[0]
  const files = argv._.slice(1)
  const preprocess = argv.preprocess || argv.p
  const output = path.resolve(argv.output || argv.o || './dist')

  return {
    resume,
    files,
    preprocess,
    output
  }
}

async function main () {
  const context = validate()

  const resume = await pipe(
    loadJSONResumeSchema(context.resume),
    EitherAsync.getOrThrow
  )

  const prepareResume = await (
    context.preprocess != null
      ? pipe(
        loadFunction(context.preprocess),
        EitherAsync.getOrThrow
      )
      : <T>(i: T) => i
  )
  const renderData = prepareResume(resume)

  const tasks = context.files
    .map(source => [
      source,
      // Take filename from first path and push it at the end of the output dir
      rebaseBasename(
        removeExtension(source, TEMPLATE_EXT), 
        context.output
      )
    ])
    .map(([input, output]) => renderFile(input, output, renderData))

  const result = await EitherAsync.all(tasks)
  Either.getOrThrow(result)
}

/******************************************************************************
 * Usage
 *****************************************************************************/

if (
  Object.keys(argv).some(option => option === 'help')
  || Object.keys(argv).some(option => option === 'h')
  || argv._.length === 0
) {
  function usage() {
    console.log(`
  Usage: render-resume <schema> [files...] [options]

  Render .tex files using a json reusme schema and optional preprocessor.

  Positional Arguments:
    resume                     Path to the JSON resume file (JSON)
    files                      files (.tex) to render (can be multiple)

  Options:
    -p, --preprocess <file>    Path to TypeScript file for preprocessing 
                               the JSON Resume Data
    -o, --output <dir>         Output directory (default: ./dist)
    -h, --help                 Show this help message

  Examples:
    render-resume schema.json file1.txt file2.txt
    render-resume schema.json src/*.html -o ./build --verbose

  Preprocessor Example:
    The preprocessor file should export a function that modifies the context:
    
    // preprocess.ts
    export default function(context: any) {
      // Modify context
      context.timestamp = new Date().toISOString();
      context.version = process.env.VERSION || '1.0.0';
      return context;
    }
    `)
  }
  usage()
}

main()