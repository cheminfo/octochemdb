'use strict';

var moleculesFromEm = require('../moleculesFromMf');

test('moleculeByMf.js', async () => {
  await expect(moleculesFromEm()).rejects.toEqual(new Error('mf parameter must be specified'));
});
