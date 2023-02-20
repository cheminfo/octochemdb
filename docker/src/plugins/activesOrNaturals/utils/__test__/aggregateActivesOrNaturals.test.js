import delay from 'delay';

import { PubChemConnection } from '../../../../utils/PubChemConnection.js';
import { aggregate } from '../../aggregates/aggregateActivesOrNaturals';

jest.setTimeout(300000);
test('Aggregation ActivesOrNaturals', async () => {
  const connection = new PubChemConnection();
  const collections = await connection.getCollectionNames();
  while (
    collections.includes('lotuses') === false ||
    collections.includes('taxonomies') === false ||
    collections.includes('npasses') === false ||
    collections.includes('npAtlases') === false ||
    collections.includes('cmaups') === false ||
    collections.includes('coconuts') === false ||
    collections.includes('bioassays') === false ||
    collections.includes('gnps') === false ||
    collections.includes('compounds') === false
  ) {
    await delay(1000);
  }
  await aggregate(connection);
  const collection = await connection.getCollection('activesOrNaturals');
  const collectionEntry = await collection
    .find({
      _id: 'ekTpA@@@LAEMGLn\\dTTRbRfLbteRrRTfbqbtRthdRjZFFfNnAQjjjjjjjfjjjjjijjh@@',
    })
    .limit(1);
  const result = await collectionEntry.next();
  expect(result).toMatchSnapshot();
  if (connection) {
    await connection.close();
  }
});
