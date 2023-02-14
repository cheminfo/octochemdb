import delay from 'delay';

import { PubChemConnection } from '../../../../utils/PubChemConnection.js';
import { aggregate } from '../aggregateActiveAgainst';

jest.setTimeout(10000);
test('Aggregation activeAgainst', async () => {
  const connection = new PubChemConnection();
  const collections = await connection.getCollectionNames();
  while (collections.includes('activesOrNaturals') === false) {
    delay(1000);
  }
  await aggregate(connection);
  const collection = await connection.getCollection('activeAgainst');
  const collectionEntry = await collection
    .find({
      _id: 'ArchaeakingdomCandidatus BorrarchaeotaCandidatus Borrarchaeia',
    })
    .limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
