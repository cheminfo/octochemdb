import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('id search (compounds)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('compounds');
    if ((await collection.countDocuments()) === 12) {
      break;
    }
  }
  const request = {
    query: {
      ids: '102468618, 102126174',
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
      "atoms",
      "unsaturation",
      "inchi",
      "inchiKey",
      "iupac",
      "molfile",
    ]
  `);
  expect(results.data).toMatchSnapshot();
  await connection.close();
});
