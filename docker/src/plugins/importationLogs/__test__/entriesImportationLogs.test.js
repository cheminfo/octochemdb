import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';
import search from '../routes/v1/entriesImportationLogs.js';

test('search (importationLogs)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('importationLogs');
    if ((await collection.countDocuments()) === 22) {
      break;
    }
  }
  const request = {
    query: {
      collectionName: 'compounds',
      fields: 'collectionName,sources,status',
    },
  };

  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0])).toMatchInlineSnapshot(`
    [
      "_id",
      "collectionName",
      "sources",
      "status",
    ]
  `);
});
