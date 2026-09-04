import path from 'path'

import { EitherAsync } from '@/lib/purify'

type GenericFunction = (...args: any[]) => any;

export const loadFunction = (
  filePath: string
): EitherAsync<Error, GenericFunction> => {
  const absolutePath = path.resolve(filePath)
  return EitherAsync.tryCatch<Error, any>(
    () => import(absolutePath)
  ).chain<Error, GenericFunction>(module =>
    typeof module.default !== 'function'
      ? EitherAsync.Left(
        new Error("Loaded module's default value is not a function")
      )
      : EitherAsync.Right(module.default)
  )
}