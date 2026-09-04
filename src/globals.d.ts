import type { Either as EitherT } from 'fp-ts/lib/Either'
import type { Option as OptionT } from 'fp-ts/lib/Option'
import type { Task as TaskT } from 'fp-ts/lib/Task'
import type { TaskEither as TaskEitherT } from 'fp-ts/lib/TaskEither'
import { getOrThrow } from '@/lib/fp'


declare global {
  var Either: typeof import('fp-ts/Either')
  var Opt: typeof import('fp-ts/Option')
  var Task: typeof import('fp-ts/Task')
  var TaskEither: typeof import('fp-ts/TaskEither') & {
    getOrThrow: typeof getOrThrow
  }
  var pipe: typeof import('fp-ts/function').pipe
  var flow: typeof import('fp-ts/function').flow

  type Either<E, A> = EitherT<E, A>
  type Opt<A> = OptionT<A>
  type Task<A> = TaskT<A>
  type TaskEither<E, A> = TaskEitherT<E, A>
}

export {}

