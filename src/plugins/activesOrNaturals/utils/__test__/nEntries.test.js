import { expect, test } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import nEntries from '../../routes/v1/nEntries.js';

test('nEntires (activesOrNaturals)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const activeOrNaturalsCollection =
      await connection.getCollection('activesOrNaturals');
    if ((await activeOrNaturalsCollection.countDocuments()) === 70) {
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
  if (!('data' in results)) throw new Error('Expected data in results');
  const /** @type {any} */ data = results.data;

  expect(data).toHaveLength(4);
  expect(data[1].data.em).toBeGreaterThan(0);
  expect(data[2]._id).toBeDefined();

  await connection.close();
});
