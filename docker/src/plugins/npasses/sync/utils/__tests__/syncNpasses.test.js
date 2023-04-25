import delay from 'delay';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncNpasses';

test(
  'syncNpasses',
  async () => {
    const connection = new OctoChemConnection();
    let colllectionList = await connection.getCollectionNames();
    while (!colllectionList.includes('taxonomies')) {
      await delay(1000);
      colllectionList = await connection.getCollectionNames();
    }
    await sync(connection);
    const collection = await connection.getCollection('npasses');
    const collectionEntry = await collection.find({ _id: 'NPC10005' }).limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  },
  { timeout: 30000 },
);
