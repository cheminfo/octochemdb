import { PubChemConnection } from '../../../../utils/PubChemConnection.js';
import { aggregate } from '../../aggregates/aggregateActivesOrNaturals';

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
  if (result?._seq) {
    delete result._seq;
  }
  expect(result).toMatchSnapshot();
  await connection.close();
}, 300000);
