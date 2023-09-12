import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('id search (gnps)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('gnps');
    if ((await collection.countDocuments()) === 2) {
      break;
    }
  }
  const request = {
    query: {
      ids: 'CCMSLIB00000001547',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "ocl",
      "spectrum",
      "mf",
      "em",
    ]
  `);
  // @ts-ignore
  delete results.data[0].data.ocl.coordinates;
  // @ts-ignore
  expect(results.data[0].data).toMatchSnapshot();
});
