import { test, expect } from 'vitest';

import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncBioassays';

test('syncBioassays', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('bioassays');
  const collectionEntry = await collection.find({ _id: '59478_1' }).limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
}, 300000);
