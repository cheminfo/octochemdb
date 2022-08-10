import { readFileSync } from 'fs';
import { join } from 'path';

import { getTaxonomiesNodes } from '../getTaxonomiesNodes.js';
/**
 * test getTaxonomiesNodes
 * @param {ArrayBuffer} arrayBuffer
 *
 */

test('getTaxonomiesNodes', () => {
  const arrayBuffer = readFileSync(join(__dirname, 'data/nodesTest.dmp'));
  const result = getTaxonomiesNodes(arrayBuffer);
  const results = [];
  for (const entry of Object.keys(result)) {
    results.push({ [entry]: result[entry] });
  }
  expect(results[2]).toStrictEqual({
    6: 'genus',
  });

  expect(results[3]).toStrictEqual({
    7: 'species',
  });

  expect(results[4]).toStrictEqual({
    9: 'species',
  });

  expect(results[5]).toStrictEqual({
    10: 'genus',
  });
});
