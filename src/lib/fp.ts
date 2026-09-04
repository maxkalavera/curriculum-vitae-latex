import { Right } from "fp-ts/lib/Either";


export const getOrThrow = async <E, A>(
  task: TaskEither<E, A>
): Promise<A> => {
  const result = await task();
  if (Either.isRight(result)) {
    return result.right;
  }
  throw result.left;
};

export const all = <E, A>(
  ...tasks: TaskEither<E, A>[]
): TaskEither<E, A> => {
  return pipe(
    TaskEither.of([]),
    TaskEither.map(async () => {

      const values = await Promise.all(tasks.map(task => task()))
      return values;
    }
      
    ),
    TaskEither.chain((eithers) => {
      const errs = eithers.filter(Either.isLeft)
      return errs.length > 0
        ? TaskEither.left(errs.at(0)!.left)
        : TaskEither.right(
          eithers.map(either => (either as Right<A>).right)
        )
    })
  )
} 