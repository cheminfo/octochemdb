import 'dotenv/config';

import { PubChemConnection } from '../../../../utils/PubChemConnection.js';

test('getPubMedsCounter', async () => {
  const connection = new PubChemConnection();

  const collection = await connection.getCollection('pubmeds');
  const nbPubmeds = await collection.countDocuments({ 'data.cids': 5904 });
  expect(nbPubmeds).toBe(10006);
}, 5000);
