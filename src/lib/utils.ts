import util from 'util';
import { defaults } from 'lodash-es';


export const inspect = (
  obj: any,
  options: {
    depth?: number;
    maxLength?: number;
  } = {},
): string => {
  const _options = defaults(options, { depth: 8, maxLength: 5000 });
  const result = util.inspect(obj, {
    depth: _options.depth,
    colors: true,
    compact: false,
    showHidden: false, // Hide non-enumerable props
    sorted: true, // Sort keys
    getters: false, // Don't invoke getters
    showProxy: false,
  });
  return result.length >= _options.maxLength - 3
    ? `${result.slice(0, _options.maxLength - 3)} ...`
    : result;
};