#! /usr/bin/env pnpm exec tsx

import path from 'path'

import minimist from 'minimist'

import '@/setup-globals'
import { loadFunction } from '@/lib/dynamic-loader'
import { loadJSON } from '@/lib/json'
import { loadMarkdown } from '@/lib/markdown'
import { loadJSONResume } from '@/lib/json-resume'
import { rebaseBasename, removeExtension } from '@/lib/files'
import { renderFile } from '@/lib/render'

const argv = minimist(process.argv.slice(2))

function validate () {
  const files = argv._.slice()
  const output = path.resolve(argv.output || argv.o || './dist')
  const preprocess = Maybe.fromNullable(argv.preprocess || argv.p)
  const json = Maybe.fromNullable(argv.json || argv.j)
  const jsonResume = Maybe.fromNullable(argv['json-resume'] || argv.r)
  const markdown = Maybe.fromNullable(argv.markdown || argv.m)

  return {
    files,
    preprocess,
    output,
    json,
    jsonResume,
    markdown
  }
}

async function main () {
  const context = validate()

  let renderData: Record<string, any> = {
    json: (
      await context.json
      .map(loadJSON)
      .map(EitherAsync.getOrThrow)
      .orDefault(Promise.resolve({}))
    ),
    jsonResume: (
      await context.jsonResume
      .map(loadJSONResume)
      .map(EitherAsync.getOrThrow)
      .orDefault(Promise.resolve({}))
    ),
    markdown: (
      await context.markdown
      .map(loadMarkdown)
      .map(EitherAsync.getOrThrow)
      .orDefault(Promise.resolve({}))      
    )
  }
    
  const preprocess = await context.preprocess
  .map(loadFunction)
  .map(EitherAsync.getOrThrow)
  .orDefault(Promise.resolve(<T>(i: T) => i))

  renderData = preprocess(renderData)
  const tasks = context.files
    .map(source => [
      source,
      // Take filename from first path and push it at the end of the output dir
      rebaseBasename(source, context.output)
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
  Usage: render <schema> [files...] [options]

  Render .tex files using a json reusme schema and optional preprocessor.

  Positional Arguments:
    resume                     Path to the JSON resume file (JSON)
    files                      files (.tex) to render (can be multiple)

  Options:
    -p, --preprocess <file>    Path to TypeScript file for preprocessing 
                               the rendering data
    -j, --json <file>          Attach JSON file data to rendering
    -r, --json-resume <file>  Attach JSON file data to rendeing
                               and validate it fulfills JSON Resume Schema
    -m, --markdown <file>      Attach Markdown file data to rendering

    -o, --output <dir>         Output directory (default: ./dist)
    -h, --help                 Show this help message

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