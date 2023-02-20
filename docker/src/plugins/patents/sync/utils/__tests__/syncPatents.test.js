import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncPatents';

jest.setTimeout(300000);
test('syncPatents', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('patents');
  const collectionEntry = await collection.find({ _id: 5426 }).limit(1);
  const result = await collectionEntry.next();
  // remove seq number
  delete result._seq;
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
