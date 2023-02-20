import delay from 'delay';

import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncNpasses';

jest.setTimeout(300000);
test('syncNpasses', async () => {
  const connection = new PubChemConnection();
  const collections = await connection.getCollectionNames();
  while (collections.includes('taxonomies') === false) {
    await delay(1000);
  }
  await sync(connection);
  const collection = await connection.getCollection('npasses');
  const collectionEntry = await collection.find({ _id: 'NPC10005' }).limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
