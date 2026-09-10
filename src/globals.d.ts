import * as FP from '@/lib/purify'

declare global {
  var compose: typeof FP.compose
  var flow: typeof FP.flow
  var pipe: typeof FP.pipe
  var Maybe: typeof FP.Maybe
  var MaybeAsync: typeof FP.MaybeAsync
  var Either: typeof FP.Either
  var EitherAsync: typeof FP.EitherAsync
}

export {}

