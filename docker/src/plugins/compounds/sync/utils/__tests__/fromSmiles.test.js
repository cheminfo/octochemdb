import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/fromSmiles.js';

test('smiles search (compounds)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('compounds');
    if ((await collection.countDocuments()) === 12) {
      break;
    }
  }

  const request = {
    query: {
      smiles: 'S2(N=C3(C=C(SC1(=CC=C(N)C=C1))C=CC3(=N2)))',
      stereo: true,
      limit: 10,
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
