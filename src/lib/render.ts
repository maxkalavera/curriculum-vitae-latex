import ejs from 'ejs'
import type { GrayMatterFile } from 'gray-matter'

import { load, put } from '@/lib/files'
import { EitherAsync } from '@/lib/purify'

/******************************************************************************
 * Types
 *****************************************************************************/

export interface RenderContext {
  json?: any;
  jsonResume?: any;
  markdown?: GrayMatterFile<any>;
}

/******************************************************************************
 * Utils
 *****************************************************************************/

export const render = <Resume extends ejs.Data>(
  content: string,
  resumeData: Resume
): string => {
  return ejs.render(content, resumeData)
}

export const renderFile = <Resume extends ejs.Data>(
  templatePath: string,
  outputPath: string,
  resumeData: Resume,
): EitherAsync<Error, null> => {
  return load(templatePath)
    .map(content => render(content, resumeData))
    .chain(rendered => put(outputPath, rendered))
}

