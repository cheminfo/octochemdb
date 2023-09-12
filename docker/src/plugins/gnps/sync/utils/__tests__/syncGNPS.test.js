import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../../utils/OctoChemConnection.js';
import { sync } from '../../syncGNPs';

test('syncGNPs', async () => {
  const connection = new OctoChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('gnps');
  const collectionEntry = await collection
    .find({ _id: 'CCMSLIB00000001547' })
    .limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
    delete result.data.ocl.coordinates; // they change every time
  }
  expect(result).toMatchSnapshot();
  const emptySmilesEntry = await collection
    .find({ _id: 'CCMSLIB00000001548' })
    .limit(1);
  const emptySmiles = await emptySmilesEntry.next();
  // expect(bronzeSpectrum) to be null
  if (emptySmiles?._seq) {
    delete emptySmiles._seq;
    delete emptySmiles.data.ocl.coordinates;
  }
  expect(emptySmiles).toMatchSnapshot();
  await connection.close();
});
