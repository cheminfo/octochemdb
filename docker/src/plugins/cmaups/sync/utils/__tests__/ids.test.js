import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('id search (cmaups)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('cmaups');
    if ((await collection.countDocuments()) === 19) {
      break;
    }
  }
  const request = {
    query: {
      ids: 'NPC26601,NPC222524',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "ocl",
      "cid",
      "commonName",
      "chemblId",
    ]
  `);
  expect(results.data).toMatchSnapshot();
});
