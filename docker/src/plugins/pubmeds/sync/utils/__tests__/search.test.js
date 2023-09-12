import { describe, it, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/search.js';

describe('search (pubmeds)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('pubmeds');
    if ((await collection.countDocuments()) === 7) {
      break;
    }
  }
  it('keywords (pubmeds)', async () => {
    const request = {
      query: {
        ids: '',
        keywords: 'Conjugated',
        minScore: 1,
        fields: 'data',
        limit: 1,
      },
    };
    const results = await search.handler(request);
    // @ts-ignore
    expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
      [
        "dateCreated",
        "dateCompleted",
        "dateRevised",
        "article",
        "chemicals",
        "meshHeadings",
        "journalInfo",
        "compounds",
      ]
    `);
    // @ts-ignore
    expect(results.data[0].score).toBeGreaterThan(1);
  });
});
