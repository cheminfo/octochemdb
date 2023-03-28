import { describe, it, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncSubstances';

describe('syncSubstances', () => {
  it('syncSubstances First Importation', async () => {
    const connection = new OctoChemConnection();

    await sync(connection);
    const collection = await connection.getCollection('substances');
    const collectionEntry = await collection.find({ _id: 56427212 }).limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  }, 30000);
  it('syncSubstances Incremental Importation', async () => {
    const connection = new OctoChemConnection();
    const collection = await connection.getCollection('substances');
    const collectionEntryIncremental = await collection
      .find({ _id: 475724937 })
      .limit(1);
    const resultIncremental = await collectionEntryIncremental.next();
    if (resultIncremental?._seq) {
      delete resultIncremental._seq;
    }
    expect(resultIncremental).toMatchSnapshot();
    await connection.close();
  });
}, 30000);
