import { PubChemConnection } from '../../../../utils/PubChemConnection.js';
import { aggregate } from '../aggregateActiveAgainst';

jest.setTimeout(10000);
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
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
