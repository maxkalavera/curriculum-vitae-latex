import { 
  Either as E, 
  Left as L, 
  Right as R 
} from 'purify-ts/Either'

/******************************************************************************
 * Helpers
 *****************************************************************************/

const tryCatch = <Err, Res>(
  fn: () => Res
): E<Err, Res> => {
  try {
    const res = fn()
    return R(res)
  } catch (err: any) {
    return L(err)
  }
}

const getOrThrow = <Err, Res>(
  either: E<Err, Res>
): Res => {
  if (either.isLeft()) throw either.extract()
  return either.extract() as Res
}

/******************************************************************************
 * Exports
 *****************************************************************************/

export const Either = {
  ...E,
  Left: L,
  Right: R,
  tryCatch,
  getOrThrow
}

export const Left = L

export const Right = R
