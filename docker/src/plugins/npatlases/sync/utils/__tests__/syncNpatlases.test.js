import delay from 'delay';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncNpatlases';

test('syncNpatlases', async () => {
  const connection = new OctoChemConnection();
  let colllectionList = await connection.getCollectionNames();
  while (!colllectionList.includes('taxonomies')) {
    await delay(1000);
    colllectionList = await connection.getCollectionNames();
  }
  await sync(connection);
  const collection = await connection.getCollection('npAtlases');
  const collectionEntry = await collection.find({ _id: 'NPA000001' }).limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
}, 30000);
