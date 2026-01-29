import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import { aggregate } from '../aggregateCommonMFs';

test('Aggregation mfsCommon', async () => {
  const connection = new OctoChemConnection();
  const compoundsCollection = await connection.getCollection('compounds');
  const activesOrNaturalsCollection =
    await connection.getCollection('activesOrNaturals');
  while (true) {
    if (
      (await compoundsCollection.countDocuments()) === 12 &&
      (await activesOrNaturalsCollection.countDocuments()) === 68
    ) {
      break;
    }
  }
  await aggregate(connection);
  const collection = await connection.getCollection('mfsCommon');
  const collectionEntry = await collection
    .find({
      _id: 'C100H110N4',
    })
    .limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
});
