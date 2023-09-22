import { describe, it, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import search from '../../routes/v1/search.js';

describe('search (inSilicoFragments)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('inSilicoFragments');
    if ((await collection.countDocuments()) === 9) {
      break;
    }
  }

  it('masses (inSilicoFragments)', async () => {
    const request = {
      query: {
        masses: '419.20,223.13',
        precision: 100,
        fields: 'data',
      },
    };
    const results = await search.handler(request);
    expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
      [
        "ocl",
        "masses",
      ]
    `);
    expect(results.data).toMatchSnapshot();
  });
});
