//import debugLibrary from '../../utils/Debug.js';

//const debug = debugLibrary('getFields');

export function getFields(fields = '') {
  let result = { _id: 1 };
  for (let field of fields.split(',').filter((field) => field)) {
    result[field] = 1;
  }
  return result;
}
