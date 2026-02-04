import { test, expect } from 'vitest';

import { OctoChemConnection } from '../../../../utils/OctoChemConnection.js';
import entriesFromID from '../../routes/v1/id.js';

test('id search (activesOrNaturals)', async () => {
  const connection = new OctoChemConnection();

  while (true) {
    const activeOrNaturalsCollection =
      await connection.getCollection('activesOrNaturals');
    if ((await activeOrNaturalsCollection.countDocuments()) === 68) {
      break;
    }
  }
  const request = {
    query: {
      id: 'fhiAP@@Xe[vRJJFYIJJDYxMUUUUUP@ZzQcFBXiafNXecVCXm`NOtQfJvOacxZuSGpq|L',
      fields: 'data',
    },
  };
  const results = await entriesFromID.handler(request);
  expect(results.data).toMatchSnapshot();
  await connection.close();
});
