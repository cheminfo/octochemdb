import { readFileSync } from 'fs';
import { join } from 'path';

import { test, expect } from 'vitest';

import { parseTaxonomies } from '../parseTaxonomies';

test(
  'taxonomyParser',
  () => {
    const results = [];
    const arrayBuffer = readFileSync(
      join(__dirname, 'data/rankedLineageTest.dmp'),
    );
    const nodes = readFileSync(join(__dirname, 'data/nodesTest.dmp'));
    let i = 0;
    for (const entry of parseTaxonomies(arrayBuffer, nodes)) {
      if (i > 40) {
        break;
      }
      i++;
      results.push(entry);
    }
    expect(results).toMatchSnapshot();
  },
  { timeout: 30000 },
);
