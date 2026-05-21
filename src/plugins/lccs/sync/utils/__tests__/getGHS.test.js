import { join } from 'node:path';

import { expect, test } from 'vitest';

import { getGHS } from '../getGHS.js';

test('getGHS', async () => {
  const path = join(__dirname, '/data/ghs.txt');

  const { hCodes, pCodes } = await getGHS(path);

  expect(hCodes).toMatchSnapshot();
  expect(pCodes).toMatchSnapshot();
});
