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
  expect('data' in results).toBe(true);
  if (!('data' in results)) throw new Error('Expected data in results');
  const /** @type {any} */ data = results.data;
  expect(Object.keys(data[0].data)).toMatchInlineSnapshot(`
    [
      "ocl",
      "inchiKey",
      "taxonomies",
    ]
  `);
  for (const entry of data) {
    delete entry.data.ocl.coordinates;
  }
  expect(data).toMatchSnapshot();
  await connection.close();
});
