import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('id search (bioassays)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('bioassays');
    if ((await collection.countDocuments()) === 20) {
      break;
    }
  }
  const request = {
    query: {
      ids: '59478_1,5351641_1',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  if (results?.data) {
    for (const entry of results.data) {
      delete entry.data.ocl.coordinates;
    }
  }
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "cid",
      "aid",
      "assay",
      "ocl",
      "targetTaxonomies",
    ]
  `);
  expect(results.data).toMatchSnapshot();
  await connection.close();
});
