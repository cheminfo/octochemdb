import { join } from 'path';
import { hasUncaughtExceptionCaptureCallback } from 'process';
import { resourceLimits } from 'worker_threads';

import { ncbiTaxonomyConvert } from '../ncbiTaxonomyParser';

test('ncbiTaxonomyParser', async () => {
  const results = [];
  await ncbiTaxonomyConvert(join(__dirname, 'data/test.dmp'), {
    callback: (entry) => results.push(entry),
  });
  expect(results).toHaveLength(16);
  expect(results).toMatchSnapshot();
});
