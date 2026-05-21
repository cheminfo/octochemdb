import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { getTaxonomiesNodes } from '../getTaxonomiesNodes.js';

test('getTaxonomiesNodes', async () => {
  const arrayBuffer = readFileSync(join(__dirname, 'data/nodesTest.dmp'));
  const result = await getTaxonomiesNodes(arrayBuffer);

  expect(result).toMatchSnapshot();
});
