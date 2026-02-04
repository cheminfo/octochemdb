import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('id search (massBank)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('massBank');
    if ((await collection.countDocuments()) === 2) {
      break;
    }
  }
  const request = {
    query: {
      ids: 'MSBNK-AAFC-AC000854',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "ocl",
      "spectrum",
      "em",
      "mf",
    ]
  `);
  expect(results.data).toMatchSnapshot();
  await connection.close();
});
