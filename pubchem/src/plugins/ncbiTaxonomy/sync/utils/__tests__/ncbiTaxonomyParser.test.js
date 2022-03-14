import { join } from 'path';

import { ncbiTaxonomyParser } from '../ncbiTaxonomyParser';

test('ncbiTaxonomyParser', async () => {
  const results = [];
  await ncbiTaxonomyParser(join(__dirname, 'data/test.dmp'), {
    callback: (entry) => results.push(entry),
  });
  expect(results).toHaveLength(16);
  expect(results).toMatchSnapshot();
});
