import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

import { parseTaxonomies } from '../parseTaxonomies';

test('taxonomyParser', async () => {
  const results = [];
  const arrayBuffer = readFileSync(
    join(__dirname, 'data/rankedLineageTest.dmp'),
  );
  const nodes = readFileSync(join(__dirname, 'data/nodesTest.dmp'));
  let i = 0;
  for await (const entry of parseTaxonomies(arrayBuffer, nodes)) {
    if (i > 40) {
      break;
    }
    i++;
    results.push(entry);
  }

  expect(results).toMatchSnapshot();
});
