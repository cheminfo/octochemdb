import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('id search (compoundPatents)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('compoundPatents');
    if ((await collection.countDocuments()) === 4502) {
      break;
    }
  }
  const request = {
    query: {
      ids: '1, 2',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "patents",
      "nbPatents",
    ]
  `);
  expect(results.data).toMatchSnapshot();
  await connection.close();
});
