import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('ids search (npasses)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('npasses');
    if ((await collection.countDocuments()) === 6) {
      console.log('npasses collection is ready');
      break;
    }
  }
  const request = {
    query: {
      ids: 'NPC491455, NPC491456',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "ocl",
      "cid",
      "activities",
    ]
  `);
  expect(results.data).toMatchSnapshot();
});
