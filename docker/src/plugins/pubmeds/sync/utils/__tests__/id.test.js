import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/id.js';

test('id search (pubmeds)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('pubmeds');
    if ((await collection.countDocuments()) === 7) {
      break;
    }
  }
  const request = {
    query: {
      id: 19342308,
      fields: 'data',
    },
  };
  const results = await search.handler(request);

  // @ts-ignore
  expect(Object.keys(results.data.data)).toMatchInlineSnapshot(`
    [
      "dateCreated",
      "dateCompleted",
      "dateRevised",
      "article",
      "meshHeadings",
      "journalInfo",
      "compounds",
    ]
  `);
  expect(results.data).toMatchSnapshot();
});
