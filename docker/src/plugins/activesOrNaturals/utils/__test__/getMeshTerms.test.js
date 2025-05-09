import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import { getMeshTerms } from '../getMeshTerms.js';

test('getMeshTerms', async () => {
  const connection = new OctoChemConnection();
  const pubmedsCollection = await connection.getCollection('pubmeds');
  const activesOrNaturalsCollection =
    await connection.getCollection('activesOrNaturals');
  while (true) {
    if (
      (await activesOrNaturalsCollection.countDocuments()) === 74 &&
      (await pubmedsCollection.countDocuments()) === 7
    ) {
      break;
    }
  }
  const collection = await connection.getCollection('pubmeds');
  await collection.updateMany(
    {},
    {
      $set: {
        'data.compounds': [
          { $ref: 'compounds', $id: 19342306 },
          { $ref: 'compounds', $id: 19342308 },
        ],
      },
    },
  );
  let cids = [
    { $ref: 'compounds', $id: 19342306 },
    { $ref: 'compounds', $id: 19342308 },
  ];

  let result = await getMeshTerms(cids, collection, connection);

  expect(result).toMatchSnapshot();
  await connection.close();
});
