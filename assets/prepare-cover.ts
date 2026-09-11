import * as piping_helpers from '@/lib/piping'
import type { RenderContext } from '@/lib/render'

export default (
  context: RenderContext
) => {
  if (! context.markdown) {
    throw new Error(`This document requires a markdown document`)
  }

  const { data, content } = context.markdown
  return {
    context: {
      ...data,
      content
    },
    ...piping_helpers,
  }
}
