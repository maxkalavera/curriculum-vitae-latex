import { schema as schemaDef } from '@jsonresume/schema'
import Value from 'typebox/value'

import { load as loadFile } from '@/lib/files'
import { EitherAsync } from '@/lib/purify'
import { inspect } from 'util'

export const loadJSONResume = (
  filePath: string
): EitherAsync<Error, any> => {
  return loadFile(filePath)
    .map(JSON.parse)
    .chain(schema => 
      Value.Check(schemaDef, schema)
        ? EitherAsync.Right(schema)
        : EitherAsync.Left(
          new Error(`Error validating against JSON Resume schema: ${
              inspect(Value.Errors(schemaDef, schema))
          }`)
        )
    )
}
