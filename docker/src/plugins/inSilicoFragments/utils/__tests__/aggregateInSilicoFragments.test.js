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
  const collection = await connection.getCollection('inSilicoFragments');
  const result = await collection.findOne({
    // @ts-ignore
    _id: 'fle@P@@XUGIEEMLhdecJBMzjjjjjj`@udcFLLqsBlZp{B\\Yq~dLqQq|L_C@',
  });

  expect(result).toMatchSnapshot();
  await connection.close();
});
