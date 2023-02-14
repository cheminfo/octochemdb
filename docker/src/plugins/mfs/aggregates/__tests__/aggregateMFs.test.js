import { PubChemConnection } from '../../../../utils/PubChemConnection.js';
import { aggregate } from '../aggregateMFs';

jest.setTimeout(10000);
test('Aggregation mfs', async () => {
  const connection = new PubChemConnection();
  const collections = await connection.getCollectionNames();
  while (collections.includes('compounds') === false) {
    delay(1000);
  }
  await aggregate(connection);
  const collection = await connection.getCollection('mfs');
  const collectionEntry = await collection
    .find({
      _id: 'C12H9N3S2',
    })
    .limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
