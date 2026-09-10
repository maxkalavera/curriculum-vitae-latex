#! /usr/bin/env pnpm exec tsx

import path from 'path'

import minimist from 'minimist'

import { pipe, EitherAsync, Either } from '@/lib/purify'
import { loadJSONResumeSchema } from '@/lib/json-resume'
import { rebaseBasename, removeExtension } from '@/lib/files'
import { renderFile } from '@/lib/render'


const TEMPLATE_EXT = 'ejs'
const argv = minimist(process.argv.slice(2))

function validate () {
  const files = argv._.slice()
  const markdown_file = argv['markdown-file'] || argv.m
  const output = path.resolve(argv.output || argv.o || './dist')

  return {
    files,
    markdown_file,
    output
  }
}

async function main () {
  const context = validate()
  
  // const markdownContent = await pipe(
  //   loadJSONResumeSchema(context.markdown_file),
  //   EitherAsync.getOrThrow
  // )

  console.log('RENDER COVER')
  console.log(context)

  // const tasks = context.files
  //   .map(source => [
  //     source,
  //     // Take filename from first path and push it at the end of the output dir
  //     rebaseBasename(
  //       removeExtension(source, TEMPLATE_EXT), 
  //       context.output
  //     )
  //   ])
  //   .map(([input, output]) => renderFile(input, output, {}))

  // const result = await EitherAsync.all(tasks)
  // Either.getOrThrow(result)
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
  Usage: render-cover <schema> [files...] [options]

  Render template files using a schema and optional preprocessor.

  Positional Arguments:
    resume                     Path to the JSON resume file (JSON)
    files                      Files to render (can be multiple)

  Options:
    -o, --output <dir>         Output directory (default: ./dist)
    -m, --markdown-file <dir>       Markdown file to pass content to .tex files

    -v, --version              Show version number
    -h, --help                 Show this help message

  Examples:
    render-cover file1.txt file2.txt
    render-cover src/*.html -o ./build --verbose
    `)
  }
  usage()
}

main()