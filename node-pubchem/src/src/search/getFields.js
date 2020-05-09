'use strict';

const debug = require('debug')('getFields');

function getFields(fields = '') {
  let result = { id: '$_id' };
  for (let field of fields.split(',')) {
    result[field] = 1;
  }
  debug(`List of required fields: ${JSON.stringify(result)}`);
  return result;
}

module.exports = getFields;
