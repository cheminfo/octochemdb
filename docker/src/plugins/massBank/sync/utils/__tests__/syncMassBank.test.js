import dotenv from 'dotenv';
import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncMassBank';

dotenv.config();
test(
  'syncMassBank',
  async () => {
    const connection = new OctoChemConnection();
    await sync(connection);
    const collection = await connection.getCollection('massBank');
    const collectionEntry = await collection
      .find({ _id: 'MSBNK-AAFC-AC000854' })
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
