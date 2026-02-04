import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('ids search (pubmeds)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('pubmeds');
    if ((await collection.countDocuments()) === 7) {
      break;
    }
  }
  const request = {
    query: {
      ids: '19342308, 17200418',
      fields: 'data',
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
  expect(results.data).toMatchSnapshot();
  await connection.close();
});
