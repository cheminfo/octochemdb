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
        keywords: 'Production,technology',
        minScore: 0,
        fields: 'data',
        limit: 1000,
      },
    };
    const results = await search.handler(request);
    const oneEntryResult = results.data?.filter(
      (entry) => entry._id === 'JP-2005008850-A',
    );
    // @ts-ignore
    expect(Object.keys(oneEntryResult[0].data)).toMatchInlineSnapshot(`
      [
        "title",
        "nbCompounds",
      ]
    `);
    // @ts-ignore
    expect(oneEntryResult[0].score).toBeGreaterThan(4);
  });
  await connection.close();
});
