import 'dotenv/config';

import { PubChemConnection } from '../PubChemConnection';

test('connection to DB', async () => {
  const connection = new PubChemConnection();
  const medlines = await connection.getCollection('compounds');
  expect(medlines.namespace).toBe('octochemdb.compounds');
  if (connection) {
    await connection.close();
  }
});
