import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import { aggregate } from '../../aggregates/aggregate';

test('In silico fragmentation', async () => {
  const connection = new OctoChemConnection();
  const activesOrNaturalsCollection =
    await connection.getCollection('activesOrNaturals');

  while (true) {
    if ((await activesOrNaturalsCollection.countDocuments()) === 74) {
      break;
    }
  }

  await aggregate(connection);
  const collection = await connection.getCollection('inSilicoFragments');
  const result = await collection.findOne({
    _id: {
      noStereoTautomerID:
        'fnc@r@JRUipPQFQQJQYKIQSPiLEUmSUUTu@A@@Zh}`NOta`ZfOacxX',
      mode: 'positive',
      ionization: 'esi',
    },
  });

  expect(result).toMatchSnapshot();
  await connection.close();
}, 100000);
