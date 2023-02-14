import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncCoconuts';

//remove process.env.TEST from parseBioactivities to use this test

test('syncCoconuts', async () => {
  const connection = new PubChemConnection();
  const collections = await connection.getCollectionNames();
  while (collections.includes('taxonomies') === false) {
    delay(1000);
  }
  await sync(connection);
  const collection = await connection.getCollection('coconuts');
  const collectionEntry = await collection.find({ _id: 'CNP0330764' }).limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
