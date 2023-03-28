import { describe, it, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncUsp';

describe('USP Patents', () => {
  it('syncUsp', async () => {
    const connection = new OctoChemConnection();

    await sync(connection);
    const collection = await connection.getCollection('uspPatents');
    const collectionEntry = await collection
      .find({ _id: 'US20230012473A1' })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
}, 30000);
