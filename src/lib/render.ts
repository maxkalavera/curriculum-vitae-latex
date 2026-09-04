import Mustache from 'mustache'

import { load, put } from '@/lib/files'
import { EitherAsync } from '@/lib/purify'

/******************************************************************************
 * Types
 *****************************************************************************/

export type RenderFileInput = {
  inputPath: string,
  outputPath: string,
}

/******************************************************************************
 * Utils
 *****************************************************************************/

export const render = <Resume>(
  content: string,
  resumeData: Resume
): string => {
  return Mustache.render(content, resumeData);
}

export const renderFile = <Resume>(
  templatePath: string,
  outputPath: string,
  resumeData: Resume,
): EitherAsync<Error, null> => {
  return load(templatePath)
    .map(content => render(content, resumeData))
    .chain(rendered => put(outputPath, rendered))
}

