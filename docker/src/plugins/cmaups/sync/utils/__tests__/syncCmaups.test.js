import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncCmaups';

//remove process.env.TEST from parseBioactivities to use this test

test('syncCmaups', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('cmaups');
  const collectionEntry = await collection.find({ _id: 'NPC146355' }).limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
