import { 
  MaybeAsync as MA, 
  type MaybeAsync as MaybeAsyncInterface 
} from 'purify-ts/MaybeAsync'
import { Maybe, Just, Nothing } from 'purify-ts/Maybe'

/******************************************************************************
 * Helpers
 *****************************************************************************/

const LiftJust = <T>(
  value: T
) => MA.liftMaybe(Just(value))

const LiftNothing = () => MA.liftMaybe(Nothing)

/******************************************************************************
 * Exports
 *****************************************************************************/

export interface MaybeAsync<T> extends MaybeAsyncInterface<T> {}

export const MaybeAsync = {
  ...MA,
  Just: LiftJust,
  Nothing: LiftNothing
}
