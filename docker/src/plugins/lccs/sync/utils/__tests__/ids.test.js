import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('id search (lccs)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('lccs');
    if ((await collection.countDocuments()) === 4) {
      break;
    }
  }
  const request = {
    query: {
      ids: '2,8',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[1].data)).toMatchInlineSnapshot(`
    [
      "description",
      "pictograms",
      "hCodesDescription",
      "pCodesDescription",
      "signals",
    ]
  `);
  expect(results.data).toMatchSnapshot();
});
