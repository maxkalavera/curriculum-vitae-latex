/******************************************************************************
 * Flow
 *****************************************************************************/
/**
 * Composes a pipeline of functions where each function receives the output of the previous one.
 *
 * Creates a new function that, when invoked, executes the provided functions in left-to-right order.
 * The first function receives all arguments passed to the composed function, and each subsequent
 * function receives the single return value of the previous function.
 *
 * @template A - Tuple type representing the input arguments of the first function
 * @template B - Return type of the first function (input type of the second)
 * @template C - Return type of the second function (input type of the third)
 * @template D - Return type of the third function (input type of the fourth)
 * @template E - Return type of the fourth function (input type of the fifth)
 * @template F - Return type of the fifth function (input type of the sixth)
 * @template G - Return type of the sixth function (input type of the seventh)
 * @template H - Return type of the seventh function
 *
 * @param {...((...args: any[]) => any)} fns - Functions to compose, executed left-to-right.
 *        Minimum of 1 function required. Supports up to 7 functions with full type safety.
 *
 * @returns {(...args: any[]) => any} A new function that executes the pipeline when called.
 *
 * @example
 * // Basic transformation pipeline
 * const processPrice = flow(
 *   (s: string) => Number(s),
 *   (n: number) => n * 2,
 *   (n: number) => `$${n.toFixed(2)}`
 * );
 * processPrice("19.99"); // "$39.98"
 *
 * @example
 * // Data filtering and transformation
 * const getAdultNames = flow(
 *   (users: Array<{ name: string; age: number }>) => users.filter(u => u.age >= 18),
 *   (adults) => adults.map(u => u.name),
 *   (names) => names.sort()
 * );
 *
 * @example
 * // Async operations (works with Promises)
 * const getUserDisplay = flow(
 *   (id: number) => fetch(`/api/users/${id}`).then(r => r.json()),
 *   (user) => `${user.name} (ID: ${user.id})`
 * );
 * await getUserDisplay(123);
 *
 * @example
 * // Framework integration (NestJS service)
 * @Injectable()
 * export class OrderService {
 *   private processOrder = flow(
 *     (dto: CreateOrderDto) => this.validateOrder(dto),
 *     (validated) => this.calculateTotal(validated),
 *     (withTotal) => this.applyDiscount(withTotal),
 *     (finalized) => this.saveToDatabase(finalized)
 *   );
 * }
 *
 * @example
 * // Compare with pipe (immediate vs reusable execution)
 * const transform = flow(add1, double);  // Reusable function
 * transform(5);                          // Later execution
 * 
 * pipe(5, add1, double);                 // Immediate execution
 *
 * @remarks
 * - The first function can accept any number of arguments; all subsequent functions must accept exactly one
 * - Type safety is enforced through function overloads (supporting 1-7 functions)
 * - At least one function must be provided (runtime error otherwise)
 * - Returns a new function that captures the pipeline in a closure
 *
 * @see {@link pipe} - For immediate pipeline execution without creating a reusable function
 * @see {@link identity} - Identity function useful for no-op composition
 * @see {@link constant} - Returns a function that always returns a fixed value
 */
