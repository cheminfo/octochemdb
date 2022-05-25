import { join } from 'path';

import parseBioactivities from '../parseBioactivities.js';

//remove process.env.TEST from parseBioactivities to use this test
jest.setTimeout(30000);
test('parseBioactivities', async () => {
  const activity = join(__dirname, 'data/bioactivities.tsv.gz');
  const bioassays = join(__dirname, 'data/bioassays.tsv.gz');
  let results = [];
  for await (let result of parseBioactivities(activity, bioassays)) {
    results.push(result);
  }
  expect(results).toMatchSnapshot();
});
