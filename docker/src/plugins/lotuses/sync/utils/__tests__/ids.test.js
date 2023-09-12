import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('ids search (lotuses)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('lotuses');
    if ((await collection.countDocuments()) === 20) {
      break;
    }
  }
  const request = {
    query: {
      ids: 'LTS0256604, LTS0043466',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "ocl",
      "iupacName",
      "taxonomies",
    ]
  `);
  expect(results.data).toMatchSnapshot();
});
