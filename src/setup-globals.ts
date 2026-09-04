import * as E from 'fp-ts/Either'
import * as O from 'fp-ts/Option'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import { 
  pipe, 
  flow
} from 'fp-ts/function'
import { getOrThrow } from '@/lib/fp'


globalThis.Either = E
globalThis.Opt = O
globalThis.Task = T
globalThis.TaskEither = {
  ...TE,
  getOrThrow
}
globalThis.pipe = pipe
globalThis.flow = flow
