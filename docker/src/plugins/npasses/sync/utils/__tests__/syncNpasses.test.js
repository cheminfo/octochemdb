import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncNpasses';

test('syncNpasses', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('npasses');
  const collectionEntry = await collection.find({ _id: 'NPC10005' }).limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
}, 30000);
