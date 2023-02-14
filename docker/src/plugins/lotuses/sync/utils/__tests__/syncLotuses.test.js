import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncLotuses';

test('syncLotuses', async () => {
  const connection = new PubChemConnection();
  const collections = await connection.getCollectionNames();
  while (collections.includes('taxonomies') === false) {
    delay(1000);
  }
  await sync(connection);
  const collection = await connection.getCollection('lotuses');
  const collectionEntry = await collection.find({ _id: 'LTS0257199' }).limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
