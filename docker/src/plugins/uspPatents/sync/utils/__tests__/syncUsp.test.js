import { describe, it, expect } from 'vitest';

import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncUsp';

describe('USP Patents', () => {
  it('syncUsp', async () => {
    const connection = new PubChemConnection();

    await sync(connection);
    const collection = await connection.getCollection('uspPatents');
    const collectionEntry = await collection
      .find({ _id: 'US-20230012473-A1' })
      .limit(1);
    const result = await collectionEntry.next();
    if (result?._seq) {
      delete result._seq;
    }
    expect(result).toMatchSnapshot();
    await connection.close();
  });
}, 30000);