import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncGNPs';

test('syncGNPs', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('gnps');
  const collectionEntry = await collection
    .find({ _id: 'CCMSLIB00000001547' })
    .limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();

  if (connection) {
    await connection.close();
  }
});
