import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('ids search (substances)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('substances');
    if ((await collection.countDocuments()) === 20) {
      break;
    }
  }
  const request = {
    query: {
      ids: '475724934, 475724938',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "ocl",
      "mf",
      "em",
      "charge",
      "mw",
      "nbFragments",
      "unsaturation",
      "atoms",
      "cids",
    ]
  `);
  expect(results.data).toMatchSnapshot();
});
