import { describe, it, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/search.js';

describe('search (patents)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('patents');
    if ((await collection.countDocuments()) === 255) {
      break;
    }
  }
  it('keywords (patents)', async () => {
    const request = {
      query: {
        patentsIDs: '',
        keywords: 'trifluoropropyl',
        minScore: 5,
        fields: 'data',
        limit: 1,
      },
    };
    const results = await search.handler(request);

    // @ts-ignore
    expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
      [
        "title",
        "nbCompounds",
      ]
    `);
    expect(results.data).toMatchSnapshot();
  });
});
