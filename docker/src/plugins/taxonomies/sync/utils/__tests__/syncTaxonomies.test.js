import { test, expect } from 'vitest';

import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncTaxonomies';

test('syncTaxonomies', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('taxonomies');
  const collectionEntry = await collection.find({ _id: 2798939 }).limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  await connection.close();
  expect(result).toMatchSnapshot();
});
