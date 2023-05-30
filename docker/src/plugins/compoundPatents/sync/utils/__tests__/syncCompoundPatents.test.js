import delay from 'delay';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncCompoundPatents';

test('synCompoundPatents', async () => {
  const connection = new OctoChemConnection();
  let colllectionList = await connection.getCollectionNames();
  while (!colllectionList.includes('patents')) {
    await delay(1000);
    colllectionList = await connection.getCollectionNames();
  }
  await sync(connection);
  const collection = await connection.getCollection('compoundPatents');
  const collectionEntry = await collection.find({ _id: 59478 }).limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
}, 100000);
