import { readFileSync } from 'fs';
import { join } from 'path';

import { test, expect } from 'vitest';

import { getTaxonomiesNodes } from '../getTaxonomiesNodes.js';

test('getTaxonomiesNodes', async () => {
  const arrayBuffer = readFileSync(join(__dirname, 'data/nodesTest.dmp'));
  const result = await getTaxonomiesNodes(arrayBuffer);
  expect(result).toMatchSnapshot();
});
