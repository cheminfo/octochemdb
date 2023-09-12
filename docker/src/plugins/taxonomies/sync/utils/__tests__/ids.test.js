import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('ids search (taxonomies)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('taxonomies');
    if ((await collection.countDocuments()) === 20) {
      break;
    }
  }
  const request = {
    query: {
      ids: '2798921, 2841639',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "superkingdom",
      "phylum",
      "class",
    ]
  `);
  expect(results.data).toMatchSnapshot();
});
