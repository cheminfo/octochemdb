import { join } from 'path';

import parseBioactivities from '../parseBioactivities.js';
// remove process.env.TEST from parseBioactivities to use this test
test('parseBioactivities', async () => {
  const activity = join(
    __dirname,
    '../../../../../../../originalData/bioassay/full/bioactivities.2022-04-17.gz',
  );
  const bioassays = join(
    __dirname,
    '../../../../../../../originalData/bioassay/full/bioassays.2022-04-17.gz',
  );
  console.log(bioassays);
  let results = [];
  for await (const result of parseBioactivities(activity, bioassays)) {
    if (results.length > 10) break;
    results.push(result);
  }
  expect(results).toMatchSnapshot();
});
