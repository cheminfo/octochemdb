import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncPubmed';

test(
  'syncPubmed First Importation',
  async () => {
    const connection = new OctoChemConnection();

    await sync(connection);
    const collection = await connection.getCollection('pubmeds');
    const collectionEntry = await collection.find({ _id: 14248047 }).limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  },
  { timeout: 30000 },
);
test(
  'syncPubmed Incremental Importation',
  async () => {
    const connection = new OctoChemConnection();

    const collection = await connection.getCollection('pubmeds');
    const collectionEntryIncremental = await collection
      .find({ _id: 17200418 })
      .limit(1);
    const resultIncremental = await collectionEntryIncremental.next();
    if (resultIncremental?._seq) {
      delete resultIncremental._seq;
    }
    expect(resultIncremental).toMatchSnapshot();
    await connection.close();
  },
  { timeout: 30000 },
);
