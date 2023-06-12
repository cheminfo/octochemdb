import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncNpasses';

test(
  'syncNpasses',
  async () => {
    const connection = new OctoChemConnection();
    const taxonomiesCollection = await connection.getCollection('taxonomies');
    while (true) {
      if ((await taxonomiesCollection.countDocuments()) === 20) {
        break;
      }
    }
    await sync(connection);
    const collection = await connection.getCollection('npasses');
    const collectionEntry = await collection
      .find({ _id: 'NPC100380' })
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
