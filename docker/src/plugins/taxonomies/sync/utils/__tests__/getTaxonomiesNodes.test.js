import { readFileSync } from 'fs';
import { join } from 'path';

import { getTaxonomiesNodes } from '../getTaxonomiesNodes.js';

test('getTaxonomiesNodes', () => {
  const arrayBuffer = readFileSync(join(__dirname, 'data/nodesTest.dmp'));
  const result = getTaxonomiesNodes(arrayBuffer);
  expect(result).toMatchSnapshot();
});
