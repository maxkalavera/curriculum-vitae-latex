import { 
  EitherAsync as EA, 
  type EitherAsync as EitherAsyncInterface 
} from 'purify-ts/EitherAsync'
import { Either, Left, Right } from 'purify-ts/Either'

/******************************************************************************
 * Helpers
 *****************************************************************************/

const tryCatch = <Err, Res>(
  fn: () => Promise<Res>
): EA<Err, Res> => {
  return EA(async ({ liftEither }) => {
    try {
      const res = fn()
      return liftEither(Right(res))
    } catch (err: any) {
      return liftEither(Left(err))
    }
  })
}

const getOrThrow = async <Err, Res>(
  eitherAsync: EA<Err, Res>
): Promise<Res> => {
  const res = await eitherAsync.run()
  if (res.isLeft()) throw res.extract()
  return res.extract() as Res
}

const LiftLeft = <L, R = never>(
  value: L
) => EA.liftEither(Left(value))

const LiftRight = <R, L = never>(
  value: L
) => EA.liftEither(Right(value))

/******************************************************************************
 * Exports
 *****************************************************************************/

export interface EitherAsync<L, R> extends EitherAsyncInterface<L, R> {}

export const EitherAsync = {
  ...EA,
  build: EA,
  tryCatch,
  getOrThrow,
  Left: LiftLeft,
  Right: LiftRight
}
