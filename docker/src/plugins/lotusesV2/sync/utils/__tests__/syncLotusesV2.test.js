import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncLotusesV2';

test('syncLotusesV2', async () => {
  const connection = new OctoChemConnection();
  const taxonomiesCollection = await connection.getCollection('taxonomies');
  while (true) {
    if ((await taxonomiesCollection.countDocuments()) === 20) {
      break;
    }
  }
  await sync(connection);
  const collection = await connection.getCollection('lotusesV2');
  const collectionEntry = await collection
    .find({ _id: 'Q60235' })
    .limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
    delete result.data.ocl.coordinates;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
});
