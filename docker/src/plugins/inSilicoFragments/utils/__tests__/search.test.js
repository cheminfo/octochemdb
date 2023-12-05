import { describe, it, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import search from '../../routes/v1/search.js';

describe('search (inSilicoFragments)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('inSilicoFragments');
    if ((await collection.countDocuments()) === 6) {
      break;
    }
  }

  it('masses (inSilicoFragments)', async () => {
    const request = {
      query: {
        masses: '379.03,244.99,307.01',
        precision: 100,
        fields: 'data',
      },
    };
    const results = await search.handler(request);
    expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
      [
        "ocl",
        "spectrum",
        "mf",
        "em",
        "fragmentationDbHash",
      ]
    `);
    expect(results.data).toMatchSnapshot();
  });
});
