import { expect, test } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import stats from '../../../routes/v1/stats.js';

test('stats (bioassaysPubChem)', async () => {
  const connection = new OctoChemConnection();

  // Wait until the bioassaysPubChem collection has been populated by the sync test.
  while (true) {
    const collection = await connection.getCollection('bioassaysPubChem');
    if ((await collection.countDocuments()) > 0) {
      break;
    }
  }

  const result = await stats.handler();

  expect(result.data?.ns).toMatch(/bioassaysPubChem$/);
  expect(typeof result.data?.count).toBe('number');
  expect(result.data?.count).toBeGreaterThan(0);

  await connection.close();
});
