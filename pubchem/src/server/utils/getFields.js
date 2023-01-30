import debugLibrary from '../../utils/Debug.js';

const debug = debugLibrary('getFields');

export function getFields(fields = '') {
  let result = { id: '$_id' };
  for (let field of fields.split(',').filter((field) => field)) {
    result[field] = 1;
  }
  debug(`List of required fields: ${JSON.stringify(result)}`);
  return result;
}
