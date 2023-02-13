import { PubChemConnection } from '../../../../utils/PubChemConnection.js';
import { aggregate } from '../aggregateCHNOSClF';

jest.setTimeout(10000);
test('Aggregation mfsCHNOSClF', async () => {
  const connection = new PubChemConnection();
  await aggregate(connection);
  const collection = await connection.getCollection('mfsCHNOSClF');
  const collectionEntry = await collection
    .find({
      _id: '',
    })
    .limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
