import { test, expect } from 'vitest';

import { PubChemConnection } from '../../../../utils/PubChemConnection.js';
import { aggregate } from '../aggregateActiveAgainst';

test('Aggregation activeAgainst', async () => {
  const connection = new PubChemConnection();
  await aggregate(connection);
  const collection = await connection.getCollection('activeAgainst');
  const collectionEntry = await collection
    .find({
      _id: 'ArchaeakingdomCandidatus BorrarchaeotaCandidatus Borrarchaeia',
    })
    .limit(1);
  const result = await collectionEntry.next();
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
}, 30000);
