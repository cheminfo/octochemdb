import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncCmaups';

test('syncCmaups', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('cmaups');
  const collectionEntry = await collection.find({ _id: 'NPC146355' }).limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
}, 30000);
