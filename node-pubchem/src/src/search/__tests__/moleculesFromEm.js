'use strict';

var moleculesFromEm = require('../moleculesFromEm');

test('moleculeByEm.js', async () => {
  await expect(moleculesFromEm()).rejects.toEqual(new Error('em parameter must be specified'));
});
