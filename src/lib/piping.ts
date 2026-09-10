import { compose, pipe, flow } from '@/lib/purify'

export { compose, pipe, flow } from '@/lib/purify'

/******************************************************************************
 * Mappers
 *****************************************************************************/

export function map <Arg, Res>(
  mapper: (value: Arg, index: number) => Res
) {
  return (arr: Arg[]) => 
    arr.map(mapper)
}

export function spread <
  Args extends readonly any[], 
  Res
> (
  command: (...args: Args) => Res
) {
  return  (
    args: Args
  ) => command(...args)
}

export function not () {
  return (
    target: boolean
  ) => !target
}

function or () {
  return (
    ...targets: boolean[]
  ) => {
    return targets.some(i => !!i)
  }
}

export function and () {
  return (
    ...targets: boolean[]
  ) => {
    return targets.every(i => !!i)
  }
}

export function isEmpty () {
  return (
    target: any
  ) => (
    target == null 
    || (typeof target === 'string' && target === '')
    || (Array.isArray(target) && target.length === 0)
    || (typeof target === 'object' && Object.keys(target).length === 0)
  )
}

export function notEmpty () {
  return (
    target: any
  ) => pipe(
    target,
    isEmpty(),
    not()
  )
}

export function filterEmpty () {
  return (
    targets: string[]
  ) => targets
    .filter(item => !isEmpty()(item))
}

export function join (
  separator: string,
) {
  return (
    parts: string[]
  ) => 
    parts.join(separator)
}

export function concat (
  ...args: any[]
) {
  return (
    target: string | any[]
  ) => {
    if (typeof target === 'string') {
      return args.reduce((str, curr) => str + String(curr), target)
    } else if (Array.isArray(target)) {
      return args.flat().concat(...target)
    } else {
      throw Error(`Target: ${target} should be string or array type`)
    }
  }
}

export function toArray () {
  return <T>(
    target: Generator<T, void, unknown>
  ) => {
    return Array.from(target)
  }
}

export function words (
  start: number,
  end?: number
) {
  return (
    target: string,
  ) => pipe(
    target,
    str => str.trim(),
    // Remove duplicated spaces
    str => str.replace(/\s{2,}/g, ' '),
    str => str.split(' '),
    parts => parts.slice(start, end),
    parts => parts.join(' ')
  )
}

export function trim () {
  return (
    target: string
  ) => target.trim()
}

export function truncate (
  maxSize: number
) {
  return (
    target: string
  ) => target.length > maxSize
    ? target.slice(0, maxSize)
    : target
}