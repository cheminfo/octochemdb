import 'dotenv/config';

import { PubChemConnection } from '../PubChemConnection';

test('connection to DB', async () => {
  const connection = new PubChemConnection();
  const medlines = await connection.getCollection('medlines');
  expect(medlines.namespace).toBe('octochemdb.medlines');
  connection.close();
});
