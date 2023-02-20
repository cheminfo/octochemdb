import delay from 'delay';

import { PubChemConnection } from '../../../../utils/PubChemConnection.js';
import { aggregate } from '../aggregateCommonMFs';

jest.setTimeout(10000);
test('Aggregation mfsCommon', async () => {
  const connection = new PubChemConnection();
  const collections = await connection.getCollectionNames();
  while (collections.includes('compounds') === false) {
    await delay(1000);
  }
  await aggregate(connection);
  const collection = await connection.getCollection('mfsCommon');
  const collectionEntry = await collection
    .find({
      _id: 'C100H130O15',
    })
    .limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
