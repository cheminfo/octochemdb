import delay from 'delay';
import { test, expect } from 'vitest';

import { PubChemConnection } from '../../../../utils/PubChemConnection.js';
import { aggregate } from '../aggregateMFs';

test('Aggregation mfs', async () => {
  const connection = new PubChemConnection();
  let colllectionList = await connection.getCollectionNames();
  while (
    !colllectionList.includes('activesOrNaturals') &&
    !colllectionList.includes('compounds')
  ) {
    await delay(1000);
    colllectionList = await connection.getCollectionNames();
  }
  await aggregate(connection);
  const collection = await connection.getCollection('mfs');
  const collectionEntry = await collection
    .find({
      _id: 'C12H9N3S2',
    })
    .limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
}, 30000000);
