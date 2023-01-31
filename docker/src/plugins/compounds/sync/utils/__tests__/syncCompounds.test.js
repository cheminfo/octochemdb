import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncCompounds';

test('syncCompounds First Importation', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('compounds');
  const collectionEntry = await collection.find({ _id: 59478 }).limit(1);
  const result = await collectionEntry.next();
  console.log(result);
  expect(result).toStrictEqual();
  if (connection) {
    await connection.close();
  }
});
test('synCompounds incremental importation', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('compounds');
  const collectionEntry = await collection.find({ _id: 160056959 }).limit(1);
  const result = await collectionEntry.next();
  expect(result).toStrictEqual();
  if (connection) {
    await connection.close();
  }
});
