import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('ids search (npAtlases)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('npAtlases');
    if ((await collection.countDocuments()) === 3) {
      break;
    }
  }
  const request = {
    query: {
      ids: 'NPA000001, NPA000003',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "ocl",
      "taxonomies",
      "iupacName",
    ]
  `);
  // @ts-ignore
  delete results.data[0].data.ocl.coordinates;
  // @ts-ignore
  expect(results.data[0].data).toMatchSnapshot();
  await connection.close();
});
