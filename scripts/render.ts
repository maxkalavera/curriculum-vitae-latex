#! /usr/bin/env pnpm exec tsx

import path from 'path'
import fs from 'fs/promises'

import minimist from 'minimist'

// import '@/setup-globals'
import { pipe, EitherAsync, Either } from '@/lib/purify'
import { loadFunction } from '@/lib/dynamic-loader'
import { loadJSONResumeSchema } from '@/lib/json-resume'
import { rebasePath, removeLastExtension } from '@/lib/files'
import { renderFile } from '@/lib/render'


const TEMPLATE_EXT = '.mustache'
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
  const extendedResume = prepareResume(resume)

  const tasks = context.files
    .map(source => [
      source, 
      rebasePath(
        removeLastExtension(source, TEMPLATE_EXT), 
        context.output
      )
    ])
    .map(([input, output]) => renderFile(input, output, extendedResume))
  const result = await EitherAsync
    .all(tasks)
  Either.getOrThrow(result)
}


if (
  Object.keys(argv).some(option => option === 'help')
  || Object.keys(argv).some(option => option === 'h')
  || argv._.length === 0
) {
  function usage() {
    console.log(`
  Usage: render <schema> [files...] [options]

  Render template files using a schema and optional preprocessor.

  Positional Arguments:
    resume                     Path to the JSON resume file (JSON)
    files                      Files to render (can be multiple)

  Options:
    -p, --preprocess <file>    Path to TypeScript file for preprocessing 
                               the JSON Resume Data
    -o, --output <dir>         Output directory (default: )
    -v, --version              Show version number
    -h, --help                 Show this help message
    --verbose                  Enable verbose logging

  Examples:
    render schema.json file1.txt file2.txt
    render schema.json src/*.html -o ./build --verbose

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