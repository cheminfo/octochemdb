import delay from 'delay';

import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncBioassays';
jest.setTimeout(300000);

test('syncBioassays', async () => {
  const connection = new PubChemConnection();
  const collections = await connection.getCollectionNames();
  while (
    collections.includes('taxonomies') === false ||
    collections.includes('compounds') === false
  ) {
    await delay(1000);
  }
  await sync(connection);
  const collection = await connection.getCollection('bioassays');
  const collectionEntry = await collection.find({ _id: '59478_1' }).limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
