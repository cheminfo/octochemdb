import { readFileSync } from 'fs';
import { join } from 'path';

import { taxonomyParser } from '../taxonomyParser';

test('taxonomyParser', () => {
  const results = [];
  const arrayBuffer = readFileSync(join(__dirname, 'data/test.dmp'));
  for (const entry of taxonomyParser(arrayBuffer)) {
    results.push(entry);
  }

  expect(results).toMatchSnapshot();
});
