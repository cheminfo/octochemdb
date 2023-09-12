import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import search from '../../../routes/v1/ids.js';

test('id search (coconuts)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('coconuts');
    if ((await collection.countDocuments()) === 9) {
      break;
    }
  }
  const request = {
    query: {
      ids: 'CNP0436856,CNP0115481',
      fields: 'data',
    },
  };
  const results = await search.handler(request);
  // @ts-ignore
  expect(Object.keys(results.data[0].data)).toMatchInlineSnapshot(`
    [
      "ocl",
      "iupacName",
    ]
  `);
  expect(results.data).toMatchSnapshot();
});
