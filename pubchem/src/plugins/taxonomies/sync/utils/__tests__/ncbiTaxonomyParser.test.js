import { readFileSync } from 'fs';
import { join } from 'path';

import { parseTaxonomies } from '../parseTaxonomies';

test('taxonomyParser', () => {
  const results = [];
  const arrayBuffer = readFileSync(join(__dirname, 'data/test.dmp'));
  for (const entry of parseTaxonomies(arrayBuffer)) {
    results.push(entry);
  }

  expect(results).toMatchSnapshot();
});
