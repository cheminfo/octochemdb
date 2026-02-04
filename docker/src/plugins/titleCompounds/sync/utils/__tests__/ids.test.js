import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('ids search (titleCompounds)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('titleCompounds');
    if ((await collection.countDocuments()) === 10000) {
      break;
    }
  }
  const request = {
    query: {
      ids: '275, 277',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "title",
    ]
  `);
  expect(results.data).toMatchInlineSnapshot(`
    [
      {
        "_id": 275,
        "data": {
          "title": "DL-Canavanine",
        },
      },
      {
        "_id": 277,
        "data": {
          "title": "Carbamic acid",
        },
      },
    ]
  `);
  await connection.close();
});
