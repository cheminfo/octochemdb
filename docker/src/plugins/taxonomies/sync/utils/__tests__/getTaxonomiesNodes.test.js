import { readFileSync } from 'fs';
import { join } from 'path';

import { test, expect } from 'vitest';

import { getTaxonomiesNodes } from '../getTaxonomiesNodes.js';

test(
  'getTaxonomiesNodes',
  () => {
    const arrayBuffer = readFileSync(join(__dirname, 'data/nodesTest.dmp'));
    const result = getTaxonomiesNodes(arrayBuffer);
    expect(result).toMatchSnapshot();
  },
  { timeout: 30000 },
);
