import moment from 'moment'

import * as piping_helpers from '@/lib/piping'
import type { RenderContext } from '@/lib/render'
import countryCodes from './country-codes.json'

export default (
  context: RenderContext
) => {
  return {
    ...(context.jsonResume || {}),
    /**************************************************************************
     * Helpers
     *************************************************************************/
    globals: {
      MAX_LINE_LENGTH: 120,
      DEFAULT_ICON_WIDTH: '1.0em',
    },
    ...piping_helpers,
    range,
    formatMarkdown,
    formatDate,
    formatRatingWord,
    countryCodeToName
  }
}

/******************************************************************************
 * Source helpers
 *****************************************************************************/

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


