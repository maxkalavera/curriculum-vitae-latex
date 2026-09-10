
import { load as loadFile } from '@/lib/files'
import { EitherAsync } from '@/lib/purify'
import { inspect } from 'util'

export const loadJSON = (
  filePath: string
): EitherAsync<Error, any> => 
  loadFile(filePath)
  .map(JSON.parse)
