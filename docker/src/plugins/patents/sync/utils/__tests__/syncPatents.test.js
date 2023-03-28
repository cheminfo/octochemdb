import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncPatents';

test('syncPatents', async () => {
  const connection = new OctoChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('patents');
  const collectionEntry = await collection.find({ _id: 59478 }).limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
}, 300000);
