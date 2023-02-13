import { PubChemConnection } from '../../../../utils/PubChemConnection.js';
import { aggregate } from '../../aggregates/aggregateActivesOrNaturals';

jest.setTimeout(10000);
test('Aggregation ActivesOrNaturals', async () => {
  const connection = new PubChemConnection();
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