export function flow<A extends any[], B>(
  fn1: (...args: A) => B,
): (...args: A) => B;
export function flow<A extends any[], B, C>(
  fn1: (...args: A) => B,
  fn2: (b: B) => C,
): (...args: A) => C;
export function flow<A extends any[], B, C, D>(
  fn1: (...args: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
): (...args: A) => D;
export function flow<A extends any[], B, C, D, E>(
  fn1: (...args: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
): (...args: A) => E;
export function flow<A extends any[], B, C, D, E, F>(
  fn1: (...args: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
): (...args: A) => F;
export function flow<A extends any[], B, C, D, E, F, G>(
  fn1: (...args: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
  fn6: (f: F) => G,
): (...args: A) => G;
export function flow<A extends any[], B, C, D, E, F, G, H>(
  fn1: (...args: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
  fn6: (f: F) => G,
  fn7: (g: G) => H,
): (...args: A) => H;
export function flow(
  ...fns: Array<(...args: any[]) => any>
): (...args: any[]) => any {
  return (...args: any) =>
    fns.slice(1).reduce((acc, fn) => fn(acc), fns.at(0)!(...args));
}

// Usage examples:
// const add = (x: number) => (y: number) => x + y;
// const multiply = (x: number) => (y: number) => x * y;
// const toString = (x: number) => x.toString();
// const addExclamation = (x: string) => x + "!";

// const result1 = flow(add(3))(5); // => 8
// const result2 = flow(add(3), multiply(2))(5); // => 16
// const result3 = flow(add(3), multiply(2), toString)(5); // => "16"
// const result4 = flow(add(3), multiply(2), toString, addExclamation)(5); // => "16!";

/******************************************************************************
 * Compose
 *****************************************************************************/

type GenericFunction = (...args: any[]) => any;

type LastFnArgs<F extends Array<GenericFunction>> = F extends [
  ...any[],
  (...arg: infer R) => any,
]
  ? R
  : never;

type FirstFnReturnType<F extends Array<GenericFunction>> = F extends [
  (...arg: any) => infer R,
  ...any[],
]
  ? R
  : never;

type compose<F extends GenericFunction[]> = (
  ...args: LastFnArgs<F>
) => FirstFnReturnType<F>;

/**
 * Composes functions in right-to-left order, creating a pipeline where each function
 * receives the output of the function to its right.
 *
 * Creates a new function that, when invoked, executes the provided functions from right to left.
 * The last function (rightmost) receives all arguments passed to the composed function,
 * and each preceding function receives the single return value of the function to its right.
 *
 * @template A - Tuple type representing the input arguments of the last (rightmost) function
 * @template B - Return type of the last function (input type of the second-to-last)
 * @template C - Return type of the second-to-last function (input type of the third-to-last)
 * @template D - Return type of the third-to-last function
 * @template E - Return type of the fourth-to-last function
 * @template F - Return type of the fifth-to-last function
 * @template G - Return type of the sixth-to-last function
 * @template H - Return type of the seventh-to-last function
 * @template I - Return type of the eighth-to-last function
 * @template J - Return type of the ninth-to-last function
 * @template K - Return type of the tenth-to-last function (final output type)
 *
 * @param {...((...args: any[]) => any)} fns - Functions to compose, executed right-to-left.
 *        Minimum of 2 functions required (1 transformation + 1 initial). Supports up to 10 functions
 *        with full type safety, after which type inference falls back to generic functions.
 *
 * @returns {(...args: any[]) => any} A new function that executes the pipeline right-to-left when called.
 *
 * @example
 * // Basic transformation (right-to-left execution)
 * const toNumber = (s: string) => Number(s);
 * const double = (n: number) => n * 2;
 * const toCurrency = (n: number) => `$${n.toFixed(2)}`;
 *
 * const processPrice = compose(toCurrency, double, toNumber);
 * processPrice("19.99"); // "$39.98"
 * // Execution: toNumber("19.99") → double(19.99) → toCurrency(39.98)
 *
 * @example
 * // Data transformation with filtering
 * const getUsers = () => [
 *   { name: "Alice", age: 25 },
 *   { name: "Bob", age: 17 },
 *   { name: "Charlie", age: 30 }
 * ];
 * const filterAdults = (users: Array<{ name: string; age: number }>) =>
 *   users.filter(u => u.age >= 18);
 * const extractNames = (users: Array<{ name: string }>) => users.map(u => u.name);
 * const sortNames = (names: string[]) => names.sort();
 *
 * const getAdultNames = compose(sortNames, extractNames, filterAdults, getUsers);
 * console.log(getAdultNames()); // ["Alice", "Charlie"]
 *
 * @example
 * // Async operations (right-to-left)
 * const fetchUser = (id: number) => fetch(`/api/users/${id}`).then(r => r.json());
 * const formatUser = (user: { name: string; id: number }) =>
 *   `${user.name} (ID: ${user.id})`;
 * const logUser = (formatted: string) => {
 *   console.log(formatted);
 *   return formatted;
 * };
 *
 * const getUserDisplay = compose(logUser, formatUser, fetchUser);
 * await getUserDisplay(123);
 *
 * @example
 * // Framework integration (NestJS)
 * @Injectable()
 * export class OrderService {
 *   private processOrder = compose(
 *     (finalized: any) => this.saveToDatabase(finalized),
 *     (withDiscount: any) => this.applyDiscount(withDiscount),
 *     (validated: any) => this.calculateTotal(validated),
 *     (dto: CreateOrderDto) => this.validateOrder(dto)
 *   );
 *
 *   async createOrder(dto: CreateOrderDto) {
 *     return this.processOrder(dto);
 *   }
 * }
 *
 * @example
 * // Compare with flow (opposite execution direction)
 * // flow: left-to-right (natural reading order)
 * const withFlow = flow(toNumber, double, toCurrency);
 *
 * // compose: right-to-left (mathematical composition)
 * const withCompose = compose(toCurrency, double, toNumber);
 * // Both produce the same result for "19.99" → "$39.98"
 *
 * @example
 * // Multiple arguments in initial function
 * const add = (a: number, b: number) => a + b;
 * const multiplyBy3 = (n: number) => n * 3;
 * const toString = (n: number) => `Result: ${n}`;
 *
 * const operation = compose(toString, multiplyBy3, add);
 * console.log(operation(5, 7)); // "Result: 36"
 * // add(5, 7) → multiplyBy3(12) → toString(36)
 *
 * @remarks
 * - The rightmost (last) function can accept any number of arguments; all preceding functions must accept exactly one
 * - Execution order is right-to-left, which is mathematical function composition: compose(f, g)(x) = f(g(x))
 * - At least 2 functions must be provided (1 transformation + 1 initial function)
 * - Type safety is enforced through function overloads (supporting 2-10 functions)
 * - Beyond 10 functions, type inference falls back to generic functions with less strict typing
 * - This is the dual of `flow` which executes left-to-right
 *
 * @see {@link flow} - For left-to-right function composition (opposite execution direction)
 * @see {@link pipe} - For immediate left-to-right pipeline execution
 * @see {@link identity} - Identity function useful for no-op composition
 */

export function compose<A extends any[], B, C>(
  f1: (b: B) => C,
  f2: (...a: A) => B,
): (...a: A) => C;

export function compose<A extends any[], B, C, D>(
  f1: (c: C) => D,
  f2: (b: B) => C,
  f3: (...a: A) => B,
): (...a: A) => D;

export function compose<A extends any[], B, C, D, E>(
  f1: (d: D) => E,
  f2: (c: C) => D,
  f3: (b: B) => C,
  f4: (...a: A) => B,
): (...a: A) => E;

export function compose<A extends any[], B, C, D, E, F>(
  f1: (e: E) => F,
  f2: (d: D) => E,
  f3: (c: C) => D,
  f4: (b: B) => C,
  f5: (...a: A) => B,
): (...a: A) => F;

export function compose<A extends any[], B, C, D, E, F, G>(
  f1: (f: F) => G,
  f2: (e: E) => F,
  f3: (d: D) => E,
  f4: (c: C) => D,
  f5: (b: B) => C,
  f6: (...a: A) => B,
): (...a: A) => G;

export function compose<A extends any[], B, C, D, E, F, G, H>(
  f1: (g: G) => H,
  f2: (f: F) => G,
  f3: (e: E) => F,
  f4: (d: D) => E,
  f5: (c: C) => D,
  f6: (b: B) => C,
  f7: (...a: A) => B,
): (...a: A) => H;

export function compose<A extends any[], B, C, D, E, F, G, H, I>(
  f1: (h: H) => I,
  f2: (g: G) => H,
  f3: (f: F) => G,
  f4: (e: E) => F,
  f5: (d: D) => E,
  f6: (c: C) => D,
  f7: (b: B) => C,
  f8: (...a: A) => B,
): (...a: A) => I;

export function compose<A extends any[], B, C, D, E, F, G, H, I, J>(
  f1: (i: I) => J,
  f2: (h: H) => I,
  f3: (g: G) => H,
  f4: (f: F) => G,
  f5: (e: E) => F,
  f6: (d: D) => E,
  f7: (c: C) => D,
  f8: (b: B) => C,
  f9: (...a: A) => B,
): (...a: A) => J;

export function compose<A extends any[], B, C, D, E, F, G, H, I, J, K>(
  f1: (j: J) => K,
  f2: (i: I) => J,
  f3: (h: H) => I,
  f4: (g: G) => H,
  f5: (f: F) => G,
  f6: (e: E) => F,
  f7: (d: D) => E,
  f8: (c: C) => D,
  f9: (b: B) => C,
  f10: (...a: A) => B,
): (...a: A) => K;

// After 10 parameters it only takes the initial function's parameter and the last function result
export function compose<Fns extends GenericFunction[]>(
  ...fns: Fns
): compose<Fns>;

export function compose(...fns: GenericFunction[]): (...args: any[]) => any {
  return (...args: any) =>
    fns.slice(0, -1).reduceRight((acc, fn) => fn(acc), fns.at(-1)!(...args));
}

// Usage with different types
// const toUpperCase = (str: string) => str.toUpperCase();
// const addExclamation = (str: string) => str + "!";
// const repeat = (str: string) => str + " " + str;

// const processString = compose(repeat, addExclamation, toUpperCase);

/******************************************************************************
 * Pipe
 *****************************************************************************/

/**
 * Pipes a value through a series of functions in left-to-right order, executing
 * the pipeline immediately and returning the final result.
 *
 * Takes an initial value and applies a series of functions to it sequentially,
 * where each function receives the output of the previous function. The execution
 * is immediate (eager) rather than creating a reusable function like `flow`.
 *
 * @template A - The type of the initial value
 * @template B - Return type of the first function (input type of the second)
 * @template C - Return type of the second function (input type of the third)
 * @template D - Return type of the third function (input type of the fourth)
 * @template E - Return type of the fourth function (input type of the fifth)
 * @template F - Return type of the fifth function (input type of the sixth)
 * @template G - Return type of the sixth function (input type of the seventh)
 * @template H - Return type of the seventh function (final result type)
 *
 * @param {A} value - The initial value to pass through the pipeline
 * @param {...((arg: any) => any)} fns - Functions to apply in sequence (left-to-right).
 *        Supports up to 7 functions with full type safety.
 *
 * @returns {any} The final result after passing through all functions
 *
 * @example
 * // Basic transformation pipeline
 * const result = pipe(
 *   "19.99",
 *   (s: string) => Number(s),
 *   (n: number) => n * 2,
 *   (n: number) => `$${n.toFixed(2)}`
 * );
 * console.log(result); // "$39.98"
 *
 * @example
 * // Data filtering and transformation
 * const users = [
 *   { name: "Alice", age: 25 },
 *   { name: "Bob", age: 17 },
 *   { name: "Charlie", age: 30 }
 * ];
 *
 * const result = pipe(
 *   users,
 *   (u) => u.filter(person => person.age >= 18),
 *   (adults) => adults.map(person => person.name),
 *   (names) => names.sort()
 * );
 * console.log(result); // ["Alice", "Charlie"]
 *
 * @example
 * // Async operations
 * const result = await pipe(
 *   123,
 *   (id: number) => fetch(`/api/users/${id}`).then(r => r.json()),
 *   (user) => `${user.name} (ID: ${user.id})`,
 *   (formatted) => {
 *     console.log(formatted);
 *     return formatted;
 *   }
 * );
 *
 * @example
 * // Framework integration (NestJS controller)
 * @Controller('orders')
 * export class OrderController {
 *   @Post()
 *   async createOrder(@Body() dto: CreateOrderDto) {
 *     return pipe(
 *       dto,
 *       (data) => this.validateOrder(data),
 *       (validated) => this.calculateTotal(validated),
 *       (withTotal) => this.applyDiscount(withTotal),
 *       (finalized) => this.saveToDatabase(finalized)
 *     );
 *   }
 * }
 *
 * @example
 * // Chaining with optionals/null handling
 * const result = pipe(
 *   config,
 *   (cfg) => cfg.database?.url,
 *   (url) => url ?? 'localhost:5432',
 *   (connectionString) => new Database(connectionString),
 *   (db) => db.connect()
 * );
 *
 * @example
 * // Comparison with flow (reusable vs immediate)
 * // pipe: immediate execution
 * const result = pipe(5, add1, double); // 12
 * 
 * // flow: creates reusable function
 * const transform = flow(add1, double);
 * const laterResult = transform(5); // 12
 *
 * @example
 * // Error handling with Either/Result
 * const safeParse = (json: string) => {
 *   try { return Either.right(JSON.parse(json)); }
 *   catch { return Either.left('Invalid JSON'); }
 * };
 *
 * const result = pipe(
 *   '{"name":"John"}',
 *   safeParse,
 *   Either.map((data) => data.name),
 *   Either.getOrElse(() => 'Unknown')
 * );
 * console.log(result); // "John"
 *
 * @remarks
 * - Each function must accept exactly one argument (the output of the previous function)
 * - The initial value can be of any type, including void or undefined
 * - Execution is immediate (eager evaluation), not lazy
 * - Type safety is enforced through function overloads (supporting up to 7 functions)
 * - This is the immediate-execution counterpart to `flow` (which returns a reusable function)
 * - For right-to-left composition, use `compose` instead
 *
 * @see {@link flow} - Returns a reusable function instead of executing immediately
 * @see {@link compose} - Right-to-left function composition
 * @see {@link identity} - Identity function useful for no-op in pipelines
 */
export function pipe<A>(value: A): A;
export function pipe<A, B>(value: A, fn1: (a: A) => B): B;
export function pipe<A, B, C>(value: A, fn1: (a: A) => B, fn2: (b: B) => C): C;
export function pipe<A, B, C, D>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
): D;
export function pipe<A, B, C, D, E>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
): E;
export function pipe<A, B, C, D, E, F>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
): F;
export function pipe<A, B, C, D, E, F, G>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
  fn6: (f: F) => G,
): G;
export function pipe<A, B, C, D, E, F, G, H>(
  value: A,
  fn1: (a: A) => B,
  fn2: (b: B) => C,
  fn3: (c: C) => D,
  fn4: (d: D) => E,
  fn5: (e: E) => F,
  fn6: (f: F) => G,
  fn7: (g: G) => H,
): H;
export function pipe(initial: any, ...fns: Array<(arg: any) => any>): any {
  return fns.reduce((result, fn) => fn(result), initial);
}

// Usage examples:
// const add = (x: number) => (y: number) => x + y;
// const multiply = (x: number) => (y: number) => x * y;
// const toString = (x: number) => x.toString();
// const addExclamation = (x: string) => x + "!";

// const result1 = pipe(5, add(3)); // => 8
// const result2 = pipe(5, add(3), multiply(2)); // => 16
// const result3 = pipe(5, add(3), multiply(2), toString); // => "16"
// const result4 = pipe(5, add(3), multiply(2), toString, addExclamation); // => "16!"
