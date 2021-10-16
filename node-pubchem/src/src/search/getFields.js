import Debug from 'debug';

const debug = Debug('getFields');

function getFields(fields = '') {
  let result = { id: '$_id' };
  for (let field of fields.split(',').filter((field) => field)) {
    result[field] = 1;
  }
  debug(`List of required fields: ${JSON.stringify(result)}`);
  return result;
}

export default getFields;
