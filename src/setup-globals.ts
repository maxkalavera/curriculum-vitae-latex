import {
  compose,
  flow,
  pipe,
  Maybe,
  MaybeAsync,
  Either, 
  EitherAsync
} from '@/lib/purify'

globalThis.compose = compose
globalThis.flow = flow
globalThis.pipe = pipe
globalThis.Maybe = Maybe
globalThis.MaybeAsync = MaybeAsync
globalThis.Either = Either
globalThis.EitherAsync = EitherAsync
