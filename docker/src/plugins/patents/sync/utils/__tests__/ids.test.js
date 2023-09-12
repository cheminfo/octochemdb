import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('ids search (patents)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('patents');
    if ((await collection.countDocuments()) === 255) {
      break;
    }
  }
  const request = {
    query: {
      ids: 'EP-2078065-A2, US-10334499-B2',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "title",
      "nbCompounds",
      "abstract",
    ]
  `);
  expect(results.data).toMatchSnapshot();
});
