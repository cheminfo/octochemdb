import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncNpatlases';

test(
  'syncNpatlases',
  async () => {
    const connection = new OctoChemConnection();
    const taxonomiesCollection = await connection.getCollection('taxonomies');
    while (true) {
      if ((await taxonomiesCollection.countDocuments()) === 20) {
        break;
      }
    }
    await sync(connection);
    const collection = await connection.getCollection('npAtlases');
    const collectionEntry = await collection
      .find({ _id: 'NPA000001' })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
      delete result.data.ocl.coordinates; // they change every time
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  },
  { timeout: 30000 },
);
