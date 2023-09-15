import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncCompoundPatents.js';

test('synCompoundPatents', async () => {
  const connection = new OctoChemConnection();
  const patentsCollection = await connection.getCollection('patents');
  while (true) {
    if ((await patentsCollection.countDocuments()) === 255) {
      break;
    }
  }
  await sync(connection);
  const collection = await connection.getCollection('compoundPatents');
  const collectionEntry = await collection.find({ _id: 1 }).limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
});
