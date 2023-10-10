import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import { aggregate } from '../../aggregates/aggregate';

test('In silico fragmentation', async () => {
  const connection = new OctoChemConnection();
  const activesOrNaturalsCollection =
    await connection.getCollection('activesOrNaturals');

  while (true) {
    if ((await activesOrNaturalsCollection.countDocuments()) === 63) {
      break;
    }
  }

  await aggregate(connection);
  const collection = await connection.getCollection('inSilicoFragments_V2');
  const result = await collection.findOne({
    // @ts-ignore
    _id: 'fnc@r@JRUipPQFQQJQYKIQSPiLEUmSUUTu@A@@Zh}`NOta`ZfOacxX',
  });

  expect(result).toMatchSnapshot();
  await connection.close();
});
