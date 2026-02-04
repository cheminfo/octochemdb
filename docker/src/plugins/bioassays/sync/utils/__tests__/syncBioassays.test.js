import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncBioassays';

test('syncBioassays', async () => {
  const connection = new OctoChemConnection();

  const compoundsCollection = await connection.getCollection('compounds');
  const taxonomiesCollection = await connection.getCollection('taxonomies');
  while (true) {
    if (
      (await compoundsCollection.countDocuments()) === 12 &&
      (await taxonomiesCollection.countDocuments()) === 20
    ) {
      break;
    }
  }
  await sync(connection);
  const collection = await connection.getCollection('bioassays');
  const collectionEntry = await collection.find({ _id: '59478_1' }).limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  if (result) {
    delete result.data.ocl.coordinates;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
});
