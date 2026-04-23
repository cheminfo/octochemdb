import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('ids search (lotusesV2)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('lotusesV2');
    if ((await collection.countDocuments()) === 20) {
      break;
    }
  }
  const request = {
    query: {
      ids: 'Q60235, Q312266',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "ocl",
      "inchiKey",
      "taxonomies",
    ]
  `);
  if (results?.data) {
    for (const entry of results.data) {
      delete entry.data.ocl.coordinates;
    }
  }
  expect(results.data).toMatchSnapshot();
  await connection.close();
});
