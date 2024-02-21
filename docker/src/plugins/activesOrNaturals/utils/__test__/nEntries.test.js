import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import nEntries from '../../routes/v1/nEntries.js';

test('nEntires (activesOrNaturals)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const activeOrNaturalsCollection =
      await connection.getCollection('activesOrNaturals');
    if ((await activeOrNaturalsCollection.countDocuments()) === 63) {
      break;
    }
  }
  const request = {
    query: {
      n: 4,
      k: 2,
      fields: 'data.em',
    },
  };
  const results = await nEntries.handler(request);
  expect(results.data.length).toBe(4);
  expect(results.data[0].data.em).toBeGreaterThan(0);
  expect(results.data[1]._id).toBeDefined();
});
