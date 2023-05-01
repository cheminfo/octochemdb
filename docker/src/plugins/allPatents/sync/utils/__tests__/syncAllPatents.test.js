import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncAllPatents';

test(
  'allPatents',
  async () => {
    const connection = new OctoChemConnection();
    await sync(connection);
    const collection = await connection.getCollection('allPatents');
    const collectionEntry = await collection
      .find({ _id: 'JP2009128093A' })
      .limit(1);
    const result = await collectionEntry.next();

    expect(result).toMatchSnapshot();
    await connection.close();
  },
  { timeout: 300000 },
);
