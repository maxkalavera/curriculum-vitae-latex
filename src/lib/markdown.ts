import matter from 'gray-matter'

import { load as loadFile } from '@/lib/files'
import { EitherAsync } from '@/lib/purify'

export const loadMarkdown = (
  filePath: string
): EitherAsync<Error, any> => 
  loadFile(filePath)
  .map(matter)
