import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../utils/OctoChemConnection.js';
import search from '../routes/v1/info.js';

test('collections info ', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const collection = await connection.getCollection('activeAgainst');
    if ((await collection.countDocuments()) === 1) {
      break;
    }
  }

  const results = await search.handler();
  const oneEntry = results.data[0];
  oneEntry.date = 0;
  expect(oneEntry).toMatchSnapshot();
});
