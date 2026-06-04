import { expect, test } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('id search (bioassaysPubChem)', async () => {
  const connection = new OctoChemConnection();

  // Wait until the bioassaysPubChem collection has been populated by the sync test.
  while (true) {
    const collection = await connection.getCollection('bioassaysPubChem');
    if ((await collection.countDocuments()) > 0) {
      break;
    }
  }

  const request = {
    query: {
      ids: '22001',
      fields: 'data',
    },
  };
  const results = await search.handler(request);

  expect(results.data?.[0]?._id).toBe(22001);
  expect(Object.keys(results.data?.[0]?.data ?? {})).toMatchInlineSnapshot(`
    [
      "name",
      "description",
      "comment",
      "associatedCIDs",
      "results",
      "sids",
    ]
  `);
  expect(results.data).toMatchSnapshot();

  await connection.close();
});
