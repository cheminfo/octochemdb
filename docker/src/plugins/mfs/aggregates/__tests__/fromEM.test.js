import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import search from '../../routes/v1/fromEM.js';

test('id search (compounds)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('mfs');
    if ((await collection.countDocuments()) === 5) {
      break;
    }
  }
  const request = {
    query: {
      em: '1366.87,259.023',
      minCount: 1,
      precision: 100,
      limit: 100,
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "em",
      "atoms",
      "unsaturation",
      "count",
    ]
  `);
  expect(results.data).toMatchSnapshot();
  await connection.close();
});
