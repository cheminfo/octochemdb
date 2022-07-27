import 'dotenv/config';

import { PubChemConnection } from '../../../../utils/PubChemConnection.js';

test('syncTaxonomies', async () => {
  const connection = new PubChemConnection();

  const collection = await connection.getCollection('pubmeds');
  const nbPubmeds = await collection.find({ 'data.cids': 5904 }).count();
  expect(nbPubmeds).toBe(10006);
}, 5000);
