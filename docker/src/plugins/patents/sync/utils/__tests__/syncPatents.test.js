import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncPatents';

test(
  'syncPatents',
  async () => {
    const connection = new OctoChemConnection();
    await sync(connection);
    const collection = await connection.getCollection('patents');
    const collectionEntry = await collection
      .find({ _id: 'US-10334499-B2' })
      .limit(1);
    const result = await collectionEntry.next();

    expect(result).toMatchSnapshot();
    await connection.close();
  },
  { timeout: 300000 },
);
