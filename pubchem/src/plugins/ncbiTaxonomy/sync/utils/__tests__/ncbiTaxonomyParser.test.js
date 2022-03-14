import { readFileSync } from 'fs';
import { join } from 'path';

import { ncbiTaxonomyParser } from '../ncbiTaxonomyParser';

test('ncbiTaxonomyParser', () => {
  const results = [];
  const arrayBuffer = readFileSync(join(__dirname, 'data/test.dmp'));
  for (const entry of ncbiTaxonomyParser(arrayBuffer)) {
    results.push(entry);
  }
  expect(results).toHaveLength(16);
  expect(results).toMatchSnapshot();
});
