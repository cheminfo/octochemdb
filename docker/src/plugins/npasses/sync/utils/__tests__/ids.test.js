import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('ids search (npasses)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('npasses');
    if ((await collection.countDocuments()) === 12) {
      break;
    }
  }
  const request = {
    query: {
      ids: 'NPC100353, NPC100380',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "ocl",
      "cid",
    ]
  `);
  expect(results.data).toMatchSnapshot();
});
