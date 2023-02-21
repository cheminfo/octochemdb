import delay from 'delay';
import { test, expect } from 'vitest';

import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncCoconuts';

test('syncCoconuts', async () => {
  const connection = new PubChemConnection();
  let colllectionList = await connection.getCollectionNames();
  while (!colllectionList.includes('taxonomies')) {
    await delay(1000);
    colllectionList = await connection.getCollectionNames();
  }
  await sync(connection);
  const collection = await connection.getCollection('coconuts');
  const collectionEntry = await collection.find({ _id: 'CNP0330764' }).limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
}, 30000);
