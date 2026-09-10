import countryCodes from './country-codes.json'
import moment from 'moment'
import * as piping_helpers from '@/lib/piping'
import type { RenderContext } from '@/lib/render'

export default (
  context: RenderContext
) => {
  return {
    ...context.jsonResume,
    /**************************************************************************
     * Helpers
     *************************************************************************/
    globals: {
      MAX_LINE_LENGTH: 120,
      DEFAULT_ICON_WIDTH: '1.0em',
    },
    ...piping_helpers,
    // compose,
    // pipe,
    // map,
    // spread,
    // range,
    // toArray,
    // not,
    // or,
    // and,
    // isEmpty,
    // notEmpty,
    // filterEmpty,
    // join,
    // concat,
    // truncate,
    // words,
    // trim,
    range,
    formatMarkdown,
    formatDate,
    formatRatingWord,
    countryCodeToName
  };
}

/******************************************************************************
 * Source helpers
 *****************************************************************************/

// function compose (
//   ...fns: Array<(...args: any[]) => any>
// ): (...args: any[]) => any {
//   return (
//     ...args: any
//   ) =>
//     fns
//     .slice(1)
//     .reduce(
//       (acc, fn) => fn(acc), 
//       fns.at(0)!(...args)
//     );
// }

// function pipe(
//   initial: any, 
//   ...fns: Array<(arg: any) => any>
// ): any {
//   return compose(...fns)(initial)
// }

function* range(
  start: number,
  end: number,
  step: number = 1
) {
  for (let i = start; i <= end; i += step) {
    yield i;
  }
}

/******************************************************************************
 * Mapper helpers
 *****************************************************************************/

// function map <Arg, Res>(
//   mapper: (value: Arg, index: number) => Res
// ) {
//   return (arr: Arg[]) => 
//     arr.map(mapper)
// }

// function spread <
//   Args extends readonly any[], 
//   Res
// > (
//   command: (...args: Args) => Res
// ) {
//   return  (
//     args: Args
//   ) => command(...args)
// }

// function not () {
//   return (
//     target: boolean
//   ) => !target
// }

// function or () {
//   return (
//     ...targets: boolean[]
//   ) => {
//     return targets.some(i => !!i)
//   }
// }

// function and () {
//   return (
//     ...targets: boolean[]
//   ) => {
//     return targets.every(i => !!i)
//   }
// }

// function isEmpty () {
//   return (
//     target: any
//   ) => (
//     target == null 
//     || (typeof target === 'string' && target === '')
//     || (Array.isArray(target) && target.length === 0)
//     || (typeof target === 'object' && Object.keys(target).length === 0)
//   )
// }

// function notEmpty () {
//   return (
//     target: any
//   ) => pipe(
//     target,
//     isEmpty(),
//     not()
//   )
// }

// function filterEmpty () {
//   return (
//     targets: string[]
//   ) => targets
//     .filter(item => !isEmpty()(item))
// }

// function join (
//   separator: string,
// ) {
//   return (
//     parts: string[]
//   ) => 
//     parts.join(separator)
// }

// function concat (
//   ...args: any[]
// ) {
//   return (
//     target: string | any[]
//   ) => {
//     if (typeof target === 'string') {
//       return args.reduce((str, curr) => str + String(curr), target)
//     } else if (Array.isArray(target)) {
//       return args.flat().concat(...target)
//     } else {
//       throw Error(`Target: ${target} should be string or array type`)
//     }
//   }
// }

// function toArray () {
//   return <T>(
//     target: Generator<T, void, unknown>
//   ) => {
//     return Array.from(target)
//   }
// }

// function words (
//   start: number,
//   end?: number
// ) {
//   return (
//     target: string,
//   ) => pipe(
//     target,
//     str => str.trim(),
//     // Remove duplucated spaces
//     str => str.replace(/\s{2,}/g, ' '),
//     str => str.split(' '),
//     parts => parts.slice(start, end),
//     parts => parts.join(' ')
//   )
// }

// function trim () {
//   return (
//     target: string
//   ) => target.trim()
// }

// function truncate (
//   maxSize: number
// ) {
//   return (
//     target: string
//   ) => target.length > maxSize
//     ? target.slice(0, maxSize)
//     : target
// }

function formatMarkdown() {
  return (
    content: string
  ) => content
    .split(/\n{2,}/g)
    .map(block => 
      block
        .split("\n")
        .join("\n\n")
    )
    .join("\n \\\\ \\\\ \n");
}

function formatDate (
  format: string
) {
  return (
    date: Date, 
  ) => moment(date)
    .format(format) 
} 

function formatRatingWord (
  dictionary={
    0: 'Inexperienced',
    1: 'Beginner',
    2: 'Skilled',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert',
  }
) {
  return (
    target: number | string
  ) => {
    if (Object.hasOwn(dictionary, target)) {
      return dictionary[target as keyof typeof dictionary]
    } {
      throw new Error(
        `Level ${target} it not valid for a rating word, valid options: ${JSON.stringify(dictionary, null, 4)}`
      )
    }
  }
}

function countryCodeToName (
) {
  return (
    code: string
  ): string => {
    try {
      return countryCodes[
        code as keyof typeof countryCodes
      ] as string
    } catch {
      throw new Error(`Country code: ${code} doesn't exist in directory`)
    }
  }
}


