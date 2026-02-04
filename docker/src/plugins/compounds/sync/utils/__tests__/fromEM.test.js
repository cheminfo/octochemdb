import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/fromEM.js';

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
      em: 1366.87,
      precision: 100,
      limit: 1000,
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
  if (results?.data) {
    for (const entry of results.data) {
      delete entry.data.ocl.coordinates;
    }
  }
  expect(results.data).toMatchSnapshot();
  await connection.close();
});
