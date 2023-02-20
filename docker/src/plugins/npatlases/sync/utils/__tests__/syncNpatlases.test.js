import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncNpatlases';
jest.setTimeout(300000);
test('syncNpatlases', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('npAtlases');
  const collectionEntry = await collection.find({ _id: 'NPA000001' }).limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
