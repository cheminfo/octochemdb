'use strict';

function getFields(fields = '') {
  let result = { id: '$_id' };
  for (let field of fields.split(',')) {
    result[field] = 1;
  }
  return result;
}

module.export = getFields;
