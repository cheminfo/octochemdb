import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncSubstances';
// increase timeout to 6s
jest.setTimeout(20000);
test('syncSubstances First Importation', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('substances');
  const collectionEntry = await collection.find({ _id: 56427212 }).limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
test('syncSubstances Incremental Importation', async () => {
  const connection = new PubChemConnection();
  const collection = await connection.getCollection('substances');
  const collectionEntryIncremental = await collection
    .find({ _id: 56435292 })
    .limit(1);
  const resultIncremental = await collectionEntryIncremental.next();
  expect(resultIncremental).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
