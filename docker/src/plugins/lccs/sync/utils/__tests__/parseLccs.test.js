import { join } from 'path';

import { test, expect } from 'vitest';

import { getGHS } from '../getGHS.js';
import { parseLccs } from '../parseLccs.js';

test('parseLccs', async () => {
  const pathGhs = join(__dirname, '/data/ghs.txt');

  const { hCodes, pCodes } = await getGHS(pathGhs);
  const path = join(__dirname, '/data/test.xml');
  let results = [];
  for await (let entry of parseLccs(path, { hCodes, pCodes })) {
    results.push(entry);
  }

  expect(Object.keys(results[2].data)).toMatchInlineSnapshot(`
    [
      "description",
      "pictograms",
      "hCodesDescription",
      "pCodesDescription",
      "signals",
      "physicalProperties",
      "toxicalInformation",
      "exposureLimits",
      "healthAndSymptoms",
      "firstAid",
      "flammabilityAndExplosivity",
      "stabilityAndReactivity",
      "storageAndHandling",
      "cleanUpAndDisposal",
    ]
  `);
  expect(results.length).toBe(4);
  expect(results[2]).toMatchSnapshot();
});
