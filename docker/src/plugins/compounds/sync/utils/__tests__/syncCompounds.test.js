import { test, expect } from 'vitest';

import { PubChemConnection } from '../../../../../utils/PubChemConnection.js';
import { sync } from '../../syncCompounds';

test('syncCompounds First Importation', async () => {
  const connection = new PubChemConnection();
  await sync(connection);
  const collection = await connection.getCollection('compounds');
  const collectionEntry = await collection.find({ _id: 59478 }).limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
});
test('syncCompounds Incremental Importation', async () => {
  const connection = new PubChemConnection();
  const collection = await connection.getCollection('compounds');
  const collectionEntryIncremental = await collection
    .find({ _id: 160056959 })
    .limit(1);
  const resultIncremental = await collectionEntryIncremental.next();
  if (resultIncremental?._seq) {
    delete resultIncremental._seq;
  }
  expect(resultIncremental).toMatchSnapshot();
  await connection.close();
}, 10000);
