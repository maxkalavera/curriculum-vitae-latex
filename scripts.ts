#! /usr/bin/env pnpm exec tsx

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { fileURLToPath } from 'url'
import { dirname, join, basename, resolve, extname } from 'path'
import { zip } from 'lodash-es'

import { renderFiles } from '@/lib/render'
import { copyMany, setupDir } from '@/lib/files'
import { loadJSONResumeSchema } from '@/lib/json-resume'
import { loadFunction } from '@/lib/dynamic-loader' 
import '@/setup-globals';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

yargs(hideBin(process.argv))
  /***************************************************************************
   * Render files command
   **************************************************************************/
  .command(
    'render [files..]',
    'render .tex.mustache file and place the output file into output dir',
    yars => (
      yars
      .positional('files', {
        describe: 'File paths to render',
        default: []
      })
      .option('outputDir', {
        describe: 'Output directory',
        type: 'string',
        default: resolve('./dist')
      })
      .option('jsonResume', {
        describe: 'JSON Resume shcema file path',
        type: 'string',
        default: join(__dirname, './assets/resume.json'),
      })
      .option('preprocess', {
        describe: 'Path to a typescript file with a default function for pre-processing JSON Resume schema before building the assets',
        type: 'string',
        default: './'
      })
      .option('asset', {
        describe: 'Path to a file or folder to be included in the build of the output assets',
        type: 'array'
      })
    ),
    async (argv) => {
      const filePaths = argv.files as string[]
      const outputDir = argv.outputDir
      const assets = argv.asset as string[]
      let outputPaths = filePaths.map(file => join(outputDir, basename(file)))

      const resume = await pipe(
        loadJSONResumeSchema(argv.jsonResume),
        TaskEither.getOrThrow
      )
      
      let context: any = resume
      if (argv.preprocess) {
        const prepareContext = await loadFunction('./assets/prepare.ts')
        context = prepareContext(context)
      }

      // Setup output dir
      await setupDir(outputDir)

      // Copy assets
      await copyMany(assets, outputDir)

      // Remove .mustache if exist from filename
      outputPaths = outputPaths.map(outputPath => 
        outputPath.endsWith('.mustache')
          ? outputPath.slice(0, -'.mustache'.length)
          : outputPath
      )
      // Build files array with input and output paths
      const files = pipe(
        zip(filePaths, outputPaths),
        files => files.map(
          ([ inputPath, outputPath ]) => ({ inputPath: inputPath!, outputPath: outputPath! })
        ) 
      )
      // Render files into outputDir location
      await pipe(
        renderFiles(files, context),
        TaskEither.getOrThrow
      )
    }
  )
  /***************************************************************************
   * Parse and execute commands
   **************************************************************************/
  .parse()

