import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncCoconuts';

test('syncCoconuts', async () => {
  const connection = new OctoChemConnection();
  const taxonomiesCollection = await connection.getCollection('taxonomies');
  while (true) {
    if ((await taxonomiesCollection.countDocuments()) === 20) {
      break;
    }
  }
  await sync(connection);
  const collection = await connection.getCollection('coconuts');
  const collectionEntry = await collection.find({ _id: 'CNP0330764' }).limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
    delete result.data.ocl.coordinates; // they change every time
  }
  expect(result).toMatchSnapshot();
  await connection.close();
});
