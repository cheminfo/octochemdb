import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncTitleCompounds.js';

test('syncTitleCompounds', async () => {
  const connection = new OctoChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('titleCompounds');
  const collectionEntry = await collection.find({ _id: 8366 }).limit(1);
  const result = await collectionEntry.next();
  expect(result?.data.title).toMatchInlineSnapshot('"Etryptamine acetate"');
  await connection.close();
});
