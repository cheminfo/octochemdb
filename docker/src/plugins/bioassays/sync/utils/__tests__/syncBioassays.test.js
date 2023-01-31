import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncBioassays';

//remove process.env.TEST from parseBioactivities to use this test

test('syncBioassays', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('bioassays');
  const collectionEntry = await collection.find({ _id: '59478_1' }).limit(1);
  const result = await collectionEntry.next();
  expect(result).toStrictEqual({});
  if (connection) {
    await connection.close();
  }
});
