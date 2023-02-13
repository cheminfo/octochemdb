import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncPubmed';

jest.setTimeout(10000);
test('syncPubmed First Importation', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('pubmeds');
  const collectionEntry = await collection.find({ _id: 14248047 }).limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
test('syncPubmed Incremental Importation', async () => {
  const connection = new PubChemConnection();
  const collection = await connection.getCollection('pubmeds');
  const collectionEntryIncremental = await collection
    .find({ _id: 17200418 })
    .limit(1);
  const resultIncremental = await collectionEntryIncremental.next();
  expect(resultIncremental).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
